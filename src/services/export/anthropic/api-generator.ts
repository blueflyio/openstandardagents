/**
 * Anthropic API Generator
 *
 * Generates FastAPI server code and OpenAPI specifications
 * for Anthropic Claude agents.
 *
 * SOLID: Single Responsibility - API generation only
 * DRY: Reusable API generation logic
 */

import type { OssaAgent } from '../../../types/index.js';
import type { AnthropicTool } from './tools-generator.js';

/**
 * OpenAPI 3.1 specification
 */
export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  paths: Record<string, unknown>;
  components?: {
    schemas?: Record<string, unknown>;
  };
}

/**
 * Generate FastAPI server code
 */
export function generateFastAPIServer(
  manifest: OssaAgent,
  tools: AnthropicTool[]
): string {
  const agentName = manifest.metadata?.name || 'anthropic-agent';
  const description =
    manifest.metadata?.description || 'Anthropic Claude agent';

  return `"""
${agentName} - FastAPI Server
${description}

Generated from OSSA manifest
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn

from agent import AnthropicAgent

# Initialize FastAPI app
app = FastAPI(
    title="${agentName}",
    description="${escapeString(description)}",
    version="${manifest.metadata?.version || '1.0.0'}"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize agent
agent = AnthropicAgent()

# Request/Response models
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    max_tokens: Optional[int] = 1024
    temperature: Optional[float] = ${manifest.spec?.llm?.temperature || 1.0}
    stream: Optional[bool] = False

class ChatResponse(BaseModel):
    id: str
    role: str
    content: str
    model: str
    usage: Dict[str, int]
    stop_reason: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    agent: str
    model: str

# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "agent": "${agentName}",
        "model": agent.model
    }

# Chat endpoint
@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat with the agent.

    Accepts a list of messages and returns the agent's response.
    """
    try:
        # Convert messages to format expected by agent
        messages = [
            {"role": msg.role, "content": msg.content}
            for msg in request.messages
        ]

        # Get response from agent
        response = agent.chat(
            messages=messages,
            max_tokens=request.max_tokens,
            temperature=request.temperature
        )

        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Agent info endpoint
@app.get("/info")
async def get_info():
    """Get agent information and capabilities"""
    return {
        "name": "${agentName}",
        "version": "${manifest.metadata?.version || '1.0.0'}",
        "description": "${escapeString(description)}",
        "model": agent.model,
        "tools": [tool["name"] for tool in agent.tools],
        "capabilities": {
            "streaming": True,
            "tools": len(agent.tools) > 0,
            "vision": False
        }
    }

# Run server
if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
`;
}

/**
 * Generate OpenAPI 3.1 specification
 */
export function generateOpenAPISpec(
  manifest: OssaAgent,
  tools: AnthropicTool[]
): OpenAPISpec {
  const agentName = manifest.metadata?.name || 'anthropic-agent';
  const description =
    manifest.metadata?.description || 'Anthropic Claude agent API';
  const version = manifest.metadata?.version || '1.0.0';

  const spec: OpenAPISpec = {
    openapi: '3.1.0',
    info: {
      title: agentName,
      version,
      description,
    },
    paths: {
      '/health': {
        get: {
          summary: 'Health check',
          description: 'Check if the agent is running and healthy',
          operationId: 'health_check',
          responses: {
            '200': {
              description: 'Agent is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string' },
                      agent: { type: 'string' },
                      model: { type: 'string' },
                    },
                    required: ['status', 'agent', 'model'],
                  },
                },
              },
            },
          },
        },
      },
      '/chat': {
        post: {
          summary: 'Chat with agent',
          description: 'Send messages and receive agent responses',
          operationId: 'chat',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ChatRequest',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ChatResponse',
                  },
                },
              },
            },
            '500': {
              description: 'Internal server error',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      detail: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/info': {
        get: {
          summary: 'Get agent info',
          description: 'Get information about the agent and its capabilities',
          operationId: 'get_info',
          responses: {
            '200': {
              description: 'Agent information',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      version: { type: 'string' },
                      description: { type: 'string' },
                      model: { type: 'string' },
                      tools: {
                        type: 'array',
                        items: { type: 'string' },
                      },
                      capabilities: {
                        type: 'object',
                        properties: {
                          streaming: { type: 'boolean' },
                          tools: { type: 'boolean' },
                          vision: { type: 'boolean' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        Message: {
          type: 'object',
          properties: {
            role: {
              type: 'string',
              enum: ['user', 'assistant'],
            },
            content: { type: 'string' },
          },
          required: ['role', 'content'],
        },
        ChatRequest: {
          type: 'object',
          properties: {
            messages: {
              type: 'array',
              items: { $ref: '#/components/schemas/Message' },
            },
            max_tokens: {
              type: 'integer',
              default: 1024,
              minimum: 1,
              maximum: 8192,
            },
            temperature: {
              type: 'number',
              default: 1.0,
              minimum: 0,
              maximum: 2,
            },
            stream: {
              type: 'boolean',
              default: false,
            },
          },
          required: ['messages'],
        },
        ChatResponse: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            role: {
              type: 'string',
              enum: ['assistant'],
            },
            content: { type: 'string' },
            model: { type: 'string' },
            usage: {
              type: 'object',
              properties: {
                input_tokens: { type: 'integer' },
                output_tokens: { type: 'integer' },
              },
            },
            stop_reason: {
              type: 'string',
              nullable: true,
            },
          },
          required: ['id', 'role', 'content', 'model', 'usage'],
        },
      },
    },
  };

  return spec;
}

/**
 * Generate OpenAPI YAML string
 */
export function generateOpenAPIYAML(spec: OpenAPISpec): string {
  return `openapi: ${spec.openapi}
info:
  title: ${spec.info.title}
  version: ${spec.info.version}
  description: ${spec.info.description || ''}

paths:
${generatePathsYAML(spec.paths)}

components:
  schemas:
${generateSchemasYAML(spec.components?.schemas || {})}
`;
}

/**
 * Generate paths section for OpenAPI YAML
 */
function generatePathsYAML(paths: Record<string, unknown>): string {
  return Object.entries(paths)
    .map(([path, methods]) => {
      const methodsYaml = Object.entries(methods as Record<string, unknown>)
        .map(([method, details]) => {
          return `    ${method}:\n${stringifyYAML(details, 6)}`;
        })
        .join('\n');
      return `  ${path}:\n${methodsYaml}`;
    })
    .join('\n');
}

/**
 * Generate schemas section for OpenAPI YAML
 */
function generateSchemasYAML(schemas: Record<string, unknown>): string {
  return Object.entries(schemas)
    .map(([name, schema]) => {
      return `    ${name}:\n${stringifyYAML(schema, 6)}`;
    })
    .join('\n');
}

/**
 * Convert object to YAML string with indentation
 */
function stringifyYAML(obj: unknown, indent: number): string {
  const spacing = ' '.repeat(indent);

  if (typeof obj !== 'object' || obj === null) {
    return `${spacing}${obj}`;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => `${spacing}- ${item}`).join('\n');
  }

  return Object.entries(obj)
    .map(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        return `${spacing}${key}:\n${stringifyYAML(value, indent + 2)}`;
      }
      return `${spacing}${key}: ${value}`;
    })
    .join('\n');
}

/**
 * Escape string for Python code generation
 */
function escapeString(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}
