// @ts-nocheck
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
  traces: z
    .object({
      enabled: z.boolean().default(true),
      exporter: z
        .enum(['otlp', 'jaeger', 'zipkin', 'console', 'none'])
        .default('otlp'),
      endpoint: z.string().url().optional(),
      headers: z.record(z.string(), z.string()).optional(),
      sample_rate: z.number().min(0).max(1).default(1.0),
    })
    .optional(),
  metrics: z
    .object({
      enabled: z.boolean().default(true),
      exporter: z
        .enum(['otlp', 'prometheus', 'console', 'none'])
        .default('otlp'),
      endpoint: z.string().url().optional(),
      headers: z.record(z.string(), z.string()).optional(),
      collection_interval_seconds: z.number().min(1).default(60),
    })
    .optional(),
  logs: z
    .object({
      enabled: z.boolean().default(true),
      exporter: z.enum(['otlp', 'console', 'json', 'none']).default('otlp'),
      endpoint: z.string().url().optional(),
      level: z
        .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
        .default('info'),
    })
    .optional(),
  resource_attributes: z.record(z.string(), z.string()).optional(),
  instrumentation: z
    .object({
      http: z.boolean().default(true),
      express: z.boolean().default(true),
      grpc: z.boolean().default(false),
      redis: z.boolean().default(false),
      postgres: z.boolean().default(false),
    })
    .optional(),
  span_attributes: z.record(z.string(), z.string()).optional(),
  langsmith: z
    .object({
      enabled: z.boolean().default(false),
      api_key_env: z.string().default('LANGSMITH_API_KEY'),
      project_name: z.string().optional(),
      endpoint: z.string().url().default('https://api.smith.langchain.com'),
    })
    .optional(),
  phoenix: z
    .object({
      enabled: z.boolean().default(false),
      api_key_env: z.string().default('PHOENIX_API_KEY'),
      endpoint: z.string().url().default('https://phoenix.arize.com'),
    })
    .optional(),
  langfuse: z
    .object({
      enabled: z.boolean().default(false),
      public_key_env: z.string().default('LANGFUSE_PUBLIC_KEY'),
      secret_key_env: z.string().default('LANGFUSE_SECRET_KEY'),
      endpoint: z.string().url().default('https://cloud.langfuse.com'),
    })
    .optional(),
});

export type OpenTelemetryExtension = z.infer<
  typeof OpenTelemetryExtensionSchema
>;

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
  meterProvider?: OpenTelemetryMeter;
  loggerProvider?: OpenTelemetryLogger;
}

export class OpenTelemetryAdapter {
  private instance: TelemetryInstance | null = null;

  /**
   * Initialize OpenTelemetry for OSSA agent
   * CRUD: Create operation (initializes telemetry)
   */
  async initialize(
    config: OpenTelemetryExtension,
    agentMetadata: {
      name: string;
      version: string;
    }
  ): Promise<TelemetryInstance> {
    if (!config.enabled) {
      return {
        tracer: null,
        meter: null,
        logger: null,
        sdk: null,
      };
    }

    // Dynamic import OpenTelemetry SDK (optional dependencies)
    // @ts-expect-error - Missing type declarations for @opentelemetry/resources
    const { NodeSDK } = await import('@opentelemetry/sdk-node');
    const { Resource } = await import('@opentelemetry/resources');
    const { MeterProvider, PeriodicExportingMetricReader } =
      await import('@opentelemetry/sdk-metrics');
    const { LoggerProvider, BatchLogRecordProcessor } =
      await import('@opentelemetry/sdk-logs');

    // Build resource attributes (using standard semantic convention attribute names)
    const resourceAttributes: Record<string, string> = {
      'service.name': config.service_name || agentMetadata.name,
      'service.version': config.service_version || agentMetadata.version,
      ...(config.resource_attributes || {}),
    };

    const resource = new Resource(resourceAttributes);

    // Configure exporters
    const traceExporter =
      config.traces?.enabled && config.traces.exporter !== 'none'
        ? await this.createTraceExporter(config.traces)
        : undefined;

    // Configure metric exporter and reader
    const metricExporter =
      config.metrics?.enabled && config.metrics.exporter !== 'none'
        ? await this.createMetricExporter(config.metrics)
        : undefined;

    const metricReader = metricExporter
      ? new PeriodicExportingMetricReader({
          exporter: metricExporter,
          exportIntervalMillis:
            (config.metrics?.collection_interval_seconds || 60) * 1000,
        })
      : undefined;

    // Configure log exporter
    const logExporter =
      config.logs?.enabled && config.logs.exporter !== 'none'
        ? await this.createLogExporter(config.logs)
        : undefined;

    // Initialize SDK
    const sdk = new NodeSDK({
      resource,
      traceExporter,
      // Note: metricReader is handled separately via MeterProvider
    });

    sdk.start();

    // Initialize MeterProvider
    const meterProvider = new MeterProvider({
      resource,
      readers: metricReader ? [metricReader] : [],
    });
    const meter =
      config.metrics?.enabled && config.metrics.exporter !== 'none'
        ? meterProvider.getMeter(
            config.service_name || agentMetadata.name,
            config.service_version || agentMetadata.version
          )
        : null;

    // Initialize LoggerProvider
    let loggerProvider: any = null;
    let logger: OpenTelemetryLogger | null = null;

    if (
      config.logs?.enabled &&
      config.logs.exporter !== 'none' &&
      logExporter
    ) {
      loggerProvider = new LoggerProvider({
        resource,
        logRecordProcessors: [new BatchLogRecordProcessor(logExporter)],
      });
      logger = loggerProvider.getLogger(
        config.service_name || agentMetadata.name,
        config.service_version || agentMetadata.version
      );
    }

    // Get tracer
    const { trace } = await import('@opentelemetry/api');
    const tracer = trace.getTracer(
      config.service_name || agentMetadata.name,
      config.service_version || agentMetadata.version
    );

    this.instance = {
      tracer,
      meter,
      logger,
      sdk,
      meterProvider,
      loggerProvider,
    };

    return this.instance;
  }

  /**
   * Create trace exporter based on config
   */
  private async createTraceExporter(
    config: NonNullable<OpenTelemetryExtension['traces']>
  ) {
    switch (config.exporter) {
      case 'otlp': {
        try {
          const TraceExporter =
            await import('@opentelemetry/exporter-trace-otlp-http');
          return new TraceExporter.OTLPTraceExporter({
            url: config.endpoint || 'http://localhost:4318/v1/traces',
            headers: config.headers || {},
          });
        } catch {
          throw new Error(
            '@opentelemetry/exporter-trace-otlp-http not installed'
          );
        }
      }
      case 'jaeger': {
        try {
          const JaegerExporter = await import('@opentelemetry/exporter-jaeger');
          return new JaegerExporter.JaegerExporter({
            endpoint: config.endpoint || 'http://localhost:14268/api/traces',
          });
        } catch {
          throw new Error('@opentelemetry/exporter-jaeger not installed');
        }
      }
      case 'zipkin': {
        try {
          const ZipkinExporter = await import('@opentelemetry/exporter-zipkin');
          return new ZipkinExporter.ZipkinExporter({
            url: config.endpoint || 'http://localhost:9411/api/v2/spans',
          });
        } catch {
          throw new Error('@opentelemetry/exporter-zipkin not installed');
        }
      }
      // @ts-expect-error - Missing type declarations for @opentelemetry/sdk-trace-base
      case 'console': {
        try {
          const ConsoleExporter = await import('@opentelemetry/sdk-trace-base');
          return new ConsoleExporter.ConsoleSpanExporter();
        } catch {
          throw new Error('@opentelemetry/sdk-trace-base not installed');
        }
      }
      default:
        return undefined;
    }
  }

  /**
   * Create metric exporter based on config
   */
  private async createMetricExporter(
    config: NonNullable<OpenTelemetryExtension['metrics']>
  ) {
    switch (config.exporter) {
      case 'otlp': {
        try {
          const MetricsExporter =
            await import('@opentelemetry/exporter-metrics-otlp-http');
          return new MetricsExporter.OTLPMetricExporter({
            url: config.endpoint || 'http://localhost:4318/v1/metrics',
            headers: config.headers || {},
          });
        } catch {
          throw new Error(
            '@opentelemetry/exporter-metrics-otlp-http not installed'
          );
        }
      }
      case 'prometheus': {
        try {
          const PrometheusExporter =
            await import('@opentelemetry/exporter-prometheus');
          return new PrometheusExporter.PrometheusExporter({
            port: 9090,
          });
        } catch {
          throw new Error('@opentelemetry/exporter-prometheus not installed');
        }
      }
      case 'console': {
        return {
          export: async (metrics: any) => {
            if (metrics?.scopeMetrics?.length) {
              console.log(
                '[OTel metrics]',
                JSON.stringify(
                  metrics.scopeMetrics.map((s: any) => ({
                    scope: s.scope?.name,
                    metrics: s.metrics?.length ?? 0,
                  }))
                )
              );
            }
            return { code: 0 };
          },
          forceFlush: async () => {},
          shutdown: async () => {},
        };
      }
      default:
        return undefined;
    }
  }

  /**
   * Create log exporter based on config
   */
  private async createLogExporter(
    config: NonNullable<OpenTelemetryExtension['logs']>
  ) {
    switch (config.exporter) {
      case 'otlp': {
        try {
          const LogExporter =
            await import('@opentelemetry/exporter-logs-otlp-http');
          return new LogExporter.OTLPLogExporter({
            url: config.endpoint || 'http://localhost:4318/v1/logs',
          });
        } catch {
          throw new Error(
            '@opentelemetry/exporter-logs-otlp-http not installed'
          );
        }
      }
      case 'console': {
        try {
          const { ConsoleLogRecordExporter } =
            await import('@opentelemetry/sdk-logs');
          return new ConsoleLogRecordExporter();
        } catch {
          throw new Error('@opentelemetry/sdk-logs not installed');
        }
      }
      case 'json': {
        // JSON log exporter - similar to console but JSON formatted
        try {
          const { ConsoleLogRecordExporter } =
            await import('@opentelemetry/sdk-logs');
          return new ConsoleLogRecordExporter();
        } catch {
          throw new Error('@opentelemetry/sdk-logs not installed');
        }
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
  createLLMSpan(
    parentSpan: OpenTelemetryTracer | null,
    provider: string,
    model: string
  ) {
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
  recordMetric(
    name: string,
    value: number,
    attributes?: Record<string, string>
  ) {
    if (!this.instance?.meter) return;

    // Create a counter or histogram based on the metric name
    const counter = this.instance.meter.createCounter(name);
    counter.add(value, attributes);
  }

  /**
   * Shutdown telemetry
   */
  async shutdown(): Promise<void> {
    if (this.instance?.sdk) {
      await this.instance.sdk.shutdown();
    }
    if (this.instance?.meterProvider) {
      await this.instance.meterProvider.shutdown();
    }
    if (this.instance?.loggerProvider) {
      await this.instance.loggerProvider.shutdown();
    }
    this.instance = null;
  }
}
