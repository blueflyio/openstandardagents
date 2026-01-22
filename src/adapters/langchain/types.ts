/**
 * LangChain Adapter Types
 */

export interface LangChainAgentConfig {
  name: string;
  systemMessage: string;
  llm: {
    provider: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
  };
  tools: LangChainToolConfig[];
  memory?: {
    type: 'buffer' | 'summary' | 'conversation';
    maxTokenLimit?: number;
  };
}

export interface LangChainToolConfig {
  name: string;
  description: string;
  type: 'function' | 'mcp' | 'api';
  schema?: Record<string, unknown>;
  implementation?: string; // Python code
  server?: string; // MCP server name (for mcp type)
}
