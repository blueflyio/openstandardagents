import { D3DataService } from '../../src/services/visualization/D3DataService.js';
import type { OpenAPIObject } from 'openapi-types';

describe('D3DataService', () => {
  let service: D3DataService;

  beforeEach(() => {
    service = new D3DataService();
  });

  const mockSpec: OpenAPIObject = {
    openapi: '3.1.0',
    info: { title: 'Test', version: '1.0.0' },
    paths: {},
    components: {
      schemas: {
        WorkerAgent: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['worker'] },
            capabilities: { type: 'array' }
          }
        },
        OrchestratorAgent: {
          type: 'object',
          allOf: [{ $ref: '#/components/schemas/WorkerAgent' }],
          properties: {
            type: { type: 'string', enum: ['orchestrator'] }
          }
        }
      }
    }
  };

  describe('generateForceGraph', () => {
    it('should generate force-directed graph data', async () => {
      const result = await service.generateForceGraph(mockSpec);

      expect(result).toHaveProperty('nodes');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.nodes)).toBe(true);
      expect(Array.isArray(result.links)).toBe(true);
    });

    it('should assign groups to nodes', async () => {
      const result = await service.generateForceGraph(mockSpec);

      const workerNode = result.nodes.find((n) => n.type === 'worker');
      expect(workerNode).toBeDefined();
      expect(workerNode?.group).toBeDefined();
    });

    it('should extract links from schema references', async () => {
      const result = await service.generateForceGraph(mockSpec);

      // Should have a link from OrchestratorAgent to WorkerAgent (allOf)
      const inheritanceLink = result.links.find((l) => l.type === 'extends');

      expect(inheritanceLink).toBeDefined();
    });
  });

  describe('generateHierarchy', () => {
    it('should generate hierarchical tree structure', async () => {
      const result = await service.generateHierarchy(mockSpec);

      expect(result.name).toBe('OSSA Agents');
      expect(result.children).toBeDefined();
      expect(Array.isArray(result.children)).toBe(true);
    });

    it('should group agents by type', async () => {
      const result = await service.generateHierarchy(mockSpec);

      const workerGroup = result.children?.find((c) => c.name === 'worker');
      expect(workerGroup).toBeDefined();
      expect(workerGroup?.children).toBeDefined();
    });
  });

  describe('generateSankey', () => {
    it('should generate Sankey diagram data', async () => {
      const flows = [
        { from: 'A', to: 'B', volume: 10 },
        { from: 'B', to: 'C', volume: 5 }
      ];

      const result = await service.generateSankey(flows);

      expect(result.nodes).toHaveLength(3);
      expect(result.links).toHaveLength(2);
    });

    it('should map node names to indices', async () => {
      const flows = [{ from: 'Agent1', to: 'Agent2', volume: 10 }];

      const result = await service.generateSankey(flows);

      expect(result.links[0].source).toBe(0);
      expect(result.links[0].target).toBe(1);
      expect(result.links[0].value).toBe(10);
    });
  });

  describe('generateChord', () => {
    it('should generate chord diagram data', async () => {
      const interactions = [
        { agent1: 'A', agent2: 'B', count: 5 },
        { agent1: 'B', agent2: 'C', count: 3 }
      ];

      const result = await service.generateChord(interactions);

      expect(result.names).toHaveLength(3);
      expect(result.matrix).toHaveLength(3);
      expect(result.matrix[0]).toHaveLength(3);
    });

    it('should create symmetric matrix', async () => {
      const interactions = [{ agent1: 'A', agent2: 'B', count: 5 }];

      const result = await service.generateChord(interactions);

      const aIndex = result.names.indexOf('A');
      const bIndex = result.names.indexOf('B');

      expect(result.matrix[aIndex][bIndex]).toBe(5);
      expect(result.matrix[bIndex][aIndex]).toBe(5);
    });
  });

  describe('generateMatrix', () => {
    it('should generate adjacency matrix', async () => {
      const result = await service.generateMatrix(mockSpec);

      expect(result.nodes).toBeDefined();
      expect(result.matrix).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('should have correct matrix dimensions', async () => {
      const result = await service.generateMatrix(mockSpec);

      const size = result.nodes.length;
      expect(result.matrix).toHaveLength(size);
      expect(result.matrix[0]).toHaveLength(size);
    });
  });

  describe('generateTimeSeries', () => {
    it('should convert events to time-series data', () => {
      const events = [
        { timestamp: 1000, value: 10, type: 'cpu' },
        { timestamp: 2000, value: 20, type: 'memory' }
      ];

      const result = service.generateTimeSeries('agent-1', events);

      expect(result).toHaveLength(2);
      expect(result[0].date).toBeInstanceOf(Date);
      expect(result[0].value).toBe(10);
      expect(result[0].type).toBe('cpu');
    });
  });
});
