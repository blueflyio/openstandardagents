/**
 * LangFlow to OSSA Converter (partial)
 *
 * Converts LangFlow flow JSON (nodes + edges) to OSSA manifest.
 * LangFlow flows are DAGs of components; we extract prompt/LLM/tool nodes into one agent.
 */

import type {
  FrameworkConverter,
  ConversionResult,
  ConverterOptions,
  OSSAManifest,
  AgentSpec,
} from '../types.js';

export interface LangFlowFlow {
  nodes?: Array<{
    id?: string;
    type?: string;
    data?: {
      type?: string;
      node?: { display_name?: string; description?: string };
      template?: Record<string, { value?: string; type?: string }>;
    };
  }>;
  edges?: Array<{ source?: string; target?: string }>;
  [key: string]: unknown;
}

export const langflowConverter: FrameworkConverter = {
  name: 'langflow',
  version: '0.1.0',

  async validate(input: unknown): Promise<boolean> {
    if (typeof input !== 'object' || input === null) return false;
    const flow = input as Record<string, unknown>;
    return Array.isArray(flow.nodes) && flow.nodes.length > 0;
  },

  async convert(
    input: unknown,
    _options: ConverterOptions = {}
  ): Promise<ConversionResult> {
    const flow = input as LangFlowFlow;
    const warnings: string[] = [];

    const roleParts: string[] = [];
    let model = 'gpt-4';
    const tools: AgentSpec['tools'] = [];

    for (const node of flow.nodes ?? []) {
      const data = node.data ?? {};
      const template = data.template ?? {};
      const nodeType = (data.type ?? node.type ?? '').toLowerCase();

      if (nodeType.includes('prompt') || nodeType.includes('message')) {
        const prompt =
          template.message?.value ??
          template.text?.value ??
          template.prompt?.value;
        if (typeof prompt === 'string') roleParts.push(prompt);
      }
      if (
        nodeType.includes('openai') ||
        nodeType.includes('chat') ||
        nodeType.includes('llm')
      ) {
        const m = template.model_name?.value ?? template.model?.value;
        if (typeof m === 'string') model = m;
      }
      if (nodeType.includes('tool') || nodeType.includes('function')) {
        const name = (data.node?.display_name ?? node.id ?? 'tool').toString();
        tools.push({
          name,
          description: (data.node?.description as string) ?? '',
        });
      }
    }

    if (roleParts.length === 0)
      warnings.push('No prompt node found; role set to placeholder.');
    if (tools.length === 0) warnings.push('No tool nodes found.');

    const manifest: OSSAManifest = {
      apiVersion: 'ossa/v0.4',
      kind: 'Agent',
      metadata: {
        name: (flow.name as string) ?? 'langflow-imported-agent',
        version: '1.0.0',
        description:
          (flow.description as string) ?? 'Imported from LangFlow flow',
      },
      spec: {
        role: roleParts.join('\n\n') || 'Agent imported from LangFlow.',
        llm: { provider: 'openai', model },
        tools: tools.length > 0 ? tools : undefined,
      },
    };

    return {
      manifest,
      warnings,
      metadata: {
        source_framework: 'langflow',
        conversion_time: new Date().toISOString(),
        ossa_version: 'ossa/v0.4',
      },
    };
  },
};
