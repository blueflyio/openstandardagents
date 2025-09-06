# OSSA CLI v0.1.8 - Multi-Agent Orchestration System

[![OSSA v0.1.8](https://img.shields.io/badge/OSSA-v0.1.8-green.svg)](https://ossa.agents)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.2-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Apache%202.0-yellow.svg)](https://opensource.org/licenses/Apache-2.0)

Comprehensive CLI for **93-Agent Deployment Pipeline** and **47-Project Standardization System** with OSSA v0.1.8 compliance.

## 🚀 Features

- **🤖 93-Agent Orchestration** - Deploy agents across 7 tiers with validation gates
- **🔧 47-Project Standardization** - Standardize all .agents directories with proper branching
- **🔗 Agent-Forge Integration** - Seamless integration with existing agent-forge CLI
- **📊 Real-time Monitoring** - Live deployment status and health monitoring
- **🛡️ OSSA v0.1.8 Compliance** - Full specification compliance with validation
- **🎯 Git Branching Strategy** - Proper feature branch management for all changes

## 📦 Installation

```bash
cd /Users/flux423/Sites/LLM/OSSA/cli
npm install
npm run build
```

## 🎯 Quick Start

```bash
# Discover all projects with .agents directories
ossa standardize discover

# Standardize all 47 projects (dry run first)
ossa standardize all --dry-run
ossa standardize all

# Deploy 93-agent orchestration system
ossa orchestrate deploy

# Monitor deployment in real-time
ossa orchestrate monitor

# Check deployment status
ossa orchestrate status
```

## 📋 Commands

### 🤖 Orchestration Commands

Deploy and manage the 93-agent system across 7 tiers:

```bash
# Deploy all agents with tier-based validation
ossa orchestrate deploy [options]
  -w, --workspace <path>    Workspace root path (default: /Users/flux423/Sites/LLM)
  -t, --tier <number>       Deploy specific tier only
  --dry-run                 Show deployment plan without executing

# Display current orchestration status
ossa orchestrate status

# Real-time monitoring with updates
ossa orchestrate monitor [options]
  -i, --interval <seconds>  Update interval in seconds (default: 5)
```

**93-Agent System Architecture:**
- **Tier 0**: Master Orchestrators (3 agents) - System control and coordination
- **Tier 1**: Critical Infrastructure (12 agents) - Version control, OSSA compliance
- **Tier 2**: Code Quality & Validation (15 agents) - Syntax healing, CLI consolidation
- **Tier 3**: Service Infrastructure (18 agents) - Docker, ports, API gateway
- **Tier 4**: Integration & Enhancement (20 agents) - Mobile, voice, AI model integration
- **Tier 5**: Optimization & Performance (15 agents) - Caching, monitoring, resources
- **Tier 6**: Documentation & Compliance (10 agents) - Docs, compliance, auditing

### 🔧 Standardization Commands

Standardize 47 projects with .agents directories:

```bash
# Standardize all projects with proper branching
ossa standardize all [options]
  -w, --workspace <path>    Workspace root path
  --batch <name>            Process specific batch (critical|integration|specialized)
  --dry-run                 Show standardization plan without executing

# Discover and analyze all projects
ossa standardize discover [options]
  --format <type>           Output format (table|json|yaml)

# Standardize specific project
ossa standardize project <name> [options]
  --dry-run                 Show what would be changed
```

**Project Batches:**
- **Critical**: AI Models + Core NPM packages (agent-brain, agent-router, etc.)
- **Integration**: Provider modules + Orchestration modules  
- **Specialized**: Domain-specific modules and packages

### 🔗 Agent-Forge Integration

Integrate with existing agent-forge CLI:

```bash
# Set up integration with agent-forge
ossa forge integrate [options]
  --agent-forge-path <path>  Path to agent-forge project
  --install-commands         Install OSSA commands in agent-forge

# Sync templates and schemas
ossa forge sync [options]
  --agent-forge-path <path>  Path to agent-forge project
```

After integration, use in agent-forge:
```bash
forge ossa orchestrate deploy    # Deploy 93 agents
forge ossa standardize all       # Standardize 47 projects
forge ossa discover              # Discover projects
forge ossa validate              # Validate compliance
```

### 📝 Agent Management

Standard OSSA v0.1.8 agent operations:

```bash
# Create new OSSA v0.1.8 compliant agent
ossa create <name> [options]
  -d, --domain <domain>     Agent domain (default: general)
  -p, --priority <priority> Priority level (default: medium)
  -t, --tier <tier>         Conformance tier (default: advanced)

# Validate OSSA agent specification
ossa validate [path] [options]
  -v, --verbose             Verbose output

# List all OSSA agents in workspace
ossa list [options]
  -f, --format <format>     Output format (table|json)

# Upgrade agent to OSSA v0.1.8
ossa upgrade [path] [options]
  --dry-run                 Show what would be upgraded
```

### 🔍 Discovery Commands (UADP)

Universal Agent Discovery Protocol support:

```bash
# Initialize UADP discovery
ossa discovery init

# Register agent with discovery service
ossa discovery register <path>

# Find agents by capabilities
ossa discovery find [options]
  --capabilities <list>     Required capabilities
  --domain <domain>         Agent domain filter

# Check discovery health
ossa discovery health
```

## 🏗️ Standard Agent Structure

Each project gets standardized with this structure:

```
.agents/
├── {project-name}-core-specialist/           # PRIMARY AGENT
│   ├── agent.yml                            # OSSA v0.1.8 compliant
│   ├── README.md                            # Purpose & capabilities
│   └── config/                              # Configuration files
├── {project-name}-integration-expert/        # INTEGRATION AGENT  
│   ├── agent.yml                            # Platform integrations
│   ├── README.md                            # Integration patterns
│   └── integrations/                        # Integration configs
├── {project-name}-troubleshoot-agent/        # TROUBLESHOOTING AGENT
│   ├── agent.yml                            # Issue resolution
│   ├── README.md                            # Common issues & solutions
│   └── diagnostics/                         # Diagnostic tools
└── {project-name}-SPECIALIST.ossa.yml        # ADVANCED OSSA FILE
```

## 🎯 Agent Naming Convention

**Format:** `{project-name}-{function}-{role}`

**Function Types:**
- `core` - Primary functionality
- `integration` - Cross-system integration  
- `troubleshoot` - Issue resolution
- `security` - Security & compliance
- `performance` - Optimization & monitoring

**Role Types:**
- `specialist` - Core operations
- `expert` - Advanced capabilities  
- `agent` - Basic automation
- `coordinator` - Multi-agent orchestration

## 🔄 Git Branching Strategy

All changes use proper feature branches:

```bash
# Standardization creates branches like:
feature/0.1.8-ossa-standardization-{timestamp}

# Orchestration uses:
feature/0.1.8-agent-deployment-{timestamp}
```

Each commit includes:
```
feat: OSSA v0.1.8 standardization for {project-name}

- Implement standard agent structure (core, integration, troubleshoot)
- Add OSSA v0.1.8 compliance with advanced capabilities  
- Generate project-specific agent configurations
- Clean up system files and maintain standards

🤖 Generated with OSSA Standardization System v0.1.8

Co-Authored-By: OSSA-CLI <noreply@bluefly.ai>
```

## 📊 Project Types & Tiers

**OSSA Conformance Tiers:**
- **Expert**: AI Models (4 projects)
- **Advanced**: Core NPM packages (16 projects) 
- **Governed**: Drupal modules (16 projects)
- **Core**: Platform components (11 projects)

**Project Type Mapping:**
- `drupal-module` → Governed tier
- `npm-package` → Advanced tier  
- `ai-model` → Expert tier
- `platform` → Governed tier

## 🛠️ Development

```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Clean build artifacts
npm run clean
```

## 🔧 Configuration

Default workspace: `/Users/flux423/Sites/LLM`

Override with `-w, --workspace <path>` option on any command.

## 📈 Success Metrics

**Standardization Goals:**
- 47 projects with standard agent structure
- 100% OSSA v0.1.8 compliance
- Proper git branching for all changes
- Clean project structures (no system files)

**Orchestration Goals:**  
- 93 agents deployed across 7 tiers
- 100% validation pass rate
- Real-time monitoring and status
- Tier-based deployment with dependencies

## 🤝 Integration

This CLI integrates seamlessly with:
- **agent-forge** - Add as subcommands
- **Vector Hub** - Agent discovery and routing
- **LLM Gateway** - Multi-provider orchestration
- **GitLab CI/CD** - Automated validation pipelines

## 📄 License

Apache License 2.0 - see LICENSE file for details.

---

**Ready to deploy 93 agents and standardize 47 projects!** 🚀