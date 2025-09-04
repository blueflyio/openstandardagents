/**
 * OSSA Observability Configuration Schema
 * 
 * Defines the schema for observability configuration in agent.yml files
 * and provides validation and default configurations.
 */

/**
 * Default observability configuration
 */
export const DEFAULT_OBSERVABILITY_CONFIG = {
  observability: {
    enabled: true,
    version: '0.1.8',
    
    // Tracing configuration
    tracing: {
      enabled: true,
      serviceName: null, // Will default to agent name
      environment: process.env.NODE_ENV || 'development',
      sampleRate: 1.0,
      
      // OpenTelemetry configuration
      openTelemetry: {
        enabled: true,
        exporters: ['console'], // 'console', 'otlp', 'jaeger'
        endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || null,
        headers: {}
      },
      
      // Traceloop/OpenLLMetry configuration
      traceloop: {
        enabled: true,
        apiKey: process.env.TRACELOOP_API_KEY || null,
        endpoint: 'https://api.traceloop.com',
        batchSize: 100,
        flushInterval: 5000
      },
      
      // Langfuse configuration
      langfuse: {
        enabled: true,
        publicKey: process.env.LANGFUSE_PUBLIC_KEY || null,
        secretKey: process.env.LANGFUSE_SECRET_KEY || null,
        baseUrl: process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com',
        flushInterval: 10000
      }
    },
    
    // Metrics configuration
    metrics: {
      enabled: true,
      collectors: ['prometheus', 'custom'],
      
      // Built-in metrics
      builtInMetrics: {
        agentInvocations: true,
        agentLatency: true,
        agentErrors: true,
        llmTokenUsage: true,
        llmLatency: true,
        mcpOperations: true
      },
      
      // Custom metrics
      customMetrics: [],
      
      // Export configuration
      export: {
        prometheus: {
          enabled: false,
          port: 9090,
          endpoint: '/metrics'
        }
      }
    },
    
    // Logging configuration
    logging: {
      enabled: true,
      level: 'info', // 'error', 'warn', 'info', 'debug', 'trace'
      format: 'json', // 'json', 'text'
      
      // Log targets
      targets: ['console'], // 'console', 'file', 'elasticsearch', 'splunk'
      
      // File logging configuration
      file: {
        enabled: false,
        path: './logs/ossa-agent.log',
        maxSize: '10MB',
        maxFiles: 5,
        rotate: true
      },
      
      // Structured logging fields
      includeFields: {
        agentId: true,
        agentType: true,
        capability: true,
        traceId: true,
        spanId: true,
        timestamp: true,
        duration: true,
        success: true,
        error: true,
        metadata: true
      }
    },
    
    // Dashboard configuration
    dashboard: {
      enabled: false,
      port: 3001,
      auth: {
        enabled: false,
        username: 'admin',
        password: 'ossa123'
      },
      refreshInterval: 30000,
      retentionPeriod: '7d'
    },
    
    // Privacy and compliance
    privacy: {
      redactPII: true,
      redactSecrets: true,
      allowedFields: [
        'agentId', 'agentType', 'capability', 'timestamp',
        'duration', 'success', 'error', 'tokenCount'
      ],
      redactedFields: [
        'apiKey', 'password', 'token', 'secret',
        'email', 'phone', 'ssn', 'creditCard'
      ]
    }
  }
};

/**
 * Observability configuration schema for validation
 */
export const OBSERVABILITY_SCHEMA = {
  type: 'object',
  properties: {
    observability: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        version: { type: 'string' },
        
        tracing: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            serviceName: { type: ['string', 'null'] },
            environment: { type: 'string' },
            sampleRate: { type: 'number', minimum: 0, maximum: 1 },
            
            openTelemetry: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean' },
                exporters: {
                  type: 'array',
                  items: { 
                    type: 'string',
                    enum: ['console', 'otlp', 'jaeger', 'zipkin']
                  }
                },
                endpoint: { type: ['string', 'null'] },
                headers: { type: 'object' }
              }
            },
            
            traceloop: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean' },
                apiKey: { type: ['string', 'null'] },
                endpoint: { type: 'string' },
                batchSize: { type: 'integer', minimum: 1 },
                flushInterval: { type: 'integer', minimum: 1000 }
              }
            },
            
            langfuse: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean' },
                publicKey: { type: ['string', 'null'] },
                secretKey: { type: ['string', 'null'] },
                baseUrl: { type: 'string' },
                flushInterval: { type: 'integer', minimum: 1000 }
              }
            }
          }
        },
        
        metrics: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            collectors: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['prometheus', 'custom', 'opentelemetry']
              }
            },
            builtInMetrics: { type: 'object' },
            customMetrics: { type: 'array' }
          }
        },
        
        logging: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            level: {
              type: 'string',
              enum: ['error', 'warn', 'info', 'debug', 'trace']
            },
            format: {
              type: 'string',
              enum: ['json', 'text']
            },
            targets: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['console', 'file', 'elasticsearch', 'splunk']
              }
            }
          }
        },
        
        dashboard: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            port: { type: 'integer', minimum: 1, maximum: 65535 },
            refreshInterval: { type: 'integer', minimum: 5000 }
          }
        },
        
        privacy: {
          type: 'object',
          properties: {
            redactPII: { type: 'boolean' },
            redactSecrets: { type: 'boolean' },
            allowedFields: {
              type: 'array',
              items: { type: 'string' }
            },
            redactedFields: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      }
    }
  }
};

/**
 * Configuration validator and processor
 */
export class ObservabilityConfigProcessor {
  
  /**
   * Merge user config with defaults
   */
  static mergeWithDefaults(userConfig = {}) {
    const merged = JSON.parse(JSON.stringify(DEFAULT_OBSERVABILITY_CONFIG));
    
    if (userConfig.observability) {
      this.deepMerge(merged.observability, userConfig.observability);
    }
    
    // Set service name if not provided
    if (!merged.observability.tracing.serviceName && userConfig.metadata?.name) {
      merged.observability.tracing.serviceName = `ossa-${userConfig.metadata.name}`;
    }
    
    return merged;
  }
  
  /**
   * Deep merge objects
   */
  static deepMerge(target, source) {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        this.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
  
  /**
   * Validate observability configuration
   */
  static validate(config) {
    const errors = [];
    const warnings = [];
    
    if (!config.observability) {
      return { isValid: true, errors, warnings };
    }
    
    const obs = config.observability;
    
    // Check required environment variables
    if (obs.tracing?.traceloop?.enabled && !obs.tracing.traceloop.apiKey) {
      warnings.push('Traceloop is enabled but TRACELOOP_API_KEY is not set');
    }
    
    if (obs.tracing?.langfuse?.enabled && 
        (!obs.tracing.langfuse.publicKey || !obs.tracing.langfuse.secretKey)) {
      warnings.push('Langfuse is enabled but public/secret keys are not set');
    }
    
    if (obs.tracing?.openTelemetry?.enabled && 
        obs.tracing.openTelemetry.exporters.includes('otlp') &&
        !obs.tracing.openTelemetry.endpoint) {
      warnings.push('OTLP exporter is enabled but no endpoint is configured');
    }
    
    // Validate sample rate
    if (obs.tracing?.sampleRate !== undefined) {
      if (obs.tracing.sampleRate < 0 || obs.tracing.sampleRate > 1) {
        errors.push('Tracing sample rate must be between 0 and 1');
      }
    }
    
    // Validate dashboard port
    if (obs.dashboard?.enabled && obs.dashboard.port) {
      if (obs.dashboard.port < 1 || obs.dashboard.port > 65535) {
        errors.push('Dashboard port must be between 1 and 65535');
      }
    }
    
    // Check for conflicting configurations
    if (obs.privacy?.redactPII && obs.logging?.includeFields?.metadata) {
      warnings.push('PII redaction is enabled but metadata logging is also enabled - ensure no PII in metadata');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Generate environment-specific configuration
   */
  static generateEnvironmentConfig(environment = 'development', agentName = 'ossa-agent') {
    const baseConfig = JSON.parse(JSON.stringify(DEFAULT_OBSERVABILITY_CONFIG));
    const obs = baseConfig.observability;
    
    // Environment-specific adjustments
    switch (environment) {
      case 'development':
        obs.tracing.openTelemetry.exporters = ['console'];
        obs.dashboard.enabled = true;
        obs.logging.level = 'debug';
        obs.logging.format = 'text';
        obs.privacy.redactPII = false;
        break;
        
      case 'staging':
        obs.tracing.openTelemetry.exporters = ['console', 'otlp'];
        obs.dashboard.enabled = true;
        obs.logging.level = 'info';
        obs.privacy.redactPII = true;
        break;
        
      case 'production':
        obs.tracing.openTelemetry.exporters = ['otlp'];
        obs.dashboard.enabled = false;
        obs.logging.level = 'warn';
        obs.logging.targets = ['file'];
        obs.logging.file.enabled = true;
        obs.privacy.redactPII = true;
        obs.privacy.redactSecrets = true;
        break;
    }
    
    // Set service name
    obs.tracing.serviceName = `ossa-${agentName}-${environment}`;
    
    return baseConfig;
  }
  
  /**
   * Extract observability configuration from OSSA agent definition
   */
  static extractFromOSSA(ossaConfig) {
    let observabilityConfig = this.mergeWithDefaults(ossaConfig);
    
    // Extract agent information
    if (ossaConfig.metadata?.name) {
      observabilityConfig.observability.tracing.serviceName = 
        `ossa-${ossaConfig.metadata.name}`;
    }
    
    // Set environment from OSSA config if available
    if (ossaConfig.spec?.environment) {
      observabilityConfig.observability.tracing.environment = 
        ossaConfig.spec.environment;
    }
    
    // Enable dashboard for development agents
    if (ossaConfig.spec?.development === true) {
      observabilityConfig.observability.dashboard.enabled = true;
      observabilityConfig.observability.logging.level = 'debug';
    }
    
    return observabilityConfig;
  }
}

export default ObservabilityConfigProcessor;