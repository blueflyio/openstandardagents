/**
 * GenerationService Unit Tests
 * Test agent generation from templates
 */

import { GenerationService } from '../../../src/services/generation.service';
import type { AgentTemplate } from '../../../src/types';

describe('GenerationService', () => {
  let service: GenerationService;

  beforeEach(() => {
    service = new GenerationService();
  });

  describe('generate()', () => {
    it('should generate a chat agent from template', async () => {
      const template: AgentTemplate = {
        id: 'my-chat-bot',
        name: 'My Chat Bot',
        role: 'chat',
        description: 'A helpful chat assistant',
      };

      const manifest = await service.generate(template);

      expect(manifest.apiVersion).toBe('ossa/v1');
      expect(manifest.kind).toBe('Agent');
      expect(manifest.metadata.name).toBe('my-chat-bot');
      expect(manifest.spec.role).toBe('chat');
      expect(manifest.metadata.description).toBe('A helpful chat assistant');
      expect(manifest.spec.llm).toBeDefined();
      expect(manifest.spec.llm?.provider).toBe('openai');
      expect(manifest.spec.tools.length).toBeGreaterThan(0);
    });

    it('should normalize agent ID to DNS-1123 format', async () => {
      const template: AgentTemplate = {
        id: 'My Agent With SPACES_and-Symbols!',
        name: 'Test Agent',
        role: 'chat',
      };

      const manifest = await service.generate(template);

      expect(manifest.metadata.name).toBe('my-agent-with-spaces-and-symbols');
      expect(manifest.metadata.name).toMatch(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/);
    });

    it('should generate workflow agent with appropriate capabilities', async () => {
      const template: AgentTemplate = {
        id: 'workflow-executor',
        name: 'Workflow Executor',
        role: 'workflow',
      };

      const manifest = await service.generate(template);

      expect(manifest.spec.role).toBe('workflow');
      expect(manifest.spec.tools).toHaveLength(1);
      expect(manifest.spec.tools[0].name).toBe('execute_workflow');
      expect(manifest.spec.llm?.temperature).toBe(0.3);
    });

    it('should generate compliance agent with appropriate config', async () => {
      const template: AgentTemplate = {
        id: 'compliance-validator',
        name: 'Compliance Validator',
        role: 'compliance',
      };

      const manifest = await service.generate(template);

      expect(manifest.spec.role).toBe('compliance');
      expect(manifest.spec.tools[0].name).toBe('validate_compliance');
      expect(manifest.spec.llm?.temperature).toBe(0.2);
      expect(manifest.spec.llm?.maxTokens).toBe(4000);
    });

    it('should use custom runtime type if provided', async () => {
      const template: AgentTemplate = {
        id: 'k8s-agent',
        name: 'K8s Agent',
        role: 'monitoring',
        runtimeType: 'k8s',
      };

      const manifest = await service.generate(template);

      expect(manifest.spec.llm).toBeDefined();
    });

    it('should use custom capabilities if provided', async () => {
      const customCapability = {
        type: 'mcp',
        name: 'custom_capability',
        server: 'test',
        capabilities: [],
      };

      const template: AgentTemplate = {
        id: 'custom-agent',
        name: 'Custom Agent',
        role: 'chat',
        capabilities: [customCapability],
      };

      const manifest = await service.generate(template);

      expect(manifest.spec.tools).toHaveLength(1);
      expect(manifest.spec.tools[0].name).toBe('custom_capability');
    });

    it('should generate default description if not provided', async () => {
      const template: AgentTemplate = {
        id: 'test-agent',
        name: 'Test Agent',
        role: 'chat',
      };

      const manifest = await service.generate(template);

      expect(manifest.metadata.description).toBe('Test Agent agent');
    });

    it('should truncate long IDs to 63 characters', async () => {
      const longId = 'a'.repeat(100);
      const template: AgentTemplate = {
        id: longId,
        name: 'Test Agent',
        role: 'chat',
      };

      const manifest = await service.generate(template);

      expect(manifest.metadata.name.length).toBeLessThanOrEqual(63);
    });
  });

  describe('generateMany()', () => {
    it('should generate multiple agents', async () => {
      const templates: AgentTemplate[] = [
        { id: 'agent-1', name: 'Agent 1', role: 'chat' },
        { id: 'agent-2', name: 'Agent 2', role: 'workflow' },
        { id: 'agent-3', name: 'Agent 3', role: 'compliance' },
      ];

      const manifests = await service.generateMany(templates);

      expect(manifests).toHaveLength(3);
      expect(manifests[0].metadata.name).toBe('agent-1');
      expect(manifests[1].metadata.name).toBe('agent-2');
      expect(manifests[2].metadata.name).toBe('agent-3');
    });
  });
});
