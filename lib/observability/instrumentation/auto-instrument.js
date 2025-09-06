/**
 * OSSA Automatic Instrumentation
 * 
 * Provides automatic instrumentation for OSSA agents with minimal configuration.
 * Integrates with OpenLLMetry, Traceloop, and Langfuse.
 */

// Import instrumentation packages BEFORE any other imports
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter, BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import resourcesPkg from '@opentelemetry/resources';
import semanticConventionsPkg from '@opentelemetry/semantic-conventions';

const { Resource } = resourcesPkg;
const { SemanticResourceAttributes } = semanticConventionsPkg;

// Traceloop instrumentations
import { AnthropicInstrumentation } from '@traceloop/instrumentation-anthropic';
import { OpenAIInstrumentation } from '@traceloop/instrumentation-openai';
import { LangChainInstrumentation } from '@traceloop/instrumentation-langchain';

/**
 * OSSA Auto-Instrumentation Configuration
 */
class OSSAAutoInstrumentation {
  constructor(options = {}) {
    this.options = {
      serviceName: 'ossa-agent',
      serviceVersion: '0.1.8',
      environment: process.env.NODE_ENV || 'development',
      enableConsoleExport: process.env.NODE_ENV === 'development',
      enableTraceloop: true,
      enableLangfuse: true,
      instrumentations: {
        http: true,
        express: true,
        fs: true,
        anthropic: true,
        openai: true,
        langchain: true
      },
      ...options
    };

    this.sdk = null;
    this.initialized = false;
  }

  /**
   * Initialize automatic instrumentation
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Configure instrumentations - simplified approach
      const instrumentations = this.createInstrumentations();

      // Create SDK with basic configuration
      this.sdk = new NodeSDK({
        instrumentations,
        spanProcessor: this.createSpanProcessor()
      });

      // Initialize SDK
      await this.sdk.start();
      
      this.initialized = true;
      console.log('[OSSA Auto-Instrumentation] Initialized successfully');
      
      // Register process handlers
      this.registerProcessHandlers();
      
    } catch (error) {
      console.error('[OSSA Auto-Instrumentation] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Create instrumentation configuration
   */
  createInstrumentations() {
    const instrumentations = [];

    // Add Node.js auto-instrumentations
    if (this.options.instrumentations.http || 
        this.options.instrumentations.express || 
        this.options.instrumentations.fs) {
      instrumentations.push(
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-http': {
            enabled: this.options.instrumentations.http
          },
          '@opentelemetry/instrumentation-express': {
            enabled: this.options.instrumentations.express
          },
          '@opentelemetry/instrumentation-fs': {
            enabled: this.options.instrumentations.fs
          }
        })
      );
    }

    // Add LLM provider instrumentations
    if (this.options.instrumentations.anthropic) {
      instrumentations.push(new AnthropicInstrumentation({
        enrichTokens: true,
        recordInputs: true,
        recordOutputs: true
      }));
    }

    if (this.options.instrumentations.openai) {
      instrumentations.push(new OpenAIInstrumentation({
        enrichTokens: true,
        recordInputs: true,
        recordOutputs: true
      }));
    }

    if (this.options.instrumentations.langchain) {
      instrumentations.push(new LangChainInstrumentation({
        recordInputs: true,
        recordOutputs: true,
        recordVectorStoreQueries: true
      }));
    }

    return instrumentations;
  }

  /**
   * Create span processor configuration
   */
  createSpanProcessor() {
    // Simple console exporter for development
    if (this.options.enableConsoleExport) {
      return new BatchSpanProcessor(new ConsoleSpanExporter());
    }

    // Default console exporter
    return new BatchSpanProcessor(new ConsoleSpanExporter());
  }

  /**
   * Parse OTLP headers from environment variable
   */
  parseHeaders(headersString) {
    const headers = {};
    headersString.split(',').forEach(header => {
      const [key, value] = header.split('=');
      if (key && value) {
        headers[key.trim()] = value.trim();
      }
    });
    return headers;
  }

  /**
   * Register process handlers for graceful shutdown
   */
  registerProcessHandlers() {
    const shutdown = async () => {
      try {
        await this.shutdown();
        process.exit(0);
      } catch (error) {
        console.error('[OSSA Auto-Instrumentation] Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  }

  /**
   * Shutdown instrumentation
   */
  async shutdown() {
    if (this.sdk) {
      await this.sdk.shutdown();
      console.log('[OSSA Auto-Instrumentation] Shutdown complete');
    }
  }

  /**
   * Get configuration for debugging
   */
  getConfiguration() {
    return {
      serviceName: this.options.serviceName,
      serviceVersion: this.options.serviceVersion,
      environment: this.options.environment,
      instrumentations: this.options.instrumentations,
      initialized: this.initialized,
      environmentVariables: {
        OTEL_EXPORTER_OTLP_ENDPOINT: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
        OTEL_EXPORTER_OTLP_HEADERS: process.env.OTEL_EXPORTER_OTLP_HEADERS,
        TRACELOOP_API_KEY: process.env.TRACELOOP_API_KEY ? '[SET]' : '[NOT SET]',
        LANGFUSE_PUBLIC_KEY: process.env.LANGFUSE_PUBLIC_KEY ? '[SET]' : '[NOT SET]',
        LANGFUSE_SECRET_KEY: process.env.LANGFUSE_SECRET_KEY ? '[SET]' : '[NOT SET]'
      }
    };
  }
}

// Global instance
let globalInstrumentation = null;

/**
 * Initialize OSSA auto-instrumentation
 * This should be called as early as possible in the application
 */
export async function initializeOSSAInstrumentation(options = {}) {
  if (!globalInstrumentation) {
    globalInstrumentation = new OSSAAutoInstrumentation(options);
    await globalInstrumentation.initialize();
  }
  return globalInstrumentation;
}

/**
 * Get global instrumentation instance
 */
export function getOSSAInstrumentation() {
  return globalInstrumentation;
}

/**
 * Shutdown instrumentation
 */
export async function shutdownOSSAInstrumentation() {
  if (globalInstrumentation) {
    await globalInstrumentation.shutdown();
    globalInstrumentation = null;
  }
}

export { OSSAAutoInstrumentation };