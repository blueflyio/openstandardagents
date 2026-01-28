/**
 * Langflow Importer Service
 *
 * Imports Langflow flows and converts them to OSSA manifests.
 * SOLID: Single Responsibility - Langflow import only
 * DRY: Reuses LangflowAdapter patterns
 */

import { z } from 'zod';
import { readFileSync } from 'fs';
import type { OssaAgent, OssaWorkflow } from '../../types/index.js';

const LangflowFlowSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  id: z.string().uuid().optional(),
  data: z.object({
    nodes: z.array(
      z.object({
        id: z.string(),
        type: z.string(),
        data: z.object({
          type: z.string(),
          node: z.record(z.string(), z.unknown()),
        }),
        position: z.object({
          x: z.number(),
          y: z.number(),
        }),
      })
    ),
    edges: z.array(
      z.object({
        source: z.string(),
        target: z.string(),
        sourceHandle: z.string().optional(),
        targetHandle: z.string().optional(),
      })
    ),
  }),
  is_component: z.boolean().default(false),
});

export type LangflowFlow = z.infer<typeof LangflowFlowSchema>;

export class LangflowImporterService {
  /**
   * Import Langflow flow from JSON file
   * CRUD: Read operation (reads and converts)
   */
  async importFromFile(filePath: string): Promise<OssaAgent | OssaWorkflow> {
    const content = readFileSync(filePath, 'utf-8');
    const flowJson = JSON.parse(content);
    const flow = LangflowFlowSchema.parse(flowJson);

    return this.convertToOSSA(flow);
  }

  /**
   * Import Langflow flow from JSON object
   */
  async importFromJSON(flowJson: unknown): Promise<OssaAgent | OssaWorkflow> {
    const flow = LangflowFlowSchema.parse(flowJson);
    return this.convertToOSSA(flow);
  }

  /**
   * Convert Langflow flow to OSSA manifest
   */
  private convertToOSSA(flow: LangflowFlow): OssaAgent | OssaWorkflow {
    const { nodes, edges } = flow.data;

    // Determine if it's an Agent or Workflow
    const hasMultipleAgents =
      nodes.filter(
        (n) => n.data.type === 'Agent' || n.data.type === 'AgentInitializer'
      ).length > 1;

    const isWorkflow = hasMultipleAgents || edges.length > 3;

    if (isWorkflow) {
      return this.convertToWorkflow(flow);
    } else {
      return this.convertToAgent(flow);
    }
  }

  /**
   * Convert Langflow flow to OSSA Agent
   */
  private convertToAgent(flow: LangflowFlow): OssaAgent {
    const { nodes, edges } = flow.data;

    // Find LLM node
    const llmNode = nodes.find((n) =>
      ['ChatOpenAI', 'OpenAIModel', 'AnthropicModel', 'OllamaModel'].includes(
        n.data.type
      )
    );

    // Find prompt node
    const promptNode = nodes.find((n) =>
      ['PromptTemplate', 'ChatPromptTemplate'].includes(n.data.type)
    );

    // Find agent node
    const agentNode = nodes.find((n) =>
      ['Agent', 'AgentInitializer'].includes(n.data.type)
    );

    // Find tool nodes
    const toolNodes = nodes.filter((n) => n.data.type === 'Tool');

    // Extract LLM config
    const llmConfig = this.extractLLMConfig(llmNode);
    const role = this.extractRole(promptNode);

    // Extract tools
    const tools = toolNodes.map((node) => this.extractTool(node));

    return {
      apiVersion: 'ossa/v0.3.3',
      kind: 'Agent',
      metadata: {
        name: flow.name.toLowerCase().replace(/\s+/g, '-'),
        version: '1.0.0',
        description: flow.description || '',
        labels: {
          framework: 'langflow',
          imported: 'true',
        },
      },
      spec: {
        role: role || 'You are a helpful AI assistant.',
        llm: llmConfig,
        tools: tools.length > 0 ? tools : undefined,
      },
      extensions: {
        langflow: {
          flow_id: flow.id || '',
          components: nodes.map((n) => ({
            node_id: n.id,
            component_type: n.data.type,
            ossa_capability: this.mapComponentToCapability(n.data.type),
          })),
        },
      },
    } as OssaAgent;
  }

  /**
   * Convert Langflow flow to OSSA Workflow
   */
  private convertToWorkflow(flow: LangflowFlow): OssaWorkflow {
    const { nodes, edges } = flow.data;

    // Build dependency graph
    const dependencies = this.buildDependencyGraph(edges);

    // Convert nodes to steps
    const steps = nodes
      .filter((n) =>
        ['Agent', 'AgentInitializer', 'Tool', 'Chain'].includes(n.data.type)
      )
      .map((node, index) => ({
        id: node.id,
        name: node.id.toLowerCase().replace(/-/g, '_'),
        ref: `agents/${node.id}`,
        kind:
          node.data.type === 'Agent' || node.data.type === 'AgentInitializer'
            ? 'Agent'
            : 'Task',
        depends_on: dependencies[node.id] || [],
        input: this.extractStepInput(node),
      }));

    return {
      apiVersion: 'ossa/v0.3.3',
      kind: 'Workflow',
      metadata: {
        name: flow.name.toLowerCase().replace(/\s+/g, '-'),
        version: '1.0.0',
        description: flow.description || '',
        labels: {
          framework: 'langflow',
          imported: 'true',
        },
      },
      spec: {
        input: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
        output: {
          type: 'object',
          properties: {
            result: { type: 'string' },
          },
        },
        steps,
      },
      extensions: {
        langflow: {
          flow_id: flow.id || '',
          components: nodes.map((n) => ({
            node_id: n.id,
            component_type: n.data.type,
            ossa_capability: this.mapComponentToCapability(n.data.type),
          })),
        },
      },
    } as OssaWorkflow;
  }

  /**
   * Extract LLM config from Langflow node
   */
  private extractLLMConfig(node: any): {
    provider: string;
    model: string;
    temperature?: number;
  } {
    if (!node) {
      return { provider: 'openai', model: 'gpt-3.5-turbo' };
    }

    const nodeData = node.data.node?.template || {};
    const modelName =
      nodeData.model_name?.value || nodeData.model?.value || 'gpt-3.5-turbo';

    // Determine provider from node type
    let provider = 'openai';
    if (node.data.type === 'AnthropicModel') provider = 'anthropic';
    if (node.data.type === 'OllamaModel') provider = 'ollama';

    return {
      provider,
      model: modelName,
      temperature: nodeData.temperature?.value,
    };
  }

  /**
   * Extract role from prompt node
   */
  private extractRole(node: any): string | null {
    if (!node) return null;
    const template =
      node.data.node?.template?.template?.value ||
      node.data.node?.template?.system_message?.value;
    return template || null;
  }

  /**
   * Extract tool from Langflow node
   */
  private extractTool(node: any): { name: string; description: string } {
    const nodeData = node.data.node?.template || {};
    return {
      name: nodeData.name?.value || node.id,
      description: nodeData.description?.value || '',
    };
  }

  /**
   * Map Langflow component type to OSSA capability
   */
  private mapComponentToCapability(componentType: string): string {
    const mapping: Record<string, string> = {
      ChatInput: 'receive_input',
      ChatOutput: 'send_output',
      TextInput: 'receive_text',
      TextOutput: 'send_text',
      OpenAIModel: 'llm_inference',
      AnthropicModel: 'llm_inference',
      OllamaModel: 'llm_inference',
      Agent: 'agentic_loop',
      AgentInitializer: 'agentic_loop',
      Tool: 'tool_invoke',
      VectorStore: 'vector_search',
      Retriever: 'retrieve_documents',
      Memory: 'manage_state',
      Prompt: 'format_prompt',
      Parser: 'parse_output',
      Chain: 'execute_chain',
      Embeddings: 'generate_embeddings',
    };
    return mapping[componentType] || 'custom';
  }

  /**
   * Build dependency graph from edges
   */
  private buildDependencyGraph(
    edges: Array<{ source: string; target: string }>
  ): Record<string, string[]> {
    const deps: Record<string, string[]> = {};
    for (const edge of edges) {
      if (!deps[edge.target]) {
        deps[edge.target] = [];
      }
      deps[edge.target].push(edge.source);
    }
    return deps;
  }

  /**
   * Extract step input from node
   */
  private extractStepInput(node: any): Record<string, unknown> {
    // Extract input mapping from node template
    return {};
  }
}
