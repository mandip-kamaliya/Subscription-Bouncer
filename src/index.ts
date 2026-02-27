// Middleware exports - for direct Express integration
export { subscriptionBouncer, MiddlewareConfig } from './middleware.js';

// Individual component exports - for custom implementations
export { createProxy } from './proxy.js';
export { paymentGate } from './payment.js';

// Configuration exports - for CLI and config file support
export { loadConfig, BouncerConfig } from './config.js';
