/**
 * LangSmith Adapter
 * 
 * LangSmith tracing bridge for OSSA agents.
 * Uses OpenTelemetry under the hood (LangSmith supports OTLP).
 * 
 * SOLID: Single Responsibility - LangSmith integration only
 * DRY: Uses OpenTelemetryAdapter
 */

import { OpenTelemetryAdapter, type OpenTelemetryExtension } from './opentelemetry.adapter.js';

export interface LangSmithConfig {
  enabled: boolean;
  api_key?: string;
  api_key_env?: string;
  project_name?: string;
  endpoint?: string;
}

export class LangSmithAdapter {
  private otelAdapter: OpenTelemetryAdapter;

  constructor() {
    this.otelAdapter = new OpenTelemetryAdapter();
  }

  /**
   * Initialize LangSmith tracing for OSSA agent
   * CRUD: Create operation (initializes tracing)
   */
  async initialize(
    config: LangSmithConfig,
    agentMetadata: { name: string; version: string }
  ) {
    if (!config.enabled) {
      return null;
    }

    // Get API key
    const apiKey = config.api_key || 
                   (config.api_key_env ? process.env[config.api_key_env] : process.env.LANGSMITH_API_KEY);

    if (!apiKey) {
      throw new Error('LangSmith API key not found. Set LANGSMITH_API_KEY environment variable.');
    }

    // Configure OpenTelemetry for LangSmith
    const otelConfig: OpenTelemetryExtension = {
      enabled: true,
      service_name: agentMetadata.name,
      service_version: agentMetadata.version,
      traces: {
        enabled: true,
        exporter: 'otlp',
        endpoint: config.endpoint || 'https://api.smith.langchain.com',
        headers: {
          'x-api-key': apiKey,
        },
        sample_rate: 1.0,
      },
      metrics: {
        enabled: true,
        exporter: 'otlp',
        endpoint: config.endpoint || 'https://api.smith.langchain.com',
        headers: {
          'x-api-key': apiKey,
        },
        collection_interval_seconds: 60,
      },
      resource_attributes: {
        'langsmith.project': config.project_name || agentMetadata.name,
      },
    };

    return this.otelAdapter.initialize(otelConfig, agentMetadata);
  }
}
