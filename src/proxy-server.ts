import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import { PaymentVerifier } from './payment-verifier';
import { BouncerConfig, PaymentRequiredResponse } from './types';

export class ProxyServer {
  private app: express.Application;
  private paymentVerifier: PaymentVerifier;
  private config: BouncerConfig;

  constructor(config: BouncerConfig) {
    this.config = config;
    this.app = express();
    this.paymentVerifier = new PaymentVerifier();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // CORS support
    this.app.use(cors({
      origin: true,
      credentials: true
    }));

    // Parse JSON bodies
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // Payment verification middleware for all routes
    this.app.use('*', this.paymentMiddleware.bind(this));

    // Proxy middleware - forwards to target API
    const proxyOptions = {
      target: this.config.target,
      changeOrigin: true,
      secure: false,
      logLevel: 'warn' as const,
      onProxyReq: (proxyReq: any, req: any, res: any) => {
        console.log(`Proxying ${req.method} ${req.path} to ${this.config.target}`);
      },
      onProxyRes: (proxyRes: any, req: any, res: any) => {
        console.log(`Proxy response: ${proxyRes.statusCode} for ${req.method} ${req.path}`);
      },
      onError: (err: any, req: any, res: any) => {
        console.error(`Proxy error for ${req.method} ${req.path}:`, err.message);
        res.status(502).json({
          error: 'Bad Gateway',
          message: 'Failed to connect to the target API'
        });
      }
    };

    this.app.use(createProxyMiddleware(proxyOptions));
  }

  private async paymentMiddleware(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    const paymentHeader = req.headers['x402'] as string;

    // If no payment header, return 402 with payment instructions
    if (!paymentHeader) {
      const paymentResponse: PaymentRequiredResponse = {
        ...this.paymentVerifier.generatePaymentResponse(this.config.price),
        error: 'Payment Required'
      };
      
      res.status(402).json(paymentResponse);
      return;
    }

    // Verify the payment
    const verification = await this.paymentVerifier.verifyPayment(paymentHeader, this.config.price);

    if (!verification.valid) {
      res.status(402).json({
        error: 'Payment Invalid',
        message: verification.error || 'Payment verification failed',
        payment_address: this.paymentVerifier.generatePaymentResponse(this.config.price).payment_address,
        amount: this.config.price,
        currency: 'USDC',
        network: 'Base',
        instructions: this.paymentVerifier.generatePaymentResponse(this.config.price).instructions
      });
      return;
    }

    // Payment is valid, add verification info to headers and continue
    if (verification.transactionHash) {
      res.setHeader('x-payment-verified', 'true');
      res.setHeader('x-transaction-hash', verification.transactionHash);
    }
    next();
  }

  public start(): void {
    this.app.listen(this.config.port, () => {
      console.log(`🚀 Subscription Bouncer started on port ${this.config.port}`);
      console.log(`📡 Proxying to: ${this.config.target}`);
      console.log(`💰 Price per request: ${this.config.price} USDC`);
      console.log(`🔗 Payment address: ${this.paymentVerifier.generatePaymentResponse(this.config.price).payment_address}`);
      console.log('');
      console.log('Usage examples:');
      console.log(`curl http://localhost:${this.config.port}/your-endpoint`);
      console.log(`curl -H "x402: tx=<transaction_hash>&signature=<signature>" http://localhost:${this.config.port}/your-endpoint`);
    });
  }
}
