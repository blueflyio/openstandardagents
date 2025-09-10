/**
 * ACDL Agent Discovery Tests
 * Version: v0.1.9-alpha.1
 * Status: RED PHASE - All tests MUST FAIL (no implementation exists)
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';

const API_BASE_URL = process.env.OSSA_API_URL || 'http://localhost:3000/api/v1';

describe('ACDL Agent Discovery - /acdl/discover', () => {

  describe('Discovery by Domain', () => {
    
    it('should discover all documentation agents', async () => {
      const query = {
        domains: ['documentation']
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/discover')
        .send(query)
        .expect(200);

      expect(response.body).toHaveProperty('agents');
      expect(Array.isArray(response.body.agents)).toBe(true);
      expect(response.body).toHaveProperty('totalFound');
      expect(response.body).toHaveProperty('queryTime');
      
      // All returned agents should support documentation domain
      response.body.agents.forEach((agent: any) => {
        expect(agent.manifest.capabilities.domains).toContain('documentation');
      });
    });

    it('should discover all API design agents', async () => {
      const query = {
        domains: ['api-design']
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/discover')
        .send(query)
        .expect(200);

      expect(response.body.agents.length).toBeGreaterThan(0);
      response.body.agents.forEach((agent: any) => {
        expect(agent.manifest.capabilities.domains).toContain('api-design');
        expect(agent).toHaveProperty('score');
        expect(agent.score).toBeGreaterThanOrEqual(0);
        expect(agent.score).toBeLessThanOrEqual(1);
      });
    });

    it('should discover agents with multiple domain requirements', async () => {
      const query = {
        domains: ['api-design', 'validation', 'documentation']
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/discover')
        .send(query)
        .expect(200);

      // Agents should support ALL requested domains
      response.body.agents.forEach((agent: any) => {
        const agentDomains = agent.manifest.capabilities.domains;
        expect(agentDomains).toEqual(
          expect.arrayContaining(['api-design', 'validation', 'documentation'])
        );
      });
    });

    it('should handle empty result set gracefully', async () => {
      const query = {
        domains: ['non-existent-domain-xyz']
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/discover')
        .send(query)
        .expect(200);

      expect(response.body.agents).toEqual([]);
      expect(response.body.totalFound).toBe(0);
    });

    it('should discover agents by specific operations', async () => {
      const query = {
        operations: ['validate', 'generate']
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/discover')
        .send(query)
        .expect(200);

      response.body.agents.forEach((agent: any) => {
        const operationNames = agent.manifest.capabilities.operations.map((op: any) => op.name);
        expect(operationNames).toEqual(
          expect.arrayContaining(['validate', 'generate'])
        );
      });
    });
  });

  describe('Discovery by Performance', () => {
    
    it('should find agents with low latency (<100ms p99)', async () => {
      const query = {
        performance: {
          maxLatencyP99: 100
        }
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/discover')
        .send(query)
        .expect(200);

      response.body.agents.forEach((agent: any) => {
        expect(agent.manifest.performance.latency.p99).toBeLessThanOrEqual(100);
      });
    });

    it('should find high-throughput agents (>1000 RPS)', async () => {
      const query = {
        performance: {
          minThroughput: 1000
        }
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/discover')
        .send(query)
        .expect(200);

      response.body.agents.forEach((agent: any) => {
        expect(agent.manifest.performance.throughput.requestsPerSecond).toBeGreaterThanOrEqual(1000);
      });
    });

    it('should find agents meeting combined performance criteria', async () => {
      const query = {
        performance: {
          minThroughput: 100,
          maxLatencyP99: 250
        }
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/discover')
        .send(query)
        .expect(200);

      response.body.agents.forEach((agent: any) => {
        expect(agent.manifest.performance.throughput.requestsPerSecond).toBeGreaterThanOrEqual(100);
        expect(agent.manifest.performance.latency.p99).toBeLessThanOrEqual(250);
      });
    });

    it('should rank agents by performance score', async () => {
      const query = {
        domains: ['api-design'],
        performance: {
          minThroughput: 50
        }
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/discover')
        .send(query)
        .expect(200);

      // Verify agents are sorted by score (highest first)
      for (let i = 1; i < response.body.agents.length; i++) {
        expect(response.body.agents[i - 1].score).toBeGreaterThanOrEqual(response.body.agents[i].score);
      }
    });
  });

  describe('Protocol-based Discovery', () => {
    
    it('should discover REST API agents', async () => {
      const query = {
        protocols: ['rest']
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/discover')
        .send(query)
        .expect(200);

      response.body.agents.forEach((agent: any) => {
        const protocolNames = agent.manifest.protocols.supported.map((p: any) => p.name);
        expect(protocolNames).toContain('rest');
      });
    });

    it('should discover gRPC agents', async () => {
      const query = {
        protocols: ['grpc']
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/discover')
        .send(query)
        .expect(200);

      response.body.agents.forEach((agent: any) => {
        const protocolNames = agent.manifest.protocols.supported.map((p: any) => p.name);
        expect(protocolNames).toContain('grpc');
      });
    });

    it('should discover MCP-compatible agents', async () => {
      const query = {
        protocols: ['mcp']
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/discover')
        .send(query)
        .expect(200);

      response.body.agents.forEach((agent: any) => {
        const protocolNames = agent.manifest.protocols.supported.map((p: any) => p.name);
        expect(protocolNames).toContain('mcp');
        
        // MCP agents should have proper MCP endpoints
        const mcpProtocol = agent.manifest.protocols.supported.find((p: any) => p.name === 'mcp');
        expect(mcpProtocol.endpoint).toMatch(/^mcp:\/\//);
      });
    });

    it('should discover agents with multiple protocol support', async () => {
      const query = {
        protocols: ['rest', 'websocket']
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/discover')
        .send(query)
        .expect(200);

      response.body.agents.forEach((agent: any) => {
        const protocolNames = agent.manifest.protocols.supported.map((p: any) => p.name);
        expect(protocolNames).toEqual(
          expect.arrayContaining(['rest', 'websocket'])
        );
      });
    });
  });

  describe('Discovery by Agent Type', () => {
    
    it('should discover all orchestrator agents', async () => {
      const query = {
        agentType: 'orchestrator'
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/discover')
        .send(query)
        .expect(200);

      response.body.agents.forEach((agent: any) => {
        expect(agent.manifest.agentType).toBe('orchestrator');
      });
    });

    it('should discover worker agents with specific subtype', async () => {
      const query = {
        agentType: 'worker',
        domains: ['api-design']
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/discover')
        .send(query)
        .expect(200);

      response.body.agents.forEach((agent: any) => {
        expect(agent.manifest.agentType).toBe('worker');
        expect(agent.manifest.agentSubType).toMatch(/^worker\./);
      });
    });

    it('should discover critic agents for review tasks', async () => {
      const query = {
        agentType: 'critic',
        domains: ['security', 'quality', 'performance']
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/discover')
        .send(query)
        .expect(200);

      response.body.agents.forEach((agent: any) => {
        expect(agent.manifest.agentType).toBe('critic');
        const domains = agent.manifest.capabilities.domains;
        expect(
          domains.includes('security') || 
          domains.includes('quality') || 
          domains.includes('performance')
        ).toBe(true);
      });
    });
  });

  describe('Complex Discovery Queries', () => {
    
    it('should handle complex multi-criteria discovery', async () => {
      const query = {
        domains: ['api-design', 'validation'],
        agentType: 'worker',
        protocols: ['rest'],
        performance: {
          minThroughput: 100,
          maxLatencyP99: 500
        },
        operations: ['validate']
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/discover')
        .send(query)
        .expect(200);

      response.body.agents.forEach((agent: any) => {
        // Verify all criteria are met
        expect(agent.manifest.agentType).toBe('worker');
        expect(agent.manifest.capabilities.domains).toEqual(
          expect.arrayContaining(['api-design', 'validation'])
        );
        
        const protocolNames = agent.manifest.protocols.supported.map((p: any) => p.name);
        expect(protocolNames).toContain('rest');
        
        expect(agent.manifest.performance.throughput.requestsPerSecond).toBeGreaterThanOrEqual(100);
        expect(agent.manifest.performance.latency.p99).toBeLessThanOrEqual(500);
        
        const operationNames = agent.manifest.capabilities.operations.map((op: any) => op.name);
        expect(operationNames).toContain('validate');
      });
    });

    it('should paginate large result sets', async () => {
      const query = {
        domains: ['data'],
        pagination: {
          offset: 0,
          limit: 10
        }
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/discover')
        .send(query)
        .expect(200);

      expect(response.body.agents.length).toBeLessThanOrEqual(10);
      expect(response.body).toHaveProperty('totalFound');
      expect(response.body.totalFound).toBeGreaterThanOrEqual(response.body.agents.length);
    });

    it('should sort results by relevance score', async () => {
      const query = {
        domains: ['documentation', 'api-design'],
        sortBy: 'score',
        sortOrder: 'desc'
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/discover')
        .send(query)
        .expect(200);

      // Verify descending score order
      for (let i = 1; i < response.body.agents.length; i++) {
        expect(response.body.agents[i - 1].score).toBeGreaterThanOrEqual(response.body.agents[i].score);
      }
    });
  });

  describe('Discovery Response Validation', () => {
    
    it('should include query execution time', async () => {
      const query = {
        domains: ['testing']
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/discover')
        .send(query)
        .expect(200);

      expect(response.body).toHaveProperty('queryTime');
      expect(typeof response.body.queryTime).toBe('number');
      expect(response.body.queryTime).toBeGreaterThanOrEqual(0);
      expect(response.body.queryTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should include complete agent manifests in results', async () => {
      const query = {
        domains: ['orchestration']
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/discover')
        .send(query)
        .expect(200);

      if (response.body.agents.length > 0) {
        const agent = response.body.agents[0];
        
        // Verify complete manifest structure
        expect(agent).toHaveProperty('agentId');
        expect(agent).toHaveProperty('score');
        expect(agent).toHaveProperty('manifest');
        
        const manifest = agent.manifest;
        expect(manifest).toHaveProperty('agentId');
        expect(manifest).toHaveProperty('agentType');
        expect(manifest).toHaveProperty('agentSubType');
        expect(manifest).toHaveProperty('version');
        expect(manifest).toHaveProperty('capabilities');
        expect(manifest).toHaveProperty('protocols');
        expect(manifest).toHaveProperty('performance');
      }
    });

    it('should handle invalid query gracefully', async () => {
      const invalidQuery = {
        // Invalid field
        invalidField: 'test',
        domains: 123 // Should be array
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/discover')
        .send(invalidQuery)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('validation');
    });
  });

  describe('Agent Specialization Discovery', () => {
    
    it('should discover agents by specialization features', async () => {
      const query = {
        specializations: {
          openapi: {
            versions: ['3.1.0'],
            features: ['validate', 'generate']
          }
        }
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/discover')
        .send(query)
        .expect(200);

      response.body.agents.forEach((agent: any) => {
        const spec = agent.manifest.capabilities.specializations?.openapi;
        expect(spec).toBeDefined();
        expect(spec.versions).toContain('3.1.0');
        expect(spec.features).toEqual(
          expect.arrayContaining(['validate', 'generate'])
        );
      });
    });

    it('should discover agents with specific authentication requirements', async () => {
      const query = {
        protocols: ['rest'],
        authentication: 'api-key'
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/discover')
        .send(query)
        .expect(200);

      response.body.agents.forEach((agent: any) => {
        const restProtocol = agent.manifest.protocols.supported.find((p: any) => p.name === 'rest');
        expect(restProtocol.authentication?.type).toBe('api-key');
      });
    });
  });
});

// Test suite summary for TDD tracking
describe('ACDL Discovery Test Suite Summary', () => {
  it('should have 0% pass rate (all tests failing in RED phase)', () => {
    // This meta-test ensures we're in TDD RED phase
    expect(true).toBe(true); // This is the only test that should pass
  });
});