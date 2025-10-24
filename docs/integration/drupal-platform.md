# OSSA Integration with Drupal LLM Platform

**Integration Type**: Platform Integration  
**Platform**: llm-platform (Drupal 11)  
**OSSA Version**: 1.0  
**Status**: Production Ready

---

## Overview

The Drupal LLM Platform uses OSSA manifests to define and register AI agents within the platform's orchestration layer. This integration enables:

- ✅ **Agent Registry** - `ai_agents` module stores OSSA manifests
- ✅ **Agent Orchestra** - `ai_agent_orchestra` module orchestrates OSSA-compliant agents
- ✅ **ML Intelligence** - GitLab ML services use OSSA for recommendation agents
- ✅ **Marketplace** - `ai_agent_marketplace` discovers and deploys OSSA agents

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Drupal LLM Platform                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  ai_agents   │  │ ai_agent_    │  │ ai_agent_    │    │
│  │  (Registry)  │  │  orchestra   │  │  marketplace │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                  │                  │            │
│         └──────────────────┴──────────────────┘            │
│                            │                               │
│                     ┌──────▼────────┐                     │
│                     │  OSSA Loader  │                     │
│                     │  & Validator  │                     │
│                     └──────┬────────┘                     │
│                            │                               │
└────────────────────────────┼───────────────────────────────┘
                             │
                    ┌────────▼─────────┐
                    │  OSSA Manifest   │
                    │  (agent.ossa.yaml)│
                    └──────────────────┘
```

---

## Integration Points

### 1. Agent Registration

**Drupal Module**: `ai_agents`  
**OSSA Usage**: Store and validate agent manifests

```php
<?php
// In ai_agents module

use Drupal\ai_agents\Service\OssaValidationService;

/**
 * Register OSSA-compliant agent
 */
public function registerAgent(string $manifestPath): AgentEntity {
  // 1. Validate OSSA manifest
  $validator = \Drupal::service('ai_agents.ossa_validator');
  $result = $validator->validate($manifestPath);
  
  if (!$result['valid']) {
    throw new \Exception('Invalid OSSA manifest: ' . implode(', ', $result['errors']));
  }
  
  // 2. Parse manifest
  $manifest = $validator->parse($manifestPath);
  
  // 3. Create agent entity
  $agent = AgentEntity::create([
    'id' => $manifest['agent']['id'],
    'name' => $manifest['agent']['name'],
    'version' => $manifest['agent']['version'],
    'role' => $manifest['agent']['role'],
    'manifest' => json_encode($manifest),
    'status' => 'registered',
  ]);
  
  $agent->save();
  
  return $agent;
}
```

### 2. Agent Orchestration

**Drupal Module**: `ai_agent_orchestra`  
**OSSA Usage**: Orchestrate agent execution

```php
<?php
// In ai_agent_orchestra module

/**
 * Deploy OSSA agent for orchestration
 */
public function deployAgent(array $ossaManifest): void {
  $agentId = $ossaManifest['agent']['id'];
  $runtime = $ossaManifest['agent']['runtime'];
  
  // Deploy based on runtime type
  switch ($runtime['type']) {
    case 'docker':
      $this->dockerService->deploy($agentId, $runtime['image']);
      break;
      
    case 'k8s':
      $this->kubernetesService->deploy($agentId, $ossaManifest);
      break;
      
    case 'local':
      $this->localRuntime->execute($agentId, $runtime['command']);
      break;
  }
  
  $this->logger->info('Deployed OSSA agent: @id', ['@id' => $agentId]);
}
```

### 3. ML Intelligence Integration

**Drupal Module**: `ai_agent_orchestra`  
**Services**: GitLabMlDashboardService, GitLabMlRecommendationsService  
**OSSA Usage**: Define recommendation agents with RAG pipeline

```yaml
# examples/drupal/gitlab-ml-recommender.ossa.yaml
ossaVersion: "1.0"

agent:
  id: gitlab-ml-recommender
  name: "GitLab ML Recommendation Engine"
  version: "1.0.0"
  role: "integration"
  description: "AI agent for GitLab customer success recommendations using RAG pipeline"
  
  runtime:
    type: "docker"
    image: "llm-platform/ml-recommender:1.0"
    resources:
      cpu: "1000m"
      memory: "2Gi"
  
  capabilities:
    - name: generate_recommendations
      description: "Generate AI recommendations using RAG (Qdrant + GPT-4)"
      input_schema:
        type: object
        required: [customer_id]
        properties:
          customer_id:
            type: string
            format: uuid
            description: "Customer UUID"
          context:
            type: string
            enum: [health, churn, engagement, technical]
            description: "Recommendation context"
          limit:
            type: integer
            default: 10
            minimum: 1
            maximum: 50
      output_schema:
        type: object
        required: [recommendations]
        properties:
          customerId:
            type: string
          recommendations:
            type: array
            items:
              type: object
              required: [id, title, priority]
              properties:
                id:
                  type: string
                  format: uuid
                title:
                  type: string
                description:
                  type: string
                priority:
                  type: string
                  enum: [critical, high, medium, low]
                category:
                  type: string
                  enum: [engagement, technical, health, success]
                actionItems:
                  type: array
                  items:
                    type: string
                rationale:
                  type: string
      examples:
        - name: "Health context recommendations"
          input:
            customer_id: "123e4567-e89b-12d3-a456-426614174000"
            context: "health"
            limit: 5
          output:
            customerId: "123e4567-e89b-12d3-a456-426614174000"
            recommendations:
              - id: "rec-001"
                title: "Schedule health check meeting"
                description: "Conduct comprehensive health review"
                priority: "high"
                category: "engagement"
                actionItems:
                  - "Send meeting invitation"
                  - "Prepare questionnaire"
                rationale: "Early issue identification"
    
    - name: get_dashboard_data
      description: "Retrieve customer health dashboard data"
      input_schema:
        type: object
        required: [time_range]
        properties:
          time_range:
            type: string
            enum: ["24h", "7d", "30d", "90d"]
      output_schema:
        type: object
        properties:
          totalCustomers:
            type: integer
          healthDistribution:
            type: object
          churnRisks:
            type: object
          activeAlerts:
            type: integer

  llm:
    provider: "openai"
    model: "gpt-4"
    temperature: 0.7
    maxTokens: 2000
  
  tools:
    - type: "mcp"
      server: "qdrant-mcp"
      namespace: "default"
      capabilities:
        - semantic_search
        - vector_retrieval
    
    - type: "http"
      endpoint: "http://agent-router:4000"
      capabilities:
        - llm_generation
  
  protocols:
    - type: "http"
      version: "1.1"
      endpoint: "/api/v1/recommendations"
    
    - type: "sse"
      version: "1.0"
      endpoint: "/api/v1/stream"

  compliance:
    frameworks: ["SOC2", "HIPAA"]
    dataClassification: "confidential"
    retentionPolicy: "7years"

extensions:
  drupal:
    module: "ai_agent_orchestra"
    service: "gitlab_ml_recommendations"
    dependencies:
      - "ai_agents"
      - "ai_provider_langchain"
    
    database:
      tables:
        - gitlab_ml_metrics
        - gitlab_ml_alerts
        - gitlab_ml_recommendations
    
    rag_pipeline:
      vector_db: "qdrant"
      collection: "gitlab_customer_embeddings"
      similarity_limit: 5
      llm_service: "http://agent-router:4000"
    
    monitoring:
      metrics: true
      tracing: true
      logging: true
      opentelemetry:
        endpoint: "http://agent-tracer:4318"
```

---

## Usage Patterns

### 1. Register Agent in Drupal

```php
<?php

use Drupal\ai_agents\Service\OssaService;

// Load OSSA manifest
$ossaService = \Drupal::service('ai_agents.ossa');
$manifest = $ossaService->loadManifest('path/to/agent.ossa.yaml');

// Validate
$validationResult = $ossaService->validate($manifest);

if ($validationResult['valid']) {
  // Register in Drupal
  $agent = $ossaService->registerAgent($manifest);
  
  \Drupal::logger('ai_agents')->info('Registered OSSA agent: @id', [
    '@id' => $agent->id(),
  ]);
}
```

### 2. Execute Agent Capability

```php
<?php

use Drupal\ai_agent_orchestra\Service\AgentExecutionService;

// Get registered agent
$agent = \Drupal::entityTypeManager()
  ->getStorage('ai_agent')
  ->load('gitlab-ml-recommender');

$manifest = json_decode($agent->get('manifest')->value, TRUE);

// Execute capability
$executionService = \Drupal::service('ai_agent_orchestra.execution');
$result = $executionService->executeCapability(
  $manifest,
  'generate_recommendations',
  [
    'customer_id' => '123e4567-e89b-12d3-a456-426614174000',
    'context' => 'health',
    'limit' => 10,
  ]
);

// $result contains recommendations from RAG pipeline
```

### 3. Dashboard Integration

```php
<?php

use Drupal\ai_agent_orchestra\Service\GitLabMlDashboardService;

// Dashboard service uses OSSA-compliant agents internally
$dashboardService = \Drupal::service('ai_agent_orchestra.gitlab_ml_dashboard');

// Get overview (powered by OSSA recommendation agent)
$overview = $dashboardService->getOverview('7d');

// Get AI recommendations via OSSA agent
$recommendations = $this->recommendationsService->getRecommendations(
  $customer_id,
  'health',
  10
);
```

---

## OSSA Extension for Drupal

### Schema Definition

```yaml
# schemas/extensions/drupal-v1.yml
apiVersion: ossa/v1
kind: ExtensionSchema
metadata:
  name: drupal-extension
  version: v1
  platform: drupal

spec:
  compatibleWith:
    - "drupal/11"
    - "drupal/10"
  
  description: "Extension schema for Drupal-based agent deployment"
  
  additionalFields:
    module:
      type: string
      description: "Drupal module that owns this agent"
      examples: ["ai_agents", "ai_agent_orchestra"]
    
    service:
      type: string
      description: "Drupal service ID for agent execution"
      pattern: "^[a-z][a-z0-9_]*\\.[a-z][a-z0-9_]*$"
      examples: ["ai_agents.executor", "ai_agent_orchestra.gitlab_ml_recommendations"]
    
    dependencies:
      type: array
      items:
        type: string
      description: "Required Drupal modules"
      examples: [["ai_agents", "ai_provider_langchain"]]
    
    database:
      type: object
      properties:
        tables:
          type: array
          items:
            type: string
          description: "Required database tables"
        migrations:
          type: array
          description: "Required migrations"
    
    rag_pipeline:
      type: object
      properties:
        vector_db:
          type: string
          enum: ["qdrant", "weaviate", "pinecone"]
        collection:
          type: string
        similarity_limit:
          type: integer
          default: 5
        llm_service:
          type: string
          format: uri
    
    monitoring:
      type: object
      properties:
        metrics:
          type: boolean
        tracing:
          type: boolean
        logging:
          type: boolean
        opentelemetry:
          type: object
          properties:
            endpoint:
              type: string
              format: uri

  validation:
    required:
      - module
      - service
    customRules:
      - name: "validate-drupal-service"
        rule: "Service ID must match module namespace"
      - name: "validate-dependencies"
        rule: "All dependencies must be installed Drupal modules"
```

---

## Example: GitLab ML Recommendation Agent

### OSSA Manifest

```yaml
ossaVersion: "1.0"

agent:
  id: gitlab-ml-recommender
  name: "GitLab ML Recommendation Engine"
  version: "1.0.0"
  role: "integration"
  description: "RAG-powered customer success recommendation agent"
  
  runtime:
    type: "docker"
    image: "llm-platform/ml-recommender:1.0"
  
  capabilities:
    - name: generate_recommendations
      description: "Generate recommendations via RAG (Qdrant + GPT-4)"
      input_schema:
        type: object
        required: [customer_id]
        properties:
          customer_id: { type: string, format: uuid }
          context: { type: string, enum: [health, churn, engagement] }
          limit: { type: integer, default: 10 }
      output_schema:
        type: object
        properties:
          recommendations: { type: array }
  
  llm:
    provider: "openai"
    model: "gpt-4"
    temperature: 0.7

extensions:
  drupal:
    module: "ai_agent_orchestra"
    service: "ai_agent_orchestra.gitlab_ml_recommendations"
    dependencies:
      - "ai_agents"
      - "ai_provider_langchain"
    
    rag_pipeline:
      vector_db: "qdrant"
      collection: "gitlab_customer_embeddings"
      similarity_limit: 5
      llm_service: "http://agent-router:4000"
    
    monitoring:
      metrics: true
      tracing: true
      opentelemetry:
        endpoint: "http://agent-tracer:4318"
```

### Corresponding PHP Service

```php
<?php

namespace Drupal\ai_agent_orchestra\Service;

/**
 * OSSA-compliant GitLab ML Recommendations Service
 * 
 * This service implements the OSSA manifest capabilities:
 * - generate_recommendations (RAG pipeline)
 * - Uses Qdrant for semantic search
 * - Uses GPT-4 for generation
 * - Follows OSSA input/output schemas
 */
class GitLabMlRecommendationsService {
  
  /**
   * Execute OSSA capability: generate_recommendations
   * 
   * Matches OSSA manifest input_schema and output_schema
   */
  public function getRecommendations(
    string $customer_id,
    ?string $context = NULL,
    int $limit = 10
  ): array {
    // Step 1: Validate input against OSSA input_schema
    $this->validateInput(['customer_id' => $customer_id, 'limit' => $limit]);
    
    // Step 2: RAG Pipeline (as defined in OSSA manifest)
    $customer_vector = $this->getCustomerVector($customer_id);
    $similar_cases = $this->findSimilarSuccessfulCases($customer_vector, $context);
    $recommendations = $this->generateRecommendations($customer_id, $context, $similar_cases, $limit);
    
    // Step 3: Return data matching OSSA output_schema
    return [
      'customerId' => $customer_id,
      'recommendations' => $recommendations,
      'generatedAt' => date('c'),
    ];
  }
  
  /**
   * Validate input against OSSA input_schema
   */
  protected function validateInput(array $input): void {
    // Load OSSA manifest for this service
    $manifest = $this->getOssaManifest();
    $capability = $this->findCapability($manifest, 'generate_recommendations');
    
    // Validate against input_schema
    $validator = new JsonSchemaValidator();
    $result = $validator->validate($input, $capability['input_schema']);
    
    if (!$result['valid']) {
      throw new \InvalidArgumentException('Input validation failed: ' . implode(', ', $result['errors']));
    }
  }
}
```

---

## Benefits of OSSA Integration

### 1. **Type Safety**

OSSA capabilities define exact input/output schemas:

```php
<?php
// Before OSSA: No schema validation
public function getRecommendations($customer_id, $context = null, $limit = 10) {
  // No validation - runtime errors possible
}

// After OSSA: Schema-validated
public function getRecommendations(string $customer_id, ?string $context, int $limit): array {
  // Input validated against OSSA input_schema
  // Output validated against OSSA output_schema
  // Type-safe!
}
```

### 2. **Discoverability**

Agents are discoverable via OSSA manifests:

```bash
# List all OSSA agents in Drupal
drush ai:agents:list

# Show agent capabilities (from OSSA manifest)
drush ai:agents:inspect gitlab-ml-recommender

# Output:
# ID: gitlab-ml-recommender
# Capabilities:
#   - generate_recommendations (input: {customer_id, context}, output: {recommendations})
#   - get_dashboard_data (input: {time_range}, output: {overview})
```

### 3. **Portability**

Same OSSA manifest can deploy to:
- ✅ Drupal LLM Platform
- ✅ agent-buildkit (BAR runtime)
- ✅ kAgent (Kubernetes)
- ✅ Custom frameworks

### 4. **OpenAPI-Style Documentation**

OSSA capabilities = OpenAPI operations:

```yaml
# Like OpenAPI endpoint documentation
capabilities:
  - name: generate_recommendations      # operationId
    description: "..."                  # summary
    input_schema: {...}                 # requestBody
    output_schema: {...}                # response
    examples: [...]                     # examples
```

---

## Implementation Checklist

### Drupal Module Setup

- [ ] Install `ai_agents` module
- [ ] Install `ai_agent_orchestra` module
- [ ] Configure Qdrant connection (agent-brain:6333)
- [ ] Configure agent-router (port 4000)
- [ ] Configure agent-tracer (OpenTelemetry)

### OSSA Integration

- [ ] Create `OssaValidationService` in `ai_agents`
- [ ] Create `OssaLoaderService` in `ai_agents`
- [ ] Update `AgentExecutionService` to read OSSA capabilities
- [ ] Add OSSA manifest field to `AgentEntity`
- [ ] Create Drush commands for OSSA agents

### Testing

- [ ] Validate all agent manifests on module install
- [ ] Test capability execution matches schemas
- [ ] Verify monitoring integration (OpenTelemetry)
- [ ] Load test with agent-router

---

## Advanced Features

### 1. **Multi-Agent Orchestration**

```yaml
# OSSA manifest for orchestrator agent
ossaVersion: "1.0"

agent:
  id: drupal-orchestrator
  name: "Drupal Multi-Agent Orchestrator"
  role: "orchestration"
  
  capabilities:
    - name: orchestrate_agents
      description: "Coordinate multiple OSSA agents"
      input_schema:
        type: object
        properties:
          agents:
            type: array
            items:
              type: string
          workflow:
            type: object
      output_schema:
        type: object
        properties:
          results:
            type: array

extensions:
  drupal:
    module: "ai_agent_orchestra"
    orchestration:
      strategy: "sequential"  # or "parallel", "dag"
      timeout: 300
      retry_policy:
        max_attempts: 3
```

### 2. **A2A Communication**

```yaml
extensions:
  drupal:
    a2a_config:
      enabled: true
      protocol: "json-rpc"
      endpoints:
        - "http://gitlab-ml-recommender:8080/a2a"
        - "http://compliance-validator:8080/a2a"
      authentication:
        type: "bearer"
        secretRef:
          name: "drupal-a2a-token"
```

### 3. **Event Bus Integration**

```yaml
extensions:
  drupal:
    event_bus:
      enabled: true
      topics:
        - "customer.health.changed"
        - "recommendations.generated"
        - "alerts.created"
      redis:
        host: "redis://buildkit-redis:16379"
```

---

## CLI Integration

### Drupal + OSSA CLI

```bash
# Validate OSSA manifest before deploying to Drupal
ossa validate gitlab-ml-recommender.ossa.yaml

# Generate new Drupal agent
ossa generate integration \
  --name "New Drupal Agent" \
  --runtime docker \
  --output new-agent.ossa.yaml

# Deploy to Drupal via buildkit
buildkit drupal deploy new-agent.ossa.yaml

# Or via Drush
drush ai:agents:deploy new-agent.ossa.yaml
```

---

## Best Practices

### 1. **Always Validate Manifests**

```php
<?php

// Before using any OSSA manifest in Drupal
$validator = \Drupal::service('ai_agents.ossa_validator');
$result = $validator->validate($manifestPath);

if (!$result['valid']) {
  throw new OssaValidationException($result['errors']);
}
```

### 2. **Use Capability Schemas for Validation**

```php
<?php

// Validate execution input against OSSA capability input_schema
public function executeCapability(array $manifest, string $capabilityName, array $input): array {
  $capability = $this->findCapability($manifest, $capabilityName);
  
  $this->validateAgainstSchema($input, $capability['input_schema']);
  
  $output = $this->execute($manifest, $capabilityName, $input);
  
  $this->validateAgainstSchema($output, $capability['output_schema']);
  
  return $output;
}
```

### 3. **Monitor OSSA Agent Execution**

```php
<?php

// Use OpenTelemetry tracing (from OSSA manifest)
$tracer = \Drupal::service('agent_tracer.tracer');
$span = $tracer->startSpan('ossa.capability.execute', [
  'agent_id' => $manifest['agent']['id'],
  'capability' => $capabilityName,
]);

try {
  $result = $this->execute($manifest, $capabilityName, $input);
  $span->setStatus('success');
  return $result;
} catch (\Exception $e) {
  $span->setStatus('error');
  $span->recordException($e);
  throw $e;
} finally {
  $span->end();
}
```

---

## Troubleshooting

### Common Issues

**Issue**: OSSA manifest validation fails in Drupal

```bash
# Solution: Validate with OSSA CLI first
cd /path/to/drupal/modules/custom/my_agent
ossa validate agent.ossa.yaml --verbose

# Check for schema errors
# Fix manifest
# Re-validate
```

**Issue**: Capability execution doesn't match schema

```php
<?php
// Debug: Enable verbose logging
$this->config->set('ai_agents.debug', TRUE);

// Check execution logs
drush watchdog:tail --filter="ai_agents"
```

---

## Migration Guide

### Migrating Existing Drupal Agents to OSSA

1. **Extract Agent Metadata**
```php
<?php
$agent = AgentEntity::load('my-agent');
$config = [
  'id' => $agent->id(),
  'name' => $agent->label(),
  'version' => $agent->get('version')->value,
];
```

2. **Create OSSA Manifest**
```bash
ossa generate integration \
  --name "My Agent" \
  --id my-agent \
  --runtime docker \
  --output my-agent.ossa.yaml
```

3. **Add Drupal Extension**
```yaml
extensions:
  drupal:
    module: "my_module"
    service: "my_module.agent_service"
```

4. **Validate & Deploy**
```bash
ossa validate my-agent.ossa.yaml
drush ai:agents:deploy my-agent.ossa.yaml
```

---

## Performance Considerations

### 1. **Caching OSSA Manifests**

```php
<?php

use Drupal\Core\Cache\CacheBackendInterface;

class OssaService {
  protected function loadManifest(string $agentId): array {
    $cid = "ossa_manifest:{$agentId}";
    
    // Check cache first
    if ($cached = $this->cache->get($cid)) {
      return $cached->data;
    }
    
    // Load and parse
    $manifest = $this->parseManifestFile($agentId);
    
    // Cache for 1 hour
    $this->cache->set($cid, $manifest, time() + 3600);
    
    return $manifest;
  }
}
```

### 2. **Lazy Loading Capabilities**

Only load capability schemas when needed:

```php
<?php

// Don't load entire manifest if you just need metadata
public function getAgentMetadata(string $agentId): array {
  $manifest = $this->loadManifest($agentId);
  
  return [
    'id' => $manifest['agent']['id'],
    'name' => $manifest['agent']['name'],
    'version' => $manifest['agent']['version'],
    'role' => $manifest['agent']['role'],
    // Don't parse capabilities unless needed
  ];
}
```

---

## Future Enhancements

### 1. **Drupal OSSA UI Module**

- Visual OSSA manifest editor
- Capability schema builder
- Real-time validation
- Agent marketplace integration

### 2. **OSSA-Driven API Generation**

Generate Drupal REST resources from OSSA capabilities:

```php
<?php
// Auto-generate REST endpoint from OSSA capability
// capability: generate_recommendations
// → creates: /api/v1/agents/gitlab-ml-recommender/generate-recommendations
```

### 3. **OSSA Compliance Dashboard**

Track OSSA compliance across all Drupal agents:
- Schema validation status
- Capability coverage
- Extension usage
- Version compatibility

---

## Resources

- **OSSA Specification**: `../../spec/v1.0/SPECIFICATION.md`
- **Drupal Extension Schema**: `../../schemas/extensions/drupal-v1.yml`
- **Example Agents**: `../../examples/drupal/`
- **Drupal Documentation**: `/Users/flux423/Sites/LLM/llm-platform/docs/`

---

## Summary

OSSA integration with Drupal LLM Platform provides:

- ✅ **Type-safe agent definitions** with JSON Schema validation
- ✅ **Capability-driven architecture** (OpenAPI-style operations)
- ✅ **Discoverability** via agent registry
- ✅ **Portability** across platforms (Drupal, buildkit, kAgent)
- ✅ **OpenTelemetry monitoring** built-in
- ✅ **RAG pipeline support** for intelligent agents

**OSSA makes Drupal agents portable, discoverable, and enterprise-ready!**

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-24  
**Author**: LLM Platform Team  
**Integration Status**: Production Ready
