# OSSA Agent Skills Catalog

> **Source**: Based on [Vercel agent-skills](https://agentskills.io/) architecture pattern  
> **Status**: Active Development  
> **Version**: 1.0.0

## Overview

The OSSA Agent Skills System implements the Vercel agent-skills pattern, enabling context-aware skill discovery and automatic activation. Skills are OSSA agents that specialize in specific domains and auto-activate based on user input, file patterns, frameworks, and project context.

## Architecture

### Separation of Concerns

```
OSSA Manifest → Agent config, capabilities, tools
References → Documentation, examples, guidelines  
Scripts → Automation helpers (optional)
```

### Skill Structure

Each skill is an OSSA v0.3.5 agent manifest with:

1. **Metadata Labels**: Skill configuration (`skill.priority`, `skill.contexts`, `skill.enabled`)
2. **Runtime Triggers**: Auto-activation rules (keywords, file patterns, frameworks)
3. **Capabilities**: Domain-specific tools and expertise
4. **Extensions**: MoE experts, BAT framework, feedback loops

### Priority-Based Guidance

Skills implement rules ranked by impact:

- **CRITICAL**: Must fix immediately (waterfalls, bundle size)
- **HIGH**: Significant impact (re-renders, rendering performance)
- **MEDIUM**: Moderate impact (micro-optimizations, CSS)
- **LOW**: Edge cases (advanced patterns, micro-benchmarks)

## Integration

### Claude.ai Integration

Skills work seamlessly with Claude.ai:

1. Skills auto-discover from configured paths
2. Context matching activates relevant skills
3. Skills provide specialized guidance in conversation

### Cursor Integration

Skills integrate with Cursor IDE:

1. File pattern matching triggers skills on file open/edit
2. Keyword detection in chat activates skills
3. Framework detection enables framework-specific skills

### VS Code Extension

Skills can be packaged as VS Code extensions:

1. Register skills via extension manifest
2. Provide IntelliSense and quick fixes
3. Show skill recommendations in editor

## Skill Creation Guidelines

### 1. Define Skill Metadata

```yaml
metadata:
  name: react-performance-expert
  labels:
    skill.priority: 90
    skill.contexts: development,review
    skill.enabled: "true"
    skill.auto_activate: "true"
```

### 2. Configure Runtime Triggers

```yaml
runtime:
  triggers:
    keywords:
      - performance
      - optimize
      - slow
    file_patterns:
      - "**/*.{tsx,jsx}"
      - "**/components/**"
    frameworks:
      - next.js
      - react
  activation:
    automatic: true
    confidence_threshold: 0.7
```

### 3. Implement Domain Expertise

```yaml
role: |
  You are a React Performance Expert specializing in...
  
  CRITICAL Priority Rules:
  1. Eliminate Waterfalls
  2. Bundle Optimization
  ...
```

### 4. Add Specialized Tools

```yaml
tools:
  - name: analyze_bundle
    description: Analyze bundle size
    source:
      type: mcp
      uri: mcp://build-tools/bundle-analyzer
```

### 5. Enable v0.3.5 Features

```yaml
extensions:
  experts:
    registry:
      - id: deep-analysis-expert
        model: claude-opus-4-5-20251101
        specializations: [complex_analysis]
  bat:
    selection_criteria: [...]
  feedback:
    learning:
      enabled: true
```

## API Reference

### SkillRegistry Service

```typescript
import { SkillRegistry } from '@bluefly/openstandardagents/skill-registry';

// Initialize
await SkillRegistry.initialize([
  './examples/agent-skills',
  './examples/ossa-templates',
]);

// Register skill
await SkillRegistry.registerFromFile('./skills/my-skill.ossa.yaml');

// Match skills
const matches = await SkillRegistry.match({
  userInput: "Optimize my React app",
  files: ['src/App.tsx'],
  framework: 'next.js',
});

// Get skills by context
const devSkills = SkillRegistry.getByContext('development');

// Enable/disable
SkillRegistry.enable('react-performance-expert');
SkillRegistry.disable('react-performance-expert');
```

### Skill Matching

```typescript
interface SkillMatchContext {
  userInput?: string;
  files?: string[];
  framework?: string;
  projectType?: string;
  keywords?: string[];
}

interface SkillMatch {
  skill: SkillMetadata;
  confidence: number; // 0.0 - 1.0
  reasons: string[];
}
```

## Available Skills

### 1. React Performance Expert

**File**: `examples/ossa-templates/11-react-performance-expert.ossa.yaml`

**Capabilities**:
- Bundle size optimization
- Waterfall elimination
- Re-render optimization
- Image optimization
- Code splitting

**Auto-Activation**:
- Keywords: "performance", "optimize", "slow", "bundle"
- Files: `**/*.{tsx,jsx}`, `**/components/**`
- Frameworks: Next.js, React, Remix, Gatsby

**Impact**:
- 66% latency reduction (waterfall elimination)
- 200-800ms cold start improvement (barrel imports)
- 30-50% bundle size reduction (dynamic imports)

## Best Practices

### 1. Skill Naming

- Use descriptive names: `react-performance-expert`, `typescript-type-safety-expert`
- Include domain: `drupal-security-expert`, `api-design-expert`
- Be specific: `react-performance-expert` not `performance-expert`

### 2. Priority Setting

- **90-100**: Critical, high-impact skills (performance, security)
- **70-89**: Important skills (type safety, accessibility)
- **50-69**: Standard skills (code quality, testing)
- **30-49**: Nice-to-have skills (documentation, formatting)
- **0-29**: Experimental skills

### 3. Context Selection

- **development**: Active development work
- **production**: Production deployment checks
- **review**: Code review assistance
- **testing**: Test generation and validation

### 4. Trigger Configuration

- **Keywords**: Common terms users might use
- **File Patterns**: Glob patterns for relevant files
- **Frameworks**: Framework names (case-insensitive)
- **Confidence Threshold**: 0.7+ for high-confidence matches

### 5. Tool Design

- Use MCP servers for tool integration
- Provide clear input/output schemas
- Include examples in descriptions
- Support dry-run modes

## Roadmap

### Phase 1: Core Skills (Current)

- ✅ React Performance Expert
- 🔄 TypeScript Type Safety Expert
- 🔄 Accessibility Champion
- 🔄 Security Hardening Agent

### Phase 2: Advanced Skills

- 🔄 Database Query Optimizer
- 🔄 API Design Expert
- 🔄 Test Coverage Enforcer
- 🔄 Documentation Generator

### Phase 3: Framework-Specific Skills

- 🔄 Next.js Optimization Expert
- 🔄 Drupal Best Practices Expert
- 🔄 Node.js Performance Expert
- 🔄 Python Code Quality Expert

### Phase 4: Domain-Specific Skills

- 🔄 FinTech Compliance Expert
- 🔄 Healthcare Data Privacy Expert
- 🔄 E-commerce Performance Expert
- 🔄 SaaS Security Expert

## Contributing

### Adding a New Skill

1. Create OSSA manifest in `examples/ossa-templates/`
2. Follow skill creation guidelines
3. Add to skills catalog
4. Write tests for skill registry
5. Update documentation

### Testing Skills

```typescript
import { SkillRegistry } from '@bluefly/openstandardagents/skill-registry';

describe('React Performance Expert', () => {
  it('should match on performance keywords', async () => {
    const matches = await SkillRegistry.match({
      userInput: 'My React app is slow',
    });
    
    expect(matches[0].skill.name).toBe('react-performance-expert');
    expect(matches[0].confidence).toBeGreaterThan(0.7);
  });
  
  it('should match on React files', async () => {
    const matches = await SkillRegistry.match({
      files: ['src/components/App.tsx'],
    });
    
    expect(matches.length).toBeGreaterThan(0);
  });
});
```

## References

- [Vercel agent-skills](https://agentskills.io/)
- [Vercel React Best Practices](https://github.com/vercel-labs/agent-skills/tree/react-best-practices)
- [OSSA v0.3.5 Specification](../spec/v0.3/)
- [Skill Registry Service](../../src/services/skill-registry.service.ts)

---

**Last Updated**: 2026-01-14  
**Maintainer**: blueflyio  
**License**: MIT
