/**
 * Docker Config-Only Adapter
 *
 * Provides lightweight docker-compose JSON config export.
 * This adapter is registered in the PlatformRegistry so the MCP server
 * can delegate to it instead of using inline conversion logic.
 *
 * SOLID: Single Responsibility - docker config-only export
 */

import { BaseAdapter } from '../base/adapter.interface.js';
import type {
  OssaAgent,
  ExportOptions,
  ExportResult,
  ConfigResult,
} from '../base/adapter.interface.js';

export class DockerConfigAdapter extends BaseAdapter {
  readonly platform = 'docker';
  readonly displayName = 'Docker';
  readonly description = 'Docker Compose configuration';
  readonly status = 'beta' as const;
  readonly supportedVersions = ['v0.4'];

  async export(
    manifest: OssaAgent,
    _options?: ExportOptions
  ): Promise<ExportResult> {
    return this.createResult(
      false,
      [],
      'Use DockerExporter for full Docker export'
    );
  }

  getExample(): OssaAgent {
    return {
      apiVersion: 'ossa/v0.4',
      kind: 'Agent',
      metadata: { name: 'docker-example', version: '1.0.0' },
      spec: { role: 'Example Docker agent' },
    };
  }

  async toConfig(manifest: OssaAgent): Promise<ConfigResult> {
    const meta = manifest.metadata || { name: 'agent', version: '0.0.0' };
    const config: Record<string, unknown> = {
      version: '3.8',
      services: {
        [meta.name]: {
          image: `ossa/${meta.name}:${meta.version || 'latest'}`,
          environment: {
            AGENT_NAME: meta.name,
            LLM_PROVIDER: manifest.spec?.llm?.provider || 'openai',
            LLM_MODEL: manifest.spec?.llm?.model || 'gpt-4',
          },
          labels: {
            'ossa.name': meta.name,
            'ossa.version': meta.version || '0.0.0',
            'ossa.kind': manifest.kind || 'Agent',
          },
        },
      },
    };
    return {
      config,
      filename: `docker-compose.${meta.name}.yml`,
    };
  }
}
