# OSSA ↔ Drupal Integration Architecture Diagrams

**Visual reference for understanding the integration**

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Component Architecture](#component-architecture)
3. [Data Flow Diagrams](#data-flow-diagrams)
4. [Sequence Diagrams](#sequence-diagrams)
5. [Deployment Architecture](#deployment-architecture)

---

## 1. System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│                         DEVELOPER WORKSPACE                               │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  OSSA Manifests (YAML)                                            │  │
│  │  agents/                                                          │  │
│  │  ├── content-moderator.yaml                                       │  │
│  │  ├── seo-optimizer.yaml                                           │  │
│  │  └── user-analyzer.yaml                                           │  │
│  └───────────────────────────┬──────────────────────────────────────┘  │
│                               │                                          │
└───────────────────────────────┼──────────────────────────────────────────┘
                                │
                                │ ossa export
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        OSSA BUILDKIT (TypeScript)                         │
│                                                                           │
│  ┌─────────────────────┐              ┌─────────────────────┐          │
│  │  Export Command     │              │  Export Command     │           │
│  │  --platform drupal  │              │  --platform         │           │
│  │                     │              │  drupal-config      │           │
│  │  Generates:         │              │                     │           │
│  │  • PHP classes      │              │  Generates:         │           │
│  │  • Services         │              │  • Config YAML      │           │
│  │  • Plugins          │              │  • Entity defs      │           │
│  │  • Tests            │              │  • Schema           │           │
│  └──────────┬──────────┘              └──────────┬──────────┘           │
│             │                                    │                       │
└─────────────┼────────────────────────────────────┼───────────────────────┘
              │                                    │
              │ Module Package                     │ Config Files
              ▼                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           DRUPAL SITE                                     │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Drupal Modules                                                   │  │
│  │                                                                    │  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │ ai_agents (Base Framework)                                  │  │  │
│  │  │ • Plugin system                                             │  │  │
│  │  │ • AgentManager service                                      │  │  │
│  │  │ • AgentExecutor service                                     │  │  │
│  │  │ • Event system                                              │  │  │
│  │  └────────────────────┬───────────────────────────────────────┘  │  │
│  │                       │                                           │  │
│  │       ┌───────────────┼───────────────┐                          │  │
│  │       │               │               │                           │  │
│  │  ┌────▼──────┐  ┌────▼─────────┐  ┌─▼────────────┐             │  │
│  │  │ai_agents  │  │ai_agents_ossa│  │ Generated    │              │  │
│  │  │_ui        │  │              │  │ Agent        │              │  │
│  │  │           │  │• OSSA v0.4.1 │  │ Modules      │              │  │
│  │  │• Admin UI │  │• Config sync │  │              │              │  │
│  │  │• Forms    │  │• REST API    │  │• content_    │              │  │
│  │  │• Reports  │  │• Bridge      │  │  moderator   │              │  │
│  │  └───────────┘  │  integration │  │• seo_        │              │  │
│  │                 └──────┬───────┘  │  optimizer   │              │  │
│  │                        │          └──────────────┘               │  │
│  └────────────────────────┼──────────────────────────────────────┘  │  │
│                           │                                           │  │
│  ┌────────────────────────▼──────────────────────────────────────┐  │  │
│  │  OssaRuntimeBridge (PHP Service)                              │  │  │
│  │  • HTTP client for bridge server                              │  │  │
│  │  • Manifest → Context transformation                          │  │  │
│  │  • Result → AgentResult transformation                        │  │  │
│  └────────────────────────┬──────────────────────────────────────┘  │  │
│                           │                                           │  │
└───────────────────────────┼───────────────────────────────────────────┘
                            │
                            │ HTTP/JSON-RPC
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│               OSSA RUNTIME BRIDGE SERVER (Node.js)                       │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Express Server (Port 9090)                                       │  │
│  │                                                                    │  │
│  │  Routes:                                                          │  │
│  │  • POST /api/execute    - Execute agent                          │  │
│  │  • GET  /health         - Health check                           │  │
│  │  • GET  /metrics        - Prometheus metrics                     │  │
│  └────────────────────────┬─────────────────────────────────────────┘  │
│                           │                                             │
│  ┌────────────────────────▼─────────────────────────────────────────┐  │
│  │  AgentExecutor                                                    │  │
│  │  • Manifest validation                                            │  │
│  │  • MCP client initialization                                      │  │
│  │  • OSSA runtime execution                                         │  │
│  │  • Result formatting                                              │  │
│  └────────────────────────┬─────────────────────────────────────────┘  │
│                           │                                             │
└───────────────────────────┼─────────────────────────────────────────────┘
                            │
                            │ Native TypeScript
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    OSSA RUNTIME (TypeScript SDK)                         │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Agent Execution Engine                                           │  │
│  │  • Load manifest                                                  │  │
│  │  • Connect to MCP servers                                         │  │
│  │  • Execute tools/capabilities                                     │  │
│  │  • Aggregate results                                              │  │
│  └────────────────────────┬─────────────────────────────────────────┘  │
│                           │                                             │
│                           │ MCP Protocol                                │
│                           ▼                                             │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  MCP Servers                                                      │  │
│  │  • Drupal API MCP                                                 │  │
│  │  • OpenAI MCP                                                     │  │
│  │  • Custom MCPs                                                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Architecture

### Drupal Module Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                      ai_agents (Base)                            │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Plugin System                                           │   │
│  │  ├── AgentTypeInterface                                  │   │
│  │  ├── AgentCapabilityInterface                            │   │
│  │  └── AgentActionInterface                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Services                                                │   │
│  │  ├── AgentManager                                        │   │
│  │  ├── AgentExecutor                                       │   │
│  │  ├── AgentValidator                                      │   │
│  │  └── AgentLogger                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Event System                                            │   │
│  │  ├── AgentPreExecuteEvent                                │   │
│  │  ├── AgentPostExecuteEvent                               │   │
│  │  └── AgentErrorEvent                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────────────┬───────────────────────┬──────────────────────┘
                    │                       │
        ┌───────────┴──────────┐     ┌──────┴──────────────┐
        │                      │     │                      │
┌───────▼──────────┐  ┌────────▼────────┐  ┌──────────────▼────────┐
│  ai_agents_ui    │  │ ai_agents_ossa  │  │  Generated Modules    │
│                  │  │                 │  │  (per agent)          │
│  Provides:       │  │  Provides:      │  │                       │
│  • Admin forms   │  │  • Config       │  │  Example:             │
│  • Views         │  │    entities     │  │  content_moderator/   │
│  • Dashboards    │  │  • OSSA bridge  │  │  ├── .info.yml        │
│  • Reports       │  │  • REST API     │  │  ├── .services.yml    │
│  • Permissions   │  │  • Drush cmds   │  │  └── src/             │
│                  │  │  • Config sync  │  │      └── Plugin/      │
└──────────────────┘  └─────────────────┘  │          └── Agent/   │
                                            │              └── *.php│
                                            └───────────────────────┘
```

### OSSA Buildkit Export Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    OSSA Buildkit Export System                   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Input: OSSA Manifest (agents/*.yaml)                   │   │
│  └────────────────────────┬────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Manifest Parser & Validator                            │   │
│  │  • YAML/JSON parsing                                     │   │
│  │  • JSON Schema validation                                │   │
│  │  • OSSA v0.4.1 compliance check                          │   │
│  └────────────────────────┬────────────────────────────────┘   │
│                           │                                     │
│              ┌────────────┴────────────┐                        │
│              │                         │                        │
│              ▼                         ▼                        │
│  ┌─────────────────────┐   ┌─────────────────────┐            │
│  │  Drupal Platform    │   │  Drupal Config      │            │
│  │  Exporter           │   │  Platform Exporter  │            │
│  │                     │   │                     │            │
│  │  Generates:         │   │  Generates:         │            │
│  │  ├── Module info    │   │  ├── Config YAML    │            │
│  │  ├── Services       │   │  ├── Entity schemas │            │
│  │  ├── Plugin classes │   │  └── Install configs│            │
│  │  ├── Templates      │   │                     │            │
│  │  └── Tests          │   │                     │            │
│  └──────────┬──────────┘   └──────────┬──────────┘            │
│             │                         │                        │
│             ▼                         ▼                        │
│  ┌─────────────────────┐   ┌─────────────────────┐            │
│  │  Template Engine    │   │  Config Builder     │            │
│  │  (Handlebars/EJS)   │   │  (YAML Generator)   │            │
│  └──────────┬──────────┘   └──────────┬──────────┘            │
│             │                         │                        │
│             ▼                         ▼                        │
│  ┌─────────────────────┐   ┌─────────────────────┐            │
│  │  Output:            │   │  Output:            │            │
│  │  Drupal Module      │   │  Config YAML        │            │
│  │  (modules/custom/)  │   │  (config/sync/)     │            │
│  └─────────────────────┘   └─────────────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Flow Diagrams

### Configuration Import Flow

```
┌───────────┐
│ Developer │
└─────┬─────┘
      │
      │ 1. Create/edit OSSA manifest
      ▼
┌─────────────────────┐
│ agents/*.yaml       │
│ (OSSA v0.4.1)       │
└─────┬───────────────┘
      │
      │ 2. ossa export --platform drupal-config
      ▼
┌─────────────────────┐
│ Buildkit Exporter   │
│ • Parse manifest    │
│ • Validate schema   │
│ • Transform to      │
│   Drupal config     │
└─────┬───────────────┘
      │
      │ 3. Generate YAML
      ▼
┌─────────────────────┐
│ config/sync/        │
│ • ossa_manifest.*   │
│ • ossa_agent.*      │
└─────┬───────────────┘
      │
      │ 4. drush config:import
      ▼
┌─────────────────────┐
│ Drupal Config API   │
│ • Schema validation │
│ • Dependency check  │
│ • Entity creation   │
└─────┬───────────────┘
      │
      │ 5. Create entities
      ▼
┌─────────────────────┐
│ Config Entities     │
│ • ossa_manifest     │
│ • ossa_agent        │
└─────┬───────────────┘
      │
      │ 6. Plugin discovery
      ▼
┌─────────────────────┐
│ Agent Available     │
│ Ready to execute    │
└─────────────────────┘
```

### Agent Execution Flow

```
┌─────────┐
│  User   │
└────┬────┘
     │
     │ 1. Trigger execution (UI or API)
     ▼
┌──────────────────────┐
│ Drupal UI/REST API   │
│ /admin/ai/agents/X   │
│ POST /api/ossa/X     │
└────┬─────────────────┘
     │
     │ 2. Load agent config
     ▼
┌──────────────────────┐
│ AgentManager         │
│ • Load ossa_agent    │
│ • Load ossa_manifest │
│ • Check permissions  │
└────┬─────────────────┘
     │
     │ 3. Prepare execution
     ▼
┌──────────────────────┐
│ AgentExecutor        │
│ • Validate context   │
│ • Emit PRE_EXECUTE   │
└────┬─────────────────┘
     │
     │ 4. Call bridge
     ▼
┌──────────────────────┐
│ OssaRuntimeBridge    │
│ HTTP POST to bridge  │
│ /api/execute         │
└────┬─────────────────┘
     │
     │ 5. JSON-RPC request
     ▼
┌──────────────────────┐
│ Bridge Server        │
│ (Node.js/Express)    │
│ • Validate manifest  │
│ • Create executor    │
└────┬─────────────────┘
     │
     │ 6. Native execution
     ▼
┌──────────────────────┐
│ OSSA Runtime         │
│ • Connect MCP        │
│ • Execute tools      │
│ • Aggregate results  │
└────┬─────────────────┘
     │
     │ 7. Return results
     ▼
┌──────────────────────┐
│ Bridge Server        │
│ Format response      │
└────┬─────────────────┘
     │
     │ 8. HTTP response
     ▼
┌──────────────────────┐
│ OssaRuntimeBridge    │
│ Parse JSON           │
│ Create AgentResult   │
└────┬─────────────────┘
     │
     │ 9. Post-process
     ▼
┌──────────────────────┐
│ AgentExecutor        │
│ • Emit POST_EXECUTE  │
│ • Log execution      │
│ • Update status      │
└────┬─────────────────┘
     │
     │ 10. Display results
     ▼
┌──────────────────────┐
│ Drupal UI/REST API   │
│ Show result to user  │
└──────────────────────┘
```

### Bidirectional Config Sync Flow

```
┌────────────────┐                          ┌────────────────┐
│ OSSA Manifests │◄────────────────────────►│ Drupal Config  │
│ (agents/*.yaml)│                          │ (ossa_manifest)│
└────────┬───────┘                          └───────┬────────┘
         │                                          │
         │ Forward Sync                   Reverse Sync
         │ (ossa export)                  (drush export)
         │                                          │
         ▼                                          ▼
┌──────────────────────────────────────────────────────────────┐
│                      Sync Process                             │
│                                                                │
│  Forward: OSSA → Drupal                                       │
│  1. Parse OSSA manifest                                       │
│  2. Transform to Drupal config schema                         │
│  3. Generate config YAML                                      │
│  4. Import via drush config:import                            │
│                                                                │
│  Reverse: Drupal → OSSA                                       │
│  1. Load ossa_manifest entity                                 │
│  2. Extract manifest_data                                     │
│  3. Format as OSSA v0.4.1                                     │
│  4. Write to agents/*.yaml                                    │
│                                                                │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            │ Validate sync
                            ▼
                ┌─────────────────────────┐
                │ drush ossa:validate-sync│
                │ • Compare both sources  │
                │ • Report differences    │
                │ • Warn if out of sync   │
                └─────────────────────────┘
```

---

## 4. Sequence Diagrams

### Full Request/Response Cycle

```
Developer    OSSA       Drupal      Bridge      OSSA        MCP
            Buildkit    Module      Server     Runtime    Servers
    │           │          │           │           │          │
    │ 1. Edit   │          │           │           │          │
    │ manifest  │          │           │           │          │
    ├──────────►│          │           │           │          │
    │           │          │           │           │          │
    │ 2. Export │          │           │           │          │
    │   module  │          │           │           │          │
    ├──────────►│          │           │           │          │
    │           │          │           │           │          │
    │           │ 3. Gen   │           │           │          │
    │           │  PHP code│           │           │          │
    │           ├─────────►│           │           │          │
    │           │          │           │           │          │
    │ 4. Install│          │           │           │          │
    │   module  │          │           │           │          │
    ├─────────────────────►│           │           │          │
    │           │          │           │           │          │
    │ 5. Execute│          │           │           │          │
    │   agent   │          │           │           │          │
    ├─────────────────────►│           │           │          │
    │           │          │           │           │          │
    │           │          │ 6. HTTP   │           │          │
    │           │          │   POST    │           │          │
    │           │          ├──────────►│           │          │
    │           │          │           │           │          │
    │           │          │           │ 7. Execute│          │
    │           │          │           │   manifest│          │
    │           │          │           ├──────────►│          │
    │           │          │           │           │          │
    │           │          │           │           │ 8. Connect│
    │           │          │           │           │   MCP    │
    │           │          │           │           ├─────────►│
    │           │          │           │           │          │
    │           │          │           │           │ 9. Tools │
    │           │          │           │           │◄─────────┤
    │           │          │           │           │          │
    │           │          │           │           │ 10. Results│
    │           │          │           │           │◄─────────┤
    │           │          │           │           │          │
    │           │          │           │ 11. Agg   │          │
    │           │          │           │   results │          │
    │           │          │           │◄──────────┤          │
    │           │          │           │           │          │
    │           │          │ 12. HTTP  │           │          │
    │           │          │   Response│           │          │
    │           │          │◄──────────┤           │          │
    │           │          │           │           │          │
    │           │  13. Format│          │           │          │
    │           │  AgentResult│         │           │          │
    │           │◄─────────┤│          │           │          │
    │           │          │           │           │          │
    │ 14. Display│         │           │           │          │
    │   results │          │           │           │          │
    │◄─────────────────────┤           │           │          │
    │           │          │           │           │          │
```

---

## 5. Deployment Architecture

### Development Environment

```
┌─────────────────────────────────────────────────────────────┐
│                    Developer Laptop                          │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   VSCode     │  │  Terminal    │  │   Browser    │       │
│  │   Editor     │  │  (Drush)     │  │  localhost   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Docker Compose                                      │    │
│  │                                                       │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │    │
│  │  │  Drupal     │  │  Bridge     │  │  PostgreSQL │ │    │
│  │  │  (PHP-FPM)  │  │  (Node.js)  │  │  Database   │ │    │
│  │  │  Port: 8080 │  │  Port: 9090 │  │  Port: 5432 │ │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │    │
│  │                                                       │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │    │
│  │  │  Redis      │  │  Mailhog    │  │  Adminer    │ │    │
│  │  │  Port: 6379 │  │  Port: 8025 │  │  Port: 8081 │ │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### Production Environment

```
┌───────────────────────────────────────────────────────────────┐
│                      Internet (HTTPS)                          │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           ▼
┌───────────────────────────────────────────────────────────────┐
│                    Load Balancer (nginx)                       │
│                    SSL Termination                             │
└──────────────────────────┬────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌───────────┐   ┌───────────┐   ┌───────────┐
    │ Drupal 1  │   │ Drupal 2  │   │ Drupal N  │
    │ PHP-FPM   │   │ PHP-FPM   │   │ PHP-FPM   │
    │ + Nginx   │   │ + Nginx   │   │ + Nginx   │
    └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
          │               │               │
          └───────────────┼───────────────┘
                          │
                          ▼
            ┌──────────────────────────┐
            │  PostgreSQL (Primary)    │
            │  + Read Replicas (2)     │
            └──────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ Bridge 1 │    │ Bridge 2 │    │ Bridge N │
    │ Node.js  │    │ Node.js  │    │ Node.js  │
    │ PM2      │    │ PM2      │    │ PM2      │
    └──────────┘    └──────────┘    └──────────┘
          │               │               │
          └───────────────┼───────────────┘
                          │
                          ▼
            ┌──────────────────────────┐
            │  MCP Servers (External)  │
            │  • Drupal API MCP        │
            │  • OpenAI MCP            │
            │  • Custom MCPs           │
            └──────────────────────────┘
```

### Kubernetes Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                        │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Namespace: ossa-production                            │ │
│  │                                                         │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  Ingress (nginx-ingress)                         │ │ │
│  │  │  • HTTPS/TLS                                      │ │ │
│  │  │  • Load balancing                                 │ │ │
│  │  └───────────────┬──────────────────────────────────┘ │ │
│  │                  │                                     │ │
│  │       ┌──────────┼──────────┐                         │ │
│  │       │          │          │                          │ │
│  │  ┌────▼────┐ ┌───▼────┐ ┌──▼────────┐               │ │
│  │  │ Service │ │ Service│ │ Service   │                │ │
│  │  │ (Drupal)│ │ (Bridge│ │ (Postgres)│                │ │
│  │  └────┬────┘ └───┬────┘ └──┬────────┘               │ │
│  │       │          │          │                          │ │
│  │  ┌────▼─────────────────────▼─────┐  ┌──────────┐   │ │
│  │  │  Deployment: drupal            │  │StatefulSet│   │ │
│  │  │  • Replicas: 3                 │  │ postgres  │   │ │
│  │  │  • Image: drupal:10-fpm-alpine │  │ replicas:3│   │ │
│  │  │  • PVC: drupal-files           │  └──────────┘   │ │
│  │  └────────────────────────────────┘                  │ │
│  │                                                       │ │
│  │  ┌────────────────────────────────┐                  │ │
│  │  │  Deployment: ossa-bridge       │                  │ │
│  │  │  • Replicas: 3                 │                  │ │
│  │  │  • Image: ossa/bridge:v1.0.0   │                  │ │
│  │  │  • HPA: 3-10 replicas          │                  │ │
│  │  └────────────────────────────────┘                  │ │
│  │                                                       │ │
│  │  ┌────────────────────────────────┐                  │ │
│  │  │  ConfigMap                     │                  │ │
│  │  │  • Drupal settings             │                  │ │
│  │  │  • Bridge config               │                  │ │
│  │  └────────────────────────────────┘                  │ │
│  │                                                       │ │
│  │  ┌────────────────────────────────┐                  │ │
│  │  │  Secrets                       │                  │ │
│  │  │  • Database credentials        │                  │ │
│  │  │  • API tokens                  │                  │ │
│  │  └────────────────────────────────┘                  │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Network Communication Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Network Architecture                      │
│                                                               │
│  ┌────────────┐      HTTP/HTTPS       ┌────────────┐        │
│  │   Client   │◄────────────────────►│ Load       │         │
│  │  (Browser) │      Port: 443       │ Balancer   │         │
│  └────────────┘                      └──────┬─────┘         │
│                                             │                │
│                                 ┌───────────┼───────────┐   │
│                                 │           │           │    │
│                          ┌──────▼──┐ ┌──────▼──┐ ┌─────▼──┐│
│                          │ Drupal 1│ │ Drupal 2│ │Drupal N││
│                          │:8080    │ │:8080    │ │:8080   ││
│                          └────┬────┘ └────┬────┘ └────┬───┘│
│                               │           │           │     │
│                               └───────────┼───────────┘     │
│                                          │                  │
│                           Internal HTTP  │                  │
│                           Port: 9090     │                  │
│                                          │                  │
│                          ┌───────────────▼──────────────┐  │
│                          │    Bridge Server(s)          │  │
│                          │    :9090                      │  │
│                          └───────────────┬──────────────┘  │
│                                          │                  │
│                           HTTPS/WSS     │                  │
│                           External      │                  │
│                                          │                  │
│                          ┌───────────────▼──────────────┐  │
│                          │    MCP Servers (External)    │  │
│                          │    • Drupal API: 8080/mcp    │  │
│                          │    • OpenAI: api.openai.com  │  │
│                          └──────────────────────────────┘  │
│                                                             │
│  Database Connection (PostgreSQL):                         │
│  Drupal → PostgreSQL :5432 (internal)                      │
│  Redis → :6379 (caching)                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                           │
│                                                               │
│  Layer 1: Network Security                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  • HTTPS/TLS 1.3 (Let's Encrypt)                       │ │
│  │  • WAF (Web Application Firewall)                      │ │
│  │  • Rate limiting (per IP/user)                         │ │
│  │  • DDoS protection (Cloudflare)                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  Layer 2: Application Security (Drupal)                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  • Drupal permissions system                           │ │
│  │  • OAuth2/JWT authentication                           │ │
│  │  • CSRF protection                                      │ │
│  │  • Input validation & sanitization                     │ │
│  │  • Content Security Policy (CSP)                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  Layer 3: Bridge Security                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  • API key authentication                              │ │
│  │  • Request signing (HMAC)                              │ │
│  │  • Manifest validation                                  │ │
│  │  • Timeout enforcement                                  │ │
│  │  • Resource limits                                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  Layer 4: Data Security                                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  • Encrypted at rest (database)                        │ │
│  │  • Encrypted in transit (TLS)                          │ │
│  │  • Secrets management (Vault/K8s Secrets)              │ │
│  │  • Audit logging                                        │ │
│  │  • PII anonymization                                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  Layer 5: Runtime Security                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  • Sandboxed execution (containers)                    │ │
│  │  • Resource quotas (CPU/memory)                        │ │
│  │  • Network policies (K8s)                              │ │
│  │  • Process isolation                                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

**End of Diagrams Document**

**Note**: These are ASCII diagrams for documentation. For presentations, consider rendering them with tools like:
- Mermaid.js (https://mermaid.js.org)
- PlantUML (https://plantuml.com)
- Diagrams.net (https://app.diagrams.net)

**Related Documents**:
- `DRUPAL_INTEGRATION_ARCHITECTURE.md` - Full architecture specification
- `DRUPAL_INTEGRATION_QUICKSTART.md` - Quick start guide for developers
