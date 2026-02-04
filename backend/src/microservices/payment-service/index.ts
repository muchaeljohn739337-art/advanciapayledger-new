import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PaymentController } from './controllers/payment.controller';
import { PaymentService } from './services/payment.service';
import { PaymentRepository } from './repositories/payment.repository';
import { errorHandler } from './middleware/error.middleware';
import { rateLimiter } from './middleware/rate-limit.middleware';
import { validateRequest } from './middleware/validation.middleware';
import { authMiddleware } from './middleware/auth.middleware';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(rateLimiter);

// Dependencies
const paymentRepository = new PaymentRepository();
const paymentService = new PaymentService(paymentRepository);
const paymentController = new PaymentController(paymentService);

// Routes
app.get('/health', (req, res) => {
  res.json({
    service: 'payment-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.SERVICE_VERSION || '1.0.0'
  });
});

// Payment processing routes
app.post('/api/v1/payments/crypto', 
  authMiddleware, 
  validateRequest('createCryptoPayment'),
  paymentController.createCryptoPayment.bind(paymentController)
);

app.post('/api/v1/payments/fiat', 
  authMiddleware, 
  validateRequest('createFiatPayment'),
  paymentController.createFiatPayment.bind(paymentController)
);

app.get('/api/v1/payments/:id', 
  authMiddleware, 
  paymentController.getPayment.bind(paymentController)
);

app.get('/api/v1/payments', 
  authMiddleware, 
  paymentController.listPayments.bind(paymentController)
);

app.post('/api/v1/payments/:id/confirm', 
  authMiddleware, 
  paymentController.confirmPayment.bind(paymentController)
);

app.post('/api/v1/payments/:id/refund', 
  authMiddleware, 
  validateRequest('refundPayment'),
  paymentController.refundPayment.bind(paymentController)
);

// Webhook endpoints
app.post('/api/v1/webhooks/crypto', 
  paymentController.handleCryptoWebhook.bind(paymentController)
);

app.post('/api/v1/webhooks/fiat', 
  paymentController.handleFiatWebhook.bind(paymentController)
);

// Error handling
app.use(errorHandler);

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
    console.log(`🚀 Payment Service started on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
  });
}

export default app;
