/**
 * OpenAPI 3.1 Specification Generator
 *
 * Generates OpenAPI spec from OSSA manifest for LangChain FastAPI server
 *
 * SOLID: Single Responsibility - OpenAPI spec generation
 * API-First: OpenAPI spec drives API contract
 */

import type { OssaAgent } from '../../../types/index.js';
import * as yaml from 'yaml';

export class OpenApiGenerator {
  /**
   * Generate OpenAPI 3.1 specification
   */
  generate(manifest: OssaAgent): string {
    const spec = this.buildOpenApiSpec(manifest);
    return yaml.stringify(spec);
  }

  /**
   * Build OpenAPI specification object
   */
  private buildOpenApiSpec(manifest: OssaAgent): any {
    const agentName = manifest.metadata?.name || 'agent';
    const description = manifest.metadata?.description || 'AI Agent API';
    const version = manifest.metadata?.version || '1.0.0';
    const tools = manifest.spec?.tools || [];

    return {
      openapi: '3.1.0',
      info: {
        title: `${agentName} API`,
        description: `${description}\n\nGenerated from OSSA manifest`,
        version,
        contact: {
          name: manifest.metadata?.author || 'Agent Team',
        },
        license: {
          name: manifest.metadata?.license || 'MIT',
        },
      },
      servers: [
        {
          url: 'http://localhost:8000',
          description: 'Local development server',
        },
        {
          url: 'https://api.example.com',
          description: 'Production server',
        },
      ],
      paths: {
        '/': {
          get: {
            summary: 'API Root',
            description: 'Get API information and links',
            operationId: 'getRoot',
            responses: {
              '200': {
                description: 'API information',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        message: { type: 'string' },
                        version: { type: 'string' },
                        docs: { type: 'string' },
                        openapi: { type: 'string' },
                        health: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '/health': {
          get: {
            summary: 'Health Check',
            description: 'Check API health status',
            operationId: 'getHealth',
            responses: {
              '200': {
                description: 'Health status',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/HealthResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/chat': {
          post: {
            summary: 'Send Chat Message',
            description: 'Send a message to the agent and get a response',
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
                description: 'Agent response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ChatResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Agent execution error',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/chat/stream': {
          post: {
            summary: 'Stream Chat Response',
            description: 'Send a message and receive streaming response',
            operationId: 'chatStream',
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
                description: 'Streaming response',
                content: {
                  'text/event-stream': {
                    schema: {
                      type: 'string',
                      description: 'Server-sent events stream',
                    },
                  },
                },
              },
            },
          },
        },
        '/sessions': {
          get: {
            summary: 'List Sessions',
            description: 'Get all active conversation sessions',
            operationId: 'listSessions',
            responses: {
              '200': {
                description: 'List of sessions',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/SessionInfo',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '/sessions/{session_id}': {
          delete: {
            summary: 'Clear Session',
            description: 'Clear conversation history for a session',
            operationId: 'clearSession',
            parameters: [
              {
                name: 'session_id',
                in: 'path',
                required: true,
                description: 'Session identifier',
                schema: {
                  type: 'string',
                },
              },
            ],
            responses: {
              '200': {
                description: 'Session cleared',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        status: { type: 'string' },
                        message: { type: 'string' },
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
          ChatRequest: {
            type: 'object',
            required: ['message'],
            properties: {
              message: {
                type: 'string',
                description: 'User message to send to the agent',
                example: 'Hello! What can you help me with?',
              },
              session_id: {
                type: 'string',
                description: 'Session ID for conversation context',
                default: 'default',
                example: 'user-123',
              },
              stream: {
                type: 'boolean',
                description: 'Enable streaming responses',
                default: false,
              },
            },
          },
          ChatResponse: {
            type: 'object',
            required: ['response', 'session_id', 'success'],
            properties: {
              response: {
                type: 'string',
                description: "Agent's response message",
                example: 'I can help you with various tasks...',
              },
              session_id: {
                type: 'string',
                description: 'Session ID',
                example: 'user-123',
              },
              success: {
                type: 'boolean',
                description: 'Whether the request succeeded',
              },
              error: {
                type: 'string',
                description: 'Error message if failed',
                nullable: true,
              },
              metadata: {
                type: 'object',
                description: 'Additional metadata',
                nullable: true,
                properties: {
                  tokens_used: {
                    type: 'integer',
                    description: 'Number of tokens used',
                  },
                },
              },
            },
          },
          HealthResponse: {
            type: 'object',
            required: ['status', 'agent', 'version'],
            properties: {
              status: {
                type: 'string',
                description: 'Service status',
                example: 'healthy',
              },
              agent: {
                type: 'string',
                description: 'Agent name',
                example: agentName,
              },
              version: {
                type: 'string',
                description: 'API version',
                example: version,
              },
            },
          },
          SessionInfo: {
            type: 'object',
            required: ['session_id'],
            properties: {
              session_id: {
                type: 'string',
                description: 'Session identifier',
                example: 'user-123',
              },
              message_count: {
                type: 'integer',
                description: 'Number of messages in session',
                nullable: true,
              },
            },
          },
          ErrorResponse: {
            type: 'object',
            required: ['detail'],
            properties: {
              detail: {
                type: 'string',
                description: 'Error detail message',
              },
            },
          },
        },
        securitySchemes: {
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key',
            description: 'API key for authentication (optional)',
          },
        },
      },
      tags: [
        {
          name: 'Chat',
          description: 'Agent conversation endpoints',
        },
        {
          name: 'Sessions',
          description: 'Session management',
        },
        {
          name: 'Health',
          description: 'Service health and monitoring',
        },
      ],
      'x-ossa-manifest': {
        name: agentName,
        version: manifest.apiVersion?.split('/')[1] || 'v0.3.6',
        tools: tools.map((tool: any) => ({
          name: tool.name,
          type: tool.type,
          description: tool.description,
        })),
      },
    };
  }
}
