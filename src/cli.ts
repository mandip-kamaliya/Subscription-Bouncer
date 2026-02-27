#!/usr/bin/env node

import { Command } from 'commander';
import express from 'express';
import { paymentGate } from './payment.js';
import { createProxy } from './proxy.js';
import { loadConfig, BouncerConfig } from './config.js';

// CLI interface for Subscription Bouncer
const program = new Command();

program
  .name('subscription-bouncer')
  .description('Reverse proxy middleware that monetizes APIs with x402 micropayments')
  .version('1.0.0');

program
  .option('-t, --target <url>', 'URL of the API to proxy')
  .option('-p, --price <amount>', 'USDC price per call')
  .option('--port <port>', 'Port to run bouncer on')
  .option('-w, --wallet <address>', 'Wallet address to receive payments')
  .option('-k, --key <privateKey>', 'Private key for PinionOS')
  .option('-n, --network <network>', 'Network: base or base-sepolia')
  .action(async (cliOptions) => {
    try {
      // Load configuration with CLI arguments taking highest priority
      const config = loadConfig(cliOptions);

      console.log('🔧 Starting Subscription Bouncer with merged configuration:');
      console.log(`   Target: ${config.target}`);
      console.log(`   Price: ${config.price} USDC per call`);
      console.log(`   Port: ${config.port}`);
      console.log(`   Wallet: ${config.wallet}`);
      console.log(`   Network: ${config.network}`);
      console.log('');

      // Set environment variables for the payment module
      process.env.PINION_PRIVATE_KEY = config.privateKey;

      // Create Express app
      const app = express();

      // Apply middleware in order
      // 1. Payment gate middleware first (blocks unauthorized requests)
      app.use(paymentGate(config.price, config.wallet));

      // 2. Proxy middleware second (forwards authorized requests)
      app.use(createProxy(config.target));

      // Start server
      app.listen(config.port, () => {
        console.log('🚀 Subscription Bouncer is running');
        console.log(`   Proxy:  http://localhost:${config.port}`);
        console.log(`   Target: ${config.target}`);
        console.log(`   Price:  $${config.price} USDC per call`);
        console.log(`   Wallet: ${config.wallet}`);
        console.log(`   Network: ${config.network}`);
        console.log('');
        console.log('Usage examples:');
        console.log(`curl http://localhost:${config.port}/api/endpoint`);
        console.log(`curl -H "X-PAYMENT: <signed_x402_payment>" http://localhost:${config.port}/api/endpoint`);
        console.log('');
        console.log('🎯 Your API is now monetized! Every request requires USDC payment.');
      });

    } catch (error) {
      console.error('❌ Failed to start Subscription Bouncer:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();
