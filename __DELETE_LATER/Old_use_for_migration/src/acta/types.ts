/**
 * Adaptive Contextual Token Architecture (ACTA) - Core Types
 * High-performance token compression and context management system
 */

export interface ACTAConfig {
  /** Vector database configuration */
  vector: {
    endpoint: string;
    collection: string;
    dimension: number;
    distance: 'cosine' | 'euclidean' | 'dot';
  };
  
  /** Model switching configuration */
  models: {
    small: ModelConfig;
    medium: ModelConfig;
    large: ModelConfig;
    xlarge: ModelConfig;
  };
  
  /** Compression settings */
  compression: {
    threshold: number;
    ratio: number;
    semanticWeight: number;
    frequencyWeight: number;
  };
  
  /** Context graph settings */
  graph: {
    maxNodes: number;
    maxDepth: number;
    pruningThreshold: number;
    persistenceInterval: number;
  };
  
  /** Performance tuning */
  performance: {
    batchSize: number;
    cacheSize: number;
    indexingWorkers: number;
    queryTimeout: number;
  };
}

export interface ModelConfig {
  id: string;
  endpoint: string;
  maxTokens: number;
  contextWindow: number;
  costPerToken: number;
  latencyMs: number;
  capabilities: ModelCapability[];
}

export enum ModelCapability {
  TEXT_GENERATION = 'text_generation',
  CODE_GENERATION = 'code_generation',
  REASONING = 'reasoning',
  MULTIMODAL = 'multimodal',
  TOOL_USE = 'tool_use',
  LONG_CONTEXT = 'long_context'
}

export interface ContextToken {
  id: string;
  content: string;
  embedding: number[];
  metadata: TokenMetadata;
  relationships: TokenRelationship[];
  compressionLevel: CompressionLevel;
  accessPattern: AccessPattern;
}

export interface TokenMetadata {
  type: TokenType;
  priority: number;
  frequency: number;
  lastAccessed: Date;
  createdAt: Date;
  sourceContext: string;
  semanticCluster: string;
  compressionRatio: number;
}

export enum TokenType {
  CORE_CONCEPT = 'core_concept',
  CONTEXT_BRIDGE = 'context_bridge',
  DETAIL = 'detail',
  REFERENCE = 'reference',
  METADATA = 'metadata',
  TEMPORAL = 'temporal'
}

export enum CompressionLevel {
  NONE = 0,
  LIGHT = 1,
  MODERATE = 2,
  HEAVY = 3,
  MAXIMUM = 4
}

export interface TokenRelationship {
  targetId: string;
  type: RelationshipType;
  strength: number;
  directionality: 'bidirectional' | 'unidirectional';
  metadata: Record<string, any>;
}

export enum RelationshipType {
  SEMANTIC = 'semantic',
  TEMPORAL = 'temporal',
  CAUSAL = 'causal',
  HIERARCHICAL = 'hierarchical',
  REFERENCE = 'reference',
  DEPENDENCY = 'dependency'
}

export interface AccessPattern {
  frequency: number;
  recency: number;
  importance: number;
  volatility: number;
  predictedNext: Date | null;
}

export interface ContextGraph {
  nodes: Map<string, ContextToken>;
  edges: Map<string, TokenRelationship[]>;
  clusters: Map<string, string[]>;
  indexTree: BTreeIndex;
  metadata: GraphMetadata;
}

export interface GraphMetadata {
  version: number;
  lastUpdate: Date;
  totalNodes: number;
  totalEdges: number;
  compressionRatio: number;
  performance: PerformanceMetrics;
}

export interface PerformanceMetrics {
  queryLatency: number;
  indexLatency: number;
  compressionLatency: number;
  memoryUsage: number;
  diskUsage: number;
  throughput: number;
}

export interface BTreeIndex {
  root: BTreeNode | null;
  order: number;
  depth: number;
}

export interface BTreeNode {
  keys: string[];
  values: ContextToken[];
  children: BTreeNode[];
  isLeaf: boolean;
  parent: BTreeNode | null;
}

export interface CompressionResult {
  originalSize: number;
  compressedSize: number;
  ratio: number;
  method: CompressionMethod;
  quality: number;
  tokens: ContextToken[];
}

export enum CompressionMethod {
  SEMANTIC_CLUSTERING = 'semantic_clustering',
  FREQUENCY_REDUCTION = 'frequency_reduction',
  HIERARCHICAL_PRUNING = 'hierarchical_pruning',
  TEMPORAL_DECAY = 'temporal_decay',
  IMPORTANCE_FILTERING = 'importance_filtering'
}

export interface ModelSwitchDecision {
  currentModel: string;
  recommendedModel: string;
  reason: SwitchReason;
  confidence: number;
  estimatedImpact: ImpactEstimate;
}

export enum SwitchReason {
  COMPLEXITY_THRESHOLD = 'complexity_threshold',
  CONTEXT_SIZE = 'context_size',
  PERFORMANCE_OPTIMIZATION = 'performance_optimization',
  COST_OPTIMIZATION = 'cost_optimization',
  CAPABILITY_REQUIREMENT = 'capability_requirement',
  QUALITY_REQUIREMENT = 'quality_requirement'
}

export interface ImpactEstimate {
  latencyChange: number;
  costChange: number;
  qualityChange: number;
  contextEfficiency: number;
}

export interface ACTAQuery {
  text: string;
  context: string[];
  maxTokens: number;
  targetModel?: string;
  compressionLevel?: CompressionLevel;
  semanticFilters?: string[];
  temporalRange?: {
    start: Date;
    end: Date;
  };
}

export interface ACTAResponse {
  result: string;
  usedModel: string;
  contextTokens: ContextToken[];
  compressionApplied: boolean;
  performanceMetrics: PerformanceMetrics;
  graphUpdates: GraphUpdate[];
}

export interface GraphUpdate {
  type: 'add' | 'update' | 'remove';
  nodeId: string;
  changes: Partial<ContextToken>;
  timestamp: Date;
}

export interface VectorSearchResult {
  tokens: ContextToken[];
  scores: number[];
  clusters: string[];
  searchLatency: number;
}

export interface SemanticCluster {
  id: string;
  centroid: number[];
  tokens: string[];
  coherence: number;
  size: number;
  lastUpdate: Date;
}

export interface ContextPersistenceLayer {
  save(graph: ContextGraph): Promise<void>;
  load(): Promise<ContextGraph>;
  backup(): Promise<string>;
  restore(backupId: string): Promise<void>;
  optimize(): Promise<void>;
  getMetrics(): Promise<PerformanceMetrics>;
}

export interface ACTAOrchestrator {
  initialize(config: ACTAConfig): Promise<void>;
  process(query: ACTAQuery): Promise<ACTAResponse>;
  compress(tokens: ContextToken[], level: CompressionLevel): Promise<CompressionResult>;
  switchModel(reason: SwitchReason): Promise<ModelSwitchDecision>;
  persistContext(): Promise<void>;
  getHealth(): Promise<HealthStatus>;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  components: Record<string, ComponentHealth>;
  metrics: PerformanceMetrics;
  lastCheck: Date;
}

export interface ComponentHealth {
  status: 'up' | 'down' | 'degraded';
  latency: number;
  errorRate: number;
  lastError?: string;
}