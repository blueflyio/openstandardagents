/**
 * GenerationService Unit Tests
 * Test agent generation from templates
 */
import { GenerationService } from '../../../src/services/generation.service';
describe('GenerationService', () => {
    let service;
    beforeEach(() => {
        service = new GenerationService();
    });
    describe('generate()', () => {
        it('should generate a chat agent from template', async () => {
            const template = {
                id: 'my-chat-bot',
                name: 'My Chat Bot',
                role: 'chat',
                description: 'A helpful chat assistant',
            };
            const manifest = await service.generate(template);
            expect(manifest.ossaVersion).toBe('1.0');
            expect(manifest.agent.id).toBe('my-chat-bot');
            expect(manifest.agent.name).toBe('My Chat Bot');
            expect(manifest.agent.role).toBe('chat');
            expect(manifest.agent.description).toBe('A helpful chat assistant');
            expect(manifest.agent.runtime.type).toBe('docker');
            expect(manifest.agent.llm).toBeDefined();
            expect(manifest.agent.llm?.provider).toBe('openai');
            expect(manifest.agent.capabilities.length).toBeGreaterThan(0);
        });
        it('should normalize agent ID to DNS-1123 format', async () => {
            const template = {
                id: 'My Agent With SPACES_and-Symbols!',
                name: 'Test Agent',
                role: 'chat',
            };
            const manifest = await service.generate(template);
            expect(manifest.agent.id).toBe('my-agent-with-spaces-and-symbols');
            expect(manifest.agent.id).toMatch(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/);
        });
        it('should generate workflow agent with appropriate capabilities', async () => {
            const template = {
                id: 'workflow-executor',
                name: 'Workflow Executor',
                role: 'workflow',
            };
            const manifest = await service.generate(template);
            expect(manifest.agent.role).toBe('workflow');
            expect(manifest.agent.capabilities).toHaveLength(1);
            expect(manifest.agent.capabilities[0].name).toBe('execute_workflow');
            expect(manifest.agent.llm?.temperature).toBe(0.3);
        });
        it('should generate compliance agent with appropriate config', async () => {
            const template = {
                id: 'compliance-validator',
                name: 'Compliance Validator',
                role: 'compliance',
            };
            const manifest = await service.generate(template);
            expect(manifest.agent.role).toBe('compliance');
            expect(manifest.agent.capabilities[0].name).toBe('validate_compliance');
            expect(manifest.agent.llm?.temperature).toBe(0.2);
            expect(manifest.agent.llm?.maxTokens).toBe(4000);
        });
        it('should use custom runtime type if provided', async () => {
            const template = {
                id: 'k8s-agent',
                name: 'K8s Agent',
                role: 'monitoring',
                runtimeType: 'k8s',
            };
            const manifest = await service.generate(template);
            expect(manifest.agent.runtime.type).toBe('k8s');
        });
        it('should use custom capabilities if provided', async () => {
            const customCapability = {
                name: 'custom_capability',
                description: 'Custom operation',
                input_schema: {
                    type: 'object',
                    properties: { data: { type: 'string' } },
                },
                output_schema: {
                    type: 'object',
                    properties: { result: { type: 'string' } },
                },
            };
            const template = {
                id: 'custom-agent',
                name: 'Custom Agent',
                role: 'custom',
                capabilities: [customCapability],
            };
            const manifest = await service.generate(template);
            expect(manifest.agent.capabilities).toHaveLength(1);
            expect(manifest.agent.capabilities[0].name).toBe('custom_capability');
        });
        it('should generate default description if not provided', async () => {
            const template = {
                id: 'test-agent',
                name: 'Test Agent',
                role: 'chat',
                // No description provided
            };
            const manifest = await service.generate(template);
            expect(manifest.agent.description).toBe('Test Agent agent');
        });
        it('should truncate long IDs to 63 characters', async () => {
            const longId = 'a'.repeat(100);
            const template = {
                id: longId,
                name: 'Test',
                role: 'chat',
            };
            const manifest = await service.generate(template);
            expect(manifest.agent.id.length).toBeLessThanOrEqual(63);
        });
    });
    describe('generateMany()', () => {
        it('should generate multiple agents', async () => {
            const templates = [
                {
                    id: 'agent-1',
                    name: 'Agent 1',
                    role: 'chat',
                },
                {
                    id: 'agent-2',
                    name: 'Agent 2',
                    role: 'workflow',
                },
                {
                    id: 'agent-3',
                    name: 'Agent 3',
                    role: 'compliance',
                },
            ];
            const manifests = await service.generateMany(templates);
            expect(manifests).toHaveLength(3);
            expect(manifests[0].agent.id).toBe('agent-1');
            expect(manifests[1].agent.id).toBe('agent-2');
            expect(manifests[2].agent.id).toBe('agent-3');
        });
    });
});
//# sourceMappingURL=generation.service.test.js.map