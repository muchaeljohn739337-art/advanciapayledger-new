import * as Sentry from '@sentry/nextjs';

export function initializeFrontendSentry(): void {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (!dsn) {
    console.warn('⚠️  Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    
    // Adjust this value in production
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
    
    integrations: [
      new Sentry.Replay({
        maskAllText: true, // HIPAA compliance - mask all text
        blockAllMedia: true, // Don't capture media
      }),
      new Sentry.BrowserTracing({
        tracePropagationTargets: [
          'localhost',
          /^https:\/\/api\.advanciapayledger\.com/,
          /^\//,
        ],
      }),
    ],

    beforeSend(event, hint) {
      // Filter out personal/health information
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }

      // Remove sensitive breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.filter(breadcrumb => {
          return !breadcrumb.message?.toLowerCase().includes('password') &&
                 !breadcrumb.message?.toLowerCase().includes('ssn') &&
                 !breadcrumb.message?.toLowerCase().includes('phi');
        });
      }

      return event;
    },

    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      'Can\'t find variable: ZiteReader',
      'jigsaw is not defined',
      'ComboSearch is not defined',
      
      // Network errors
      'NetworkError',
      'Failed to fetch',
      'Load failed',
      
      // React hydration
      'Hydration failed',
      'There was an error while hydrating',
    ],
  });

  console.log('✅ Frontend Sentry initialized');
}

// Custom error boundaries
export function captureComponentError(error: Error, componentStack: string): void {
  Sentry.withScope((scope) => {
    scope.setContext('react', {
      componentStack,
    });
    Sentry.captureException(error);
  });
}

export function captureAPIError(
  error: Error,
  endpoint: string,
  method: string,
  statusCode?: number
): void {
  Sentry.withScope((scope) => {
    scope.setTag('api_endpoint', endpoint);
    scope.setTag('http_method', method);
    if (statusCode) {
      scope.setTag('status_code', statusCode.toString());
    }
    Sentry.captureException(error);
  });
}

export function setUserContext(userId: string, facilityId?: string): void {
  Sentry.setUser({
    id: userId,
    // Don't include email or other PII
    segment: facilityId ? 'facility' : 'admin',
  });
}

export function clearUserContext(): void {
  Sentry.setUser(null);
}

export default {
  initializeFrontendSentry,
  captureComponentError,
  captureAPIError,
  setUserContext,
  clearUserContext,
};
