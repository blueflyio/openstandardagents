/**
 * MCP Client Wrapper
 * Thin client for MCP server communication (stdio transport)
 */

import { ChildProcess, spawn } from 'child_process';
import { MCPCallOptions, MCPCallResult, MCPServerConfig } from '../../../types/mcp';

export class MCPClient {
    private process: ChildProcess | null = null;
    private connected = false;
    private messageId = 0;

    /**
     * Connect to MCP server
     */
    async connect(config: MCPServerConfig): Promise<void> {
        if (this.connected) {
            throw new Error('Already connected to MCP server');
        }

        if (config.transport.type !== 'stdio') {
            throw new Error(`Transport type ${config.transport.type} not yet supported`);
        }

        if (!config.transport.cmd) {
            throw new Error('Command is required for stdio transport');
        }

        // Spawn MCP server process
        this.process = spawn(config.transport.cmd, config.transport.args || [], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        // Handle process events
        this.process.on('error', (error) => {
            throw new Error(`Failed to start MCP server: ${error.message}`);
        });

        this.process.on('exit', (code) => {
            this.connected = false;
            if (code !== 0) {
                console.warn(`MCP server exited with code ${code}`);
            }
        });

        // Wait for connection to be established
        await this.waitForConnection();
        this.connected = true;
    }

    /**
     * Call MCP tool
     */
    async callTool(
        name: string,
        input: unknown,
        options: MCPCallOptions = {}
    ): Promise<MCPCallResult> {
        this.ensureConnected();

        const startTime = Date.now();
        const messageId = this.getMessageId();

        try {
            // Send tool call request
            const request = {
                jsonrpc: '2.0',
                id: messageId,
                method: 'tools/call',
                params: {
                    name,
                    arguments: input
                }
            };

            await this.sendMessage(request);

            // Wait for response
            const response = await this.receiveMessage();
            const executionTime = Date.now() - startTime;

            if (response.error) {
                return {
                    success: false,
                    error: response.error.message || 'Unknown error',
                    executionTime,
                    metadata: { messageId }
                };
            }

            return {
                success: true,
                result: response.result,
                executionTime,
                metadata: { messageId }
            };

        } catch (error: any) {
            const executionTime = Date.now() - startTime;
            return {
                success: false,
                error: error.message || 'Unknown error',
                executionTime,
                metadata: { messageId }
            };
        }
    }

    /**
     * List available tools
     */
    async listTools(): Promise<Array<{ name: string; description?: string }>> {
        this.ensureConnected();

        const messageId = this.getMessageId();
        const request = {
            jsonrpc: '2.0',
            id: messageId,
            method: 'tools/list',
            params: {}
        };

        await this.sendMessage(request);
        const response = await this.receiveMessage();

        if (response.error) {
            throw new Error(`Failed to list tools: ${response.error.message}`);
        }

        return response.result?.tools || [];
    }

    /**
     * List available resources
     */
    async listResources(): Promise<Array<{ uri: string; name?: string }>> {
        this.ensureConnected();

        const messageId = this.getMessageId();
        const request = {
            jsonrpc: '2.0',
            id: messageId,
            method: 'resources/list',
            params: {}
        };

        await this.sendMessage(request);
        const response = await this.receiveMessage();

        if (response.error) {
            throw new Error(`Failed to list resources: ${response.error.message}`);
        }

        return response.result?.resources || [];
    }

    /**
     * Sync inventory (idempotent registration)
     */
    async syncInventory(inventory: { tools: any[]; resources: any[] }): Promise<void> {
        this.ensureConnected();

        // For now, just log the sync attempt
        // In a full implementation, this would compare and register missing items
        console.log(`Syncing inventory: ${inventory.tools.length} tools, ${inventory.resources.length} resources`);
    }

    /**
     * Close connection
     */
    async close(): Promise<void> {
        if (this.process) {
            this.process.kill();
            this.process = null;
        }
        this.connected = false;
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.connected && this.process !== null;
    }

    private ensureConnected(): void {
        if (!this.connected || !this.process) {
            throw new Error('Not connected to MCP server');
        }
    }

    private getMessageId(): number {
        return ++this.messageId;
    }

    private async waitForConnection(): Promise<void> {
        // Simple connection check - wait for process to be ready
        return new Promise((resolve, reject) => {
            if (!this.process) {
                reject(new Error('Process not started'));
                return;
            }

            // Give the process a moment to start
            setTimeout(() => {
                if (this.process && this.process.pid) {
                    resolve();
                } else {
                    reject(new Error('Failed to start MCP server process'));
                }
            }, 100);
        });
    }

    private async sendMessage(message: any): Promise<void> {
        if (!this.process || !this.process.stdin) {
            throw new Error('Process stdin not available');
        }

        const messageStr = JSON.stringify(message) + '\n';
        this.process.stdin.write(messageStr);
    }

    private async receiveMessage(): Promise<any> {
        if (!this.process || !this.process.stdout) {
            throw new Error('Process stdout not available');
        }

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Timeout waiting for MCP response'));
            }, 30000); // 30 second timeout

            const onData = (data: Buffer) => {
                try {
                    const message = JSON.parse(data.toString().trim());
                    clearTimeout(timeout);
                    this.process?.stdout?.removeListener('data', onData);
                    resolve(message);
                } catch (error) {
                    // Continue waiting for valid JSON
                }
            };

            this.process?.stdout?.on('data', onData);
        });
    }
}