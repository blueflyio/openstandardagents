/**
 * Kagent Config-Only Adapter
 *
 * Provides lightweight JSON config export for kagent.dev v1alpha2 CRD format.
 * This adapter is registered in the PlatformRegistry so the MCP server
 * can delegate to it instead of using inline conversion logic.
 *
 * SOLID: Single Responsibility - kagent config-only export
 */

import { BaseAdapter } from '../base/adapter.interface.js';
import type {
  OssaAgent,
  ExportOptions,
  ExportResult,
  ConfigResult,
} from '../base/adapter.interface.js';

export class KagentConfigAdapter extends BaseAdapter {
  readonly platform = 'kagent';
  readonly displayName = 'kagent.dev';
  readonly description = 'kagent.dev Kubernetes agent CRD (v1alpha2)';
  readonly status = 'alpha' as const;
  readonly supportedVersions = ['v0.4'];

  async export(
    manifest: OssaAgent,
    _options?: ExportOptions
  ): Promise<ExportResult> {
    return this.createResult(false, [], 'Use toConfig() for kagent export');
  }

  getExample(): OssaAgent {
    return {
      apiVersion: 'ossa/v0.4',
      kind: 'Agent',
      metadata: { name: 'kagent-example', version: '1.0.0' },
      spec: { role: 'Example kagent agent' },
    };
  }

  async toConfig(manifest: OssaAgent): Promise<ConfigResult> {
    const meta = manifest.metadata || { name: 'agent', version: '0.0.0' };
    const kagentExtensions = (manifest as Record<string, unknown>).extensions as
      | Record<string, unknown>
      | undefined;
    const kagentExt = kagentExtensions?.kagent as
      | Record<string, unknown>
      | undefined;
    const kagentNs =
      (kagentExt?.kubernetes as Record<string, unknown>)?.namespace || 'kagent';
    const a2aConfig = kagentExt?.a2aConfig as
      | Record<string, unknown>
      | undefined;

    // Map OSSA tools to kagent McpServer tool format
    const ossaTools = (manifest.spec?.tools || []) as Array<
      Record<string, unknown>
    >;
    const kagentTools = ossaTools.map((t) => {
      if (t.type === 'mcp') {
        return {
          type: 'McpServer',
          mcpServer: {
            name: t.server || t.name || 'tool-server',
            kind: 'RemoteMCPServer',
            ...(t.toolNames ? { toolNames: t.toolNames } : {}),
          },
        };
      }
      return {
        type: 'McpServer',
        mcpServer: {
          name: t.name || 'tool-server',
          kind: 'RemoteMCPServer',
        },
      };
    });

    // Build the v1alpha2 Agent CRD
    const agentCrd: Record<string, unknown> = {
      apiVersion: 'kagent.dev/v1alpha2',
      kind: 'Agent',
      metadata: {
        name: meta.name,
        namespace: kagentNs,
        labels: {
          'ossa.dev/name': meta.name,
          'ossa.dev/version': meta.version || '0.0.0',
          'app.kubernetes.io/managed-by': 'ossa',
        },
      },
      spec: {
        description: meta.description || '',
        type: 'Declarative',
        declarative: {
          modelConfig: `${meta.name}-model-config`,
          systemMessage: manifest.spec?.role || '',
          tools: kagentTools,
          ...(a2aConfig ? { a2aConfig } : {}),
        },
      },
    };

    // Also generate the ModelConfig companion resource
    const modelConfig = {
      apiVersion: 'kagent.dev/v1alpha2',
      kind: 'ModelConfig',
      metadata: {
        name: `${meta.name}-model-config`,
        namespace: kagentNs,
      },
      spec: {
        provider: manifest.spec?.llm?.provider || 'openai',
        model: manifest.spec?.llm?.model || 'gpt-4',
        ...(manifest.spec?.llm?.temperature != null
          ? { temperature: manifest.spec.llm.temperature }
          : {}),
        ...(manifest.spec?.llm?.maxTokens != null
          ? { maxTokens: manifest.spec.llm.maxTokens }
          : {}),
      },
    };

    // Return both resources in a multi-document structure
    const config: Record<string, unknown> = {
      _ossa_multi_resource: true,
      resources: [agentCrd, modelConfig],
      agent: agentCrd,
      modelConfig,
    };

    return {
      config,
      filename: `${meta.name}.kagent.yaml`,
    };
  }
}
