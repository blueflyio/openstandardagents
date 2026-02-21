/**
 * AutoGen Config-Only Adapter
 *
 * Provides lightweight Microsoft AutoGen agent JSON config.
 * This adapter is registered in the PlatformRegistry so the MCP server
 * can delegate to it instead of using inline conversion logic.
 *
 * SOLID: Single Responsibility - AutoGen config-only export
 */

import { BaseAdapter } from '../base/adapter.interface.js';
import type {
  OssaAgent,
  ExportOptions,
  ExportResult,
  ConfigResult,
} from '../base/adapter.interface.js';

export class AutogenConfigAdapter extends BaseAdapter {
  readonly platform = 'autogen';
  readonly displayName = 'AutoGen';
  readonly description = 'Microsoft AutoGen agent configuration';
  readonly status = 'alpha' as const;
  readonly supportedVersions = ['v0.4'];

  async export(
    manifest: OssaAgent,
    _options?: ExportOptions
  ): Promise<ExportResult> {
    return this.createResult(false, [], 'Use toConfig() for AutoGen export');
  }

  getExample(): OssaAgent {
    return {
      apiVersion: 'ossa/v0.4',
      kind: 'Agent',
      metadata: { name: 'autogen-example', version: '1.0.0' },
      spec: { role: 'Example AutoGen agent' },
    };
  }

  async toConfig(manifest: OssaAgent): Promise<ConfigResult> {
    const meta = manifest.metadata || { name: 'agent', version: '0.0.0' };
    const autogenTools = (manifest.spec?.tools || []) as Array<
      Record<string, unknown>
    >;
    const config: Record<string, unknown> = {
      name: meta.name,
      description: meta.description || '',
      system_message: manifest.spec?.role || '',
      llm_config: {
        config_list: [
          {
            model: manifest.spec?.llm?.model || 'gpt-4',
            api_type:
              manifest.spec?.llm?.provider === 'anthropic'
                ? 'anthropic'
                : 'openai',
          },
        ],
        ...(manifest.spec?.llm?.temperature != null
          ? { temperature: manifest.spec.llm.temperature }
          : {}),
        ...(manifest.spec?.llm?.maxTokens != null
          ? { max_tokens: manifest.spec.llm.maxTokens }
          : {}),
      },
      ...(autogenTools.length > 0
        ? {
            tools: autogenTools.map((t) => ({
              name: t.name || 'unnamed',
              description: (t.description as string) || '',
              ...(t.inputSchema || t.input_schema
                ? { parameters: t.inputSchema || t.input_schema }
                : {}),
            })),
          }
        : {}),
      metadata: {
        ossa_version: manifest.apiVersion || 'ossa/v0.4',
      },
    };
    return {
      config,
      filename: `${meta.name}.autogen.json`,
    };
  }
}
