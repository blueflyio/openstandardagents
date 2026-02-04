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
import { CallbacksGenerator, type CallbackConfig } from './callbacks-generator.js';
import { ErrorHandlingGenerator, type ErrorHandlingConfig } from './error-handling-generator.js';
import { TestGenerator, type TestGenerationOptions } from '../testing/index.js';
import { LangGraphGenerator } from './langgraph-generator.js';
import { LangServeGenerator, type LangServeConfig } from './langserve-generator.js';
import { PlanExecuteGenerator, type PlanExecuteConfig } from './plan-execute-generator.js';

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

  /**
   * Callbacks and observability configuration
   */
  callbacks?: CallbackConfig;

  /**
   * Error handling configuration
   */
  errorHandling?: ErrorHandlingConfig;

  /**
   * Test generation options
   */
  testOptions?: TestGenerationOptions;

  /**
   * Include LangServe deployment support
   */
  includeLangServe?: boolean;

  /**
   * LangServe configuration
   */
  langserve?: LangServeConfig;

  /**
   * Agent architecture type
   */
  agentArchitecture?: 'react' | 'plan-execute';

  /**
   * Plan-and-Execute configuration (if architecture is plan-execute)
   */
  planExecute?: PlanExecuteConfig;
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
  private callbacksGenerator: CallbacksGenerator;
  private errorHandlingGenerator: ErrorHandlingGenerator;
  private langGraphGenerator: LangGraphGenerator;
  private langserveGenerator: LangServeGenerator;
  private planExecuteGenerator: PlanExecuteGenerator;
  private testGenerator: TestGenerator;

  constructor() {
    this.toolsGenerator = new ToolsGenerator();
    this.memoryGenerator = new MemoryGenerator();
    this.apiGenerator = new ApiGenerator();
    this.openApiGenerator = new OpenApiGenerator();
    this.streamingGenerator = new StreamingGenerator();
    this.callbacksGenerator = new CallbacksGenerator();
    this.errorHandlingGenerator = new ErrorHandlingGenerator();
    this.langGraphGenerator = new LangGraphGenerator();
    this.langserveGenerator = new LangServeGenerator();
    this.planExecuteGenerator = new PlanExecuteGenerator();
    this.testGenerator = new TestGenerator();
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

      // Determine agent architecture
      const architecture = options.agentArchitecture || 'react';
      const isMultiAgentWorkflow = this.langGraphGenerator.shouldUseLangGraph(manifest);

      // Generate agent code based on architecture
      if (architecture === 'plan-execute') {
        // Generate Plan-and-Execute agents
        const planExecuteConfig = options.planExecute || {};

        const plannerCode = this.planExecuteGenerator.generatePlanner(manifest, planExecuteConfig);
        files.push({
          path: 'planner_agent.py',
          content: plannerCode,
          type: 'code',
          language: 'python',
        });

        const executorCode = this.planExecuteGenerator.generateExecutor(manifest, planExecuteConfig);
        files.push({
          path: 'executor_agent.py',
          content: executorCode,
          type: 'code',
          language: 'python',
        });

        const planExecuteCode = this.planExecuteGenerator.generatePlanExecute(manifest, planExecuteConfig);
        files.push({
          path: 'plan_execute.py',
          content: planExecuteCode,
          type: 'code',
          language: 'python',
        });

        // Also generate main agent.py that imports plan_execute
        const mainAgentCode = this.generatePlanExecuteMainAgent(manifest);
        files.push({
          path: 'agent.py',
          content: mainAgentCode,
          type: 'code',
          language: 'python',
        });
      } else {
        // Generate ReAct agent (default)
        const agentCode = this.generateAgentCode(manifest, options);
        files.push({
          path: 'agent.py',
          content: agentCode,
          type: 'code',
          language: 'python',
        });
      }

      // Generate LangGraph workflow if multi-agent
      if (isMultiAgentWorkflow) {
        const langGraphCode = this.langGraphGenerator.generate(manifest);
        files.push({
          path: 'langgraph.py',
          content: langGraphCode,
          type: 'code',
          language: 'python',
        });
      }

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

      // Generate callbacks and observability
      const callbacksCode = this.callbacksGenerator.generate(manifest, options.callbacks || {});
      files.push({
        path: 'callbacks.py',
        content: callbacksCode,
        type: 'code',
        language: 'python',
      });

      // Generate error handling
      const errorHandlingCode = this.errorHandlingGenerator.generate(manifest, options.errorHandling || {});
      files.push({
        path: 'error_handling.py',
        content: errorHandlingCode,
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

      // Generate LangServe deployment (if requested)
      if (options.includeLangServe) {
        const langserveConfig = options.langserve || {};

        // Generate LangServe app
        const langserveApp = this.langserveGenerator.generateApp(manifest, langserveConfig);
        files.push({
          path: 'langserve_app.py',
          content: langserveApp,
          type: 'code',
          language: 'python',
        });

        // Generate deployment configs
        if (langserveConfig.includeDeployment !== false) {
          const platforms = langserveConfig.deploymentPlatforms || ['docker', 'kubernetes', 'railway', 'render', 'fly'];

          // Docker configs
          if (platforms.includes('docker')) {
            const langserveDockerfile = this.langserveGenerator.generateDockerfile(pythonVersion);
            files.push({
              path: 'Dockerfile.langserve',
              content: langserveDockerfile,
              type: 'config',
            });

            const langserveCompose = this.langserveGenerator.generateDockerCompose(manifest, langserveConfig);
            files.push({
              path: 'docker-compose.langserve.yaml',
              content: langserveCompose,
              type: 'config',
              language: 'yaml',
            });
          }

          // Kubernetes manifests
          if (platforms.includes('kubernetes')) {
            const k8sManifests = this.langserveGenerator.generateKubernetesManifests(manifest, langserveConfig);
            files.push({
              path: 'k8s/deployment.yaml',
              content: k8sManifests.deployment,
              type: 'config',
              language: 'yaml',
            });
            files.push({
              path: 'k8s/service.yaml',
              content: k8sManifests.service,
              type: 'config',
              language: 'yaml',
            });
            files.push({
              path: 'k8s/ingress.yaml',
              content: k8sManifests.ingress,
              type: 'config',
              language: 'yaml',
            });
          }

          // Railway config
          if (platforms.includes('railway')) {
            const railwayConfig = this.langserveGenerator.generateRailwayConfig(manifest, langserveConfig);
            files.push({
              path: 'railway.json',
              content: railwayConfig,
              type: 'config',
              language: 'json',
            });
          }

          // Render config
          if (platforms.includes('render')) {
            const renderConfig = this.langserveGenerator.generateRenderConfig(manifest, langserveConfig);
            files.push({
              path: 'render.yaml',
              content: renderConfig,
              type: 'config',
              language: 'yaml',
            });
          }

          // Fly.io config
          if (platforms.includes('fly')) {
            const flyConfig = this.langserveGenerator.generateFlyConfig(manifest, langserveConfig);
            files.push({
              path: 'fly.toml',
              content: flyConfig,
              type: 'config',
            });
          }

          // Deployment README
          const deploymentReadme = this.langserveGenerator.generateDeploymentReadme(manifest, langserveConfig);
          files.push({
            path: 'DEPLOYMENT.md',
            content: deploymentReadme,
            type: 'documentation',
            language: 'markdown',
          });
        }
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

      // Generate tests (if requested) - Use comprehensive test generator
      if (options.includeTests) {
        const testSuite = this.testGenerator.generateLangChainTests(
          manifest,
          options.testOptions || {
            includeUnit: true,
            includeIntegration: true,
            includeLoad: true,
            includeSecurity: true,
            includeCost: true,
          }
        );

        // Add all test files
        files.push(...testSuite.files);
        files.push(...testSuite.configs);
        files.push(...testSuite.fixtures);
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
from callbacks import get_callbacks, get_cost_tracker, print_cost_summary
from error_handling import safe_agent_invoke, get_error_stats
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

    # Get callbacks (observability + cost tracking)
    callbacks = get_callbacks()

    # Create executor
    agent_executor = AgentExecutor(
        agent=agent,
        tools=tools,
        memory=memory,
        callbacks=callbacks.handlers,
        verbose=True,
        handle_parsing_errors=True,
        max_iterations=10,
    )

    return agent_executor


# Create global agent instance
agent = create_agent()


def run(input_text: str, chat_history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
    """
    Run the agent with input text (production-grade error handling)

    Args:
        input_text: User input message
        chat_history: Optional chat history for context

    Returns:
        Agent response with output, cost tracking, and error handling
    """
    # Use safe invoke with retry, circuit breaker, and fallback
    result = safe_agent_invoke(
        agent,
        input_text,
        chat_history=chat_history or [],
    )

    # Add cost tracking to response
    cost_tracker = get_cost_tracker()
    result["cost"] = cost_tracker.get_summary()

    return result


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
    const isMultiAgentWorkflow = this.langGraphGenerator.shouldUseLangGraph(manifest);

    const requirements = [
      '# LangChain Core',
      'langchain>=0.1.0',
      'langchain-openai>=0.0.5',
      'langchain-core>=0.1.0',
      '',
    ];

    // Add LangGraph for multi-agent workflows
    if (isMultiAgentWorkflow) {
      requirements.push(
        '# LangGraph (Multi-Agent Workflows)',
        'langgraph>=0.0.30',
        ''
      );
    }

    requirements.push('# LLM Providers');

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

    // Streaming dependencies (always included with API for SSE + WebSocket support)
    if (options.includeApi !== false) {
      requirements.push(
        '# Streaming Support (SSE + WebSocket)',
        'sse-starlette>=1.8.0  # Server-Sent Events',
        'websockets>=12.0  # WebSocket streaming',
        ''
      );
    }

    // Callbacks and observability dependencies
    const callbacksConfig = options.callbacks;
    if (callbacksConfig) {
      requirements.push('# Observability & Callbacks');

      if (callbacksConfig.langsmith !== false) {
        requirements.push('langsmith>=0.1.0  # LangSmith tracing');
      }

      if (callbacksConfig.langfuse) {
        requirements.push('langfuse>=2.0.0  # LangFuse observability');
      }

      if (callbacksConfig.opentelemetry) {
        requirements.push(
          'opentelemetry-api>=1.20.0  # OpenTelemetry',
          'opentelemetry-sdk>=1.20.0',
          'opentelemetry-exporter-otlp>=1.20.0'
        );
      }

      requirements.push('');
    }

    // Error handling dependencies
    const errorHandlingConfig = options.errorHandling;
    if (errorHandlingConfig?.fallback?.useCachedResponses) {
      requirements.push(
        '# Error Handling',
        'cachetools>=5.0.0  # Response caching',
        ''
      );
    }

    // LangServe deployment dependencies
    if (options.includeLangServe) {
      requirements.push(
        '# LangServe Deployment',
        'langserve[all]>=0.0.30  # LangServe REST API deployment',
        'sse-starlette>=1.8.0  # Server-Sent Events for streaming',
        ''
      );
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
      '# Callbacks & Observability',
      'CALLBACK_LOG_LEVEL=info  # debug, info, warn, error',
      '',
      '# LangSmith (Observability)',
      'LANGSMITH_ENABLED=true',
      'LANGCHAIN_API_KEY=your-langsmith-api-key',
      'LANGCHAIN_PROJECT=default',
      'LANGCHAIN_ENDPOINT=https://api.smith.langchain.com',
      '',
      '# LangFuse (Optional)',
      'LANGFUSE_ENABLED=false',
      'LANGFUSE_PUBLIC_KEY=your-public-key',
      'LANGFUSE_SECRET_KEY=your-secret-key',
      'LANGFUSE_HOST=https://cloud.langfuse.com',
      '',
      '# OpenTelemetry (Optional)',
      'OTEL_ENABLED=false',
      'OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317',
      'OTEL_SERVICE_NAME=langchain-agent',
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
    const isMultiAgentWorkflow = this.langGraphGenerator.shouldUseLangGraph(manifest);

    let workflowInfo = '';
    if (isMultiAgentWorkflow) {
      const structure = this.langGraphGenerator.analyzeWorkflow(manifest);
      workflowInfo = `
- **Workflow Type**: Multi-Agent (LangGraph)
- **Pattern**: ${structure.pattern}
- **Agents**: ${structure.agents.length}
- **Conditional Logic**: ${structure.hasConditionalLogic ? 'Yes' : 'No'}
- **Human Approval**: ${structure.hasHumanApproval ? 'Yes' : 'No'}`;
    }

    return `# ${agentName}

${description}

## Overview

This is a production-ready LangChain agent exported from an OSSA manifest.${isMultiAgentWorkflow ? ' This agent uses **LangGraph** for multi-agent workflow orchestration.' : ''}

**Configuration:**
- LLM: ${provider} (${model})
- Tools: ${toolsCount} available
- Memory: ${options.memoryBackend || 'buffer'}
- API: ${options.includeApi !== false ? 'FastAPI REST server' : 'No API'}${workflowInfo}

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
${isMultiAgentWorkflow ? `
**LangGraph Workflow:**
\`\`\`bash
python langgraph.py
\`\`\`
` : ''}
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

  /**
   * Generate main agent.py wrapper for Plan-and-Execute architecture
   */
  private generatePlanExecuteMainAgent(manifest: OssaAgent): string {
    const agentName = manifest.metadata?.name || 'agent';
    const description = manifest.metadata?.description || 'AI Agent';
    const version = manifest.metadata?.version || '1.0.0';

    return `"""
${agentName} - Plan-and-Execute Agent
Generated from OSSA manifest

Description: ${description}
Version: ${version}
Architecture: Plan-and-Execute (Planner + Executor)
"""

from typing import Any, Dict, Optional
from plan_execute import run as plan_execute_run
from memory import get_memory
from callbacks import get_callbacks, get_cost_tracker, print_cost_summary
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_agent():
    """
    Create Plan-and-Execute agent

    Note: The actual agent is created in plan_execute.py
    This is a wrapper for compatibility with standard agent interface
    """
    logger.info("Plan-and-Execute agent initialized")
    return {
        "type": "plan-execute",
        "components": ["planner", "executor"],
        "memory": get_memory(),
        "callbacks": get_callbacks(),
    }


def run(goal: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Run the Plan-and-Execute agent

    Args:
        goal: The objective to achieve
        context: Optional context information

    Returns:
        Execution results with plan and step outputs
    """
    logger.info(f"Running Plan-and-Execute agent for goal: {goal}")

    # Delegate to plan_execute module
    result = plan_execute_run(goal, context)

    # Log cost summary
    if "cost" in result:
        logger.info(f"Total cost: {result['cost']}")

    return result


if __name__ == "__main__":
    # Example usage
    print(f"Starting {agentName} (Plan-and-Execute Architecture)...")
    print("=" * 60)

    response = run("Research and write a blog post about AI trends in 2024")

    print("\\n" + "=" * 60)
    print(f"Success: {response['success']}")
    print(f"\\nFinal Output:")
    print(response['output'])

    if 'plan' in response:
        print(f"\\nExecution Plan:")
        for step in response['plan']['steps']:
            print(f"  {step['id']}. {step['description']}")

    if 'cost' in response:
        print(f"\\nCost Summary: {response['cost']}")
`;
  }
}
