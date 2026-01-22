# Temporal Integration Guide

Complete guide for converting OSSA workflows to Temporal workflows.

## Quick Start

### 1. Export OSSA Workflow to Temporal

```bash
ossa export workflow.ossa.yaml --platform temporal --format typescript --output workflow.ts
```

### 2. Install Dependencies

```bash
npm install @temporalio/workflow @temporalio/activity
```

### 3. Implement Activities

Complete the TODO comments in generated code.

## Conversion Examples

### Workflow with Activities

**OSSA Workflow**:
```yaml
apiVersion: ossa/v0.3.6
kind: Workflow
metadata:
  name: data-processing
spec:
  steps:
    - name: extract
      description: Extract data
    - name: transform
      description: Transform data
    - name: load
      description: Load data
```

**Generated Temporal Code**:
```typescript
import { Activity, Workflow } from '@temporalio/workflow';

export class DataProcessingWorkflow {
  @Activity()
  async extract(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Extract data
    return {};
  }

  @Activity()
  async transform(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Transform data
    return {};
  }

  @Activity()
  async load(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Load data
    return {};
  }

  @Workflow()
  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    const extractResult = await this.extract(input);
    const transformResult = await this.transform(extractResult);
    const loadResult = await this.load(transformResult);
    return { extract: extractResult, transform: transformResult, load: loadResult };
  }
}
```

## Best Practices

1. **Activity Implementation**: Implement activity logic in separate files
2. **Error Handling**: Add retry policies for resilience
3. **Timeouts**: Configure appropriate timeouts
4. **State Management**: Use Temporal's state management features
