/**
 * LangChain Converter
 * Converts OSSA manifest to LangChain agent
 */

import type { OssaAgent } from '../../types/index.js';
import type { LangChainAgentConfig, LangChainToolConfig } from './types.js';

export class LangChainConverter {
  /**
   * Convert OSSA agent to LangChain agent config
   */
  convert(manifest: OssaAgent): LangChainAgentConfig {
    const spec = manifest.spec as Record<string, unknown>;
    const llm = spec.llm as
      | {
          provider?: string;
          model?: string;
          temperature?: number;
          maxTokens?: number;
        }
      | undefined;

    const tools = this.convertTools(spec.tools);

    return {
      name: manifest.metadata?.name || 'agent',
      systemMessage:
        (spec.role as string) || manifest.metadata?.description || '',
      llm: {
        provider: llm?.provider || 'openai',
        model: llm?.model || 'gpt-4',
        temperature: llm?.temperature,
        maxTokens: llm?.maxTokens,
      },
      tools,
    };
  }

  /**
   * Generate Python code for LangChain agent
   */
  generatePythonCode(manifest: OssaAgent): string {
    const config = this.convert(manifest);

    const toolsCode = config.tools
      .map((tool) => {
        if (tool.type === 'function' && tool.implementation) {
          return tool.implementation;
        }
        return `# Tool: ${tool.name} - ${tool.description}`;
      })
      .join('\n\n');

    return `"""
LangChain Agent: ${config.name}
Generated from OSSA manifest
"""

from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.tools import Tool
import json

def execute_ossa_tool(tool_name: str, input_data: str) -> str:
    """Execute OSSA tool by name"""
    try:
        parsed_input = json.loads(input_data) if isinstance(input_data, str) else input_data
        # Tool execution logic - routes to appropriate handler
        # This would integrate with OSSA runtime
        return json.dumps({"result": f"Executed {tool_name} with {parsed_input}"})
    except Exception as e:
        return json.dumps({"error": str(e)})

# Initialize LLM
llm = ChatOpenAI(
    model="${config.llm.model}",
    temperature=${config.llm.temperature ?? 0.7},
    max_tokens=${config.llm.maxTokens ?? 2000},
)

# Define tools
tools = [
    ${config.tools
      .map((t) => {
        if (t.type === 'mcp' && t.server) {
          return `Tool(
        name="${t.name}",
        description="${t.description}",
        func=lambda input: execute_mcp_tool("${t.server}", "${t.name}", input),
    )`;
        }
        if (t.type === 'function' && t.implementation) {
          return `Tool(
        name="${t.name}",
        description="${t.description}",
        func=${t.implementation},
    )`;
        }
        return `Tool(
        name="${t.name}",
        description="${t.description}",
        func=lambda input: execute_ossa_tool("${t.name}", input),
    )`;
      })
      .join(',\n    ')}
]

# Create prompt
prompt = ChatPromptTemplate.from_messages([
    ("system", """${config.systemMessage}"""),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}"),
    MessagesPlaceholder(variable_name="agent_scratchpad"),
])

# Create agent
agent = create_openai_tools_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

# Run agent
if __name__ == "__main__":
    result = agent_executor.invoke({"input": "Hello, agent!"})
    print(result)
`;
  }

  /**
   * Convert OSSA tools to LangChain tools
   */
  private convertTools(tools: unknown): LangChainToolConfig[] {
    if (!tools || !Array.isArray(tools)) {
      return [];
    }

    return tools.map((tool) => {
      if (typeof tool === 'string') {
        return {
          name: tool,
          description: `Tool: ${tool}`,
          type: 'mcp' as const,
        };
      }

      if (tool && typeof tool === 'object') {
        const toolObj = tool as Record<string, unknown>;
        return {
          name: (toolObj.name as string) || 'unknown',
          description:
            (toolObj.description as string) || `Tool: ${toolObj.name}`,
          type: (toolObj.type as LangChainToolConfig['type']) || 'function',
          schema: toolObj.schema as Record<string, unknown>,
        };
      }

      return {
        name: 'unknown',
        description: 'Unknown tool',
        type: 'function' as const,
      };
    });
  }
}
