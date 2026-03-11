---
name: drupal-cms2
description: "Drupal CMS 2.0 ecosystem — Canvas, Drupal AI, AI Agents, MCP Server, ECA, Orchestration, FlowDrop, Site Templates, DXP 2.0."
triggers:
  - pattern: "drupal.*cms.*2|cms.*2\\.0|starshot|site.*template"
    priority: critical
  - pattern: "canvas|experience.*builder|xb|sdc|single.*directory.*component"
    priority: critical
  - pattern: "drupal.*ai|ai_agents|ai.*agent|ai.*module|ai.*provider"
    priority: critical
  - pattern: "mcp.*server|mcp.*drupal|mcp.*tool|mcp.*sdk|php.*mcp"
    priority: critical
  - pattern: "eca|event.*condition.*action|no.*code.*automation"
    priority: high
  - pattern: "orchestration|activepieces|flowdrop|workflow.*builder"
    priority: high
  - pattern: "dxp.*2|ai.*page.*generation|context.*control|modeler.*api"
    priority: medium
allowed-tools:
  - Read
  - Bash
  - WebFetch
  - WebSearch
---

# Drupal CMS 2.0 Ecosystem

## Platform Overview

**Drupal CMS 2.0** (Starshot initiative) — released January 28, 2026 — repackages Drupal as a no-code-first, AI-powered CMS using Recipes, Canvas, and a curated extension ecosystem. It is a distribution layer on top of Drupal core, not a fork.

| Component | Version | Role |
|-----------|---------|------|
| Drupal CMS | 2.0 (Jan 2026) | No-code-first distribution |
| Canvas (formerly XB) | Core (Dec 2025) | Visual page builder |
| Drupal AI | 1.2.10 | AI provider abstraction |
| AI Agents | 1.2.2 | Tool-calling agent framework |
| MCP Server | dev (PHP SDK) | Model Context Protocol server |
| ECA | Stable | No-code event-condition-action |
| Orchestration | 1.0.0 | External automation bridge |
| FlowDrop | 1.0.0-alpha4 | Visual workflow builder |

## Architecture: CMS 2.0 Stack

```
┌─────────────────────────────────────────────────┐
│                 Drupal CMS 2.0                   │
│  (Recipes + Curated Extensions + Site Templates) │
├─────────────────────────────────────────────────┤
│  Canvas (Visual Page Building)                   │
│  ├── SDC Components (Twig + YAML)               │
│  ├── React Frontend (Drag/Drop)                 │
│  ├── AI Page Generation                         │
│  └── Context Control Center (Brand Voice)       │
├─────────────────────────────────────────────────┤
│  AI Layer                                        │
│  ├── Drupal AI (48+ providers, 9 operation types)│
│  ├── AI Agents (tool-calling, Modeler API)       │
│  └── MCP Server (PHP SDK, OAuth 2.1)            │
├─────────────────────────────────────────────────┤
│  Automation Layer                                │
│  ├── ECA (internal event-condition-action)       │
│  ├── Orchestration (Activepieces bridge)         │
│  └── FlowDrop (visual workflow builder)          │
├─────────────────────────────────────────────────┤
│  Drupal Core 11 (PHP 8.2+, Symfony 7)           │
└─────────────────────────────────────────────────┘
```

## CMS 2.0 Concepts

### Recipes
Recipes are Drupal's composable installation packages — YAML-based config + code that apply modules, config, content types, and permissions in a single operation. CMS 2.0 ships ~30 curated recipes (blog, events, media, SEO, etc.) that users apply from the dashboard.

```bash
# Apply a recipe
php core/scripts/drupal recipe recipes/my_recipe

# Recipe structure
recipes/my_recipe/
├── recipe.yml          # Metadata, dependencies, config actions
├── config/
│   └── *.yml           # Config entities to import
├── content/            # Default content (optional)
└── templates/          # Twig templates (optional)
```

### Site Template Marketplace
Commercial evolution of Recipes. MVP expected DrupalCon Chicago (March 2026). Site Templates bundle recipes + theme + demo content into turnkey starting points purchased from a marketplace.

---

## Canvas (formerly Experience Builder / XB)

Canvas is Drupal's visual, component-based page builder. Released December 4, 2025. Default editor in CMS 2.0. Built on React frontend + Drupal backend.

### Core Architecture

| Layer | Technology | Function |
|-------|-----------|----------|
| Frontend | React + TypeScript | Drag-and-drop editing, live preview |
| Component System | SDC (Single Directory Components) | Reusable, self-contained components |
| Data Binding | Twig + YAML schema | Dynamic field mapping |
| AI Integration | Drupal AI module | Generate complete designed pages |
| Brand Control | Context Control Center | Enforce brand voice, colors, tone |

### Single Directory Components (SDC)

SDC is the foundation of Canvas. Each component is a self-contained directory:

```
components/my_card/
├── my_card.component.yml    # Schema: props, slots, metadata
├── my_card.twig             # Template
├── my_card.css              # Styles (scoped)
├── my_card.js               # Behavior (optional)
└── thumbnail.png            # Preview image for Canvas UI
```

**component.yml schema:**
```yaml
name: My Card
status: stable
props:
  type: object
  properties:
    title:
      type: string
      title: Card Title
    image:
      type: object
      title: Card Image
      properties:
        src:
          type: string
          format: uri
        alt:
          type: string
    variant:
      type: string
      title: Style Variant
      enum: [default, featured, compact]
slots:
  body:
    title: Card Body
```

### AI Page Generation

Canvas integrates with Drupal AI to generate complete designed pages from text prompts. The AI respects the Context Control Center's brand guidelines.

```
User prompt: "Create a services page for our consulting firm"
    ↓
Canvas AI → Drupal AI (provider: Anthropic/OpenAI/etc.)
    ↓
Generated page layout using existing SDC components
    ↓
User reviews, edits in Canvas drag-and-drop editor
```

### Context Control Center

Stores brand voice, color palette, tone, and style preferences. AI page generation and content tools reference this context to produce on-brand outputs.

### Canvas Development Workflow

```bash
# 1. Create SDC component in module worktree or demo site
# Worktree (preferred): worktrees/<module>/<branch>/components/agent_card/
# Demo site: WORKING_DEMOs/Drupal_AgentDash/web/modules/custom/<module>/components/agent_card/

# 2. Define component schema + template
# (see SDC structure above)

# 3. Clear cache — Canvas discovers new components automatically
cd WORKING_DEMOs/Drupal_AgentDash && ddev drush cr

# 4. Component appears in Canvas sidebar for drag-and-drop use
```

**Critical**: Custom code lives in individual git repos under `__BARE_REPOS/agent-platform/drupal/`. Use git worktrees for development (`worktrees/<project>/<branch>/`). Demo sites in `WORKING_DEMOs/` are for testing/reference.

---

## Drupal AI Module

**Package**: `drupal/ai` v1.2.10 | **Sites**: 7,500+ | **Maintainers**: marcoscano, berdir

Abstraction layer connecting Drupal to 48+ AI providers through a unified API.

### Provider Support

| Provider | Package | Models |
|----------|---------|--------|
| Anthropic | `drupal/ai_provider_anthropic` | Claude 4 Opus, Sonnet, Haiku |
| OpenAI | `drupal/ai_provider_openai` | GPT-4o, o1, o3, DALL-E |
| AWS Bedrock | `drupal/ai_provider_aws_bedrock` | Cross-provider via AWS |
| Google Gemini | `drupal/ai_provider_google` | Gemini 2.0, 1.5 |
| Ollama | `drupal/ai_provider_ollama` | Local/self-hosted models |
| LM Studio | `drupal/ai_provider_lmstudio` | Local inference |
| Hugging Face | `drupal/ai_provider_huggingface` | Open-source models |
| Groq | `drupal/ai_provider_groq` | Fast inference |

### Operation Types

| Operation | Description | Use Case |
|-----------|------------|----------|
| `chat` | Conversational AI | Content generation, Q&A |
| `text_to_image` | Image generation | Media creation |
| `image_to_text` | Vision/OCR | Alt text, image analysis |
| `embeddings` | Vector embeddings | Semantic search, RAG |
| `moderation` | Content moderation | UGC safety |
| `text_to_speech` | Audio generation | Accessibility |
| `speech_to_text` | Transcription | Media processing |
| `translation` | Language translation | Multilingual content |
| `text_to_video` | Video generation | Dynamic media |

### Submodules

| Submodule | Function |
|-----------|----------|
| **AI Core** | Provider management, operation routing, config UI |
| **AI Explorer** | Interactive playground for testing providers/operations |
| **AI Automators** | Rule-based AI actions on content events |
| **AI Search** | AI-powered search with embeddings and vector stores |
| **AI Assistants API** | Persistent AI assistants with memory |
| **AI CKeditor** | AI writing tools in the rich text editor |
| **AI Content** | Auto-generate content fields (title, body, summary, alt text) |
| **AI Translate** | AI-powered translation (vs. traditional MT) |
| **AI Validations** | AI-based content quality checks before publishing |

### Configuration

```bash
# Install with providers
ddev composer require drupal/ai drupal/ai_provider_anthropic

# Enable
ddev drush en ai ai_provider_anthropic

# Configure at /admin/config/ai/settings
# Set default provider per operation type
# API keys stored in key module (recommended) or config
```

### Developer API

```php
// Get AI service
$ai = \Drupal::service('ai.provider');

// Chat completion
$response = $ai->chat([
  ['role' => 'user', 'content' => 'Summarize this article'],
], 'anthropic', 'claude-sonnet-4-5-20250929');

// Generate embeddings
$embeddings = $ai->embeddings('Search query text', 'openai', 'text-embedding-3-small');

// Generate image
$image = $ai->textToImage('A futuristic city skyline', 'openai', 'dall-e-3');
```

---

## AI Agents Module

**Package**: `drupal/ai_agents` v1.2.2 | **Sites**: 6,780+ | **Maintainers**: marcoscano

Framework for building text-to-action agents that manipulate Drupal config and content via tool-calling.

### Architecture

```
User Prompt → Agent Router → Selected Agent
    ↓
Agent uses Tool-Calling loop:
    1. LLM decides which tools to call
    2. Agent executes tools (Drupal API operations)
    3. Results fed back to LLM
    4. Repeat until task complete
    ↓
Result: Config/content changes applied to Drupal
```

### Bundled Agents

| Agent | Function | Tools Used |
|-------|----------|------------|
| **Field Type Agent** | Creates/modifies field definitions | Field API, Entity API |
| **Content Type Agent** | Scaffolds content types with fields | Node Type API, Field API |
| **Taxonomy Agent** | Creates vocabularies and terms | Taxonomy API |

### Custom Agent Development

Agents are Drupal plugins implementing `AiAgentInterface`:

```php
namespace Drupal\my_module\Plugin\AiAgent;

use Drupal\ai_agents\Plugin\AiAgentBase;
use Drupal\ai_agents\Attribute\AiAgent;

#[AiAgent(
  id: 'my_custom_agent',
  label: 'My Custom Agent',
  description: 'Performs custom operations',
)]
class MyCustomAgent extends AiAgentBase {

  public function getTools(): array {
    return [
      'create_content' => [
        'description' => 'Creates a new content node',
        'parameters' => [
          'title' => ['type' => 'string', 'required' => TRUE],
          'body' => ['type' => 'string'],
          'content_type' => ['type' => 'string', 'required' => TRUE],
        ],
      ],
    ];
  }

  public function executeTool(string $tool, array $params): mixed {
    return match($tool) {
      'create_content' => $this->createContent($params),
      default => throw new \InvalidArgumentException("Unknown tool: $tool"),
    };
  }
}
```

### Modeler API

Visual graph-based agent configuration. FlowDrop UI Agents module provides a drag-and-drop editor for designing agent flows using the Modeler API.

### Configuration

```
/admin/config/ai/agents          → Agent management
/admin/config/ai/agents/explorer → Test agents interactively
```

---

## MCP Server Module

**Package**: `drupal/mcp_server` | Built on official **PHP MCP SDK** (PHP Foundation + Symfony)

Exposes Drupal as an MCP (Model Context Protocol) server, allowing external AI tools (Claude Desktop, Cursor, IDEs) to interact with Drupal content and configuration.

### Architecture

```
External AI Tool (Claude Desktop, Cursor, etc.)
    ↓ MCP Protocol
┌──────────────────────────────────┐
│ Drupal MCP Server                │
│ ├── Tool API (expose operations) │
│ ├── Resource API (expose content)│
│ ├── OAuth 2.1 (authentication)   │
│ └── Transports:                  │
│     ├── STDIO (Drush/CLI)        │
│     └── HTTP (/_mcp endpoint)    │
└──────────────────────────────────┘
```

### Transports

| Transport | Use Case | Configuration |
|-----------|----------|---------------|
| **STDIO** | Claude Desktop, local IDE | Via Drush command, configure in `claude_desktop_config.json` |
| **HTTP** | Remote/web-based AI tools | `/_mcp` endpoint, OAuth 2.1 auth |

### STDIO Transport (Claude Desktop)

```json
// claude_desktop_config.json
{
  "mcpServers": {
    "drupal": {
      "command": "ddev",
      "args": ["drush", "mcp:server"],
      "cwd": "/path/to/WORKING_DEMOs/Drupal_AgentDash"
    }
  }
}
```

### HTTP Transport

Endpoint: `https://your-site.com/_mcp`

OAuth 2.1 authentication required. Configure consumers at `/admin/config/services/mcp-server`.

### Tool Management

```
/admin/config/services/mcp-server/tools → Enable/disable exposed tools
```

Tools are Drupal plugins. Custom tools extend the Tool API:

```php
namespace Drupal\my_module\Plugin\McpTool;

use Drupal\mcp_server\Plugin\McpToolBase;
use Drupal\mcp_server\Attribute\McpTool;

#[McpTool(
  id: 'content_search',
  name: 'Search Content',
  description: 'Search Drupal content by keyword',
)]
class ContentSearchTool extends McpToolBase {

  public function getInputSchema(): array {
    return [
      'type' => 'object',
      'properties' => [
        'query' => ['type' => 'string', 'description' => 'Search keywords'],
        'content_type' => ['type' => 'string', 'description' => 'Content type filter'],
      ],
      'required' => ['query'],
    ];
  }

  public function execute(array $input): mixed {
    // Use Drupal's entity query / search API
    $query = \Drupal::entityQuery('node')
      ->condition('status', 1)
      ->condition('title', $input['query'], 'CONTAINS')
      ->accessCheck(TRUE);

    if (!empty($input['content_type'])) {
      $query->condition('type', $input['content_type']);
    }

    return $query->execute();
  }
}
```

### Legacy MCP Module

**Package**: `drupal/mcp` v1.2.3 — original JSON-RPC implementation. Endpoint: `/mcp/post`. Being merged into `mcp_server`. Uses `McpJsonRpc` plugin architecture (Initialize, ResourcesList, ResourcesRead, ToolsList, ToolsCall).

**Migration**: New projects should use `drupal/mcp_server`. Existing `drupal/mcp` installations will get a migration path.

---

## ECA (Event-Condition-Action)

**Package**: `drupal/eca` | Stable | No-code automation engine

ECA is Drupal's rules/automation engine — a replacement for the legacy Rules module. It processes Drupal events against condition-action models stored as configuration entities.

### Architecture

```
Event (Drupal hook/event fires)
    ↓
Condition(s) evaluated (AND/OR logic)
    ↓ (if TRUE)
Action(s) executed (sequentially or branched)
```

### Event Types

| Category | Examples |
|----------|----------|
| Content | Node insert, update, delete, presave |
| User | Login, registration, role change |
| Form | Submission, validation, alter |
| System | Cron, cache clear, config change |
| Custom | Any Symfony event or Drupal hook |
| AI | AI operation complete, agent task done |

### ECA + AI Integration

ECA can trigger AI operations and respond to AI events:

```yaml
# Example: Auto-generate alt text on image upload
event: entity_presave (media)
conditions:
  - field_is_empty: field_media_image.alt
actions:
  - ai_image_to_text:
      provider: anthropic
      model: claude-sonnet-4-5-20250929
      source_field: field_media_image
      target_field: field_media_image.alt
```

### ECA + Orchestration

ECA handles internal Drupal events. For external system integration, ECA events can trigger the Orchestration module to call external APIs/workflows.

### Configuration

```
/admin/config/workflow/eca → ECA model management
```

ECA models are exportable config entities — deploy via `drush cex/cim` and config_split per environment.

---

## Orchestration Module

**Package**: `drupal/orchestration` v1.0.0 (Oct 2025) | **Maintainers**: jurgenhaas, dries, smulvih2

Bidirectional bridge between Drupal and external automation platforms.

### Supported Platforms

| Platform | Status | Direction |
|----------|--------|-----------|
| **Activepieces** | Stable | Bidirectional |
| **n8n** | Planned | Bidirectional |
| **Zapier** | Planned | Bidirectional |
| **Make (Integromat)** | Planned | Bidirectional |

### Architecture

```
┌─────────────┐                    ┌──────────────────┐
│   Drupal     │ ──── Triggers ──→ │  Activepieces    │
│              │                    │  (Workflows)     │
│  ECA Events  │ ←── Responses ─── │                  │
│  AI Agents   │                    │  500+ app        │
│  MCP Tools   │ ──── Exposes ───→ │  integrations    │
│  Content API │                    │                  │
└─────────────┘                    └──────────────────┘
```

### Drupal → External

| Trigger | Description |
|---------|-------------|
| Content events | Node create/update/delete fires external workflow |
| User events | Registration, login, role change |
| Form submissions | Webform/contact form → CRM/email platform |
| ECA actions | Any ECA action can trigger orchestration |
| Cron/scheduled | Periodic data sync |

### External → Drupal

| Action | Description |
|--------|-------------|
| Content CRUD | Create/update/delete nodes from external system |
| User management | Create users, assign roles |
| AI agent invocation | Trigger Drupal AI agents from external workflows |
| MCP tool execution | Call MCP-exposed tools from external systems |
| Config changes | Apply config via orchestration |

### DXP 2.0 Strategic Vision

Drupal positions itself as the central orchestration hub in the enterprise stack:

```
CRM (Salesforce/HubSpot) ↔ Orchestration ↔ Drupal CMS
Email (Mailchimp/etc.)   ↔ Orchestration ↔ ECA + AI Agents
Analytics (GA4/etc.)     ↔ Orchestration ↔ Content Pipeline
DAM/PIM                  ↔ Orchestration ↔ Media System
```

---

## FlowDrop

**Package**: `drupal/flowdrop` v1.0.0-alpha4 | Visual workflow builder

FlowDrop is a native Drupal visual workflow builder comparable to n8n or Langflow, but integrated directly with Drupal's entity/plugin system.

### Core Features

| Feature | Description |
|---------|-------------|
| Visual editor | Drag-and-drop node graph |
| 25+ node processors | Built-in processing nodes |
| Human-in-the-loop | Approval/review steps in workflows |
| Event-driven | Trigger on Drupal events or schedules |
| Branching | Conditional paths in workflow |
| Error handling | Retry, fallback, notification on failure |

### Related Modules

| Module | Version | Function |
|--------|---------|----------|
| **FlowDrop** | 1.0.0-alpha4 | Core workflow engine + visual editor |
| **FlowDrop AI Provider** | Stable | Connects FlowDrop to Drupal AI providers |
| **FlowDrop Agents** | Stable | Runs AI Agents as workflow nodes |
| **FlowDrop UI Agents** | Stable | Visual editor for AI Agent flows (Modeler API) |

### FlowDrop + AI Agents

FlowDrop UI Agents provides a visual drag-and-drop editor for designing AI Agent flows using the Modeler API. This means you can visually connect agent steps, tools, decision points, and human review gates.

```
[Trigger: Content Created]
    ↓
[AI Agent: Classify Content] → tool: taxonomy_classify
    ↓
[Condition: Needs Review?]
    ├── Yes → [Human Review Step]
    │           ↓
    │         [AI Agent: Generate Summary] → tool: summarize
    │           ↓
    │         [Action: Publish]
    └── No  → [Action: Auto-Publish]
```

### FlowDrop + MCP

FlowDrop can use MCP Client to call external MCP servers as workflow nodes, and MCP Server can expose FlowDrop workflows as tools.

---

## Integration Patterns

### Pattern 1: AI-Powered Content Pipeline

```
Canvas (create page) → AI Content (generate fields)
    → AI Validations (quality check) → ECA (publish workflow)
    → Orchestration (notify Slack/email)
```

### Pattern 2: Agent-Driven Site Building

```
User prompt: "Add an events section to the site"
    → AI Agents (Content Type Agent creates event type)
    → AI Agents (Field Type Agent adds date/location fields)
    → Canvas (AI generates events listing page)
    → ECA (set permissions, menu link)
```

### Pattern 3: External Automation Loop

```
External CRM (new lead) → Orchestration → Drupal
    → AI Agent (create personalized landing page)
    → Canvas (render with brand components)
    → Orchestration → Email platform (send welcome)
```

### Pattern 4: FlowDrop Agent Workflow

```
FlowDrop trigger (form submission)
    → FlowDrop AI Provider (sentiment analysis)
    → FlowDrop Agents (route to appropriate agent)
    → Human-in-the-loop (manager approval)
    → Orchestration (update CRM + notify team)
```

### Pattern 5: MCP-Enabled IDE Development

```
Developer in Claude Desktop / Cursor
    → MCP Server (STDIO transport via Drush)
    → AI tools: search content, create nodes, manage config
    → Changes reflected in Drupal immediately
```

---

## Bluefly Platform Integration

### Workspace Layout

```
~/Sites/blueflyio/
  __BARE_REPOS/agent-platform/drupal/   → 33 custom module repos (source of truth)
  worktrees/<project>/<branch>/          → Active development (ephemeral)
  WORKING_DEMOs/
    Drupal_AgentDash/                    → 30 custom + 140 contrib modules
    Drupal_AgentMarketplace/             → 32 custom + 129 contrib modules
    Drupal_Fleet_Manager/                → 16 custom + 82 contrib modules
  TESTING_DEMOS/                         → DDEV test sites
```

### OSSA-Drupal Agents

| Agent | Role | CMS 2.0 Integration |
|-------|------|---------------------|
| `drupal-module-builder` | Executor (tier_3) | Generates SDC components, MCP tools, AI agent plugins |
| `drupal-config-manager` | Reviewer (tier_2) | Reviews config including Canvas layouts, ECA models, AI settings |

### Development Workflow

```bash
# Source repos: __BARE_REPOS/agent-platform/drupal/<module>.git
# Worktrees: worktrees/<module>/<branch>/
# Demo sites: WORKING_DEMOs/Drupal_AgentDash/ (30 custom + 140 contrib)
#             WORKING_DEMOs/Drupal_AgentMarketplace/ (32 custom + 129 contrib)
#             WORKING_DEMOs/Drupal_Fleet_Manager/ (16 custom + 82 contrib)

# 1. Create worktree from bare repo
git --git-dir=__BARE_REPOS/agent-platform/drupal/<module>.git \
    worktree add worktrees/<module>/<branch> <branch>

# 2. Edit in worktree
cd worktrees/<module>/<branch>/

# 3. Sync to demo site for testing
buildkit drupal sync

# 4. Test in DDEV
cd WORKING_DEMOs/Drupal_AgentDash && ddev drush cr

# 5. Config export (ECA models, FlowDrop workflows)
ddev drush cex → config entities exported and managed via config_split

# 6. Commit in worktree, push, merge via GitLab MR
```

### MCP Server for Platform Agents

The platform's MCP servers can connect to Drupal's MCP Server endpoint, enabling OSSA agents to interact with Drupal content/config directly:

```
@bluefly/agent-protocol → Drupal MCP Server (HTTP transport)
    → Agent can: search content, create nodes, manage fields
    → OAuth 2.1 scoped to agent's tier permissions
```

---

## DDEV Commands

```bash
cd WORKING_DEMOs/Drupal_AgentDash/   # or Drupal_AgentMarketplace, Drupal_Fleet_Manager

# Start/stop
ddev start
ddev stop
ddev restart

# Drush
ddev drush cr                    # Cache rebuild
ddev drush cex                   # Config export
ddev drush cim                   # Config import
ddev drush updb                  # Update database
ddev drush en <module>           # Enable module
ddev drush pmu <module>          # Uninstall module
ddev drush uli                   # Login URL
ddev drush watchdog-show --count=50  # Recent log entries

# Composer
ddev composer require drupal/<module>
ddev composer update --lock

# Database
ddev drush sql-dump > backup.sql
ddev drush sql-cli

# Xdebug
ddev xdebug on
ddev xdebug off

# Logs
ddev logs
```

## Config Management

| Tool | Purpose |
|------|---------|
| config_split | Environment-specific config (dev/stage/prod) |
| config_ignore | Ignore user-generated config |
| Config export | `ddev drush cex` |
| Config import | `ddev drush cim` |

### Environment Overrides
```php
// settings.local.php
$config['system.performance']['css']['preprocess'] = FALSE;
$config['system.performance']['js']['preprocess'] = FALSE;
```

---

## Module Installation Reference

```bash
# CMS 2.0 core (if not using CMS 2.0 distribution)
ddev composer require drupal/experience_builder

# AI ecosystem
ddev composer require drupal/ai drupal/ai_provider_anthropic drupal/ai_agents

# MCP Server
ddev composer require drupal/mcp_server

# Automation
ddev composer require drupal/eca
ddev composer require drupal/orchestration

# FlowDrop
ddev composer require drupal/flowdrop drupal/flowdrop_ai_provider drupal/flowdrop_agents drupal/flowdrop_ui_agents

# Enable all
ddev drush en experience_builder ai ai_provider_anthropic ai_agents mcp_server eca orchestration flowdrop flowdrop_ai_provider flowdrop_agents flowdrop_ui_agents
```

## Admin Routes

| Path | Module | Function |
|------|--------|----------|
| `/admin/config/ai/settings` | AI | Provider configuration |
| `/admin/config/ai/agents` | AI Agents | Agent management |
| `/admin/config/ai/agents/explorer` | AI Agents | Interactive agent testing |
| `/admin/config/services/mcp-server` | MCP Server | Server configuration |
| `/admin/config/services/mcp-server/tools` | MCP Server | Tool management |
| `/admin/config/workflow/eca` | ECA | Automation models |
| `/admin/config/services/orchestration` | Orchestration | External platform config |
| `/admin/structure/flowdrop` | FlowDrop | Workflow management |
