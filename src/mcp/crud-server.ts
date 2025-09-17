#!/usr/bin/env node

/**
 * OSSA MCP Server with CRUD Operations
 * Full Create, Read, Update, Delete support for OSSA agents
 */

import express from 'express';
import { WebSocketServer } from 'ws';
import * as http from 'http';

interface OSSAAgent {
  id: string;
  name: string;
  type: 'worker' | 'orchestrator' | 'critic' | 'monitor';
  status: 'active' | 'inactive' | 'error' | 'spawning';
  version: string;
  description?: string;
  capabilities: string[];
  config: Record<string, any>;
  created: string;
  updated: string;
  metadata: {
    author: string;
    framework: string;
  };
}

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

class OSSACRUDServer {
  private app: express.Application;
  private server: http.Server;
  private wss: WebSocketServer;
  private port: number;
  private agents: Map<string, OSSAAgent> = new Map();
  private orchestratorMetrics = {
    totalAgents: 0,
    activeAgents: 0,
    workflowsRunning: 0,
    uptime: Date.now(),
    lastHealthCheck: new Date().toISOString()
  };

  constructor(port: number = 4000) {
    this.port = port;
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });
    
    this.initializeDefaultAgents();
    this.setupExpress();
    this.setupWebSocket();
  }

  private initializeDefaultAgents(): void {
    const defaultAgents: OSSAAgent[] = [
      {
        id: 'ossa-orchestrator-001',
        name: 'OSSA Orchestrator',
        type: 'orchestrator',
        status: 'active',
        version: '0.1.9',
        description: 'Main orchestrator for OSSA agent coordination',
        capabilities: ['coordination', 'workflow', 'monitoring'],
        config: { maxAgents: 50, timeout: 300000 },
        created: '2025-01-01T00:00:00Z',
        updated: new Date().toISOString(),
        metadata: { author: 'OSSA System', framework: 'OSSA v0.1.9' }
      },
      {
        id: 'ossa-worker-001',
        name: 'Development Worker',
        type: 'worker',
        status: 'active',
        version: '0.1.9',
        description: 'General-purpose development worker agent',
        capabilities: ['coding', 'testing', 'documentation'],
        config: { concurrent_tasks: 3, memory_limit: '2GB' },
        created: '2025-01-01T00:00:00Z',
        updated: new Date().toISOString(),
        metadata: { author: 'OSSA System', framework: 'OSSA v0.1.9' }
      },
      {
        id: 'ossa-critic-001',
        name: 'Code Critic',
        type: 'critic',
        status: 'active',
        version: '0.1.9',
        description: 'Code review and quality assessment agent',
        capabilities: ['review', 'analysis', 'quality_check'],
        config: { strictness: 'high', coverage_threshold: 80 },
        created: '2025-01-01T00:00:00Z',
        updated: new Date().toISOString(),
        metadata: { author: 'OSSA System', framework: 'OSSA v0.1.9' }
      }
    ];

    defaultAgents.forEach(agent => {
      this.agents.set(agent.id, agent);
    });

    this.updateMetrics();
  }

  private updateMetrics(): void {
    this.orchestratorMetrics.totalAgents = this.agents.size;
    this.orchestratorMetrics.activeAgents = Array.from(this.agents.values())
      .filter(agent => agent.status === 'active').length;
    this.orchestratorMetrics.lastHealthCheck = new Date().toISOString();
  }

  private setupExpress(): void {
    this.app.use(express.json());
    
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        version: '0.1.9',
        server: 'ossa-crud-mcp',
        timestamp: new Date().toISOString(),
        agents: this.orchestratorMetrics
      });
    });

    // MCP capabilities
    this.app.get('/capabilities', (req, res) => {
      res.json({
        capabilities: {
          tools: [
            { name: 'ossa agent list', description: 'List OSSA agents with filtering' },
            { name: 'ossa agent create', description: 'Create a new OSSA agent' },
            { name: 'ossa agent read', description: 'Get agent details by ID' },
            { name: 'ossa agent update', description: 'Update an existing agent' },
            { name: 'ossa agent delete', description: 'Delete an agent' },
            { name: 'ossa orchestrator status', description: 'Get orchestrator metrics' }
          ],
          resources: [
            { uri: 'ossa://agents', name: 'OSSA Agents Registry' },
            { uri: 'ossa://metrics', name: 'OSSA Metrics' }
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
          ws.send(JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: { code: -32700, message: 'Parse error' }
          }));
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
            capabilities: { tools: {}, resources: {}, prompts: {} },
            serverInfo: { name: 'ossa-crud-mcp-server', version: '0.1.9' }
          }
        };

      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            tools: [
              {
                name: 'ossa agent list',
                description: 'List all registered OSSA agents with filtering and pagination',
                inputSchema: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', description: 'Filter by agent type', enum: ['worker', 'orchestrator', 'critic', 'monitor'] },
                    status: { type: 'string', description: 'Filter by status', enum: ['active', 'inactive', 'error', 'spawning'] },
                    limit: { type: 'number', description: 'Maximum agents to return', default: 50, minimum: 1, maximum: 100 },
                    offset: { type: 'number', description: 'Number of agents to skip', default: 0, minimum: 0 }
                  }
                }
              },
              {
                name: 'ossa agent create',
                description: 'Create a new OSSA agent with specified configuration',
                inputSchema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', description: 'Unique agent name', minLength: 3, maxLength: 50 },
                    type: { type: 'string', description: 'Agent type', enum: ['worker', 'orchestrator', 'critic', 'monitor'] },
                    description: { type: 'string', description: 'Agent description', maxLength: 200 },
                    capabilities: { type: 'array', items: { type: 'string' }, description: 'Agent capabilities' },
                    config: { type: 'object', description: 'Agent configuration parameters' }
                  },
                  required: ['name', 'type']
                }
              },
              {
                name: 'ossa agent read',
                description: 'Get detailed information about a specific OSSA agent',
                inputSchema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', description: 'Agent ID or name' }
                  },
                  required: ['id']
                }
              },
              {
                name: 'ossa agent update',
                description: 'Update an existing OSSA agent',
                inputSchema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', description: 'Agent ID or name' },
                    name: { type: 'string', description: 'Updated name', minLength: 3, maxLength: 50 },
                    description: { type: 'string', description: 'Updated description', maxLength: 200 },
                    capabilities: { type: 'array', items: { type: 'string' }, description: 'Updated capabilities' },
                    config: { type: 'object', description: 'Updated configuration' },
                    status: { type: 'string', description: 'Updated status', enum: ['active', 'inactive', 'error'] }
                  },
                  required: ['id']
                }
              },
              {
                name: 'ossa agent delete',
                description: 'Delete an OSSA agent from the registry',
                inputSchema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', description: 'Agent ID or name' },
                    force: { type: 'boolean', description: 'Force delete even if agent is active', default: false }
                  },
                  required: ['id']
                }
              },
              {
                name: 'ossa orchestrator status',
                description: 'Get OSSA orchestrator status and detailed metrics',
                inputSchema: {
                  type: 'object',
                  properties: {
                    detailed: { type: 'boolean', description: 'Include detailed agent metrics', default: false }
                  }
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
                description: 'Complete registry of all OSSA agents',
                mimeType: 'application/json'
              },
              {
                uri: 'ossa://metrics',
                name: 'OSSA Orchestrator Metrics',
                description: 'Real-time orchestrator metrics and statistics',
                mimeType: 'application/json'
              }
            ]
          }
        };

      default:
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method not found: ${method}` }
        };
    }
  }

  private handleToolCall(id: string | number, params: any): MCPResponse {
    const { name, arguments: args } = params;

    try {
      switch (name) {
        case 'ossa agent list':
          return this.handleAgentList(id, args);
        case 'ossa agent create':
          return this.handleAgentCreate(id, args);
        case 'ossa agent read':
          return this.handleAgentRead(id, args);
        case 'ossa agent update':
          return this.handleAgentUpdate(id, args);
        case 'ossa agent delete':
          return this.handleAgentDelete(id, args);
        case 'ossa orchestrator status':
          return this.handleOrchestratorStatus(id, args);
        default:
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32601, message: `Unknown tool: ${name}` }
          };
      }
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32000,
          message: (error as Error).message,
          data: { tool: name, args }
        }
      };
    }
  }

  private handleAgentList(id: string | number, args: any): MCPResponse {
    const { type, status, limit = 50, offset = 0 } = args || {};
    
    let agents = Array.from(this.agents.values());
    
    // Apply filters
    if (type) {
      agents = agents.filter(agent => agent.type === type);
    }
    if (status) {
      agents = agents.filter(agent => agent.status === status);
    }
    
    // Apply pagination
    const total = agents.length;
    const paginatedAgents = agents.slice(offset, offset + limit);
    
    return {
      jsonrpc: '2.0',
      id,
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify({
            agents: paginatedAgents,
            pagination: {
              total,
              limit,
              offset,
              hasMore: offset + limit < total
            },
            filters: { type, status }
          }, null, 2)
        }]
      }
    };
  }

  private handleAgentCreate(id: string | number, args: any): MCPResponse {
    const { name, type, description = '', capabilities = [], config = {} } = args;
    
    if (!name || !type) {
      throw new Error('Name and type are required');
    }
    
    // Check if agent already exists
    const existingAgent = Array.from(this.agents.values()).find(a => a.name === name);
    if (existingAgent) {
      throw new Error(`Agent with name '${name}' already exists`);
    }
    
    const agentId = `ossa-${type}-${Date.now()}`;
    const newAgent: OSSAAgent = {
      id: agentId,
      name,
      type,
      status: 'spawning',
      version: '0.1.9',
      description,
      capabilities,
      config,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      metadata: {
        author: 'MCP Client',
        framework: 'OSSA v0.1.9'
      }
    };
    
    this.agents.set(agentId, newAgent);
    this.updateMetrics();
    
    // Simulate agent initialization
    setTimeout(() => {
      const agent = this.agents.get(agentId);
      if (agent) {
        agent.status = 'active';
        agent.updated = new Date().toISOString();
        this.updateMetrics();
      }
    }, 2000);
    
    return {
      jsonrpc: '2.0',
      id,
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Agent '${name}' created successfully`,
            agent: newAgent
          }, null, 2)
        }]
      }
    };
  }

  private handleAgentRead(id: string | number, args: any): MCPResponse {
    const { id: agentId } = args;
    
    if (!agentId) {
      throw new Error('Agent ID is required');
    }
    
    // Find by ID or name
    const agent = this.agents.get(agentId) || 
      Array.from(this.agents.values()).find(a => a.name === agentId);
    
    if (!agent) {
      throw new Error(`Agent '${agentId}' not found`);
    }
    
    return {
      jsonrpc: '2.0',
      id,
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify({ agent }, null, 2)
        }]
      }
    };
  }

  private handleAgentUpdate(id: string | number, args: any): MCPResponse {
    const { id: agentId, name, description, capabilities, config, status } = args;
    
    if (!agentId) {
      throw new Error('Agent ID is required');
    }
    
    // Find agent
    const agent = this.agents.get(agentId) || 
      Array.from(this.agents.values()).find(a => a.name === agentId);
    
    if (!agent) {
      throw new Error(`Agent '${agentId}' not found`);
    }
    
    // Update fields
    if (name !== undefined) {
      // Check for name conflicts
      const existingAgent = Array.from(this.agents.values()).find(a => a.name === name && a.id !== agent.id);
      if (existingAgent) {
        throw new Error(`Agent with name '${name}' already exists`);
      }
      agent.name = name;
    }
    if (description !== undefined) agent.description = description;
    if (capabilities !== undefined) agent.capabilities = capabilities;
    if (config !== undefined) agent.config = { ...agent.config, ...config };
    if (status !== undefined) agent.status = status;
    
    agent.updated = new Date().toISOString();
    this.updateMetrics();
    
    return {
      jsonrpc: '2.0',
      id,
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Agent '${agent.name}' updated successfully`,
            agent
          }, null, 2)
        }]
      }
    };
  }

  private handleAgentDelete(id: string | number, args: any): MCPResponse {
    const { id: agentId, force = false } = args;
    
    if (!agentId) {
      throw new Error('Agent ID is required');
    }
    
    // Find agent
    const agent = this.agents.get(agentId) || 
      Array.from(this.agents.values()).find(a => a.name === agentId);
    
    if (!agent) {
      throw new Error(`Agent '${agentId}' not found`);
    }
    
    // Check if agent is active and force is not set
    if (agent.status === 'active' && !force) {
      throw new Error(`Agent '${agent.name}' is active. Use force=true to delete active agents`);
    }
    
    this.agents.delete(agent.id);
    this.updateMetrics();
    
    return {
      jsonrpc: '2.0',
      id,
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Agent '${agent.name}' deleted successfully`,
            deletedAgent: { id: agent.id, name: agent.name }
          }, null, 2)
        }]
      }
    };
  }

  private handleOrchestratorStatus(id: string | number, args: any): MCPResponse {
    const { detailed = false } = args || {};
    
    this.updateMetrics();
    
    const result: any = {
      status: 'healthy',
      version: '0.1.9',
      uptime: Math.floor((Date.now() - this.orchestratorMetrics.uptime) / 1000),
      metrics: this.orchestratorMetrics
    };
    
    if (detailed) {
      result.agents = Array.from(this.agents.values()).map(agent => ({
        id: agent.id,
        name: agent.name,
        type: agent.type,
        status: agent.status,
        updated: agent.updated
      }));
    }
    
    return {
      jsonrpc: '2.0',
      id,
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      }
    };
  }

  public start(): void {
    this.server.listen(this.port, () => {
      console.log(`[OSSA CRUD MCP] Server running on port ${this.port}`);
      console.log(`[OSSA CRUD MCP] HTTP: http://localhost:${this.port}`);
      console.log(`[OSSA CRUD MCP] WebSocket: ws://localhost:${this.port}`);
      console.log(`[OSSA CRUD MCP] Health: http://localhost:${this.port}/health`);
      console.log(`[OSSA CRUD MCP] Agents loaded: ${this.agents.size}`);
    });
  }
}

// Start server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = parseInt(process.env.PORT || '4000');
  const server = new OSSACRUDServer(port);
  server.start();
}

export default OSSACRUDServer;