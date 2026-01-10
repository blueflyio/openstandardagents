# Agent Audit & DRY Refactoring
## Separation of Duties: OSSA-Specific vs General DevOps

> **Date**: 2026-01-06
> **Status**: 🔴 CRITICAL - Refactoring Required
> **Issue**: Duplicated platform-agents functionality

---

## 🔍 AUDIT RESULTS

### Platform-Agents Agents (Canonical - USE THESE)
From `blueflyio/agent-platform/platform-agents`:

| Agent | Purpose | Should Use Here? |
|-------|---------|------------------|
| **task-dispatcher** | Task orchestration | ✅ Yes - Use for workflow orchestration |
| **merge-request-reviewer** | MR creation/review | ✅ Yes - Use instead of pr-creator |
| **pipeline-remediation** | CI/CD fixes | ✅ Yes - Use for CI/CD issues |
| **release-coordinator** | Release management | ✅ Yes - Use for releases |
| **issue-lifecycle-manager** | Issue management | ✅ Yes - Use for issue tracking |
| **manifest-validator** | Manifest validation | ✅ Yes - Use instead of validator |
| **code-quality-reviewer** | Code quality checks | ✅ Yes - Use for code review |
| **drupal-standards-enforcer** | Drupal standards | ❌ No - Drupal-specific |
| **module-generator** | Module generation | ⚠️ Maybe - Different from extension code gen |
| **recipe-publisher** | Recipe publishing | ❌ No - Drupal-specific |
| **cluster-operator** | K8s operations | ❌ No - Infrastructure-specific |
| **kagent-catalog-sync** | Kagent sync | ❌ No - Kagent-specific |
| **mcp-server-builder** | MCP server build | ⚠️ Maybe - Related to OSSA MCP extension |
| **vulnerability-scanner** | Security scanning | ✅ Yes - Use for security |
| **cost-intelligence-monitor** | Cost monitoring | ❌ No - Infrastructure-specific |
| **documentation-aggregator** | Doc aggregation | ✅ Yes - Use instead of documentation-writer |

### Agents I Created (Need Refactoring)

| Agent | Purpose | Duplicates? | Action |
|-------|---------|------------|--------|
| **platform-researcher** | Research platforms | ❌ No - OSSA-specific | ✅ KEEP |
| **schema-designer** | Design OSSA schemas | ❌ No - OSSA-specific | ✅ KEEP |
| **code-generator** | Generate TypeScript | ⚠️ Partial - Different from module-generator | ⚠️ REFACTOR |
| **documentation-writer** | Write docs | ✅ Yes - Use documentation-aggregator | ❌ REPLACE |
| **test-generator** | Generate tests | ❌ No - OSSA-specific | ✅ KEEP |
| **validator** | Validate extensions | ✅ Yes - Use manifest-validator | ❌ REPLACE |
| **pr-creator** | Create MRs | ✅ Yes - Use merge-request-reviewer | ❌ REPLACE |

---

## ✅ CORRECT SEPARATION OF DUTIES

### OSSA-Specific Agents (Keep Here)
These are **unique to OSSA** and should stay in this repo:

1. **platform-researcher** ✅
   - Purpose: Research AI agent platforms for OSSA compatibility
   - OSSA-Specific: Yes - Analyzes platforms for OSSA mapping
   - Location: `.gitlab/agents/agents/platform-researcher.ossa.yaml`

2. **schema-designer** ✅
   - Purpose: Design OSSA extension schemas
   - OSSA-Specific: Yes - Creates OSSA v0.3.3 extension schemas
   - Location: `.gitlab/agents/agents/schema-designer.ossa.yaml`

3. **test-generator** ✅
   - Purpose: Generate OSSA extension test suites
   - OSSA-Specific: Yes - Tests OSSA extension patterns
   - Location: `.gitlab/agents/agents/test-generator.ossa.yaml`

### General DevOps Agents (Use Platform-Agents)
These should **reference platform-agents** agents:

1. **pr-creator** ❌ → Use **merge-request-reviewer**
2. **validator** ❌ → Use **manifest-validator**
3. **documentation-writer** ❌ → Use **documentation-aggregator**
4. **code-generator** ⚠️ → Refactor to use **module-generator** or keep if OSSA-specific

---

## 🔧 REFACTORING PLAN

### Step 1: Update Workflow to Reference Platform-Agents

Replace local agent refs with platform-agents references:

```yaml
# BEFORE (WRONG)
- id: create-pr
  ref: ./agents/pr-creator.ossa.yaml

# AFTER (CORRECT)
- id: create-pr
  ref: platform-agents://merge-request-reviewer
  # Or use GitLab agent reference
  agent: merge-request-reviewer
```

### Step 2: Keep Only OSSA-Specific Agents

Move to `examples/agents/` or `reference-implementations/`:
- platform-researcher ✅
- schema-designer ✅
- test-generator ✅

### Step 3: Delete Duplicates

**DELETE** duplicate agents:
- pr-creator ❌ (use platform-agents/merge-request-reviewer)
- validator ❌ (use platform-agents/manifest-validator)
- documentation-writer ❌ (use platform-agents/documentation-aggregator)

### Step 4: Refactor Code Generator

If it's OSSA-specific (generates OSSA extension code), keep it.
If it's general code generation, use platform-agents module-generator.

---

## 📋 REFACTORED WORKFLOW STRUCTURE

```yaml
spec:
  steps:
    # OSSA-Specific: Research platform
    - id: research
      ref: ./agents/platform-researcher.ossa.yaml  # OSSA-specific

    # OSSA-Specific: Design OSSA schema
    - id: design-schema
      ref: ./agents/schema-designer.ossa.yaml  # OSSA-specific

    # OSSA-Specific: Generate OSSA extension code
    - id: generate-code
      ref: ./agents/code-generator.ossa.yaml  # OSSA-specific (if different from module-generator)

    # Use Platform-Agents: Documentation
    - id: write-docs
      agent: documentation-aggregator  # From platform-agents
      input:
        type: extension-docs
        platform: "${{ workflow.input.platform }}"

    # OSSA-Specific: Generate OSSA tests
    - id: generate-tests
      ref: ./agents/test-generator.ossa.yaml  # OSSA-specific

    # Use Platform-Agents: Validation
    - id: validate
      agent: manifest-validator  # From platform-agents
      input:
        manifest_type: ossa-extension
        schema_version: v0.3.3

    # Use Platform-Agents: Create PR
    - id: create-pr
      agent: merge-request-reviewer  # From platform-agents
      input:
        action: create
        target_branch: development
```

---

## 🔄 MERGE BACK TO PLATFORM-AGENTS

### Good Patterns to Merge

1. **Extension Development Workflow Pattern**
   - The orchestration pattern is good
   - Should be generalized in platform-agents
   - File: `.gitlab/agents/extension-development-team.ossa.yaml`

2. **Research Agent Pattern**
   - Platform research methodology
   - Could be generalized for any platform research
   - File: `.gitlab/agents/agents/platform-researcher.ossa.yaml`

3. **Schema Design Pattern**
   - Extension schema design methodology
   - Could be generalized for schema design
   - File: `.gitlab/agents/agents/schema-designer.ossa.yaml`

### What to Keep Here

- OSSA-specific logic only
- Reference implementations
- Example agents showing OSSA patterns
- Documentation specific to OSSA

---

## ✅ CORRECTED STRUCTURE

```
.gitlab/agents/
├── examples/                    # Reference implementations
│   ├── platform-researcher.ossa.yaml
│   ├── schema-designer.ossa.yaml
│   └── test-generator.ossa.yaml
├── workflows/                   # OSSA-specific workflows
│   └── extension-development-team.ossa.yaml  # Uses platform-agents agents
└── README.md                    # Documents separation of duties
```

---

## 🚨 IMMEDIATE ACTIONS

1. ✅ Audit complete
2. ⏳ Refactor workflow to use platform-agents agents
3. ⏳ Move OSSA-specific agents to examples/
4. ⏳ Archive duplicate agents
5. ⏳ Update documentation
6. ⏳ Create merge request to platform-agents with good patterns

---

**Status**: 🔴 Audit Complete - Refactoring Required
**Next**: Refactor workflow to use platform-agents agents
