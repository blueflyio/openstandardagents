# OSSA CLI Reference v0.1.8

## Overview

The OSSA CLI v0.1.8 provides comprehensive command-line interface for managing OSSA-compliant agents, platform services, and orchestration workflows. Built as a workspace-based TypeScript CLI with full OpenAPI integration.

## Installation

### NPM Installation (Recommended)

```bash
npm install -g @bluefly/open-standards-scalable-agents@0.1.8

# Verify installation
ossa version
```

### Local Development

```bash
# Clone repository
git clone https://gitlab.com/bluefly-ai/ossa-standard.git
cd ossa-standard

# Install dependencies
npm install

# Build CLI
npm run build

# Use local CLI
./src/cli/bin/ossa version
```

## Command Overview

### Core Agent Management

| Command | Description | Status |
|---------|-------------|---------|
| `ossa create <name>` | Create new OSSA v0.1.8 agent |  Production Ready |
| `ossa validate [path]` | Validate agent specification |  Production Ready |
| `ossa list [--format]` | List workspace agents |  Production Ready |
| `ossa upgrade [path]` | Upgrade agent to v0.1.8 |  Production Ready |

### Discovery & UADP

| Command | Description | Status |
|---------|-------------|---------|
| `ossa discovery init` | Initialize UADP discovery |  Production Ready |
| `ossa discovery register <path>` | Register agent with discovery |  Production Ready |
| `ossa discovery find --capabilities=X,Y` | Find agents by capabilities |  Production Ready |
| `ossa discovery health` | Check discovery system health |  Production Ready |

### Platform Services

| Command | Description | Status |
|---------|-------------|---------|
| `ossa services start` | Start all platform services |  Production Ready |
| `ossa services stop` | Stop all platform services |  Production Ready |
| `ossa services status` | Check service health |  Production Ready |
| `ossa services logs [service]` | View service logs |  Production Ready |

### API Operations

| Command | Description | Status |
|---------|-------------|---------|
| `ossa api agents list` | List agents via API |  Production Ready |
| `ossa api agents create <spec>` | Create agent via API |  Production Ready |
| `ossa api discover --capabilities=X` | Discovery via API |  Production Ready |
| `ossa api metrics --timeframe=1h` | Get platform metrics |  Production Ready |

### Orchestration

| Command | Description | Status |
|---------|-------------|---------|
| `ossa orchestrate create <workflow>` | Create workflow |  Production Ready |
| `ossa orchestrate run <id>` | Execute workflow |  Production Ready |
| `ossa orchestrate status <id>` | Check workflow status |  Production Ready |

### Migration & Utilities

| Command | Description | Status |
|---------|-------------|---------|
| `ossa migrate from-v1 <path>` | Migrate from v0.1.1 |  Production Ready |
| `ossa generate openapi <path>` | Generate OpenAPI specs |  Production Ready |
| `ossa validate compliance` | Check compliance status |  Production Ready |

## Detailed Command Reference

### Agent Management Commands

#### `ossa create <name> [options]`

Create a new OSSA v0.1.8 compliant agent with complete directory structure.

**Options:**
- `-d, --domain <domain>` - Agent domain (default: "general")
- `-p, --priority <priority>` - Priority level (default: "medium") 
- `-t, --tier <tier>` - Conformance tier: core, governed, advanced (default: "advanced")

**Example:**
```bash
$ ossa create finance-analyzer --tier=advanced --domain=finance
 Creating OSSA v0.1.8 agent: finance-analyzer

 Created OSSA v0.1.8 agent: finance-analyzer
    ./finance-analyzer
    behaviors/        (Agent behavior definitions)
    config/           (Configuration files)
    data/             (Agent data and state)
    handlers/         (Event and message handlers)
    integrations/     (Framework integrations)
    schemas/          (Data validation schemas)
    training-modules/ (Training and learning modules)
    _roadmap/         (Versioned roadmap files)
    agent.yml         (Enhanced OSSA v0.1.8 spec)
    openapi.yaml      (UADP integrated API spec)
    README.md         (Quick start guide)

Next steps:
   1. ossa validate finance-analyzer
   2. ossa discovery init
   3. ossa discovery register finance-analyzer
```

**Generated Structure:**
- **Standard OSSA v0.1.8 agent specification**
- **Complete OpenAPI 3.1+ specification with UADP integration**
- **Multi-framework support** (LangChain, CrewAI, OpenAI, MCP)
- **Enterprise compliance** (ISO 42001, NIST AI RMF)
- **Versioned roadmaps** in DITA format
- **Complete documentation**

#### `ossa validate [path] [options]`

Validate OSSA agent specifications with comprehensive compliance checking.

**Options:**
- `-v, --verbose` - Verbose validation output
- `--json` - JSON output format
- `--compliance` - Include compliance validation

**Example:**
```bash
$ ossa validate ./my-agent --verbose
 Validating OSSA agent...

 OSSA v0.1.8 agent is valid
   Agent: my-agent
   Version: 1.0.0
   Tier: advanced
   Protocols: openapi, mcp, uadp
   Capabilities: analysis, reporting, optimization

⚠  Roadmap: Partial roadmap (2/3)

Detailed Analysis:
{
  "ossa": "0.1.8",
  "metadata": {
    "name": "my-agent",
    "version": "1.0.0"
  },
  "spec": {
    "conformance_tier": "advanced"
  }
}
```

**Validation Checks:**
- OSSA v0.1.8 specification compliance
- Required directory structure
- OpenAPI specification validation
- Framework integration validation
- Compliance framework requirements
- Performance requirements
- Security configuration
- Roadmap completeness

#### `ossa list [options]`

List all OSSA agents in the workspace with detailed information.

**Options:**
- `-f, --format <format>` - Output format: table, json (default: table)
- `--tier <tier>` - Filter by conformance tier
- `--domain <domain>` - Filter by domain

**Example:**
```bash
$ ossa list
OSSA v0.1.8 Agents:

1. finance-analyzer v1.0.0
   Path: ./finance-analyzer
   Tier:  advanced
   Domain: finance
   Protocols: openapi, mcp, uadp
   Features: 📋 OpenAPI  UADP  Structure 🗺 Roadmap

2. data-processor v1.0.0
   Path: ./data-processor
   Tier:  governed
   Domain: data
   Protocols: openapi, mcp
   Features: 📋 OpenAPI ⚪ UADP  Structure  Roadmap
   Missing dirs: integrations, training-modules

Total: 2 agents
Legend: 📋 OpenAPI spec,  UADP enabled,  Complete structure, 🗺 Roadmap complete
```

### Discovery Commands (UADP)

#### `ossa discovery init`

Initialize Universal Agent Discovery Protocol (UADP) for the workspace.

**Example:**
```bash
$ ossa discovery init
 Initializing UADP Discovery...

 UADP Discovery initialized
   Discovery endpoint: http://localhost:3002
   Registry database: ~/.ossa/registry.db
   Cache directory: ~/.ossa/cache/
   Scan interval: 30 seconds

Discovery features enabled:
   - Hierarchical capability matching
   - Real-time registry updates  
   - Semantic search with vector embeddings
   - Sub-50ms discovery for 1000+ agents
```

#### `ossa discovery register <path>`

Register an agent with the UADP discovery system.

**Example:**
```bash
$ ossa discovery register ./finance-analyzer
 Registering agent with UADP...

 Agent registered successfully
   Agent ID: 550e8400-e29b-41d4-a716-446655440000
   Name: finance-analyzer
   Capabilities: finance_analysis, risk_assessment, reporting
   Protocols: openapi, mcp, uadp
   Health endpoint: http://localhost:3001/health
   Discovery URL: http://localhost:3002/agents/550e8400-e29b-41d4-a716-446655440000
```

#### `ossa discovery find --capabilities=X,Y`

Find agents matching specific capabilities using UADP.

**Options:**
- `--capabilities <list>` - Comma-separated list of required capabilities
- `--domain <domain>` - Filter by domain
- `--tier <tier>` - Filter by conformance tier
- `--format <format>` - Output format: table, json

**Example:**
```bash
$ ossa discovery find --capabilities=analysis,reporting --domain=finance
 Discovering agents...

Found 2 matching agents:

📋 finance-analyzer v1.0.0
   Capabilities: finance_analysis, reporting, risk_assessment
   Tier: advanced
   Health: healthy
   Endpoint: http://localhost:3001

📋 financial-auditor v1.0.1
   Capabilities: analysis, reporting, compliance_checking
   Tier: governed  
   Health: healthy
   Endpoint: http://localhost:3002

Discovery time: 23ms
```

### Platform Services Commands

#### `ossa services start`

Start all OSSA platform services using Docker Compose.

**Example:**
```bash
$ ossa services start
 Starting OSSA platform services...

Starting services:
    PostgreSQL (Registry database)
    Redis (Cache and message bus)
    Qdrant (Vector search)
    API Gateway (Port 4000)
    Agent Registry (Port 3001)
    Discovery Engine (Port 3002)
    Orchestration (Port 3003)
    GraphQL API (Port 3004)
    Monitoring (Port 3005)

 All services started successfully!
   Platform API: http://localhost:4000/api/v1
   GraphQL: http://localhost:4000/graphql
   Health: http://localhost:4000/api/v1/health
   Dashboard: http://localhost:3080

Service status:
   🟢 api-gateway       (healthy)
   🟢 agent-registry    (healthy)
   🟢 discovery-engine  (healthy)
   🟢 orchestration     (healthy) 
   🟢 monitoring        (healthy)
```

#### `ossa services status`

Check the health status of all platform services.

**Example:**
```bash
$ ossa services status
 OSSA Platform Service Status

Core Services:
   🟢 api-gateway       Port: 4000    Status: healthy    Uptime: 2h 15m
   🟢 agent-registry    Port: 3001    Status: healthy    Uptime: 2h 15m
   🟢 discovery-engine  Port: 3002    Status: healthy    Uptime: 2h 14m
   🟢 orchestration     Port: 3003    Status: healthy    Uptime: 2h 14m
   🟢 graphql-api       Port: 3004    Status: healthy    Uptime: 2h 14m
   🟢 monitoring        Port: 3005    Status: healthy    Uptime: 2h 14m

Data Services:
   🟢 postgresql        Port: 5432    Status: healthy    Uptime: 2h 15m
   🟢 redis             Port: 6379    Status: healthy    Uptime: 2h 15m
   🟢 qdrant            Port: 6333    Status: healthy    Uptime: 2h 15m

Performance:
   Average Response Time: 45ms
   Success Rate: 99.8%
   Active Agents: 12
   Requests/min: 230
```

### API Commands

#### `ossa api agents list`

List agents via the platform API with filtering and pagination.

**Options:**
- `--limit <number>` - Results per page (default: 20)
- `--offset <number>` - Pagination offset (default: 0)
- `--tier <tier>` - Filter by conformance tier
- `--format <format>` - Output format: table, json

**Example:**
```bash
$ ossa api agents list --tier=advanced --limit=5
📡 Listing agents via API...

API Response from http://localhost:4000/api/v1/agents:

┌─────────┬─────────────────────┬─────────┬──────────────┬──────────┐
│ Name    │ ID                  │ Version │ Tier         │ Health   │
├─────────┼─────────────────────┼─────────┼──────────────┼──────────┤
│ agent-1 │ 550e8400-e29b-41d4  │ 1.0.0   │ advanced     │ healthy  │
│ agent-2 │ 6ba7b810-9dad-11d1  │ 1.0.1   │ advanced     │ healthy  │
│ agent-3 │ 6ba7b811-9dad-11d1  │ 1.0.0   │ advanced     │ degraded │
└─────────┴─────────────────────┴─────────┴──────────────┴──────────┘

Total: 3 agents (showing 3 of 3)
API Response Time: 67ms
```

#### `ossa api discover --capabilities=X,Y`

Perform agent discovery via the platform API using UADP protocol.

**Example:**
```bash
$ ossa api discover --capabilities=data_analysis,reporting
📡 Discovering agents via API...

API Request to http://localhost:4000/api/v1/discover:
  Query: capabilities=data_analysis,reporting

Discovery Results:
┌─────────────────────┬─────────────────────────────────────┬──────────┬─────────────────────────────┐
│ Agent               │ ID                                  │ Health   │ Matching Capabilities       │
├─────────────────────┼─────────────────────────────────────┼──────────┼─────────────────────────────┤
│ data-analyzer       │ 550e8400-e29b-41d4-a716-446655440000│ healthy  │ data_analysis, reporting    │
│ business-intel      │ 6ba7b810-9dad-11d1-b6a0-00c04fd430c8│ healthy  │ analysis, reporting, bi     │
└─────────────────────┴─────────────────────────────────────┴──────────┴─────────────────────────────┘

Discovery Summary:
  Found: 2 agents
  Query Time: 23ms
  Total Capabilities Matched: 4
```

### Orchestration Commands

#### `ossa orchestrate create <workflow>`

Create a new workflow definition for multi-agent orchestration.

**Example:**
```bash
$ ossa orchestrate create data-pipeline-workflow
📋 Creating orchestration workflow...

 Workflow created successfully
   Workflow ID: wf_550e8400-e29b-41d4
   Name: data-pipeline-workflow
   Definition: ./workflows/data-pipeline-workflow.yml
   
Workflow template includes:
   - Agent discovery and capability matching
   - Task delegation and coordination
   - State management and error handling
   - Performance monitoring and metrics
   
Next steps:
   1. Edit ./workflows/data-pipeline-workflow.yml
   2. ossa orchestrate run wf_550e8400-e29b-41d4
```

#### `ossa orchestrate run <id>`

Execute a workflow with real-time status monitoring.

**Example:**
```bash
$ ossa orchestrate run wf_550e8400-e29b-41d4
 Executing workflow: data-pipeline-workflow

Workflow Execution:
   📋 Step 1: Agent Discovery         Complete (2 agents found)
   📋 Step 2: Data Ingestion          Running (agent: data-collector)
   📋 Step 3: Data Processing        ⏳ Waiting (agent: data-processor)
   📋 Step 4: Analysis & Reporting   ⏳ Pending

Current Status:
   Execution ID: exec_6ba7b810-9dad-11d1
   Started: 2025-01-26T10:00:00Z
   Duration: 45 seconds
   Progress: 25% (1/4 steps complete)
   
Active Agents:
   - data-collector (healthy) - Processing 1,250 records
   - data-processor (ready) - Awaiting input
   
Real-time logs:
   [10:00:15] Data ingestion started from source: api.example.com
   [10:00:32] Processed 1,250/5,000 records (25% complete)
   [10:00:45] Agent data-collector: Batch 1 complete, preparing batch 2
```

### Migration Commands

#### `ossa migrate from-v1 <path>`

Migrate agents from OSSA v0.1.1 to v0.1.8 with comprehensive updates.

**Example:**
```bash
$ ossa migrate from-v1 ./legacy-agent/
 Migrating agent from OSSA v0.1.1 to v0.1.8...

Migration Analysis:
   Source: ./legacy-agent/agent.yml (v0.1.1)
   Target: ./legacy-agent-v0.1.8/ (v0.1.8)

Changes Required:
    Update OSSA version specification
    Add new directory structure (8 directories)
    Enhance OpenAPI specification to 3.1+
    Add UADP discovery support
    Add framework integration configurations
    Add compliance framework specifications
    Generate versioned roadmaps
    Update documentation

Migration Complete:
    Created: ./legacy-agent-v0.1.8/
    Migrated: agent.yml with v0.1.8 enhancements
    Enhanced: openapi.yaml with UADP integration
    Added: All required v0.1.8 directories
    Generated: 3 versioned roadmap files
    Created: Updated README.md

Validation Result:  OSSA v0.1.8 compliant

Next Steps:
   1. Review migrated agent specification
   2. ossa validate ./legacy-agent-v0.1.8
   3. ossa discovery register ./legacy-agent-v0.1.8
```

## Global Options

All OSSA CLI commands support these global options:

- `-v, --verbose` - Enable verbose output
- `--json` - Output in JSON format where applicable
- `--help` - Show help for specific command
- `--version` - Show CLI version

## Configuration

### Environment Variables

```bash
# Platform configuration
export OSSA_PLATFORM_URL=http://localhost:4000
export OSSA_API_KEY=your-api-key

# Service ports (for local development)
export OSSA_REGISTRY_PORT=3001
export OSSA_DISCOVERY_PORT=3002
export OSSA_ORCHESTRATION_PORT=3003

# Development settings
export OSSA_ENV=development
export OSSA_LOG_LEVEL=info
export OSSA_CACHE_TTL=300
```

### Configuration Files

**~/.ossa/config.yml:**
```yaml
platform:
  url: "http://localhost:4000"
  api_key: "your-api-key"
  timeout: 30000

discovery:
  enabled: true
  scan_interval: 30
  cache_ttl: 300

services:
  auto_start: false
  health_check_interval: 15

output:
  format: "table"
  verbose: false
  json: false
```

## Error Handling

### Common Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `AGENT_EXISTS` | Agent directory already exists | Choose different name or remove existing |
| `INVALID_NAME` | Agent name format invalid | Use valid naming pattern |
| `VALIDATION_FAILED` | Agent specification invalid | Fix validation errors |
| `SERVICE_UNAVAILABLE` | Platform service not running | Start services with `ossa services start` |
| `API_ERROR` | API request failed | Check network connectivity and API status |
| `MIGRATION_FAILED` | Migration process failed | Check source agent format and permissions |

### Debugging

```bash
# Enable verbose output
ossa --verbose create my-agent

# Check system status
ossa services status

# View service logs
ossa services logs discovery-engine

# Test API connectivity
curl http://localhost:4000/api/v1/health
```

## Development Workflows

### Basic Agent Development

```bash
# 1. Create new agent
ossa create my-agent --tier=advanced

# 2. Customize agent specification
# Edit ./my-agent/agent.yml

# 3. Validate agent
ossa validate ./my-agent

# 4. Register with discovery
ossa discovery register ./my-agent

# 5. Test discovery
ossa discovery find --capabilities=my_capability
```

### Platform Development

```bash
# 1. Start development environment
ossa services start

# 2. Check all services healthy
ossa services status

# 3. Create and test agents
ossa create test-agent
ossa api agents create ./test-agent

# 4. Test orchestration
ossa orchestrate create test-workflow
ossa orchestrate run workflow-id

# 5. Monitor platform
ossa api metrics --timeframe=1h
```

### CI/CD Integration

```yaml
# .github/workflows/ossa-validation.yml
name: OSSA Agent Validation
on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install OSSA CLI
        run: npm install -g @bluefly/open-standards-scalable-agents@0.1.8
      
      - name: Start OSSA services
        run: ossa services start
        
      - name: Validate all agents
        run: |
          for agent in */agent.yml; do
            ossa validate "$agent" || exit 1
          done
      
      - name: Test discovery
        run: ossa discovery find --capabilities=test
      
      - name: Check compliance
        run: ossa validate compliance
```

This CLI provides production-ready functionality for comprehensive OSSA v0.1.8 agent management, platform orchestration, and enterprise compliance validation.