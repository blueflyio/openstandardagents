/**
 * OpenAPI Specification Generator
 *
 * Generates OpenAPI 3.1 spec for agent API
 *
 * SOLID: Single Responsibility - OpenAPI generation only
 * DRY: Reusable spec templates
 */

import type { OssaAgent } from '../../../types/index.js';
import * as yaml from 'yaml';

/**
 * OpenAPI 3.1 Generator
 */
export class OpenAPIGenerator {
  /**
   * Generate OpenAPI 3.1 specification
   */
  generate(manifest: OssaAgent): string {
    const metadata = manifest.metadata || { name: 'Agent', version: '1.0.0' };
    const spec = manifest.spec || {};

    const openapi = {
      openapi: '3.1.0',
      info: {
        title: metadata.name,
        version: metadata.version,
        description: metadata.description || `OSSA Agent: ${metadata.name}`,
        contact: metadata.author
          ? {
              name: metadata.author,
            }
          : undefined,
        license: metadata.license
          ? {
              name: metadata.license,
            }
          : undefined,
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server',
        },
        {
          url: 'https://api.example.com',
          description: 'Production server',
        },
      ],
      paths: {
        '/health': {
          get: {
            summary: 'Health check',
            description: 'Check if the server is running',
            operationId: 'healthCheck',
            responses: {
              '200': {
                description: 'Server is healthy',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        status: {
                          type: 'string',
                          example: 'healthy',
                        },
                        timestamp: {
                          type: 'string',
                          format: 'date-time',
                        },
                        version: {
                          type: 'string',
                          example: metadata.version,
                        },
                      },
                      required: ['status', 'timestamp', 'version'],
                    },
                  },
                },
              },
            },
          },
        },
        '/metadata': {
          get: {
            summary: 'Get agent metadata',
            description: 'Retrieve agent configuration and capabilities',
            operationId: 'getMetadata',
            responses: {
              '200': {
                description: 'Agent metadata',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/AgentMetadata',
                    },
                  },
                },
              },
              '500': {
                $ref: '#/components/responses/InternalError',
              },
            },
          },
        },
        '/openapi': {
          get: {
            summary: 'Get OpenAPI specification',
            description: 'Retrieve the OpenAPI 3.1 specification for this API',
            operationId: 'getOpenAPI',
            responses: {
              '200': {
                description: 'OpenAPI specification',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                    },
                  },
                },
              },
              '500': {
                $ref: '#/components/responses/InternalError',
              },
            },
          },
        },
        '/chat': {
          post: {
            summary: 'Send chat message',
            description: 'Send a message to the agent and receive a response',
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
                description: 'Chat response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ChatResponse',
                    },
                  },
                },
              },
              '400': {
                $ref: '#/components/responses/BadRequest',
              },
              '500': {
                $ref: '#/components/responses/InternalError',
              },
            },
          },
        },
        '/reset': {
          post: {
            summary: 'Reset conversation',
            description: 'Clear conversation history and start fresh',
            operationId: 'resetConversation',
            responses: {
              '200': {
                description: 'Conversation reset successfully',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        status: {
                          type: 'string',
                          example: 'success',
                        },
                        message: {
                          type: 'string',
                          example: 'Conversation history reset',
                        },
                      },
                      required: ['status', 'message'],
                    },
                  },
                },
              },
              '500': {
                $ref: '#/components/responses/InternalError',
              },
            },
          },
        },
        '/history': {
          get: {
            summary: 'Get conversation history',
            description: 'Retrieve the current conversation history',
            operationId: 'getHistory',
            responses: {
              '200': {
                description: 'Conversation history',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        history: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              role: {
                                type: 'string',
                                enum: ['user', 'assistant', 'system'],
                              },
                              content: {
                                type: 'string',
                              },
                            },
                            required: ['role', 'content'],
                          },
                        },
                        count: {
                          type: 'integer',
                          minimum: 0,
                        },
                      },
                      required: ['history', 'count'],
                    },
                  },
                },
              },
              '500': {
                $ref: '#/components/responses/InternalError',
              },
            },
          },
        },
      },
      components: {
        schemas: {
          ChatRequest: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'User message to send to the agent',
                example: 'Hello, how can you help me?',
              },
              context: {
                type: 'object',
                description: 'Optional context for the conversation',
                additionalProperties: true,
              },
              tools: {
                type: 'array',
                items: {
                  type: 'string',
                },
                description: 'Optional list of tools to use',
              },
            },
            required: ['message'],
          },
          ChatResponse: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Agent response message',
              },
              metadata: {
                type: 'object',
                properties: {
                  model: {
                    type: 'string',
                    description: 'LLM model used',
                  },
                  provider: {
                    type: 'string',
                    description: 'LLM provider',
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time',
                  },
                  tokensUsed: {
                    type: 'integer',
                    minimum: 0,
                  },
                  toolCalls: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        tool: {
                          type: 'string',
                        },
                        result: {
                          type: 'object',
                          additionalProperties: true,
                        },
                      },
                    },
                  },
                },
              },
            },
            required: ['message'],
          },
          AgentMetadata: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                example: metadata.name,
              },
              version: {
                type: 'string',
                example: metadata.version,
              },
              description: {
                type: 'string',
                example: metadata.description || '',
              },
              role: {
                type: 'string',
                description: 'System prompt / agent role',
              },
              llm: {
                type: 'object',
                properties: {
                  provider: {
                    type: 'string',
                  },
                  model: {
                    type: 'string',
                  },
                  temperature: {
                    type: 'number',
                  },
                  maxTokens: {
                    type: 'integer',
                  },
                },
              },
              tools: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                    },
                    description: {
                      type: 'string',
                    },
                  },
                },
              },
            },
            required: ['name', 'version', 'role', 'llm'],
          },
          Error: {
            type: 'object',
            properties: {
              error: {
                type: 'string',
                description: 'Error type',
              },
              message: {
                type: 'string',
                description: 'Error message',
              },
            },
            required: ['error', 'message'],
          },
        },
        responses: {
          BadRequest: {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
                example: {
                  error: 'Invalid request',
                  message: 'message field is required and must be a string',
                },
              },
            },
          },
          InternalError: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
                example: {
                  error: 'Internal server error',
                  message: 'An unexpected error occurred',
                },
              },
            },
          },
        },
      },
      tags: [
        {
          name: 'chat',
          description: 'Chat operations',
        },
        {
          name: 'metadata',
          description: 'Agent metadata and configuration',
        },
        {
          name: 'health',
          description: 'Health and status checks',
        },
      ],
    };

    return yaml.stringify(openapi);
  }
}
