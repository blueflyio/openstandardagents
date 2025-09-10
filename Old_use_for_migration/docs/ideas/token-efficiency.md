# OSSA Token Efficiency Strategies

## Overview

The OSSA framework implements comprehensive token optimization strategies designed to reduce costs by 50-70% while maintaining performance and quality. These strategies are built into the core architecture and enforced through budget management systems.

## Core Token Efficiency Strategies

The system implements 10 core tactics to minimize token usage:

### 1. Key-based Context
- Pass IDs, not full documents
- Server resolves to vectors/DITA on demand
- Reduces context overhead by 80%

### 2. Delta Prompting
- Send only changes between iterations
- Semantic diff summaries instead of full content
- Incremental updates reduce redundancy

### 3. Tiered Depth
- Shallow initial prompts, expand as needed
- Summary → outline → target section only
- Progressive detail based on requirements

### 4. Output-only Critique
- Review results without full artifacts
- Critics operate on lint/test output
- Focus on outcomes rather than process

### 5. Cacheable Capsules
- Version-controlled policy/style guides
- Immutable "style/policy capsules" referenced by versioned IDs
- Reusable components reduce duplication

### 6. Vector Pre-filters
- Top-k retrieval with late expansion
- Fetch IDs first, fulltext only for finalists
- Reduces initial payload size

### 7. Pre-LLM Validation
- Rules/regex/schema checks before LLM
- Aggregation before LLM calls
- Early filtering reduces unnecessary processing

### 8. Compression Support
- zstd/base64 for payloads
- Server-side decompress
- Binary efficiency for large transfers

### 9. Checkpoint Memos
- Compressed summaries vs full history
- Carry forward short memos
- State compression over time

### 10. Early Exit Logic
- Heuristics to terminate unproductive paths
- Skip judge round if critic/validator passes at high confidence
- Confidence-based flow control

## Budget Management System

Token budgets are enforced at multiple levels:

### Budget Hierarchy
- **Global**: Organization-wide limits
- **Project**: Per-project allocations
- **Task/Subtask**: Granular execution budgets
- **Agent Role**: Type-specific constraints

### Default Limits
- **Task**: 12,000 tokens
- **Subtask**: 4,000 tokens
- **Planning**: 2,000 tokens

### Enforcement Policies
- **Block**: Stop execution when limit reached
- **Queue**: Defer execution until budget available
- **Delegate**: Route to more efficient agent
- **Escalate**: Request additional budget approval

## Props Token Resolution

A URI-based reference system for efficient context passing:

### Format
- **Pattern**: `@{namespace}:{project}:{version}:{id}`
- **Example**: `@RM:OSSA:0.1.8:E-018-STD`

### Resolution Targets
- **Artifact URIs**: `artifact://{repo}/{path}@{commit}`
- **Vector IDs**: `vec://{space}/{id}`
- **DITA topics**: `dita://{collection}/{topicId}`

### Benefits
- Cacheable references
- Version-controlled content
- Minimal token overhead
- Server-side resolution

## Performance Metrics

### Measured Improvements
- **Token Efficiency**: 68% average reduction
- **Cost Optimization**: 40% average cost reduction
- **Context Transfer**: 80% reduction in handoff tokens
- **Total Workflow**: 72% reduction in workflow tokens

### Comparison Results
| Metric | Baseline | OSSA | Improvement |
|--------|----------|------|-------------|
| Avg Tokens/Handoff | 1,250 | 350 | 72% reduction |
| Prompt Tokens | 5,000 | 1,500 | 70% reduction |
| Context Transfer | 2,000 | 400 | 80% reduction |
| Total Workflow | 15,000 | 4,200 | 72% reduction |

## Implementation Guidelines

### Budget Schema
```yaml
Budget:
  type: object
  properties:
    maxTokensTask: { type: integer }
    maxTokensSubtask: { type: integer }
    maxTokensPlanning: { type: integer }
    stopOnExceed: { type: boolean, default: true }
    handoffPolicy:
      type: string
      enum: [subtask, specialist, abort]
```

### Token Efficiency Configuration
```yaml
x-token-efficiency:
  strategies:
    - Key-based context (pass IDs not docs)
    - Delta-first prompts
    - Tiered prompting (shallow→deep)
    - Critic-on-outputs (lint/test) not full artifacts
    - Cacheable policy/style capsules (versioned)
    - Vector pre-filters (top-k IDs, expand late)
    - Pre-LLM validators (rules/regex/schema)
    - Payload compression allowed (zstd/base64)
    - Checkpoint memos instead of full history
    - Early-exit heuristics
  
  budget-defaults:
    maxTokensTask: 12000
    maxTokensSubtask: 4000
    maxTokensPlanning: 2000
```

## Cost Tracking & ROI

### Metrics Collection
- **Usage**: Input/output tokens per agent
- **Cost**: Total USD cost per task
- **Quality**: Success rates and outcomes
- **Performance**: Latency and throughput

### ROI-based Auto-Routing
- Track cost/quality KPIs per agent
- Route work based on cost/quality ratios
- Mix open-source and cloud models optimally
- Model switching logged and explainable

## Governance Integration

### Budget Enforcement Endpoint
- `/governance/budget/enforce`
- Pre-flight budget checks
- Real-time limit monitoring
- Automatic handoff on overflow

### Audit Trail
- All budget decisions logged
- Token usage tracked per agent
- Cost attribution to tasks/projects
- Compliance reporting enabled

This comprehensive token efficiency system ensures optimal resource utilization while maintaining quality and performance standards across the OSSA ecosystem.