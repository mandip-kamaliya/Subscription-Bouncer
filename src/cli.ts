#!/usr/bin/env node

import { Command } from 'commander';
import { ProxyServer } from './proxy-server';
import { BouncerConfig } from './types';

const program = new Command();

program
  .name('subscription-bouncer')
  .description('Reverse proxy middleware that monetizes APIs with micropayments')
  .version('1.0.0');

program
  .option('-t, --target <url>', 'Target API URL to proxy to', process.env.DEFAULT_TARGET || 'http://localhost:3000')
  .option('-p, --price <amount>', 'Price per API call in USDC', parseFloat, parseFloat(process.env.DEFAULT_PRICE || '0.01'))
  .option('--port <port>', 'Port to run the proxy server on', parseInt, parseInt(process.env.DEFAULT_PORT || '4000'))
  .action(async (options) => {
    try {
      const config: BouncerConfig = {
        target: options.target,
        price: options.price,
        port: options.port
      };

      // Validate configuration
      if (!config.target) {
        console.error('❌ Error: Target URL is required');
        process.exit(1);
      }

      if (config.price <= 0) {
        console.error('❌ Error: Price must be greater than 0');
        process.exit(1);
      }

      if (config.port <= 0 || config.port > 65535) {
        console.error('❌ Error: Port must be between 1 and 65535');
        process.exit(1);
      }

      // Check for required environment variables
      if (!process.env.PINION_PRIVATE_KEY) {
        console.error('❌ Error: PINION_PRIVATE_KEY environment variable is required');
        console.error('💡 Set up a .env file with your private key or export the environment variable');
        console.error('📝 Copy .env.example to .env and add your private key');
        process.exit(1);
      }

      console.log('🔧 Starting Subscription Bouncer with configuration:');
      console.log(`   Target: ${config.target}`);
      console.log(`   Price: ${config.price} USDC per request`);
      console.log(`   Port: ${config.port}`);
      console.log('');

      // Start the proxy server
      const server = new ProxyServer(config);
      server.start();

    } catch (error) {
      console.error('❌ Failed to start Subscription Bouncer:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse(process.argv);
