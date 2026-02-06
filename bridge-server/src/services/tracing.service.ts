import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import * as api from '@opentelemetry/api';

/**
 * OpenTelemetry Tracing Service
 *
 * Provides distributed tracing for agent execution and HTTP requests.
 * Integrates with OTLP-compatible backends (Jaeger, Tempo, etc.)
 */
export class TracingService {
  private sdk: NodeSDK | null = null;
  private tracer: api.Tracer | null = null;
  private enabled: boolean = false;

  /**
   * Initialize OpenTelemetry SDK
   */
  initialize(serviceName: string = 'ossa-bridge-server'): void {
    const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

    if (!otlpEndpoint) {
      console.warn('OTEL_EXPORTER_OTLP_ENDPOINT not set. Tracing disabled.');
      return;
    }

    try {
      const traceExporter = new OTLPTraceExporter({
        url: `${otlpEndpoint}/v1/traces`,
      });

      this.sdk = new NodeSDK({
        resource: new Resource({
          [ATTR_SERVICE_NAME]: serviceName,
        }),
        traceExporter,
      });

      this.sdk.start();
      this.tracer = api.trace.getTracer(serviceName);
      this.enabled = true;

      console.log(`OpenTelemetry tracing initialized: ${otlpEndpoint}`);
    } catch (error) {
      console.error('Failed to initialize tracing:', error);
      this.enabled = false;
    }
  }

  /**
   * Create a new span for agent execution
   */
  startAgentExecutionSpan(agentId: string, input: Record<string, unknown>): api.Span | null {
    if (!this.enabled || !this.tracer) {
      return null;
    }

    const span = this.tracer.startSpan('agent.execute', {
      attributes: {
        'agent.id': agentId,
        'agent.input.size': JSON.stringify(input).length,
      },
    });

    return span;
  }

  /**
   * Record agent execution result in span
   */
  recordAgentResult(span: api.Span | null, result: unknown, executionTime: number): void {
    if (!span) return;

    span.setAttributes({
      'agent.execution.time_ms': executionTime,
      'agent.result.size': JSON.stringify(result).length,
    });
  }

  /**
   * Record error in span
   */
  recordError(span: api.Span | null, error: Error): void {
    if (!span) return;

    span.recordException(error);
    span.setStatus({
      code: api.SpanStatusCode.ERROR,
      message: error.message,
    });
  }

  /**
   * End span
   */
  endSpan(span: api.Span | null): void {
    if (!span) return;
    span.end();
  }

  /**
   * Get trace ID from current span
   */
  getTraceId(span: api.Span | null): string | undefined {
    if (!span) return undefined;
    return span.spanContext().traceId;
  }

  /**
   * Shutdown tracing SDK
   */
  async shutdown(): Promise<void> {
    if (this.sdk) {
      await this.sdk.shutdown();
      console.log('OpenTelemetry tracing shutdown');
    }
  }

  /**
   * Check if tracing is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Singleton instance
export const tracingService = new TracingService();
