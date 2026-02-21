/**
 * Anthropic Config-Only Adapter
 *
 * Provides lightweight Anthropic Messages API JSON config.
 * This adapter is registered in the PlatformRegistry so the MCP server
 * can delegate to it instead of using inline conversion logic.
 *
 * SOLID: Single Responsibility - Anthropic config-only export
 */

import { BaseAdapter } from '../base/adapter.interface.js';
import type {
  OssaAgent,
  ExportOptions,
  ExportResult,
  ConfigResult,
} from '../base/adapter.interface.js';

export class AnthropicConfigAdapter extends BaseAdapter {
  readonly platform = 'anthropic';
  readonly displayName = 'Anthropic';
  readonly description = 'Anthropic Messages API format';
  readonly status = 'beta' as const;
  readonly supportedVersions = ['v0.4'];

  async export(
    manifest: OssaAgent,
    _options?: ExportOptions
  ): Promise<ExportResult> {
    return this.createResult(false, [], 'Use toConfig() for Anthropic export');
  }

  getExample(): OssaAgent {
    return {
      apiVersion: 'ossa/v0.4',
      kind: 'Agent',
      metadata: { name: 'anthropic-example', version: '1.0.0' },
      spec: { role: 'Example Anthropic agent' },
    };
  }

  async toConfig(manifest: OssaAgent): Promise<ConfigResult> {
    const meta = manifest.metadata || { name: 'agent', version: '0.0.0' };
    const config: Record<string, unknown> = {
      name: meta.name,
      description: meta.description || '',
      model: manifest.spec?.llm?.model || 'claude-sonnet-4-20250514',
      system: manifest.spec?.role || '',
      tools: (
        (manifest.spec?.tools || []) as Array<Record<string, unknown>>
      ).map((t) => ({
        name: t.name,
        description: '',
        input_schema: { type: 'object', properties: {} },
      })),
      max_tokens: 4096,
    };
    return {
      config,
      filename: `${meta.name}.anthropic.json`,
    };
  }
}
