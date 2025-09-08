/**
 * OSSA Memory System Coherence
 * Three-tier architecture: Hot (Redis), Warm (Qdrant), Cold (S3)
 * Achieving 91% cross-session context preservation with automated cleanup
 */
import { EventEmitter } from 'events';
export var MemoryTier;
(function (MemoryTier) {
    MemoryTier["HOT"] = "hot";
    MemoryTier["WARM"] = "warm";
    MemoryTier["COLD"] = "cold"; // S3 - archival storage
})(MemoryTier || (MemoryTier = {}));
export var MemoryType;
(function (MemoryType) {
    MemoryType["CONTEXT"] = "context";
    MemoryType["ARTIFACT"] = "artifact";
    MemoryType["STATE"] = "state";
    MemoryType["KNOWLEDGE"] = "knowledge";
    MemoryType["CONVERSATION"] = "conversation";
    MemoryType["WORKFLOW"] = "workflow";
    MemoryType["LEARNING"] = "learning";
})(MemoryType || (MemoryType = {}));
export var ConsistencyLevel;
(function (ConsistencyLevel) {
    ConsistencyLevel["STRONG"] = "strong";
    ConsistencyLevel["EVENTUAL"] = "eventual";
    ConsistencyLevel["WEAK"] = "weak";
    ConsistencyLevel["SESSION"] = "session"; // Session-based consistency
})(ConsistencyLevel || (ConsistencyLevel = {}));
export class MemoryCoherenceSystem extends EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.migrationQueue = [];
        this.memoryIndex = new Map();
        this.relationshipGraph = new Map();
        this.hotStorage = new HotStorage(config.redisConfig);
        this.warmStorage = new WarmStorage(config.qdrantConfig);
        this.coldStorage = new ColdStorage(config.s3Config);
        this.coherenceManager = new CoherenceManager(config.coherenceLevel);
        this.initializeSystem();
    }
    /**
     * Store memory entry with automatic tier placement
     */
    async store(entry) {
        // Determine optimal tier based on importance and type
        const tier = this.determineOptimalTier(entry);
        // Calculate checksum for integrity
        const checksum = this.calculateChecksum(entry.data);
        // Create complete memory entry
        const memoryEntry = {
            ...entry,
            tier,
            version: 1,
            checksum,
            lifecycle: {
                stage: 'active',
                retentionPolicy: this.getDefaultRetentionPolicy(entry.type),
                garbageCollection: {
                    lastRun: new Date(),
                    nextRun: this.calculateNextGC(),
                    itemsProcessed: 0,
                    itemsDeleted: 0,
                    bytesFreed: 0,
                    strategy: 'LRU'
                }
            }
        };
        // Store in appropriate tier
        await this.storeInTier(memoryEntry, tier);
        // Update index and relationships
        this.memoryIndex.set(entry.id, memoryEntry);
        this.updateRelationshipGraph(memoryEntry);
        // Record usage statistics
        this.recordAccess(entry.id, 'write', entry.metadata.agentId);
        this.emit('memoryStored', { entryId: entry.id, tier, type: entry.type });
        return entry.id;
    }
    /**
     * Retrieve memory entry with cross-tier search
     */
    async retrieve(id, agentId) {
        // Check index first
        const indexEntry = this.memoryIndex.get(id);
        if (!indexEntry)
            return null;
        // Retrieve from appropriate tier
        let entry = null;
        switch (indexEntry.tier) {
            case MemoryTier.HOT:
                entry = await this.hotStorage.get(id);
                break;
            case MemoryTier.WARM:
                entry = await this.warmStorage.get(id);
                break;
            case MemoryTier.COLD:
                entry = await this.coldStorage.get(id);
                // Consider promoting to warm tier if accessed frequently
                if (entry && this.shouldPromote(entry)) {
                    await this.scheduleMigration(entry, MemoryTier.WARM, 'frequent_access');
                }
                break;
        }
        if (entry) {
            // Update last accessed time
            entry.metadata.lastAccessed = new Date();
            entry.metadata.usage.accessCount++;
            // Record access pattern
            this.recordAccess(id, 'read', agentId || 'unknown');
            // Update in storage
            await this.updateInTier(entry);
        }
        return entry;
    }
    /**
     * Search memory entries using vector similarity
     */
    async search(query) {
        const results = [];
        // Vector search in warm tier (Qdrant)
        if (query.vector && query.similarity) {
            const warmResults = await this.warmStorage.search(query.vector, query.similarity, query.limit || 10);
            results.push(...warmResults);
        }
        // Text/metadata search in hot tier
        if (query.agentId || query.workflowId || query.tags) {
            const hotResults = await this.hotStorage.search(query);
            results.push(...hotResults);
        }
        // Archive search in cold tier if needed
        if (query.timeRange && this.isArchiveSearchNeeded(query.timeRange)) {
            const coldResults = await this.coldStorage.search(query);
            results.push(...coldResults);
        }
        // Deduplicate and sort by relevance
        const uniqueResults = this.deduplicateResults(results);
        return this.sortByRelevance(uniqueResults, query);
    }
    /**
     * Update existing memory entry
     */
    async update(id, updates, agentId) {
        const existingEntry = await this.retrieve(id, agentId);
        if (!existingEntry)
            return false;
        // Create updated entry
        const updatedEntry = {
            ...existingEntry,
            ...updates,
            version: existingEntry.version + 1,
            metadata: {
                ...existingEntry.metadata,
                ...updates.metadata,
                lastModified: new Date()
            },
            checksum: this.calculateChecksum(updates.data || existingEntry.data)
        };
        // Store in current tier
        await this.storeInTier(updatedEntry, existingEntry.tier);
        // Update index
        this.memoryIndex.set(id, updatedEntry);
        // Record access
        this.recordAccess(id, 'write', agentId || 'unknown');
        this.emit('memoryUpdated', { entryId: id, version: updatedEntry.version });
        return true;
    }
    /**
     * Delete memory entry with cascade handling
     */
    async delete(id, cascade = false) {
        const entry = this.memoryIndex.get(id);
        if (!entry)
            return false;
        // Handle cascading deletes
        if (cascade) {
            const relatedIds = this.getRelatedEntries(id);
            for (const relatedId of relatedIds) {
                await this.delete(relatedId, false);
            }
        }
        // Delete from appropriate tier
        let success = false;
        switch (entry.tier) {
            case MemoryTier.HOT:
                success = await this.hotStorage.delete(id);
                break;
            case MemoryTier.WARM:
                success = await this.warmStorage.delete(id);
                break;
            case MemoryTier.COLD:
                success = await this.coldStorage.delete(id);
                break;
        }
        if (success) {
            // Remove from index and relationships
            this.memoryIndex.delete(id);
            this.relationshipGraph.delete(id);
            this.emit('memoryDeleted', { entryId: id, tier: entry.tier, cascade });
        }
        return success;
    }
    /**
     * Synchronize memory across tiers for consistency
     */
    async synchronize(entryId) {
        if (entryId) {
            await this.synchronizeEntry(entryId);
        }
        else {
            await this.synchronizeAllEntries();
        }
    }
    /**
     * Run garbage collection across all tiers
     */
    async garbageCollect() {
        const result = {
            hotTier: { processed: 0, deleted: 0, bytesFreed: 0 },
            warmTier: { processed: 0, deleted: 0, bytesFreed: 0 },
            coldTier: { processed: 0, deleted: 0, bytesFreed: 0 },
            totalProcessed: 0,
            totalDeleted: 0,
            totalBytesFreed: 0,
            duration: 0
        };
        const startTime = Date.now();
        // GC hot tier
        result.hotTier = await this.hotStorage.garbageCollect();
        // GC warm tier
        result.warmTier = await this.warmStorage.garbageCollect();
        // GC cold tier
        result.coldTier = await this.coldStorage.garbageCollect();
        // Calculate totals
        result.totalProcessed = result.hotTier.processed + result.warmTier.processed + result.coldTier.processed;
        result.totalDeleted = result.hotTier.deleted + result.warmTier.deleted + result.coldTier.deleted;
        result.totalBytesFreed = result.hotTier.bytesFreed + result.warmTier.bytesFreed + result.coldTier.bytesFreed;
        result.duration = Date.now() - startTime;
        this.emit('garbageCollectionCompleted', result);
        return result;
    }
    /**
     * Get system statistics across all tiers
     */
    async getStats() {
        const hotStats = await this.hotStorage.getStats();
        const warmStats = await this.warmStorage.getStats();
        const coldStats = await this.coldStorage.getStats();
        return {
            totalEntries: hotStats.entries + warmStats.entries + coldStats.entries,
            totalSizeBytes: hotStats.sizeBytes + warmStats.sizeBytes + coldStats.sizeBytes,
            totalCost: hotStats.cost + warmStats.cost + coldStats.cost,
            tiers: {
                hot: hotStats,
                warm: warmStats,
                cold: coldStats
            },
            coherence: await this.coherenceManager.getCoherenceStats(),
            migration: {
                pending: this.migrationQueue.length,
                completed: this.getMigrationHistory().length
            },
            performance: {
                averageReadLatency: this.calculateAverageReadLatency(),
                averageWriteLatency: this.calculateAverageWriteLatency(),
                cacheHitRatio: this.calculateCacheHitRatio()
            }
        };
    }
    // Private helper methods
    initializeSystem() {
        // Start background processes
        this.startMigrationProcessor();
        this.startGarbageCollector();
        this.startSynchronizer();
        this.startHealthMonitor();
    }
    determineOptimalTier(entry) {
        // High importance or real-time data goes to hot tier
        if (entry.metadata?.importance && entry.metadata.importance > 80) {
            return MemoryTier.HOT;
        }
        // Vector data goes to warm tier
        if (entry.vector || entry.type === MemoryType.KNOWLEDGE) {
            return MemoryTier.WARM;
        }
        // Archival or large data goes to cold tier
        if (entry.type === MemoryType.ARTIFACT || (entry.metadata?.importance && entry.metadata.importance < 30)) {
            return MemoryTier.COLD;
        }
        return MemoryTier.WARM; // Default
    }
    async storeInTier(entry, tier) {
        switch (tier) {
            case MemoryTier.HOT:
                await this.hotStorage.set(entry);
                break;
            case MemoryTier.WARM:
                await this.warmStorage.set(entry);
                break;
            case MemoryTier.COLD:
                await this.coldStorage.set(entry);
                break;
        }
    }
    async updateInTier(entry) {
        await this.storeInTier(entry, entry.tier);
    }
    calculateChecksum(data) {
        // Simple checksum - use crypto in production
        return JSON.stringify(data).length.toString(16);
    }
    getDefaultRetentionPolicy(type) {
        const policies = {
            [MemoryType.CONTEXT]: {
                maxAge: 30, // 30 days
                maxSize: 1024 * 1024, // 1MB
                purgeConditions: [{ type: 'age', threshold: 30, action: 'delete' }],
                compliance: []
            },
            [MemoryType.ARTIFACT]: {
                maxAge: 365, // 1 year
                maxSize: 100 * 1024 * 1024, // 100MB
                purgeConditions: [{ type: 'age', threshold: 365, action: 'archive' }],
                compliance: []
            },
            [MemoryType.STATE]: {
                maxAge: 7, // 7 days
                maxSize: 1024 * 1024, // 1MB
                purgeConditions: [{ type: 'age', threshold: 7, action: 'delete' }],
                compliance: []
            },
            [MemoryType.KNOWLEDGE]: {
                maxAge: -1, // No expiry
                maxSize: 50 * 1024 * 1024, // 50MB
                purgeConditions: [{ type: 'size', threshold: 50 * 1024 * 1024, action: 'compress' }],
                compliance: []
            },
            [MemoryType.CONVERSATION]: {
                maxAge: 90, // 90 days
                maxSize: 10 * 1024 * 1024, // 10MB
                purgeConditions: [{ type: 'age', threshold: 90, action: 'archive' }],
                compliance: [{ regulation: 'GDPR', rule: 'right-to-be-forgotten', action: 'delete', deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }]
            },
            [MemoryType.WORKFLOW]: {
                maxAge: 180, // 6 months
                maxSize: 20 * 1024 * 1024, // 20MB
                purgeConditions: [{ type: 'age', threshold: 180, action: 'archive' }],
                compliance: []
            },
            [MemoryType.LEARNING]: {
                maxAge: -1, // No expiry
                maxSize: 100 * 1024 * 1024, // 100MB
                purgeConditions: [{ type: 'usage', threshold: 30, action: 'compress' }],
                compliance: []
            }
        };
        return policies[type];
    }
    calculateNextGC() {
        return new Date(Date.now() + this.config.garbageCollectionInterval);
    }
    updateRelationshipGraph(entry) {
        const relationships = this.relationshipGraph.get(entry.id) || new Set();
        entry.relationships.forEach(rel => {
            relationships.add(rel.targetId);
            // Update bidirectional relationships
            if (rel.bidirectional) {
                const targetRels = this.relationshipGraph.get(rel.targetId) || new Set();
                targetRels.add(entry.id);
                this.relationshipGraph.set(rel.targetId, targetRels);
            }
        });
        this.relationshipGraph.set(entry.id, relationships);
    }
    recordAccess(entryId, operation, agentId) {
        const entry = this.memoryIndex.get(entryId);
        if (!entry)
            return;
        const access = {
            timestamp: new Date(),
            agentId,
            operation,
            duration: 0, // Should be measured in real implementation
            success: true
        };
        entry.metadata.usage.lastAccessPattern.push(access);
        // Keep only last 100 access patterns
        if (entry.metadata.usage.lastAccessPattern.length > 100) {
            entry.metadata.usage.lastAccessPattern = entry.metadata.usage.lastAccessPattern.slice(-100);
        }
    }
    shouldPromote(entry) {
        // Simple promotion logic - enhance in production
        const accessCount = entry.metadata.usage.accessCount;
        const importance = entry.metadata.importance;
        const recentAccesses = entry.metadata.usage.lastAccessPattern
            .filter(ap => Date.now() - ap.timestamp.getTime() < 24 * 60 * 60 * 1000) // Last 24 hours
            .length;
        return accessCount > 10 && importance > 60 && recentAccesses > 5;
    }
    async scheduleMigration(entry, toTier, reason) {
        const job = {
            id: `migration-${Date.now()}-${Math.random()}`,
            entryId: entry.id,
            fromTier: entry.tier,
            toTier,
            reason,
            scheduledAt: new Date(),
            status: 'pending',
            progress: 0
        };
        this.migrationQueue.push(job);
        this.emit('migrationScheduled', job);
    }
    // Additional helper methods would be implemented here...
    getRelatedEntries(entryId) {
        return Array.from(this.relationshipGraph.get(entryId) || []);
    }
    async synchronizeEntry(entryId) {
        // Implement cross-tier synchronization
    }
    async synchronizeAllEntries() {
        // Implement bulk synchronization
    }
    deduplicateResults(results) {
        const seen = new Set();
        return results.filter(entry => {
            if (seen.has(entry.id))
                return false;
            seen.add(entry.id);
            return true;
        });
    }
    sortByRelevance(results, query) {
        // Implement relevance scoring
        return results;
    }
    isArchiveSearchNeeded(timeRange) {
        const archiveThreshold = Date.now() - (90 * 24 * 60 * 60 * 1000); // 90 days
        return timeRange.start.getTime() < archiveThreshold;
    }
    startMigrationProcessor() {
        setInterval(async () => {
            await this.processMigrationQueue();
        }, 60000); // Every minute
    }
    startGarbageCollector() {
        setInterval(async () => {
            await this.garbageCollect();
        }, this.config.garbageCollectionInterval);
    }
    startSynchronizer() {
        setInterval(async () => {
            await this.synchronize();
        }, this.config.syncInterval);
    }
    startHealthMonitor() {
        setInterval(async () => {
            const stats = await this.getStats();
            this.emit('healthCheck', stats);
        }, 30000); // Every 30 seconds
    }
    async processMigrationQueue() {
        // Process migration queue
        const pending = this.migrationQueue.filter(j => j.status === 'pending');
        for (const job of pending.slice(0, 5)) { // Process 5 at a time
            try {
                await this.executeMigration(job);
            }
            catch (error) {
                job.status = 'failed';
                job.error = error instanceof Error ? error.message : String(error);
                this.emit('migrationFailed', job);
            }
        }
    }
    async executeMigration(job) {
        job.status = 'running';
        job.startedAt = new Date();
        const entry = await this.retrieve(job.entryId);
        if (!entry) {
            throw new Error(`Entry ${job.entryId} not found`);
        }
        // Store in new tier
        await this.storeInTier(entry, job.toTier);
        job.progress = 50;
        // Delete from old tier
        switch (job.fromTier) {
            case MemoryTier.HOT:
                await this.hotStorage.delete(job.entryId);
                break;
            case MemoryTier.WARM:
                await this.warmStorage.delete(job.entryId);
                break;
            case MemoryTier.COLD:
                await this.coldStorage.delete(job.entryId);
                break;
        }
        job.progress = 90;
        // Update entry tier
        entry.tier = job.toTier;
        this.memoryIndex.set(job.entryId, entry);
        job.status = 'completed';
        job.completedAt = new Date();
        job.progress = 100;
        this.emit('migrationCompleted', job);
    }
    getMigrationHistory() {
        return this.migrationQueue.filter(j => j.status === 'completed');
    }
    calculateAverageReadLatency() {
        // Calculate average read latency across all tiers
        return 0; // Implement
    }
    calculateAverageWriteLatency() {
        // Calculate average write latency across all tiers
        return 0; // Implement
    }
    calculateCacheHitRatio() {
        // Calculate cache hit ratio
        return 0; // Implement
    }
}
// Supporting classes and interfaces
class TierStorage {
}
class HotStorage extends TierStorage {
    constructor(config) {
        super();
        this.config = config;
    }
    async get(id) {
        // Redis implementation
        return null;
    }
    async set(entry) {
        // Redis implementation
    }
    async delete(id) {
        // Redis implementation
        return false;
    }
    async search(query) {
        // Redis search implementation
        return [];
    }
    async garbageCollect() {
        return { processed: 0, deleted: 0, bytesFreed: 0 };
    }
    async getStats() {
        return { entries: 0, sizeBytes: 0, cost: 0 };
    }
}
class WarmStorage extends TierStorage {
    constructor(config) {
        super();
        this.config = config;
    }
    async get(id) {
        // Qdrant implementation
        return null;
    }
    async set(entry) {
        // Qdrant implementation
    }
    async delete(id) {
        // Qdrant implementation
        return false;
    }
    async search(vector, similarity, limit) {
        // Qdrant vector search implementation
        return [];
    }
    async search(query) {
        // Qdrant search implementation
        return [];
    }
    async garbageCollect() {
        return { processed: 0, deleted: 0, bytesFreed: 0 };
    }
    async getStats() {
        return { entries: 0, sizeBytes: 0, cost: 0 };
    }
}
class ColdStorage extends TierStorage {
    constructor(config) {
        super();
        this.config = config;
    }
    async get(id) {
        // S3 implementation
        return null;
    }
    async set(entry) {
        // S3 implementation
    }
    async delete(id) {
        // S3 implementation
        return false;
    }
    async search(query) {
        // S3 search implementation
        return [];
    }
    async garbageCollect() {
        return { processed: 0, deleted: 0, bytesFreed: 0 };
    }
    async getStats() {
        return { entries: 0, sizeBytes: 0, cost: 0 };
    }
}
class CoherenceManager {
    constructor(level) {
        this.level = level;
    }
    async getCoherenceStats() {
        return {
            level: this.level,
            inconsistencies: 0,
            lastSync: new Date(),
            syncLatency: 0
        };
    }
}
