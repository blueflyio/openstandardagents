/**
 * OSSA Agent Tracing Middleware
 * 
 * Core tracing middleware for OSSA agents with support for:
 * - OpenLLMetry/Traceloop integration
 * - Langfuse analytics
 * - Performance metrics tracking
 * - Error monitoring
 */

import * as traceloop from '@traceloop/node-server-sdk';
import { Langfuse } from 'langfuse';
import otelApiPkg from '@opentelemetry/api';

const { trace, context, SpanStatusCode, SpanKind } = otelApiPkg;

class OSSATracer {
  constructor(options = {}) {
    this.options = {
      enableTraceloop: true,
      enableLangfuse: true,
      serviceName: 'ossa-agent',
      version: '0.1.8',
      environment: process.env.NODE_ENV || 'development',
      ...options
    };
    
    this.tracer = null;
    this.langfuse = null;
    this.initialized = false;
  }

  /**
   * Initialize all observability providers
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Initialize Traceloop/OpenLLMetry
      if (this.options.enableTraceloop) {
        await this.initializeTraceloop();
      }

      // Initialize Langfuse
      if (this.options.enableLangfuse) {
        await this.initializeLangfuse();
      }

      // Get OpenTelemetry tracer
      this.tracer = trace.getTracer('ossa-agent', this.options.version);
      
      this.initialized = true;
      console.log('[OSSA Tracer] Observability initialized successfully');
    } catch (error) {
      console.error('[OSSA Tracer] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Initialize Traceloop SDK
   */
  async initializeTraceloop() {
    const config = {
      appName: this.options.serviceName,
      apiKey: process.env.TRACELOOP_API_KEY,
      disableBatch: false,
      instrumentModules: {
        openAI: false, // Disable to avoid errors when OpenAI not installed
        anthropic: false, // Disable to avoid errors when Anthropic not installed
        langChain: false // Disable to avoid errors when LangChain not installed
      }
    };

    traceloop.initialize(config);
    console.log('[OSSA Tracer] Traceloop initialized');
  }

  /**
   * Initialize Langfuse
   */
  async initializeLangfuse() {
    if (!process.env.LANGFUSE_PUBLIC_KEY || !process.env.LANGFUSE_SECRET_KEY) {
      console.warn('[OSSA Tracer] Langfuse keys not found, skipping Langfuse initialization');
      return;
    }

    this.langfuse = new Langfuse({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com'
    });

    console.log('[OSSA Tracer] Langfuse initialized');
  }

  /**
   * Create a traced execution context for OSSA agent operations
   */
  async traceAgentExecution(agentId, operation, metadata = {}, fn) {
    if (!this.initialized) {
      await this.initialize();
    }

    const spanName = `ossa.agent.${operation}`;
    const span = this.tracer?.startSpan(spanName, {
      kind: SpanKind.INTERNAL,
      attributes: {
        'ossa.agent.id': agentId,
        'ossa.agent.operation': operation,
        'ossa.version': this.options.version,
        'ossa.environment': this.options.environment,
        ...this.flattenMetadata(metadata)
      }
    });

    // Create Langfuse trace if available
    let langfuseTrace = null;
    if (this.langfuse) {
      langfuseTrace = this.langfuse.trace({
        name: spanName,
        userId: agentId,
        metadata: {
          agent_id: agentId,
          operation: operation,
          ossa_version: this.options.version,
          ...metadata
        }
      });
    }

    const startTime = Date.now();

    try {
      // Execute the function within the trace context
      const result = await context.with(trace.setSpan(context.active(), span), async () => {
        return await fn({
          span,
          trace: langfuseTrace,
          tracer: this.tracer,
          langfuse: this.langfuse
        });
      });

      // Record success metrics
      const duration = Date.now() - startTime;
      span?.setAttributes({
        'ossa.execution.success': true,
        'ossa.execution.duration_ms': duration
      });
      span?.setStatus({ code: SpanStatusCode.OK });

      if (langfuseTrace) {
        langfuseTrace.update({
          output: result,
          metadata: {
            ...langfuseTrace.metadata,
            duration_ms: duration,
            success: true
          }
        });
      }

      return result;
    } catch (error) {
      // Record error metrics
      const duration = Date.now() - startTime;
      span?.setAttributes({
        'ossa.execution.success': false,
        'ossa.execution.duration_ms': duration,
        'ossa.execution.error': error.message
      });
      span?.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message
      });
      span?.recordException(error);

      if (langfuseTrace) {
        langfuseTrace.update({
          level: 'ERROR',
          statusMessage: error.message,
          metadata: {
            ...langfuseTrace.metadata,
            duration_ms: duration,
            success: false,
            error: error.message
          }
        });
      }

      throw error;
    } finally {
      span?.end();
      if (langfuseTrace) {
        await langfuseTrace.finalize();
      }
    }
  }

  /**
   * Trace LLM calls within OSSA agents
   */
  async traceLLMCall(provider, model, prompt, metadata = {}, fn) {
    if (!this.initialized) {
      await this.initialize();
    }

    const spanName = `ossa.llm.${provider}`;
    const span = this.tracer?.startSpan(spanName, {
      kind: SpanKind.CLIENT,
      attributes: {
        'llm.vendor': provider,
        'llm.request.model': model,
        'llm.request.type': 'completion',
        'ossa.llm.provider': provider,
        ...this.flattenMetadata(metadata)
      }
    });

    // Create Langfuse generation if available
    let langfuseGeneration = null;
    if (this.langfuse) {
      langfuseGeneration = this.langfuse.generation({
        name: `${provider}-${model}`,
        model: model,
        input: prompt,
        metadata: {
          provider: provider,
          ...metadata
        }
      });
    }

    const startTime = Date.now();

    try {
      const result = await context.with(trace.setSpan(context.active(), span), async () => {
        return await fn({
          span,
          generation: langfuseGeneration,
          tracer: this.tracer,
          langfuse: this.langfuse
        });
      });

      // Record LLM metrics
      const duration = Date.now() - startTime;
      span?.setAttributes({
        'llm.response.model': model,
        'ossa.llm.duration_ms': duration,
        'ossa.llm.success': true
      });

      if (result.usage) {
        span?.setAttributes({
          'llm.usage.prompt_tokens': result.usage.prompt_tokens || 0,
          'llm.usage.completion_tokens': result.usage.completion_tokens || 0,
          'llm.usage.total_tokens': result.usage.total_tokens || 0
        });
      }

      if (langfuseGeneration && result) {
        langfuseGeneration.update({
          output: result.content || result.text || result,
          usage: result.usage,
          metadata: {
            ...langfuseGeneration.metadata,
            duration_ms: duration
          }
        });
      }

      span?.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      span?.setAttributes({
        'ossa.llm.duration_ms': duration,
        'ossa.llm.success': false,
        'ossa.llm.error': error.message
      });
      span?.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message
      });
      span?.recordException(error);

      if (langfuseGeneration) {
        langfuseGeneration.update({
          level: 'ERROR',
          statusMessage: error.message,
          metadata: {
            ...langfuseGeneration.metadata,
            duration_ms: duration,
            error: error.message
          }
        });
      }

      throw error;
    } finally {
      span?.end();
      if (langfuseGeneration) {
        await langfuseGeneration.finalize();
      }
    }
  }

  /**
   * Trace MCP server operations
   */
  async traceMCPOperation(serverName, operation, metadata = {}, fn) {
    if (!this.initialized) {
      await this.initialize();
    }

    const spanName = `ossa.mcp.${operation}`;
    const span = this.tracer?.startSpan(spanName, {
      kind: SpanKind.CLIENT,
      attributes: {
        'ossa.mcp.server': serverName,
        'ossa.mcp.operation': operation,
        ...this.flattenMetadata(metadata)
      }
    });

    const startTime = Date.now();

    try {
      const result = await context.with(trace.setSpan(context.active(), span), async () => {
        return await fn({ span, tracer: this.tracer });
      });

      const duration = Date.now() - startTime;
      span?.setAttributes({
        'ossa.mcp.duration_ms': duration,
        'ossa.mcp.success': true
      });
      span?.setStatus({ code: SpanStatusCode.OK });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      span?.setAttributes({
        'ossa.mcp.duration_ms': duration,
        'ossa.mcp.success': false,
        'ossa.mcp.error': error.message
      });
      span?.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message
      });
      span?.recordException(error);

      throw error;
    } finally {
      span?.end();
    }
  }

  /**
   * Flatten nested metadata for span attributes
   */
  flattenMetadata(metadata, prefix = 'ossa.metadata') {
    const flattened = {};
    for (const [key, value] of Object.entries(metadata)) {
      const flatKey = `${prefix}.${key}`;
      if (typeof value === 'object' && value !== null) {
        Object.assign(flattened, this.flattenMetadata(value, flatKey));
      } else {
        flattened[flatKey] = String(value);
      }
    }
    return flattened;
  }

  /**
   * Shutdown observability providers
   */
  async shutdown() {
    try {
      if (this.langfuse) {
        await this.langfuse.shutdownAsync();
      }
      console.log('[OSSA Tracer] Observability shutdown complete');
    } catch (error) {
      console.error('[OSSA Tracer] Error during shutdown:', error);
    }
  }
}

// Singleton instance
let globalTracer = null;

/**
 * Get global OSSA tracer instance
 */
export function getOSSATracer(options = {}) {
  if (!globalTracer) {
    globalTracer = new OSSATracer(options);
  }
  return globalTracer;
}

/**
 * Initialize global OSSA tracer
 */
export async function initializeOSSATracer(options = {}) {
  const tracer = getOSSATracer(options);
  await tracer.initialize();
  return tracer;
}

export { OSSATracer };