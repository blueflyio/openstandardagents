/**
 * RuntimeBridge E2E Tests
 * Tests the complete RuntimeBridge MCP integration
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { RuntimeBridge } from '../../bridges/RuntimeBridge';

describe('RuntimeBridge MCP Integration', () => {
    let bridge: RuntimeBridge;

    beforeEach(async () => {
        bridge = new RuntimeBridge({
            projectRoot: '/test/project',
            enabledFrameworks: ['mcp', 'drupal'],
            executionTimeout: 30000,
            debugMode: true
        });

        // Initialize MCP registry for testing
        const { mcpRegistry } = await import('../../registry/index');
        await mcpRegistry.initialize();
    });

    afterEach(() => {
        // Cleanup if needed
    });

    describe('MCP Translation', () => {
        it('should translate agent to MCP format', async () => {
            const mockAgent = {
                id: 'test-agent',
                name: 'Test Agent',
                format: 'mcp',
                version: '1.0.0',
                capabilities: [
                    {
                        name: 'test-capability',
                        description: 'A test capability',
                        input_schema: {
                            type: 'object',
                            properties: {
                                input: { type: 'string' }
                            }
                        },
                        output_schema: {
                            type: 'object',
                            properties: {
                                result: { type: 'string' }
                            }
                        }
                    }
                ],
                resources: [
                    {
                        name: 'test-resource',
                        uri: 'file:///test/resource.json',
                        schema: { type: 'object' }
                    }
                ]
            };

            const result = await bridge.translateForFramework(mockAgent, 'mcp');

            expect(result).toBeDefined();
            expect(result.name).toBe('Test Agent');
            expect(result.tools).toBeDefined();
            expect(result.tools.length).toBe(1);
            expect(result.tools[0].name).toBe('test-capability');
        });
    });

    describe('MCP Execution', () => {
        it('should execute MCP capability with fallback', async () => {
            const mockAgent = {
                id: 'test-agent',
                name: 'Test Agent',
                format: 'mcp',
                capabilities: [
                    {
                        name: 'test-capability',
                        description: 'A test capability',
                        input_schema: {
                            type: 'object',
                            properties: {
                                input: { type: 'string' }
                            }
                        }
                    }
                ]
            };

            const mockCapability = {
                name: 'test-capability',
                description: 'A test capability',
                input_schema: {
                    type: 'object',
                    properties: {
                        input: { type: 'string' }
                    }
                }
            };

            const result = await bridge.executeCapability(
                mockAgent,
                mockCapability,
                { input: 'test input' }
            );

            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.framework_used).toBe('mcp');
            expect(result.result.agent_format).toBe('mcp');
            expect(result.result.message).toContain('MCP tool');
        }, 10000); // Increase timeout for MCP execution
    });

    describe('Bridge Statistics', () => {
        it('should provide execution statistics', () => {
            const stats = bridge.getExecutionStats();

            expect(stats).toBeDefined();
            expect(stats.available_frameworks).toContain('mcp');
            expect(stats.execution_timeout).toBe(30000);
            expect(stats.debug_mode).toBe(true);
        });
    });
});
