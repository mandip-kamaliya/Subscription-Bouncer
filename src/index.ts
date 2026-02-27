/**
 * Subscription Bouncer - Monetize any API with x402 micropayments
 * 
 * Main package exports for the Subscription Bouncer library.
 * Provides multiple deployment options: CLI tool, Express middleware, and individual components.
 */

/**
 * Express middleware that adds x402 payment verification to specific routes
 * @param config - Configuration object containing price, wallet, and private key
 * @returns Express middleware function
 * 
 * @example
 * ```typescript
 * import { subscriptionBouncer } from 'subscription-bouncer'
 * 
 * app.use('/api', subscriptionBouncer({
 *   price: 0.01,
 *   wallet: '0xYOUR_WALLET',
 *   privateKey: process.env.PINION_PRIVATE_KEY
 * }))
 * ```
 */
export { subscriptionBouncer, MiddlewareConfig } from './middleware.js';

/**
 * Creates a reverse proxy middleware that forwards requests to a target URL
 * @param target - The target URL to proxy requests to (e.g., http://localhost:3000)
 * @returns Express middleware function that forwards requests to the target
 * 
 * @example
 * ```typescript
 * import { createProxy } from 'subscription-bouncer'
 * 
 * app.use(createProxy('http://localhost:3000'))
 * ```
 */
export { createProxy } from './proxy.js';

/**
 * Creates Express middleware that implements x402 payment verification
 * @param price - Price per request in USDC (e.g., 0.01)
 * @param walletAddress - Wallet address to receive payments
 * @returns Express middleware function that verifies payments before allowing requests
 * 
 * @example
 * ```typescript
 * import { paymentGate } from 'subscription-bouncer'
 * 
 * app.use(paymentGate(0.01, '0xYOUR_WALLET'))
 * ```
 */
export { paymentGate } from './payment.js';

/**
 * Loads and merges configuration from multiple sources (CLI args, config file, environment variables)
 * @param cliArgs - Optional CLI arguments that take highest priority
 * @returns Merged configuration object
 * 
 * @example
 * ```typescript
 * import { loadConfig } from 'subscription-bouncer'
 * 
 * const config = loadConfig({ target: 'http://localhost:3000' })
 * ```
 */
export { loadConfig, BouncerConfig } from './config.js';
