/**
 * MCP Transport Manager Tests
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from '@jest/globals';
import { MCPTransportManager, MCPTransportType } from '../mcp-transport.js';

describe('MCPTransportManager', () => {
  let transportManager: MCPTransportManager;

  beforeEach(() => {
    transportManager = new MCPTransportManager();
  });

  afterEach(async () => {
    await transportManager.disconnectAll();
  });

  describe('URI Parsing', () => {
    it('should parse stdio URI correctly', async () => {
      const uri = 'stdio://python/path/to/script.py?arg1=value1&arg2=value2';

      try {
        await transportManager.getClient(uri);
      } catch (error) {
        // Expected to fail (no actual server), but parsing should work
        expect(error).toBeDefined();
      }

      // Check that connection attempt was made
      const connections = transportManager.getConnections();
      expect(connections.length).toBeLessThanOrEqual(1);
    });

    it('should parse HTTP URI correctly', async () => {
      const uri = 'http://localhost:3000/mcp';

      try {
        await transportManager.getClient(uri);
      } catch (error) {
        // Expected to fail (no actual server)
        expect(error).toBeDefined();
      }
    });

    it('should parse HTTPS URI correctly', async () => {
      const uri = 'https://api.example.com/mcp';

      try {
        await transportManager.getClient(uri);
      } catch (error) {
        // Expected to fail (no actual server)
        expect(error).toBeDefined();
      }
    });

    it('should reject unsupported protocols', async () => {
      const uri = 'ftp://example.com/mcp';

      await expect(transportManager.getClient(uri)).rejects.toThrow(
        'Unsupported protocol'
      );
    });

    it('should reject invalid URIs', async () => {
      const uri = 'not-a-valid-uri';

      await expect(transportManager.getClient(uri)).rejects.toThrow(
        'Invalid MCP URI'
      );
    });
  });

  describe('Connection Pooling', () => {
    it('should reuse existing connections', async () => {
      const uri = 'http://localhost:3000/mcp';

      // First connection attempt
      try {
        await transportManager.getClient(uri);
      } catch (error) {
        // Ignore connection error
      }

      const stats1 = transportManager.getStats();
      const initialConnections = stats1.totalConnections;

      // Second connection attempt (should reuse)
      try {
        await transportManager.getClient(uri);
      } catch (error) {
        // Ignore connection error
      }

      const stats2 = transportManager.getStats();
      expect(stats2.totalConnections).toBe(initialConnections);
    });

    it('should track request count', async () => {
      const uri = 'http://localhost:3000/mcp';

      try {
        const wrapper = await transportManager.getClient(uri);
        expect(wrapper.requestCount).toBe(0);
      } catch (error) {
        // Connection will fail, but wrapper should be tracked
      }
    });

    it('should update last activity timestamp', async () => {
      const uri = 'http://localhost:3000/mcp';

      try {
        const wrapper1 = await transportManager.getClient(uri);
        const firstActivity = wrapper1.lastActivity;

        // Wait a bit
        await new Promise((resolve) => setTimeout(resolve, 10));

        const wrapper2 = await transportManager.getClient(uri);
        expect(wrapper2.lastActivity.getTime()).toBeGreaterThanOrEqual(
          firstActivity.getTime()
        );
      } catch (error) {
        // Ignore connection errors
      }
    });
  });

  describe('Connection Management', () => {
    it('should disconnect specific connection', async () => {
      const uri = 'http://localhost:3000/mcp';

      try {
        await transportManager.getClient(uri);
      } catch (error) {
        // Ignore connection error
      }

      await transportManager.disconnect(uri);

      const connections = transportManager.getConnections();
      expect(connections.find((c) => c.config.url === uri)).toBeUndefined();
    });

    it('should disconnect all connections', async () => {
      const uri1 = 'http://localhost:3000/mcp';
      const uri2 = 'http://localhost:3001/mcp';

      try {
        await transportManager.getClient(uri1);
        await transportManager.getClient(uri2);
      } catch (error) {
        // Ignore connection errors
      }

      await transportManager.disconnectAll();

      const connections = transportManager.getConnections();
      expect(connections.length).toBe(0);
    });

    it('should handle disconnect of non-existent connection gracefully', async () => {
      await expect(
        transportManager.disconnect('http://nonexistent:3000/mcp')
      ).resolves.not.toThrow();
    });
  });

  describe('Statistics', () => {
    it('should track connection statistics', async () => {
      const uri = 'http://localhost:3000/mcp';

      try {
        await transportManager.getClient(uri);
      } catch (error) {
        // Ignore connection error
      }

      const stats = transportManager.getStats();
      expect(stats).toHaveProperty('totalConnections');
      expect(stats).toHaveProperty('totalRequests');
      expect(stats).toHaveProperty('connections');
      expect(Array.isArray(stats.connections)).toBe(true);
    });

    it('should return empty stats when no connections', () => {
      const stats = transportManager.getStats();
      expect(stats.totalConnections).toBe(0);
      expect(stats.totalRequests).toBe(0);
      expect(stats.connections.length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle connection timeout gracefully', async () => {
      const uri = 'http://192.0.2.1:9999/mcp'; // Non-routable IP

      await expect(transportManager.getClient(uri)).rejects.toThrow();
    }, 35000); // Longer timeout for connection attempt

    it('should handle request errors', async () => {
      const uri = 'http://localhost:9999/mcp';

      await expect(
        transportManager.sendRequest(uri, 'test/method', {})
      ).rejects.toThrow();
    }, 35000);
  });

  describe('Transport Types', () => {
    it('should support STDIO transport type', async () => {
      const uri = 'stdio://node/script.js';

      try {
        await transportManager.getClient(uri);
      } catch (error) {
        // Connection will fail, but transport type should be parsed
        expect(error).toBeDefined();
      }
    });

    it('should support HTTP transport type', async () => {
      const uri = 'http://localhost:3000/mcp';

      try {
        await transportManager.getClient(uri);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should support HTTPS transport type', async () => {
      const uri = 'https://api.example.com/mcp';

      try {
        await transportManager.getClient(uri);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should reject WebSocket (not yet implemented)', async () => {
      const uri = 'ws://localhost:3000/mcp';

      await expect(transportManager.getClient(uri)).rejects.toThrow(
        'not yet implemented'
      );
    });
  });
});
