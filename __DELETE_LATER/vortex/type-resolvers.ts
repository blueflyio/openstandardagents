/**
 * Type-Safe Token Resolvers with Strict Boundaries
 * Implements CONTEXT/DATA/STATE/METRICS/TEMPORAL token type isolation
 */

import {
  VortexToken,
  TokenType,
  TokenResolver,
  ResolverContext,
  ResolverResult,
  CachePolicy,
  ValidationResult,
  TokenError
} from './token-types';

/**
 * Abstract base resolver with type-safe boundaries
 */
abstract class BaseTypeResolver implements TokenResolver {
  abstract id: string;
  abstract type: TokenType;
  abstract namespace: string;
  abstract cachePolicy: CachePolicy;
  dependencies: string[] = [];

  abstract resolve(token: VortexToken, context: ResolverContext): Promise<ResolverResult>;
  abstract validate(token: VortexToken): ValidationResult;

  protected createError(code: string, message: string, category: any = 'resolution'): TokenError {
    return {
      code,
      message,
      category,
      retryable: false,
      fallbackAvailable: false
    };
  }

  protected createSuccessResult(
    value: any,
    resolveTime: number,
    tokensSaved: number = 50,
    cacheHit: boolean = false
  ): ResolverResult {
    return {
      success: true,
      resolvedValue: value,
      dependencies: this.dependencies,
      metadata: {
        resolveTime,
        cacheHit,
        fallbackUsed: false,
        costImpact: {
          tokensSaved,
          computeUnitsUsed: 1,
          cacheOperations: cacheHit ? 1 : 0,
          vectorOperations: 0
        }
      }
    };
  }

  protected validateTokenBoundary(token: VortexToken): ValidationResult {
    const errors: TokenError[] = [];

    if (token.type !== this.type) {
      errors.push(this.createError(
        'TYPE_BOUNDARY_VIOLATION',
        `Token type ${token.type} not allowed in ${this.type} resolver`,
        'validation'
      ));
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: [],
      metadata: {
        validatedAt: new Date(),
        validator: this.id,
        version: '1.0',
        schemaCompliance: errors.length === 0
      }
    };
  }
}

/**
 * CONTEXT Token Resolver - Handles workflow and session context
 * Boundary: Only resolves contextual information, no data manipulation
 */
export class ContextTokenResolver extends BaseTypeResolver {
  id = 'context-resolver-v1';
  type = TokenType.CONTEXT;
  namespace = 'workflow';
  cachePolicy = CachePolicy.MEDIUM_TERM;

  private contextStore = new Map<string, ContextData>();

  async resolve(token: VortexToken, context: ResolverContext): Promise<ResolverResult> {
    const startTime = Date.now();

    try {
      // Parse token structure: {CONTEXT:workflow:current:agent-roles}
      const [, namespace, scope, identifier] = token.placeholder.match(/{CONTEXT:([^:}]+):([^:}]+):([^}]+)}/) || [];
      
      if (!namespace || !scope || !identifier) {
        return {
          success: false,
          resolvedValue: null,
          dependencies: [],
          metadata: {
            resolveTime: Date.now() - startTime,
            cacheHit: false,
            fallbackUsed: false,
            costImpact: { tokensSaved: 0, computeUnitsUsed: 1, cacheOperations: 0, vectorOperations: 0 }
          },
          error: this.createError('MALFORMED_TOKEN', 'Context token format is invalid')
        };
      }

      // Resolve based on context type
      let resolvedValue: any;

      switch (scope) {
        case 'current':
          resolvedValue = await this.resolveCurrentContext(identifier, context);
          break;
        case 'session':
          resolvedValue = await this.resolveSessionContext(identifier, context);
          break;
        case 'workflow':
          resolvedValue = await this.resolveWorkflowContext(identifier, context);
          break;
        case 'agent':
          resolvedValue = await this.resolveAgentContext(identifier, context);
          break;
        default:
          throw new Error(`Unknown context scope: ${scope}`);
      }

      const resolveTime = Date.now() - startTime;
      return this.createSuccessResult(resolvedValue, Math.max(1, resolveTime), 75);
    } catch (error) {
      return {
        success: false,
        resolvedValue: null,
        dependencies: [],
        metadata: {
          resolveTime: Date.now() - startTime,
          cacheHit: false,
          fallbackUsed: false,
          costImpact: { tokensSaved: 0, computeUnitsUsed: 1, cacheOperations: 0, vectorOperations: 0 }
        },
        error: this.createError('CONTEXT_RESOLUTION_FAILED', `Failed to resolve context: ${error}`)
      };
    }
  }

  validate(token: VortexToken): ValidationResult {
    const baseValidation = this.validateTokenBoundary(token);
    if (!baseValidation.valid) return baseValidation;

    // Additional context-specific validation
    const contextPattern = /{CONTEXT:([^:}]+):([^:}]+):([^}]+)}/;
    if (!contextPattern.test(token.placeholder)) {
      baseValidation.errors.push(this.createError(
        'INVALID_CONTEXT_PATTERN',
        'Context token must follow pattern {CONTEXT:namespace:scope:identifier}',
        'validation'
      ));
      baseValidation.valid = false;
    }

    return baseValidation;
  }

  // Context resolution methods
  private async resolveCurrentContext(identifier: string, context: ResolverContext): Promise<string> {
    switch (identifier) {
      case 'agent-roles':
        return JSON.stringify([context.agentId, 'orchestrator', 'resolver']);
      case 'user-preferences':
        return JSON.stringify({ theme: 'dark', language: 'en' });
      case 'active-workflows':
        return JSON.stringify([context.workflowId]);
      default:
        return `context-${identifier}`;
    }
  }

  private async resolveSessionContext(identifier: string, context: ResolverContext): Promise<string> {
    return `session-${identifier}-${context.agentId}`;
  }

  private async resolveWorkflowContext(identifier: string, context: ResolverContext): Promise<string> {
    return `workflow-${identifier}-${context.workflowId}`;
  }

  private async resolveAgentContext(identifier: string, context: ResolverContext): Promise<string> {
    return `agent-${identifier}-${context.agentId}`;
  }
}

/**
 * DATA Token Resolver - Handles structured data artifacts
 * Boundary: Only resolves data references, no state modification
 */
export class DataTokenResolver extends BaseTypeResolver {
  id = 'data-resolver-v1';
  type = TokenType.DATA;
  namespace = 'artifacts';
  cachePolicy = CachePolicy.LONG_TERM;

  private dataStore = new Map<string, DataArtifact>();

  async resolve(token: VortexToken, context: ResolverContext): Promise<ResolverResult> {
    const startTime = Date.now();

    try {
      // Parse token: {DATA:artifact:v1:user-requirements}
      const [, dataType, version, identifier] = token.placeholder.match(/{DATA:([^:}]+):([^:}]+):([^}]+)}/) || [];

      if (!dataType || !version || !identifier) {
        return {
          success: false,
          resolvedValue: null,
          dependencies: [],
          metadata: {
            resolveTime: Date.now() - startTime,
            cacheHit: false,
            fallbackUsed: false,
            costImpact: { tokensSaved: 0, computeUnitsUsed: 1, cacheOperations: 0, vectorOperations: 0 }
          },
          error: this.createError('MALFORMED_DATA_TOKEN', 'Data token format is invalid')
        };
      }

      // Use vector search if available for semantic data matching
      let resolvedValue: any;
      if (context.qdrantClient) {
        resolvedValue = await this.resolveWithVectorSearch(dataType, version, identifier, context);
      } else {
        resolvedValue = await this.resolveFromDataStore(dataType, version, identifier, context);
      }

      return this.createSuccessResult(resolvedValue, Date.now() - startTime, 100);
    } catch (error) {
      return {
        success: false,
        resolvedValue: null,
        dependencies: [],
        metadata: {
          resolveTime: Date.now() - startTime,
          cacheHit: false,
          fallbackUsed: false,
          costImpact: { tokensSaved: 0, computeUnitsUsed: 1, cacheOperations: 0, vectorOperations: 0 }
        },
        error: this.createError('DATA_RESOLUTION_FAILED', `Failed to resolve data: ${error}`)
      };
    }
  }

  validate(token: VortexToken): ValidationResult {
    const baseValidation = this.validateTokenBoundary(token);
    if (!baseValidation.valid) return baseValidation;

    const dataPattern = /{DATA:([^:}]+):([^:}]+):([^}]+)}/;
    if (!dataPattern.test(token.placeholder)) {
      baseValidation.errors.push(this.createError(
        'INVALID_DATA_PATTERN',
        'Data token must follow pattern {DATA:type:version:identifier}',
        'validation'
      ));
      baseValidation.valid = false;
    }

    return baseValidation;
  }

  private async resolveWithVectorSearch(
    dataType: string,
    version: string,
    identifier: string,
    context: ResolverContext
  ): Promise<any> {
    try {
      const searchResult = await context.qdrantClient.search('data-artifacts', {
        filter: {
          must: [
            { key: 'dataType', match: { value: dataType } },
            { key: 'identifier', match: { value: identifier } }
          ]
        },
        limit: 1
      });

      if (searchResult.length > 0) {
        return searchResult[0].payload.data;
      }
    } catch (error) {
      console.warn(`Vector search failed, falling back to data store: ${error}`);
    }

    return this.resolveFromDataStore(dataType, version, identifier, context);
  }

  private async resolveFromDataStore(
    dataType: string,
    version: string,
    identifier: string,
    context: ResolverContext
  ): Promise<any> {
    const key = `${dataType}:${version}:${identifier}`;
    const artifact = this.dataStore.get(key);

    if (artifact) {
      return artifact.data;
    }

    // Generate mock data based on identifier
    switch (identifier) {
      case 'user-requirements':
        return { requirements: ['security', 'scalability', 'performance'] };
      case 'api-spec':
        return { version: '3.0.1', endpoints: ['/api/v1/agents', '/api/v1/tokens'] };
      case 'schema':
        return { type: 'object', properties: { id: { type: 'string' } } };
      default:
        return { data: `${dataType}-${identifier}`, version };
    }
  }
}

/**
 * STATE Token Resolver - Handles agent and workflow state
 * Boundary: Only reads state, never modifies (read-only principle)
 */
export class StateTokenResolver extends BaseTypeResolver {
  id = 'state-resolver-v1';
  type = TokenType.STATE;
  namespace = 'agents';
  cachePolicy = CachePolicy.SHORT_TERM; // State changes frequently

  private stateStore = new Map<string, AgentState>();

  async resolve(token: VortexToken, context: ResolverContext): Promise<ResolverResult> {
    const startTime = Date.now();

    try {
      // Parse token: {STATE:agent:orchestrator:current-plan}
      const [, stateType, agent, stateKey] = token.placeholder.match(/{STATE:([^:}]+):([^:}]+):([^}]+)}/) || [];

      if (!stateType || !agent || !stateKey) {
        return {
          success: false,
          resolvedValue: null,
          dependencies: [],
          metadata: {
            resolveTime: Date.now() - startTime,
            cacheHit: false,
            fallbackUsed: false,
            costImpact: { tokensSaved: 0, computeUnitsUsed: 1, cacheOperations: 0, vectorOperations: 0 }
          },
          error: this.createError('MALFORMED_STATE_TOKEN', 'State token format is invalid')
        };
      }

      let resolvedValue: any;

      switch (stateType) {
        case 'agent':
          resolvedValue = await this.resolveAgentState(agent, stateKey, context);
          break;
        case 'workflow':
          resolvedValue = await this.resolveWorkflowState(agent, stateKey, context);
          break;
        case 'system':
          resolvedValue = await this.resolveSystemState(agent, stateKey, context);
          break;
        default:
          throw new Error(`Unknown state type: ${stateType}`);
      }

      return this.createSuccessResult(resolvedValue, Date.now() - startTime, 25);
    } catch (error) {
      return {
        success: false,
        resolvedValue: null,
        dependencies: [],
        metadata: {
          resolveTime: Date.now() - startTime,
          cacheHit: false,
          fallbackUsed: false,
          costImpact: { tokensSaved: 0, computeUnitsUsed: 1, cacheOperations: 0, vectorOperations: 0 }
        },
        error: this.createError('STATE_RESOLUTION_FAILED', `Failed to resolve state: ${error}`)
      };
    }
  }

  validate(token: VortexToken): ValidationResult {
    const baseValidation = this.validateTokenBoundary(token);
    if (!baseValidation.valid) return baseValidation;

    const statePattern = /{STATE:([^:}]+):([^:}]+):([^}]+)}/;
    if (!statePattern.test(token.placeholder)) {
      baseValidation.errors.push(this.createError(
        'INVALID_STATE_PATTERN',
        'State token must follow pattern {STATE:type:agent:key}',
        'validation'
      ));
      baseValidation.valid = false;
    }

    return baseValidation;
  }

  private async resolveAgentState(agent: string, stateKey: string, context: ResolverContext): Promise<any> {
    const stateId = `${agent}:${stateKey}`;
    const state = this.stateStore.get(stateId);

    if (state) {
      return state.value;
    }

    // Generate mock state based on key
    switch (stateKey) {
      case 'current-plan':
        return { phase: 'execution', steps: ['analyze', 'implement', 'test'] };
      case 'iteration-count':
        return { count: 3, maxIterations: 10 };
      case 'status':
        return { status: 'active', health: 'good' };
      default:
        return { state: stateKey, agent, timestamp: Date.now() };
    }
  }

  private async resolveWorkflowState(workflow: string, stateKey: string, context: ResolverContext): Promise<any> {
    return { workflow, key: stateKey, state: 'active', progress: 0.6 };
  }

  private async resolveSystemState(system: string, stateKey: string, context: ResolverContext): Promise<any> {
    return { system, key: stateKey, uptime: Date.now() - 3600000, load: 0.3 };
  }
}

/**
 * METRICS Token Resolver - Handles performance and cost metrics
 * Boundary: Only provides read-only metrics, no metric computation
 */
export class MetricsTokenResolver extends BaseTypeResolver {
  id = 'metrics-resolver-v1';
  type = TokenType.METRICS;
  namespace = 'telemetry';
  cachePolicy = CachePolicy.SHORT_TERM;

  private metricsStore = new Map<string, MetricData>();

  async resolve(token: VortexToken, context: ResolverContext): Promise<ResolverResult> {
    const startTime = Date.now();

    try {
      // Parse token: {METRICS:cost:current:token-usage}
      const [, category, timeframe, metric] = token.placeholder.match(/{METRICS:([^:}]+):([^:}]+):([^}]+)}/) || [];

      if (!category || !timeframe || !metric) {
        return {
          success: false,
          resolvedValue: null,
          dependencies: [],
          metadata: {
            resolveTime: Date.now() - startTime,
            cacheHit: false,
            fallbackUsed: false,
            costImpact: { tokensSaved: 0, computeUnitsUsed: 1, cacheOperations: 0, vectorOperations: 0 }
          },
          error: this.createError('MALFORMED_METRICS_TOKEN', 'Metrics token format is invalid')
        };
      }

      let resolvedValue: any;

      switch (category) {
        case 'cost':
          resolvedValue = await this.resolveCostMetrics(timeframe, metric, context);
          break;
        case 'performance':
          resolvedValue = await this.resolvePerformanceMetrics(timeframe, metric, context);
          break;
        case 'usage':
          resolvedValue = await this.resolveUsageMetrics(timeframe, metric, context);
          break;
        default:
          throw new Error(`Unknown metrics category: ${category}`);
      }

      return this.createSuccessResult(resolvedValue, Date.now() - startTime, 30);
    } catch (error) {
      return {
        success: false,
        resolvedValue: null,
        dependencies: [],
        metadata: {
          resolveTime: Date.now() - startTime,
          cacheHit: false,
          fallbackUsed: false,
          costImpact: { tokensSaved: 0, computeUnitsUsed: 1, cacheOperations: 0, vectorOperations: 0 }
        },
        error: this.createError('METRICS_RESOLUTION_FAILED', `Failed to resolve metrics: ${error}`)
      };
    }
  }

  validate(token: VortexToken): ValidationResult {
    const baseValidation = this.validateTokenBoundary(token);
    if (!baseValidation.valid) return baseValidation;

    const metricsPattern = /{METRICS:([^:}]+):([^:}]+):([^}]+)}/;
    if (!metricsPattern.test(token.placeholder)) {
      baseValidation.errors.push(this.createError(
        'INVALID_METRICS_PATTERN',
        'Metrics token must follow pattern {METRICS:category:timeframe:metric}',
        'validation'
      ));
      baseValidation.valid = false;
    }

    return baseValidation;
  }

  private async resolveCostMetrics(timeframe: string, metric: string, context: ResolverContext): Promise<any> {
    switch (metric) {
      case 'token-usage':
        return { tokens: 15420, cost: 0.0231, savings: 0.0156 };
      case 'compute-units':
        return { units: 245, costPerUnit: 0.001, total: 0.245 };
      default:
        return { metric, timeframe, value: Math.random() * 100 };
    }
  }

  private async resolvePerformanceMetrics(timeframe: string, metric: string, context: ResolverContext): Promise<any> {
    switch (metric) {
      case 'response-time':
        return { avg: 145, p95: 230, p99: 450 };
      case 'throughput':
        return { requestsPerSecond: 25, peakRps: 78 };
      default:
        return { metric, timeframe, value: Math.random() * 1000 };
    }
  }

  private async resolveUsageMetrics(timeframe: string, metric: string, context: ResolverContext): Promise<any> {
    return { metric, timeframe, activeUsers: 12, totalRequests: 1847 };
  }
}

/**
 * TEMPORAL Token Resolver - Handles time-based data and schedules
 * Boundary: Only provides temporal data, no scheduling or time manipulation
 */
export class TemporalTokenResolver extends BaseTypeResolver {
  id = 'temporal-resolver-v1';
  type = TokenType.TEMPORAL;
  namespace = 'time';
  cachePolicy = CachePolicy.NO_CACHE; // Time is always fresh

  async resolve(token: VortexToken, context: ResolverContext): Promise<ResolverResult> {
    const startTime = Date.now();

    try {
      // Parse token: {TEMPORAL:schedule:daily:agent-rotation}
      const [, temporalType, frequency, identifier] = token.placeholder.match(/{TEMPORAL:([^:}]+):([^:}]+):([^}]+)}/) || [];

      if (!temporalType || !frequency || !identifier) {
        return {
          success: false,
          resolvedValue: null,
          dependencies: [],
          metadata: {
            resolveTime: Date.now() - startTime,
            cacheHit: false,
            fallbackUsed: false,
            costImpact: { tokensSaved: 0, computeUnitsUsed: 1, cacheOperations: 0, vectorOperations: 0 }
          },
          error: this.createError('MALFORMED_TEMPORAL_TOKEN', 'Temporal token format is invalid')
        };
      }

      let resolvedValue: any;

      switch (temporalType) {
        case 'schedule':
          resolvedValue = await this.resolveScheduleData(frequency, identifier, context);
          break;
        case 'deadline':
          resolvedValue = await this.resolveDeadlineData(frequency, identifier, context);
          break;
        case 'timestamp':
          resolvedValue = await this.resolveTimestampData(frequency, identifier, context);
          break;
        default:
          throw new Error(`Unknown temporal type: ${temporalType}`);
      }

      return this.createSuccessResult(resolvedValue, Date.now() - startTime, 0); // No tokens saved for temporal
    } catch (error) {
      return {
        success: false,
        resolvedValue: null,
        dependencies: [],
        metadata: {
          resolveTime: Date.now() - startTime,
          cacheHit: false,
          fallbackUsed: false,
          costImpact: { tokensSaved: 0, computeUnitsUsed: 1, cacheOperations: 0, vectorOperations: 0 }
        },
        error: this.createError('TEMPORAL_RESOLUTION_FAILED', `Failed to resolve temporal data: ${error}`)
      };
    }
  }

  validate(token: VortexToken): ValidationResult {
    const baseValidation = this.validateTokenBoundary(token);
    if (!baseValidation.valid) return baseValidation;

    const temporalPattern = /{TEMPORAL:([^:}]+):([^:}]+):([^}]+)}/;
    if (!temporalPattern.test(token.placeholder)) {
      baseValidation.errors.push(this.createError(
        'INVALID_TEMPORAL_PATTERN',
        'Temporal token must follow pattern {TEMPORAL:type:frequency:identifier}',
        'validation'
      ));
      baseValidation.valid = false;
    }

    return baseValidation;
  }

  private async resolveScheduleData(frequency: string, identifier: string, context: ResolverContext): Promise<any> {
    const now = new Date();
    
    switch (identifier) {
      case 'agent-rotation':
        return {
          nextRotation: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          currentAgent: context.agentId,
          rotationFrequency: frequency
        };
      case 'backup-schedule':
        return {
          nextBackup: new Date(now.getTime() + 6 * 60 * 60 * 1000),
          frequency,
          enabled: true
        };
      default:
        return {
          schedule: identifier,
          frequency,
          nextExecution: new Date(now.getTime() + 60 * 60 * 1000)
        };
    }
  }

  private async resolveDeadlineData(frequency: string, identifier: string, context: ResolverContext): Promise<any> {
    return {
      deadline: identifier,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      priority: frequency === 'urgent' ? 'high' : 'normal',
      remainingTime: '7 days'
    };
  }

  private async resolveTimestampData(frequency: string, identifier: string, context: ResolverContext): Promise<any> {
    return {
      timestamp: new Date(),
      identifier,
      timezone: 'UTC',
      epoch: Date.now()
    };
  }
}

// Supporting interfaces
interface ContextData {
  key: string;
  value: any;
  scope: string;
  updatedAt: Date;
}

interface DataArtifact {
  id: string;
  type: string;
  version: string;
  data: any;
  createdAt: Date;
  updatedAt: Date;
}

interface AgentState {
  agentId: string;
  key: string;
  value: any;
  lastModified: Date;
  version: number;
}

interface MetricData {
  category: string;
  metric: string;
  value: any;
  timestamp: Date;
  tags: Record<string, string>;
}

// Export all resolvers
export const TYPE_RESOLVERS = {
  [TokenType.CONTEXT]: ContextTokenResolver,
  [TokenType.DATA]: DataTokenResolver,
  [TokenType.STATE]: StateTokenResolver,
  [TokenType.METRICS]: MetricsTokenResolver,
  [TokenType.TEMPORAL]: TemporalTokenResolver
};