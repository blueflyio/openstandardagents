# ACTA Token Optimization System

This example demonstrates the **Adaptive Contextual Token Architecture (ACTA)** - OSSA's advanced token efficiency system that achieves 50-70% reduction in token usage through intelligent optimization strategies.

## Overview

ACTA implements 10 core optimization tactics to minimize token consumption while maintaining quality and functionality:

1. **Key-based Context**: Pass IDs instead of full documents
2. **Delta Prompting**: Send only changes between iterations
3. **Tiered Depth**: Start shallow, expand as needed
4. **Output-only Critique**: Review results without full artifacts
5. **Cacheable Capsules**: Version-controlled policy/style guides
6. **Vector Pre-filters**: Top-k retrieval with late expansion
7. **Pre-LLM Validation**: Rules/regex/schema checks before LLM
8. **Compression Support**: zstd/base64 for payloads
9. **Checkpoint Memos**: Compressed summaries vs full history
10. **Early Exit Logic**: Heuristics to terminate unproductive paths

## Architecture Components

### Token Budget Manager
- **Global**: Organization-wide limits
- **Project**: Per-project allocations  
- **Task/Subtask**: Granular execution budgets
- **Agent Role**: Type-specific constraints

### Props Token Resolution
URI-based reference system for efficient context passing:
- **Format**: `@{namespace}:{project}:{version}:{id}`
- **Example**: `@RM:OSSA:0.1.8:E-018-STD`

### Optimization Engine
Real-time token usage optimization with predictive analytics and adaptive strategies.

## Key Features Demonstrated

1. **Intelligent Context Switching**: Dynamic context size based on task complexity
2. **Predictive Token Budgeting**: ML-based estimation of token requirements
3. **Adaptive Prompt Compression**: Smart prompt reduction without quality loss
4. **Hierarchical Caching**: Multi-level caching for reusable components
5. **Token Usage Analytics**: Detailed metrics and optimization insights

## Files

- `acta-optimizer.yml` - ACTA optimization agent configuration
- `token-budget-manager.yml` - Budget management agent
- `props-resolver.yml` - Props token resolution service
- `optimization-demo.js` - Complete ACTA demonstration
- `compression-utilities.js` - Token compression and caching utilities
- `analytics-dashboard.js` - Token usage analytics and reporting

## Usage

```bash
# Initialize ACTA system
node optimization-demo.js --mode=init

# Run optimization demonstration
node optimization-demo.js --mode=demo

# Generate analytics report
node analytics-dashboard.js

# Test compression utilities
node compression-utilities.js --test

# Validate optimization effectiveness
ossa validate acta-optimizer.yml
```

This example shows how ACTA achieves significant token savings while maintaining high-quality outputs through intelligent optimization strategies.