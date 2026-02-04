# OSSA Buildkit ↔ Drupal Integration Architecture

**Version**: 1.0.0
**OSSA Spec**: v0.4.1
**Date**: 2026-02-04
**Status**: Design Document

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Components](#system-components)
3. [Integration Points](#integration-points)
4. [Data Flow Diagrams](#data-flow-diagrams)
5. [Configuration Management](#configuration-management)
6. [Runtime Integration](#runtime-integration)
7. [Development Workflow](#development-workflow)
8. [API Specifications](#api-specifications)
9. [Deployment Strategy](#deployment-strategy)
10. [Troubleshooting Guide](#troubleshooting-guide)

---

## 1. Architecture Overview

### 1.1 Full Stack Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         OSSA Buildkit (TypeScript)                   │
│                                                                       │
│  ┌──────────────────────┐  ┌──────────────────────┐                │
│  │  ossa export         │  │  ossa export         │                 │
│  │  --platform drupal   │  │  --platform          │                 │
│  │                      │  │  drupal-config       │                 │
│  │  Generates:          │  │                      │                 │
│  │  - Module structure  │  │  Generates:          │                 │
│  │  - Plugin classes    │  │  - Config YAML       │                 │
│  │  - Service files     │  │  - Entity schemas    │                 │
│  └──────────┬───────────┘  └──────────┬───────────┘                 │
│             │                          │                             │
└─────────────┼──────────────────────────┼─────────────────────────────┘
              │                          │
              │ Export                   │ Export
              │ (Drupal Module)          │ (Config YAML)
              ▼                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Drupal Ecosystem                             │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                      ai_agents (Base)                         │  │
│  │  - Plugin system (AgentType, AgentCapability, AgentAction)   │  │
│  │  - Services (AgentManager, AgentExecutor)                     │  │
│  │  - Schema API                                                 │  │
│  │  - Event system                                               │  │
│  │  - Permission framework                                       │  │
│  └────────────────────────────┬─────────────────────────────────┘  │
│                                │                                     │
│         ┌──────────────────────┼──────────────────────┐             │
│         │                      │                      │             │
│  ┌──────▼────────┐   ┌────────▼───────┐   ┌──────────▼─────────┐  │
│  │ ai_agents_ui  │   │ ai_agents_ossa │   │  Other Extensions   │  │
│  │               │   │                 │   │  (future)           │  │
│  │ - Admin UI    │   │ - OSSA v0.4.1  │   │                     │  │
│  │ - Forms       │   │ - Config Sync   │   │                     │  │
│  │ - Reports     │   │ - REST API      │   │                     │  │
│  │ - Dashboard   │   │ - Remote Exec   │   │                     │  │
│  └───────────────┘   └─────────────────┘   └─────────────────────┘  │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

### 1.2 Design Principles

1. **Separation of Concerns**
   - Buildkit handles OSSA spec processing and export generation
   - Drupal handles runtime execution and persistence
   - Clear boundaries between TypeScript and PHP domains

2. **Configuration as Code**
   - OSSA manifests are source of truth
   - Drupal config entities represent runtime state
   - Bidirectional sync between TypeScript and PHP

3. **Plugin Architecture**
   - Drupal leverages native plugin system
   - OSSA agents map to Drupal plugins
   - Extensible without core modifications

4. **API-First**
   - REST API for remote execution
   - JSON Schema validation
   - OpenAPI documentation

5. **DRY Principle**
   - No duplication between buildkit and Drupal
   - Single source of truth (OSSA manifest)
   - Auto-generated code wherever possible

---

## 2. System Components

### 2.1 OSSA Buildkit Components

#### 2.1.1 Export Command: `ossa export --platform drupal`

**Purpose**: Generate complete Drupal module from OSSA manifest

**Input**: OSSA v0.4.1 manifest (YAML/JSON)

```yaml
apiVersion: ossa/v0.4.1
kind: Agent
metadata:
  name: content-moderator
  namespace: ai.agents.ossa
  version: 1.0.0
spec:
  type: autonomous
  runtime:
    environment: drupal
  capabilities:
    - content-moderation
    - sentiment-analysis
  mcp:
    mcpServers:
      - name: drupal-api
        url: http://localhost:8080/api/mcp
```

**Output**: Drupal 10+ module structure

```
content_moderator/
├── content_moderator.info.yml
├── content_moderator.module
├── content_moderator.services.yml
├── src/
│   ├── Plugin/
│   │   └── Agent/
│   │       └── ContentModeratorAgent.php
│   └── ContentModeratorManager.php
├── config/
│   └── install/
│       └── ossa_manifest.content_moderator.yml
└── tests/
    └── src/
        └── Kernel/
            └── ContentModeratorTest.php
```

**Key Features**:
- PSR-4 autoloading
- Drupal coding standards
- Dependencies on `ai_agents` and `ai_agents_ossa`
- Plugin discovery annotations
- Service container integration

#### 2.1.2 Export Command: `ossa export --platform drupal-config`

**Purpose**: Generate Drupal config entities for import

**Input**: OSSA v0.4.1 manifest (YAML/JSON)

**Output**: Drupal config YAML files

```
config/sync/
├── ossa_manifest.content_moderator.yml
└── ossa_agent.content_moderator_instance.yml
```

**Config Entity Structure**:

```yaml
# ossa_manifest.content_moderator.yml
langcode: en
status: true
dependencies:
  module:
    - ai_agents_ossa
id: content_moderator
label: 'Content Moderator'
manifest_version: '0.4.1'
manifest_data:
  apiVersion: ossa/v0.4.1
  kind: Agent
  metadata:
    name: content-moderator
    namespace: ai.agents.ossa
    version: 1.0.0
  spec:
    type: autonomous
    runtime:
      environment: drupal
    capabilities:
      - content-moderation
      - sentiment-analysis
    mcp:
      mcpServers:
        - name: drupal-api
          url: http://localhost:8080/api/mcp
```

### 2.2 Drupal Module Components

#### 2.2.1 ai_agents (Base Module)

**Location**: drupal.org contributed module

**Purpose**: Framework for AI agent integration in Drupal

**Key Components**:

```php
// Plugin: AgentType
interface AgentTypeInterface {
  public function execute(array $context): AgentResultInterface;
  public function validate(array $config): ValidationResult;
  public function getCapabilities(): array;
}

// Service: AgentManager
class AgentManager {
  public function createAgent(string $type, array $config): AgentInterface;
  public function executeAgent(string $id, array $context): AgentResultInterface;
  public function listAgents(array $filters = []): array;
}

// Service: AgentExecutor
class AgentExecutor {
  public function execute(AgentInterface $agent, array $context): AgentResultInterface;
  public function validateContext(array $context): ValidationResult;
  public function handleError(\Throwable $error, AgentInterface $agent): void;
}

// Event: AgentEvent
class AgentEvent extends Event {
  const PRE_EXECUTE = 'agent.pre_execute';
  const POST_EXECUTE = 'agent.post_execute';
  const ERROR = 'agent.error';
}
```

**Schema API**:

```php
// AgentResultInterface
interface AgentResultInterface {
  public function getStatus(): string; // success|error|partial
  public function getData(): array;
  public function getMetadata(): array;
  public function getExecutionTime(): float;
}

// ValidationResult
class ValidationResult {
  public function isValid(): bool;
  public function getErrors(): array;
  public function getWarnings(): array;
}
```

#### 2.2.2 ai_agents_ui (UI Module)

**Purpose**: Generic admin interface for all agents

**Features**:
- Agent listing (Views integration)
- Agent configuration forms
- Execution dashboard
- Log viewer
- Performance metrics
- Capability browser

**Routes**:

```yaml
# ai_agents_ui.routing.yml
ai_agents_ui.dashboard:
  path: '/admin/ai/agents'
  defaults:
    _controller: '\Drupal\ai_agents_ui\Controller\DashboardController::index'
    _title: 'AI Agents'
  requirements:
    _permission: 'administer ai agents'

ai_agents_ui.agent.execute:
  path: '/admin/ai/agents/{agent}/execute'
  defaults:
    _form: '\Drupal\ai_agents_ui\Form\AgentExecuteForm'
    _title: 'Execute Agent'
  requirements:
    _permission: 'execute ai agents'
```

#### 2.2.3 ai_agents_ossa (OSSA Module)

**Purpose**: OSSA v0.4.1 manifest integration

**Config Entities**:

```php
/**
 * Defines the OSSA Manifest entity.
 *
 * @ConfigEntityType(
 *   id = "ossa_manifest",
 *   label = @Translation("OSSA Manifest"),
 *   handlers = {
 *     "list_builder" = "Drupal\ai_agents_ossa\OssaManifestListBuilder",
 *     "form" = {
 *       "add" = "Drupal\ai_agents_ossa\Form\OssaManifestForm",
 *       "edit" = "Drupal\ai_agents_ossa\Form\OssaManifestForm",
 *       "delete" = "Drupal\ai_agents_ossa\Form\OssaManifestDeleteForm",
 *     }
 *   },
 *   config_prefix = "ossa_manifest",
 *   admin_permission = "administer ossa manifests",
 *   entity_keys = {
 *     "id" = "id",
 *     "label" = "label",
 *     "uuid" = "uuid"
 *   },
 *   config_export = {
 *     "id",
 *     "label",
 *     "manifest_version",
 *     "manifest_data"
 *   }
 * )
 */
class OssaManifest extends ConfigEntityBase {
  protected string $manifest_version;
  protected array $manifest_data;

  public function getManifestData(): array {
    return $this->manifest_data;
  }

  public function validate(): ValidationResult {
    // Validate against OSSA v0.4.1 schema
  }
}

/**
 * Defines the OSSA Agent entity (runtime instance).
 *
 * @ConfigEntityType(
 *   id = "ossa_agent",
 *   label = @Translation("OSSA Agent"),
 *   ...
 * )
 */
class OssaAgent extends ConfigEntityBase {
  protected string $manifest_id;
  protected array $runtime_config;
  protected string $status; // active|paused|error

  public function getManifest(): OssaManifest {
    return $this->entityTypeManager()
      ->getStorage('ossa_manifest')
      ->load($this->manifest_id);
  }
}
```

**REST API**:

```php
/**
 * @RestResource(
 *   id = "ossa_agent_execute",
 *   label = @Translation("OSSA Agent Execution"),
 *   uri_paths = {
 *     "create" = "/api/ossa/agents/{agent}/execute"
 *   }
 * )
 */
class OssaAgentExecuteResource extends ResourceBase {
  public function post(string $agent, array $context): ResourceResponse {
    // Execute agent and return results
  }
}
```

---

## 3. Integration Points

### 3.1 Buildkit → Drupal Config (Configuration Export)

**Data Flow**:

```
OSSA Manifest (YAML)
    ↓
[Buildkit Parser]
    ↓
Validated OSSA Object
    ↓
[Drupal Config Exporter]
    ↓
Drupal Config YAML
    ↓
[drush config:import]
    ↓
Drupal Config Entities
```

**Mapping Rules**:

| OSSA Field | Drupal Config Entity | Notes |
|------------|----------------------|-------|
| `metadata.name` | `ossa_manifest.id` | Machine name |
| `metadata.namespace` | `ossa_manifest.label` | Human-readable |
| `spec` | `ossa_manifest.manifest_data.spec` | Full spec preserved |
| `spec.capabilities` | `ossa_agent.capabilities` | Array of strings |
| `spec.mcp.mcpServers` | `ossa_agent.mcp_servers` | Array of server configs |

**Example Command**:

```bash
# Generate config from manifest
ossa export --platform drupal-config \
  --manifest agents/content-moderator.yaml \
  --output drupal/config/sync/

# Import into Drupal
drush config:import --partial \
  --source=config/sync/
```

### 3.2 Buildkit → Drupal Module (Code Generation)

**Data Flow**:

```
OSSA Manifest (YAML)
    ↓
[Buildkit Parser]
    ↓
Validated OSSA Object
    ↓
[Drupal Module Generator]
    ↓
├── PHP Classes (PSR-4)
├── Service Definitions
├── Plugin Annotations
└── Config Schema
    ↓
Drupal Module Package
    ↓
[Composer/Git]
    ↓
Drupal Site
```

**Code Generation Templates**:

**Template 1: Plugin Class**

```php
<?php
// Generated by OSSA Buildkit v{{ buildkit.version }}
// OSSA Manifest: {{ manifest.metadata.name }} v{{ manifest.metadata.version }}
// DO NOT EDIT MANUALLY - Regenerate from manifest

namespace Drupal\{{ module_name }}\Plugin\Agent;

use Drupal\ai_agents\Plugin\AgentBase;
use Drupal\ai_agents\AgentResultInterface;

/**
 * {{ manifest.metadata.description }}
 *
 * @Agent(
 *   id = "{{ manifest.metadata.name }}",
 *   label = @Translation("{{ manifest.metadata.labels.displayName }}"),
 *   description = @Translation("{{ manifest.metadata.description }}"),
 *   capabilities = {{ manifest.spec.capabilities|json_encode }},
 *   category = "{{ manifest.spec.type }}"
 * )
 */
class {{ className }} extends AgentBase {

  /**
   * {@inheritdoc}
   */
  public function execute(array $context): AgentResultInterface {
    // Implementation bridged to OSSA runtime
    return $this->executeOssaAgent($context);
  }

  /**
   * Execute via OSSA runtime bridge.
   */
  protected function executeOssaAgent(array $context): AgentResultInterface {
    $manifest = $this->getManifest();
    $runtime = $this->getRuntimeBridge();

    return $runtime->execute($manifest, $context);
  }
}
```

**Template 2: Service Definition**

```yaml
# {{ module_name }}.services.yml
# Generated by OSSA Buildkit

services:
  {{ module_name }}.manager:
    class: Drupal\{{ module_name }}\{{ className }}Manager
    arguments:
      - '@entity_type.manager'
      - '@ai_agents.executor'
      - '@ai_agents_ossa.runtime_bridge'
    tags:
      - { name: 'service_id_alias', id: 'agent.{{ manifest.metadata.name }}' }
```

### 3.3 Runtime Integration (TypeScript ↔ PHP Bridge)

**Challenge**: Execute TypeScript OSSA agents from PHP Drupal environment

**Solution**: Three-tier bridge architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Drupal (PHP)                                │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  AgentExecutor::execute()                                   │ │
│  │    ↓                                                        │ │
│  │  OssaRuntimeBridge::execute($manifest, $context)           │ │
│  │    ↓                                                        │ │
│  │  HTTP POST to bridge-server                                │ │
│  └────────────────┬───────────────────────────────────────────┘ │
│                   │                                              │
└───────────────────┼──────────────────────────────────────────────┘
                    │ HTTP/JSON-RPC
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│              OSSA Runtime Bridge Server (Node.js)                │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Express Server (Port 9090)                                 │ │
│  │    ↓                                                        │ │
│  │  POST /api/execute                                          │ │
│  │    ↓                                                        │ │
│  │  OssaRuntimeAdapter.execute(manifest, context)             │ │
│  │    ↓                                                        │ │
│  │  OSSA SDK execution                                         │ │
│  └────────────────┬───────────────────────────────────────────┘ │
│                   │                                              │
└───────────────────┼──────────────────────────────────────────────┘
                    │ Native TypeScript
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                 OSSA Buildkit Runtime (TypeScript)               │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  AgentExecutor.execute(manifest, context)                   │ │
│  │    ↓                                                        │ │
│  │  MCP Client connections                                     │ │
│  │    ↓                                                        │ │
│  │  Tool invocations                                           │ │
│  │    ↓                                                        │ │
│  │  Result aggregation                                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**PHP Side (Drupal)**:

```php
namespace Drupal\ai_agents_ossa;

use GuzzleHttp\ClientInterface;
use Drupal\ai_agents\AgentResultInterface;

class OssaRuntimeBridge {

  protected ClientInterface $httpClient;
  protected string $bridgeUrl;

  public function __construct(ClientInterface $httpClient, string $bridgeUrl = 'http://localhost:9090') {
    $this->httpClient = $httpClient;
    $this->bridgeUrl = $bridgeUrl;
  }

  public function execute(array $manifest, array $context): AgentResultInterface {
    $response = $this->httpClient->post($this->bridgeUrl . '/api/execute', [
      'json' => [
        'manifest' => $manifest,
        'context' => $context,
      ],
      'timeout' => 300, // 5 minutes
    ]);

    $data = json_decode($response->getBody(), true);

    return new AgentResult(
      status: $data['status'],
      data: $data['data'],
      metadata: $data['metadata'],
      executionTime: $data['execution_time']
    );
  }

  public function health(): bool {
    try {
      $response = $this->httpClient->get($this->bridgeUrl . '/health');
      return $response->getStatusCode() === 200;
    } catch (\Exception $e) {
      return false;
    }
  }
}
```

**Node.js Bridge Server**:

```typescript
// bridge-server/src/server.ts
import express from 'express';
import { AgentExecutor } from '@ossa/runtime';
import { validateManifest } from '@ossa/validator';

const app = express();
app.use(express.json());

const executor = new AgentExecutor();

app.post('/api/execute', async (req, res) => {
  try {
    const { manifest, context } = req.body;

    // Validate manifest
    const validation = validateManifest(manifest);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid manifest',
        details: validation.errors
      });
    }

    // Execute agent
    const startTime = Date.now();
    const result = await executor.execute(manifest, context);
    const executionTime = (Date.now() - startTime) / 1000;

    return res.json({
      status: result.status,
      data: result.data,
      metadata: result.metadata,
      execution_time: executionTime
    });
  } catch (error) {
    console.error('Execution error:', error);
    return res.status(500).json({
      error: 'Execution failed',
      message: error.message
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: process.env.npm_package_version });
});

const PORT = process.env.BRIDGE_PORT || 9090;
app.listen(PORT, () => {
  console.log(`OSSA Runtime Bridge listening on port ${PORT}`);
});
```

**Deployment**:

```bash
# Install bridge server
npm install -g @ossa/runtime-bridge

# Start as service (systemd)
sudo systemctl start ossa-runtime-bridge

# Or via Docker
docker run -d -p 9090:9090 ossa/runtime-bridge:latest
```

### 3.4 State Management

**State Flow**:

```
┌─────────────────────────────────────────────────────────────────┐
│                       Drupal Database                            │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ ossa_manifest│  │  ossa_agent  │  │ agent_execution│         │
│  │  (config)    │  │  (config)    │  │  (content)    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬────────┘          │
│         │                 │                  │                    │
└─────────┼─────────────────┼──────────────────┼────────────────────┘
          │                 │                  │
          │ Read            │ Read/Write       │ Write
          ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    OssaRuntimeBridge                             │
└─────────────────────────────────────────────────────────────────┘
          │                                    ▲
          │ Manifest + Config                 │ Execution Results
          ▼                                    │
┌─────────────────────────────────────────────────────────────────┐
│                OSSA Runtime Bridge Server                        │
└─────────────────────────────────────────────────────────────────┘
          │                                    ▲
          │ Execute                           │ Results
          ▼                                    │
┌─────────────────────────────────────────────────────────────────┐
│                     OSSA Buildkit Runtime                        │
│  (Stateless - no persistence)                                    │
└─────────────────────────────────────────────────────────────────┘
```

**Drupal Content Entity (Execution Log)**:

```php
/**
 * @ContentEntityType(
 *   id = "agent_execution",
 *   label = @Translation("Agent Execution"),
 *   base_table = "agent_execution",
 *   entity_keys = {
 *     "id" = "id",
 *     "uuid" = "uuid",
 *     "created" = "created"
 *   }
 * )
 */
class AgentExecution extends ContentEntityBase {

  public static function baseFieldDefinitions(EntityTypeInterface $entity_type) {
    $fields['agent_id'] = BaseFieldDefinition::create('string')
      ->setLabel(t('Agent ID'))
      ->setDescription(t('The ID of the agent that was executed.'));

    $fields['status'] = BaseFieldDefinition::create('list_string')
      ->setLabel(t('Status'))
      ->setSettings([
        'allowed_values' => [
          'success' => t('Success'),
          'error' => t('Error'),
          'partial' => t('Partial Success'),
        ],
      ]);

    $fields['context'] = BaseFieldDefinition::create('map')
      ->setLabel(t('Execution Context'))
      ->setDescription(t('The context passed to the agent.'));

    $fields['result'] = BaseFieldDefinition::create('map')
      ->setLabel(t('Execution Result'))
      ->setDescription(t('The result returned by the agent.'));

    $fields['execution_time'] = BaseFieldDefinition::create('decimal')
      ->setLabel(t('Execution Time'))
      ->setDescription(t('Time taken to execute in seconds.'));

    $fields['created'] = BaseFieldDefinition::create('created')
      ->setLabel(t('Created'))
      ->setDescription(t('The time the execution was recorded.'));

    return $fields;
  }
}
```

---

## 4. Data Flow Diagrams

### 4.1 Configuration Import Flow

```
┌──────────────┐
│  Developer   │
└──────┬───────┘
       │ 1. Edit manifest
       ▼
┌────────────────────────────┐
│  OSSA Manifest (YAML)      │
│  agents/content-moderator  │
└──────┬─────────────────────┘
       │ 2. ossa export --platform drupal-config
       ▼
┌────────────────────────────┐
│  Buildkit Export Command   │
│  - Parse manifest          │
│  - Validate OSSA v0.4.1    │
│  - Generate config YAML    │
└──────┬─────────────────────┘
       │ 3. Output
       ▼
┌────────────────────────────┐
│  Drupal Config YAML        │
│  config/sync/              │
│  - ossa_manifest.*         │
│  - ossa_agent.*            │
└──────┬─────────────────────┘
       │ 4. drush config:import
       ▼
┌────────────────────────────┐
│  Drupal Config System      │
│  - Import validation       │
│  - Dependency check        │
│  - Schema validation       │
└──────┬─────────────────────┘
       │ 5. Create entities
       ▼
┌────────────────────────────┐
│  Config Entities           │
│  - ossa_manifest           │
│  - ossa_agent              │
└────────────────────────────┘
```

### 4.2 Module Installation Flow

```
┌──────────────┐
│  Developer   │
└──────┬───────┘
       │ 1. Edit manifest
       ▼
┌────────────────────────────┐
│  OSSA Manifest (YAML)      │
└──────┬─────────────────────┘
       │ 2. ossa export --platform drupal
       ▼
┌────────────────────────────┐
│  Buildkit Export Command   │
│  - Parse manifest          │
│  - Generate PHP classes    │
│  - Generate services       │
│  - Generate tests          │
└──────┬─────────────────────┘
       │ 3. Output
       ▼
┌────────────────────────────┐
│  Drupal Module             │
│  content_moderator/        │
│  - *.info.yml              │
│  - src/Plugin/             │
│  - *.services.yml          │
└──────┬─────────────────────┘
       │ 4a. Local dev        │ 4b. Production
       ▼                      ▼
┌──────────────────┐   ┌──────────────────┐
│  Composer Link   │   │  Composer Repo   │
│  (symlink)       │   │  (packagist)     │
└──────┬───────────┘   └──────┬───────────┘
       │                      │
       └──────────┬───────────┘
                  │ 5. Install
                  ▼
       ┌────────────────────────────┐
       │  Drupal Module System      │
       │  - drush pm:enable         │
       │  - Dependency resolution   │
       │  - Hook_install()          │
       └──────┬─────────────────────┘
              │ 6. Discovery
              ▼
       ┌────────────────────────────┐
       │  Plugin Discovery          │
       │  - Annotation scan         │
       │  - Register plugins        │
       │  - Cache clear             │
       └────────────────────────────┘
```

### 4.3 Agent Execution Flow

```
┌──────────────┐
│  User/System │
└──────┬───────┘
       │ 1. Trigger execution
       ▼
┌────────────────────────────┐
│  Drupal UI / REST API      │
│  /admin/ai/agents/execute  │
│  POST /api/ossa/agents/X   │
└──────┬─────────────────────┘
       │ 2. Load agent
       ▼
┌────────────────────────────┐
│  AgentManager              │
│  - Load ossa_agent entity  │
│  - Load ossa_manifest      │
│  - Validate permissions    │
└──────┬─────────────────────┘
       │ 3. Execute
       ▼
┌────────────────────────────┐
│  AgentExecutor             │
│  - Prepare context         │
│  - Emit PRE_EXECUTE event  │
└──────┬─────────────────────┘
       │ 4. Bridge call
       ▼
┌────────────────────────────┐
│  OssaRuntimeBridge         │
│  - HTTP POST to bridge     │
│  - Timeout: 5min           │
└──────┬─────────────────────┘
       │ 5. JSON-RPC
       ▼
┌────────────────────────────┐
│  Bridge Server (Node.js)   │
│  - Validate manifest       │
│  - Create executor         │
└──────┬─────────────────────┘
       │ 6. Native execution
       ▼
┌────────────────────────────┐
│  OSSA Runtime              │
│  - Connect to MCP servers  │
│  - Execute tools           │
│  - Aggregate results       │
└──────┬─────────────────────┘
       │ 7. Return results
       ▼
┌────────────────────────────┐
│  Bridge Server             │
│  - Format response         │
│  - Add metadata            │
└──────┬─────────────────────┘
       │ 8. HTTP response
       ▼
┌────────────────────────────┐
│  OssaRuntimeBridge         │
│  - Parse response          │
│  - Create AgentResult      │
└──────┬─────────────────────┘
       │ 9. Process result
       ▼
┌────────────────────────────┐
│  AgentExecutor             │
│  - Emit POST_EXECUTE event │
│  - Log execution           │
│  - Update status           │
└──────┬─────────────────────┘
       │ 10. Return to user
       ▼
┌────────────────────────────┐
│  Drupal UI / REST API      │
│  - Display results         │
│  - Show metadata           │
└────────────────────────────┘
```

---

## 5. Configuration Management

### 5.1 Configuration Schema

**OSSA Manifest Config Schema**:

```yaml
# config/schema/ai_agents_ossa.schema.yml
ossa_manifest.*:
  type: config_entity
  label: 'OSSA Manifest'
  mapping:
    id:
      type: string
      label: 'ID'
    label:
      type: label
      label: 'Label'
    manifest_version:
      type: string
      label: 'OSSA Manifest Version'
    manifest_data:
      type: mapping
      label: 'Manifest Data'
      mapping:
        apiVersion:
          type: string
          label: 'API Version'
        kind:
          type: string
          label: 'Kind'
        metadata:
          type: mapping
          label: 'Metadata'
          mapping:
            name:
              type: string
              label: 'Name'
            namespace:
              type: string
              label: 'Namespace'
            version:
              type: string
              label: 'Version'
            labels:
              type: sequence
              label: 'Labels'
              sequence:
                type: string
            annotations:
              type: sequence
              label: 'Annotations'
              sequence:
                type: string
        spec:
          type: mapping
          label: 'Specification'
          mapping:
            type:
              type: string
              label: 'Agent Type'
            runtime:
              type: mapping
              label: 'Runtime'
              mapping:
                environment:
                  type: string
                  label: 'Environment'
                resources:
                  type: mapping
                  label: 'Resources'
            capabilities:
              type: sequence
              label: 'Capabilities'
              sequence:
                type: string
            mcp:
              type: mapping
              label: 'MCP Configuration'
              mapping:
                mcpServers:
                  type: sequence
                  label: 'MCP Servers'
                  sequence:
                    type: mapping
                    mapping:
                      name:
                        type: string
                      url:
                        type: string
                      auth:
                        type: mapping
```

### 5.2 Configuration Sync Workflow

**Scenario**: Update agent manifest in development, deploy to production

**Development**:

```bash
# 1. Edit manifest
vim agents/content-moderator.yaml

# 2. Export to Drupal config
ossa export --platform drupal-config \
  --manifest agents/content-moderator.yaml \
  --output drupal/config/sync/

# 3. Import into dev site
drush config:import

# 4. Test changes
drush ai-agents:execute content-moderator --test

# 5. Export config (including any runtime changes)
drush config:export

# 6. Commit to git
git add config/sync/ossa_manifest.content_moderator.yml
git commit -m "Update content moderator agent manifest"
git push origin main
```

**Production**:

```bash
# 1. Pull changes
git pull origin main

# 2. Import config
drush config:import

# 3. Verify
drush ai-agents:list
drush ai-agents:status content-moderator

# 4. Clear cache
drush cache:rebuild
```

### 5.3 Bidirectional Sync

**Challenge**: Keep OSSA manifests (YAML) and Drupal config (YAML) in sync

**Solution**: Drush commands for export back to OSSA format

```bash
# Export Drupal config entity to OSSA manifest
drush ai-agents-ossa:export content-moderator \
  --output agents/content-moderator.yaml

# Validate sync status
drush ai-agents-ossa:validate-sync

# Report differences
drush ai-agents-ossa:diff content-moderator
```

**Implementation**:

```php
namespace Drupal\ai_agents_ossa\Commands;

use Drush\Commands\DrushCommands;
use Drupal\ai_agents_ossa\OssaExporter;

class OssaAgentCommands extends DrushCommands {

  protected OssaExporter $exporter;

  /**
   * Export Drupal config entity to OSSA manifest.
   *
   * @param string $agent_id
   *   The agent ID to export.
   * @param array $options
   *   Command options.
   *
   * @command ai-agents-ossa:export
   * @option output Output file path
   * @usage ai-agents-ossa:export content-moderator --output=agents/content-moderator.yaml
   */
  public function export(string $agent_id, array $options = ['output' => '']) {
    $manifest = $this->exporter->exportToOssa($agent_id);

    if ($options['output']) {
      file_put_contents($options['output'], $manifest);
      $this->io()->success("Exported to {$options['output']}");
    } else {
      $this->io()->write($manifest);
    }
  }

  /**
   * Validate OSSA manifest sync status.
   *
   * @command ai-agents-ossa:validate-sync
   */
  public function validateSync() {
    $results = $this->exporter->validateAllSync();

    foreach ($results as $agent_id => $status) {
      if ($status['synced']) {
        $this->io()->success("$agent_id: synced");
      } else {
        $this->io()->warning("$agent_id: out of sync");
        $this->io()->text($status['diff']);
      }
    }
  }
}
```

---

## 6. Runtime Integration

### 6.1 Bridge Server Architecture

**Purpose**: Enable PHP Drupal to execute TypeScript OSSA agents

**Technology Stack**:
- Express.js (HTTP server)
- OSSA SDK (agent execution)
- JSON-RPC 2.0 (protocol)
- Winston (logging)
- PM2 (process management)

**Project Structure**:

```
ossa-runtime-bridge/
├── package.json
├── tsconfig.json
├── src/
│   ├── server.ts              # Express app
│   ├── executor.ts            # OSSA execution wrapper
│   ├── validator.ts           # Manifest validation
│   ├── logger.ts              # Winston logger
│   └── types.ts               # TypeScript types
├── config/
│   ├── default.json           # Default config
│   └── production.json        # Production config
├── tests/
│   └── integration.test.ts
└── ecosystem.config.js        # PM2 config
```

**server.ts**:

```typescript
import express, { Request, Response } from 'express';
import { AgentExecutor } from '@ossa/runtime';
import { validateManifest } from './validator';
import { logger } from './logger';
import config from 'config';

const app = express();
app.use(express.json({ limit: '10mb' }));

// Middleware: Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    body: req.body,
    headers: req.headers,
  });
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: process.env.npm_package_version,
    uptime: process.uptime(),
  });
});

// Execute agent
app.post('/api/execute', async (req: Request, res: Response) => {
  const { manifest, context } = req.body;

  try {
    // Validate manifest
    const validation = await validateManifest(manifest);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid manifest',
        details: validation.errors,
      });
    }

    // Execute
    const executor = new AgentExecutor();
    const startTime = Date.now();

    const result = await executor.execute(manifest, context);

    const executionTime = (Date.now() - startTime) / 1000;

    logger.info('Execution completed', {
      agent: manifest.metadata.name,
      status: result.status,
      executionTime,
    });

    return res.json({
      status: result.status,
      data: result.data,
      metadata: {
        ...result.metadata,
        execution_time: executionTime,
      },
    });
  } catch (error) {
    logger.error('Execution failed', {
      error: error.message,
      stack: error.stack,
      manifest: manifest?.metadata?.name,
    });

    return res.status(500).json({
      error: 'Execution failed',
      message: error.message,
    });
  }
});

// Start server
const PORT = config.get<number>('server.port') || 9090;
const HOST = config.get<string>('server.host') || '0.0.0.0';

app.listen(PORT, HOST, () => {
  logger.info(`OSSA Runtime Bridge listening on ${HOST}:${PORT}`);
});
```

**executor.ts**:

```typescript
import { AgentManifest, AgentContext, AgentResult } from './types';
import { OssaAgent } from '@ossa/runtime';
import { McpClient } from '@ossa/mcp-client';

export class AgentExecutor {

  async execute(manifest: AgentManifest, context: AgentContext): Promise<AgentResult> {
    // Initialize MCP clients
    const mcpClients = await this.initializeMcpClients(manifest);

    // Create agent instance
    const agent = new OssaAgent(manifest, {
      mcpClients,
      context,
    });

    // Execute
    const result = await agent.run();

    // Cleanup
    await this.cleanup(mcpClients);

    return result;
  }

  private async initializeMcpClients(manifest: AgentManifest): Promise<McpClient[]> {
    const clients: McpClient[] = [];

    for (const serverConfig of manifest.spec.mcp?.mcpServers || []) {
      const client = new McpClient({
        url: serverConfig.url,
        auth: serverConfig.auth,
      });

      await client.connect();
      clients.push(client);
    }

    return clients;
  }

  private async cleanup(clients: McpClient[]): Promise<void> {
    for (const client of clients) {
      await client.disconnect();
    }
  }
}
```

**Deployment**:

**PM2 Configuration** (`ecosystem.config.js`):

```javascript
module.exports = {
  apps: [{
    name: 'ossa-runtime-bridge',
    script: 'dist/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 9090,
    },
    error_file: 'logs/error.log',
    out_file: 'logs/output.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  }],
};
```

**Systemd Service** (`/etc/systemd/system/ossa-runtime-bridge.service`):

```ini
[Unit]
Description=OSSA Runtime Bridge
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/ossa-runtime-bridge
ExecStart=/usr/bin/pm2 start ecosystem.config.js --no-daemon
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Docker Compose**:

```yaml
version: '3.8'

services:
  ossa-runtime-bridge:
    image: ossa/runtime-bridge:latest
    ports:
      - "9090:9090"
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
    volumes:
      - ./config:/app/config:ro
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9090/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### 6.2 Error Handling

**Error Types**:

1. **Validation Errors** (400)
   - Invalid manifest schema
   - Missing required fields
   - Type mismatches

2. **Execution Errors** (500)
   - MCP server connection failed
   - Tool invocation failed
   - Timeout exceeded

3. **Bridge Errors** (503)
   - Bridge server unavailable
   - Connection refused

**PHP Error Handling**:

```php
namespace Drupal\ai_agents_ossa;

use Drupal\ai_agents\AgentResultInterface;
use Drupal\ai_agents\Exception\AgentExecutionException;

class OssaRuntimeBridge {

  public function execute(array $manifest, array $context): AgentResultInterface {
    try {
      $response = $this->httpClient->post($this->bridgeUrl . '/api/execute', [
        'json' => [
          'manifest' => $manifest,
          'context' => $context,
        ],
        'timeout' => 300,
      ]);

      $data = json_decode($response->getBody(), true);

      return $this->createResult($data);

    } catch (ConnectException $e) {
      // Bridge server unavailable
      $this->logger->error('OSSA runtime bridge unavailable: @message', [
        '@message' => $e->getMessage(),
      ]);

      throw new AgentExecutionException(
        'Runtime bridge unavailable. Please check bridge server status.',
        503,
        $e
      );

    } catch (RequestException $e) {
      // HTTP error (4xx, 5xx)
      $response = $e->getResponse();
      $body = json_decode($response->getBody(), true);

      $this->logger->error('Agent execution failed: @error', [
        '@error' => $body['error'] ?? 'Unknown error',
        '@details' => $body['details'] ?? '',
      ]);

      throw new AgentExecutionException(
        $body['error'] ?? 'Execution failed',
        $response->getStatusCode(),
        $e
      );

    } catch (\Exception $e) {
      // Unexpected error
      $this->logger->error('Unexpected error during agent execution: @message', [
        '@message' => $e->getMessage(),
      ]);

      throw new AgentExecutionException(
        'An unexpected error occurred during execution',
        500,
        $e
      );
    }
  }
}
```

### 6.3 Performance Optimization

**Caching Strategy**:

```php
namespace Drupal\ai_agents_ossa;

use Drupal\Core\Cache\CacheBackendInterface;

class CachedRuntimeBridge extends OssaRuntimeBridge {

  protected CacheBackendInterface $cache;

  public function execute(array $manifest, array $context): AgentResultInterface {
    // Cache key based on manifest + context hash
    $cacheKey = $this->getCacheKey($manifest, $context);

    // Check cache
    if ($cached = $this->cache->get($cacheKey)) {
      $this->logger->info('Returning cached result for agent @agent', [
        '@agent' => $manifest['metadata']['name'],
      ]);
      return $cached->data;
    }

    // Execute
    $result = parent::execute($manifest, $context);

    // Cache if successful
    if ($result->getStatus() === 'success') {
      $this->cache->set($cacheKey, $result, time() + 3600); // 1 hour
    }

    return $result;
  }

  protected function getCacheKey(array $manifest, array $context): string {
    return 'ossa_execution:' . md5(json_encode([
      'manifest' => $manifest,
      'context' => $context,
    ]));
  }
}
```

**Connection Pooling**:

```typescript
// bridge-server/src/connection-pool.ts
import { McpClient } from '@ossa/mcp-client';

class McpConnectionPool {
  private pools: Map<string, McpClient[]> = new Map();
  private maxSize: number = 10;

  async getClient(serverUrl: string): Promise<McpClient> {
    if (!this.pools.has(serverUrl)) {
      this.pools.set(serverUrl, []);
    }

    const pool = this.pools.get(serverUrl)!;

    // Reuse existing connection
    if (pool.length > 0) {
      return pool.pop()!;
    }

    // Create new connection
    const client = new McpClient({ url: serverUrl });
    await client.connect();

    return client;
  }

  async releaseClient(serverUrl: string, client: McpClient): Promise<void> {
    const pool = this.pools.get(serverUrl);

    if (!pool || pool.length >= this.maxSize) {
      // Pool full, disconnect
      await client.disconnect();
      return;
    }

    // Return to pool
    pool.push(client);
  }
}
```

---

## 7. Development Workflow

### 7.1 Local Development Setup

**Prerequisites**:
- Node.js 20+
- PHP 8.3+
- Drupal 10+
- Composer
- Drush
- Docker (optional)

**Step 1: Install OSSA Buildkit**

```bash
# Install buildkit globally
npm install -g @ossa/buildkit

# Verify installation
ossa --version
```

**Step 2: Setup Drupal Site**

```bash
# Create new Drupal site
composer create-project drupal/recommended-project my-drupal-site
cd my-drupal-site

# Install required modules
composer require drupal/ai_agents drupal/ai_agents_ui drupal/ai_agents_ossa

# Enable modules
drush pm:enable ai_agents ai_agents_ui ai_agents_ossa

# Install site
drush site:install --account-name=admin --account-pass=admin
```

**Step 3: Setup OSSA Runtime Bridge**

```bash
# Option A: Install globally
npm install -g @ossa/runtime-bridge
ossa-runtime-bridge start

# Option B: Run via Docker
docker run -d -p 9090:9090 \
  --name ossa-bridge \
  ossa/runtime-bridge:latest

# Option C: Development mode
git clone https://github.com/ossa/runtime-bridge.git
cd runtime-bridge
npm install
npm run dev
```

**Step 4: Configure Drupal**

```bash
# Set bridge URL in settings.php
cat >> web/sites/default/settings.php <<'EOF'
$settings['ossa_runtime_bridge_url'] = 'http://localhost:9090';
EOF

# Clear cache
drush cache:rebuild
```

### 7.2 Development Workflow Example

**Scenario**: Create a new content moderation agent

**Step 1: Create OSSA Manifest**

```bash
mkdir -p agents
cat > agents/content-moderator.yaml <<'EOF'
apiVersion: ossa/v0.4.1
kind: Agent
metadata:
  name: content-moderator
  namespace: ai.agents.ossa
  version: 1.0.0
  labels:
    displayName: Content Moderator
    category: content
  description: Analyzes content for policy violations
spec:
  type: autonomous
  runtime:
    environment: drupal
    resources:
      memory: 256Mi
      timeout: 60s
  capabilities:
    - content-moderation
    - sentiment-analysis
    - policy-checking
  mcp:
    mcpServers:
      - name: drupal-api
        url: http://localhost:8080/api/mcp
      - name: openai
        url: https://api.openai.com/v1/mcp
        auth:
          type: bearer
          token: ${OPENAI_API_KEY}
EOF
```

**Step 2: Generate Drupal Module**

```bash
# Generate module structure
ossa export --platform drupal \
  --manifest agents/content-moderator.yaml \
  --output modules/custom/

# Verify structure
ls -la modules/custom/content_moderator/
```

**Step 3: Install Module**

```bash
# For local development, use symlink
cd web/modules/custom
ln -s ../../../modules/custom/content_moderator content_moderator

# Enable module
drush pm:enable content_moderator

# Verify
drush pm:list --type=module --status=enabled | grep content_moderator
```

**Step 4: Import Configuration**

```bash
# Generate config
ossa export --platform drupal-config \
  --manifest agents/content-moderator.yaml \
  --output config/sync/

# Import into Drupal
drush config:import --partial

# Verify
drush config:get ossa_manifest.content_moderator
```

**Step 5: Test Agent**

```bash
# Via Drush
drush ai-agents:execute content-moderator \
  --context='{"content": "This is a test article", "node_id": 123}'

# Via UI
# Navigate to /admin/ai/agents/content-moderator/execute
```

**Step 6: Debug**

```bash
# Check bridge server logs
docker logs ossa-bridge

# Check Drupal logs
drush watchdog:tail

# Enable debugging
drush config:set ai_agents_ossa.settings debug true
drush cache:rebuild
```

### 7.3 Testing Strategy

**Unit Tests (PHP - Drupal)**:

```php
namespace Drupal\Tests\content_moderator\Unit;

use Drupal\Tests\UnitTestCase;
use Drupal\content_moderator\Plugin\Agent\ContentModeratorAgent;

class ContentModeratorAgentTest extends UnitTestCase {

  protected ContentModeratorAgent $agent;

  protected function setUp(): void {
    parent::setUp();
    $this->agent = new ContentModeratorAgent([], 'content_moderator', []);
  }

  public function testGetCapabilities(): void {
    $capabilities = $this->agent->getCapabilities();

    $this->assertContains('content-moderation', $capabilities);
    $this->assertContains('sentiment-analysis', $capabilities);
    $this->assertContains('policy-checking', $capabilities);
  }

  public function testValidateContext(): void {
    $context = [
      'content' => 'Test content',
      'node_id' => 123,
    ];

    $result = $this->agent->validateContext($context);
    $this->assertTrue($result->isValid());
  }
}
```

**Integration Tests (TypeScript - Bridge)**:

```typescript
// bridge-server/tests/integration.test.ts
import { describe, it, expect } from '@jest/globals';
import axios from 'axios';

describe('OSSA Runtime Bridge', () => {
  const bridgeUrl = 'http://localhost:9090';

  it('should return health status', async () => {
    const response = await axios.get(`${bridgeUrl}/health`);

    expect(response.status).toBe(200);
    expect(response.data.status).toBe('ok');
  });

  it('should execute agent', async () => {
    const manifest = {
      apiVersion: 'ossa/v0.4.1',
      kind: 'Agent',
      metadata: {
        name: 'test-agent',
        version: '1.0.0',
      },
      spec: {
        type: 'autonomous',
        capabilities: ['test'],
      },
    };

    const context = { test: 'data' };

    const response = await axios.post(`${bridgeUrl}/api/execute`, {
      manifest,
      context,
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('status');
    expect(response.data).toHaveProperty('data');
  });
});
```

**Functional Tests (Drupal - Kernel)**:

```php
namespace Drupal\Tests\ai_agents_ossa\Kernel;

use Drupal\KernelTests\KernelTestBase;
use Drupal\ai_agents_ossa\Entity\OssaManifest;

class OssaManifestTest extends KernelTestBase {

  protected static $modules = ['ai_agents', 'ai_agents_ossa'];

  public function testCreateManifest(): void {
    $manifest = OssaManifest::create([
      'id' => 'test_manifest',
      'label' => 'Test Manifest',
      'manifest_version' => '0.4.1',
      'manifest_data' => [
        'apiVersion' => 'ossa/v0.4.1',
        'kind' => 'Agent',
        'metadata' => [
          'name' => 'test-agent',
        ],
        'spec' => [
          'type' => 'autonomous',
        ],
      ],
    ]);

    $manifest->save();

    $loaded = OssaManifest::load('test_manifest');
    $this->assertNotNull($loaded);
    $this->assertEquals('0.4.1', $loaded->get('manifest_version'));
  }
}
```

**End-to-End Tests (Behat)**:

```gherkin
Feature: Agent Execution
  As a site administrator
  I want to execute AI agents
  So that I can automate content moderation

  Scenario: Execute content moderator agent
    Given I am logged in as an administrator
    And the "content_moderator" agent is enabled
    When I navigate to "/admin/ai/agents/content-moderator/execute"
    And I fill in "Content" with "This is a test article"
    And I press "Execute"
    Then I should see "Agent executed successfully"
    And I should see "Status: success"
    And I should see "Execution time:"
```

---

## 8. API Specifications

### 8.1 REST API Endpoints

**Base Path**: `/api/ossa`

**Authentication**: Drupal session or OAuth2 token

**Endpoints**:

```yaml
openapi: 3.1.0
info:
  title: OSSA Agent API
  version: 1.0.0
  description: REST API for OSSA agent management and execution

servers:
  - url: http://localhost:8080/api/ossa
    description: Local development

paths:
  /manifests:
    get:
      summary: List all OSSA manifests
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 0
        - name: limit
          in: query
          schema:
            type: integer
            default: 50
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/OssaManifest'
                  meta:
                    type: object
                    properties:
                      page:
                        type: integer
                      limit:
                        type: integer
                      total:
                        type: integer

    post:
      summary: Create new OSSA manifest
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/OssaManifestInput'
      responses:
        '201':
          description: Manifest created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/OssaManifest'
        '400':
          description: Invalid manifest

  /manifests/{id}:
    get:
      summary: Get manifest by ID
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/OssaManifest'
        '404':
          description: Manifest not found

    patch:
      summary: Update manifest
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/OssaManifestInput'
      responses:
        '200':
          description: Manifest updated

    delete:
      summary: Delete manifest
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '204':
          description: Manifest deleted

  /agents:
    get:
      summary: List all agents
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/OssaAgent'

  /agents/{id}/execute:
    post:
      summary: Execute agent
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                context:
                  type: object
                  description: Execution context
                async:
                  type: boolean
                  default: false
                  description: Execute asynchronously
      responses:
        '200':
          description: Execution completed
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AgentResult'
        '202':
          description: Execution queued (async)
          content:
            application/json:
              schema:
                type: object
                properties:
                  execution_id:
                    type: string
                  status:
                    type: string
                    enum: [queued]
        '400':
          description: Invalid context
        '500':
          description: Execution failed

components:
  schemas:
    OssaManifest:
      type: object
      properties:
        id:
          type: string
        label:
          type: string
        manifest_version:
          type: string
        manifest_data:
          type: object
          properties:
            apiVersion:
              type: string
            kind:
              type: string
            metadata:
              type: object
            spec:
              type: object

    OssaManifestInput:
      type: object
      required:
        - manifest_data
      properties:
        label:
          type: string
        manifest_data:
          type: object

    OssaAgent:
      type: object
      properties:
        id:
          type: string
        manifest_id:
          type: string
        label:
          type: string
        status:
          type: string
          enum: [active, paused, error]
        capabilities:
          type: array
          items:
            type: string

    AgentResult:
      type: object
      properties:
        status:
          type: string
          enum: [success, error, partial]
        data:
          type: object
        metadata:
          type: object
          properties:
            execution_time:
              type: number
            agent_id:
              type: string
```

### 8.2 PHP API (Drupal Services)

**Service: AgentManager**

```php
namespace Drupal\ai_agents;

interface AgentManagerInterface {

  /**
   * Create a new agent instance.
   *
   * @param string $type
   *   The agent type.
   * @param array $config
   *   Agent configuration.
   *
   * @return \Drupal\ai_agents\AgentInterface
   *   The created agent.
   */
  public function createAgent(string $type, array $config): AgentInterface;

  /**
   * Load an agent by ID.
   *
   * @param string $id
   *   The agent ID.
   *
   * @return \Drupal\ai_agents\AgentInterface|null
   *   The agent or NULL if not found.
   */
  public function loadAgent(string $id): ?AgentInterface;

  /**
   * Execute an agent.
   *
   * @param string $id
   *   The agent ID.
   * @param array $context
   *   Execution context.
   *
   * @return \Drupal\ai_agents\AgentResultInterface
   *   The execution result.
   */
  public function executeAgent(string $id, array $context): AgentResultInterface;

  /**
   * List all agents.
   *
   * @param array $filters
   *   Optional filters.
   *
   * @return array
   *   Array of agents.
   */
  public function listAgents(array $filters = []): array;
}
```

**Service: OssaRuntimeBridge**

```php
namespace Drupal\ai_agents_ossa;

interface OssaRuntimeBridgeInterface {

  /**
   * Execute an OSSA agent.
   *
   * @param array $manifest
   *   The OSSA manifest.
   * @param array $context
   *   Execution context.
   *
   * @return \Drupal\ai_agents\AgentResultInterface
   *   The execution result.
   *
   * @throws \Drupal\ai_agents\Exception\AgentExecutionException
   */
  public function execute(array $manifest, array $context): AgentResultInterface;

  /**
   * Check bridge health.
   *
   * @return bool
   *   TRUE if bridge is healthy.
   */
  public function health(): bool;

  /**
   * Get bridge server URL.
   *
   * @return string
   *   The bridge URL.
   */
  public function getBridgeUrl(): string;
}
```

### 8.3 TypeScript API (Bridge Server)

**Interface: AgentExecutor**

```typescript
interface AgentManifest {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace?: string;
    version: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec: {
    type: string;
    runtime?: {
      environment: string;
      resources?: {
        memory?: string;
        timeout?: string;
      };
    };
    capabilities: string[];
    mcp?: {
      mcpServers: Array<{
        name: string;
        url: string;
        auth?: {
          type: string;
          token?: string;
        };
      }>;
    };
  };
}

interface AgentContext {
  [key: string]: any;
}

interface AgentResult {
  status: 'success' | 'error' | 'partial';
  data: Record<string, any>;
  metadata: {
    execution_time: number;
    agent_id: string;
    [key: string]: any;
  };
}

interface AgentExecutor {
  execute(manifest: AgentManifest, context: AgentContext): Promise<AgentResult>;
}
```

---

## 9. Deployment Strategy

### 9.1 Production Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Load Balancer                            │
│                         (nginx/HAProxy)                          │
└───────────────────────┬─────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌────────────┐  ┌────────────┐  ┌────────────┐
│  Drupal 1  │  │  Drupal 2  │  │  Drupal N  │
│  (PHP-FPM) │  │  (PHP-FPM) │  │  (PHP-FPM) │
└─────┬──────┘  └─────┬──────┘  └─────┬──────┘
      │               │               │
      └───────────────┼───────────────┘
                      │
                      ▼
        ┌──────────────────────────┐
        │  PostgreSQL (Primary)    │
        │  + Read Replicas         │
        └──────────────────────────┘
                      │
      ┌───────────────┼───────────────┐
      │               │               │
      ▼               ▼               ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Bridge 1 │  │ Bridge 2 │  │ Bridge N │
│ (Node.js)│  │ (Node.js)│  │ (Node.js)│
└──────────┘  └──────────┘  └──────────┘
```

### 9.2 Deployment Steps

**Step 1: Prepare Infrastructure**

```bash
# Provision servers (example using Terraform)
terraform init
terraform apply

# Setup Kubernetes cluster (if using K8s)
kubectl create namespace ossa-production
```

**Step 2: Deploy Bridge Server**

```bash
# Build Docker image
docker build -t registry.example.com/ossa-runtime-bridge:v1.0.0 .

# Push to registry
docker push registry.example.com/ossa-runtime-bridge:v1.0.0

# Deploy to K8s
kubectl apply -f k8s/bridge-deployment.yaml

# Or deploy via Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

**Kubernetes Deployment** (`k8s/bridge-deployment.yaml`):

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ossa-runtime-bridge
  namespace: ossa-production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ossa-runtime-bridge
  template:
    metadata:
      labels:
        app: ossa-runtime-bridge
    spec:
      containers:
      - name: bridge
        image: registry.example.com/ossa-runtime-bridge:v1.0.0
        ports:
        - containerPort: 9090
        env:
        - name: NODE_ENV
          value: production
        - name: LOG_LEVEL
          value: info
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 9090
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 9090
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: ossa-runtime-bridge
  namespace: ossa-production
spec:
  selector:
    app: ossa-runtime-bridge
  ports:
  - protocol: TCP
    port: 9090
    targetPort: 9090
  type: LoadBalancer
```

**Step 3: Deploy Drupal**

```bash
# Build Drupal codebase
composer install --no-dev --optimize-autoloader

# Sync config
drush config:import

# Update database
drush updatedb

# Clear caches
drush cache:rebuild

# Deploy code (example using Ansible)
ansible-playbook -i inventory/production deploy-drupal.yml
```

**Step 4: Configure Connection**

```bash
# Update Drupal settings for production bridge
cat >> web/sites/default/settings.php <<'EOF'
if (getenv('ENVIRONMENT') === 'production') {
  $settings['ossa_runtime_bridge_url'] = 'http://ossa-runtime-bridge.ossa-production.svc.cluster.local:9090';
}
EOF
```

**Step 5: Verify Deployment**

```bash
# Check bridge health
curl https://bridge.example.com/health

# Check Drupal site
drush status

# Test agent execution
drush ai-agents:execute content-moderator --test
```

### 9.3 Rollback Strategy

**Rollback Procedure**:

```bash
# Rollback bridge server (K8s)
kubectl rollout undo deployment/ossa-runtime-bridge -n ossa-production

# Rollback Drupal code
git checkout v1.0.0
composer install
drush cache:rebuild

# Rollback database
drush sql:dump --result-file=backup.sql
drush sql:query < backup-previous.sql

# Rollback config
drush config:import --partial --source=config/previous/
```

---

## 10. Troubleshooting Guide

### 10.1 Common Issues

#### Issue 1: Bridge Server Unavailable

**Symptoms**:
- Error: "Runtime bridge unavailable"
- HTTP 503 errors
- Connection refused

**Diagnosis**:

```bash
# Check bridge server status
curl http://localhost:9090/health

# Check logs
docker logs ossa-bridge

# Check process
ps aux | grep node
```

**Solutions**:

```bash
# Restart bridge server
docker restart ossa-bridge

# Or via systemd
sudo systemctl restart ossa-runtime-bridge

# Check network connectivity
telnet localhost 9090
```

#### Issue 2: Manifest Validation Fails

**Symptoms**:
- Error: "Invalid manifest"
- 400 Bad Request
- Validation errors in logs

**Diagnosis**:

```bash
# Validate manifest using buildkit
ossa validate agents/content-moderator.yaml

# Check Drupal logs
drush watchdog:tail --severity=error
```

**Solutions**:

```bash
# Fix manifest schema errors
# Ensure apiVersion is "ossa/v0.4.1"
# Ensure all required fields are present

# Re-export config
ossa export --platform drupal-config \
  --manifest agents/content-moderator.yaml \
  --output config/sync/

# Re-import
drush config:import
```

#### Issue 3: Agent Execution Timeout

**Symptoms**:
- Execution takes >5 minutes
- Timeout errors
- Incomplete results

**Diagnosis**:

```bash
# Check bridge server logs for long-running operations
docker logs ossa-bridge | grep "execution_time"

# Check MCP server connectivity
curl -X POST http://localhost:8080/api/mcp -d '{"method":"tools/list"}'
```

**Solutions**:

```bash
# Increase timeout in Drupal
drush config:set ai_agents_ossa.settings execution_timeout 600

# Increase timeout in bridge server
# Edit config/production.json
{
  "executor": {
    "timeout": 600000
  }
}

# Restart bridge
docker restart ossa-bridge
```

#### Issue 4: MCP Server Connection Failed

**Symptoms**:
- Error: "Failed to connect to MCP server"
- Tool invocations fail
- Empty results

**Diagnosis**:

```bash
# Test MCP server directly
curl -X POST http://localhost:8080/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'

# Check MCP server logs
docker logs drupal-mcp-server
```

**Solutions**:

```bash
# Verify MCP server URL in manifest
# Check spec.mcp.mcpServers[].url

# Check network connectivity from bridge to MCP server
docker exec ossa-bridge curl http://drupal-api:8080/api/mcp

# Update MCP server URL if needed
drush config:edit ossa_manifest.content_moderator
# Fix spec.mcp.mcpServers[0].url
drush cache:rebuild
```

### 10.2 Debugging Tools

**Enable Debug Logging (Drupal)**:

```bash
# Enable debug mode
drush config:set ai_agents_ossa.settings debug true

# Set log level
drush config:set system.logging error_level verbose

# Clear cache
drush cache:rebuild

# Tail logs
drush watchdog:tail
```

**Enable Debug Logging (Bridge Server)**:

```bash
# Set LOG_LEVEL environment variable
docker exec ossa-bridge sh -c 'export LOG_LEVEL=debug && pm2 restart all'

# Or edit config/production.json
{
  "logging": {
    "level": "debug"
  }
}

# View logs
docker logs -f ossa-bridge
```

**Drupal Drush Commands**:

```bash
# List all agents
drush ai-agents:list

# Show agent status
drush ai-agents:status content-moderator

# Execute agent with debug output
drush ai-agents:execute content-moderator \
  --context='{"test": true}' \
  --debug

# Validate OSSA manifest
drush ai-agents-ossa:validate content-moderator

# Export manifest to OSSA format
drush ai-agents-ossa:export content-moderator \
  --output agents/content-moderator.yaml

# Check sync status
drush ai-agents-ossa:validate-sync
```

**Bridge Server Debug Endpoints**:

```bash
# Health check
curl http://localhost:9090/health

# Get metrics
curl http://localhost:9090/metrics

# Test execution with minimal manifest
curl -X POST http://localhost:9090/api/execute \
  -H "Content-Type: application/json" \
  -d @test-manifest.json
```

### 10.3 Performance Monitoring

**Metrics to Monitor**:

1. **Execution Time**
   - Track average execution time per agent
   - Alert if exceeds threshold

2. **Error Rate**
   - Track failed executions
   - Alert if error rate >5%

3. **Bridge Server Health**
   - CPU usage
   - Memory usage
   - Request rate

4. **Database Performance**
   - Query execution time
   - Connection pool usage

**Monitoring Setup (Prometheus + Grafana)**:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'ossa-bridge'
    static_configs:
      - targets: ['localhost:9090']
    metrics_path: '/metrics'
```

**Example Grafana Dashboard**:

```json
{
  "dashboard": {
    "title": "OSSA Agent Monitoring",
    "panels": [
      {
        "title": "Execution Time",
        "type": "graph",
        "targets": [
          {
            "expr": "ossa_agent_execution_time_seconds"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(ossa_agent_execution_errors_total[5m])"
          }
        ]
      },
      {
        "title": "Bridge Server Health",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job='ossa-bridge'}"
          }
        ]
      }
    ]
  }
}
```

---

## Conclusion

This integration architecture provides a complete, production-ready solution for integrating OSSA Buildkit with Drupal. The design follows best practices for:

- **Separation of concerns** between TypeScript and PHP
- **Configuration as code** with OSSA manifests as source of truth
- **API-first** design with REST APIs and JSON Schema validation
- **Developer experience** with clear workflows and debugging tools
- **Production readiness** with deployment strategies and monitoring

**Key Benefits**:

1. **DRY**: Single source of truth (OSSA manifest)
2. **Extensible**: Plugin architecture allows easy additions
3. **Maintainable**: Clear separation between buildkit and Drupal
4. **Testable**: Comprehensive testing strategies
5. **Scalable**: Bridge server can be horizontally scaled

**Next Steps**:

1. Implement base modules (`ai_agents`, `ai_agents_ui`, `ai_agents_ossa`)
2. Build OSSA Runtime Bridge server
3. Create export commands in buildkit
4. Write comprehensive tests
5. Document API specifications
6. Setup CI/CD pipelines
7. Deploy to staging environment
8. Gather feedback and iterate

---

**Document Version**: 1.0.0
**Last Updated**: 2026-02-04
**Maintainers**: OSSA Buildkit Team, Drupal AI Agents Team
**License**: MIT
