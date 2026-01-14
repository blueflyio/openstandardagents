/**
 * Phoenix/Arize Adapter
 *
 * Phoenix/Arize LLM observability connector for OSSA agents.
 * Uses OpenTelemetry under the hood (Phoenix supports OTLP).
 *
 * SOLID: Single Responsibility - Phoenix integration only
 * DRY: Uses OpenTelemetryAdapter
 */

import {
  OpenTelemetryAdapter,
  type OpenTelemetryExtension,
} from './opentelemetry.adapter.js';

export interface PhoenixConfig {
  enabled: boolean;
  api_key?: string;
  api_key_env?: string;
  endpoint?: string;
}

export class PhoenixAdapter {
  private otelAdapter: OpenTelemetryAdapter;

  constructor() {
    this.otelAdapter = new OpenTelemetryAdapter();
  }

  /**
   * Initialize Phoenix observability for OSSA agent
   * CRUD: Create operation (initializes observability)
   */
  async initialize(
    config: PhoenixConfig,
    agentMetadata: { name: string; version: string }
  ) {
    if (!config.enabled) {
      return null;
    }

    // Get API key
    const apiKey =
      config.api_key ||
      (config.api_key_env
        ? process.env[config.api_key_env]
        : process.env.PHOENIX_API_KEY);

    if (!apiKey) {
      throw new Error(
        'Phoenix API key not found. Set PHOENIX_API_KEY environment variable.'
      );
    }

    // Configure OpenTelemetry for Phoenix
    const otelConfig: OpenTelemetryExtension = {
      enabled: true,
      service_name: agentMetadata.name,
      service_version: agentMetadata.version,
      traces: {
        enabled: true,
        exporter: 'otlp',
        endpoint: config.endpoint || 'https://phoenix.arize.com',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        sample_rate: 1.0,
      },
      metrics: {
        enabled: true,
        exporter: 'otlp',
        endpoint: config.endpoint || 'https://phoenix.arize.com',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        collection_interval_seconds: 60,
      },
      logs: {
        enabled: true,
        exporter: 'otlp',
        endpoint: config.endpoint || 'https://phoenix.arize.com',
        level: 'info',
      },
    };

    return this.otelAdapter.initialize(otelConfig, agentMetadata);
  }
}
