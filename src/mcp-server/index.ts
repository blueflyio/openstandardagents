#!/usr/bin/env node

/**
 * OSSA MCP Server for Claude Desktop Integration
 * Provides SSE transport and OSSA-specific tools for Claude Desktop
 */

import { Server } from '@modelcontextprotocol/sdk/server';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse';
import { OSSATools } from './tools/ossa-tools.js';
import { OSSAResources } from './resources/ossa-resources.js';
import { OSSAPrompts } from './prompts/ossa-prompts.js';
import { OSSALogger } from './utils/logger.js';

const logger = new OSSALogger('ossa-mcp-server');

class OSSAMCPServer {
  private server: Server;
  private transport: SSEServerTransport;

  constructor() {
    this.server = new Server({
      name: 'ossa-mcp-server',
      version: '0.2.0'
    }, {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
        logging: {}
      }
    });

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Tools handlers
    this.server.setRequestHandler('tools/list', async () => {
      logger.info('Listing OSSA tools');
      return {
        tools: OSSATools.getTools()
      };
    });

    this.server.setRequestHandler('tools/call', async (request) => {
      logger.info(`Executing tool: ${request.params.name}`);
      try {
        return await OSSATools.executeTool(
          request.params.name, 
          request.params.arguments
        );
      } catch (error) {
        logger.error(`Tool execution failed: ${error.message}`);
        throw error;
      }
    });

    // Resources handlers
    this.server.setRequestHandler('resources/list', async () => {
      logger.info('Listing OSSA resources');
      return {
        resources: OSSAResources.getResources()
      };
    });

    this.server.setRequestHandler('resources/read', async (request) => {
      logger.info(`Reading resource: ${request.params.uri}`);
      try {
        return await OSSAResources.readResource(request.params.uri);
      } catch (error) {
        logger.error(`Resource read failed: ${error.message}`);
        throw error;
      }
    });

    // Prompts handlers
    this.server.setRequestHandler('prompts/list', async () => {
      logger.info('Listing OSSA prompts');
      return {
        prompts: OSSAPrompts.getPrompts()
      };
    });

    this.server.setRequestHandler('prompts/get', async (request) => {
      logger.info(`Getting prompt: ${request.params.name}`);
      try {
        return await OSSAPrompts.getPrompt(request.params.name, request.params.arguments);
      } catch (error) {
        logger.error(`Prompt get failed: ${error.message}`);
        throw error;
      }
    });

    // Logging handlers
    this.server.setRequestHandler('logging/setLevel', async (request) => {
      logger.info(`Setting log level: ${request.params.level}`);
      logger.setLevel(request.params.level);
      return {};
    });
  }

  async start(port: number = 3000): Promise<void> {
    try {
      this.transport = new SSEServerTransport('/mcp', this.server);
      await this.transport.start();
      
      logger.info(`🚀 OSSA MCP Server started on port ${port}`);
      logger.info('📡 SSE transport ready for Claude Desktop');
      logger.info('🛠️  OSSA tools available: generate_agent, validate, introspect, lifecycle, test_compliance');
      
      // Keep the server running
      process.on('SIGINT', async () => {
        logger.info('🛑 Shutting down OSSA MCP Server...');
        await this.transport.close();
        process.exit(0);
      });

    } catch (error) {
      logger.error(`Failed to start MCP server: ${error.message}`);
      process.exit(1);
    }
  }
}

// Start the server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = parseInt(process.env.PORT || '3000');
  const server = new OSSAMCPServer();
  server.start(port);
}

export { OSSAMCPServer };
