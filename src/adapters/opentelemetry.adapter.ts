/**
 * OpenTelemetry Adapter
 * 
 * Standard observability integration for OSSA agents.
 * Works with LangSmith, Phoenix, Arize, Langfuse, and all OTel-compatible platforms.
 * 
 * SOLID: Single Responsibility - OpenTelemetry integration only
 * DRY: Reuses OpenTelemetry SDK (standard implementation)
 */

import { z } from 'zod';

// OpenTelemetry Extension Schema (from spec)
export const OpenTelemetryExtensionSchema = z.object({
  enabled: z.boolean().default(true),
  service_name: z.string().optional(),
  service_version: z.string().optional(),
  traces: z.object({
    enabled: z.boolean().default(true),
    exporter: z.enum(['otlp', 'jaeger', 'zipkin', 'console', 'none']).default('otlp'),
    endpoint: z.string().url().optional(),
    headers: z.record(z.string(), z.string()).optional(),
    sample_rate: z.number().min(0).max(1).default(1.0),
  }).optional(),
  metrics: z.object({
    enabled: z.boolean().default(true),
    exporter: z.enum(['otlp', 'prometheus', 'console', 'none']).default('otlp'),
    endpoint: z.string().url().optional(),
    headers: z.record(z.string(), z.string()).optional(),
    collection_interval_seconds: z.number().min(1).default(60),
  }).optional(),
  logs: z.object({
    enabled: z.boolean().default(true),
    exporter: z.enum(['otlp', 'console', 'json', 'none']).default('otlp'),
    endpoint: z.string().url().optional(),
    level: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  }).optional(),
  resource_attributes: z.record(z.string(), z.string()).optional(),
  instrumentation: z.object({
    http: z.boolean().default(true),
    express: z.boolean().default(true),
    grpc: z.boolean().default(false),
    redis: z.boolean().default(false),
    postgres: z.boolean().default(false),
  }).optional(),
  span_attributes: z.record(z.string(), z.string()).optional(),
  langsmith: z.object({
    enabled: z.boolean().default(false),
    api_key_env: z.string().default('LANGSMITH_API_KEY'),
    project_name: z.string().optional(),
    endpoint: z.string().url().default('https://api.smith.langchain.com'),
  }).optional(),
  phoenix: z.object({
    enabled: z.boolean().default(false),
    api_key_env: z.string().default('PHOENIX_API_KEY'),
    endpoint: z.string().url().default('https://phoenix.arize.com'),
  }).optional(),
  langfuse: z.object({
    enabled: z.boolean().default(false),
    public_key_env: z.string().default('LANGFUSE_PUBLIC_KEY'),
    secret_key_env: z.string().default('LANGFUSE_SECRET_KEY'),
    endpoint: z.string().url().default('https://cloud.langfuse.com'),
  }).optional(),
});

export type OpenTelemetryExtension = z.infer<typeof OpenTelemetryExtensionSchema>;

// OpenTelemetry types (optional dependency - may not be installed)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OpenTelemetryTracer = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OpenTelemetryMeter = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OpenTelemetryLogger = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OpenTelemetrySDK = any;

export interface TelemetryInstance {
  tracer: OpenTelemetryTracer | null;
  meter: OpenTelemetryMeter | null;
  logger: OpenTelemetryLogger | null;
  sdk: OpenTelemetrySDK | null;
}

export class OpenTelemetryAdapter {
  private instance: TelemetryInstance | null = null;

  /**
   * Initialize OpenTelemetry for OSSA agent
   * CRUD: Create operation (initializes telemetry)
   */
  async initialize(config: OpenTelemetryExtension, agentMetadata: {
    name: string;
    version: string;
  }): Promise<TelemetryInstance> {
    if (!config.enabled) {
      return {
        tracer: null,
        meter: null,
        logger: null,
        sdk: null,
      };
    }

    // Dynamic import OpenTelemetry SDK (optional dependencies)
    // @ts-expect-error - Optional dependency, may not be installed
    const { NodeSDK } = await import('@opentelemetry/sdk-node');
    // @ts-expect-error - Optional dependency, may not be installed
    const { Resource } = await import('@opentelemetry/resources');

    // Build resource attributes (using standard semantic convention attribute names)
    const resourceAttributes: Record<string, string> = {
      'service.name': config.service_name || agentMetadata.name,
      'service.version': config.service_version || agentMetadata.version,
      ...(config.resource_attributes || {}),
    };

    const resource = new Resource(resourceAttributes);

    // Configure exporters
    const traceExporter = config.traces?.enabled && config.traces.exporter !== 'none'
      ? await this.createTraceExporter(config.traces)
      : undefined;

    // Metric exporter is prepared but not yet used (TODO: implement metricReader)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _metricExporter = config.metrics?.enabled && config.metrics.exporter !== 'none'
      ? await this.createMetricExporter(config.metrics)
      : undefined;

    // Initialize SDK
    const sdk = new NodeSDK({
      resource,
      traceExporter,
      // metricReader: metricExporter ? new PeriodicExportingMetricReader({ exporter: metricExporter }) : undefined,
    });

    sdk.start();

    // Get tracer and meter
    // @ts-expect-error - Optional dependency, may not be installed
    const { trace } = await import('@opentelemetry/api');
    const tracer = trace.getTracer(
      config.service_name || agentMetadata.name,
      config.service_version || agentMetadata.version
    );

    // TODO: Initialize meter and logger

    this.instance = {
      tracer,
      meter: null, // TODO: Initialize meter
      logger: null, // TODO: Initialize logger
      sdk,
    };

    return this.instance;
  }

  /**
   * Create trace exporter based on config
   */
  private async createTraceExporter(config: NonNullable<OpenTelemetryExtension['traces']>) {
    switch (config.exporter) {
      case 'otlp': {
        // @ts-expect-error - Optional dependency, may not be installed
        const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http');
        return new OTLPTraceExporter({
          url: config.endpoint || 'http://localhost:4318/v1/traces',
          headers: config.headers || {},
        });
      }
      case 'jaeger': {
        // @ts-expect-error - Optional dependency, may not be installed
        const { JaegerExporter } = await import('@opentelemetry/exporter-jaeger');
        return new JaegerExporter({
          endpoint: config.endpoint || 'http://localhost:14268/api/traces',
        });
      }
      case 'zipkin': {
        // @ts-expect-error - Optional dependency, may not be installed
        const { ZipkinExporter } = await import('@opentelemetry/exporter-zipkin');
        return new ZipkinExporter({
          url: config.endpoint || 'http://localhost:9411/api/v2/spans',
        });
      }
      case 'console': {
        // @ts-expect-error - Optional dependency, may not be installed
        const { ConsoleSpanExporter } = await import('@opentelemetry/sdk-trace-base');
        return new ConsoleSpanExporter();
      }
      default:
        return undefined;
    }
  }

  /**
   * Create metric exporter based on config
   */
  private async createMetricExporter(config: NonNullable<OpenTelemetryExtension['metrics']>) {
    switch (config.exporter) {
      case 'otlp': {
        // @ts-expect-error - Optional dependency, may not be installed
        const { OTLPMetricExporter } = await import('@opentelemetry/exporter-metrics-otlp-http');
        return new OTLPMetricExporter({
          url: config.endpoint || 'http://localhost:4318/v1/metrics',
          headers: config.headers || {},
        });
      }
      case 'prometheus': {
        // @ts-expect-error - Optional dependency, may not be installed
        const { PrometheusExporter } = await import('@opentelemetry/exporter-prometheus');
        return new PrometheusExporter({
          port: 9090,
        });
      }
      case 'console': {
        // Console metric exporter
        return undefined; // TODO: Implement
      }
      default:
        return undefined;
    }
  }

  /**
   * Create span for agent execution
   */
  createAgentExecutionSpan(agentId: string, operation: string) {
    if (!this.instance?.tracer) return null;

    return this.instance.tracer.startSpan(`agent.execution`, {
      attributes: {
        'agent.id': agentId,
        'agent.operation': operation,
      },
    });
  }

  /**
   * Create span for LLM call
   */
  createLLMSpan(parentSpan: OpenTelemetryTracer | null, provider: string, model: string) {
    if (!this.instance?.tracer) return null;

    return this.instance.tracer.startSpan('llm.call', {
      parent: parentSpan,
      attributes: {
        'llm.provider': provider,
        'llm.model': model,
      },
    });
  }

  /**
   * Create span for tool invocation
   */
  createToolSpan(parentSpan: OpenTelemetryTracer | null, toolName: string) {
    if (!this.instance?.tracer) return null;

    return this.instance.tracer.startSpan('tool.invoke', {
      parent: parentSpan,
      attributes: {
        'tool.name': toolName,
      },
    });
  }

  /**
   * Record metric
   */
  recordMetric(_name: string, _value: number, _attributes?: Record<string, string>) {
    // TODO: Implement metric recording
  }

  /**
   * Shutdown telemetry
   */
  async shutdown(): Promise<void> {
    if (this.instance?.sdk) {
      await this.instance.sdk.shutdown();
      this.instance = null;
    }
  }
}
