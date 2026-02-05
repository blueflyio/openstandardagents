/**
 * kagent.dev CRD Generator
 * Converts OSSA manifest to kagent.dev CRD format
 */

import type { OssaAgent } from '../../types/index.js';
import type { KAgentCRD, KAgentDeploymentOptions } from './types.js';

export class KAgentCRDGenerator {
  /**
   * Generate kagent CRD from OSSA manifest
   */
  generate(
    manifest: OssaAgent,
    options: KAgentDeploymentOptions = {}
  ): KAgentCRD {
    const spec = manifest.spec as Record<string, unknown>;
    const llmConfig = spec.llm as
      | {
          provider?: string;
          model?: string;
          temperature?: number;
          maxTokens?: number;
          topP?: number;
        }
      | undefined;

    const agentName = manifest.metadata?.name || 'unknown-agent';
    const systemMessage =
      (spec.role as string) || manifest.metadata?.description || '';

    // Extract tools
    const tools = this.extractTools(spec.tools, options);

    // Build CRD
    const crd: KAgentCRD = {
      apiVersion: 'kagent.dev/v1alpha1',
      kind: 'Agent',
      metadata: {
        name: agentName,
        namespace: options.namespace || 'default',
        labels: {
          'ossa.ai/version': manifest.metadata?.version || '0.3.5',
          'ossa.ai/domain':
            ((spec.taxonomy as Record<string, unknown>)?.domain as string) ||
            'agents',
          ...manifest.metadata?.labels,
        },
        annotations: {
          'ossa.ai/manifest': JSON.stringify(manifest),
          ...manifest.metadata?.annotations,
        },
      },
      spec: {
        systemMessage,
        modelConfig: {
          provider: llmConfig?.provider || 'openai',
          model: llmConfig?.model || 'gpt-4',
          ...(llmConfig?.temperature !== undefined && {
            temperature: llmConfig.temperature,
          }),
          ...(llmConfig?.maxTokens !== undefined && {
            maxTokens: llmConfig.maxTokens,
          }),
          ...(llmConfig?.topP !== undefined && { topP: llmConfig.topP }),
          ...(options.apiKeySecret && { secretRef: options.apiKeySecret }),
        },
        ...(tools && tools.length > 0 && { tools }),

        // Skills (from OSSA spec or options)
        ...(options.skills &&
          options.skills.length > 0 && { skills: options.skills }),

        // A2A Protocol
        enableA2A: this.shouldEnableA2A(manifest),
        ...(options.a2a && {
          a2aProtocol: {
            enabled: options.a2a.enabled,
            endpoint: options.a2a.endpoint,
            timeout: options.a2a.timeout || 30000,
            retries: options.a2a.retries || 3,
          },
        }),

        // Code execution
        ...(options.codeExecution && {
          codeExecution: {
            enabled: options.codeExecution.enabled,
            sandboxed: options.codeExecution.sandboxed !== false,
            allowedLanguages: options.codeExecution.allowedLanguages || [
              'python',
              'javascript',
            ],
          },
        }),

        // Resources
        ...(options.replicas !== undefined && {
          resources: {
            replicas: options.replicas,
            ...options.resources,
          },
        }),

        // Security
        ...(options.securityContext && {
          securityContext: options.securityContext,
        }),

        // RBAC
        ...(options.rbac && {
          serviceAccountName:
            options.rbac.serviceAccountName || `${agentName}-sa`,
          rbac: {
            enabled: options.rbac.enabled,
            rules: options.rbac.rules || this.getDefaultRBACRules(),
          },
        }),

        // BYO Agent
        ...(options.byoAgent && {
          byoAgent: {
            enabled: options.byoAgent.enabled,
            image: options.byoAgent.image,
            command: options.byoAgent.command,
            args: options.byoAgent.args,
          },
        }),
      },
    };

    return crd;
  }

  /**
   * Extract tools from OSSA spec
   */
  private extractTools(
    tools: unknown,
    options: KAgentDeploymentOptions = {}
  ): KAgentCRD['spec']['tools'] {
    if (!tools || !Array.isArray(tools)) {
      return undefined;
    }

    return tools
      .map((tool) => {
        if (typeof tool === 'string') {
          return {
            type: 'mcp',
            name: tool,
            server: tool,
            ...(options.tls && {
              tlsConfig: {
                enabled: options.tls.enabled,
                secretName: options.tls.secretName,
                verifyServer: options.tls.verifyServer !== false,
              },
            }),
            ...(options.headerPropagation && {
              headerPropagation: options.headerPropagation,
            }),
          };
        }

        if (tool && typeof tool === 'object') {
          const toolObj = tool as Record<string, unknown>;
          return {
            type: (toolObj.type as string) || 'mcp',
            name: toolObj.name as string,
            server: toolObj.server as string,
            namespace: toolObj.namespace as string,
            endpoint: toolObj.endpoint as string,
            ...(options.tls && {
              tlsConfig: {
                enabled: options.tls.enabled,
                secretName: options.tls.secretName,
                verifyServer: options.tls.verifyServer !== false,
              },
            }),
            ...(options.headerPropagation && {
              headerPropagation: options.headerPropagation,
            }),
          };
        }

        return null;
      })
      .filter((tool): tool is NonNullable<typeof tool> => tool !== null);
  }

  /**
   * Determine if A2A should be enabled
   */
  private shouldEnableA2A(manifest: OssaAgent): boolean {
    const spec = manifest.spec as Record<string, unknown>;
    const a2a = spec.a2a as Record<string, unknown> | undefined;
    return a2a !== undefined && Object.keys(a2a).length > 0;
  }

  /**
   * Get default RBAC rules for agent
   */
  private getDefaultRBACRules(): Array<{
    apiGroups: string[];
    resources: string[];
    verbs: string[];
  }> {
    return [
      {
        apiGroups: ['kagent.dev'],
        resources: ['agents', 'agents/status'],
        verbs: ['get', 'list', 'watch', 'update', 'patch'],
      },
      {
        apiGroups: [''],
        resources: ['secrets'],
        verbs: ['get', 'list'],
      },
      {
        apiGroups: [''],
        resources: ['configmaps'],
        verbs: ['get', 'list', 'watch'],
      },
    ];
  }
}
