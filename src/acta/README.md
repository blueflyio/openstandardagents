# ACTA - Adaptive Contextual Token Architecture

A high-performance token compression and context management system designed for LLM applications with vector-enhanced semantic compression, dynamic model switching (3B to 70B), and O(log n) scaling context graph persistence.

## Features

- **Vector-Enhanced Semantic Compression**: Uses Qdrant for intelligent token compression based on semantic similarity
- **Dynamic Model Switching**: Automatically switches between 3B to 70B models based on query complexity and requirements
- **O(log n) Context Graph Persistence**: High-performance B-tree based storage and retrieval system
- **Intelligent Context Management**: Maintains relationships between tokens with temporal and semantic weighting
- **Performance Optimization**: Configurable caching, batching, and indexing strategies

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   ACTA Query    │───▶│ ACTA Orchestrator│───▶│ ACTA Response   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                               │
                       ┌───────┼───────┐
                       ▼       ▼       ▼
            ┌─────────────┐ ┌─────┐ ┌─────────┐
            │Vector Comp  │ │Model│ │Graph    │
            │Engine       │ │Switch│ │Persist  │
            └─────────────┘ └─────┘ └─────────┘
                       │       │       │
                       ▼       ▼       ▼
            ┌─────────────┐ ┌─────┐ ┌─────────┐
            │Qdrant Vector│ │LLM  │ │B-Tree   │
            │Database     │ │APIs │ │Storage  │
            └─────────────┘ └─────┘ └─────────┘
```

## Installation

```bash
npm install @ossa/acta
```

## Quick Start

```typescript
import { createACTA, CompressionLevel } from '@ossa/acta';

// Create ACTA instance
const acta = await createACTA();

// Process a query with compression
const response = await acta.process({
  text: 'Explain quantum computing',
  context: [
    'Quantum computing uses quantum mechanics',
    'Qubits can be in superposition',
    'Quantum entanglement enables parallel processing'
  ],
  maxTokens: 500,
  compressionLevel: CompressionLevel.MODERATE
});

console.log('Response:', response.result);
console.log('Model used:', response.usedModel);
console.log('Compression applied:', response.compressionApplied);
```

## Configuration

### Default Configuration

```typescript
import { ConfigBuilder, DEFAULT_ACTA_CONFIG } from '@ossa/acta';

const config = ConfigBuilder
  .from(DEFAULT_ACTA_CONFIG)
  .withVector({
    endpoint: 'http://localhost:6333',
    collection: 'my_context',
    dimension: 384
  })
  .withCompression({
    threshold: 8000,
    ratio: 0.6
  })
  .build();

const acta = await createACTA(config);
```

### Environment-Based Configuration

```typescript
import { createACTAFromEnv } from '@ossa/acta';

// Set environment variables
process.env.ACTA_VECTOR_ENDPOINT = 'http://localhost:6333';
process.env.ACTA_BATCH_SIZE = '50';
process.env.ACTA_MODE = 'high-throughput';

const acta = await createACTAFromEnv();
```

### Predefined Configurations

```typescript
import { createDevACTA, createTestACTA } from '@ossa/acta';

// Development configuration (faster, less compression)
const devACTA = await createDevACTA();

// Test configuration (minimal resources, fast execution)
const testACTA = await createTestACTA();
```

## Usage Examples

### Basic Query Processing

```typescript
const response = await acta.process({
  text: 'What is machine learning?',
  context: ['ML is a subset of AI'],
  maxTokens: 200
});
```

### Advanced Query with Filters

```typescript
const response = await acta.process({
  text: 'Compare neural networks and decision trees',
  context: [
    'Neural networks use layers of nodes',
    'Decision trees create hierarchical rules',
    'Both are supervised learning methods'
  ],
  maxTokens: 1000,
  compressionLevel: CompressionLevel.HEAVY,
  semanticFilters: ['machine learning', 'algorithms'],
  temporalRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-12-31')
  }
});
```

### Manual Compression

```typescript
import { VectorCompressionEngine, CompressionLevel } from '@ossa/acta';

const engine = new VectorCompressionEngine(config);
const result = await engine.compressTokens(tokens, CompressionLevel.MODERATE);

console.log(`Compressed ${result.originalSize} to ${result.compressedSize}`);
console.log(`Compression ratio: ${result.ratio}`);
```

### Model Switching

```typescript
import { ModelSwitcher, SwitchReason } from '@ossa/acta';

const switcher = new ModelSwitcher(config);
const decision = await switcher.switchModel(SwitchReason.COMPLEXITY_THRESHOLD);

console.log(`Switched to model: ${decision.recommendedModel}`);
console.log(`Reason: ${decision.reason}`);
console.log(`Confidence: ${decision.confidence}`);
```

## Performance Optimization

### High Throughput Mode

```typescript
const config = ConfigBuilder
  .from(DEFAULT_ACTA_CONFIG)
  .forHighThroughput()
  .build();
```

### Low Latency Mode

```typescript
const config = ConfigBuilder
  .from(DEFAULT_ACTA_CONFIG)
  .forLowLatency()
  .build();
```

### Memory Efficient Mode

```typescript
const config = ConfigBuilder
  .from(DEFAULT_ACTA_CONFIG)
  .forMemoryEfficiency()
  .build();
```

## Monitoring and Health

```typescript
import { checkACTAHealth } from '@ossa/acta';

// Health check
const isHealthy = await checkACTAHealth(acta);

// Detailed health status
const health = await acta.getHealth();
console.log('Status:', health.status);
console.log('Components:', health.components);
console.log('Metrics:', health.metrics);
```

## Benchmarking

```typescript
import { benchmarkACTA } from '@ossa/acta';

const results = await benchmarkACTA(acta, 100); // 100 iterations
console.log(`Average latency: ${results.averageLatency}ms`);
console.log(`Throughput: ${results.throughput} req/s`);
console.log(`Success rate: ${results.successRate * 100}%`);
```

## Model Configuration

ACTA supports four model tiers with different capabilities:

### Small Model (3B parameters)
- **Use case**: Simple queries, basic text generation
- **Context window**: 8,192 tokens
- **Latency**: ~100ms
- **Capabilities**: Text generation, basic code generation

### Medium Model (7B parameters)
- **Use case**: Moderate complexity, reasoning tasks
- **Context window**: 16,384 tokens
- **Latency**: ~200ms
- **Capabilities**: Text generation, code generation, reasoning

### Large Model (13B parameters)
- **Use case**: Complex reasoning, tool use
- **Context window**: 32,768 tokens
- **Latency**: ~400ms
- **Capabilities**: All medium capabilities + tool use

### XLarge Model (70B parameters)
- **Use case**: Advanced reasoning, multimodal tasks
- **Context window**: 65,536 tokens
- **Latency**: ~800ms
- **Capabilities**: All capabilities including multimodal and long context

## Compression Levels

- **NONE**: No compression applied
- **LIGHT**: Minimal compression (10-20% reduction)
- **MODERATE**: Balanced compression (30-40% reduction)
- **HEAVY**: Aggressive compression (50-60% reduction)
- **MAXIMUM**: Maximum compression (70-80% reduction)

## Vector Database Integration

ACTA integrates with Qdrant for vector operations:

```bash
# Start Qdrant locally
docker run -p 6333:6333 qdrant/qdrant
```

Configure vector settings:

```typescript
const config = ConfigBuilder
  .from(DEFAULT_ACTA_CONFIG)
  .withVector({
    endpoint: 'http://localhost:6333',
    collection: 'acta_context',
    dimension: 384,
    distance: 'cosine'
  })
  .build();
```

## Graph Persistence

The graph persistence layer provides O(log n) operations:

- **Add Token**: O(log n) insertion into B-tree
- **Find Token**: O(log n) lookup
- **Find Similar**: O(log n) range query with vector similarity
- **Update Relationships**: O(log n) update

## Error Handling

```typescript
try {
  const response = await acta.process(query);
} catch (error) {
  console.error('ACTA processing failed:', error);
  
  // Check system health
  const health = await acta.getHealth();
  if (health.status === 'unhealthy') {
    // Handle system issues
  }
}
```

## Best Practices

### 1. Configuration Optimization
```typescript
// Choose configuration based on use case
const config = ConfigBuilder
  .from(DEFAULT_ACTA_CONFIG)
  .forHighThroughput() // or forLowLatency() or forMemoryEfficiency()
  .build();
```

### 2. Context Management
```typescript
// Provide relevant context for better results
const response = await acta.process({
  text: query,
  context: relevantContext, // Keep context focused and relevant
  maxTokens: appropriateLimit,
  compressionLevel: CompressionLevel.MODERATE
});
```

### 3. Performance Monitoring
```typescript
// Regular health checks
setInterval(async () => {
  const health = await acta.getHealth();
  if (health.status !== 'healthy') {
    console.warn('ACTA health degraded:', health);
  }
}, 30000);
```

### 4. Resource Cleanup
```typescript
// Always cleanup resources
process.on('SIGINT', async () => {
  await acta.cleanup();
  process.exit(0);
});
```

## API Reference

### Core Classes

- **ACTAOrchestrator**: Main orchestration layer
- **VectorCompressionEngine**: Handles semantic compression
- **ModelSwitcher**: Manages dynamic model selection
- **GraphPersistenceEngine**: B-tree based storage system

### Configuration Classes

- **ConfigBuilder**: Fluent configuration builder
- **ConfigValidator**: Configuration validation
- **EnvironmentConfigLoader**: Environment-based configuration

### Utility Functions

- **createACTA()**: Create configured ACTA instance
- **createDevACTA()**: Create development-optimized instance
- **createTestACTA()**: Create test-optimized instance
- **checkACTAHealth()**: Health check utility
- **benchmarkACTA()**: Performance benchmarking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Run the test suite: `npm test`
5. Submit a pull request

## License

Apache-2.0 License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue in the repository
- Check the documentation
- Review the test suite for usage examples