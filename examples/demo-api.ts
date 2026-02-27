import express from 'express';

const app = express();
const port = 3000;

// Middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Parse JSON bodies
app.use(express.json());

// GET /hello → { message: "Hello World", timestamp: Date.now() }
app.get('/hello', (req, res) => {
  res.json({
    message: "Hello World",
    timestamp: Date.now()
  });
});

// GET /time → { time: new Date().toISOString(), timezone: "UTC" }
app.get('/time', (req, res) => {
  res.json({
    time: new Date().toISOString(),
    timezone: "UTC"
  });
});

// GET /data → { data: [1, 2, 3, 4, 5], count: 5 }
app.get('/data', (req, res) => {
  res.json({
    data: [1, 2, 3, 4, 5],
    count: 5
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Path ${req.originalUrl} not found`,
    availableEndpoints: ['/hello', '/time', '/data', '/health']
  });
});

app.listen(port, () => {
  console.log(`🚀 Demo API server running on port ${port}`);
  console.log('Available endpoints:');
  console.log('  GET  /hello   - Returns Hello World message');
  console.log('  GET  /time    - Returns current time');
  console.log('  GET  /data    - Returns sample data array');
  console.log('  GET  /health  - Health check endpoint');
  console.log('');
  console.log('This represents any existing API that needs to be monetized');
});
