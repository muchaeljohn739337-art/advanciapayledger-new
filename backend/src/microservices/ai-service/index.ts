import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { AIController } from './controllers/ai.controller';
import { AIService } from './services/ai.service';
import { ClaudeAgentRouter } from './agents/claude-agent-router';
import { errorHandler } from './middleware/error.middleware';
import { rateLimiter } from './middleware/rate-limit.middleware';
import { validateRequest } from './middleware/validation.middleware';
import { authMiddleware } from './middleware/auth.middleware';

const app = express();
const PORT = process.env.PORT || 3002;

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
const claudeAgentRouter = new ClaudeAgentRouter();
const aiService = new AIService(claudeAgentRouter);
const aiController = new AIController(aiService);

// Routes
app.get('/health', (req, res) => {
  res.json({
    service: 'ai-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.SERVICE_VERSION || '1.0.0'
  });
});

// AI Assistant endpoints
app.post('/api/v1/ai/chat', 
  authMiddleware, 
  validateRequest('chatRequest'),
  aiController.chat.bind(aiController)
);

app.post('/api/v1/ai/analyze', 
  authMiddleware, 
  validateRequest('analyzeRequest'),
  aiController.analyze.bind(aiController)
);

app.post('/api/v1/ai/predict', 
  authMiddleware, 
  validateRequest('predictRequest'),
  aiController.predict.bind(aiController)
);

app.post('/api/v1/ai/recommend', 
  authMiddleware, 
  validateRequest('recommendRequest'),
  aiController.recommend.bind(aiController)
);

// Agent routing endpoints
app.post('/api/v1/agents/route', 
  authMiddleware, 
  validateRequest('routeRequest'),
  aiController.routeAgent.bind(aiController)
);

app.get('/api/v1/agents', 
  authMiddleware, 
  aiController.listAgents.bind(aiController)
);

app.get('/api/v1/agents/:agentId', 
  authMiddleware, 
  aiController.getAgent.bind(aiController)
);

// Predictive model endpoints
app.post('/api/v1/models/payment-fraud', 
  authMiddleware, 
  validateRequest('fraudDetectionRequest'),
  aiController.detectFraud.bind(aiController)
);

app.post('/api/v1/models/payment-risk', 
  authMiddleware, 
  validateRequest('riskAssessmentRequest'),
  aiController.assessRisk.bind(aiController)
);

app.post('/api/v1/models/cash-flow', 
  authMiddleware, 
  validateRequest('cashFlowRequest'),
  aiController.predictCashFlow.bind(aiController)
);

app.post('/api/v1/models/patient-lifetime', 
  authMiddleware, 
  validateRequest('patientLifetimeRequest'),
  aiController.predictPatientLifetime.bind(aiController)
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
    console.log(`🧠 AI Service started on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
  });
}

export default app;
