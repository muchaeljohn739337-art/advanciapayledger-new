import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import { Request, Response, NextFunction } from 'express';

export const register = new Registry();

collectDefaultMetrics({ register });

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register]
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

export const paymentsTotal = new Counter({
  name: 'payments_total',
  help: 'Total payments processed',
  labelNames: ['status', 'type'],
  registers: [register]
});

export const paymentsAmount = new Counter({
  name: 'payments_amount_cents',
  help: 'Total payment amount in cents',
  labelNames: ['currency'],
  registers: [register]
});

export const activeUsers = new Gauge({
  name: 'active_users_total',
  help: 'Currently active users',
  registers: [register]
});

export const walletBalance = new Gauge({
  name: 'wallet_balance_cents',
  help: 'Total wallet balance in cents',
  labelNames: ['currency'],
  registers: [register]
});

export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Database query duration',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
  registers: [register]
});

export const dbConnectionsActive = new Gauge({
  name: 'db_connections_active',
  help: 'Active database connections',
  registers: [register]
});

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode.toString() },
      duration
    );
    
    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode.toString()
    });
  });
  
  next();
};

export const trackPayment = (status: string, type: string, amount: number, currency = 'USD') => {
  paymentsTotal.inc({ status, type });
  paymentsAmount.inc({ currency }, amount);
};

export const updateActiveUsers = (count: number) => {
  activeUsers.set(count);
};

export const updateWalletBalance = (balance: number, currency = 'USD') => {
  walletBalance.set({ currency }, balance);
};

export const trackDbQuery = (operation: string, table: string, duration: number) => {
  dbQueryDuration.observe({ operation, table }, duration);
};
