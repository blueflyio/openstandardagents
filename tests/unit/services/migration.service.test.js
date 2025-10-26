/**
 * MigrationService Unit Tests
 * Test v0.1.9 to v1.0 migration
 */
import { MigrationService } from '../../../src/services/migration.service';
describe('MigrationService', () => {
    let service;
    beforeEach(() => {
        service = new MigrationService();
    });
    describe('migrate()', () => {
        it('should migrate basic v0.1.9 manifest to v1.0', async () => {
            const legacy = {
                apiVersion: 'ossa/v0.1.9',
                kind: 'Agent',
                metadata: {
                    name: 'test-agent',
                    version: '1.0.0',
                    description: 'Test agent',
                },
                spec: {
                    role: 'chat',
                    llm: {
                        provider: 'openai',
                        model: 'gpt-4',
                    },
                },
            };
            const migrated = await service.migrate(legacy);
            expect(migrated.ossaVersion).toBe('1.0');
            expect(migrated.agent.id).toBe('test-agent');
            expect(migrated.agent.name).toBe('test-agent');
            expect(migrated.agent.version).toBe('1.0.0');
            expect(migrated.agent.role).toBe('chat');
            expect(migrated.agent.description).toBe('Test agent');
            expect(migrated.agent.runtime).toBeDefined();
            expect(migrated.agent.capabilities).toBeDefined();
            expect(migrated.agent.capabilities.length).toBeGreaterThan(0);
        });
        it('should throw error for invalid manifest', async () => {
            const invalid = {
                ossaVersion: '1.0',
                // Missing apiVersion and kind
            };
            await expect(service.migrate(invalid)).rejects.toThrow('Not a valid v0.1.9 manifest');
        });
        it('should throw error for unsupported kind', async () => {
            const invalid = {
                apiVersion: 'ossa/v0.1.9',
                kind: 'Workflow',
                metadata: { name: 'test' },
                spec: { role: 'chat' },
            };
            await expect(service.migrate(invalid)).rejects.toThrow('Unsupported kind');
        });
        it('should normalize agent ID to DNS-1123 format', async () => {
            const legacy = {
                apiVersion: 'ossa/v0.1.9',
                kind: 'Agent',
                metadata: {
                    name: 'Test Agent With SPACES',
                    version: '1.0.0',
                },
                spec: {
                    role: 'chat',
                },
            };
            const migrated = await service.migrate(legacy);
            expect(migrated.agent.id).toBe('test-agent-with-spaces');
            expect(migrated.agent.id).toMatch(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/);
        });
        it('should migrate extensions', async () => {
            const legacy = {
                apiVersion: 'ossa/v0.1.9',
                kind: 'Agent',
                metadata: {
                    name: 'test',
                },
                spec: {
                    role: 'chat',
                },
                extensions: {
                    kagent: {
                        kubernetes: {
                            namespace: 'production',
                        },
                    },
                },
            };
            const migrated = await service.migrate(legacy);
            expect(migrated.extensions).toBeDefined();
            expect(migrated.extensions?.kagent).toBeDefined();
        });
        it('should migrate LLM configuration', async () => {
            const legacy = {
                apiVersion: 'ossa/v0.1.9',
                kind: 'Agent',
                metadata: {
                    name: 'test',
                },
                spec: {
                    role: 'chat',
                    llm: {
                        provider: 'anthropic',
                        model: 'claude-3',
                        temperature: 0.5,
                    },
                },
            };
            const migrated = await service.migrate(legacy);
            expect(migrated.agent.llm).toBeDefined();
            expect(migrated.agent.llm?.provider).toBe('anthropic');
            expect(migrated.agent.llm?.model).toBe('claude-3');
        });
        it('should map legacy roles to v1.0 roles', async () => {
            const roleTests = [
                { legacy: 'worker', expected: 'custom' },
                { legacy: 'orchestrator', expected: 'orchestration' },
                { legacy: 'monitor', expected: 'monitoring' },
                { legacy: 'critic', expected: 'audit' },
            ];
            for (const test of roleTests) {
                const legacy = {
                    apiVersion: 'ossa/v0.1.9',
                    kind: 'Agent',
                    metadata: { name: 'test' },
                    spec: { role: test.legacy },
                };
                const migrated = await service.migrate(legacy);
                expect(migrated.agent.role).toBe(test.expected);
            }
        });
        it('should infer k8s runtime from kagent extension', async () => {
            const legacy = {
                apiVersion: 'ossa/v0.1.9',
                kind: 'Agent',
                metadata: { name: 'test' },
                spec: { role: 'monitoring' },
                extensions: {
                    kagent: {
                        kubernetes: {
                            namespace: 'production',
                        },
                    },
                },
            };
            const migrated = await service.migrate(legacy);
            expect(migrated.agent.runtime.type).toBe('k8s');
        });
        it('should default to docker runtime if no extension', async () => {
            const legacy = {
                apiVersion: 'ossa/v0.1.9',
                kind: 'Agent',
                metadata: { name: 'test', version: '2.0.0' },
                spec: { role: 'chat' },
            };
            const migrated = await service.migrate(legacy);
            expect(migrated.agent.runtime.type).toBe('docker');
            expect(migrated.agent.runtime.image).toBe('test:2.0.0');
        });
    });
    describe('needsMigration()', () => {
        it('should return true for v0.1.9 manifest', () => {
            const legacy = {
                apiVersion: 'ossa/v0.1.9',
                kind: 'Agent',
                metadata: { name: 'test' },
                spec: { role: 'chat' },
            };
            expect(service.needsMigration(legacy)).toBe(true);
        });
        it('should return false for v1.0 manifest', () => {
            const v1 = {
                ossaVersion: '1.0',
                agent: {
                    id: 'test',
                    name: 'Test',
                    version: '1.0.0',
                    role: 'chat',
                    runtime: { type: 'docker' },
                    capabilities: [],
                },
            };
            expect(service.needsMigration(v1)).toBe(false);
        });
        it('should return false for invalid manifest', () => {
            const invalid = { random: 'data' };
            expect(service.needsMigration(invalid)).toBe(false);
        });
    });
    describe('migrateMany()', () => {
        it('should migrate multiple manifests', async () => {
            const legacyManifests = [
                {
                    apiVersion: 'ossa/v0.1.9',
                    kind: 'Agent',
                    metadata: { name: 'agent-1' },
                    spec: { role: 'chat' },
                },
                {
                    apiVersion: 'ossa/v0.1.9',
                    kind: 'Agent',
                    metadata: { name: 'agent-2' },
                    spec: { role: 'workflow' },
                },
            ];
            const migrated = await service.migrateMany(legacyManifests);
            expect(migrated).toHaveLength(2);
            expect(migrated[0].ossaVersion).toBe('1.0');
            expect(migrated[1].ossaVersion).toBe('1.0');
            expect(migrated[0].agent.id).toBe('agent-1');
            expect(migrated[1].agent.id).toBe('agent-2');
        });
    });
});
//# sourceMappingURL=migration.service.test.js.map