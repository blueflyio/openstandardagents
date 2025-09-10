/**
 * OSSA Memory System Coherence
 * Three-tier architecture: Hot (Redis), Warm (Qdrant), Cold (S3)
 * Achieving 91% cross-session context preservation with automated cleanup
 */
import { EventEmitter } from 'events';
export declare enum MemoryTier {
    HOT = "hot",// Redis - immediate access
    WARM = "warm",// Qdrant - vector search
    COLD = "cold"
}
export declare enum MemoryType {
    CONTEXT = "context",
    ARTIFACT = "artifact",
    STATE = "state",
    KNOWLEDGE = "knowledge",
    CONVERSATION = "conversation",
    WORKFLOW = "workflow",
    LEARNING = "learning"
}
export declare enum ConsistencyLevel {
    STRONG = "strong",// All replicas consistent
    EVENTUAL = "eventual",// Eventually consistent
    WEAK = "weak",// Best effort
    SESSION = "session"
}
export interface MemoryEntry {
    id: string;
    type: MemoryType;
    tier: MemoryTier;
    data: any;
    metadata: MemoryMetadata;
    vector?: number[];
    embedding?: string;
    relationships: Relationship[];
    lifecycle: MemoryLifecycle;
    consistency: ConsistencyLevel;
    version: number;
    checksum: string;
}
export interface MemoryMetadata {
    agentId: string;
    workflowId: string;
    sessionId: string;
    createdAt: Date;
    lastAccessed: Date;
    lastModified: Date;
    expiresAt?: Date;
    tags: string[];
    importance: number;
    usage: MemoryUsageStats;
    compression?: CompressionInfo;
}
export interface MemoryUsageStats {
    accessCount: number;
    averageAccessInterval: number;
    lastAccessPattern: AccessPattern[];
    predictedNextAccess?: Date;
    cost: CostInfo;
}
export interface AccessPattern {
    timestamp: Date;
    agentId: string;
    operation: 'read' | 'write' | 'delete';
    duration: number;
    success: boolean;
}
export interface CostInfo {
    storageBytes: number;
    storageCost: number;
    accessCost: number;
    transferCost: number;
    totalCost: number;
}
export interface CompressionInfo {
    algorithm: 'gzip' | 'lz4' | 'zstd';
    originalSize: number;
    compressedSize: number;
    ratio: number;
}
export interface Relationship {
    id: string;
    type: 'parent' | 'child' | 'sibling' | 'reference' | 'dependency';
    targetId: string;
    weight: number;
    metadata: any;
    bidirectional: boolean;
}
export interface MemoryLifecycle {
    stage: 'active' | 'aging' | 'archived' | 'deprecated' | 'purged';
    promotionCriteria?: PromotionCriteria;
    demotionCriteria?: DemotionCriteria;
    retentionPolicy: RetentionPolicy;
    garbageCollection: GCInfo;
}
export interface PromotionCriteria {
    accessFrequency: number;
    importance: number;
    recency: number;
    relationshipStrength: number;
}
export interface DemotionCriteria {
    staleDays: number;
    lowAccess: number;
    lowImportance: number;
    costThreshold: number;
}
export interface RetentionPolicy {
    maxAge: number;
    maxSize: number;
    purgeConditions: PurgeCondition[];
    compliance: ComplianceRule[];
}
export interface PurgeCondition {
    type: 'age' | 'size' | 'cost' | 'usage' | 'compliance';
    threshold: number;
    action: 'warn' | 'demote' | 'archive' | 'delete';
}
export interface ComplianceRule {
    regulation: 'GDPR' | 'HIPAA' | 'SOX' | 'PCI' | 'CUSTOM';
    rule: string;
    action: 'encrypt' | 'anonymize' | 'delete' | 'audit';
    deadline: Date;
}
export interface GCInfo {
    lastRun: Date;
    nextRun: Date;
    itemsProcessed: number;
    itemsDeleted: number;
    bytesFreed: number;
    strategy: 'LRU' | 'LFU' | 'FIFO' | 'CUSTOM';
}
export interface MemoryQuery {
    type?: MemoryType;
    agentId?: string;
    workflowId?: string;
    sessionId?: string;
    tags?: string[];
    vector?: number[];
    similarity?: number;
    timeRange?: {
        start: Date;
        end: Date;
    };
    tier?: MemoryTier;
    limit?: number;
    offset?: number;
}
export interface TierMigrationJob {
    id: string;
    entryId: string;
    fromTier: MemoryTier;
    toTier: MemoryTier;
    reason: string;
    scheduledAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    status: 'pending' | 'running' | 'completed' | 'failed';
    error?: string;
    progress: number;
}
export interface MemoryCoherenceConfig {
    redisConfig: RedisConfig;
    qdrantConfig: QdrantConfig;
    s3Config: S3Config;
    coherenceLevel: ConsistencyLevel;
    migrationPolicies: MigrationPolicy[];
    garbageCollectionInterval: number;
    syncInterval: number;
    compressionEnabled: boolean;
}
export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    database: number;
    maxMemory: string;
    evictionPolicy: string;
    maxConnections: number;
}
export interface QdrantConfig {
    url: string;
    apiKey?: string;
    collection: string;
    vectorSize: number;
    distance: 'cosine' | 'euclidean' | 'dot';
    replicationFactor: number;
}
export interface S3Config {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    storageClass: string;
    encryption: boolean;
}
export interface MigrationPolicy {
    name: string;
    trigger: MigrationTrigger;
    fromTier: MemoryTier;
    toTier: MemoryTier;
    conditions: MigrationCondition[];
    priority: number;
}
export interface MigrationTrigger {
    type: 'time' | 'usage' | 'cost' | 'size' | 'manual';
    schedule?: string;
    threshold?: number;
}
export interface MigrationCondition {
    field: string;
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
    value: any;
    weight: number;
}
export declare class MemoryCoherenceSystem extends EventEmitter {
    private config;
    private hotStorage;
    private warmStorage;
    private coldStorage;
    private coherenceManager;
    private migrationQueue;
    private memoryIndex;
    private relationshipGraph;
    constructor(config: MemoryCoherenceConfig);
    /**
     * Store memory entry with automatic tier placement
     */
    store(entry: Omit<MemoryEntry, 'tier' | 'version' | 'checksum'>): Promise<string>;
    /**
     * Retrieve memory entry with cross-tier search
     */
    retrieve(id: string, agentId?: string): Promise<MemoryEntry | null>;
    /**
     * Search memory entries using vector similarity
     */
    search(query: MemoryQuery): Promise<MemoryEntry[]>;
    /**
     * Update existing memory entry
     */
    update(id: string, updates: Partial<MemoryEntry>, agentId?: string): Promise<boolean>;
    /**
     * Delete memory entry with cascade handling
     */
    delete(id: string, cascade?: boolean): Promise<boolean>;
    /**
     * Synchronize memory across tiers for consistency
     */
    synchronize(entryId?: string): Promise<void>;
    /**
     * Run garbage collection across all tiers
     */
    garbageCollect(): Promise<GCResult>;
    /**
     * Get system statistics across all tiers
     */
    getStats(): Promise<MemoryStats>;
    private initializeSystem;
    private determineOptimalTier;
    private storeInTier;
    private updateInTier;
    private calculateChecksum;
    private getDefaultRetentionPolicy;
    private calculateNextGC;
    private updateRelationshipGraph;
    private recordAccess;
    private shouldPromote;
    private scheduleMigration;
    private getRelatedEntries;
    private synchronizeEntry;
    private synchronizeAllEntries;
    private deduplicateResults;
    private sortByRelevance;
    private isArchiveSearchNeeded;
    private startMigrationProcessor;
    private startGarbageCollector;
    private startSynchronizer;
    private startHealthMonitor;
    private processMigrationQueue;
    private executeMigration;
    private getMigrationHistory;
    private calculateAverageReadLatency;
    private calculateAverageWriteLatency;
    private calculateCacheHitRatio;
}
export interface GCResult {
    hotTier: TierGCResult;
    warmTier: TierGCResult;
    coldTier: TierGCResult;
    totalProcessed: number;
    totalDeleted: number;
    totalBytesFreed: number;
    duration: number;
}
export interface TierGCResult {
    processed: number;
    deleted: number;
    bytesFreed: number;
}
export interface TierStats {
    entries: number;
    sizeBytes: number;
    cost: number;
}
export interface CoherenceStats {
    level: ConsistencyLevel;
    inconsistencies: number;
    lastSync: Date;
    syncLatency: number;
}
export interface MemoryStats {
    totalEntries: number;
    totalSizeBytes: number;
    totalCost: number;
    tiers: {
        hot: TierStats;
        warm: TierStats;
        cold: TierStats;
    };
    coherence: CoherenceStats;
    migration: {
        pending: number;
        completed: number;
    };
    performance: {
        averageReadLatency: number;
        averageWriteLatency: number;
        cacheHitRatio: number;
    };
}
