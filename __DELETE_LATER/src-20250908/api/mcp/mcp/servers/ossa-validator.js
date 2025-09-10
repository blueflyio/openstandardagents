#!/usr/bin/env node

/**
 * OSSA MCP Server - Validation and Analysis
 * Provides MCP-compliant tools for validating OSSA agent configurations
 * 
 * This server implements the Model Context Protocol (MCP) to provide
 * OSSA validation capabilities to MCP-compatible clients like Claude Desktop.
 */
import { readFile, access, readdir } from 'fs/promises';
import { join, extname, resolve } from 'path';
import { load } from 'js-yaml';
import { constants } from 'fs';

class OSSAValidatorServer {
  constructor() {
    this.name = 'ossa-validator';
    this.version = '0.1.8';
    this.description = 'OSSA configuration validator and analyzer via MCP';
    
    // MCP protocol setup
    this.setupStdio();
  }

  setupStdio() {
    // Handle MCP protocol messages via stdio
    process.stdin.on('data', async (data) => {
      try {
        const message = JSON.parse(data.toString().trim());
        const response = await this.handleMessage(message);
        if (response) {
          process.stdout.write(JSON.stringify(response) + '\n');
        }
      } catch (error) {
        const errorResponse = {
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32700,
            message: 'Parse error',
            data: error.message
          }
        };
        process.stdout.write(JSON.stringify(errorResponse) + '\n');
      }
    });

    // Send initial server info
    this.sendServerInfo();
  }

  sendServerInfo() {
    const serverInfo = {
      jsonrpc: '2.0',
      method: 'server/info',
      params: {
        name: this.name,
        version: this.version,
        description: this.description,
        capabilities: {
          tools: {
            listChanged: true
          }
        }
      }
    };
    process.stdout.write(JSON.stringify(serverInfo) + '\n');
  }

  async handleMessage(message) {
    const { method, params, id } = message;

    switch (method) {
      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            tools: this.getTools()
          }
        };

      case 'tools/call':
        const { name, arguments: args } = params;
        const result = await this.callTool(name, args);
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          }
        };

      default:
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: 'Method not found'
          }
        };
    }
  }

  getTools() {
    return [
      {
        name: 'validate-ossa-config',
        description: 'Validates an OSSA agent configuration file against the specification',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: 'Path to the OSSA configuration file (.yml or .yaml)'
            }
          },
          required: ['filePath']
        }
      },
      {
        name: 'list-ossa-examples',
        description: 'Lists available OSSA example configurations',
        inputSchema: {
          type: 'object',
          properties: {
            examplesDir: {
              type: 'string',
              description: 'Directory containing OSSA examples (defaults to ./examples)'
            }
          }
        }
      },
      {
        name: 'analyze-ossa-capabilities',
        description: 'Analyzes the capabilities and framework compatibility of an OSSA agent',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: 'Path to the OSSA configuration file'
            }
          },
          required: ['filePath']
        }
      }
    ];
  }

  async callTool(name, args) {
    switch (name) {
      case 'validate-ossa-config':
        return await this.validateOSSAConfigTool(args);
      
      case 'list-ossa-examples':
        return await this.listOSSAExamplesTool(args);
      
      case 'analyze-ossa-capabilities':
        return await this.analyzeOSSACapabilitiesTool(args);
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  async validateOSSAConfigTool(args) {
    try {
      const { filePath } = args;
      const absolutePath = resolve(filePath);
      
      // Check if file exists
      await access(absolutePath, constants.R_OK);
      
      // Read and parse YAML
      const content = await readFile(absolutePath, 'utf-8');
      const config = load(content);
      
      // Perform validation
      const validation = await this.validateOSSAConfig(config, absolutePath);
      
      return {
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
        filePath: absolutePath,
        summary: validation.summary
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Failed to validate file: ${error.message}`],
        warnings: [],
        filePath: args.filePath || 'unknown'
      };
    }
  }

  async listOSSAExamplesTool(args) {
    try {
      const examplesDir = resolve(args.examplesDir || './examples');
      const files = await readdir(examplesDir);
      
      const ossaFiles = files.filter(file => 
        (file.endsWith('.yml') || file.endsWith('.yaml')) && 
        file.includes('ossa')
      );
      
      const examples = [];
      for (const file of ossaFiles) {
        try {
          const filePath = join(examplesDir, file);
          const content = await readFile(filePath, 'utf-8');
          const config = load(content);
          
          examples.push({
            filename: file,
            path: filePath,
            name: config.metadata?.name || 'unnamed',
            version: config.apiVersion || 'unknown',
            description: config.metadata?.description || 'No description'
          });
        } catch (error) {
          // Skip invalid files
        }
      }
      
      return {
        examples,
        count: examples.length,
        directory: examplesDir
      };
    } catch (error) {
      return {
        error: `Failed to list examples: ${error.message}`,
        examples: [],
        count: 0
      };
    }
  }

  async analyzeOSSACapabilitiesTool(args) {
    try {
      const content = await readFile(resolve(args.filePath), 'utf-8');
      const config = load(content);
      
      return {
        agent: config.spec?.agent || {},
        capabilities: config.spec?.capabilities || [],
        frameworks: config.spec?.frameworks || {},
        discovery: config.spec?.discovery || {},
        conformanceLevel: config.metadata?.annotations?.['ossa.io/conformance-level'] || 'unknown',
        analysis: this.analyzeCapabilities(config)
      };
    } catch (error) {
      return {
        error: `Failed to analyze capabilities: ${error.message}`
      };
    }
  }

  async validateOSSAConfig(config, filePath) {
    const errors = [];
    const warnings = [];
    let isValid = true;

    // Required fields validation
    if (!config.apiVersion) {
      errors.push('Missing required field: apiVersion');
      isValid = false;
    } else if (!config.apiVersion.startsWith('open-standards-scalable-agents/')) {
      errors.push('Invalid apiVersion format. Must start with "open-standards-scalable-agents/"');
      isValid = false;
    }

    if (!config.kind) {
      errors.push('Missing required field: kind');
      isValid = false;
    } else if (!['Agent', 'Workspace'].includes(config.kind)) {
      errors.push('Invalid kind. Must be "Agent" or "Workspace"');
      isValid = false;
    }

    if (!config.metadata) {
      errors.push('Missing required field: metadata');
      isValid = false;
    } else {
      if (!config.metadata.name) {
        errors.push('Missing required field: metadata.name');
        isValid = false;
      }
      if (!config.metadata.version) {
        errors.push('Missing required field: metadata.version');
        isValid = false;
      }
    }

    if (!config.spec) {
      errors.push('Missing required field: spec');
      isValid = false;
    } else if (config.kind === 'Agent') {
      // Agent-specific validation
      if (!config.spec.capabilities || !Array.isArray(config.spec.capabilities)) {
        errors.push('Missing or invalid spec.capabilities array');
        isValid = false;
      }
      
      if (!config.spec.frameworks) {
        warnings.push('No framework compatibility declared in spec.frameworks');
      } else {
        // Check MCP configuration
        if (config.spec.frameworks.mcp && config.spec.frameworks.mcp.enabled) {
          if (!config.spec.frameworks.mcp.transport) {
            warnings.push('MCP enabled but no transport specified');
          }
        }
      }
    }

    const summary = {
      totalChecks: 10,
      passed: 10 - errors.length,
      failed: errors.length,
      warnings: warnings.length
    };

    return { isValid, errors, warnings, summary };
  }

  analyzeCapabilities(config) {
    const analysis = {
      capabilityCount: 0,
      frameworkSupport: [],
      mcpReady: false,
      conformanceLevel: 'unknown'
    };

    if (config.spec?.capabilities) {
      analysis.capabilityCount = config.spec.capabilities.length;
    }

    if (config.spec?.frameworks) {
      analysis.frameworkSupport = Object.keys(config.spec.frameworks).filter(
        framework => config.spec.frameworks[framework].enabled
      );
      analysis.mcpReady = !!(config.spec.frameworks.mcp?.enabled);
    }

    if (config.metadata?.annotations) {
      analysis.conformanceLevel = config.metadata.annotations['ossa.io/conformance-level'] || 'unknown';
    }

    return analysis;
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new OSSAValidatorServer();
  
  // Server is automatically started via constructor
  console.error('OSSA MCP Server started - listening on stdio');
}

export { OSSAValidatorServer };