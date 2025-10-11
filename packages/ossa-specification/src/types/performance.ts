/**
 * OSSA Performance Type Definitions
 */

export interface PerformanceConfig {
  /** Token optimization configuration */
  token_optimization?: TokenOptimization;
  /** Cache configuration */
  cache?: CacheConfiguration;
  /** Quantization configuration */
  quantization?: QuantizationConfiguration;
  /** Batching configuration */
  batching?: BatchingConfiguration;
  /** Resource configuration */
  resources?: ResourceConfiguration;
  /** Scaling configuration */
  scaling?: ScalingConfiguration;
  /** Optimization configuration */
  optimization?: OptimizationConfiguration;
}

// Token Optimization Types
export interface TokenOptimization {
  /** Enable token optimization */
  enabled?: boolean;
  /** Optimization strategies */
  strategies?: OptimizationStrategy[];
  /** Maximum context window size */
  max_context?: number;
  /** Compression configuration */
  compression?: CompressionConfig;
  /** Truncation configuration */
  truncation?: TruncationConfig;
}

export interface OptimizationStrategy {
  /** Strategy type */
  type:
    | 'flash_attention'
    | 'block_sparse'
    | 'paged_kv'
    | 'grouped_query'
    | 'sliding_window'
    | 'multi_query'
    | 'rotary_embeddings'
    | 'alibi'
    | 'longformer';
  /** Strategy configuration */
  config?: {
    block_size?: number;
    window_size?: number;
    num_groups?: number;
    page_size?: number;
  };
}

export interface CompressionConfig {
  /** Enable compression */
  enabled?: boolean;
  /** Compression method */
  method?: 'gzip' | 'zstd' | 'lz4' | 'snappy' | 'brotli';
  /** Compression level (1=fast, 9=best) */
  level?: number;
  /** Minimum size to compress */
  min_size?: string;
}

export interface TruncationConfig {
  /** Enable truncation */
  enabled?: boolean;
  /** Truncation strategy */
  strategy?: 'beginning' | 'end' | 'middle' | 'smart';
  /** Number of recent tokens to preserve */
  preserve_recent?: number;
}

// Cache Types
export interface CacheConfiguration {
  /** Enable caching */
  enabled?: boolean;
  /** Cache layers */
  layers?: CacheLayer[];
  /** Cache key strategy */
  key_strategy?: 'hash' | 'semantic' | 'hybrid';
  /** Eviction policy */
  eviction?: EvictionPolicy;
}

export interface CacheLayer {
  /** Layer name */
  name: string;
  /** Cache type */
  type: 'memory' | 'redis' | 'memcached' | 'disk' | 'hybrid';
  /** Cache size limit */
  size?: string;
  /** Time to live in seconds */
  ttl?: number;
  /** Cache configuration */
  config?: {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
    path?: string;
  };
}

export interface EvictionPolicy {
  /** Eviction policy */
  policy?: 'lru' | 'lfu' | 'fifo' | 'random' | 'ttl';
  /** Maximum entries */
  max_entries?: number;
  /** Maximum memory */
  max_memory?: string;
}

// Quantization Types
export interface QuantizationConfiguration {
  /** Enable quantization */
  enabled?: boolean;
  /** Quantization method */
  method?: 'int8' | 'int4' | 'fp16' | 'bf16' | 'gptq' | 'awq' | 'bnb' | 'gguf';
  /** Target bit precision */
  target_bits?: 4 | 8 | 16;
  /** Calibration configuration */
  calibration?: CalibrationConfig;
  /** Layers to quantize */
  layers?: string[];
}

export interface CalibrationConfig {
  /** Calibration dataset */
  dataset?: string;
  /** Number of calibration samples */
  samples?: number;
  /** Calibration method */
  method?: 'minmax' | 'percentile' | 'entropy';
}

// Batching Types
export interface BatchingConfiguration {
  /** Enable batching */
  enabled?: boolean;
  /** Enable dynamic batching */
  dynamic?: boolean;
  /** Maximum batch size */
  max_batch_size?: number;
  /** Batch timeout in milliseconds */
  timeout_ms?: number;
  /** Padding strategy */
  padding?: 'none' | 'max' | 'bucket';
  /** Bucket sizes for bucket padding */
  buckets?: number[];
}

// Resource Types
export interface ResourceConfiguration {
  /** Resource limits */
  limits?: ResourceLimits;
  /** Resource requests */
  requests?: ResourceRequests;
  /** GPU configuration */
  gpu?: GPUConfiguration;
  /** Network configuration */
  network?: NetworkConfiguration;
}

export interface ResourceLimits {
  /** CPU limit (cores) */
  cpu?: string;
  /** Memory limit */
  memory?: string;
  /** Disk limit */
  disk?: string;
  /** Ephemeral storage limit */
  ephemeral_storage?: string;
}

export interface ResourceRequests {
  /** CPU request (cores) */
  cpu?: string;
  /** Memory request */
  memory?: string;
}

export interface GPUConfiguration {
  /** GPU required */
  required?: boolean;
  /** GPU vendor */
  type?: 'nvidia' | 'amd' | 'intel' | 'apple';
  /** GPU model */
  model?: string;
  /** Number of GPUs */
  count?: number;
  /** Minimum GPU memory */
  memory?: string;
  /** Minimum compute capability */
  compute_capability?: string;
}

export interface NetworkConfiguration {
  /** Network bandwidth limit */
  bandwidth?: string;
  /** Maximum acceptable latency in ms */
  latency?: number;
  /** Network timeout in ms */
  timeout?: number;
  /** Retry configuration */
  retry?: RetryConfig;
}

export interface RetryConfig {
  /** Enable retries */
  enabled?: boolean;
  /** Maximum retry attempts */
  max_attempts?: number;
  /** Backoff strategy */
  backoff?: 'exponential' | 'linear' | 'fixed';
  /** Initial retry delay in ms */
  initial_delay?: number;
  /** Maximum retry delay in ms */
  max_delay?: number;
}

// Scaling Types
export interface ScalingConfiguration {
  /** Enable scaling */
  enabled?: boolean;
  /** Scaling type */
  type?: 'horizontal' | 'vertical' | 'both';
  /** Horizontal scaling configuration */
  horizontal?: HorizontalScaling;
  /** Vertical scaling configuration */
  vertical?: VerticalScaling;
}

export interface HorizontalScaling {
  /** Minimum replicas */
  min_replicas?: number;
  /** Maximum replicas */
  max_replicas?: number;
  /** Target CPU utilization percentage */
  target_cpu?: number;
  /** Target memory utilization percentage */
  target_memory?: number;
  /** Custom metrics */
  metrics?: ScalingMetric[];
}

export interface VerticalScaling {
  /** Enable vertical scaling */
  enabled?: boolean;
  /** Update mode */
  update_mode?: 'auto' | 'manual';
  /** CPU range */
  cpu?: ResourceRange;
  /** Memory range */
  memory?: ResourceRange;
}

export interface ResourceRange {
  /** Minimum resource value */
  min?: string;
  /** Maximum resource value */
  max?: string;
}

export interface ScalingMetric {
  /** Metric name */
  name: string;
  /** Target value */
  target: number;
  /** Metric type */
  type?: 'utilization' | 'average' | 'value';
}

// Optimization Types
export interface OptimizationConfiguration {
  /** Compiler optimization */
  compiler?: CompilerOptimization;
  /** Runtime optimization */
  runtime?: RuntimeOptimization;
  /** Model optimization */
  model?: ModelOptimization;
}

export interface CompilerOptimization {
  /** Enable compiler optimization */
  enabled?: boolean;
  /** Compilation backend */
  backend?: 'torch_compile' | 'tvm' | 'xla' | 'tensorrt' | 'onnx';
  /** Compilation mode */
  mode?: 'default' | 'reduce_overhead' | 'max_performance';
  /** Additional options */
  options?: Record<string, unknown>;
}

export interface RuntimeOptimization {
  /** Enable Torch Dynamo */
  torch_dynamo?: boolean;
  /** Enable CUDA graphs */
  cuda_graphs?: boolean;
  /** Automatic mixed precision */
  amp?: {
    enabled?: boolean;
    dtype?: 'float16' | 'bfloat16';
  };
  /** Enable operator fusion */
  fusion?: boolean;
}

export interface ModelOptimization {
  /** Pruning configuration */
  pruning?: {
    enabled?: boolean;
    sparsity?: number;
  };
  /** Distillation configuration */
  distillation?: {
    enabled?: boolean;
    teacher_model?: string;
    temperature?: number;
  };
}

// Performance utilities
export function createBasicPerformance(): PerformanceConfig {
  return {
    batching: {
      enabled: true,
      dynamic: true,
      max_batch_size: 32,
      timeout_ms: 100
    },
    cache: {
      enabled: true,
      layers: [{
        name: 'memory',
        type: 'memory',
        ttl: 3600
      }]
    }
  };
}

export function createOptimizedPerformance(): PerformanceConfig {
  return {
    token_optimization: {
      enabled: true,
      strategies: [{
        type: 'flash_attention',
        config: {}
      }],
      max_context: 32000
    },
    cache: {
      enabled: true,
      layers: [
        {
          name: 'l1_memory',
          type: 'memory',
          size: '100MB',
          ttl: 300
        },
        {
          name: 'l2_redis',
          type: 'redis',
          ttl: 3600
        }
      ],
      key_strategy: 'semantic'
    },
    batching: {
      enabled: true,
      dynamic: true,
      max_batch_size: 64,
      timeout_ms: 50,
      padding: 'bucket'
    },
    quantization: {
      enabled: true,
      method: 'int8',
      target_bits: 8
    }
  };
}

export function hasAdvancedOptimization(config: PerformanceConfig): boolean {
  return !!(
    config.token_optimization?.strategies?.length &&
    config.quantization?.enabled &&
    (config.optimization?.compiler?.enabled ||
     config.optimization?.runtime?.amp?.enabled)
  );
}

export function requiresGPU(config: PerformanceConfig): boolean {
  return config.resources?.gpu?.required === true;
}

export function getMemoryRequirement(config: PerformanceConfig): string | undefined {
  return config.resources?.limits?.memory || config.resources?.requests?.memory;
}