# Props Token Resolution System

This example demonstrates the **Props Token Resolution System** - OSSA's URI-based reference system for efficient context passing and token optimization. Props tokens enable cacheable, versionable, minimal-token-overhead references to reusable content.

## Overview

The Props Token Resolution System provides a sophisticated URI-based reference mechanism that replaces large content blocks with compact, resolvable tokens. This system is fundamental to OSSA's token efficiency strategy, enabling 50-70% token reduction while maintaining full semantic integrity.

## Props Token Format

```
@{namespace}:{project}:{version}:{id}
```

### Examples
- `@RM:OSSA:0.1.8:E-018-STD` - Requirements Management standard template
- `@ARCH:OSSA:0.1.8:FEEDBACK-LOOP` - Architecture specification for feedback loop
- `@TEST:OSSA:0.1.8:VALIDATION-SUITE` - Test validation suite
- `@POLICY:ENTERPRISE:1.0.0:SECURITY-FRAMEWORK` - Security policy framework

## Resolution Targets

Props tokens can resolve to various resource types:

### Artifact URIs
- **Format**: `artifact://{repo}/{path}@{commit}`
- **Example**: `artifact://github.com/ossa/specs/feedback-loop.md@abc123`
- **Use Case**: Version-controlled documentation and specifications

### Vector IDs
- **Format**: `vec://{space}/{id}`
- **Example**: `vec://embeddings/requirements-template-v2`
- **Use Case**: Semantic search and similarity matching

### DITA Topics
- **Format**: `dita://{collection}/{topicId}`
- **Example**: `dita://agent-specs/capability-definitions`
- **Use Case**: Structured documentation and knowledge management

### Database References
- **Format**: `db://{connection}/{table}/{id}`
- **Example**: `db://ossa-prod/agent-configs/orchestrator-v1`
- **Use Case**: Dynamic configuration and data references

## Key Features Demonstrated

1. **Namespace Management**: Hierarchical organization of props tokens by domain
2. **Version Control**: Semantic versioning with backward compatibility
3. **Caching Strategies**: Multi-tier caching for optimal performance
4. **Resolution Protocols**: Multiple resolution strategies (local, remote, cached)
5. **Content Validation**: Integrity checking and validation of resolved content
6. **Fallback Mechanisms**: Graceful handling of resolution failures

## Files

- `props-resolver.yml` - Main props token resolution service
- `namespace-registry.yml` - Namespace management and registration
- `cache-manager.yml` - Multi-tier caching system
- `props-demo.js` - Complete props token demonstration
- `resolution-strategies.js` - Different resolution strategy implementations
- `namespace-manager.js` - Namespace management and validation
- `cache-optimizer.js` - Cache optimization and analytics

## Namespace Configuration

### Standard Namespaces
```yaml
namespaces:
  RM:    # Requirements Management
    description: "Requirements templates and standards"
    version_schema: "semver"
    cache_ttl: 3600
    
  ARCH:  # Architecture
    description: "System architecture specifications"
    version_schema: "semver"
    cache_ttl: 7200
    
  TEST:  # Testing
    description: "Test suites and validation frameworks"
    version_schema: "semver"
    cache_ttl: 1800
```

## Caching Architecture

### L1 Cache - Memory (Hot)
- **Capacity**: 1000 tokens
- **TTL**: 5 minutes
- **Strategy**: LRU eviction
- **Use Case**: Frequently accessed tokens

### L2 Cache - Redis (Warm)
- **Capacity**: 10,000 tokens
- **TTL**: 1 hour
- **Strategy**: TTL-based expiration
- **Use Case**: Recently accessed tokens

### L3 Cache - Disk (Cold)
- **Capacity**: 100,000 tokens
- **TTL**: 24 hours
- **Strategy**: Size-based eviction
- **Use Case**: Historical and backup storage

## Usage

```bash
# Initialize props token system
node props-demo.js --mode=init

# Run complete demonstration
node props-demo.js --mode=demo

# Test resolution strategies
node resolution-strategies.js --test

# Manage namespaces
node namespace-manager.js --register RM:OSSA:0.1.8

# Optimize cache performance
node cache-optimizer.js --analyze

# Validate props configuration
ossa validate props-resolver.yml
```

## Performance Benefits

1. **Token Reduction**: 50-70% reduction in prompt tokens
2. **Caching Efficiency**: 95%+ cache hit rate for common tokens  
3. **Semantic Integrity**: 100% content fidelity through resolution
4. **Version Management**: Automatic handling of version compatibility
5. **Network Optimization**: Minimal bandwidth usage for remote resolution

This example provides a complete foundation for implementing Props token resolution in production OSSA deployments.