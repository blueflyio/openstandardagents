/**
 * MCP Registry Implementation
 * Service discovery registry for MCP servers
 */

import { MemoryMCPRegistryBackend } from './backends/memory';
import { MCPRegistry, MCPRegistryQuery, MCPRegistryRecord } from './types';

export class MCPRegistryService implements MCPRegistry {
    private backend: MemoryMCPRegistryBackend;
    private initialized = false;

    constructor() {
        this.backend = new MemoryMCPRegistryBackend();
    }

    async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }
        await this.backend.initialize();
        this.initialized = true;
    }

    async list(): Promise<MCPRegistryRecord[]> {
        this.ensureInitialized();
        return await this.backend.list();
    }

    async get(id: string): Promise<MCPRegistryRecord | null> {
        this.ensureInitialized();
        return await this.backend.get(id);
    }

    async register(record: MCPRegistryRecord): Promise<void> {
        this.ensureInitialized();
        
        // Set registration timestamp
        const registrationRecord = {
            ...record,
            lastSeen: new Date().toISOString()
        };

        await this.backend.set(registrationRecord);
    }

    async discover(query?: MCPRegistryQuery): Promise<MCPRegistryRecord[]> {
        this.ensureInitialized();

        if (!query || Object.keys(query).length === 0) {
            return await this.backend.list();
        }

        return await this.backend.query(query);
    }

    async remove(id: string): Promise<boolean> {
        this.ensureInitialized();
        return await this.backend.delete(id);
    }

    async update(record: MCPRegistryRecord): Promise<void> {
        this.ensureInitialized();
        
        // Update timestamp
        const updateRecord = {
            ...record,
            lastSeen: new Date().toISOString()
        };

        await this.backend.set(updateRecord);
    }

    /**
     * Discover servers by tag with fallback ordering
     */
    async discoverWithFallback(tag: string, fallbackTags: string[] = []): Promise<MCPRegistryRecord[]> {
        this.ensureInitialized();

        // Try primary tag first
        let candidates = await this.backend.query({ tag });

        // If no candidates found, try fallback tags
        if (candidates.length === 0 && fallbackTags.length > 0) {
            for (const fallbackTag of fallbackTags) {
                candidates = await this.backend.query({ tag: fallbackTag });
                if (candidates.length > 0) {
                    break;
                }
            }
        }

        return candidates;
    }

    /**
     * Get registry statistics
     */
    getStats(): { recordCount: number; tags: string[]; toolCount: number } {
        this.ensureInitialized();
        return this.backend.getStats();
    }

    /**
     * Clear all records (useful for testing)
     */
    async clear(): Promise<void> {
        this.ensureInitialized();
        await this.backend.clear();
    }

    async close(): Promise<void> {
        if (!this.initialized) {
            return;
        }

        await this.backend.close();
        this.initialized = false;
    }

    private ensureInitialized(): void {
        if (!this.initialized) {
            throw new Error('Registry not initialized. Call initialize() first.');
        }
    }
}

// Export singleton instance
export const mcpRegistry = new MCPRegistryService();

// Re-export types and backends for convenience
export * from './types';
export { MemoryMCPRegistryBackend } from './backends/memory';
