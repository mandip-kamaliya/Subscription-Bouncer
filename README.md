# Subscription Bouncer
Monetize any API with x402 micropayments in one command

---
> 💰 **Subscription Bouncer** — Monetize any API with x402 micropayments in one command.  
> Built on [PinionOS](https://github.com/chu2bard/pinion-os) • Base Blockchain • USDC Payments
---

## What is it?

Subscription Bouncer is a reverse proxy middleware that instantly monetizes any existing API with x402 micropayments. Simply point it at your API and every request will require a USDC payment before being forwarded. Built on PinionOS infrastructure and Base blockchain, it enables developers to earn revenue from their APIs without changing a single line of code in their existing applications.

## Built on PinionOS

Subscription Bouncer is built on top of PinionOS — the infrastructure for autonomous paid software. PinionOS handles all x402 payment signing, verification and USDC settlement on Base blockchain.

- **PinionOS GitHub**: https://github.com/chu2bard/pinion-os
- **PinionOS npm**: https://www.npmjs.com/package/pinion-os
- **Subscription Bouncer npm**: https://www.npmjs.com/package/subscription-bouncer

## How it works

Your API → Subscription Bouncer → x402 payment gate → USDC on Base

1. **Deploy** - Point Subscription Bouncer at your existing API
2. **Paywall** - Every request gets a 402 response with payment instructions  
3. **Payment** - Client pays USDC via x402 protocol on Base blockchain
4. **Verify** - PinionOS verifies the payment on-chain
5. **Forward** - Valid requests are forwarded to your original API
6. **Earn** - You automatically receive USDC in your wallet

## Quick Start (3 steps)

**Step 1:** Install Subscription Bouncer
```bash
npm install subscription-bouncer
```

**Step 2:** Run with your API
```bash
npx subscription-bouncer --target http://your-api.com --price 0.01 --wallet 0xYOUR_WALLET --key 0xYOUR_PRIVATE_KEY
```

**Step 3:** Your API is now paywalled. Start earning USDC! 🎉

## Requirements

- **Node.js 18+** - Modern JavaScript runtime
- **Wallet with USDC** - On Base (mainnet) or Base Sepolia (testnet)
- **PINION_PRIVATE_KEY** - Private key of your wallet
- **Small amount of ETH** - On Base for gas fees

## Installation

```bash
npm install subscription-bouncer
```

## Usage

### CLI Tool

The fastest way to monetize any API - no code changes required:

```bash
npx subscription-bouncer --target http://localhost:3000 --price 0.01 --wallet 0xYOUR_WALLET --key 0xYOUR_PRIVATE_KEY
```

**CLI Options:**
- `--target, -t` - URL of the API to proxy (required)
- `--price, -p` - USDC price per call (default: 0.01)
- `--port` - Port to run bouncer on (default: 4000)
- `--wallet, -w` - Wallet address to receive payments (required)
- `--key, -k` - Private key for PinionOS (or use PINION_PRIVATE_KEY env var)
- `--network, -n` - Network: base or base-sepolia (default: base-sepolia)

### Config File (bouncer.config.json)

Create a `bouncer.config.json` in your project root:

```json
{
  "target": "http://localhost:3000",
  "price": 0.01,
  "port": 4000,
  "wallet": "0xYOUR_WALLET_ADDRESS",
  "network": "base-sepolia"
}
```

Then just run:
```bash
npx subscription-bouncer
```

### Express Middleware

For direct integration into existing Express applications:

```typescript
import { subscriptionBouncer } from 'subscription-bouncer'

app.use('/api', subscriptionBouncer({
  price: 0.01,
  wallet: '0xYOUR_WALLET',
  privateKey: process.env.PINION_PRIVATE_KEY
}))
```

## API Usage Examples

### Without Payment (Gets 402 Response)

```bash
curl http://localhost:4000/api/users
```

Response:
```json
{
  "error": "Payment Required",
  "message": "This API requires a micropayment to access",
  "payment_address": "0x...",
  "amount": 0.01,
  "currency": "USDC",
  "network": "Base",
  "instructions": "Send 0.01 USDC on Base network to 0x... and include the transaction hash in the 'x402' header as: 'x402 tx=<transaction_hash>&signature=<signature>'"
}
```

### With Payment

```bash
curl -H "X-PAYMENT: <signed_payment>" http://localhost:4000/api/users
```

If payment is valid, the request is forwarded to your target API and the response is returned.

## Why Subscription Bouncer?

- ✅ **No code changes** to your existing API
- ✅ **Works with any HTTP API** - REST, GraphQL, you name it
- ✅ **Instant USDC earnings** per API call
- ✅ **Built on PinionOS** x402 infrastructure
- ✅ **Multiple deployment options** - CLI, config file, and Express middleware
- ✅ **Base blockchain** - Fast and cheap transactions

## Environment Variables

- `PINION_PRIVATE_KEY` - Your wallet private key with USDC on Base network (required)
- `DEFAULT_TARGET` - Default target API URL
- `DEFAULT_PRICE` - Default price per request in USDC
- `DEFAULT_PORT` - Default port for the proxy server

## Payment Flow

1. **Client makes request** without payment → Gets 402 with payment instructions
2. **Client sends USDC** to the provided payment address on Base network
3. **Client includes payment proof** in `x402` header with transaction hash and signature
4. **Subscription Bouncer verifies** the payment using PinionOS
5. **If valid**, request is forwarded to target API and response is returned

## Security Notes

- Never commit your private key to version control
- Use environment variables or secure secret management
- The proxy forwards all headers and body content to your target API
- Payment verification happens on Base L2 for fast and cheap transactions

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details.
