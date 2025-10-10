# Task Heavy Worker Agent

A specialized OSSA worker agent designed for computationally intensive tasks that require significant processing power and time.

## Overview

This worker agent handles:
- Batch processing operations
- Data transformation tasks
- Algorithmic computations
- Parallel processing workloads
- Resource-intensive operations

## Docker Service Mapping

This agent corresponds to the `ossa-task-heavy` service in docker-compose.agents.yml:
- **Container**: ossa-task-heavy
- **Port**: 3004
- **Specialization**: heavy_computation
- **Max Concurrent Tasks**: 5
- **Task Timeout**: 120 seconds

## Capabilities

### Core Operations

1. **execute_heavy_task**: Main execution engine for compute-intensive tasks
2. **get_task_status**: Real-time status monitoring for running tasks  
3. **cancel_task**: Graceful task cancellation with cleanup

### Supported Task Types

- **Batch Processing**: Large dataset processing operations
- **Data Transformation**: Complex data format conversions
- **Algorithm Execution**: CPU-intensive algorithmic operations
- **Parallel Computation**: Multi-threaded processing tasks

## Resource Management

### Limits
- **CPU**: 2-4 cores (requests: 2, limits: 4)
- **Memory**: 4-8GB (requests: 4Gi, limits: 8Gi)
- **Storage**: 20-100GB (requests: 20Gi, limits: 100Gi)
- **Max Task Size**: 1GB
- **Concurrent Tasks**: 5 maximum

### Performance Characteristics
- **Throughput**: Up to 10 tasks per minute
- **Latency**: P50: 30s, P95: 90s, P99: 120s
- **Success Rate**: >99% target

## Usage Example

```yaml
# Heavy computation task
taskType: algorithm_execution
payload:
  data:
    dataset: [large_array_of_data]
    algorithm: "complex_optimization"
  parameters:
    iterations: 10000
    precision: 0.0001
    parallel_threads: 4
  optimizations:
    - "memory_mapping"
    - "vectorization" 
    - "cache_optimization"
priority: high
timeout: 180000
```

## Token Efficiency

The agent implements several strategies to minimize token usage:
- **Result-only reporting**: Only return final results, not intermediate steps
- **Progress chunking**: Batch progress updates instead of continuous streaming
- **Compressed payloads**: Use efficient data serialization
- **Delta updates**: Only communicate changes since last update

## Integration

Integrates with:
- Redis for task queuing and caching
- PostgreSQL for task history and results storage
- OSSA Gateway for service discovery
- Monitoring systems for performance tracking

## Configuration

Key configuration options:
- `maxConcurrentTasks`: Number of parallel tasks (default: 5)
- `taskTimeout`: Default task timeout in ms (default: 120000)
- `resourceOptimization`: Enable resource usage optimization
- `queueStrategy`: Task queuing strategy (priority, fifo, lifo)
- `retryPolicy`: Automatic retry configuration for failed tasks