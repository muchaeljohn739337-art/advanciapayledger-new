import { GraphQLError } from 'graphql';
import { Request } from 'express';
import { logger } from "../utils/logger";

interface SecurityConfig {
  maxDepth: number;
  maxComplexity: number;
  maxBatchSize: number;
  disableIntrospection: boolean;
  enableQueryLogging: boolean;
}

const DEFAULT_CONFIG: SecurityConfig = {
  maxDepth: 7,
  maxComplexity: 1000,
  maxBatchSize: 3,
  disableIntrospection: process.env.NODE_ENV === 'production',
  enableQueryLogging: true,
};

export class GraphQLSecurityMiddleware {
  private config: SecurityConfig;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  validateDepth(query: any, maxDepth: number = this.config.maxDepth): void {
    const depth = this.calculateDepth(query);
    if (depth > maxDepth) {
      throw new GraphQLError(
        `Query depth of ${depth} exceeds maximum allowed depth of ${maxDepth}`,
        {
          extensions: {
            code: 'QUERY_TOO_DEEP',
            depth,
            maxDepth,
          },
        }
      );
    }
  }

  validateComplexity(query: any, maxComplexity: number = this.config.maxComplexity): void {
    const complexity = this.calculateComplexity(query);
    if (complexity > maxComplexity) {
      throw new GraphQLError(
        `Query complexity of ${complexity} exceeds maximum allowed complexity of ${maxComplexity}`,
        {
          extensions: {
            code: 'QUERY_TOO_COMPLEX',
            complexity,
            maxComplexity,
          },
        }
      );
    }
  }

  validateBatchSize(operations: any[]): void {
    if (operations.length > this.config.maxBatchSize) {
      throw new GraphQLError(
        `Batch size of ${operations.length} exceeds maximum allowed size of ${this.config.maxBatchSize}`,
        {
          extensions: {
            code: 'BATCH_TOO_LARGE',
            batchSize: operations.length,
            maxBatchSize: this.config.maxBatchSize,
          },
        }
      );
    }
  }

  blockIntrospection(req: Request): void {
    if (!this.config.disableIntrospection) return;

    const query = req.body?.query || '';
    
    if (
      query.includes('__schema') ||
      query.includes('__type') ||
      query.includes('IntrospectionQuery')
    ) {
      throw new GraphQLError('Introspection is disabled', {
        extensions: {
          code: 'INTROSPECTION_DISABLED',
        },
      });
    }
  }

  rateLimitMutations(operations: any[], maxMutations: number = 5): void {
    const mutationCount = operations.filter(
      (op) => op.operation === 'mutation'
    ).length;

    if (mutationCount > maxMutations) {
      throw new GraphQLError(
        `Too many mutations in single request: ${mutationCount} (max: ${maxMutations})`,
        {
          extensions: {
            code: 'TOO_MANY_MUTATIONS',
            mutationCount,
            maxMutations,
          },
        }
      );
    }
  }

  private calculateDepth(node: any, currentDepth: number = 0): number {
    if (!node || typeof node !== 'object') return currentDepth;

    if (node.selectionSet?.selections) {
      const depths = node.selectionSet.selections.map((selection: any) =>
        this.calculateDepth(selection, currentDepth + 1)
      );
      return Math.max(...depths, currentDepth);
    }

    return currentDepth;
  }

  private calculateComplexity(node: any, multiplier: number = 1): number {
    if (!node || typeof node !== 'object') return 0;

    let complexity = multiplier;

    if (node.selectionSet?.selections) {
      for (const selection of node.selectionSet.selections) {
        const fieldMultiplier = this.getFieldMultiplier(selection);
        complexity += this.calculateComplexity(selection, multiplier * fieldMultiplier);
      }
    }

    return complexity;
  }

  private getFieldMultiplier(selection: any): number {
    const fieldName = selection.name?.value || '';
    
    if (fieldName.endsWith('Connection') || fieldName.endsWith('List')) {
      return 10;
    }
    
    if (selection.arguments?.length > 0) {
      const limitArg = selection.arguments.find(
        (arg: any) => arg.name.value === 'limit' || arg.name.value === 'first'
      );
      if (limitArg?.value?.value) {
        return Math.min(parseInt(limitArg.value.value, 10), 100);
      }
    }

    return 1;
  }

  sanitizeError(error: any): any {
    if (process.env.NODE_ENV === 'production') {
      return {
        message: 'An error occurred',
        extensions: {
          code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
        },
      };
    }

    return error;
  }

  logQuery(req: Request, userId?: string): void {
    if (!this.config.enableQueryLogging) return;

    const query = req.body?.query || '';
    const variables = req.body?.variables || {};
    
    logger.info("GraphQL query", {
      timestamp: new Date().toISOString(),
      userId,
      ip: req.ip,
      query: query.substring(0, 500),
      variables: JSON.stringify(variables).substring(0, 200),
      requestId: (req as any).requestId,
    });
  }
}

export const createGraphQLSecurityMiddleware = (config?: Partial<SecurityConfig>) => {
  return new GraphQLSecurityMiddleware(config);
};

export default GraphQLSecurityMiddleware;
