import express from 'express';
import { subscriptionBouncer, MiddlewareConfig } from '../src/index.js';

// Configuration for the payment middleware
const paymentConfig: MiddlewareConfig = {
  price: 0.01,                                    // $0.01 USDC per API call
  wallet: '0xYOUR_WALLET_ADDRESS_HERE',          // Your wallet address to receive payments
  privateKey: process.env.PINION_PRIVATE_KEY || '0xYOUR_PRIVATE_KEY_HERE', // Your private key
  network: 'base-sepolia'                        // Use Base Sepolia testnet
};

// Create Express application
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Apply subscription bouncer middleware ONLY to /api routes
// This means any request to /api/* will require payment
// Requests to other routes (like /health) will be free
app.use('/api', subscriptionBouncer(paymentConfig));

// Sample routes that require payment (under /api)
app.get('/api/hello', (req, res) => {
  res.json({
    message: 'Hello from paid API!',
    timestamp: Date.now(),
    paymentVerified: req.headers['x-payment-verified'] === 'true',
    paidAmount: req.headers['x-paid-amount']
  });
});

app.get('/api/users', (req, res) => {
  res.json({
    users: [
      { id: 1, name: 'Alice', role: 'premium' },
      { id: 2, name: 'Bob', role: 'premium' },
      { id: 3, name: 'Charlie', role: 'premium' }
    ],
    total: 3,
    paymentRequired: true
  });
});

app.post('/api/data', (req, res) => {
  const { data } = req.body;
  res.json({
    message: 'Data received and processed',
    received: data,
    processedAt: new Date().toISOString(),
    paymentVerified: req.headers['x-payment-verified'] === 'true'
  });
});

// Free routes (no payment required)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    note: 'This endpoint is free - no payment required'
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Subscription Bouncer Middleware Demo',
    endpoints: {
      free: ['/health', '/'],
      paid: ['/api/hello', '/api/users', '/api/data']
    },
    usage: {
      paid: 'Include X-PAYMENT header with signed x402 payment',
      free: 'No payment required'
    }
  });
});

// Start server on port 3001
const port = 3001;
app.listen(port, () => {
  console.log('🚀 Middleware Demo Server running on port', port);
  console.log('');
  console.log('📋 Available endpoints:');
  console.log('');
  console.log('FREE endpoints (no payment required):');
  console.log('  GET  http://localhost:' + port + '/health');
  console.log('  GET  http://localhost:' + port + '/');
  console.log('');
  console.log('PAID endpoints (require X-PAYMENT header):');
  console.log('  GET  http://localhost:' + port + '/api/hello');
  console.log('  GET  http://localhost:' + port + '/api/users');
  console.log('  POST http://localhost:' + port + '/api/data');
  console.log('');
  console.log('💡 Testing examples:');
  console.log('');
  console.log('Test free endpoint:');
  console.log('  curl http://localhost:' + port + '/health');
  console.log('');
  console.log('Test paid endpoint (should get 402):');
  console.log('  curl http://localhost:' + port + '/api/hello');
  console.log('');
  console.log('Test paid endpoint with payment:');
  console.log('  curl -H "X-PAYMENT: test_payment_data" http://localhost:' + port + '/api/hello');
  console.log('');
  console.log('🎯 This shows how to add payment gating to existing Express apps!');
});
