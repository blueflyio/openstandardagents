# Agent Skills Catalog

This catalog implements the [Agent Skills format](https://agentskills.io/) pioneered by Vercel Labs, adapted for the OSSA (Open Standard Agent Specification) platform.

## Architecture

### Skill Composition

Each skill is a self-contained, modular capability package consisting of:

1. **OSSA Manifest** (`*.ossa.yaml`) — Agent definition with role, capabilities, tools, and activation patterns
2. **Reference Documentation** (`references/`) — Supporting docs, examples, and implementation guides
3. **Scripts** (`scripts/`) — Optional automation helpers

### Automatic Discovery

Skills activate contextually when agents detect relevant tasks through:
- **Keyword triggers**: Specific terms in user requests
- **File pattern matching**: Relevant file types being edited
- **Framework detection**: Project structure analysis
- **Confidence scoring**: Probabilistic relevance assessment

## Available Skills

### 1. React Performance Expert
**File**: `11-react-performance-expert.ossa.yaml`

Expert React/Next.js performance optimization implementing Vercel's agent-skills patterns.

**Priority Framework**:
1. CRITICAL: Eliminating waterfalls, bundle optimization
2. HIGH: Server-side performance
3. MEDIUM-HIGH: Client-side data fetching
4. MEDIUM: Re-render and rendering optimization
5. LOW-MEDIUM: JavaScript micro-optimizations
6. LOW: Advanced patterns

**Activation Triggers**:
- Keywords: "performance", "slow", "optimize", "bundle", "waterfall", "deploy"
- File patterns: `**/*.{tsx,jsx}`, `**/app/**`, `**/pages/**`, `**/components/**`
- Frameworks: Next.js, React, Remix, Gatsby

**Key Capabilities**:
- `performance.analyze` — Comprehensive performance audits across 8 categories
- `waterfall.eliminate` — Detect and fix sequential await patterns (CRITICAL)
- `bundle.optimize` — Reduce bundle size through strategic code splitting (CRITICAL)
- `server.optimize` — Optimize SSR and data fetching (HIGH)
- `rerender.optimize` — Minimize unnecessary re-renders (MEDIUM)

**Impact Examples**:
- Waterfall elimination: 66% latency reduction (3 serial → 2 parallel + 1 serial)
- Barrel import fixes: 200-800ms cold start improvement
- Lazy state initialization: Computation runs once vs every render

---

## Integration Patterns

### For Claude.ai / Cursor / VS Code
1. Load skill manifest into project knowledge
2. Allow network domains if needed (e.g., `*.vercel.com`)
3. Agent auto-activates on relevant contexts

### For Agent Platforms
```typescript
import { SkillRegistry } from '@ossa/skills';

// Register skill
await SkillRegistry.register({
  path: './examples/ossa-templates/11-react-performance-expert.ossa.yaml'
});

// Skills auto-activate based on context
const activeSkills = await SkillRegistry.match({
  userInput: "Optimize this React component",
  files: ['src/components/Dashboard.tsx'],
  framework: 'next.js'
});
```

### For CLI Tools
```bash
# Install skill
npx add-skill openstandardagents/react-performance-expert

# List available skills
npx list-skills

# Activate skill manually
npx activate-skill react-performance-expert
```

---

## Design Patterns

### 1. Separation of Concerns
- **Manifest**: Agent configuration, capabilities, tools
- **References**: Detailed documentation, examples, guidelines
- **Scripts**: Automation helpers (optional)

### 2. Priority-Based Guidance
Rules explicitly marked by impact level (CRITICAL → LOW)

Example from React Performance Expert:
```yaml
## Priority Framework (Apply in Order):

### 1. CRITICAL - Eliminating Waterfalls
"Each sequential await adds full network latency. Eliminating them yields the largest gains."

### 2. CRITICAL - Bundle Size Optimization
"Reducing initial bundle improves Time to Interactive and LCP."
```

### 3. Context-Based Activation
Skills activate automatically based on multiple signals:
```yaml
runtime:
  triggers:
    keywords: ["performance", "optimize"]
    file_patterns: ["**/*.tsx"]
    frameworks: ["next.js", "react"]
  activation:
    automatic: true
    confidence_threshold: 0.8
```

### 4. Framework Agnosticity
Skills work across:
- Claude.ai
- Cursor
- VS Code
- JetBrains IDEs
- CLI tools
- Agent platforms

### 5. Zero-Friction Authentication
Skills operate without credentials when possible:
- Read-only operations default
- Explicit approval for writes
- Sandboxed execution

---

## Creating New Skills

### Step 1: Define OSSA Manifest
```yaml
apiVersion: ossa/v0.3.4
kind: Agent
metadata:
  name: my-skill
  version: 1.0.0
  description: Skill description
  labels:
    ossa.dev/category: development
    vercel-labs/skill-based: true

spec:
  capabilities:
  - name: skill.action
    description: What this skill does

  role: |
    Detailed instructions for the agent...

  tools:
  - name: tool.name
    description: Tool purpose
    handler:
      runtime: ide
      capability: fs.read
```

### Step 2: Add Activation Triggers
```yaml
runtime:
  triggers:
    keywords: ["trigger", "words"]
    file_patterns: ["**/*.ext"]
    frameworks: ["framework-name"]

  activation:
    automatic: true
    confidence_threshold: 0.8
```

### Step 3: Provide Examples and References
```yaml
knowledge:
  examples:
    pattern_name:
      before: |
        # Problematic code
      after: |
        # Optimized code
      impact: "Quantified improvement"
```

### Step 4: Test and Validate
```bash
# Validate manifest
npm run validate:manifest -- path/to/skill.ossa.yaml

# Test activation
npm run test:skill -- my-skill --context "test scenario"
```

---

## Best Practices

### 1. Clear Categorization
Organize optimization strategies by priority/impact level

### 2. Practical Triggering Language
Match real user requests:
- "Deploy my app" → deployment skills
- "Optimize this component" → performance skills
- "Add authentication" → security skills

### 3. Modular Capability Design
Enable easy extension and composition:
```yaml
capabilities:
- name: narrow.specific.action  # Not broad.generic.action
  description: Precise capability description
```

### 4. Documentation Clarity
Write for both agents AND developers:
- Agents: Execution instructions
- Developers: Architecture, patterns, integration

### 5. Framework Auto-Detection
Reduce setup friction:
```yaml
runtime:
  frameworks:
  - next.js
  - react
  - vue
  detection:
    auto: true
    patterns:
      next.js: ["next.config.{js,ts}", "app/", "pages/"]
      react: ["package.json::dependencies.react"]
```

---

## Skill Registry API

### Register Skill
```typescript
interface SkillRegistration {
  path: string;           // Path to .ossa.yaml manifest
  enabled?: boolean;      // Default: true
  priority?: number;      // Higher = preferred when multiple match
  contexts?: string[];    // Limit to specific contexts
}

await SkillRegistry.register({
  path: './skills/react-performance-expert.ossa.yaml',
  priority: 10,
  contexts: ['development', 'review']
});
```

### Match Skills
```typescript
interface MatchContext {
  userInput: string;
  files?: string[];
  framework?: string;
  task?: string;
}

const matches = await SkillRegistry.match({
  userInput: "Optimize my React app for production",
  files: ['src/App.tsx', 'next.config.js'],
  framework: 'next.js'
});

// Returns: [
//   { skill: 'react-performance-expert', confidence: 0.95 },
//   { skill: 'bundle-analyzer', confidence: 0.78 }
// ]
```

### Activate Skill
```typescript
const skill = await SkillRegistry.get('react-performance-expert');
const agent = await skill.instantiate({
  llm: { provider: 'anthropic', model: 'claude-sonnet-4' },
  tools: ['file.read', 'file.edit', 'terminal.run']
});

const result = await agent.execute({
  task: 'Analyze component for performance issues',
  files: ['src/components/Dashboard.tsx']
});
```

---

## Contributing Skills

### Submission Guidelines

1. **Follow OSSA Spec**: Use `apiVersion: ossa/v0.3.4`
2. **Add Skill Label**: Include `vercel-labs/skill-based: true`
3. **Provide Examples**: Real before/after code with measured impact
4. **Document Triggers**: Clear activation keywords and patterns
5. **Test Thoroughly**: Validate across different contexts
6. **Add References**: Link to authoritative sources

### Pull Request Template
```markdown
## Skill: [Name]

**Category**: Development / Security / DevOps / Content

**Capabilities**:
- capability.one
- capability.two

**Activation Triggers**:
- Keywords: ["trigger", "words"]
- File patterns: ["**/*.ext"]
- Frameworks: ["framework"]

**Priority**: CRITICAL / HIGH / MEDIUM / LOW

**Impact Examples**:
- Before/After with quantified improvements

**References**:
- [Source 1](url)
- [Source 2](url)

**Testing**:
- [ ] Manifest validates
- [ ] Skills activates on correct triggers
- [ ] Does not activate on unrelated contexts
- [ ] Examples run successfully
```

---

## Roadmap

### Planned Skills

1. **TypeScript Type Safety Expert**
   - Eliminate `any` types
   - Add strict null checks
   - Optimize type inference

2. **Accessibility Champion**
   - WCAG 2.1 compliance
   - Screen reader compatibility
   - Keyboard navigation

3. **Security Hardening Agent**
   - OWASP Top 10 prevention
   - Dependency vulnerability scanning
   - Security header configuration

4. **Database Query Optimizer**
   - N+1 query detection
   - Index recommendations
   - Query plan analysis

5. **API Design Expert**
   - RESTful conventions
   - OpenAPI spec generation
   - Versioning strategies

6. **Test Coverage Enforcer**
   - Critical path identification
   - Test case generation
   - Coverage gap analysis

---

## License

Skills in this catalog follow the OSSA specification and are available under MIT license unless otherwise specified.

Individual skills may reference external sources (e.g., Vercel agent-skills) which maintain their original licenses.

---

## References

- [Vercel Agent Skills](https://github.com/vercel-labs/agent-skills)
- [Agent Skills Format](https://agentskills.io/)
- [OSSA Specification](https://openstandardagents.org/spec/v0.3.4)
- [Claude.ai Project Knowledge](https://docs.anthropic.com/claude/docs/project-knowledge)
