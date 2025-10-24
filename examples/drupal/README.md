# OSSA Drupal LLM Platform Examples

**Platform**: Drupal 11 LLM Platform  
**Extension**: drupal-v1  
**Examples**: 1 (more coming)

---

## Overview

These examples demonstrate how to use OSSA manifests with the Drupal LLM Platform. The Drupal platform provides:

- **ai_agents** - Agent registry and management
- **ai_agent_orchestra** - Multi-agent orchestration
- **ai_agent_marketplace** - Agent discovery and deployment
- **ai_provider_*** - LLM provider integrations (OpenAI, Anthropic, etc.)

---

## Examples

### 1. GitLab ML Recommendation Engine

**File**: `gitlab-ml-recommender.ossa.yaml`  
**Role**: Integration  
**Capabilities**: 3 (generate_recommendations, get_dashboard_overview, get_active_alerts)

**Description**:
RAG-powered customer success recommendation agent that:
- Performs semantic search in Qdrant for similar cases
- Generates recommendations using GPT-4
- Provides dashboard overview from TimescaleDB
- Manages customer health alerts

**Drupal Services**:
- `GitLabMlRecommendationsService` - RAG pipeline implementation
- `GitLabMlDashboardService` - Dashboard data aggregation
- `QdrantVectorService` - Vector search

**Features**:
- ✅ RAG pipeline (Qdrant + GPT-4)
- ✅ OpenTelemetry monitoring
- ✅ Redis caching
- ✅ A2A communication
- ✅ Event bus integration
- ✅ SOC2/HIPAA compliance

---

## Drupal Extension Features

### Required Fields

```yaml
extensions:
  drupal:
    module: "ai_agent_orchestra"        # Required: Drupal module
    service: "ai_agent_orchestra.service_name"  # Required: Service ID
```

### Optional Fields

```yaml
extensions:
  drupal:
    dependencies: [...]        # Required Drupal modules
    database: {...}            # Database tables
    rag_pipeline: {...}        # RAG configuration
    monitoring: {...}          # Observability
    caching: {...}             # Performance
    permissions: [...]         # Access control
    a2a_config: {...}          # Agent-to-Agent comm
    event_bus: {...}           # Pub/sub events
```

---

## Usage

### 1. Validate Example

```bash
cd /Users/flux423/Sites/LLM/OSSA
ossa validate examples/drupal/gitlab-ml-recommender.ossa.yaml --verbose
```

### 2. Deploy to Drupal

```bash
# Via buildkit
buildkit drupal deploy examples/drupal/gitlab-ml-recommender.ossa.yaml

# Via Drush
cd /Users/flux423/Sites/LLM/llm-platform
drush ai:agents:deploy ../OSSA/examples/drupal/gitlab-ml-recommender.ossa.yaml
```

### 3. Execute Capability

```php
<?php

// In Drupal
$agent = \Drupal::entityTypeManager()
  ->getStorage('ai_agent')
  ->load('gitlab-ml-recommender');

$manifest = json_decode($agent->get('manifest')->value, TRUE);

$result = \Drupal::service('ai_agent_orchestra.execution')
  ->executeCapability($manifest, 'generate_recommendations', [
    'customer_id' => '123e4567-e89b-12d3-a456-426614174000',
    'context' => 'health',
    'limit' => 10,
  ]);
```

---

## Creating Your Own Drupal Agent

### Step 1: Generate Base Manifest

```bash
ossa generate integration \
  --name "My Drupal Agent" \
  --runtime docker \
  --output my-drupal-agent.ossa.yaml
```

### Step 2: Add Drupal Extension

Edit `my-drupal-agent.ossa.yaml`:

```yaml
extensions:
  drupal:
    module: "my_custom_module"
    service: "my_custom_module.my_agent_service"
    dependencies:
      - "ai_agents"
    monitoring:
      metrics: true
      tracing: true
      opentelemetry:
        endpoint: "http://agent-tracer:4318"
```

### Step 3: Define Capabilities

Add OpenAPI-style capabilities:

```yaml
capabilities:
  - name: my_capability
    description: "What this capability does"
    input_schema:
      type: object
      required: [input_field]
      properties:
        input_field: { type: string }
    output_schema:
      type: object
      properties:
        result: { type: string }
```

### Step 4: Validate & Deploy

```bash
# Validate
ossa validate my-drupal-agent.ossa.yaml

# Deploy
buildkit drupal deploy my-drupal-agent.ossa.yaml
```

---

## Integration with Drupal Services

### Service Implementation Pattern

```php
<?php

namespace Drupal\my_module\Service;

/**
 * OSSA-compliant agent service
 * 
 * Implements capabilities defined in OSSA manifest
 */
class MyAgentService {
  
  /**
   * Execute OSSA capability
   * 
   * @param string $capabilityName
   *   Capability name from OSSA manifest
   * @param array $input
   *   Input data (validated against input_schema)
   * 
   * @return array
   *   Output data (validated against output_schema)
   */
  public function executeCapability(string $capabilityName, array $input): array {
    // 1. Load OSSA manifest
    $manifest = $this->loadManifest();
    
    // 2. Validate input against capability input_schema
    $this->validateInput($manifest, $capabilityName, $input);
    
    // 3. Execute capability logic
    $output = match ($capabilityName) {
      'my_capability' => $this->executeMyCapability($input),
      default => throw new \InvalidArgumentException("Unknown capability: $capabilityName"),
    };
    
    // 4. Validate output against capability output_schema
    $this->validateOutput($manifest, $capabilityName, $output);
    
    return $output;
  }
}
```

---

## Benefits

### 1. Type Safety

OSSA provides JSON Schema validation for all inputs/outputs.

### 2. Discoverability

Agents self-describe their capabilities via OSSA manifest.

### 3. Portability

Same OSSA manifest works in:
- Drupal LLM Platform
- agent-buildkit
- kAgent (Kubernetes)
- Custom frameworks

### 4. Documentation

OSSA capabilities = OpenAPI operations (self-documenting).

---

## Resources

- **Drupal Extension Schema**: `../../schemas/extensions/drupal-v1.yml`
- **Integration Guide**: `../../docs/integration/drupal-platform.md`
- **OSSA Specification**: `../../spec/v1.0/SPECIFICATION.md`
- **Drupal Modules**: `/Users/flux423/Sites/LLM/all_drupal_custom/modules/`

---

## Support

- **Issues**: https://gitlab.bluefly.io/llm/ossa/-/issues
- **Drupal Documentation**: `/Users/flux423/Sites/LLM/llm-platform/docs/`
- **CLI Help**: `ossa --help`

---

**Last Updated**: 2025-10-24  
**Status**: Production Ready  
**OSSA Version**: 1.0
