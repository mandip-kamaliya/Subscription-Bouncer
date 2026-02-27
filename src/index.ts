import express from 'express';
import dotenv from 'dotenv';
import { paymentGate } from './payment';
import { createProxy } from './proxy';

// Load environment variables at the very top
dotenv.config();

// Configuration interface
interface Config {
  targetUrl: string;
  price: number;
  walletAddress: string;
  port: number;
  pinionPrivateKey: string;
}

// Load and validate configuration
function loadConfig(): Config {
  const targetUrl = process.env.TARGET_URL || 'http://localhost:3000';
  const price = parseFloat(process.env.PRICE || '0.01');
  const walletAddress = process.env.WALLET_ADDRESS || '';
  const port = parseInt(process.env.PORT || '4000');
  const pinionPrivateKey = process.env.PINION_PRIVATE_KEY || '';

  // Validate required environment variables
  if (!walletAddress) {
    throw new Error('WALLET_ADDRESS environment variable is required');
  }

  if (!walletAddress.startsWith('0x')) {
    throw new Error('WALLET_ADDRESS must start with 0x');
  }

  if (!pinionPrivateKey) {
    throw new Error('PINION_PRIVATE_KEY environment variable is required');
  }

  if (!pinionPrivateKey.startsWith('0x')) {
    throw new Error('PINION_PRIVATE_KEY must start with 0x');
  }

  if (price <= 0) {
    throw new Error('PRICE must be greater than 0');
  }

  if (port <= 0 || port > 65535) {
    throw new Error('PORT must be between 1 and 65535');
  }

  try {
    new URL(targetUrl);
  } catch {
    throw new Error('TARGET_URL must be a valid URL');
  }

  return {
    targetUrl,
    price,
    walletAddress,
    port,
    pinionPrivateKey
  };
}

// Main application
function main(): void {
  try {
    // Load configuration
    const config = loadConfig();

    // Create Express app
    const app = express();

    // Apply middleware in order
    // 1. Payment gate middleware first (blocks unauthorized requests)
    app.use(paymentGate(config.price, config.walletAddress));

    // 2. Proxy middleware second (forwards authorized requests)
    app.use(createProxy(config.targetUrl));

    // Start server
    app.listen(config.port, () => {
      console.log('🚀 Subscription Bouncer is running');
      console.log(`   Proxy:  http://localhost:${config.port}`);
      console.log(`   Target: ${config.targetUrl}`);
      console.log(`   Price:  $${config.price} USDC per call`);
      console.log(`   Wallet: ${config.walletAddress}`);
      console.log('');
      console.log('Usage examples:');
      console.log(`curl http://localhost:${config.port}/api/endpoint`);
      console.log(`curl -H "X-PAYMENT: signed_x402_payment_data" http://localhost:${config.port}/api/endpoint`);
    });

  } catch (error) {
    console.error('❌ Failed to start Subscription Bouncer:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Start the application
main();
