import express from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { paymentGate } from './payment.js';

/**
 * Creates Express middleware that forwards all requests to a target URL
 * @param target - The target URL to proxy requests to (e.g. http://localhost:3000)
 * @returns Express middleware function
 */
export function createProxy(target: string): express.RequestHandler {
  // Validate target URL
  if (!target) {
    throw new Error('Target URL is required');
  }

  try {
    new URL(target);
  } catch {
    throw new Error('Invalid target URL format');
  }

  // Proxy configuration options
  const proxyOptions: Options = {
    target,
    changeOrigin: true, // Changes the origin of the host header to the target URL
    secure: false, // Ignore SSL certificate errors (useful for local development)
    timeout: 10000, // 10 second timeout for proxy requests
    
    // Log proxy events for debugging
    logLevel: 'warn' as const,
    
    // Handle proxy errors gracefully
    onError: (err: Error, req: express.Request, res: express.Response) => {
      console.error(`Proxy error for ${req.method} ${req.path}:`, err.message);
      
      // Return clean 502 error without exposing internal details
      res.status(502).json({
        error: 'Target API unreachable',
        target: target,
        timestamp: new Date().toISOString()
      });
    },
    
    // Log successful proxy requests (remove debug logs for production)
    onProxyReq: (proxyReq, req, res) => {
      // Remove debug log for production
    },
    
    // Log proxy responses (remove debug logs for production)
    onProxyRes: (proxyRes, req, res) => {
      // Remove debug log for production
    }
  };

  // Create and return the proxy middleware
  return createProxyMiddleware(proxyOptions);
}

/**
 * Creates a complete Express app with proxy middleware
 * @param target - The target URL to proxy requests to
 * @returns Configured Express application
 */
export function createProxyApp(target: string): express.Application {
  const app = express();
  
  // Parse JSON and URL-encoded bodies
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Add proxy middleware for all routes
  app.use('*', createProxy(target));
  
  return app;
}
