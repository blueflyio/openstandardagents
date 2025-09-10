/**
 * In-Memory MCP Registry Backend
 * Simple in-memory storage for testing and development
 */

import { MCPRegistryBackend, MCPRegistryQuery, MCPRegistryRecord } from '../types';

export class MemoryMCPRegistryBackend implements MCPRegistryBackend {
    private records: Map<string, MCPRegistryRecord> = new Map();
    private initialized = false;

    async initialize(): Promise<void> {
        this.initialized = true;
    }

    async list(): Promise<MCPRegistryRecord[]> {
        this.ensureInitialized();
        return Array.from(this.records.values());
    }

    async get(id: string): Promise<MCPRegistryRecord | null> {
        this.ensureInitialized();
        return this.records.get(id) || null;
    }

    async set(record: MCPRegistryRecord): Promise<void> {
        this.ensureInitialized();
        this.records.set(record.id, {
            ...record,
            lastSeen: new Date().toISOString()
        });
    }

    async delete(id: string): Promise<boolean> {
        this.ensureInitialized();
        return this.records.delete(id);
    }

    async query(query: MCPRegistryQuery): Promise<MCPRegistryRecord[]> {
        this.ensureInitialized();
        const records = Array.from(this.records.values());

        return records.filter(record => {
            // Filter by tag
            if (query.tag && (!record.tags || !record.tags.includes(query.tag))) {
                return false;
            }

            // Filter by tool
            if (query.tool && (!record.tools || !record.tools.some(t => t.name === query.tool))) {
                return false;
            }

            // Filter by resource
            if (query.resource && (!record.resources || !record.resources.some(r => r.uri === query.resource))) {
                return false;
            }

            return true;
        });
    }

    async close(): Promise<void> {
        this.records.clear();
        this.initialized = false;
    }

    /**
     * Clear all records (useful for testing)
     */
    async clear(): Promise<void> {
        this.records.clear();
    }

    /**
     * Get registry statistics
     */
    getStats(): { recordCount: number; tags: string[]; toolCount: number } {
        const records = Array.from(this.records.values());
        const tags = new Set<string>();
        let toolCount = 0;

        records.forEach(record => {
            if (record.tags) {
                record.tags.forEach(tag => tags.add(tag));
            }
            if (record.tools) {
                toolCount += record.tools.length;
            }
        });

        return {
            recordCount: records.length,
            tags: Array.from(tags),
            toolCount
        };
    }

    private ensureInitialized(): void {
        if (!this.initialized) {
            throw new Error('Registry backend not initialized. Call initialize() first.');
        }
    }
}
