// OSSA v0.4.0 - Week 3: LangChain Export Adapter
// Location: src/adapters/langchain/converter.ts

import { BaseAdapter, ExportOptions, ExportResult, ExportFile } from '../base.adapter';
import { OssaAgent } from '../../types/ossa';

/**
 * LangChain export adapter
 * Converts OSSA manifests to LangChain agents (Python/TypeScript)
 */
export class LangChainAdapter extends BaseAdapter {
  readonly name = 'langchain';
  readonly version = '1.0.0';
  readonly supportedOssaVersions = ['0.4.0', '0.3.6'];
  readonly outputFormat = ['python', 'typescript'];

  async convert(manifest: OssaAgent, options: ExportOptions): Promise<ExportResult> {
    const startTime = Date.now();
    const files: ExportFile[] = [];

    try {
      // Determine target language
      const language = options.platformOptions?.language || 'python';

      if (language === 'python') {
        files.push(...this.generatePython(manifest, options));
      } else if (language === 'typescript') {
        files.push(...this.generateTypeScript(manifest, options));
      }

      // Generate requirements/package files
      if (language === 'python') {
        files.push(this.generateRequirementsTxt(manifest));
      } else {
        files.push(this.generatePackageJson(manifest));
      }

      // Generate documentation if requested
      if (options.includeDocs) {
        files.push(this.generateReadme(manifest, language));
      }

      // Generate tests if requested
      if (options.includeTests) {
        files.push(this.generateTests(manifest, language));
      }

      const metadata = {
        timestamp: new Date().toISOString(),
        ossaVersion: manifest.apiVersion,
        adapterVersion: this.version,
        agentName: manifest.metadata.name,
        agentVersion: manifest.metadata.version,
        durationMs: Date.now() - startTime,
        fileCount: files.length,
        totalSizeBytes: files.reduce((sum, f) => sum + f.content.length, 0),
      };

      return this.createSuccessResult(files, metadata);
    } catch (error) {
      return this.createErrorResult([`LangChain export failed: ${error.message}`]);
    }
  }

  /**
   * Generate Python LangChain agent
   */
  private generatePython(manifest: OssaAgent, options: ExportOptions): ExportFile[] {
    const files: ExportFile[] = [];

    // Main agent file
    const agentCode = this.generatePythonAgent(manifest);
    files.push(this.createFile('agent.py', agentCode, 'code', 'python', true));

    // Tools file
    if (manifest.agent.capabilities && manifest.agent.capabilities.length > 0) {
      const toolsCode = this.generatePythonTools(manifest);
      files.push(this.createFile('tools.py', toolsCode, 'code', 'python'));
    }

    // Config file
    const configCode = this.generatePythonConfig(manifest);
    files.push(this.createFile('config.py', configCode, 'config', 'python'));

    return files;
  }

  /**
   * Generate Python agent code
   */
  private generatePythonAgent(manifest: OssaAgent): string {
    const { metadata, agent } = manifest;

    return `"""
${metadata.name} - LangChain Agent
Generated from OSSA v${manifest.apiVersion}
Description: ${metadata.description || 'No description'}
"""

from langchain.agents import AgentExecutor, create_structured_chat_agent
from langchain_anthropic import ChatAnthropic
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.tools import Tool
from config import AgentConfig
from tools import get_tools

class ${this.toPascalCase(metadata.name)}:
    """${agent.role || 'AI Agent'}"""

    def __init__(self, config: AgentConfig = None):
        self.config = config or AgentConfig()
        self.llm = self._init_llm()
        self.tools = get_tools()
        self.agent = self._create_agent()
        self.executor = AgentExecutor(
            agent=self.agent,
            tools=self.tools,
            verbose=True,
            handle_parsing_errors=True,
        )

    def _init_llm(self):
        """Initialize LLM based on config"""
        provider = self.config.llm_provider
        model = self.config.llm_model

        if provider == "anthropic":
            return ChatAnthropic(
                model=model,
                temperature=self.config.temperature,
                max_tokens=self.config.max_tokens,
            )
        # Add other providers as needed
        raise ValueError(f"Unsupported LLM provider: {provider}")

    def _create_agent(self):
        """Create LangChain agent with prompt"""
        prompt = ChatPromptTemplate.from_messages([
            ("system", "${agent.role || 'You are a helpful AI assistant.'}"),
            MessagesPlaceholder(variable_name="chat_history", optional=True),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])

        return create_structured_chat_agent(
            llm=self.llm,
            tools=self.tools,
            prompt=prompt,
        )

    def run(self, input_text: str, chat_history: list = None):
        """Execute agent with input"""
        return self.executor.invoke({
            "input": input_text,
            "chat_history": chat_history or [],
        })

def main():
    """Example usage"""
    agent = ${this.toPascalCase(metadata.name)}()
    result = agent.run("Hello! What can you help me with?")
    print(result)

if __name__ == "__main__":
    main()
`;
  }

  /**
   * Generate Python tools
   */
  private generatePythonTools(manifest: OssaAgent): string {
    const tools = manifest.agent.capabilities
      ?.filter((cap) => cap.type === 'tool')
      .map((cap) => {
        return `
def ${this.toSnakeCase(cap.id)}(input_data: str) -> str:
    """${cap.description || cap.id}"""
    # TODO: Implement ${cap.id}
    return f"Result from ${cap.id}: {input_data}"
`;
      })
      .join('\n');

    return `"""
Agent Tools
Generated from OSSA manifest capabilities
"""

from langchain.tools import Tool

${tools}

def get_tools():
    """Get all available tools"""
    return [
${manifest.agent.capabilities
  ?.filter((cap) => cap.type === 'tool')
  .map(
    (cap) => `        Tool(
            name="${cap.id}",
            func=${this.toSnakeCase(cap.id)},
            description="${cap.description || cap.id}",
        ),`
  )
  .join('\n')}
    ]
`;
  }

  /**
   * Generate Python config
   */
  private generatePythonConfig(manifest: OssaAgent): string {
    const llm = manifest.agent.llm;

    return `"""
Agent Configuration
"""

from dataclasses import dataclass
from typing import Optional

@dataclass
class AgentConfig:
    """Configuration for ${manifest.metadata.name}"""

    # LLM Configuration
    llm_provider: str = "${llm?.provider || 'anthropic'}"
    llm_model: str = "${llm?.model || 'claude-sonnet-4-5'}"
    temperature: float = ${llm?.temperature || 0.7}
    max_tokens: int = ${llm?.max_tokens || 4000}

    # Agent Configuration
    verbose: bool = True
    max_iterations: int = 10

    @classmethod
    def from_env(cls):
        """Load config from environment variables"""
        import os
        return cls(
            llm_provider=os.getenv("LLM_PROVIDER", cls.llm_provider),
            llm_model=os.getenv("LLM_MODEL", cls.llm_model),
        )
`;
  }

  /**
   * Generate TypeScript LangChain agent
   */
  private generateTypeScript(manifest: OssaAgent, options: ExportOptions): ExportFile[] {
    const files: ExportFile[] = [];

    const agentCode = this.generateTypeScriptAgent(manifest);
    files.push(this.createFile('agent.ts', agentCode, 'code', 'typescript'));

    return files;
  }

  /**
   * Generate TypeScript agent code
   */
  private generateTypeScriptAgent(manifest: OssaAgent): string {
    return `/**
 * ${manifest.metadata.name} - LangChain Agent
 * Generated from OSSA v${manifest.apiVersion}
 */

import { ChatAnthropic } from "@langchain/anthropic";
import { AgentExecutor, createStructuredChatAgent } from "langchain/agents";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { Tool } from "@langchain/core/tools";

export class ${this.toPascalCase(manifest.metadata.name)} {
  private llm: ChatAnthropic;
  private agent: any;
  private executor: AgentExecutor;

  constructor() {
    this.llm = new ChatAnthropic({
      model: "${manifest.agent.llm?.model || 'claude-sonnet-4-5'}",
      temperature: ${manifest.agent.llm?.temperature || 0.7},
    });

    this.agent = this.createAgent();
    this.executor = AgentExecutor.fromAgentAndTools({
      agent: this.agent,
      tools: this.getTools(),
    });
  }

  private createAgent() {
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", "${manifest.agent.role || 'You are a helpful AI assistant.'}"],
      new MessagesPlaceholder("chat_history"),
      ["human", "{input}"],
      new MessagesPlaceholder("agent_scratchpad"),
    ]);

    return createStructuredChatAgent({
      llm: this.llm,
      tools: this.getTools(),
      prompt,
    });
  }

  private getTools(): Tool[] {
    // TODO: Implement tools from capabilities
    return [];
  }

  async run(input: string): Promise<string> {
    const result = await this.executor.invoke({ input });
    return result.output;
  }
}
`;
  }

  /**
   * Generate requirements.txt
   */
  private generateRequirementsTxt(manifest: OssaAgent): ExportFile {
    const content = `# Requirements for ${manifest.metadata.name}
langchain>=0.1.0
langchain-anthropic>=0.1.0
python-dotenv>=1.0.0
`;
    return this.createFile('requirements.txt', content, 'config');
  }

  /**
   * Generate package.json
   */
  private generatePackageJson(manifest: OssaAgent): ExportFile {
    const content = JSON.stringify(
      {
        name: manifest.metadata.name,
        version: manifest.metadata.version,
        description: manifest.metadata.description,
        dependencies: {
          langchain: '^0.1.0',
          '@langchain/anthropic': '^0.1.0',
          '@langchain/core': '^0.1.0',
        },
      },
      null,
      2
    );
    return this.createFile('package.json', content, 'config', 'json');
  }

  /**
   * Generate README
   */
  private generateReadme(manifest: OssaAgent, language: string): ExportFile {
    const content = `# ${manifest.metadata.name}

${manifest.metadata.description || 'LangChain agent generated from OSSA manifest'}

## Installation

\`\`\`bash
${language === 'python' ? 'pip install -r requirements.txt' : 'npm install'}
\`\`\`

## Usage

\`\`\`${language}
${
  language === 'python'
    ? `from agent import ${this.toPascalCase(manifest.metadata.name)}

agent = ${this.toPascalCase(manifest.metadata.name)}()
result = agent.run("Your input here")
print(result)`
    : `import { ${this.toPascalCase(manifest.metadata.name)} } from './agent';

const agent = new ${this.toPascalCase(manifest.metadata.name)}();
const result = await agent.run("Your input here");
console.log(result);`
}
\`\`\`

## Generated from OSSA

This agent was generated from an OSSA v${manifest.apiVersion} manifest.
`;
    return this.createFile('README.md', content, 'doc');
  }

  /**
   * Generate tests
   */
  private generateTests(manifest: OssaAgent, language: string): ExportFile {
    if (language === 'python') {
      const content = `"""
Tests for ${manifest.metadata.name}
"""

import pytest
from agent import ${this.toPascalCase(manifest.metadata.name)}

def test_agent_initialization():
    agent = ${this.toPascalCase(manifest.metadata.name)}()
    assert agent is not None

def test_agent_run():
    agent = ${this.toPascalCase(manifest.metadata.name)}()
    result = agent.run("test input")
    assert result is not None
`;
      return this.createFile('test_agent.py', content, 'test', 'python');
    } else {
      const content = `import { ${this.toPascalCase(manifest.metadata.name)} } from './agent';

describe('${manifest.metadata.name}', () => {
  test('initializes correctly', () => {
    const agent = new ${this.toPascalCase(manifest.metadata.name)}();
    expect(agent).toBeDefined();
  });
});
`;
      return this.createFile('agent.test.ts', content, 'test', 'typescript');
    }
  }

  // Helper methods
  private toPascalCase(str: string): string {
    return str
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  private toSnakeCase(str: string): string {
    return str.replace(/[-:]/g, '_').toLowerCase();
  }

  getCapabilities() {
    return {
      python: true,
      typescript: true,
      simulation: true,
      incremental: false,
      hotReload: false,
    };
  }
}
