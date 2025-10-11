import { VisualizationService } from '../../src/services/visualization/VisualizationService.js';
import type { OpenAPIObject } from 'openapi-types';
import * as fs from 'fs/promises';

// Mock fs module
jest.mock('fs/promises');

describe('VisualizationService', () => {
  let service: VisualizationService;

  beforeEach(() => {
    service = new VisualizationService();
    jest.clearAllMocks();
  });

  describe('generate', () => {
    const mockSpec: OpenAPIObject = {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          WorkerAgent: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              capabilities: { type: 'array' }
            }
          }
        }
      }
    };

    it('should generate Mermaid flowchart', async () => {
      const result = await service.generate({
        type: 'mermaid-flowchart',
        spec: mockSpec
      });

      expect(result.type).toBe('mermaid-flowchart');
      expect(result.format).toBe('text');
      expect(typeof result.content).toBe('string');
      expect(result.content).toContain('flowchart');
    });

    it('should generate Mermaid class diagram', async () => {
      const result = await service.generate({
        type: 'mermaid-class',
        spec: mockSpec
      });

      expect(result.type).toBe('mermaid-class');
      expect(result.content).toContain('classDiagram');
    });

    it('should generate Graphviz digraph', async () => {
      const result = await service.generate({
        type: 'graphviz-digraph',
        spec: mockSpec
      });

      expect(result.type).toBe('graphviz-digraph');
      expect(result.content).toContain('digraph');
    });

    it('should generate D3 force graph data', async () => {
      const result = await service.generate({
        type: 'd3-force',
        spec: mockSpec
      });

      expect(result.type).toBe('d3-force');
      expect(result.format).toBe('json');
      expect(typeof result.content).toBe('object');
    });

    it('should throw error for unknown type', async () => {
      await expect(
        service.generate({
          type: 'invalid-type' as any,
          spec: mockSpec
        })
      ).rejects.toThrow();
    });

    it('should throw error when spec required but not provided', async () => {
      await expect(
        service.generate({
          type: 'mermaid-flowchart'
        })
      ).rejects.toThrow('Specification required');
    });
  });

  describe('generateBatch', () => {
    it('should generate multiple visualizations', async () => {
      const mockSpec: OpenAPIObject = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {}
      };

      const requests = [
        { type: 'mermaid-flowchart' as const, spec: mockSpec },
        { type: 'mermaid-state' as const },
        { type: 'd3-force' as const, spec: mockSpec }
      ];

      const results = await service.generateBatch(requests);

      expect(results).toHaveLength(3);
      expect(results[0].type).toBe('mermaid-flowchart');
      expect(results[1].type).toBe('mermaid-state');
      expect(results[2].type).toBe('d3-force');
    });
  });

  describe('generateSuite', () => {
    it('should generate complete visualization suite', async () => {
      const mockYaml = `
openapi: 3.1.0
info:
  title: Test
  version: 1.0.0
paths: {}
components:
  schemas:
    Agent:
      type: object
      properties:
        type:
          type: string
      `;

      (fs.readFile as jest.Mock).mockResolvedValue(mockYaml);

      const suite = await service.generateSuite('test-spec.yml');

      expect(suite.size).toBeGreaterThan(0);
      expect(suite.has('mermaid-flowchart')).toBe(true);
      expect(suite.has('d3-force')).toBe(true);
    });
  });

  describe('exportToFile', () => {
    it('should export text visualization to file', async () => {
      const result = {
        type: 'mermaid-flowchart' as const,
        format: 'text',
        content: 'flowchart TB\n  A --> B',
        metadata: { generatedAt: new Date().toISOString() }
      };

      await service.exportToFile(result, '/test/output.txt');

      expect(fs.writeFile).toHaveBeenCalledWith('/test/output.txt', 'flowchart TB\n  A --> B', 'utf-8');
    });

    it('should export JSON visualization to file', async () => {
      const result = {
        type: 'd3-force' as const,
        format: 'json',
        content: { nodes: [], links: [] },
        metadata: { generatedAt: new Date().toISOString() }
      };

      await service.exportToFile(result, '/test/output.json');

      expect(fs.writeFile).toHaveBeenCalledWith(
        '/test/output.json',
        JSON.stringify({ nodes: [], links: [] }, null, 2),
        'utf-8'
      );
    });
  });
});
