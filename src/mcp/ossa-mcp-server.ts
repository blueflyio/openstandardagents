#!/usr/bin/env node

/**
 * Simple OSSA MCP Server
 * Compatible with Langflow and standard MCP clients
 */

import express from 'express';
import { WebSocketServer } from 'ws';
import * as http from 'http';

interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

class OSSAMCPServer {
  private app: express.Application;
  private server: http.Server;
  private wss: WebSocketServer;
  private port: number;

  constructor(port: number = 4000) {
    this.port = port;
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });

    this.setupExpress();
    this.setupWebSocket();
  }

  private setupExpress(): void {
    this.app.use(express.json());

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        version: '0.1.9',
        server: 'ossa-mcp',
        timestamp: new Date().toISOString()
      });
    });

    // MCP capabilities
    this.app.get('/capabilities', (req, res) => {
      res.json({
        capabilities: {
          tools: [
            {
              name: 'ossa_agent_list',
              description: 'List all OSSA agents'
            },
            {
              name: 'ossa_agent_spawn',
              description: 'Spawn a new OSSA agent'
            },
            {
              name: 'ossa_orchestrator_status',
              description: 'Get orchestrator status'
            }
          ],
          resources: [
            {
              uri: 'ossa://agents',
              name: 'OSSA Agents Registry'
            }
          ]
        }
      });
    });

    // MCP over HTTP
    this.app.post('/mcp', (req, res) => {
      const request: MCPRequest = req.body;
      const response = this.handleMCPRequest(request);
      res.json(response);
    });
  }

  private setupWebSocket(): void {
    this.wss.on('connection', (ws) => {
      console.log('[OSSA MCP] WebSocket client connected');

      ws.on('message', (data) => {
        try {
          const request: MCPRequest = JSON.parse(data.toString());
          const response = this.handleMCPRequest(request);
          ws.send(JSON.stringify(response));
        } catch (error) {
          ws.send(
            JSON.stringify({
              jsonrpc: '2.0',
              id: null,
              error: {
                code: -32700,
                message: 'Parse error'
              }
            })
          );
        }
      });

      ws.on('close', () => {
        console.log('[OSSA MCP] WebSocket client disconnected');
      });
    });
  }

  private handleMCPRequest(request: MCPRequest): MCPResponse {
    const { id, method, params } = request;

    switch (method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
              resources: {},
              prompts: {}
            },
            serverInfo: {
              name: 'ossa-mcp-server',
              version: '0.1.9'
            }
          }
        };

      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            tools: [
              {
                name: 'ossa_agent_list',
                description: 'List all registered OSSA agents',
                inputSchema: {
                  type: 'object',
                  properties: {
                    filter: {
                      type: 'string',
                      description: 'Filter agents by type'
                    }
                  }
                }
              },
              {
                name: 'ossa_agent_spawn',
                description: 'Spawn a new OSSA agent',
                inputSchema: {
                  type: 'object',
                  properties: {
                    type: {
                      type: 'string',
                      description: 'Agent type (worker, orchestrator, critic)'
                    },
                    name: { type: 'string', description: 'Agent name' }
                  },
                  required: ['type', 'name']
                }
              },
              {
                name: 'ossa_orchestrator_status',
                description: 'Get OSSA orchestrator status',
                inputSchema: {
                  type: 'object',
                  properties: {}
                }
              }
            ]
          }
        };

      case 'tools/call':
        return this.handleToolCall(id, params);

      case 'resources/list':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            resources: [
              {
                uri: 'ossa://agents',
                name: 'OSSA Agents Registry',
                description: 'Registry of all OSSA agents',
                mimeType: 'application/json'
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
            message: `Method not found: ${method}`
          }
        };
    }
  }

  private handleToolCall(id: string | number, params: any): MCPResponse {
    const { name, arguments: args } = params;

    switch (name) {
      case 'ossa_agent_list':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    agents: [
                      {
                        id: 'ossa-orchestrator-001',
                        name: 'OSSA Orchestrator',
                        type: 'orchestrator',
                        status: 'active',
                        version: '0.1.9'
                      },
                      {
                        id: 'ossa-worker-001',
                        name: 'Development Worker',
                        type: 'worker',
                        status: 'active',
                        version: '0.1.9'
                      }
                    ]
                  },
                  null,
                  2
                )
              }
            ]
          }
        };

      case 'ossa_agent_spawn':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    agent: {
                      id: `ossa-${args?.type || 'worker'}-${Date.now()}`,
                      name: args?.name || 'Unnamed Agent',
                      type: args?.type || 'worker',
                      status: 'spawning',
                      version: '0.1.9'
                    }
                  },
                  null,
                  2
                )
              }
            ]
          }
        };

      case 'ossa_orchestrator_status':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    status: 'healthy',
                    version: '0.1.9',
                    activeAgents: 2,
                    workflowsRunning: 0,
                    lastHealthCheck: new Date().toISOString()
                  },
                  null,
                  2
                )
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
            message: `Unknown tool: ${name}`
          }
        };
    }
  }

  public start(): void {
    this.server.listen(this.port, () => {
      console.log(`[OSSA MCP] Server running on port ${this.port}`);
      console.log(`[OSSA MCP] HTTP: http://localhost:${this.port}`);
      console.log(`[OSSA MCP] WebSocket: ws://localhost:${this.port}`);
      console.log(`[OSSA MCP] Health: http://localhost:${this.port}/health`);
    });
  }
}

// Start server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = parseInt(process.env.PORT || '4000');
  const server = new OSSAMCPServer(port);
  server.start();
}

export default OSSAMCPServer;
