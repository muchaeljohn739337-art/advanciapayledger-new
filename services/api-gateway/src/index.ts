import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';

// Import middleware
import { authMiddleware } from './middleware/auth';
import { rbacMiddleware } from './middleware/rbac';
import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.GATEWAY_PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    version: process.env.VERSION || '1.0.0',
  });
});

// Service routing configuration
const services = {
  'auth-service': {
    target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    path: '/api/auth',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    authRequired: false,
    roles: [],
  },
  'monitoring-service': {
    target: process.env.MONITORING_SERVICE_URL || 'http://localhost:3002',
    path: '/api/monitoring',
    methods: ['GET', 'POST'],
    authRequired: true,
    roles: ['USER', 'ADMIN', 'SUPER_ADMIN'],
  },
  'web3-service': {
    target: process.env.WEB3_SERVICE_URL || 'http://localhost:3003',
    path: '/api/web3',
    methods: ['GET', 'POST'],
    authRequired: true,
    roles: ['USER', 'ADMIN', 'SUPER_ADMIN'],
  },
  'ai-service': {
    target: process.env.AI_SERVICE_URL || 'http://localhost:3004',
    path: '/api/ai',
    methods: ['GET', 'POST'],
    authRequired: true,
    roles: ['USER', 'ADMIN', 'SUPER_ADMIN'],
  },
  'security-service': {
    target: process.env.SECURITY_SERVICE_URL || 'http://localhost:3005',
    path: '/api/security',
    methods: ['GET', 'POST'],
    authRequired: true,
    roles: ['ADMIN', 'SUPER_ADMIN'],
  },
  'deployment-service': {
    target: process.env.DEPLOYMENT_SERVICE_URL || 'http://localhost:3006',
    path: '/api/deployment',
    methods: ['GET', 'POST'],
    authRequired: true,
    roles: ['ADMIN', 'SUPER_ADMIN'],
  },
  'notification-service': {
    target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007',
    path: '/api/notifications',
    methods: ['GET', 'POST'],
    authRequired: true,
    roles: ['USER', 'ADMIN', 'SUPER_ADMIN'],
  },
  'tenant-service': {
    target: process.env.TENANT_SERVICE_URL || 'http://localhost:3008',
    path: '/api/tenants',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    authRequired: true,
    roles: ['ADMIN', 'SUPER_ADMIN'],
  },
  'billing-service': {
    target: process.env.BILLING_SERVICE_URL || 'http://localhost:3009',
    path: '/api/billing',
    methods: ['GET', 'POST'],
    authRequired: true,
    roles: ['USER', 'ADMIN', 'SUPER_ADMIN'],
  },
};

// Setup service proxies
Object.entries(services).forEach(([serviceName, config]) => {
  const proxyMiddleware = createProxyMiddleware({
    target: config.target,
    changeOrigin: true,
    pathRewrite: {
      [`^${config.path}`: '',
    },
    onProxyReq: (proxyReq, req, res) => {
      // Add custom headers
      proxyReq.setHeader('X-Gateway-Request-ID', req.headers['x-request-id'] || '');
      proxyReq.setHeader('X-Gateway-User-ID', (req as any).user?.id || '');
      proxyReq.setHeader('X-Gateway-Tenant-ID', (req as any).tenant?.id || '');
    },
    onProxyRes: (proxyRes, req, res) => {
      // Log response
      console.log(`${req.method} ${req.path} -> ${proxyRes.statusCode}`);
    },
    onError: (err, req, res) => {
      console.error(`Proxy error for ${req.method} ${req.path}:`, err);
      res.status(502).json({
        error: 'Service unavailable',
        message: `Unable to reach ${serviceName}`,
      });
    },
  });

  // Apply middleware chain
  const middlewareChain = [];
  
  // Add authentication if required
  if (config.authRequired) {
    middlewareChain.push(authMiddleware);
  }
  
  // Add RBAC if roles are specified
  if (config.roles.length > 0) {
    middlewareChain.push(rbacMiddleware(config.roles));
  }
  
  // Apply middleware and proxy
  app.use(config.path, ...middlewareChain, proxyMiddleware);
});

// API documentation endpoint
app.get('/api/services', (req, res) => {
  const serviceInfo = Object.entries(services).map(([name, config]) => ({
    name,
    path: config.path,
    methods: config.methods,
    authRequired: config.authRequired,
    roles: config.roles,
    target: config.target,
  }));
  
  res.json({
    services: serviceInfo,
    gateway: {
      version: process.env.VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    },
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableServices: Object.keys(services),
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 API Gateway running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Services configured: ${Object.keys(services).length}`);
  });
}

export default app;
