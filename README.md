# Subscription Bouncer 🚀

A reverse proxy middleware that lets any developer monetize their existing API with micropayments in one command.

## What It Does

Instead of building auth systems or subscription billing, you just wrap your API with Subscription Bouncer and every API call requires a small USDC payment to go through.

## How It Works

1. Developer runs: `npx subscription-bouncer --target http://localhost:3000 --price 0.01`
2. Subscription Bouncer starts a proxy server on port 4000
3. Any request to port 4000 is intercepted
4. If no payment header → caller gets a 402 response explaining what to pay and where
5. If payment header exists → verify it using PinionOS x402 protocol on Base blockchain
6. If payment valid → forward request to the real API and return response
7. Developer earns USDC automatically per API call, no code changes to their API needed

## Tech Stack

- **PinionOS** (pinion-os npm package) — handles x402 micropayment verification on Base L2
- **x402 protocol** — a payment standard where HTTP 402 signals "pay to access"
- **Express.js** — the proxy server
- **http-proxy-middleware** — forwards requests to target API
- **TypeScript** — clean typed code
- **Base blockchain** — where USDC payments settle

## Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Or use directly with npx (recommended)
npx subscription-bouncer --help
```

## Setup

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Set your private key:**
   Edit `.env` and add your wallet private key that has USDC on Base network:
   ```
   PINION_PRIVATE_KEY=your_private_key_here
   ```

3. **Ensure you have USDC on Base network** in the wallet corresponding to your private key.

## Usage

### Basic Usage

```bash
# Start proxy for API running on localhost:3000, charging 0.01 USDC per request
npx subscription-bouncer --target http://localhost:3000 --price 0.01

# Custom port
npx subscription-bouncer --target http://localhost:3000 --price 0.01 --port 8080
```

### Development

```bash
# Run in development mode
npm run dev -- --target http://localhost:3000 --price 0.01

# Build
npm run build

# Start built version
npm start -- --target http://localhost:3000 --price 0.01
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
curl -H "x402: tx=0x123...&signature=abc123..." http://localhost:4000/api/users
```

If payment is valid, the request is forwarded to your target API and the response is returned.

## CLI Options

- `-t, --target <url>` - Target API URL to proxy to (default: http://localhost:3000)
- `-p, --price <amount>` - Price per API call in USDC (default: 0.01)
- `--port <port>` - Port to run the proxy server on (default: 4000)

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
