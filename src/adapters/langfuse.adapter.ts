/**
 * Langfuse Adapter
 *
 * Langfuse LLM observability connector for OSSA agents.
 * Uses OpenTelemetry under the hood (Langfuse supports OTLP).
 *
 * SOLID: Single Responsibility - Langfuse integration only
 * DRY: Uses OpenTelemetryAdapter
 */

import {
  OpenTelemetryAdapter,
  type OpenTelemetryExtension,
} from './opentelemetry.adapter.js';

export interface LangfuseConfig {
  enabled: boolean;
  public_key?: string;
  public_key_env?: string;
  secret_key?: string;
  secret_key_env?: string;
  endpoint?: string;
}

export class LangfuseAdapter {
  private otelAdapter: OpenTelemetryAdapter;

  constructor() {
    this.otelAdapter = new OpenTelemetryAdapter();
  }

  /**
   * Initialize Langfuse observability for OSSA agent
   * CRUD: Create operation (initializes observability)
   */
  async initialize(
    config: LangfuseConfig,
    agentMetadata: { name: string; version: string }
  ) {
    if (!config.enabled) {
      return null;
    }

    // Get API keys
    const publicKey =
      config.public_key ||
      (config.public_key_env
        ? process.env[config.public_key_env]
        : process.env.LANGFUSE_PUBLIC_KEY);
    const secretKey =
      config.secret_key ||
      (config.secret_key_env
        ? process.env[config.secret_key_env]
        : process.env.LANGFUSE_SECRET_KEY);

    if (!publicKey || !secretKey) {
      throw new Error(
        'Langfuse API keys not found. Set LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY environment variables.'
      );
    }

    // Configure OpenTelemetry for Langfuse
    const otelConfig: OpenTelemetryExtension = {
      enabled: true,
      service_name: agentMetadata.name,
      service_version: agentMetadata.version,
      traces: {
        enabled: true,
        exporter: 'otlp',
        endpoint: config.endpoint || 'https://cloud.langfuse.com',
        headers: {
          'x-langfuse-public-key': publicKey,
          'x-langfuse-secret-key': secretKey,
        },
        sample_rate: 1.0,
      },
      metrics: {
        enabled: true,
        exporter: 'otlp',
        endpoint: config.endpoint || 'https://cloud.langfuse.com',
        headers: {
          'x-langfuse-public-key': publicKey,
          'x-langfuse-secret-key': secretKey,
        },
        collection_interval_seconds: 60,
      },
    };

    return this.otelAdapter.initialize(otelConfig, agentMetadata);
  }
}
