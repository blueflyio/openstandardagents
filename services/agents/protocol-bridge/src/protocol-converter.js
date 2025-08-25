export class ProtocolConverter {
  constructor() {
    this.conversionCache = new Map();
  }

  async openAPIToMCP(openAPISpec) {
    // Cache check
    const cacheKey = JSON.stringify(openAPISpec);
    if (this.conversionCache.has(cacheKey)) {
      return this.conversionCache.get(cacheKey);
    }

    const mcpTools = [];
    
    // Convert OpenAPI paths to MCP tools
    if (openAPISpec.paths) {
      for (const [path, methods] of Object.entries(openAPISpec.paths)) {
        for (const [method, operation] of Object.entries(methods)) {
          if (typeof operation === 'object' && operation.operationId) {
            const tool = {
              name: operation.operationId,
              description: operation.summary || operation.description || '',
              inputSchema: this.extractParametersSchema(operation),
              outputSchema: this.extractResponseSchema(operation),
              metadata: {
                originalPath: path,
                method: method.toUpperCase(),
                tags: operation.tags || []
              }
            };
            mcpTools.push(tool);
          }
        }
      }
    }

    this.conversionCache.set(cacheKey, mcpTools);
    return mcpTools;
  }

  async MCPToOpenAPI(mcpDefinition) {
    const openAPISpec = {
      openapi: '3.1.0',
      info: {
        title: 'MCP Converted API',
        version: '1.0.0',
        description: 'API converted from MCP protocol'
      },
      paths: {},
      components: {
        schemas: {}
      }
    };

    // Convert MCP tools to OpenAPI paths
    if (mcpDefinition.tools) {
      for (const tool of mcpDefinition.tools) {
        const path = `/${tool.name.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        openAPISpec.paths[path] = {
          post: {
            operationId: tool.name,
            summary: tool.description,
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: tool.inputSchema || { type: 'object' }
                }
              }
            },
            responses: {
              '200': {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: tool.outputSchema || { type: 'object' }
                  }
                }
              }
            }
          }
        };
      }
    }

    // Convert MCP resources to OpenAPI paths
    if (mcpDefinition.resources) {
      for (const resource of mcpDefinition.resources) {
        const path = `/resources/${resource.name}`;
        openAPISpec.paths[path] = {
          get: {
            operationId: `get_${resource.name}`,
            summary: resource.description,
            responses: {
              '200': {
                description: 'Resource content',
                content: {
                  'application/json': {
                    schema: { type: 'object' }
                  }
                }
              }
            }
          }
        };
      }
    }

    return openAPISpec;
  }

  extractParametersSchema(operation) {
    const schema = {
      type: 'object',
      properties: {},
      required: []
    };

    if (operation.parameters) {
      for (const param of operation.parameters) {
        if (param.in === 'query' || param.in === 'path') {
          schema.properties[param.name] = param.schema || { type: 'string' };
          if (param.required) {
            schema.required.push(param.name);
          }
        }
      }
    }

    if (operation.requestBody?.content?.['application/json']?.schema) {
      return operation.requestBody.content['application/json'].schema;
    }

    return schema;
  }

  extractResponseSchema(operation) {
    if (operation.responses?.['200']?.content?.['application/json']?.schema) {
      return operation.responses['200'].content['application/json'].schema;
    }
    return { type: 'object' };
  }

  async validateConversion(original, converted, direction) {
    // Validation logic to ensure conversion integrity
    const validationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    if (direction === 'openapi-to-mcp') {
      // Validate that all operations were converted
      const originalOps = this.countOperations(original);
      const convertedTools = converted.length;
      
      if (originalOps !== convertedTools) {
        validationResult.warnings.push(
          `Operation count mismatch: ${originalOps} original vs ${convertedTools} converted`
        );
      }
    }

    return validationResult;
  }

  countOperations(openAPISpec) {
    let count = 0;
    if (openAPISpec.paths) {
      for (const methods of Object.values(openAPISpec.paths)) {
        for (const [method, operation] of Object.entries(methods)) {
          if (typeof operation === 'object' && operation.operationId) {
            count++;
          }
        }
      }
    }
    return count;
  }
}