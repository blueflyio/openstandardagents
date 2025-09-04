/**
 * OSSA Observability Integration
 * 
 * Main entry point for OSSA observability features including:
 * - OpenLLMetry/Traceloop integration
 * - Langfuse analytics
 * - Automatic instrumentation
 * - Dashboard and monitoring
 */

// Core observability components
export { 
  OSSATracer, 
  getOSSATracer, 
  initializeOSSATracer 
} from './middleware/ossa-tracer.js';

export { 
  OSSAAutoInstrumentation,
  initializeOSSAInstrumentation,
  getOSSAInstrumentation,
  shutdownOSSAInstrumentation 
} from './instrumentation/auto-instrument.js';

// Enhanced LangChain integration
export {
  ObservableLangChainAgentFactory,
  ObservableChainComposer
} from './instrumentation/langchain-enhanced.js';

// Dashboard
export { default as OSSAObservabilityDashboard } from './dashboards/express-dashboard.js';

// Configuration
export {
  ObservabilityConfigProcessor,
  DEFAULT_OBSERVABILITY_CONFIG,
  OBSERVABILITY_SCHEMA
} from './config/observability-schema.js';

/**
 * Initialize complete OSSA observability stack
 */
export async function initializeOSSAObservability(options = {}) {
  const {
    agentConfig = {},
    enableDashboard = false,
    enableAutoInstrumentation = true,
    tracingOptions = {},
    dashboardOptions = {}
  } = options;

  console.log('[OSSA Observability] Initializing observability stack...');

  try {
    // 1. Initialize configuration
    const { ObservabilityConfigProcessor } = await import('./config/observability-schema.js');
    const obsConfig = ObservabilityConfigProcessor.extractFromOSSA(agentConfig);
    console.log('[OSSA Observability] Configuration processed');

    // 2. Initialize auto-instrumentation if enabled
    let instrumentation = null;
    if (enableAutoInstrumentation && obsConfig.observability.tracing.enabled) {
      const { initializeOSSAInstrumentation } = await import('./instrumentation/auto-instrument.js');
      instrumentation = await initializeOSSAInstrumentation({
        serviceName: obsConfig.observability.tracing.serviceName,
        serviceVersion: obsConfig.observability.version,
        environment: obsConfig.observability.tracing.environment,
        ...tracingOptions
      });
      console.log('[OSSA Observability] Auto-instrumentation initialized');
    }

    // 3. Initialize main tracer
    const { initializeOSSATracer } = await import('./middleware/ossa-tracer.js');
    const tracer = await initializeOSSATracer({
      serviceName: obsConfig.observability.tracing.serviceName,
      version: obsConfig.observability.version,
      enableTraceloop: obsConfig.observability.tracing.traceloop.enabled,
      enableLangfuse: obsConfig.observability.tracing.langfuse.enabled
    });
    console.log('[OSSA Observability] Main tracer initialized');

    // 4. Initialize dashboard if requested
    let dashboard = null;
    if (enableDashboard && obsConfig.observability.dashboard.enabled) {
      const { default: OSSAObservabilityDashboard } = await import('./dashboards/express-dashboard.js');
      dashboard = new OSSAObservabilityDashboard({
        port: obsConfig.observability.dashboard.port,
        refreshInterval: obsConfig.observability.dashboard.refreshInterval,
        ...dashboardOptions
      });
      await dashboard.start();
      console.log('[OSSA Observability] Dashboard started');
    }

    // 5. Create enhanced agent factory
    const { ObservableLangChainAgentFactory } = await import('./instrumentation/langchain-enhanced.js');
    const agentFactory = new ObservableLangChainAgentFactory({
      tracing: {
        trackTokenUsage: obsConfig.observability.metrics.builtInMetrics.llmTokenUsage,
        trackLatency: obsConfig.observability.metrics.builtInMetrics.agentLatency,
        trackErrors: obsConfig.observability.metrics.builtInMetrics.agentErrors,
        trackChainExecution: true
      }
    });

    const observabilityStack = {
      config: obsConfig,
      instrumentation,
      tracer,
      dashboard,
      agentFactory,
      
      // Utility methods
      async shutdown() {
        console.log('[OSSA Observability] Shutting down observability stack...');
        
        if (dashboard) {
          await dashboard.stop();
        }
        
        if (tracer) {
          await tracer.shutdown();
        }
        
        if (instrumentation) {
          const { shutdownOSSAInstrumentation } = await import('./instrumentation/auto-instrument.js');
          await shutdownOSSAInstrumentation();
        }
        
        console.log('[OSSA Observability] Observability stack shutdown complete');
      },
      
      getHealthStatus() {
        return {
          instrumentation: instrumentation?.initialized || false,
          tracer: tracer?.initialized || false,
          dashboard: dashboard?.server ? 'running' : 'stopped',
          config: {
            tracingEnabled: obsConfig.observability.tracing.enabled,
            metricsEnabled: obsConfig.observability.metrics.enabled,
            loggingEnabled: obsConfig.observability.logging.enabled,
            dashboardEnabled: obsConfig.observability.dashboard.enabled
          },
          providers: {
            traceloop: obsConfig.observability.tracing.traceloop.enabled,
            langfuse: obsConfig.observability.tracing.langfuse.enabled,
            openTelemetry: obsConfig.observability.tracing.openTelemetry.enabled
          },
          timestamp: new Date().toISOString()
        };
      },
      
      updateMetrics(type, data) {
        if (dashboard) {
          dashboard.updateMetrics(type, data);
        }
      }
    };

    console.log('[OSSA Observability] Observability stack initialization complete');
    
    // Register shutdown handlers
    const gracefulShutdown = async () => {
      await observabilityStack.shutdown();
      process.exit(0);
    };
    
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    return observabilityStack;

  } catch (error) {
    console.error('[OSSA Observability] Failed to initialize observability stack:', error);
    throw error;
  }
}

/**
 * Quick setup for development environments
 */
export async function setupDevelopmentObservability(agentName = 'dev-agent') {
  const { ObservabilityConfigProcessor } = await import('./config/observability-schema.js');
  const devConfig = ObservabilityConfigProcessor.generateEnvironmentConfig('development', agentName);
  
  return await initializeOSSAObservability({
    agentConfig: devConfig,
    enableDashboard: true,
    enableAutoInstrumentation: true,
    tracingOptions: {
      enableConsoleExport: true
    }
  });
}

/**
 * Quick setup for production environments
 */
export async function setupProductionObservability(agentConfig) {
  const { ObservabilityConfigProcessor } = await import('./config/observability-schema.js');
  const validation = ObservabilityConfigProcessor.validate(agentConfig);
  
  if (!validation.isValid) {
    throw new Error(`Invalid observability configuration: ${validation.errors.join(', ')}`);
  }
  
  if (validation.warnings.length > 0) {
    console.warn('[OSSA Observability] Configuration warnings:', validation.warnings);
  }
  
  return await initializeOSSAObservability({
    agentConfig,
    enableDashboard: false,
    enableAutoInstrumentation: true,
    tracingOptions: {
      enableConsoleExport: false
    }
  });
}

/**
 * Middleware factory for Express applications
 */
export function createOSSAObservabilityMiddleware(observabilityStack) {
  return (req, res, next) => {
    // Add observability context to request
    req.ossa = {
      tracer: observabilityStack.tracer,
      updateMetrics: observabilityStack.updateMetrics.bind(observabilityStack),
      config: observabilityStack.config
    };
    
    // Track HTTP requests
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      observabilityStack.updateMetrics('http_request', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration
      });
    });
    
    next();
  };
}

// Version information
export const VERSION = '0.1.8';
export const SUPPORTED_PROVIDERS = ['traceloop', 'langfuse', 'opentelemetry'];
export const SUPPORTED_EXPORTERS = ['console', 'otlp', 'jaeger', 'zipkin'];

export default {
  initializeOSSAObservability,
  setupDevelopmentObservability,
  setupProductionObservability,
  createOSSAObservabilityMiddleware,
  VERSION,
  SUPPORTED_PROVIDERS,
  SUPPORTED_EXPORTERS
};