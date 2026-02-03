/**
 * LangChain Exporter Service
 *
 * Exports OSSA manifests to production-ready LangChain agents with:
 * - Python agent code with @tool decorators
 * - FastAPI REST API server
 * - OpenAPI 3.1 specification
 * - Docker containerization
 * - Memory configuration
 *
 * SOLID: Single Responsibility - LangChain export orchestration
 * DRY: Reuses generators for each component
 * API-First: Generates OpenAPI spec from OSSA manifest
 */

import type { OssaAgent } from '../../../types/index.js';
import type { ExportFile } from '../../../adapters/base/adapter.interface.js';
import { ToolsGenerator } from './tools-generator.js';
import { MemoryGenerator } from './memory-generator.js';
import { ApiGenerator } from './api-generator.js';
import { OpenApiGenerator } from './openapi-generator.js';
import { StreamingGenerator, type StreamingConfig } from './streaming-generator.js';

/**
 * LangChain export options
 */
export interface LangChainExportOptions {
  /**
   * Target Python version
   */
  pythonVersion?: string;

  /**
   * Include FastAPI server
   */
  includeApi?: boolean;

  /**
   * Include OpenAPI spec
   */
  includeOpenApi?: boolean;

  /**
   * Include Docker files
   */
  includeDocker?: boolean;

  /**
   * Include tests
   */
  includeTests?: boolean;

  /**
   * Memory backend
   */
  memoryBackend?: 'buffer' | 'summary' | 'redis' | 'postgres';

  /**
   * API port
   */
  apiPort?: number;

  /**
   * Streaming configuration
   */
  streaming?: StreamingConfig;
}

/**
 * LangChain export result
 */
export interface LangChainExportResult {
  /**
   * Success status
   */
  success: boolean;

  /**
   * Generated files
   */
  files: ExportFile[];

  /**
   * Error message if failed
   */
  error?: string;

  /**
   * Export metadata
   */
  metadata?: {
    pythonVersion: string;
    langchainVersion: string;
    toolsCount: number;
    memoryType: string;
    hasApi: boolean;
    hasOpenApi: boolean;
    duration: number;
  };
}

/**
 * LangChain Exporter
 */
export class LangChainExporter {
  private toolsGenerator: ToolsGenerator;
  private memoryGenerator: MemoryGenerator;
  private apiGenerator: ApiGenerator;
  private openApiGenerator: OpenApiGenerator;
  private streamingGenerator: StreamingGenerator;

  constructor() {
    this.toolsGenerator = new ToolsGenerator();
    this.memoryGenerator = new MemoryGenerator();
    this.apiGenerator = new ApiGenerator();
    this.openApiGenerator = new OpenApiGenerator();
    this.streamingGenerator = new StreamingGenerator();
  }

  /**
   * Export OSSA manifest to LangChain
   */
  async export(
    manifest: OssaAgent,
    options: LangChainExportOptions = {}
  ): Promise<LangChainExportResult> {
    const startTime = Date.now();

    try {
      const files: ExportFile[] = [];
      const pythonVersion = options.pythonVersion || '3.11';
      const includeApi = options.includeApi !== false;
      const includeOpenApi = options.includeOpenApi !== false;
      const includeDocker = options.includeDocker !== false;
      const memoryBackend = options.memoryBackend || 'buffer';

      // Validate manifest
      this.validateManifest(manifest);

      // Generate agent code
      const agentCode = this.generateAgentCode(manifest, options);
      files.push({
        path: 'agent.py',
        content: agentCode,
        type: 'code',
        language: 'python',
      });

      // Generate tools
      const toolsCode = this.toolsGenerator.generate(manifest);
      files.push({
        path: 'tools.py',
        content: toolsCode,
        type: 'code',
        language: 'python',
      });

      // Generate memory configuration
      const memoryCode = this.memoryGenerator.generate(manifest, memoryBackend);
      files.push({
        path: 'memory.py',
        content: memoryCode,
        type: 'code',
        language: 'python',
      });

      // Generate streaming support
      const streamingCode = this.streamingGenerator.generate(manifest, options.streaming || {});
      files.push({
        path: 'streaming.py',
        content: streamingCode,
        type: 'code',
        language: 'python',
      });

      // Generate FastAPI server
      if (includeApi) {
        const apiCode = this.apiGenerator.generate(manifest, options.apiPort);
        files.push({
          path: 'server.py',
          content: apiCode,
          type: 'code',
          language: 'python',
        });
      }

      // Generate OpenAPI spec
      if (includeOpenApi) {
        const openApiSpec = this.openApiGenerator.generate(manifest);
        files.push({
          path: 'openapi.yaml',
          content: openApiSpec,
          type: 'config',
          language: 'yaml',
        });
      }

      // Generate requirements.txt
      const requirements = this.generateRequirements(manifest, options);
      files.push({
        path: 'requirements.txt',
        content: requirements,
        type: 'config',
      });

      // Generate Dockerfile
      if (includeDocker) {
        const dockerfile = this.generateDockerfile(pythonVersion);
        files.push({
          path: 'Dockerfile',
          content: dockerfile,
          type: 'config',
        });

        const dockerCompose = this.generateDockerCompose(manifest, options);
        files.push({
          path: 'docker-compose.yaml',
          content: dockerCompose,
          type: 'config',
          language: 'yaml',
        });
      }

      // Generate .env.example
      const envExample = this.generateEnvExample(manifest);
      files.push({
        path: '.env.example',
        content: envExample,
        type: 'config',
      });

      // Generate README
      const readme = this.generateReadme(manifest, options);
      files.push({
        path: 'README.md',
        content: readme,
        type: 'documentation',
        language: 'markdown',
      });

      // Generate tests (if requested)
      if (options.includeTests) {
        const testsCode = this.generateTests(manifest);
        files.push({
          path: 'test_agent.py',
          content: testsCode,
          type: 'test',
          language: 'python',
        });
      }

      const duration = Date.now() - startTime;
      const toolsCount = manifest.spec?.tools?.length || 0;

      return {
        success: true,
        files,
        metadata: {
          pythonVersion,
          langchainVersion: '0.1.0',
          toolsCount,
          memoryType: memoryBackend,
          hasApi: includeApi,
          hasOpenApi: includeOpenApi,
          duration,
        },
      };
    } catch (error) {
      return {
        success: false,
        files: [],
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          pythonVersion: options.pythonVersion || '3.11',
          langchainVersion: '0.1.0',
          toolsCount: 0,
          memoryType: options.memoryBackend || 'buffer',
          hasApi: false,
          hasOpenApi: false,
          duration: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Validate OSSA manifest for LangChain export
   */
  private validateManifest(manifest: OssaAgent): void {
    if (!manifest.metadata?.name) {
      throw new Error('Manifest must have metadata.name');
    }

    if (!manifest.spec?.role) {
      throw new Error('Manifest must have spec.role (system prompt)');
    }
  }

  /**
   * Generate main agent code
   */
  private generateAgentCode(
    manifest: OssaAgent,
    options: LangChainExportOptions
  ): string {
    const agentName = manifest.metadata?.name || 'agent';
    const systemPrompt = manifest.spec?.role || '';
    const llm = manifest.spec?.llm as any;
    const provider = llm?.provider || 'openai';
    const model = llm?.model || 'gpt-4';
    const temperature = llm?.temperature ?? 0.7;
    const maxTokens = llm?.maxTokens ?? 2000;

    return `"""
${agentName} - LangChain Agent
Generated from OSSA manifest

Description: ${manifest.metadata?.description || 'AI Agent'}
Version: ${manifest.metadata?.version || '1.0.0'}
"""

from typing import Any, Dict, List, Optional
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from tools import get_tools
from memory import get_memory
import os

# LLM Configuration
LLM_PROVIDER = "${provider}"
LLM_MODEL = "${model}"
LLM_TEMPERATURE = ${temperature}
LLM_MAX_TOKENS = ${maxTokens}


def create_llm():
    """Initialize LLM based on provider configuration"""
    if LLM_PROVIDER == "anthropic":
        return ChatAnthropic(
            model=LLM_MODEL,
            temperature=LLM_TEMPERATURE,
            max_tokens=LLM_MAX_TOKENS,
            api_key=os.getenv("ANTHROPIC_API_KEY"),
        )
    elif LLM_PROVIDER == "openai":
        return ChatOpenAI(
            model=LLM_MODEL,
            temperature=LLM_TEMPERATURE,
            max_tokens=LLM_MAX_TOKENS,
            api_key=os.getenv("OPENAI_API_KEY"),
        )
    else:
        raise ValueError(f"Unsupported LLM provider: {LLM_PROVIDER}")


def create_agent() -> AgentExecutor:
    """Create and configure the LangChain agent"""

    # Initialize LLM
    llm = create_llm()

    # Get tools
    tools = get_tools()

    # Create prompt template
    prompt = ChatPromptTemplate.from_messages([
        ("system", """${systemPrompt.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"""),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad"),
    ])

    # Create agent
    agent = create_openai_tools_agent(llm, tools, prompt)

    # Get memory
    memory = get_memory()

    # Create executor
    agent_executor = AgentExecutor(
        agent=agent,
        tools=tools,
        memory=memory,
        verbose=True,
        handle_parsing_errors=True,
        max_iterations=10,
    )

    return agent_executor


# Create global agent instance
agent = create_agent()


def run(input_text: str, chat_history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
    """
    Run the agent with input text

    Args:
        input_text: User input message
        chat_history: Optional chat history for context

    Returns:
        Agent response with output and metadata
    """
    try:
        result = agent.invoke({
            "input": input_text,
            "chat_history": chat_history or [],
        })

        return {
            "output": result.get("output", ""),
            "success": True,
        }
    except Exception as e:
        return {
            "output": "",
            "success": False,
            "error": str(e),
        }


if __name__ == "__main__":
    # Example usage
    print(f"Starting {agentName}...")

    response = run("Hello! What can you help me with?")
    print(f"Agent: {response['output']}")
`;
  }

  /**
   * Generate requirements.txt
   */
  private generateRequirements(
    manifest: OssaAgent,
    options: LangChainExportOptions
  ): string {
    const requirements = [
      '# LangChain Core',
      'langchain>=0.1.0',
      'langchain-openai>=0.0.5',
      'langchain-core>=0.1.0',
      '',
      '# LLM Providers',
    ];

    const llm = manifest.spec?.llm as any;
    const provider = llm?.provider || 'openai';

    if (provider === 'anthropic') {
      requirements.push('langchain-anthropic>=0.1.0');
    } else if (provider === 'openai') {
      requirements.push('openai>=1.0.0');
    }

    requirements.push(
      '',
      '# Memory & Storage',
      'redis>=5.0.0  # For Redis memory backend',
      'psycopg2-binary>=2.9.0  # For Postgres memory backend',
      ''
    );

    if (options.includeApi !== false) {
      requirements.push(
        '# FastAPI Server',
        'fastapi>=0.109.0',
        'uvicorn[standard]>=0.27.0',
        'pydantic>=2.0.0',
        ''
      );
    }

    // Streaming dependencies
    const streamingConfig = options.streaming;
    if (streamingConfig?.sse?.enabled === true || streamingConfig?.websocket?.enabled === true) {
      requirements.push('# Streaming Support');

      if (streamingConfig?.sse?.enabled !== false) {
        requirements.push('sse-starlette>=1.8.0  # Server-Sent Events');
      }

      if (streamingConfig?.websocket?.enabled !== false) {
        requirements.push('websockets>=12.0  # WebSocket streaming');
      }

      requirements.push('');
    }

    requirements.push(
      '# Utilities',
      'python-dotenv>=1.0.0',
      'pyyaml>=6.0.0',
      'httpx>=0.26.0',
      ''
    );

    return requirements.join('\n');
  }

  /**
   * Generate Dockerfile
   */
  private generateDockerfile(pythonVersion: string): string {
    return `FROM python:${pythonVersion}-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    gcc \\
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose API port
EXPOSE 8000

# Run FastAPI server
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
`;
  }

  /**
   * Generate docker-compose.yaml
   */
  private generateDockerCompose(
    manifest: OssaAgent,
    options: LangChainExportOptions
  ): string {
    const agentName = manifest.metadata?.name || 'agent';
    const port = options.apiPort || 8000;
    const memoryBackend = options.memoryBackend || 'buffer';

    let compose = `version: '3.8'

services:
  ${agentName}:
    build: .
    ports:
      - "${port}:8000"
    environment:
      - OPENAI_API_KEY=\${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=\${ANTHROPIC_API_KEY}
`;

    if (memoryBackend === 'redis') {
      compose += `      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
`;
    } else if (memoryBackend === 'postgres') {
      compose += `      - POSTGRES_URL=postgresql://postgres:postgres@postgres:5432/agent_memory
    depends_on:
      - postgres

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=agent_memory
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
`;
    }

    return compose;
  }

  /**
   * Generate .env.example
   */
  private generateEnvExample(manifest: OssaAgent): string {
    const llm = manifest.spec?.llm as any;
    const provider = llm?.provider || 'openai';

    const vars = [
      '# LLM API Keys',
      'OPENAI_API_KEY=your-openai-api-key-here',
      'ANTHROPIC_API_KEY=your-anthropic-api-key-here',
      '',
      '# Memory Backend',
      'REDIS_URL=redis://localhost:6379',
      'POSTGRES_URL=postgresql://postgres:postgres@localhost:5432/agent_memory',
      '',
      '# API Configuration',
      'API_PORT=8000',
      'API_HOST=0.0.0.0',
      '',
    ];

    return vars.join('\n');
  }

  /**
   * Generate README.md
   */
  private generateReadme(
    manifest: OssaAgent,
    options: LangChainExportOptions
  ): string {
    const agentName = manifest.metadata?.name || 'agent';
    const description = manifest.metadata?.description || 'AI Agent';
    const llm = manifest.spec?.llm as any;
    const provider = llm?.provider || 'openai';
    const model = llm?.model || 'gpt-4';
    const toolsCount = manifest.spec?.tools?.length || 0;

    return `# ${agentName}

${description}

## Overview

This is a production-ready LangChain agent exported from an OSSA manifest.

**Configuration:**
- LLM: ${provider} (${model})
- Tools: ${toolsCount} available
- Memory: ${options.memoryBackend || 'buffer'}
- API: ${options.includeApi !== false ? 'FastAPI REST server' : 'No API'}

## Setup

### 1. Install Dependencies

\`\`\`bash
pip install -r requirements.txt
\`\`\`

### 2. Configure Environment

Copy \`.env.example\` to \`.env\` and add your API keys:

\`\`\`bash
cp .env.example .env
# Edit .env with your API keys
\`\`\`

### 3. Run Agent

**Python CLI:**
\`\`\`bash
python agent.py
\`\`\`

**FastAPI Server:**
\`\`\`bash
uvicorn server:app --reload
\`\`\`

**Docker:**
\`\`\`bash
docker-compose up
\`\`\`

## API Usage

### POST /chat

Send a message to the agent:

\`\`\`bash
curl -X POST http://localhost:8000/chat \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello, agent!"}'
\`\`\`

### GET /health

Check server health:

\`\`\`bash
curl http://localhost:8000/health
\`\`\`

### GET /openapi.json

Get OpenAPI specification:

\`\`\`bash
curl http://localhost:8000/openapi.json
\`\`\`

## Development

### Run Tests

\`\`\`bash
pytest test_agent.py -v
\`\`\`

### Code Quality

\`\`\`bash
black .
ruff check .
mypy .
\`\`\`

## Tools

${manifest.spec?.tools?.map((tool: any) => `- **${tool.name}**: ${tool.description || 'No description'}`).join('\n') || 'No tools configured'}

## Generated from OSSA

- Manifest: \`agent.ossa.yaml\`
- OSSA Version: ${manifest.apiVersion?.split('/')[1] || 'v0.3.6'}
- Export Date: ${new Date().toISOString().split('T')[0]}

## License

${manifest.metadata?.license || 'MIT'}
`;
  }

  /**
   * Generate tests
   */
  private generateTests(manifest: OssaAgent): string {
    const agentName = manifest.metadata?.name || 'agent';

    return `"""
Tests for ${agentName}
"""

import pytest
from agent import create_agent, run


def test_agent_creation():
    """Test agent can be created"""
    agent = create_agent()
    assert agent is not None


def test_agent_run():
    """Test agent can process input"""
    response = run("Hello!")
    assert response is not None
    assert "success" in response
    assert response["success"] is True


def test_agent_error_handling():
    """Test agent handles errors gracefully"""
    # This should not crash
    response = run("")
    assert response is not None


@pytest.mark.parametrize("input_text", [
    "What can you help me with?",
    "Tell me about yourself",
    "What tools do you have?",
])
def test_agent_various_inputs(input_text):
    """Test agent with various inputs"""
    response = run(input_text)
    assert response["success"] is True
    assert len(response.get("output", "")) > 0
`;
  }
}
