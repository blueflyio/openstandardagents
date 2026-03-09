# Unified Agentic Operations Platform - Infrastructure & Task Audit

This document expands on the master task list by defining each task's scope and objective. It also provides a comprehensive mapping of all published application routes to their corresponding network origins, services, and inferred project repositories to help track the active infrastructure footprint.

---

## 1. Task Definitions & Expanded Audit Scope

### OSSA & UI
- **Deploy and publish OSSA 0.4.6**: Release the next minor version of the Open Standard for Software Agents. This standardizes the agent schema and manifesto structure (manifests, communication protocols, etc.).
- **Fix `ossa-ui.blueflyagents.com` Production**: Troubleshoot and resolve any runtime errors, layout issues, or connection problems on the live `ossa-ui` environment.
- **Refactor Website Agent Builder**: 
  - Stop building a duplicate builder in the public website. 
  - Integrate with existing `ossa-ui` API endpoints and components. 
  - Route agent saving, filtering, and curation directly into the `openstandard-generated-agents` backend.
  - Implement a dynamic leaderboard ranking created agents using React on GitLab Pages.
- **Deploy `.org` website**: Push the static or proxy version of the `openstandardagents.org` landing page to GitLab pages for high-availability open-source hosting.

### Drupal Integration & Releases
*Before releasing to Drupal.org, ensure comprehensive systematic automated testing is implemented.*

- **Existing Modules (Updates)**:
  - `ai_agents_ossa`: Deploy the refactored module now encompassing Webhook and Canvas Syncer logic.
  - `api_normalization`: Release alpha4 after confirming CI pipeline cache errors and route configurations are cleanly resolved.
  - `ditta_ccms`: Initial release of the DITA-based component content management system module.
- **New Modules (Initial Release to Drupal.org)**: 
  - Core AI/Agent connectivity: `ai_agents_client`, `ai_agents_kagent`, `ai_agents_communication`, `ai_agents_tunnel`.
  - External / specialized systems: `mcp_registry`, `code_executor`, `dragonfly_client`, `agent_registry_consumer`.
  - UX and Workflows: `agentic_canvas_blocks`, `recipe_onboarding`, `ai_provider_routing_eca` (rules/routing), `alternative_services`, `cedar_policy`.
  - **Theme**: `agentic_canvas` visual frontend theme.

### Security, Auth & Agent Wiring
- **Token Rotation & Service Accounts**: Resolve token expiry issues by shifting to persistent Service Accounts tied directly to Agent Nodes. Implement self-rotation protocols for sustained autonomous operation.
- **Agent Wiring**: Finalize the API mapping so that deployed agents can execute their logic against production endpoints actively rather than sitting idle.
- **GitLab External Agents**: Evaluate running GitLab runners/agents on local infrastructure (e.g., Oracle/NAS) to circumvent SaaS SaaS credit consumption.

### Marketplace & AgentDash Strategy
- **Marketplace POC**: 
  - Frontend users authenticate via GitLab Identity provider.
  - Using OAuth/OIDC, the UI logs into the Drupal Node.
  - Auto-provision a personalized Drupal Marketplace experience stored within individual user-owned GitLab projects.
- **AgentDash Architecture Decision**: Decide whether `AgentDash` (currently a standalone UI) needs to exist separately, or if its feature set should be merged into the Drupal Marketplace backend, OR merged with `Fleet Demo` (which already handles mass Drupal multisite admin).

### Infrastructure Resilience
- **Oracle / NAS Audit**: Scan all running services, storage buckets, and containers across Oracle Cloud and the local Synology NAS to deprecate and delete unused infrastructure, saving resources.
- **Kubernetes IaC Resilience**: Update Helm charts, Terraform, or Flux configurations to include stricter readiness/liveness probes and pod lifecycle policies, preventing `CrashLoopBackOff` or unhealthy pods from stacking and consuming node capacity.

---

## 2. Published Application Routes & Infrastructure Map

The following table categorizes the provided application routes, detailing their backend origins, service roles, and their probable local repository paths for development.

### Core Architecture & API Gateways
| App Route | Internal Origin | Service Role | Project / Repo | Source Path (Worktree Template) |
| :--- | :--- | :--- | :--- | :--- |
| **api.blueflyagents.com** | http://oracle:3085 | Main API Gateway / Proxy | `api-gateway` | `.../api-gateway/<branch>` |
| **mesh.blueflyagents.com** | http://oracle:3005 | Service Mesh / Discovery layer | `bluefly-mesh` | `.../bluefly-mesh/<branch>` |
| **router.blueflyagents.com** | http://oracle:4000 | Semantic/Traffic Router | `agent-router` | `.../agent-router/<branch>` |

### Central Agent Platforms
| App Route | Internal Origin | Service Role | Project / Repo | Source Path (Worktree Template) |
| :--- | :--- | :--- | :--- | :--- |
| **agents.blueflyagents.com** | http://oracle:3001 | OpenStandard Agents API | `openstandard-agents` | `.../openstandard-agents/<branch>` |
| **mcp.blueflyagents.com** | http://oracle:4005 | MCP Server / Registry API | `mcp-registry` | `.../mcp-registry/<branch>` |
| **orchestrator.blueflyagents.com** | http://oracle:3014 | Agent Orchestrator Logic | `agent-orchestrator`| `.../agent-orchestrator/<branch>`|
| **kagent.blueflyagents.com** | http://oracle:30083| K-Agent Backend API | `kagent-backend` | `.../kagent-backend/<branch>` |
| **ecma-agent.blueflyagents.com** | http://oracle:3016 | ECMA-compliant Agent Env | `ecma-agent` | `.../ecma-agent/<branch>` |

### User Interfaces & Dashboards
| App Route | Internal Origin | Service Role | Project / Repo | Source Path (Worktree Template) |
| :--- | :--- | :--- | :--- | :--- |
| **ossa-ui.blueflyagents.com** | http://oracle:3456 | OSSA User Interface / Builder | `ossa-ui` | `.../ossa-ui/<branch>` |
| **studio.blueflyagents.com** | http://oracle:3012 | Agent Studio UI | `agent-studio` | `.../agent-studio/<branch>` |
| **kagent-ui.blueflyagents.com** | http://oracle:30080| K-Agent Dashboard UI | `kagent-ui` | `.../kagent-ui/<branch>` |
| **mcpdash.blueflyagents.com** | http://oracle:3003 | MCP Dashboard | `mcp-dashboard` | `.../mcp-dashboard/<branch>` |
| **adash.blueflyagents.com** | http://oracle:3013 | AgentDash (Production) | `agent-dash` | `.../agent-dash/<branch>` |
| **dev-adash.blueflyagents.com** | http://nas:8081 | AgentDash (Dev Env) | `agent-dash` | (deployed to NAS subset) |
| **dev-mdash.blueflyagents.com** | http://nas:8082 | MDash (Legacy/Dev) | `mdash` | (deployed to NAS subset) |
| **dev-fleet.blueflyagents.com** | http://nas:8083 | Fleet Demo Admin (Dev) | `fleet-demo` | (deployed to NAS subset) |
| **grafana.blueflyagents.com** | http://oracle:30300| Observability / Dashboards | `grafana-config` | `.../infra-mon/<branch>` |

### Data, Memory, & Storage
| App Route | Internal Origin | Service Role | Project / Repo | Source Path (Worktree Template) |
| :--- | :--- | :--- | :--- | :--- |
| **storage.blueflyagents.com** | http://nas:9000 | S3 Storage (MinIO) | `minio-config` | (Infrastructure service) |
| **brain.blueflyagents.com** | http://oracle:6333 | Vector DB (Qdrant) | `qdrant-config` | (Infrastructure service) |
| **dragonfly.blueflyagents.com** | http://oracle:3020 | In-Memory Datastore / Cache | `dragonfly-db` | (Infrastructure service) |
| **gkg.blueflyagents.com** | http://oracle:27495| Global Knowledge Graph (Neo4j?)| `gkg-service` | `.../gkg-service/<branch>` |
| **obsidian.blueflyagents.com** | http://nas:5984 | Local PKM DB (CouchDB sync) | `obsidian-livesync` | (Infrastructure service) |
| **zotero.blueflyagents.com** | https://nas:5006 | Zotero Citation DB Web / Sync | `zotero-web` | (Infrastructure service) |

### Workflows, Policies, & Tooling
| App Route | Internal Origin | Service Role | Project / Repo | Source Path (Worktree Template) |
| :--- | :--- | :--- | :--- | :--- |
| **workflow.blueflyagents.com**| http://oracle:3015 | Workflow API Layer / Engine | `workflow-engine` | `.../workflow-engine/<branch>` |
| **n8n.blueflyagents.com** | http://oracle:5678 | Visual Workflow Builder | `n8n-config` | (Infrastructure service) |
| **flowise.blueflyagents.com** | http://nas:3100 | Visual LLM Workflow Builder | `flowise-config` | (Infrastructure service) |
| **langflow.blueflyagents.com** | http://oracle:7860 | Local LLM Workflow Builder | `langflow-config` | (Infrastructure service) |
| **compliance.blueflyagents.com**| http://oracle:3010 | Rules & Policy monitoring | `compliance-engine`| `.../compliance-engine/<branch>`|
| **content-guardian.blueflyagents.com**| http://oracle:4010 | Malicious/PII Content Filter| `content-guardian` | `.../content-guardian/<branch>`|

### Registries & Ecosystem
| App Route | Internal Origin | Service Role | Project / Repo | Source Path (Worktree Template) |
| :--- | :--- | :--- | :--- | :--- |
| **marketplace.blueflyagents.com**| http://oracle:3090 | Drupal Marketplace POC | `drupal-marketplace`| `.../drupal-marketplace/<branch>`|
| **plugins.blueflyagents.com** | http://oracle:3095 | Global Agent Plugins | `plugin-registry` | `.../plugin-registry/<branch>` |
| **skills.blueflyagents.com** | http://oracle:4010 | Agent Skills Definition API | `skills-registry` | `.../skills-registry/<branch>` |
| **npm.blueflyagents.com** | http://nas:4873 | Private Package Repo (Verdaccio)|`verdaccio-config`| (Infrastructure service) |

### Telemetry & Real-time
| App Route | Internal Origin | Service Role | Project / Repo | Source Path (Worktree Template) |
| :--- | :--- | :--- | :--- | :--- |
| **tracer.blueflyagents.com** | http://oracle:3006 | Agent Traceability (Langfuse?)| `agent-tracer` | `.../agent-tracer/<branch>` |
| **a2a-collector.blueflyagents.com**| http://oracle:9004 | Agent2Agent telemetry | `a2a-collector` | `.../a2a-collector/<branch>` |
| **a2a-stream.blueflyagents.com**| http://oracle:9005 | Telemetry Streaming Router | `a2a-stream` | `.../a2a-stream/<branch>` |

### DevOps, IDE & General Services
| App Route | Internal Origin | Service Role | Project / Repo | Source Path (Worktree Template) |
| :--- | :--- | :--- | :--- | :--- |
| **devops.blueflyagents.com** | http://oracle:3011 | CI/CD Dashboard | `devops-dashboard` | `.../devops-dashboard/<branch>`|
| **dockge.blueflyagents.com** | http://nas:9010 | Docker Compose Manager | `dockge` | (Infrastructure service) |
| **infra.blueflyagents.com** | http://oracle:3030 | General Infra Admin | `infra-admin` | (Infrastructure service) |
| **code.blueflyagents.com** | http://nas:8080 | Web-based IDE (code-server) | `code-server` | (Infrastructure service) |
| **social-api.blueflyagents.com**| http://oracle:3018 | Agent Social Feed API | `social-engine` | `.../social-engine/<branch>` |
| **social.blueflyagents.com** | http://oracle:3018 | Agent Social Matrix UI | `social-ui` | `.../social-ui/<branch>` |
| **chat.blueflyagents.com** | http://oracle:3080 | Conversational Interface | `chat-ui` | `.../chat-ui/<branch>` |
| **nas.blueflyagents.com** | https://nas:5001 | NAS Native OS Interface | `synology-dsm` | N/A |
| **intel.blueflyagents.com** | http://oracle:9006 | Threat/Data Intelligence | `intel-service` | `.../intel-service/<branch>` |
| **openclaw.blueflyagents.com** | http://oracle:18789| OpenClaw Service | `openclaw` | `.../openclaw/<branch>` |
| **happy.blueflyagents.com** | http://oracle:3045 | Diagnostics / Health Check | `happy-service` | `.../happy-service/<branch>` |

---
*Note: Origin configurations map to either `oracle-platform.tailcf98b3.ts.net` (Oracle Cloud Infrastructure) or `blueflynas.tailcf98b3.ts.net` (Synology NAS). Project paths assume the Standard Workflow (`.../agent-platform/${PROJECT}.git`).*
