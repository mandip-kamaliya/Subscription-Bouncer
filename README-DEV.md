# Testing Subscription Bouncer Locally

## What you're testing
Two servers run simultaneously:
- **Demo API (port 3000)** = represents any existing API that needs monetization
- **Subscription Bouncer (port 4000)** = the payment proxy that protects the API

The magic: Any request to port 4000 requires a $0.01 USDC payment. If payment is valid, the request is forwarded to port 3000 and the response is returned. The original API (port 3000) doesn't need any changes!

## Steps

### 1. Install dependencies
```bash
npm install
```

### 2. Start the demo API (Terminal 1)
```bash
npx ts-node examples/demo-api.ts
```

You should see:
```
🚀 Demo API server running on port 3000
Available endpoints:
  GET  /hello   - Returns Hello World message
  GET  /time    - Returns current time
  GET  /data    - Returns sample data array
  GET  /health  - Health check endpoint

This represents any existing API that needs to be monetized
```

### 3. Confirm demo API works directly
```bash
curl http://localhost:3000/hello
```

Should return:
```json
{"message":"Hello World","timestamp":1708601234567}
```

Test other endpoints:
```bash
curl http://localhost:3000/time
curl http://localhost:3000/data
curl http://localhost:3000/health
```

### 4. Set up environment
```bash
cp .env.example .env
```

Edit `.env` and fill in your values:
```bash
# Wallet private key for PinionOS payment verification (must start with 0x)
PINION_PRIVATE_KEY=0xyour_actual_private_key_here

# Target API URL to proxy requests to
TARGET_URL=http://localhost:3000

# Price per API call in USDC
PRICE=0.01

# Wallet address to receive USDC payments (must start with 0x)
WALLET_ADDRESS=0xyour_wallet_address_here

# Port for Subscription Bouncer to run on
PORT=4000
```

### 5. Start Subscription Bouncer (Terminal 2)
```bash
npm run dev
```

You should see:
```
🚀 Subscription Bouncer is running
   Proxy:  http://localhost:4000
   Target: http://localhost:3000
   Price:  $0.01 USDC per call
   Wallet: 0x...

Usage examples:
curl http://localhost:4000/api/endpoint
curl -H "X-PAYMENT: signed_x402_payment_data" http://localhost:4000/api/endpoint
```

### 6. Test WITHOUT payment (should get blocked)
```bash
curl http://localhost:4000/hello
```

Should return HTTP 402 with payment instructions:
```json
{
  "error": "Payment required",
  "price": "0.01 USDC",
  "wallet": "0xYOUR_WALLET",
  "instructions": "Include X-PAYMENT header with signed x402 payment to access this API"
}
```

### 7. Test WITH payment header
```bash
curl -H "X-PAYMENT: signed_x402_payment_data" http://localhost:4000/hello
```

**Expected behavior:**
- Payment header is sent to PinionOS for verification
- If payment is valid: Returns `{"message":"Hello World","timestamp":1708601234567}`
- If payment is invalid: Returns HTTP 403 with error message

**For hackathon demo testing:**
The mock implementation accepts any payment header containing "signed" and "x402":
```bash
curl -H "X-PAYMENT: signed_x402_test" http://localhost:4000/hello
```

### 8. Test all endpoints through the proxy
```bash
# Test without payment (all should return 402)
curl http://localhost:4000/hello
curl http://localhost:4000/time
curl http://localhost:4000/data
curl http://localhost:4000/health

# Test with payment (all should return data)
curl -H "X-PAYMENT: signed_x402_test" http://localhost:4000/hello
curl -H "X-PAYMENT: signed_x402_test" http://localhost:4000/time
curl -H "X-PAYMENT: signed_x402_test" http://localhost:4000/data
curl -H "X-PAYMENT: signed_x402_test" http://localhost:4000/health
```

## What success looks like

### ✅ Port 3000 (Unprotected API)
- Direct access works without any payment
- Returns data immediately
- Represents any existing API

### ✅ Port 4000 (Paywalled API)
- **Without payment**: Returns 402 with clear payment instructions
- **With valid payment**: Returns same data as port 3000
- **With invalid payment**: Returns 403 error

### ✅ Key Demonstration Points
- **No changes needed** to the original API (port 3000)
- **Any API can be wrapped** this way - just change TARGET_URL
- **Payment verification happens** transparently
- **Developers earn USDC** automatically per API call
- **x402 protocol** provides standardized payment flow

## Troubleshooting

### "PINION_PRIVATE_KEY environment variable is required"
- Make sure you copied `.env.example` to `.env`
- Fill in a real private key (can be a test key for demo)

### "WALLET_ADDRESS environment variable is required"
- Add your wallet address to `.env`
- Must start with "0x"

### Port already in use
- Kill any existing processes on ports 3000 or 4000
- Use different ports if needed (update .env accordingly)

### Proxy not forwarding requests
- Check that the demo API is running on port 3000
- Verify TARGET_URL in .env matches the demo API URL
- Check both terminals for error messages

## Next Steps for Production

1. **Replace mock PinionClient** with real PinionOS implementation
2. **Deploy to cloud** with proper environment variables
3. **Add monitoring** for payment verification success rates
4. **Implement rate limiting** to prevent abuse
5. **Add analytics** for API usage and revenue tracking
