import express from 'express';
import { PinionClient, payX402Service } from 'pinion-os';

/**
 * Creates Express middleware that implements x402 payment gate
 * @param price - Price per request in USDC (e.g., 0.01)
 * @param walletAddress - Wallet address to receive payments
 * @returns Express middleware function
 */
export function paymentGate(price: number, walletAddress: string): express.RequestHandler {
  // Validate parameters
  if (price <= 0) {
    throw new Error('Price must be greater than 0');
  }
  
  if (!walletAddress || !walletAddress.startsWith('0x')) {
    throw new Error('Valid wallet address is required');
  }

  // Initialize PinionOS client
  let pinionClient: PinionClient;
  
  try {
    if (!process.env.PINION_PRIVATE_KEY) {
      throw new Error('PINION_PRIVATE_KEY environment variable is required');
    }
    
    pinionClient = new PinionClient({
      privateKey: process.env.PINION_PRIVATE_KEY,
      network: 'base-sepolia' // Use Base Sepolia testnet
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
          price: `${price} USDC`,
          wallet: walletAddress,
          instructions: 'Include X-PAYMENT header with signed x402 payment to access this API'
        });
        return;
      }

      // CASE 2: X-PAYMENT header exists - verify the payment
      try {
        // Verify the x402 payment using real PinionOS payX402Service
        // Signature: payX402Service(wallet, url, options = {})
        const verification = await payX402Service(
          walletAddress as any, // Cast to Wallet type
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
        if (String(verification.status) === 'success' || paidAmount >= price) {
          console.log(`✅ Payment verified: ${paidAmount} USDC paid`);
          
          // Add payment verification headers to the request
          req.headers['x-payment-verified'] = 'true';
          req.headers['x-paid-amount'] = paidAmount.toString();
          req.headers['x-response-time'] = verification.responseTimeMs?.toString() || '';
          
          next();
          return;
        }

        // If verification fails, return 403
        res.status(403).json({
          error: 'Payment verification failed',
          message: `Insufficient payment. Required: ${price} USDC, Paid: ${paidAmount} USDC`,
          price: `${price} USDC`,
          wallet: walletAddress,
          verificationStatus: verification.status
        });

      } catch (verificationError) {
        console.error('Payment verification error:', verificationError);
        
        // Return 403 for verification errors
        res.status(403).json({
          error: 'Payment verification error',
          message: verificationError instanceof Error ? verificationError.message : 'Unknown verification error',
          price: `${price} USDC`,
          wallet: walletAddress
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
