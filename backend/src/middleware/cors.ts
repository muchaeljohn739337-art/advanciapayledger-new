// backend/src/middleware/cors.ts
// CORS Configuration for Frontend-Backend Communication

import cors from 'cors';
import { Request, Response, NextFunction } from 'express';
import { logger } from "../utils/logger";

// ===========================================
// CORS ALLOWED ORIGINS
// ===========================================

const getAllowedOrigins = (): string[] => {
  const origins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  
  // Default origins for different environments
  const defaultOrigins = {
    development: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ],
    staging: [
      'https://staging.advanciapayledger.com',
      'https://preview.advanciapayledger.com',
    ],
    production: [
      'https://advanciapayledger.com',
      'https://www.advanciapayledger.com',
      'https://app.advanciapayledger.com',
    ],
  };
  
  const env = process.env.NODE_ENV || 'development';
  
  // Merge environment-specific origins with custom ones
  const envOrigins = defaultOrigins[env as keyof typeof defaultOrigins] || [];
  return [...new Set([...envOrigins, ...origins])];
};

// ===========================================
// CORS OPTIONS
// ===========================================

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  
  credentials: true, // Allow cookies and authentication headers
  
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Request-ID',
    'X-Timestamp',
    'X-API-Key',
    'Accept',
    'Origin',
  ],
  
  exposedHeaders: [
    'X-Request-ID',
    'X-Response-Time',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  
  maxAge: 86400, // 24 hours preflight cache
  
  optionsSuccessStatus: 204,
};

// ===========================================
// CORS MIDDLEWARE
// ===========================================

export const corsMiddleware = cors(corsOptions);

// ===========================================
// CUSTOM CORS HANDLER (for more control)
// ===========================================

export const customCorsHandler = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  const allowedOrigins = getAllowedOrigins();
  
  // Set CORS headers
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 
    'Content-Type, Authorization, X-Request-ID, X-Timestamp, X-API-Key');
  res.setHeader('Access-Control-Expose-Headers',
    'X-Request-ID, X-Response-Time, X-RateLimit-Limit, X-RateLimit-Remaining');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  
  next();
};

// ===========================================
// SECURITY HEADERS
// ===========================================

export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
  
  // HSTS (only in production)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  next();
};

export default corsMiddleware;
