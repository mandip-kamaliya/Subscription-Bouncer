import express from 'express';
import { PinionClient, payX402Service } from 'pinion-os';

/**
 * Configuration interface for Subscription Bouncer middleware
 */
export interface MiddlewareConfig {
  price: number;
  wallet: string;
  privateKey: string;
  network?: string; // default: "base-sepolia"
}

/**
 * Creates Express middleware that implements x402 payment gate for direct integration
 * @param config - Middleware configuration
 * @returns Express middleware function
 */
export function subscriptionBouncer(config: MiddlewareConfig): express.RequestHandler {
  // Validate configuration
  if (config.price <= 0) {
    throw new Error('Price must be greater than 0');
  }
  
  if (!config.wallet || !config.wallet.startsWith('0x')) {
    throw new Error('Valid wallet address is required (must start with 0x)');
  }

  if (!config.privateKey || !config.privateKey.startsWith('0x')) {
    throw new Error('Valid private key is required (must start with 0x)');
  }

  const network = config.network || 'base-sepolia';

  // Initialize PinionOS client
  let pinionClient: PinionClient;
  
  try {
    pinionClient = new PinionClient({
      privateKey: config.privateKey,
      network: network
    });
    
  } catch (error) {
    console.error('Failed to initialize PinionOS client:', error);
    throw new Error('Payment system initialization failed');
  }

  // Return the middleware function
  return async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
    try {
      const paymentHeader = req.headers['x-payment'] as string;

      // CASE 1: No X-PAYMENT header - return 402 with payment instructions
      if (!paymentHeader) {
        res.status(402).json({
          error: 'Payment required',
          price: `${config.price} USDC`,
          wallet: config.wallet,
          network: network,
          instructions: 'Include X-PAYMENT header with signed x402 payment to access this API'
        });
        return;
      }

      // CASE 2: X-PAYMENT header exists - verify the payment
      try {
        // Verify the x402 payment using real PinionOS payX402Service
        const verification = await payX402Service(
          config.wallet as any, // Cast to Wallet type
          req.protocol + '://' + req.get('host') + req.originalUrl,
          {
            method: req.method,
            headers: {
              'X-PAYMENT': paymentHeader
            } as Record<string, string>
          }
        );

        // Check if payment was successful (status should indicate success)
        const paidAmount = parseFloat(verification.paidAmount || '0');
        if (String(verification.status) === 'success' || paidAmount >= config.price) {
          console.log(`✅ Payment verified: ${paidAmount} USDC paid for ${req.method} ${req.path}`);
          
          // Add payment verification headers to the request
          req.headers['x-payment-verified'] = 'true';
          req.headers['x-paid-amount'] = paidAmount.toString();
          req.headers['x-response-time'] = verification.responseTimeMs?.toString() || '';
          req.headers['x-wallet'] = config.wallet;
          
          // Payment valid - continue to the next middleware/route handler
          next();
          return;
        }

        // If verification fails, return 403
        res.status(403).json({
          error: 'Payment verification failed',
          message: `Insufficient payment. Required: ${config.price} USDC, Paid: ${paidAmount} USDC`,
          price: `${config.price} USDC`,
          wallet: config.wallet,
          network: network,
          verificationStatus: verification.status
        });

      } catch (verificationError) {
        console.error('Payment verification error:', verificationError);
        
        // Return 403 for verification errors
        res.status(403).json({
          error: 'Payment verification error',
          message: verificationError instanceof Error ? verificationError.message : 'Unknown verification error',
          price: `${config.price} USDC`,
          wallet: config.wallet,
          network: network
        });
      }

    } catch (middlewareError) {
      console.error('Payment middleware error:', middlewareError);
      
      // Return 500 for unexpected errors
      res.status(500).json({
        error: 'Internal server error',
        message: 'Payment processing failed'
      });
    }
  };
}
