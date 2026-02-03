/**
 * Anthropic Exporter
 *
 * Exports OSSA agent manifests to Anthropic Python SDK format.
 * Generates complete Python application with FastAPI server.
 *
 * SOLID: Single Responsibility - Anthropic export orchestration
 * DRY: Reuses tools-generator and api-generator modules
 */

import type {
  PlatformAdapter,
  ExportResult,
  ExportOptions,
  ValidationResult,
  ValidationError,
  OssaAgent,
} from '../../../adapters/base/adapter.interface.js';
import { BaseAdapter } from '../../../adapters/base/adapter.interface.js';
import {
  generateTools,
  generatePythonTools,
  generateToolHandlers,
  type AnthropicTool,
} from './tools-generator.js';
import {
  generateFastAPIServer,
  generateOpenAPISpec,
  generateOpenAPIYAML,
} from './api-generator.js';

/**
 * Anthropic Exporter
 * Implements PlatformAdapter for Anthropic Claude export
 */
export class AnthropicExporter extends BaseAdapter implements PlatformAdapter {
  readonly platform = 'anthropic';
  readonly displayName = 'Anthropic Claude';
  readonly description =
    'Export OSSA agents to Anthropic Python SDK with FastAPI server';
  readonly supportedVersions = ['0.3.0', '0.3.3', '0.3.4', '0.3.5', '0.3.6'];

  /**
   * Export OSSA manifest to Anthropic format
   */
  async export(
    manifest: OssaAgent,
    options?: ExportOptions
  ): Promise<ExportResult> {
    const startTime = Date.now();

    try {
      // Validate if requested
      if (options?.validate !== false) {
        const validation = await this.validate(manifest);
        if (!validation.valid) {
          return this.createResult(
            false,
            [],
            `Validation failed: ${validation.errors?.map((e) => e.message).join(', ')}`,
            {
              duration: Date.now() - startTime,
              warnings: validation.warnings?.map((w) => w.message),
            }
          );
        }
      }

      // Generate tools
      const tools = generateTools(manifest);

      // Generate files
      const files = [
        // Main agent file
        this.createFile(
          'agent.py',
          this.generateAgentCode(manifest, tools),
          'code',
          'python'
        ),

        // FastAPI server
        this.createFile(
          'server.py',
          generateFastAPIServer(manifest, tools),
          'code',
          'python'
        ),

        // OpenAPI spec (YAML)
        this.createFile(
          'openapi.yaml',
          generateOpenAPIYAML(generateOpenAPISpec(manifest, tools)),
          'config',
          'yaml'
        ),

        // OpenAPI spec (JSON)
        this.createFile(
          'openapi.json',
          JSON.stringify(generateOpenAPISpec(manifest, tools), null, 2),
          'config',
          'json'
        ),

        // requirements.txt
        this.createFile(
          'requirements.txt',
          this.generateRequirements(manifest),
          'config',
          'text'
        ),

        // Dockerfile
        this.createFile(
          'Dockerfile',
          this.generateDockerfile(manifest),
          'config',
          'dockerfile'
        ),

        // .env.example
        this.createFile(
          '.env.example',
          this.generateEnvExample(manifest),
          'config',
          'text'
        ),

        // README.md
        this.createFile(
          'README.md',
          this.generateReadme(manifest, tools),
          'documentation',
          'markdown'
        ),
      ];

      // Add tests if requested
      if (options?.includeTests) {
        files.push(
          this.createFile(
            'test_agent.py',
            this.generateTests(manifest, tools),
            'test',
            'python'
          )
        );
      }

      return this.createResult(true, files, undefined, {
        duration: Date.now() - startTime,
        version: '@anthropic-ai/sdk ^0.71.0',
        toolsCount: tools.length,
      });
    } catch (error) {
      return this.createResult(
        false,
        [],
        error instanceof Error ? error.message : String(error),
        {
          duration: Date.now() - startTime,
        }
      );
    }
  }

  /**
   * Validate manifest for Anthropic export
   */
  async validate(manifest: OssaAgent): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Call base validation
    const baseValidation = await super.validate(manifest);
    if (baseValidation.errors) {
      errors.push(...baseValidation.errors);
    }
    if (baseValidation.warnings) {
      warnings.push(...baseValidation.warnings);
    }

    // Anthropic-specific validations
    if (!manifest.spec?.llm) {
      warnings.push({
        message: 'No LLM configuration found, will use default Claude model',
        path: 'spec.llm',
      });
    }

    if (
      manifest.spec?.llm?.provider &&
      manifest.spec.llm.provider !== 'anthropic'
    ) {
      warnings.push({
        message: `LLM provider is "${manifest.spec.llm.provider}", expected "anthropic"`,
        path: 'spec.llm.provider',
      });
    }

    // Validate tools
    if (manifest.spec?.tools) {
      for (let i = 0; i < manifest.spec.tools.length; i++) {
        const tool = manifest.spec.tools[i];
        if (!tool.name) {
          errors.push({
            message: `Tool at index ${i} is missing a name`,
            path: `spec.tools[${i}].name`,
            code: 'MISSING_TOOL_NAME',
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Get example manifest for Anthropic
   */
  getExample(): OssaAgent {
    return {
      apiVersion: 'ossa/v0.3.6',
      kind: 'Agent',
      metadata: {
        name: 'claude-assistant',
        version: '1.0.0',
        description: 'Helpful AI assistant powered by Claude',
      },
      spec: {
        role: 'You are a helpful AI assistant. Provide clear, accurate, and concise responses.',
        llm: {
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-20241022',
          temperature: 1.0,
          maxTokens: 1024,
        },
        tools: [
          {
            type: 'search',
            name: 'search_docs',
            description: 'Search documentation',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query',
                },
              },
              required: ['query'],
            },
          },
        ],
      },
    };
  }

  /**
   * Generate main agent Python code
   */
  private generateAgentCode(
    manifest: OssaAgent,
    tools: AnthropicTool[]
  ): string {
    const agentName = manifest.metadata?.name || 'anthropic-agent';
    const model =
      manifest.spec?.llm?.model || 'claude-3-5-sonnet-20241022';
    const systemPrompt = manifest.spec?.role || 'You are a helpful assistant.';
    const temperature = manifest.spec?.llm?.temperature ?? 1.0;
    const maxTokens = manifest.spec?.llm?.maxTokens || 1024;

    const hasTools = tools.length > 0;

    return `"""
${agentName} - Anthropic Claude Agent
Generated from OSSA manifest
"""

import os
import json
from typing import List, Dict, Any, Optional
from anthropic import Anthropic

${hasTools ? `# Tool definitions\n${generatePythonTools(tools)}\n` : ''}
${hasTools ? `# Tool handlers\n${generateToolHandlers(tools)}\n` : ''}

class AnthropicAgent:
    """
    Anthropic Claude agent with tool support and prompt caching.
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the agent.

        Args:
            api_key: Anthropic API key (optional, defaults to ANTHROPIC_API_KEY env var)
        """
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY not found in environment")

        self.client = Anthropic(api_key=self.api_key)
        self.model = "${model}"
        self.system_prompt = """${this.escapeString(systemPrompt)}"""
        self.temperature = ${temperature}
        self.max_tokens = ${maxTokens}
        ${hasTools ? 'self.tools = tools' : 'self.tools = []'}
        self.conversation_history: List[Dict[str, Any]] = []

    def chat(
        self,
        messages: List[Dict[str, str]],
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        use_cache: bool = True
    ) -> Dict[str, Any]:
        """
        Send messages to Claude and get a response.

        Args:
            messages: List of message dicts with 'role' and 'content'
            max_tokens: Maximum tokens in response (optional)
            temperature: Sampling temperature (optional)
            use_cache: Enable prompt caching (default: True)

        Returns:
            Response dict with id, role, content, model, usage, stop_reason
        """
        # Build system message with caching
        system_messages = [
            {
                "type": "text",
                "text": self.system_prompt,
                ${hasTools ? '"cache_control": {"type": "ephemeral"} if use_cache else None' : ''}
            }
        ]

        # Add conversation history
        all_messages = self.conversation_history + messages

        # Prepare API call
        kwargs = {
            "model": self.model,
            "max_tokens": max_tokens or self.max_tokens,
            "temperature": temperature if temperature is not None else self.temperature,
            "system": system_messages,
            "messages": all_messages,
        }

        ${hasTools ? '# Add tools if available\n        if self.tools:\n            kwargs["tools"] = self.tools\n' : ''}

        # Call Claude API
        response = self.client.messages.create(**kwargs)

        # Handle tool use
        ${hasTools ? 'if response.stop_reason == "tool_use":\n            return self._handle_tool_use(response, all_messages)\n' : ''}

        # Extract response content
        content = ""
        for block in response.content:
            if block.type == "text":
                content += block.text

        # Update conversation history
        self.conversation_history.append(messages[-1])
        self.conversation_history.append({
            "role": "assistant",
            "content": content
        })

        return {
            "id": response.id,
            "role": response.role,
            "content": content,
            "model": response.model,
            "usage": {
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens
            },
            "stop_reason": response.stop_reason
        }

    ${hasTools ? `def _handle_tool_use(self, response, messages: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Handle tool use in Claude's response.

        Args:
            response: Claude API response
            messages: Message history

        Returns:
            Final response after tool execution
        """
        # Extract tool use blocks
        tool_results = []
        for block in response.content:
            if block.type == "tool_use":
                # Execute tool
                result = handle_tool_use(block.name, block.input)
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": result
                })

        # Continue conversation with tool results
        messages.append({
            "role": "assistant",
            "content": response.content
        })
        messages.append({
            "role": "user",
            "content": tool_results
        })

        # Get final response
        final_response = self.client.messages.create(
            model=self.model,
            max_tokens=self.max_tokens,
            system=self.system_prompt,
            messages=messages,
            tools=self.tools
        )

        # Extract final content
        content = ""
        for block in final_response.content:
            if block.type == "text":
                content += block.text

        return {
            "id": final_response.id,
            "role": final_response.role,
            "content": content,
            "model": final_response.model,
            "usage": {
                "input_tokens": final_response.usage.input_tokens,
                "output_tokens": final_response.usage.output_tokens
            },
            "stop_reason": final_response.stop_reason
        }
` : ''}
    def reset_history(self):
        """Clear conversation history"""
        self.conversation_history = []


# Example usage
if __name__ == "__main__":
    agent = AnthropicAgent()

    response = agent.chat(messages=[
        {"role": "user", "content": "Hello! How are you?"}
    ])

    print(f"Claude: {response['content']}")
    print(f"Tokens used: {response['usage']['input_tokens']} in, {response['usage']['output_tokens']} out")
`;
  }

  /**
   * Generate requirements.txt
   */
  private generateRequirements(manifest: OssaAgent): string {
    return `# Python dependencies for ${manifest.metadata?.name || 'agent'}
anthropic>=0.71.0
fastapi>=0.104.0
uvicorn>=0.24.0
pydantic>=2.0.0
python-dotenv>=1.0.0
`;
  }

  /**
   * Generate Dockerfile
   */
  private generateDockerfile(manifest: OssaAgent): string {
    return `# Dockerfile for ${manifest.metadata?.name || 'agent'}
FROM python:3.11-slim

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY agent.py .
COPY server.py .

# Expose port
EXPOSE 8000

# Run server
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
`;
  }

  /**
   * Generate .env.example
   */
  private generateEnvExample(manifest: OssaAgent): string {
    return `# Environment variables for ${manifest.metadata?.name || 'agent'}

# Required: Anthropic API key
ANTHROPIC_API_KEY=your_api_key_here

# Optional: Model configuration
MODEL=${manifest.spec?.llm?.model || 'claude-3-5-sonnet-20241022'}
TEMPERATURE=${manifest.spec?.llm?.temperature ?? 1.0}
MAX_TOKENS=${manifest.spec?.llm?.maxTokens || 1024}
`;
  }

  /**
   * Generate README.md
   */
  private generateReadme(
    manifest: OssaAgent,
    tools: AnthropicTool[]
  ): string {
    const agentName = manifest.metadata?.name || 'Anthropic Agent';
    const description =
      manifest.metadata?.description || 'Claude-powered AI agent';
    const version = manifest.metadata?.version || '1.0.0';

    return `# ${agentName}

${description}

Version: ${version}

## Overview

This agent is powered by Anthropic's Claude and exported from an OSSA manifest.

### Features

- **Model**: ${manifest.spec?.llm?.model || 'claude-3-5-sonnet-20241022'}
- **Temperature**: ${manifest.spec?.llm?.temperature ?? 1.0}
- **Max Tokens**: ${manifest.spec?.llm?.maxTokens || 1024}
${tools.length > 0 ? `- **Tools**: ${tools.length} tools available\n` : ''}
- **API**: FastAPI server with OpenAPI 3.1 spec
- **Caching**: Prompt caching enabled for efficiency

${tools.length > 0 ? `\n### Available Tools\n\n${tools.map((t) => `- **${t.name}**: ${t.description}`).join('\n')}\n` : ''}

## Setup

1. Install dependencies:
\`\`\`bash
pip install -r requirements.txt
\`\`\`

2. Configure environment:
\`\`\`bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
\`\`\`

3. Run the server:
\`\`\`bash
python server.py
\`\`\`

## Usage

### Direct Python Usage

\`\`\`python
from agent import AnthropicAgent

agent = AnthropicAgent()
response = agent.chat(messages=[
    {"role": "user", "content": "Hello!"}
])
print(response["content"])
\`\`\`

### API Usage

Start the server:
\`\`\`bash
uvicorn server:app --reload
\`\`\`

Chat endpoint:
\`\`\`bash
curl -X POST http://localhost:8000/chat \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [{"role": "user", "content": "Hello!"}],
    "max_tokens": 1024,
    "temperature": 1.0
  }'
\`\`\`

Health check:
\`\`\`bash
curl http://localhost:8000/health
\`\`\`

Agent info:
\`\`\`bash
curl http://localhost:8000/info
\`\`\`

### Docker Usage

Build:
\`\`\`bash
docker build -t ${agentName.toLowerCase().replace(/[^a-z0-9-]/g, '-')} .
\`\`\`

Run:
\`\`\`bash
docker run -p 8000:8000 -e ANTHROPIC_API_KEY=your_key ${agentName.toLowerCase().replace(/[^a-z0-9-]/g, '-')}
\`\`\`

## API Documentation

Interactive API docs available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- OpenAPI spec: http://localhost:8000/openapi.json

## License

${manifest.metadata?.license || 'Proprietary'}

## Generated

This agent was generated from an OSSA manifest using the Anthropic exporter.
`;
  }

  /**
   * Generate test file
   */
  private generateTests(
    manifest: OssaAgent,
    tools: AnthropicTool[]
  ): string {
    return `"""
Tests for ${manifest.metadata?.name || 'agent'}
"""

import pytest
from agent import AnthropicAgent

def test_agent_initialization():
    """Test agent can be initialized"""
    agent = AnthropicAgent(api_key="test-key")
    assert agent.model == "${manifest.spec?.llm?.model || 'claude-3-5-sonnet-20241022'}"
    assert agent.temperature == ${manifest.spec?.llm?.temperature ?? 1.0}
    assert agent.max_tokens == ${manifest.spec?.llm?.maxTokens || 1024}

def test_agent_has_tools():
    """Test agent has expected tools"""
    agent = AnthropicAgent(api_key="test-key")
    assert len(agent.tools) == ${tools.length}
${tools.map((t) => `    assert any(tool["name"] == "${t.name}" for tool in agent.tools)`).join('\n')}

def test_conversation_history():
    """Test conversation history management"""
    agent = AnthropicAgent(api_key="test-key")
    assert len(agent.conversation_history) == 0

    agent.reset_history()
    assert len(agent.conversation_history) == 0
`;
  }

  /**
   * Escape string for Python code generation
   */
  private escapeString(str: string): string {
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
  }
}

/**
 * Create an Anthropic exporter instance
 */
export function createAnthropicExporter(): AnthropicExporter {
  return new AnthropicExporter();
}

/**
 * Default export
 */
export default AnthropicExporter;
