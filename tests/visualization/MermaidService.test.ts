import { MermaidService } from '../../src/services/visualization/MermaidService.js';
import type { OpenAPIObject } from 'openapi-types';

describe('MermaidService', () => {
  let service: MermaidService;

  beforeEach(() => {
    service = new MermaidService();
  });

  describe('generateFlowchart', () => {
    it('should generate a basic flowchart', async () => {
      const spec: OpenAPIObject = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/agents/worker-1': {
            get: { summary: 'Get worker' }
          },
          '/agents/orchestrator-1': {
            get: { summary: 'Get orchestrator' }
          }
        }
      };

      const result = await service.generateFlowchart(spec);

      expect(result).toContain('flowchart TB');
      expect(result).toContain('worker');
    });

    it('should support custom orientation', async () => {
      const spec: OpenAPIObject = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {}
      };

      const result = await service.generateFlowchart(spec, { orientation: 'LR' });

      expect(result).toContain('flowchart LR');
    });
  });

  describe('generateClassDiagram', () => {
    it('should generate class diagram from schemas', async () => {
      const spec: OpenAPIObject = {
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

      const result = await service.generateClassDiagram(spec);

      expect(result).toContain('classDiagram');
      expect(result).toContain('WorkerAgent');
    });
  });

  describe('generateSequenceDiagram', () => {
    it('should generate sequence diagram from workflow', async () => {
      const spec: OpenAPIObject = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {}
      };

      const workflow = ['Client', 'Orchestrator', 'Worker'];
      const result = await service.generateSequenceDiagram(spec, workflow);

      expect(result).toContain('sequenceDiagram');
      expect(result).toContain('autonumber');
      expect(result).toContain('Client');
      expect(result).toContain('Orchestrator');
      expect(result).toContain('Worker');
    });
  });

  describe('generateStateDiagram', () => {
    it('should generate agent lifecycle state diagram', async () => {
      const result = await service.generateStateDiagram();

      expect(result).toContain('stateDiagram-v2');
      expect(result).toContain('Registered');
      expect(result).toContain('Executing');
      expect(result).toContain('Monitoring');
    });
  });

  describe('generateERD', () => {
    it('should generate entity relationship diagram', async () => {
      const spec: OpenAPIObject = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
        components: {
          schemas: {
            Agent: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' }
              },
              required: ['id']
            }
          }
        }
      };

      const result = await service.generateERD(spec);

      expect(result).toContain('erDiagram');
      expect(result).toContain('Agent');
      expect(result).toContain('id');
      expect(result).toContain('PK');
    });
  });

  describe('generateArchitectureDiagram', () => {
    it('should generate architecture diagram with agents and relationships', async () => {
      const agents = [
        { id: 'worker_1', name: 'worker-1', type: 'worker' },
        { id: 'orchestrator_1', name: 'orchestrator-1', type: 'orchestrator' }
      ];

      const relationships = [{ from: 'orchestrator_1', to: 'worker_1', type: 'invokes' as const }];

      const result = await service.generateArchitectureDiagram(agents, relationships);

      expect(result).toContain('graph TB');
      expect(result).toContain('OSSA Agent Ecosystem');
      expect(result).toContain('worker_1');
      expect(result).toContain('orchestrator_1');
    });
  });
});
