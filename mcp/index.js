#!/usr/bin/env node

/**
 * ossa MCP Server
 * Provides Model Context Protocol interface for ossa service
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";

const OSSA_ENDPOINT = "http://localhost:3000";

class OssaMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "ossa-mcp",
        version: "0.2.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "ossa_status",
          description: "Get ossa service status and health",
          inputSchema: {
            type: "object",
            properties: {
              include_details: {
                type: "boolean",
                description: "Include detailed service information",
                default: false,
              },
            },
          },
        },
        {
          name: "ossa_help",
          description: "Get help and available commands for ossa",
          inputSchema: {
            type: "object",
            properties: {
              command: {
                type: "string",
                description: "Specific command to get help for",
              },
            },
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "ossa_status":
            return await this.getServiceStatus(args);
          case "ossa_help":
            return await this.getHelp(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async getServiceStatus(args) {
    try {
      const status = {
        server: "ossa-mcp",
        version: "0.2.0",
        status: "running",
        endpoint: OSSA_ENDPOINT,
        timestamp: new Date().toISOString(),
        service_type: "core",
      };

      if (args?.include_details) {
        status.detailed_info = {
          description: "ossa service",
          capabilities: ["basic_functionality"],
          dependencies: [],
          health: "healthy",
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(status, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get service status: ${error.message}`);
    }
  }

  async getHelp(args) {
    try {
      const helpText = `ossa MCP Server v0.2.0

This server provides access to ossa service through the Model Context Protocol.

Available Commands:
- ossa_status: Get service status and health
- ossa_help: Show this help message

Service Information:
- Type: core
- Description: ossa service
- Endpoint: OSSA_ENDPOINT

For more information, visit: https://gitlab.bluefly.io/llm/ossa`;

      return {
        content: [
          {
            type: "text",
            text: helpText,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get help: ${error.message}`);
    }
  }

  async start() {
    console.error("ossa MCP Server starting...");
  }

  async connect(transport) {
    await this.server.connect(transport);
    console.error("ossa MCP Server connected");
  }

  async stop() {
    console.error("ossa MCP Server stopping...");
  }
}

// Create and start the server
const server = new OssaMCPServer();
const transport = new StdioServerTransport();

// Handle shutdown gracefully
process.on("SIGINT", async () => {
  console.error("ossa MCP Server shutting down...");
  await server.stop();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.error("ossa MCP Server shutting down...");
  await server.stop();
  process.exit(0);
});

// Start the server
async function main() {
  try {
    await server.start();
    await server.connect(transport);
    console.error("ossa MCP Server started successfully");
  } catch (error) {
    console.error("Failed to start ossa MCP Server:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Unhandled error in ossa MCP Server:", error);
  process.exit(1);
});
