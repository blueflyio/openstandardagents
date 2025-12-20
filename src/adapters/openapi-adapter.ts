/**
 * OpenAPI Adapter
 * Exports OSSA agent manifests to OpenAPI 3.1 specification format
 * Treats agent capabilities as REST API endpoints
 */

import type { OssaAgent } from '../types/index.js';

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
    contact?: {
      name?: string;
      url?: string;
      email?: string;
    };
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  paths: Record<string, Record<string, OpenAPIOperation>>;
  components?: {
    schemas?: Record<string, OpenAPISchema>;
    securitySchemes?: Record<string, OpenAPISecurityScheme>;
  };
  tags?: Array<{
    name: string;
    description?: string;
  }>;
}

export interface OpenAPIOperation {
  operationId: string;
  summary?: string;
  description?: string;
  tags?: string[];
  requestBody?: {
    description?: string;
    required?: boolean;
    content: Record<string, { schema: OpenAPISchema }>;
  };
  responses: Record<string, OpenAPIResponse>;
  security?: Array<Record<string, string[]>>;
}

export interface OpenAPIResponse {
  description: string;
  content?: Record<string, { schema: OpenAPISchema }>;
}

export interface OpenAPISchema {
  type?: string;
  properties?: Record<string, OpenAPISchema>;
  required?: string[];
  items?: OpenAPISchema;
  description?: string;
  example?: unknown;
  [key: string]: unknown;
}

export interface OpenAPISecurityScheme {
  type: string;
  scheme?: string;
  bearerFormat?: string;
  in?: string;
  name?: string;
}

export class OpenAPIAdapter {
  /**
   * Convert OSSA agent manifest to OpenAPI specification
   */
  static toOpenAPI(manifest: OssaAgent): OpenAPISpec {
    const spec = manifest.spec || { role: '' };
    const metadata = manifest.metadata || {
      name: 'unknown-agent',
      version: '1.0.0',
      description: '',
    };
    const tools = spec.tools || [];

    const paths: Record<string, Record<string, OpenAPIOperation>> = {};
    const schemas: Record<string, OpenAPISchema> = {};

    // Convert each tool to an OpenAPI operation
    tools.forEach((tool: any, index: number) => {
      const toolName = tool.name || `tool_${index + 1}`;
      const path = `/tools/${toolName}`;

      // Parse input schema
      const inputSchema = this.normalizeSchema(tool.input_schema || tool.parameters || {});
      const outputSchema = this.normalizeSchema(tool.output_schema || {});

      // Create operation
      const operation: OpenAPIOperation = {
        operationId: toolName,
        summary: tool.description || `Execute ${toolName}`,
        description: tool.description || `Executes the ${toolName} capability`,
        tags: ['tools'],
        requestBody: {
          description: `Input parameters for ${toolName}`,
          required: true,
          content: {
            'application/json': {
              schema: inputSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Successful operation',
            content: {
              'application/json': {
                schema: outputSchema.type
                  ? outputSchema
                  : {
                      type: 'object',
                      properties: {
                        result: {
                          type: 'string',
                          description: 'Operation result',
                        },
                      },
                    },
              },
            },
          },
          '400': {
            description: 'Invalid input',
          },
          '500': {
            description: 'Internal server error',
          },
        },
      };

      // Add security if tool has auth
      if (tool.auth) {
        operation.security = [{ [tool.auth.type]: [] }];
      }

      paths[path] = {
        post: operation,
      };

      // Add schemas to components
      schemas[`${toolName}Input`] = inputSchema;
      if (outputSchema.type) {
        schemas[`${toolName}Output`] = outputSchema;
      }
    });

    // Add a chat endpoint for the agent
    paths['/chat'] = {
      post: {
        operationId: 'chat',
        summary: 'Chat with the agent',
        description: spec.role || 'Send a message to the AI agent',
        tags: ['chat'],
        requestBody: {
          description: 'Chat message',
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    description: 'User message',
                  },
                  conversation_id: {
                    type: 'string',
                    description: 'Optional conversation ID for context',
                  },
                },
                required: ['message'],
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
                  type: 'object',
                  properties: {
                    response: {
                      type: 'string',
                      description: 'Agent response message',
                    },
                    conversation_id: {
                      type: 'string',
                      description: 'Conversation ID',
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    // Build security schemes
    const securitySchemes: Record<string, OpenAPISecurityScheme> = {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
      },
    };

    return {
      openapi: '3.1.0',
      info: {
        title: metadata.name,
        description: metadata.description || `API for ${metadata.name} agent`,
        version: metadata.version || '1.0.0',
        contact: {
          name: 'OSSA Agent',
        },
      },
      servers: [
        {
          url: 'https://api.example.com/v1',
          description: 'Production server',
        },
        {
          url: 'http://localhost:8000/v1',
          description: 'Development server',
        },
      ],
      paths,
      components: {
        schemas,
        securitySchemes,
      },
      tags: [
        {
          name: 'chat',
          description: 'Chat operations',
        },
        {
          name: 'tools',
          description: 'Agent tool operations',
        },
      ],
    };
  }

  /**
   * Normalize schema to OpenAPI format
   */
  private static normalizeSchema(schema: any): OpenAPISchema {
    if (typeof schema === 'string') {
      try {
        schema = JSON.parse(schema);
      } catch {
        return { type: 'object' };
      }
    }

    if (!schema || typeof schema !== 'object') {
      return { type: 'object' };
    }

    // If it's already a valid OpenAPI schema, return it
    if (schema.type || schema.properties || schema.$ref) {
      return schema;
    }

    // Try to infer schema from object structure
    const properties: Record<string, OpenAPISchema> = {};
    const required: string[] = [];

    Object.keys(schema).forEach((key) => {
      const value = schema[key];
      if (value && typeof value === 'object') {
        if (value.type) {
          properties[key] = value;
        } else {
          properties[key] = this.inferType(value);
        }
        if (value.required === true) {
          required.push(key);
        }
      } else {
        properties[key] = this.inferType(value);
      }
    });

    const result: OpenAPISchema = {
      type: 'object',
      properties,
    };

    if (required.length > 0) {
      result.required = required;
    }

    return result;
  }

  /**
   * Infer OpenAPI type from value
   */
  private static inferType(value: any): OpenAPISchema {
    if (value === null || value === undefined) {
      return { type: 'string' };
    }

    const type = typeof value;

    switch (type) {
      case 'string':
        return { type: 'string' };
      case 'number':
        return Number.isInteger(value) ? { type: 'integer' } : { type: 'number' };
      case 'boolean':
        return { type: 'boolean' };
      case 'object':
        if (Array.isArray(value)) {
          return {
            type: 'array',
            items: value.length > 0 ? this.inferType(value[0]) : { type: 'string' },
          };
        }
        // Prevent infinite recursion with circular references
        if (typeof value === 'object' && value !== null) {
          return { type: 'object' };
        }
        return this.normalizeSchema(value);
      default:
        return { type: 'string' };
    }
  }

  /**
   * Convert to YAML format (OpenAPI is often used in YAML)
   */
  static toYAML(manifest: OssaAgent): string {
    const openapi = this.toOpenAPI(manifest);
    // Simple YAML serialization (for production use a proper YAML library)
    return this.objectToYAML(openapi);
  }

  /**
   * Simple object to YAML converter (basic implementation)
   */
  private static objectToYAML(obj: any, indent = 0): string {
    const spaces = '  '.repeat(indent);
    let yaml = '';

    if (Array.isArray(obj)) {
      obj.forEach((item) => {
        yaml += `${spaces}- `;
        if (typeof item === 'object') {
          yaml += '\n' + this.objectToYAML(item, indent + 1);
        } else {
          yaml += `${JSON.stringify(item)}\n`;
        }
      });
    } else if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach((key) => {
        const value = obj[key];
        yaml += `${spaces}${key}:`;

        if (value === null || value === undefined) {
          yaml += ' null\n';
        } else if (typeof value === 'object') {
          yaml += '\n' + this.objectToYAML(value, indent + 1);
        } else if (typeof value === 'string') {
          yaml += ` "${value}"\n`;
        } else {
          yaml += ` ${value}\n`;
        }
      });
    }

    return yaml;
  }
}

export default OpenAPIAdapter;
