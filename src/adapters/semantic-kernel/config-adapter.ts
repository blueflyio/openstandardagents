/**
 * Semantic Kernel Config-Only Adapter
 *
 * Provides lightweight Microsoft Semantic Kernel agent JSON config.
 * This adapter is registered in the PlatformRegistry so the MCP server
 * can delegate to it instead of using inline conversion logic.
 *
 * SOLID: Single Responsibility - Semantic Kernel config-only export
 */

import { BaseAdapter } from '../base/adapter.interface.js';
import type {
  OssaAgent,
  ExportOptions,
  ExportResult,
  ConfigResult,
} from '../base/adapter.interface.js';

export class SemanticKernelConfigAdapter extends BaseAdapter {
  readonly platform = 'semantic-kernel';
  readonly displayName = 'Semantic Kernel';
  readonly description = 'Microsoft Semantic Kernel agent configuration';
  readonly status = 'alpha' as const;
  readonly supportedVersions = ['v0.4'];

  async export(
    manifest: OssaAgent,
    _options?: ExportOptions
  ): Promise<ExportResult> {
    return this.createResult(
      false,
      [],
      'Use toConfig() for Semantic Kernel export'
    );
  }

  getExample(): OssaAgent {
    return {
      apiVersion: 'ossa/v0.4',
      kind: 'Agent',
      metadata: { name: 'semantic-kernel-example', version: '1.0.0' },
      spec: { role: 'Example Semantic Kernel agent' },
    };
  }

  async toConfig(manifest: OssaAgent): Promise<ConfigResult> {
    const meta = manifest.metadata || { name: 'agent', version: '0.0.0' };
    const skTools = (manifest.spec?.tools || []) as Array<
      Record<string, unknown>
    >;
    const config: Record<string, unknown> = {
      name: meta.name,
      description: meta.description || '',
      instructions: manifest.spec?.role || '',
      execution_settings: {
        default: {
          model_id: manifest.spec?.llm?.model || 'gpt-4',
          service_id: manifest.spec?.llm?.provider || 'openai',
          ...(manifest.spec?.llm?.temperature != null
            ? { temperature: manifest.spec.llm.temperature }
            : {}),
          ...(manifest.spec?.llm?.maxTokens != null
            ? { max_tokens: manifest.spec.llm.maxTokens }
            : {}),
        },
      },
      plugins: skTools.map((t) => ({
        name: t.name || 'unnamed',
        description: (t.description as string) || '',
        parameters: t.inputSchema ||
          t.input_schema ||
          t.parameters || { type: 'object', properties: {} },
      })),
      metadata: {
        ossa_version: manifest.apiVersion || 'ossa/v0.4',
      },
    };
    return {
      config,
      filename: `${meta.name}.semantic-kernel.json`,
    };
  }
}
