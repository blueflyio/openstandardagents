/**
 * Langflow Adapter
 * Exports OSSA agent manifests to Langflow visual flow format
 */

import type { OssaAgent } from '../types/index.js';

export interface LangflowNode {
  id: string;
  data: {
    type: string;
    node: Record<string, unknown>;
  };
  position: {
    x: number;
    y: number;
  };
  type: string;
}

export interface LangflowEdge {
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface LangflowFlow {
  name: string;
  description: string;
  nodes: LangflowNode[];
  edges: LangflowEdge[];
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
}

export class LangflowAdapter {
  /**
   * Convert OSSA agent manifest to Langflow format
   */
  static toLangflow(manifest: OssaAgent): LangflowFlow {
    const spec = manifest.spec || { role: '' };
    const metadata = manifest.metadata || { name: 'unknown-flow', description: '' };
    const tools = spec.tools || [];

    const nodes: LangflowNode[] = [];
    const edges: LangflowEdge[] = [];

    // Create LLM node
    const llmNode: LangflowNode = {
      id: 'llm-1',
      data: {
        type: 'ChatOpenAI',
        node: {
          template: {
            model_name: {
              value: spec.llm?.model || 'gpt-3.5-turbo',
            },
            temperature: {
              value: spec.llm?.temperature ?? 0.7,
            },
            max_tokens: {
              value: spec.llm?.maxTokens ?? 2000,
            },
          },
        },
      },
      position: { x: 250, y: 100 },
      type: 'ChatOpenAI',
    };
    nodes.push(llmNode);

    // Create Prompt node
    const promptNode: LangflowNode = {
      id: 'prompt-1',
      data: {
        type: 'PromptTemplate',
        node: {
          template: {
            template: {
              value: spec.role || 'You are a helpful AI assistant.',
            },
          },
        },
      },
      position: { x: 250, y: 0 },
      type: 'PromptTemplate',
    };
    nodes.push(promptNode);

    // Create Agent node
    const agentNode: LangflowNode = {
      id: 'agent-1',
      data: {
        type: 'AgentInitializer',
        node: {
          template: {
            agent_type: {
              value: 'zero-shot-react-description',
            },
            llm: {
              value: 'llm-1',
            },
            tools: {
              value: tools.map((t: any, i: number) => `tool-${i + 1}`),
            },
          },
        },
      },
      position: { x: 500, y: 100 },
      type: 'AgentInitializer',
    };
    nodes.push(agentNode);

    // Create tool nodes
    tools.forEach((tool: any, index: number) => {
      const toolNode: LangflowNode = {
        id: `tool-${index + 1}`,
        data: {
          type: 'Tool',
          node: {
            template: {
              name: {
                value: tool.name || `tool_${index + 1}`,
              },
              description: {
                value: tool.description || '',
              },
              func: {
                value: 'def function(input: str) -> str:\n    return "Implement tool logic here"',
              },
            },
          },
        },
        position: { x: 750, y: index * 100 },
        type: 'Tool',
      };
      nodes.push(toolNode);

      // Connect tool to agent
      edges.push({
        source: `tool-${index + 1}`,
        target: 'agent-1',
        sourceHandle: 'output',
        targetHandle: 'tools',
      });
    });

    // Connect prompt to LLM
    edges.push({
      source: 'prompt-1',
      target: 'llm-1',
      sourceHandle: 'prompt',
      targetHandle: 'prompt',
    });

    // Connect LLM to Agent
    edges.push({
      source: 'llm-1',
      target: 'agent-1',
      sourceHandle: 'llm',
      targetHandle: 'llm',
    });

    return {
      name: metadata.name,
      description: metadata.description || '',
      nodes,
      edges,
      viewport: {
        x: 0,
        y: 0,
        zoom: 1,
      },
    };
  }

  /**
   * Convert to Langflow JSON format (compatible with import)
   */
  static toJSON(manifest: OssaAgent): string {
    const flow = this.toLangflow(manifest);

    // Langflow expects a specific JSON structure
    const langflowExport = {
      data: {
        nodes: flow.nodes,
        edges: flow.edges,
      },
      description: flow.description,
      name: flow.name,
      is_component: false,
    };

    return JSON.stringify(langflowExport, null, 2);
  }

  /**
   * Create a simplified Langflow flow for basic chat agents
   */
  static toSimpleFlow(manifest: OssaAgent): LangflowFlow {
    const spec = manifest.spec || { role: '' };
    const metadata = manifest.metadata || { name: 'unknown-flow', description: '' };

    const nodes: LangflowNode[] = [];
    const edges: LangflowEdge[] = [];

    // Create a simple chat flow with just LLM and prompt
    const promptNode: LangflowNode = {
      id: 'prompt-1',
      data: {
        type: 'ChatPromptTemplate',
        node: {
          template: {
            system_message: {
              value: spec.role || 'You are a helpful AI assistant.',
            },
          },
        },
      },
      position: { x: 100, y: 100 },
      type: 'ChatPromptTemplate',
    };
    nodes.push(promptNode);

    const llmNode: LangflowNode = {
      id: 'llm-1',
      data: {
        type: 'ChatOpenAI',
        node: {
          template: {
            model_name: {
              value: spec.llm?.model || 'gpt-3.5-turbo',
            },
            temperature: {
              value: spec.llm?.temperature ?? 0.7,
            },
          },
        },
      },
      position: { x: 400, y: 100 },
      type: 'ChatOpenAI',
    };
    nodes.push(llmNode);

    const outputNode: LangflowNode = {
      id: 'output-1',
      data: {
        type: 'ChatOutput',
        node: {
          template: {},
        },
      },
      position: { x: 700, y: 100 },
      type: 'ChatOutput',
    };
    nodes.push(outputNode);

    // Connect nodes
    edges.push({
      source: 'prompt-1',
      target: 'llm-1',
    });

    edges.push({
      source: 'llm-1',
      target: 'output-1',
    });

    return {
      name: metadata.name,
      description: metadata.description || '',
      nodes,
      edges,
      viewport: {
        x: 0,
        y: 0,
        zoom: 1,
      },
    };
  }
}

export default LangflowAdapter;
