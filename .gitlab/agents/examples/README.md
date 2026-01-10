# OSSA-Specific Reference Agents

## Purpose

These agents are **OSSA-specific** and serve as **reference implementations** showing how to build agents that work with OSSA specifications, schemas, and extensions.

## Separation of Duties

### ✅ OSSA-Specific Agents (Keep Here)

These agents are unique to OSSA and demonstrate OSSA-specific patterns:

1. **platform-researcher.ossa.yaml**
   - Purpose: Research AI agent platforms for OSSA compatibility
   - OSSA-Specific: Yes - Analyzes platforms and maps to OSSA constructs
   - Use Case: Extension development workflow

2. **schema-designer.ossa.yaml**
   - Purpose: Design OSSA extension schemas (v0.3.3)
   - OSSA-Specific: Yes - Creates OSSA-compliant extension schemas
   - Use Case: Extension development workflow

3. **code-generator.ossa.yaml**
   - Purpose: Generate OSSA extension TypeScript/Zod code
   - OSSA-Specific: Yes - Generates OSSA-specific code patterns
   - Use Case: Extension development workflow

4. **test-generator.ossa.yaml**
   - Purpose: Generate OSSA extension test suites
   - OSSA-Specific: Yes - Tests OSSA extension patterns
   - Use Case: Extension development workflow

### ❌ General DevOps Agents (Use Platform-Agents)

For general DevOps tasks, use agents from `blueflyio/agent-platform/platform-agents`:

- **merge-request-reviewer** - Create/review MRs
- **manifest-validator** - Validate manifests
- **documentation-aggregator** - Aggregate documentation
- **task-dispatcher** - Task orchestration
- **code-quality-reviewer** - Code quality checks
- **vulnerability-scanner** - Security scanning

## Usage

These agents are referenced in workflows:

```yaml
- id: research
  ref: ./examples/platform-researcher.ossa.yaml
```

## Reference Implementation

These agents serve as:
- **Examples** of OSSA agent patterns
- **Templates** for building OSSA-specific agents
- **Documentation** of OSSA agent capabilities

## Contributing

When adding new OSSA-specific agents:
1. Ensure they are unique to OSSA
2. Don't duplicate platform-agents functionality
3. Document OSSA-specific patterns used
4. Add to examples/ directory
