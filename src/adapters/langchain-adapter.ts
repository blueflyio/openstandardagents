/**
 * LangChain Adapter
 * Exports OSSA agent manifests to LangChain format
 */

import type { OssaAgent } from '../types/index.js';

export interface LangChainAgent {
  type: 'agent';
  chain_type?: string;
  agent_type:
    | 'zero-shot-react-description'
    | 'conversational-react-description'
    | 'chat-conversational-react-description';
  tools: Array<{
    name: string;
    description: string;
    parameters?: Record<string, unknown>;
  }>;
  llm: {
    model_name: string;
    temperature?: number;
    max_tokens?: number;
  };
  memory?: {
    type: string;
    config?: Record<string, unknown>;
  };
  verbose?: boolean;
}

export class LangChainAdapter {
  /**
   * Convert OSSA agent manifest to LangChain format
   */
  static toLangChain(manifest: OssaAgent): LangChainAgent {
    const spec = manifest.spec || { role: '' };
    const metadata = manifest.metadata || { name: 'unknown-agent' };
    const tools = spec.tools || [];

    // Convert OSSA tools to LangChain tools format
    const langchainTools = tools.map((tool: any) => ({
      name: tool.name || 'unknown',
      description: tool.description || '',
      parameters: tool.input_schema || tool.parameters || {},
    }));

    // Determine agent type based on tools and capabilities
    const agentType = this.determineAgentType(spec.role || '', tools);

    return {
      type: 'agent',
      chain_type: 'llm',
      agent_type: agentType,
      tools: langchainTools,
      llm: {
        model_name: spec.llm?.model || 'gpt-3.5-turbo',
        temperature: spec.llm?.temperature,
        max_tokens: spec.llm?.maxTokens,
      },
      memory: {
        type: 'ConversationBufferMemory',
        config: {
          memory_key: 'chat_history',
          return_messages: true,
        },
      },
      verbose: false,
    };
  }

  /**
   * Determine the best LangChain agent type based on role and tools
   */
  private static determineAgentType(
    role: string,
    tools: Array<Record<string, unknown>>
  ):
    | 'zero-shot-react-description'
    | 'conversational-react-description'
    | 'chat-conversational-react-description' {
    const roleLower = role.toLowerCase();

    // If role mentions conversation or chat, use conversational agent
    if (roleLower.includes('conversation') || roleLower.includes('chat')) {
      return 'chat-conversational-react-description';
    }

    // If there are tools, use react agent
    if (tools.length > 0) {
      return 'zero-shot-react-description';
    }

    // Default to conversational for general use
    return 'conversational-react-description';
  }

  /**
   * Convert OSSA agent manifest to LangChain Python code
   */
  static toPythonCode(manifest: OssaAgent): string {
    const langchainAgent = this.toLangChain(manifest);
    const metadata = manifest.metadata || { name: 'unknown-agent' };

    let code = `"""
LangChain Agent: ${metadata.name}
Generated from OSSA manifest
"""

from langchain.agents import initialize_agent, AgentType
from langchain.chat_models import ChatOpenAI
from langchain.memory import ConversationBufferMemory
from langchain.tools import Tool

# Initialize LLM
llm = ChatOpenAI(
    model_name="${langchainAgent.llm.model_name}",
`;

    if (langchainAgent.llm.temperature !== undefined) {
      code += `    temperature=${langchainAgent.llm.temperature},\n`;
    }
    if (langchainAgent.llm.max_tokens !== undefined) {
      code += `    max_tokens=${langchainAgent.llm.max_tokens},\n`;
    }

    code += `)

# Initialize memory
memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True
)

# Define tools
tools = [
`;

    langchainAgent.tools.forEach((tool, index) => {
      code += `    Tool(
        name="${tool.name}",
        description="${tool.description}",
        func=lambda x: "Implement ${tool.name} logic here"
    )${index < langchainAgent.tools.length - 1 ? ',' : ''}
`;
    });

    code += `]

# Initialize agent
agent = initialize_agent(
    tools=tools,
    llm=llm,
    agent=AgentType.${this.getAgentTypeEnum(langchainAgent.agent_type)},
    memory=memory,
    verbose=${langchainAgent.verbose ? 'True' : 'False'}
)

# Run agent
if __name__ == "__main__":
    response = agent.run("${metadata.description || 'Your query here'}")
    print(response)
`;

    return code;
  }

  /**
   * Get LangChain AgentType enum value
   */
  private static getAgentTypeEnum(agentType: string): string {
    const typeMap: Record<string, string> = {
      'zero-shot-react-description': 'ZERO_SHOT_REACT_DESCRIPTION',
      'conversational-react-description': 'CONVERSATIONAL_REACT_DESCRIPTION',
      'chat-conversational-react-description': 'CHAT_CONVERSATIONAL_REACT_DESCRIPTION',
    };
    return typeMap[agentType] || 'ZERO_SHOT_REACT_DESCRIPTION';
  }
}

export default LangChainAdapter;
