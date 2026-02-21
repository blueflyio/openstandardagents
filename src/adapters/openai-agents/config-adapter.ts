/**
 * OpenAI Config-Only Adapter
 *
 * Provides lightweight OpenAI Assistants / function_calling JSON config.
 * This adapter is registered in the PlatformRegistry so the MCP server
 * can delegate to it instead of using inline conversion logic.
 *
 * Note: platform identifier is 'openai' (for MCP convert target),
 * distinct from 'openai-agents-sdk' which generates full scaffold packages.
 *
 * SOLID: Single Responsibility - OpenAI config-only export
 */

import { BaseAdapter } from '../base/adapter.interface.js';
import type {
  OssaAgent,
  ExportOptions,
  ExportResult,
  ConfigResult,
} from '../base/adapter.interface.js';

export class OpenAIConfigAdapter extends BaseAdapter {
  readonly platform = 'openai';
  readonly displayName = 'OpenAI';
  readonly description = 'OpenAI Assistants / function_calling format';
  readonly status = 'beta' as const;
  readonly supportedVersions = ['v0.4'];

  async export(
    manifest: OssaAgent,
    _options?: ExportOptions
  ): Promise<ExportResult> {
    return this.createResult(
      false,
      [],
      'Use OpenAIAgentsAdapter for full SDK export'
    );
  }

  getExample(): OssaAgent {
    return {
      apiVersion: 'ossa/v0.4',
      kind: 'Agent',
      metadata: { name: 'openai-example', version: '1.0.0' },
      spec: { role: 'Example OpenAI agent' },
    };
  }

  async toConfig(manifest: OssaAgent): Promise<ConfigResult> {
    const meta = manifest.metadata || { name: 'agent', version: '0.0.0' };
    const oaiTools = (manifest.spec?.tools || []) as Array<
      Record<string, unknown>
    >;
    const config: Record<string, unknown> = {
      model: manifest.spec?.llm?.model || 'gpt-4',
      name: meta.name,
      description: meta.description || '',
      instructions: manifest.spec?.role || '',
      tools: oaiTools.map((t) => ({
        type: 'function',
        function: {
          name: t.name || 'unnamed',
          description: (t.description as string) || '',
          parameters:
            t.inputSchema ||
            t.input_schema ||
            t.parameters || { type: 'object', properties: {} },
        },
      })),
      metadata: {
        ossa_version: manifest.apiVersion || 'ossa/v0.4',
        ossa_name: meta.name,
      },
    };
    return {
      config,
      filename: `${meta.name}.openai.json`,
    };
  }
}
