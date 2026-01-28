/**
 * kagent.dev CRD Parser
 * Converts kagent.dev CRD back to OSSA manifest format
 */

import type { OssaAgent } from '../../types/index.js';
import type { KAgentCRD } from './types.js';

export class KAgentCRDParser {
  /**
   * Parse kagent CRD to OSSA manifest
   */
  parse(crd: KAgentCRD): OssaAgent {
    const manifest: OssaAgent = {
      apiVersion: 'ossa/v0.3.6',
      kind: 'Agent',
      metadata: {
        name: crd.metadata.name,
        version: crd.metadata.labels?.['ossa.ai/version'] || '0.3.6',
        labels: {
          ...crd.metadata.labels,
          'kagent.dev/namespace': crd.metadata.namespace || 'default',
        },
        annotations: crd.metadata.annotations,
      },
      spec: {
        role: crd.spec.systemMessage || 'Agent',
        llm: {
          provider: crd.spec.modelConfig.provider,
          model: crd.spec.modelConfig.model,
          ...(crd.spec.modelConfig.temperature !== undefined && {
            temperature: crd.spec.modelConfig.temperature,
          }),
          ...(crd.spec.modelConfig.maxTokens !== undefined && {
            maxTokens: crd.spec.modelConfig.maxTokens,
          }),
          ...(crd.spec.modelConfig.topP !== undefined && {
            topP: crd.spec.modelConfig.topP,
          }),
        },
        ...(crd.spec.tools && {
          tools: crd.spec.tools.map((tool) => ({
            type: tool.type,
            name: tool.name,
            server: tool.server,
            namespace: tool.namespace,
            endpoint: tool.endpoint,
          })),
        }),
        ...(crd.spec.enableA2A && {
          a2a: {
            enabled: true,
          },
        }),
      },
    };

    // Restore taxonomy from labels if present
    const domain = crd.metadata.labels?.['ossa.ai/domain'];
    if (domain) {
      const specRecord = manifest.spec as Record<string, unknown>;
      specRecord.taxonomy = {
        domain,
      };
    }

    // Restore full manifest from annotations if present
    const ossaManifestJson = crd.metadata.annotations?.['ossa.ai/manifest'];
    if (ossaManifestJson) {
      try {
        const restored = JSON.parse(ossaManifestJson) as OssaAgent;
        // Merge restored manifest with parsed data
        return {
          ...restored,
          metadata: {
            ...restored.metadata,
            ...manifest.metadata,
            name:
              manifest.metadata?.name ||
              restored.metadata?.name ||
              crd.metadata.name, // Ensure name is always set
          },
          spec: {
            ...restored.spec,
            ...manifest.spec,
            role: manifest.spec?.role || restored.spec?.role || 'Agent', // Ensure role is always set
          },
        };
      } catch (error) {
        // If parsing fails, return parsed manifest
        console.warn(
          'Failed to restore OSSA manifest from annotations:',
          error
        );
      }
    }

    return manifest;
  }
}
