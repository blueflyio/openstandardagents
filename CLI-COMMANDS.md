# OSSA CLI Commands Reference

**Complete command reference for making, managing, and exporting OSSA agents**

---

## 🚀 CREATING AGENTS (4 ways to start)

### 1. `ossa quickstart` - Fastest (60 seconds)
Creates a working agent in one minute.
```bash
ossa quickstart --provider anthropic --model claude-sonnet-4
```
**Output**: `my-first-agent.ossa.yaml` ready to run

### 2. `ossa wizard` - Interactive & Guided
Step-by-step wizard with prompts for every field.
```bash
ossa wizard --output agent.ossa.yaml
ossa wizard --directory .agents  # Creates full structure
```
**Perfect for**: Learning OSSA structure

### 3. `ossa init` - Quick Manual
Creates manifest interactively with key fields.
```bash
ossa init my-agent
```
**Output**: Basic manifest to customize

### 4. `ossa scaffold` - Complete Structure
Scaffolds full agent project with all files.
```bash
ossa scaffold my-agent
```
**Output**: Directory with manifest, tests, docs, config

---

## 📦 MANAGING AGENTS (CRUD Operations)

### `ossa agents` - Full Lifecycle Management
```bash
ossa agents create <path>           # Register new agent
ossa agents list                    # List all agents
ossa agents get <agent>             # Get agent details
ossa agents update <agent>          # Update agent
ossa agents delete <agent>          # Remove agent
```

### `ossa workspace` - Workspace Governance
```bash
ossa workspace init                 # Setup .agents-workspace/
ossa workspace discover             # Auto-find agents in project
ossa workspace list                 # List workspace agents
ossa workspace sync                 # Sync registry with workspace
ossa workspace policy               # Manage policies
```

### `ossa registry` - Agent Discovery & Catalog
```bash
ossa registry list                  # List registered agents
ossa registry add <path>            # Add to registry
ossa registry remove <name>         # Remove from registry
ossa registry discover              # Auto-discover agents
ossa registry export                # Export catalog
ossa registry validate              # Validate all agents
```

---

## 📤 EXPORTING AGENTS (8 platforms)

### `ossa export` - Convert to Platform Format
```bash
# Export to Kagent (Kubernetes)
ossa export agent.ossa.yaml --platform kagent --output agent.k8s.yaml

# Export to LangChain (Python)
ossa export agent.ossa.yaml --platform langchain --format python --output agent.py

# Export to CrewAI
ossa export agent.ossa.yaml --platform crewai --output crew.yaml

# Export to Temporal (Workflow)
ossa export agent.ossa.yaml --platform temporal --output workflow.yaml

# Export to n8n (Visual Workflows)
ossa export agent.ossa.yaml --platform n8n --output workflow.json

# Export to GitLab CI
ossa export agent.ossa.yaml --platform gitlab --output .gitlab-ci.yml

# Export to Docker
ossa export agent.ossa.yaml --platform docker --output Dockerfile

# Export to Kubernetes
ossa export agent.ossa.yaml --platform kubernetes --output deployment.yaml
```

**Supported Formats**: YAML, JSON, Python

---

## 📥 IMPORTING AGENTS (From Other Platforms)

### `ossa import` - Convert TO OSSA
```bash
# Import from LangChain
ossa import langchain_agent.py --output agent.ossa.yaml

# Import from CrewAI
ossa import crew.yaml --output agent.ossa.yaml

# Import from other OSSA format
ossa import old-format.yaml --output new-format.ossa.yaml
```

### `ossa migrate` - Single Agent Migration
```bash
ossa migrate agent.ossa.yaml --from v0.3.3 --to v0.3.6
```

### `ossa migrate-batch` - Bulk Migration
```bash
ossa migrate-batch --from v0.3.3 --to v0.3.6 --directory examples/
```

---

## 🎨 GENERATING CODE & TYPES

### `ossa generate` - Code Generation Suite
```bash
# Generate TypeScript types from schema
ossa generate types

# Generate Zod validation schemas
ossa generate zod

# Generate agent from template
ossa generate agent worker

# Update all manifest versions
ossa generate manifests

# Generate OpenAPI-first Zod schemas
ossa generate openapi-zod

# Run ALL generators
ossa generate all

# Check for version drift
ossa generate validate
```

### `ossa agents-md` - OpenAI Agents.md Format
```bash
ossa agents-md generate agent.ossa.yaml --output agents.md
ossa agents-md validate agents.md
ossa agents-md sync agent.ossa.yaml agents.md
```

### `ossa llms-txt` - LLM Context Files
```bash
ossa llms-txt generate agent.ossa.yaml --output llms.txt
ossa llms-txt validate llms.txt
```

---

## 🔌 CLAUDE SKILLS INTEGRATION

### `ossa skills` - Claude Skills Management
```bash
# List all Claude Skills
ossa skills list

# Generate Claude Skill from OSSA agent
ossa skills generate agent.ossa.yaml --output skill.md

# Sync Skill with OSSA manifest (bidirectional)
ossa skills sync skill.md agent.ossa.yaml

# Validate Claude Skill
ossa skills validate skill.md
```

**Two-way sync**: Changes in OSSA → Skill OR Skill → OSSA

---

## ✅ VALIDATION & QUALITY

### `ossa validate` - Schema Validation
```bash
ossa validate agent.ossa.yaml
ossa validate examples/**/*.ossa.yaml  # Batch validation
```

### `ossa conformance` - Profile Testing
```bash
ossa conformance agent.ossa.yaml
```
Tests against conformance profiles (minimal, standard, advanced)

### `ossa compliance` - Standards Adherence
```bash
ossa compliance agent.ossa.yaml
ossa compliance examples/  # Check directory
```
Checks compliance badges: SOC2, HIPAA, GDPR, FedRAMP

### `ossa lint` - Best Practices
```bash
ossa lint agent.ossa.yaml
ossa lint --fix agent.ossa.yaml  # Auto-fix issues
```

### `ossa standardize` - Auto-Fix
```bash
ossa standardize agent.ossa.yaml
ossa standardize examples/ --fix
```

### `ossa dependencies` - Dependency Validation
```bash
ossa dependencies agent.ossa.yaml
```
Validates agent dependencies and detects conflicts

### `ossa contract` - Contract Testing
```bash
ossa contract agent.ossa.yaml
```
Cross-agent contract validation

---

## 🏃 RUNNING & TESTING AGENTS

### `ossa run` - Interactive Execution
```bash
ossa run agent.ossa.yaml
ossa run agent.ossa.yaml --runtime docker
ossa run agent.ossa.yaml --runtime kubernetes
```

### `ossa test` - Agent Testing
```bash
ossa test agent.ossa.yaml
ossa test agent.ossa.yaml --coverage
```

---

## 🚀 DEPLOYMENT & OPERATIONS

### `ossa deploy` - Deploy to Runtime
```bash
ossa deploy agent.ossa.yaml --runtime kubernetes
ossa deploy agent.ossa.yaml --runtime docker
ossa deploy agent.ossa.yaml --runtime local
```

### `ossa status` - Check Deployment
```bash
ossa status <instance-id>
ossa status --all
```

### `ossa rollback` - Version Rollback
```bash
ossa rollback <instance-id> --version v1.2.3
```

### `ossa stop` - Stop Instance
```bash
ossa stop <instance-id>
```

---

## 📋 TEMPLATES

### `ossa template` - Template Management
```bash
ossa template list                  # List templates
ossa template show worker           # Show template details
ossa template create --template worker  # Create from template
ossa template validate template.yaml  # Validate template
```

**Built-in Templates**: worker, coordinator, analyzer, reviewer, orchestrator

---

## 🔍 DISCOVERY & SEARCH

### `ossa search` - Find Agents
```bash
ossa search "customer support"
ossa search --domain finance
ossa search --type worker
```

### `ossa install` - Install Agent
```bash
ossa install customer-support-agent
```

### `ossa update` - Update Agent
```bash
ossa update customer-support-agent
```

### `ossa info` - Agent Details
```bash
ossa info customer-support-agent
```

---

## 📊 ANALYSIS & COMPARISON

### `ossa diff` - Compare Manifests
```bash
ossa diff agent-v1.yaml agent-v2.yaml
ossa diff --version v0.3.5 v0.3.6
```

### `ossa schema` - Explore Schema
```bash
ossa schema
ossa schema --version v0.3.6
ossa schema --path spec.llm
```

---

## 🏷️ TAXONOMY & CLASSIFICATION

### `ossa taxonomy` - Taxonomy Management
```bash
ossa taxonomy query "customer support"  # Find taxonomy
ossa taxonomy validate agent.ossa.yaml  # Check classification
ossa taxonomy recommend agent.ossa.yaml # Suggest taxonomy
```

---

## 🎴 A2A PROTOCOL (Agent Cards)

### `ossa agent-card` - Discovery Cards
```bash
ossa agent-card generate agent.ossa.yaml
ossa agent-card validate card.json
```

---

## 🔧 FRAMEWORK INTEGRATION

### `ossa langchain` - LangChain Integration
```bash
ossa langchain convert agent.ossa.yaml --output agent.py
ossa langchain import agent.py --output agent.ossa.yaml
```

### `ossa langflow` - Langflow Integration
```bash
ossa langflow export agent.ossa.yaml --output flow.json
ossa langflow import flow.json --output agent.ossa.yaml
```

### `ossa framework` - Framework Detection
```bash
ossa framework detect           # Detect current framework
ossa framework setup langchain  # Setup framework
```

---

## 🧩 EXTENSIONS

### `ossa extensions` - Extension Management
```bash
ossa extensions list            # List extensions
ossa extensions install <ext>   # Install extension
ossa extensions update <ext>    # Update extension
ossa extensions remove <ext>    # Remove extension
```

### `ossa extension-team` - Team Management
```bash
ossa extension-team list        # List teams
ossa extension-team create      # Create team
```

---

## ⚙️ SETUP & CONFIGURATION

### `ossa setup` - Project Setup
```bash
ossa setup                      # Interactive setup
ossa setup --ci                 # Setup CI/CD
ossa setup --hooks              # Setup git hooks
```

---

## 📊 REGISTRY OPERATIONS

### `ossa publish` - Publish Agent
```bash
ossa publish agent.ossa.yaml
ossa publish agent.ossa.yaml --registry https://registry.example.com
```

---

## 💡 WORKFLOW EXAMPLES

### Example 1: Create → Validate → Export
```bash
# 1. Create agent quickly
ossa quickstart --provider anthropic

# 2. Validate it
ossa validate my-first-agent.ossa.yaml

# 3. Export to LangChain
ossa export my-first-agent.ossa.yaml --platform langchain --format python --output agent.py
```

### Example 2: Import → Enhance → Deploy
```bash
# 1. Import from LangChain
ossa import existing_agent.py --output agent.ossa.yaml

# 2. Enhance with compliance
ossa compliance agent.ossa.yaml --fix

# 3. Deploy to Kubernetes
ossa deploy agent.oss.yaml --runtime kubernetes
```

### Example 3: Wizard → Skills → Registry
```bash
# 1. Create with wizard
ossa wizard --output agent.ossa.yaml

# 2. Generate Claude Skill
ossa skills generate agent.ossa.yaml --output skill.md

# 3. Publish to registry
ossa publish agent.ossa.yaml
```

### Example 4: Discover → Migrate → Standardize
```bash
# 1. Discover agents in workspace
ossa workspace discover

# 2. Batch migrate to v0.3.6
ossa migrate-batch --from v0.3.3 --to v0.3.6

# 3. Standardize all
ossa standardize .agents/ --fix
```

---

## 🎯 KEY FEATURES

### Multi-Platform Export
Export to 8+ platforms: Kagent, LangChain, CrewAI, Temporal, n8n, GitLab, Docker, Kubernetes

### Two-Way Sync
- OSSA ↔ Claude Skills
- OSSA ↔ LangChain
- OSSA ↔ Langflow

### Progressive Complexity
1. `quickstart` - 60 seconds (beginner)
2. `wizard` - Interactive (learning)
3. `init` - Quick manual (intermediate)
4. `scaffold` - Full structure (advanced)

### Production Ready
- Deploy, rollback, monitoring
- CI/CD setup
- Compliance checks (SOC2, HIPAA, GDPR)
- Contract testing

### Extensible
- Plugin system
- Custom templates
- Extension teams

---

## 📈 COMMAND SUMMARY

**Total Commands**: 46+

**Creation**: 4 commands (quickstart, wizard, init, scaffold)
**Management**: 5+ commands (agents CRUD, workspace, registry)
**Export**: 1 command → 8 platforms
**Import**: 1 command ← multiple sources
**Generation**: 10+ sub-commands (types, zod, manifests, etc.)
**Validation**: 6 commands (validate, conformance, compliance, lint, standardize, contract)
**Runtime**: 5 commands (run, test, deploy, status, rollback, stop)
**Templates**: 4 commands (list, show, create, validate)
**Skills**: 4 commands (list, generate, sync, validate)
**Discovery**: 4 commands (search, install, update, info)
**Analysis**: 2 commands (diff, schema)
**Framework**: 3 command groups (langchain, langflow, framework)
**Extensions**: 2 command groups (extensions, extension-team)
**Setup**: 1 command (setup)

---

## 🚀 GETTING STARTED

```bash
# Install OSSA CLI
npm install -g @bluefly/openstandardagents

# Create your first agent (60 seconds)
ossa quickstart

# Run it
ossa run my-first-agent.ossa.yaml

# Export to LangChain
ossa export my-first-agent.ossa.yaml --platform langchain --format python
```

**Version**: 0.3.6
**Status**: Production Ready ✅
