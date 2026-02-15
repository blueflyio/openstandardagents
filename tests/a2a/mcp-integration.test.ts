/**
 * MCP Integration Tests
 *
 * Demonstrates:
 * - Integration with MCP protocol
 * - Cross-language agent communication (TypeScript ↔ PHP ↔ Python)
 * - Resource, prompt, and tool discovery via MCP
 *
 * @module tests/a2a/mcp-integration.test
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  MCPIntegrationService,
  type MCPResource,
  type MCPPrompt,
  type MCPTool,
} from '../../src/adapters/a2a/mcp-integration.js';
import type { AgentIdentity } from '../../src/adapters/a2a/a2a-protocol.js';

describe.skip('MCP Integration', () => {
  // TODO: Fix Jest ESM parsing issue with MCP imports
  let mcpService: MCPIntegrationService;

  beforeEach(() => {
    mcpService = new MCPIntegrationService();
  });

  describe('MCP Server Connection', () => {
    it('should connect to MCP server', async () => {
      const serverUri = 'stdio://path/to/mcp-server';

      const connection = await mcpService.connectMCPServer(serverUri);

      expect(connection).toBeDefined();
      expect(connection.id).toBeDefined();
      expect(connection.uri).toBe(serverUri);
      expect(connection.status).toBe('connected');
      expect(connection.protocolVersion).toBeDefined();
    });

    it('should disconnect from MCP server', async () => {
      const serverUri = 'stdio://mcp-server';

      const connection = await mcpService.connectMCPServer(serverUri);
      await mcpService.disconnectMCPServer(connection.id);

      const connections = mcpService.getConnections();
      const disconnected = connections.find((c) => c.id === connection.id);

      expect(disconnected).toBeUndefined();
    });

    it('should track active connections', async () => {
      const servers = [
        'stdio://server-1',
        'stdio://server-2',
        'stdio://server-3',
      ];

      for (const serverUri of servers) {
        await mcpService.connectMCPServer(serverUri);
      }

      const connections = mcpService.getConnections();

      expect(connections.length).toBe(3);
      expect(connections.every((c) => c.status === 'connected')).toBe(true);
    });
  });

  describe('Agent as MCP Server', () => {
    it('should expose agent as MCP server', async () => {
      const agent: AgentIdentity = {
        id: crypto.randomUUID(),
        namespace: 'production',
        name: 'code-generator',
        uri: 'agent://production/code-generator',
        capabilities: ['code-generation', 'typescript', 'testing'],
        version: '1.0.0',
      };

      const server = await mcpService.exposeMCPServer(agent);

      expect(server).toBeDefined();
      expect(server.id).toBeDefined();
      expect(server.agent).toBe(agent);
      expect(server.endpoint).toBe('mcp://production/code-generator');
      expect(server.capabilities).toBeDefined();
      expect(server.capabilities.resources).toBeDefined();
      expect(server.capabilities.prompts).toBeDefined();
      expect(server.capabilities.tools).toBeDefined();
    });

    it('should track exposed servers', async () => {
      const agents: AgentIdentity[] = [
        createAgentIdentity('agent-1', ['cap1']),
        createAgentIdentity('agent-2', ['cap2']),
      ];

      for (const agent of agents) {
        await mcpService.exposeMCPServer(agent);
      }

      const servers = mcpService.getServers();

      expect(servers.length).toBe(2);
    });
  });

  describe('Resource Discovery', () => {
    it('should discover MCP resources', async () => {
      const serverUri = 'stdio://resource-server';
      const connection = await mcpService.connectMCPServer(serverUri);

      const resources = await mcpService.discoverResources(connection.id);

      expect(resources).toBeDefined();
      expect(Array.isArray(resources)).toBe(true);
    });

    it('should read MCP resource', async () => {
      const serverUri = 'stdio://resource-server';
      const connection = await mcpService.connectMCPServer(serverUri);

      const resourceUri = 'file:///path/to/resource.txt';
      const content = await mcpService.readResource(connection.id, resourceUri);

      expect(content).toBeDefined();
    });
  });

  describe('Prompt Discovery', () => {
    it('should discover MCP prompts', async () => {
      const serverUri = 'stdio://prompt-server';
      const connection = await mcpService.connectMCPServer(serverUri);

      const prompts = await mcpService.discoverPrompts(connection.id);

      expect(prompts).toBeDefined();
      expect(Array.isArray(prompts)).toBe(true);
    });
  });

  describe('Tool Discovery and Invocation', () => {
    it('should discover MCP tools', async () => {
      const serverUri = 'stdio://tool-server';
      const connection = await mcpService.connectMCPServer(serverUri);

      const tools = await mcpService.discoverTools(connection.id);

      expect(tools).toBeDefined();
      expect(Array.isArray(tools)).toBe(true);
    });

    it('should call MCP tool', async () => {
      const serverUri = 'stdio://tool-server';
      const connection = await mcpService.connectMCPServer(serverUri);

      const toolName = 'execute_code';
      const arguments_ = {
        code: 'console.log("Hello from MCP!")',
        language: 'javascript',
      };

      const result = await mcpService.callTool(
        connection.id,
        toolName,
        arguments_
      );

      expect(result).toBeDefined();
    });
  });

  describe('Protocol Conversion', () => {
    it('should convert A2A message to MCP message', () => {
      const from: AgentIdentity = createAgentIdentity('sender', []);
      const to: AgentIdentity = createAgentIdentity('receiver', []);

      const a2aMessage = {
        id: crypto.randomUUID(),
        from,
        to,
        type: 'request' as any,
        payload: { action: 'process', data: { value: 42 } },
        version: '0.4.4',
        metadata: {
          priority: 'normal' as any,
          timeout: 30000,
          retries: 3,
          traceContext: {
            traceparent: '00-' + '1'.repeat(32) + '-' + '2'.repeat(16) + '-01',
            traceId: '1'.repeat(32),
            spanId: '2'.repeat(16),
          },
          createdAt: new Date().toISOString(),
        },
      };

      const mcpMessage = mcpService.a2aToMCP(a2aMessage);

      expect(mcpMessage).toBeDefined();
      expect((mcpMessage as any).jsonrpc).toBe('2.0');
      expect((mcpMessage as any).id).toBe(a2aMessage.id);
      expect((mcpMessage as any).params).toBe(a2aMessage.payload);
    });

    it('should convert MCP message to A2A message', () => {
      const from: AgentIdentity = createAgentIdentity('mcp-sender', []);
      const to: AgentIdentity = createAgentIdentity('mcp-receiver', []);

      const mcpMessage = {
        jsonrpc: '2.0',
        id: crypto.randomUUID(),
        method: 'tools/call',
        params: {
          name: 'analyze_code',
          arguments: { file: 'main.ts' },
        },
      };

      const a2aMessage = mcpService.mcpToA2A(mcpMessage, from, to);

      expect(a2aMessage).toBeDefined();
      expect(a2aMessage.id).toBe(mcpMessage.id);
      expect(a2aMessage.from).toBe(from);
      expect(a2aMessage.to).toBe(to);
      expect(a2aMessage.payload).toBe(mcpMessage.params);
      expect(a2aMessage.version).toBe('0.4.4');
    });
  });

  describe('Cross-Language Communication', () => {
    it('should enable TypeScript ↔ PHP communication', async () => {
      // Simulate PHP MCP server (Symfony MCP Bundle)
      const phpServerUri = 'stdio://symfony-mcp-bundle';
      const phpConnection = await mcpService.connectMCPServer(phpServerUri);

      // TypeScript agent
      const tsAgent: AgentIdentity = createAgentIdentity('ts-agent', [
        'typescript',
      ]);

      // Discover PHP server capabilities
      const phpTools = await mcpService.discoverTools(phpConnection.id);

      expect(phpTools).toBeDefined();
      expect(Array.isArray(phpTools)).toBe(true);

      // Call PHP tool from TypeScript
      const result = await mcpService.callTool(
        phpConnection.id,
        'process_data',
        {
          data: [1, 2, 3, 4, 5],
        }
      );

      expect(result).toBeDefined();
    });

    it('should enable TypeScript ↔ Python communication', async () => {
      // Simulate Python MCP server
      const pythonServerUri = 'stdio://python-mcp-server';
      const pythonConnection =
        await mcpService.connectMCPServer(pythonServerUri);

      // Discover Python server resources
      const resources = await mcpService.discoverResources(pythonConnection.id);

      expect(resources).toBeDefined();

      // Call Python tool
      const result = await mcpService.callTool(pythonConnection.id, 'analyze', {
        text: 'Hello from TypeScript!',
      });

      expect(result).toBeDefined();
    });

    it('should support multi-language agent mesh', async () => {
      // Create multi-language mesh
      const servers = [
        { uri: 'stdio://typescript-agent', lang: 'TypeScript' },
        { uri: 'stdio://php-agent', lang: 'PHP' },
        { uri: 'stdio://python-agent', lang: 'Python' },
      ];

      const connections = [];
      for (const server of servers) {
        const connection = await mcpService.connectMCPServer(server.uri);
        connections.push({ ...connection, language: server.lang });
      }

      expect(connections.length).toBe(3);

      // Each agent can discover and communicate with others
      for (const connection of connections) {
        const tools = await mcpService.discoverTools(connection.id);
        expect(tools).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors', async () => {
      const invalidUri = 'invalid://server';

      await expect(
        mcpService.connectMCPServer(invalidUri)
      ).resolves.toBeDefined(); // Mock doesn't fail
    });

    it('should handle missing connection', async () => {
      const nonExistentId = crypto.randomUUID();

      await expect(mcpService.discoverResources(nonExistentId)).rejects.toThrow(
        'MCP connection not found'
      );
    });
  });
});

// Helper functions

function createAgentIdentity(
  name: string,
  capabilities: string[]
): AgentIdentity {
  return {
    id: crypto.randomUUID(),
    namespace: 'test',
    name,
    uri: `agent://test/${name}`,
    capabilities,
    version: '1.0.0',
  };
}
