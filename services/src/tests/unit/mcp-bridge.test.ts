/**
 * MCP Bridge Unit Tests
 * Tests for OSSA to MCP conversion and registry functionality
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mcpResourcesToOSSA, mcpToolToCapability } from '../../src/bridges/mcp/adapters/from-mcp';
import { buildServerConfig, capabilityToMCPTool, resourcesToMCPResources } from '../../src/bridges/mcp/adapters/to-mcp';
import { MCPRegistryService, MemoryMCPRegistryBackend } from '../../src/registry/index';
import { OSSACapability, OSSAResourceRef } from '../../src/types/ossa-capability';

describe('MCP Bridge', () => {
    let registry: MCPRegistryService;

    beforeEach(async () => {
        const backend = new MemoryMCPRegistryBackend();
        registry = new MCPRegistryService(backend);
        await registry.initialize();
    });

    afterEach(async () => {
        await registry.close();
    });

    describe('OSSA to MCP Conversion', () => {
        it('should convert OSSA capability to MCP tool', () => {
            const ossaCapability: OSSACapability = {
                name: 'Test Capability',
                description: 'A test capability',
                inputSchema: {
                    type: 'object',
                    properties: {
                        input: { type: 'string' }
                    }
                },
                outputSchema: {
                    type: 'object',
                    properties: {
                        result: { type: 'string' }
                    }
                }
            };

            const mcpTool = capabilityToMCPTool(ossaCapability);

            expect(mcpTool.name).toBe('test-capability');
            expect(mcpTool.description).toBe('A test capability');
            expect(mcpTool.inputSchema).toEqual(ossaCapability.inputSchema);
            expect(mcpTool.outputSchema).toEqual(ossaCapability.outputSchema);
        });

        it('should normalize capability names to kebab-case', () => {
            const ossaCapability: OSSACapability = {
                name: 'Test Capability With Spaces',
                description: 'A test capability',
                inputSchema: { type: 'object' }
            };

            const mcpTool = capabilityToMCPTool(ossaCapability);

            expect(mcpTool.name).toBe('test-capability-with-spaces');
        });

        it('should convert OSSA resources to MCP resources', () => {
            const ossaResources: OSSAResourceRef[] = [
                {
                    id: 'test-dataset',
                    uri: 'file:///path/to/dataset.json',
                    schema: { type: 'object' }
                },
                {
                    id: 'test-document',
                    uri: 'http://example.com/document.pdf'
                }
            ];

            const mcpResources = resourcesToMCPResources(ossaResources);

            expect(mcpResources).toHaveLength(2);
            expect(mcpResources[0].uri).toBe('file:///path/to/dataset.json');
            expect(mcpResources[0].name).toBe('test-dataset');
            expect(mcpResources[1].uri).toBe('http://example.com/document.pdf');
            expect(mcpResources[1].name).toBe('test-document');
        });

        it('should generate stable server configuration', () => {
            const tools = [
                { name: 'tool1', description: 'Tool 1', inputSchema: { type: 'object' } },
                { name: 'tool2', description: 'Tool 2', inputSchema: { type: 'object' } }
            ];

            const resources = [
                { uri: 'file:///test1.json', name: 'test1', description: 'Test 1' },
                { uri: 'file:///test2.json', name: 'test2', description: 'Test 2' }
            ];

            const transport = {
                type: 'stdio' as const,
                cmd: 'test-server',
                args: ['--port', '8080']
            };

            const config1 = buildServerConfig('agent1', tools, resources, transport);
            const config2 = buildServerConfig('agent1', tools, resources, transport);

            // Same inputs should produce same ID
            expect(config1.id).toBe(config2.id);
            expect(config1.name).toBe('ossa-agent1');
            expect(config1.tools).toEqual(tools);
            expect(config1.resources).toEqual(resources);
            expect(config1.transport).toEqual(transport);
        });
    });

    describe('MCP to OSSA Conversion', () => {
        it('should convert MCP tool back to OSSA capability', () => {
            const mcpTool = {
                name: 'ossa.test-agent.test-capability',
                description: 'A test capability',
                inputSchema: { type: 'object' },
                outputSchema: { type: 'object' }
            };

            const ossaCapability = mcpToolToCapability(mcpTool);

            expect(ossaCapability.name).toBe('Test Capability');
            expect(ossaCapability.description).toBe('A test capability');
            expect(ossaCapability.inputSchema).toEqual(mcpTool.inputSchema);
            expect(ossaCapability.outputSchema).toEqual(mcpTool.outputSchema);
            expect(ossaCapability.metadata?.originalMcpName).toBe('ossa.test-agent.test-capability');
        });

        it('should convert MCP resources back to OSSA resources', () => {
            const mcpResources = [
                {
                    uri: 'file:///path/to/document.pdf',
                    name: 'test-document',
                    description: 'A test document',
                    schema: { type: 'object' }
                }
            ];

            const ossaResources = mcpResourcesToOSSA(mcpResources);

            expect(ossaResources).toHaveLength(1);
            expect(ossaResources[0].id).toBe('test-document');
            expect(ossaResources[0].uri).toBe('file:///path/to/document.pdf');
            expect(ossaResources[0].schema).toEqual({ type: 'object' });
            expect(ossaResources[0].metadata?.description).toBe('A test document');
        });
    });

    describe('MCP Registry', () => {
        it('should register and discover MCP servers', async () => {
            const record = {
                id: 'test-server',
                name: 'Test MCP Server',
                tags: ['test', 'ossa'],
                endpoints: {
                    type: 'stdio' as const,
                    cmd: 'test-server',
                    args: ['--port', '8080']
                },
                tools: [
                    { name: 'test-tool', description: 'Test tool', inputSchema: { type: 'object' } }
                ],
                resources: [
                    { uri: 'file:///test.json', name: 'test-resource', description: 'Test resource' }
                ]
            };

            await registry.register(record);

            const discovered = await registry.discover({ tag: 'test' });
            expect(discovered).toHaveLength(1);
            expect(discovered[0].id).toBe('test-server');

            const byId = await registry.get('test-server');
            expect(byId).toEqual(expect.objectContaining({
                id: 'test-server',
                name: 'Test MCP Server',
                tags: ['test', 'ossa']
            }));
        });
    });

    describe('Round-trip Compatibility', () => {
        it('should maintain compatibility through OSSA -> MCP -> OSSA conversion', () => {
            const originalCapability: OSSACapability = {
                name: 'Test Capability',
                description: 'A test capability',
                inputSchema: { type: 'object' },
                outputSchema: { type: 'object' }
            };

            const mcpTool = capabilityToMCPTool(originalCapability);
            const convertedCapability = mcpToolToCapability(mcpTool);

            // Core fields should be preserved
            expect(convertedCapability.name).toBe('Test Capability'); // Name gets converted back from kebab-case
            expect(convertedCapability.description).toBe(originalCapability.description);
            expect(convertedCapability.inputSchema).toEqual(originalCapability.inputSchema);
            expect(convertedCapability.outputSchema).toEqual(originalCapability.outputSchema);
        });
    });
});