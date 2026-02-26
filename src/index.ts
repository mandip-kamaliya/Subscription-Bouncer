import { createProxyApp } from './proxy';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const DEFAULT_TARGET = process.env.DEFAULT_TARGET || 'http://localhost:3000';
const DEFAULT_PRICE = parseFloat(process.env.DEFAULT_PRICE || '0.01');
const DEFAULT_PORT = parseInt(process.env.DEFAULT_PORT || '4000');

// Get command line arguments
const args = process.argv.slice(2);
const targetIndex = args.indexOf('--target');
const priceIndex = args.indexOf('--price');
const portIndex = args.indexOf('--port');

const target = targetIndex !== -1 ? args[targetIndex + 1] : DEFAULT_TARGET;
const price = priceIndex !== -1 ? parseFloat(args[priceIndex + 1]) : DEFAULT_PRICE;
const port = portIndex !== -1 ? parseInt(args[portIndex + 1]) : DEFAULT_PORT;

// Validate arguments
if (!target) {
  console.error('❌ Error: Target URL is required');
  console.log('Usage: node dist/index.js --target <url> [--price <amount>] [--port <port>]');
  process.exit(1);
}

if (price <= 0) {
  console.error('❌ Error: Price must be greater than 0');
  process.exit(1);
}

if (port <= 0 || port > 65535) {
  console.error('❌ Error: Port must be between 1 and 65535');
  process.exit(1);
}

console.log('🔧 Starting Subscription Bouncer with configuration:');
console.log(`   Target: ${target}`);
console.log(`   Price: ${price} USDC per request`);
console.log(`   Port: ${port}`);
console.log('');

// Create and start the proxy app
const app = createProxyApp(target);
app.listen(port, () => {
  console.log(`🚀 Subscription Bouncer started on port ${port}`);
  console.log(`📡 Proxying to: ${target}`);
  console.log(`💰 Price per request: ${price} USDC`);
  console.log('');
  console.log('Usage examples:');
  console.log(`curl http://localhost:${port}/your-endpoint`);
});
