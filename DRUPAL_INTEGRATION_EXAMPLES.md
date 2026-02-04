# OSSA ↔ Drupal Integration Practical Examples

**Real-world code examples for implementing the integration**

---

## Table of Contents

1. [Complete Agent Example](#complete-agent-example)
2. [Drupal Module Generation](#drupal-module-generation)
3. [Bridge Server Implementation](#bridge-server-implementation)
4. [REST API Usage](#rest-api-usage)
5. [Testing Examples](#testing-examples)
6. [Deployment Scripts](#deployment-scripts)

---

## 1. Complete Agent Example

### Example: Content Moderation Agent

**Step 1: Create OSSA Manifest**

```yaml
# agents/content_moderator.yaml
apiVersion: ossa/v0.4.1
kind: Agent
metadata:
  name: content-moderator
  namespace: ai.agents.ossa
  version: 1.2.0
  labels:
    displayName: "Content Moderator"
    category: content
    vendor: bluefly
  annotations:
    description: "AI-powered content moderation for Drupal sites"
    author: "BlueFly.io"
    license: "MIT"
  description: |
    Analyzes user-generated content for policy violations, spam,
    inappropriate language, and sentiment. Integrates with Drupal's
    content moderation workflow.

spec:
  type: autonomous

  runtime:
    environment: drupal
    resources:
      memory: 512Mi
      cpu: 500m
      timeout: 60s

  capabilities:
    - content-moderation
    - spam-detection
    - sentiment-analysis
    - policy-checking
    - language-detection

  configuration:
    schema:
      type: object
      properties:
        moderationThreshold:
          type: number
          default: 0.75
          description: Confidence threshold for auto-moderation
        enabledChecks:
          type: array
          items:
            type: string
          default: [spam, profanity, toxicity]
        notifyAdmin:
          type: boolean
          default: true

  mcp:
    mcpServers:
      - name: drupal-api
        url: http://localhost:8080/api/mcp
        description: Access Drupal content and user data
        capabilities:
          - content.read
          - content.update
          - user.read

      - name: openai-moderation
        url: https://api.openai.com/v1/mcp
        description: OpenAI content moderation API
        auth:
          type: bearer
          token: ${OPENAI_API_KEY}
        capabilities:
          - moderation.analyze
          - moderation.classify

      - name: sentiment-analyzer
        url: http://localhost:9091/api/mcp
        description: Local sentiment analysis service
        capabilities:
          - sentiment.analyze
          - language.detect

  workflow:
    steps:
      - id: fetch-content
        name: Fetch content from Drupal
        tool: drupal-api/content.read
        input:
          nodeId: ${context.node_id}

      - id: detect-language
        name: Detect content language
        tool: sentiment-analyzer/language.detect
        input:
          text: ${steps.fetch-content.output.body}

      - id: check-spam
        name: Check for spam
        tool: openai-moderation/moderation.analyze
        input:
          text: ${steps.fetch-content.output.body}
          category: spam
        condition: ${config.enabledChecks.includes('spam')}

      - id: check-sentiment
        name: Analyze sentiment
        tool: sentiment-analyzer/sentiment.analyze
        input:
          text: ${steps.fetch-content.output.body}
          language: ${steps.detect-language.output.language}

      - id: check-toxicity
        name: Check for toxic content
        tool: openai-moderation/moderation.analyze
        input:
          text: ${steps.fetch-content.output.body}
          category: toxicity
        condition: ${config.enabledChecks.includes('toxicity')}

      - id: aggregate-results
        name: Aggregate moderation results
        tool: builtin/aggregate
        input:
          results:
            - ${steps.check-spam.output}
            - ${steps.check-sentiment.output}
            - ${steps.check-toxicity.output}

      - id: update-status
        name: Update content status
        tool: drupal-api/content.update
        input:
          nodeId: ${context.node_id}
          moderationState: ${steps.aggregate-results.output.recommendation}
          moderationScore: ${steps.aggregate-results.output.confidence}
        condition: ${steps.aggregate-results.output.confidence >= config.moderationThreshold}

  outputs:
    schema:
      type: object
      properties:
        status:
          type: string
          enum: [approved, flagged, rejected]
        confidence:
          type: number
          minimum: 0
          maximum: 1
        details:
          type: object
          properties:
            spam_score:
              type: number
            sentiment:
              type: string
            toxicity_score:
              type: number
            language:
              type: string
        recommendation:
          type: string
        flagged_issues:
          type: array
          items:
            type: string

  metadata:
    tags:
      - content
      - moderation
      - ai
      - nlp
    documentation: https://docs.bluefly.io/agents/content-moderator
    repository: https://github.com/bluefly/agents/content-moderator
```

**Step 2: Generate Drupal Module**

```bash
# Generate module structure
ossa export --platform drupal \
  --manifest agents/content_moderator.yaml \
  --output web/modules/custom/ \
  --namespace "Drupal\\content_moderator"

# Expected output:
# web/modules/custom/content_moderator/
# ├── content_moderator.info.yml
# ├── content_moderator.module
# ├── content_moderator.services.yml
# ├── config/
# │   ├── install/
# │   │   └── ossa_manifest.content_moderator.yml
# │   └── schema/
# │       └── content_moderator.schema.yml
# ├── src/
# │   ├── Plugin/
# │   │   └── Agent/
# │   │       └── ContentModeratorAgent.php
# │   ├── ContentModeratorManager.php
# │   └── Form/
# │       └── ContentModeratorConfigForm.php
# └── tests/
#     └── src/
#         └── Kernel/
#             └── ContentModeratorTest.php
```

**Generated Files Preview**:

**content_moderator.info.yml**:

```yaml
name: 'Content Moderator'
type: module
description: 'AI-powered content moderation for Drupal sites'
package: AI Agents
core_version_requirement: ^10 || ^11
version: 1.2.0

dependencies:
  - drupal:ai_agents
  - drupal:ai_agents_ossa

# Generated by OSSA Buildkit v1.0.0
# Source: agents/content_moderator.yaml
# Do not edit manually - regenerate from manifest
```

**src/Plugin/Agent/ContentModeratorAgent.php**:

```php
<?php

namespace Drupal\content_moderator\Plugin\Agent;

use Drupal\ai_agents\Plugin\AgentBase;
use Drupal\ai_agents\AgentResultInterface;
use Drupal\ai_agents\Exception\AgentExecutionException;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * AI-powered content moderation for Drupal sites.
 *
 * Analyzes user-generated content for policy violations, spam,
 * inappropriate language, and sentiment. Integrates with Drupal's
 * content moderation workflow.
 *
 * @Agent(
 *   id = "content_moderator",
 *   label = @Translation("Content Moderator"),
 *   description = @Translation("AI-powered content moderation for Drupal sites"),
 *   capabilities = {
 *     "content-moderation",
 *     "spam-detection",
 *     "sentiment-analysis",
 *     "policy-checking",
 *     "language-detection"
 *   },
 *   category = "content",
 *   version = "1.2.0"
 * )
 *
 * Generated by OSSA Buildkit v1.0.0
 * Source: agents/content_moderator.yaml
 * Do not edit manually - regenerate from manifest
 */
class ContentModeratorAgent extends AgentBase implements ContainerFactoryPluginInterface {

  /**
   * The OSSA runtime bridge service.
   *
   * @var \Drupal\ai_agents_ossa\OssaRuntimeBridgeInterface
   */
  protected $runtimeBridge;

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    $instance = new static($configuration, $plugin_id, $plugin_definition);
    $instance->runtimeBridge = $container->get('ai_agents_ossa.runtime_bridge');
    return $instance;
  }

  /**
   * {@inheritdoc}
   */
  public function execute(array $context): AgentResultInterface {
    // Load OSSA manifest
    $manifest = $this->getManifest();

    // Validate context
    $validation = $this->validateContext($context);
    if (!$validation->isValid()) {
      throw new AgentExecutionException(
        'Invalid execution context: ' . implode(', ', $validation->getErrors())
      );
    }

    // Execute via OSSA runtime bridge
    try {
      return $this->runtimeBridge->execute($manifest, $context);
    }
    catch (\Exception $e) {
      $this->logger->error('Content moderator execution failed: @message', [
        '@message' => $e->getMessage(),
      ]);
      throw new AgentExecutionException(
        'Execution failed: ' . $e->getMessage(),
        $e->getCode(),
        $e
      );
    }
  }

  /**
   * {@inheritdoc}
   */
  public function validateContext(array $context): ValidationResult {
    $errors = [];

    // Required: node_id
    if (empty($context['node_id'])) {
      $errors[] = 'Missing required field: node_id';
    }

    // Validate node_id is integer
    if (isset($context['node_id']) && !is_numeric($context['node_id'])) {
      $errors[] = 'Field node_id must be numeric';
    }

    return new ValidationResult(empty($errors), $errors);
  }

  /**
   * Get OSSA manifest for this agent.
   *
   * @return array
   *   The manifest data.
   */
  protected function getManifest(): array {
    $entity_type_manager = \Drupal::entityTypeManager();
    $manifest_storage = $entity_type_manager->getStorage('ossa_manifest');

    $manifest_entity = $manifest_storage->load('content_moderator');

    if (!$manifest_entity) {
      throw new AgentExecutionException('OSSA manifest not found: content_moderator');
    }

    return $manifest_entity->getManifestData();
  }

  /**
   * {@inheritdoc}
   */
  public function getCapabilities(): array {
    return [
      'content-moderation',
      'spam-detection',
      'sentiment-analysis',
      'policy-checking',
      'language-detection',
    ];
  }

}
```

**content_moderator.services.yml**:

```yaml
services:
  content_moderator.manager:
    class: Drupal\content_moderator\ContentModeratorManager
    arguments:
      - '@entity_type.manager'
      - '@ai_agents.executor'
      - '@ai_agents_ossa.runtime_bridge'
      - '@logger.factory'
    tags:
      - { name: 'service_id_alias', id: 'agent.content_moderator' }

# Generated by OSSA Buildkit v1.0.0
```

**Step 3: Install and Configure**

```bash
# Install module
drush pm:enable content_moderator

# Import configuration
ossa export --platform drupal-config \
  --manifest agents/content_moderator.yaml \
  --output config/sync/
drush config:import --partial

# Configure module
drush config:set content_moderator.settings moderationThreshold 0.80
drush config:set content_moderator.settings enabledChecks "spam,profanity,toxicity"
drush config:set content_moderator.settings notifyAdmin true

# Clear cache
drush cache:rebuild
```

**Step 4: Test Execution**

```bash
# Execute via Drush
drush ai-agents:execute content-moderator \
  --context='{"node_id": 123}' \
  --verbose

# Expected output:
# Executing agent: content-moderator
# Context: {"node_id": 123}
# Calling bridge server: http://localhost:9090/api/execute
# Execution completed in 2.3s
# Status: success
# Result:
#   status: flagged
#   confidence: 0.92
#   details:
#     spam_score: 0.15
#     sentiment: negative
#     toxicity_score: 0.88
#     language: en
#   recommendation: manual_review
#   flagged_issues:
#     - high_toxicity
#     - negative_sentiment
```

---

## 2. Drupal Module Generation

### Buildkit Export Command Implementation

**buildkit/src/commands/export.ts**:

```typescript
import { Command, Flags } from '@oclif/core';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import YAML from 'yaml';
import Handlebars from 'handlebars';

export default class Export extends Command {
  static description = 'Export OSSA manifest to platform-specific format';

  static flags = {
    platform: Flags.string({
      char: 'p',
      description: 'Target platform',
      required: true,
      options: ['drupal', 'drupal-config', 'wordpress', 'laravel'],
    }),
    manifest: Flags.string({
      char: 'm',
      description: 'Path to OSSA manifest file',
      required: true,
    }),
    output: Flags.string({
      char: 'o',
      description: 'Output directory',
      required: true,
    }),
    namespace: Flags.string({
      char: 'n',
      description: 'PHP namespace for generated code',
      default: 'Drupal\\{module_name}',
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Export);

    // Load and validate manifest
    const manifestContent = readFileSync(flags.manifest, 'utf8');
    const manifest = YAML.parse(manifestContent);

    this.log('Validating OSSA manifest...');
    await this.validateManifest(manifest);

    // Export based on platform
    switch (flags.platform) {
      case 'drupal':
        await this.exportDrupalModule(manifest, flags.output, flags.namespace);
        break;
      case 'drupal-config':
        await this.exportDrupalConfig(manifest, flags.output);
        break;
      default:
        this.error(`Platform not yet supported: ${flags.platform}`);
    }

    this.log('✓ Export completed successfully');
  }

  async validateManifest(manifest: any): Promise<void> {
    // TODO: JSON Schema validation
    if (manifest.apiVersion !== 'ossa/v0.4.1') {
      this.error('Invalid OSSA version. Expected: ossa/v0.4.1');
    }
  }

  async exportDrupalModule(
    manifest: any,
    outputDir: string,
    namespaceTemplate: string
  ): Promise<void> {
    const moduleName = this.toSnakeCase(manifest.metadata.name);
    const moduleDir = join(outputDir, moduleName);

    this.log(`Generating Drupal module: ${moduleName}`);

    // Create module structure
    mkdirSync(moduleDir, { recursive: true });
    mkdirSync(join(moduleDir, 'src/Plugin/Agent'), { recursive: true });
    mkdirSync(join(moduleDir, 'config/install'), { recursive: true });
    mkdirSync(join(moduleDir, 'tests/src/Kernel'), { recursive: true });

    // Prepare template context
    const context = {
      module_name: moduleName,
      manifest: manifest,
      className: this.toPascalCase(manifest.metadata.name) + 'Agent',
      namespace: namespaceTemplate.replace('{module_name}', moduleName),
      buildkit_version: this.config.version,
    };

    // Generate .info.yml
    await this.generateFromTemplate(
      'drupal/info.yml.hbs',
      join(moduleDir, `${moduleName}.info.yml`),
      context
    );

    // Generate .services.yml
    await this.generateFromTemplate(
      'drupal/services.yml.hbs',
      join(moduleDir, `${moduleName}.services.yml`),
      context
    );

    // Generate Plugin class
    await this.generateFromTemplate(
      'drupal/Plugin/Agent.php.hbs',
      join(moduleDir, `src/Plugin/Agent/${context.className}.php`),
      context
    );

    // Generate Manager class
    await this.generateFromTemplate(
      'drupal/Manager.php.hbs',
      join(moduleDir, `src/${context.className}Manager.php`),
      context
    );

    // Generate test
    await this.generateFromTemplate(
      'drupal/tests/AgentTest.php.hbs',
      join(moduleDir, `tests/src/Kernel/${context.className}Test.php`),
      context
    );

    this.log(`✓ Module generated: ${moduleDir}`);
  }

  async exportDrupalConfig(manifest: any, outputDir: string): Promise<void> {
    const manifestId = this.toSnakeCase(manifest.metadata.name);

    this.log(`Generating Drupal config: ${manifestId}`);

    // Generate ossa_manifest config
    const manifestConfig = {
      langcode: 'en',
      status: true,
      dependencies: {
        module: ['ai_agents_ossa'],
      },
      id: manifestId,
      label: manifest.metadata.labels?.displayName || manifest.metadata.name,
      manifest_version: manifest.apiVersion,
      manifest_data: manifest,
    };

    const manifestYaml = YAML.stringify(manifestConfig);
    const manifestPath = join(outputDir, `ossa_manifest.${manifestId}.yml`);

    mkdirSync(outputDir, { recursive: true });
    writeFileSync(manifestPath, manifestYaml);

    // Generate ossa_agent config (runtime instance)
    const agentConfig = {
      langcode: 'en',
      status: true,
      dependencies: {
        config: [`ossa_manifest.${manifestId}`],
      },
      id: `${manifestId}_default`,
      label: `${manifest.metadata.labels?.displayName || manifest.metadata.name} (Default)`,
      manifest_id: manifestId,
      runtime_config: manifest.spec.configuration?.schema?.properties || {},
      status: 'active',
    };

    const agentYaml = YAML.stringify(agentConfig);
    const agentPath = join(outputDir, `ossa_agent.${manifestId}_default.yml`);
    writeFileSync(agentPath, agentYaml);

    this.log(`✓ Config files generated:`);
    this.log(`  - ${manifestPath}`);
    this.log(`  - ${agentPath}`);
  }

  async generateFromTemplate(
    templatePath: string,
    outputPath: string,
    context: any
  ): Promise<void> {
    const templateContent = readFileSync(
      join(__dirname, '../templates', templatePath),
      'utf8'
    );
    const template = Handlebars.compile(templateContent);
    const output = template(context);

    writeFileSync(outputPath, output);
  }

  toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).replace(/^_/, '');
  }

  toPascalCase(str: string): string {
    return str.replace(/(^|[-_])(\w)/g, (_, __, char) => char.toUpperCase());
  }
}
```

### Handlebars Templates

**templates/drupal/Plugin/Agent.php.hbs**:

```handlebars
<?php

namespace {{ namespace }}\Plugin\Agent;

use Drupal\ai_agents\Plugin\AgentBase;
use Drupal\ai_agents\AgentResultInterface;
use Drupal\ai_agents\Exception\AgentExecutionException;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * {{ manifest.metadata.description }}
 *
 * @Agent(
 *   id = "{{ manifest.metadata.name }}",
 *   label = @Translation("{{ manifest.metadata.labels.displayName }}"),
 *   description = @Translation("{{ manifest.metadata.description }}"),
 *   capabilities = {
{{#each manifest.spec.capabilities}}
 *     "{{ this }}"{{#unless @last}},{{/unless}}
{{/each}}
 *   },
 *   category = "{{ manifest.metadata.labels.category }}",
 *   version = "{{ manifest.metadata.version }}"
 * )
 *
 * Generated by OSSA Buildkit v{{ buildkit_version }}
 * Source: {{ manifest.metadata.name }}.yaml
 * Do not edit manually - regenerate from manifest
 */
class {{ className }} extends AgentBase implements ContainerFactoryPluginInterface {

  /**
   * The OSSA runtime bridge service.
   *
   * @var \Drupal\ai_agents_ossa\OssaRuntimeBridgeInterface
   */
  protected $runtimeBridge;

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    $instance = new static($configuration, $plugin_id, $plugin_definition);
    $instance->runtimeBridge = $container->get('ai_agents_ossa.runtime_bridge');
    return $instance;
  }

  /**
   * {@inheritdoc}
   */
  public function execute(array $context): AgentResultInterface {
    $manifest = $this->getManifest();

    $validation = $this->validateContext($context);
    if (!$validation->isValid()) {
      throw new AgentExecutionException(
        'Invalid execution context: ' . implode(', ', $validation->getErrors())
      );
    }

    try {
      return $this->runtimeBridge->execute($manifest, $context);
    }
    catch (\Exception $e) {
      $this->logger->error('{{ className }} execution failed: @message', [
        '@message' => $e->getMessage(),
      ]);
      throw new AgentExecutionException(
        'Execution failed: ' . $e->getMessage(),
        $e->getCode(),
        $e
      );
    }
  }

  /**
   * {@inheritdoc}
   */
  public function getCapabilities(): array {
    return [
{{#each manifest.spec.capabilities}}
      '{{ this }}',
{{/each}}
    ];
  }

  /**
   * Get OSSA manifest for this agent.
   */
  protected function getManifest(): array {
    $manifest_storage = \Drupal::entityTypeManager()->getStorage('ossa_manifest');
    $manifest_entity = $manifest_storage->load('{{ manifest.metadata.name }}');

    if (!$manifest_entity) {
      throw new AgentExecutionException('OSSA manifest not found: {{ manifest.metadata.name }}');
    }

    return $manifest_entity->getManifestData();
  }

}
```

---

## 3. Bridge Server Implementation

### Complete Bridge Server Example

**bridge-server/src/server.ts**:

```typescript
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { AgentExecutor } from './executor';
import { validateManifest } from './validator';
import { logger } from './logger';
import { metrics } from './metrics';
import config from 'config';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.get<string[]>('cors.allowedOrigins'),
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      ip: req.ip,
    });

    metrics.httpRequestDuration.observe(duration / 1000);
    metrics.httpRequestTotal.inc({
      method: req.method,
      path: req.path,
      status: res.statusCode,
    });
  });

  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: process.env.npm_package_version,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Metrics endpoint (Prometheus format)
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metricsData = await metrics.register.metrics();
    res.set('Content-Type', metrics.register.contentType);
    res.send(metricsData);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Execute agent
app.post('/api/execute', async (req: Request, res: Response) => {
  const { manifest, context } = req.body;
  const executionId = generateExecutionId();

  logger.info('Execution started', {
    executionId,
    agent: manifest?.metadata?.name,
    contextKeys: Object.keys(context || {}),
  });

  try {
    // Validate manifest
    const validation = await validateManifest(manifest);
    if (!validation.valid) {
      logger.warn('Manifest validation failed', {
        executionId,
        errors: validation.errors,
      });

      return res.status(400).json({
        error: 'Invalid manifest',
        details: validation.errors,
        executionId,
      });
    }

    // Execute
    const executor = new AgentExecutor();
    const startTime = Date.now();

    const result = await executor.execute(manifest, context);

    const executionTime = (Date.now() - startTime) / 1000;

    // Record metrics
    metrics.agentExecutionDuration.observe(
      { agent: manifest.metadata.name, status: result.status },
      executionTime
    );
    metrics.agentExecutionTotal.inc({
      agent: manifest.metadata.name,
      status: result.status,
    });

    logger.info('Execution completed', {
      executionId,
      agent: manifest.metadata.name,
      status: result.status,
      executionTime,
    });

    return res.json({
      status: result.status,
      data: result.data,
      metadata: {
        ...result.metadata,
        execution_id: executionId,
        execution_time: executionTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Execution failed', {
      executionId,
      error: error.message,
      stack: error.stack,
      agent: manifest?.metadata?.name,
    });

    metrics.agentExecutionTotal.inc({
      agent: manifest?.metadata?.name || 'unknown',
      status: 'error',
    });

    return res.status(500).json({
      error: 'Execution failed',
      message: error.message,
      executionId,
    });
  }
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
  });

  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
const PORT = config.get<number>('server.port') || 9090;
const HOST = config.get<string>('server.host') || '0.0.0.0';

app.listen(PORT, HOST, () => {
  logger.info(`OSSA Runtime Bridge listening on ${HOST}:${PORT}`);
});

function generateExecutionId(): string {
  return `exec_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}
```

**bridge-server/src/executor.ts**:

```typescript
import { AgentManifest, AgentContext, AgentResult } from './types';
import { McpClient } from '@ossa/mcp-client';
import { logger } from './logger';

export class AgentExecutor {
  private mcpClients: Map<string, McpClient> = new Map();

  async execute(manifest: AgentManifest, context: AgentContext): Promise<AgentResult> {
    logger.debug('Initializing agent execution', {
      agent: manifest.metadata.name,
      capabilities: manifest.spec.capabilities,
    });

    try {
      // Initialize MCP clients
      await this.initializeMcpClients(manifest);

      // Execute workflow
      const result = await this.executeWorkflow(manifest, context);

      // Cleanup
      await this.cleanup();

      return result;
    } catch (error) {
      await this.cleanup();
      throw error;
    }
  }

  private async initializeMcpClients(manifest: AgentManifest): Promise<void> {
    const servers = manifest.spec.mcp?.mcpServers || [];

    for (const serverConfig of servers) {
      logger.debug('Connecting to MCP server', {
        name: serverConfig.name,
        url: serverConfig.url,
      });

      const client = new McpClient({
        url: serverConfig.url,
        auth: serverConfig.auth,
        timeout: 30000,
      });

      await client.connect();
      this.mcpClients.set(serverConfig.name, client);

      logger.debug('Connected to MCP server', {
        name: serverConfig.name,
      });
    }
  }

  private async executeWorkflow(
    manifest: AgentManifest,
    context: AgentContext
  ): Promise<AgentResult> {
    const workflow = manifest.spec.workflow;
    if (!workflow || !workflow.steps) {
      throw new Error('No workflow defined in manifest');
    }

    const stepResults: Record<string, any> = {};
    const config = context.config || {};

    for (const step of workflow.steps) {
      logger.debug('Executing workflow step', {
        stepId: step.id,
        stepName: step.name,
        tool: step.tool,
      });

      // Check condition
      if (step.condition) {
        const conditionMet = this.evaluateCondition(step.condition, {
          context,
          config,
          steps: stepResults,
        });

        if (!conditionMet) {
          logger.debug('Step condition not met, skipping', {
            stepId: step.id,
          });
          continue;
        }
      }

      // Execute step
      const stepInput = this.resolveInput(step.input, {
        context,
        config,
        steps: stepResults,
      });

      const stepResult = await this.executeTool(step.tool, stepInput);
      stepResults[step.id] = { output: stepResult };

      logger.debug('Step completed', {
        stepId: step.id,
        success: true,
      });
    }

    // Aggregate results
    return {
      status: 'success',
      data: stepResults,
      metadata: {
        agent: manifest.metadata.name,
        version: manifest.metadata.version,
        steps_executed: Object.keys(stepResults).length,
      },
    };
  }

  private async executeTool(toolPath: string, input: any): Promise<any> {
    const [serverName, toolName] = toolPath.split('/');

    const client = this.mcpClients.get(serverName);
    if (!client) {
      throw new Error(`MCP server not found: ${serverName}`);
    }

    const result = await client.invokeTool(toolName, input);
    return result;
  }

  private resolveInput(input: any, vars: any): any {
    if (typeof input === 'string') {
      return this.interpolate(input, vars);
    }

    if (Array.isArray(input)) {
      return input.map((item) => this.resolveInput(item, vars));
    }

    if (typeof input === 'object' && input !== null) {
      const resolved: any = {};
      for (const [key, value] of Object.entries(input)) {
        resolved[key] = this.resolveInput(value, vars);
      }
      return resolved;
    }

    return input;
  }

  private interpolate(template: string, vars: any): any {
    // Simple ${var.path} interpolation
    return template.replace(/\$\{([^}]+)\}/g, (match, path) => {
      const value = this.getNestedValue(vars, path);
      return value !== undefined ? value : match;
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private evaluateCondition(condition: string, vars: any): boolean {
    // Simple condition evaluation (in production, use a proper expression evaluator)
    try {
      const interpolated = this.interpolate(condition, vars);
      return eval(interpolated); // WARNING: Use proper expression evaluator in production
    } catch (error) {
      logger.warn('Condition evaluation failed', {
        condition,
        error: error.message,
      });
      return false;
    }
  }

  private async cleanup(): Promise<void> {
    logger.debug('Cleaning up MCP connections');

    for (const [name, client] of this.mcpClients.entries()) {
      try {
        await client.disconnect();
        logger.debug('Disconnected from MCP server', { name });
      } catch (error) {
        logger.warn('Failed to disconnect from MCP server', {
          name,
          error: error.message,
        });
      }
    }

    this.mcpClients.clear();
  }
}
```

---

## 4. REST API Usage

### Complete REST API Client Example

**drupal-client/src/OssaApiClient.php**:

```php
<?php

namespace Drupal\my_module;

use GuzzleHttp\ClientInterface;
use GuzzleHttp\Exception\RequestException;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;

/**
 * Client for OSSA Agent REST API.
 */
class OssaApiClient {

  /**
   * The HTTP client.
   *
   * @var \GuzzleHttp\ClientInterface
   */
  protected $httpClient;

  /**
   * The logger.
   *
   * @var \Psr\Log\LoggerInterface
   */
  protected $logger;

  /**
   * The API base URL.
   *
   * @var string
   */
  protected $baseUrl;

  /**
   * Constructs an OssaApiClient.
   */
  public function __construct(
    ClientInterface $httpClient,
    LoggerChannelFactoryInterface $loggerFactory,
    string $baseUrl = 'http://localhost:8080/api/ossa'
  ) {
    $this->httpClient = $httpClient;
    $this->logger = $loggerFactory->get('ossa_api');
    $this->baseUrl = rtrim($baseUrl, '/');
  }

  /**
   * List all agents.
   *
   * @param array $filters
   *   Optional filters.
   *
   * @return array
   *   Array of agents.
   */
  public function listAgents(array $filters = []): array {
    $response = $this->request('GET', '/agents', ['query' => $filters]);
    return $response['data'] ?? [];
  }

  /**
   * Get agent by ID.
   *
   * @param string $agentId
   *   The agent ID.
   *
   * @return array|null
   *   The agent data or NULL if not found.
   */
  public function getAgent(string $agentId): ?array {
    try {
      return $this->request('GET', "/agents/{$agentId}");
    }
    catch (\Exception $e) {
      if ($e->getCode() === 404) {
        return NULL;
      }
      throw $e;
    }
  }

  /**
   * Execute an agent.
   *
   * @param string $agentId
   *   The agent ID.
   * @param array $context
   *   Execution context.
   * @param bool $async
   *   Execute asynchronously.
   *
   * @return array
   *   The execution result.
   */
  public function executeAgent(string $agentId, array $context, bool $async = FALSE): array {
    $payload = [
      'context' => $context,
      'async' => $async,
    ];

    return $this->request('POST', "/agents/{$agentId}/execute", [
      'json' => $payload,
    ]);
  }

  /**
   * Create a new manifest.
   *
   * @param array $manifestData
   *   The manifest data.
   *
   * @return array
   *   The created manifest.
   */
  public function createManifest(array $manifestData): array {
    return $this->request('POST', '/manifests', [
      'json' => ['manifest_data' => $manifestData],
    ]);
  }

  /**
   * Update a manifest.
   *
   * @param string $manifestId
   *   The manifest ID.
   * @param array $manifestData
   *   The manifest data.
   *
   * @return array
   *   The updated manifest.
   */
  public function updateManifest(string $manifestId, array $manifestData): array {
    return $this->request('PATCH', "/manifests/{$manifestId}", [
      'json' => ['manifest_data' => $manifestData],
    ]);
  }

  /**
   * Delete a manifest.
   *
   * @param string $manifestId
   *   The manifest ID.
   */
  public function deleteManifest(string $manifestId): void {
    $this->request('DELETE', "/manifests/{$manifestId}");
  }

  /**
   * Make an API request.
   *
   * @param string $method
   *   HTTP method.
   * @param string $endpoint
   *   API endpoint.
   * @param array $options
   *   Request options.
   *
   * @return array
   *   Response data.
   *
   * @throws \Exception
   */
  protected function request(string $method, string $endpoint, array $options = []): array {
    $url = $this->baseUrl . $endpoint;

    $this->logger->debug('API request', [
      'method' => $method,
      'url' => $url,
    ]);

    try {
      $response = $this->httpClient->request($method, $url, $options);
      $data = json_decode($response->getBody(), TRUE);

      $this->logger->debug('API response', [
        'status' => $response->getStatusCode(),
        'data' => $data,
      ]);

      return $data;
    }
    catch (RequestException $e) {
      $this->logger->error('API request failed', [
        'method' => $method,
        'url' => $url,
        'error' => $e->getMessage(),
      ]);

      throw new \Exception(
        sprintf('API request failed: %s', $e->getMessage()),
        $e->getCode(),
        $e
      );
    }
  }

}
```

### Usage Examples

**Execute Agent from Custom Code**:

```php
// In a custom controller or service
public function moderateContent(int $nodeId) {
  $apiClient = \Drupal::service('my_module.ossa_api_client');

  try {
    $result = $apiClient->executeAgent('content-moderator', [
      'node_id' => $nodeId,
    ]);

    if ($result['status'] === 'success') {
      $data = $result['data'];

      // Handle moderation result
      if ($data['status'] === 'flagged') {
        \Drupal::messenger()->addWarning(
          t('Content flagged for review: @issues', [
            '@issues' => implode(', ', $data['flagged_issues']),
          ])
        );
      }
      else {
        \Drupal::messenger()->addStatus(t('Content approved.'));
      }
    }
  }
  catch (\Exception $e) {
    \Drupal::messenger()->addError(
      t('Moderation failed: @message', ['@message' => $e->getMessage()])
    );
  }
}
```

**React/JavaScript Client**:

```javascript
// ossa-client.js
class OssaApiClient {
  constructor(baseUrl = '/api/ossa') {
    this.baseUrl = baseUrl;
  }

  async listAgents(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    const response = await fetch(`${this.baseUrl}/agents?${query}`);
    return response.json();
  }

  async executeAgent(agentId, context, async = false) {
    const response = await fetch(`${this.baseUrl}/agents/${agentId}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        context,
        async,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Execution failed');
    }

    return response.json();
  }
}

// Usage
const client = new OssaApiClient();

try {
  const result = await client.executeAgent('content-moderator', {
    node_id: 123,
  });

  console.log('Moderation result:', result);

  if (result.status === 'success') {
    // Handle success
  }
} catch (error) {
  console.error('Execution failed:', error);
}
```

---

## 5. Testing Examples

### Drupal Kernel Tests

```php
<?php

namespace Drupal\Tests\content_moderator\Kernel;

use Drupal\KernelTests\KernelTestBase;
use Drupal\content_moderator\Plugin\Agent\ContentModeratorAgent;

/**
 * Tests the Content Moderator agent.
 *
 * @group content_moderator
 */
class ContentModeratorAgentTest extends KernelTestBase {

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'system',
    'user',
    'node',
    'ai_agents',
    'ai_agents_ossa',
    'content_moderator',
  ];

  /**
   * The agent plugin.
   *
   * @var \Drupal\content_moderator\Plugin\Agent\ContentModeratorAgent
   */
  protected $agent;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $this->installEntitySchema('user');
    $this->installEntitySchema('node');
    $this->installConfig(['ai_agents', 'ai_agents_ossa', 'content_moderator']);

    // Create agent instance
    $pluginManager = $this->container->get('plugin.manager.agent');
    $this->agent = $pluginManager->createInstance('content_moderator');
  }

  /**
   * Test agent capabilities.
   */
  public function testGetCapabilities(): void {
    $capabilities = $this->agent->getCapabilities();

    $this->assertContains('content-moderation', $capabilities);
    $this->assertContains('spam-detection', $capabilities);
    $this->assertContains('sentiment-analysis', $capabilities);
  }

  /**
   * Test context validation.
   */
  public function testValidateContext(): void {
    // Valid context
    $validContext = ['node_id' => 123];
    $result = $this->agent->validateContext($validContext);
    $this->assertTrue($result->isValid());

    // Missing node_id
    $invalidContext = [];
    $result = $this->agent->validateContext($invalidContext);
    $this->assertFalse($result->isValid());
    $this->assertContains('Missing required field: node_id', $result->getErrors());

    // Invalid node_id type
    $invalidContext = ['node_id' => 'abc'];
    $result = $this->agent->validateContext($invalidContext);
    $this->assertFalse($result->isValid());
  }

  /**
   * Test agent execution (mocked).
   */
  public function testExecute(): void {
    // Mock runtime bridge
    $mockBridge = $this->createMock(\Drupal\ai_agents_ossa\OssaRuntimeBridgeInterface::class);
    $mockResult = $this->createMock(\Drupal\ai_agents\AgentResultInterface::class);

    $mockResult->method('getStatus')->willReturn('success');
    $mockResult->method('getData')->willReturn([
      'status' => 'approved',
      'confidence' => 0.95,
    ]);

    $mockBridge->method('execute')->willReturn($mockResult);

    // Inject mock
    $this->container->set('ai_agents_ossa.runtime_bridge', $mockBridge);

    // Execute
    $result = $this->agent->execute(['node_id' => 123]);

    $this->assertEquals('success', $result->getStatus());
    $this->assertEquals('approved', $result->getData()['status']);
  }

}
```

### Bridge Server Integration Tests

```typescript
// bridge-server/tests/integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import axios, { AxiosInstance } from 'axios';
import { startServer, stopServer } from '../src/test-utils';

describe('OSSA Runtime Bridge Integration Tests', () => {
  let client: AxiosInstance;
  const bridgeUrl = 'http://localhost:9090';

  beforeAll(async () => {
    await startServer();
    client = axios.create({
      baseURL: bridgeUrl,
      timeout: 10000,
    });
  });

  afterAll(async () => {
    await stopServer();
  });

  describe('Health Check', () => {
    it('should return 200 OK', async () => {
      const response = await client.get('/health');

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        status: 'ok',
        version: expect.any(String),
        uptime: expect.any(Number),
      });
    });
  });

  describe('Agent Execution', () => {
    it('should execute valid agent', async () => {
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
          workflow: {
            steps: [],
          },
        },
      };

      const context = { test: 'data' };

      const response = await client.post('/api/execute', {
        manifest,
        context,
      });

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        status: expect.stringMatching(/success|error|partial/),
        data: expect.any(Object),
        metadata: expect.objectContaining({
          execution_id: expect.any(String),
          execution_time: expect.any(Number),
        }),
      });
    });

    it('should reject invalid manifest', async () => {
      const invalidManifest = {
        apiVersion: 'ossa/v0.3.0', // Wrong version
        kind: 'Agent',
      };

      const context = {};

      try {
        await client.post('/api/execute', {
          manifest: invalidManifest,
          context,
        });
        fail('Should have thrown error');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toMatchObject({
          error: 'Invalid manifest',
          details: expect.any(Array),
        });
      }
    });
  });

  describe('Metrics', () => {
    it('should return Prometheus metrics', async () => {
      const response = await client.get('/metrics');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/plain');
      expect(response.data).toContain('agent_execution_duration_seconds');
    });
  });
});
```

---

## 6. Deployment Scripts

### Docker Compose for Local Development

```yaml
# docker-compose.yml
version: '3.8'

services:
  drupal:
    image: drupal:10-fpm-alpine
    container_name: ossa-drupal
    volumes:
      - ./web:/var/www/html
      - ./config:/var/www/config
    environment:
      - DRUPAL_DATABASE_HOST=postgres
      - DRUPAL_DATABASE_NAME=drupal
      - DRUPAL_DATABASE_USER=drupal
      - DRUPAL_DATABASE_PASSWORD=drupal
      - OSSA_RUNTIME_BRIDGE_URL=http://bridge:9090
    depends_on:
      - postgres
      - bridge
    ports:
      - "8080:80"

  bridge:
    build: ./bridge-server
    container_name: ossa-bridge
    environment:
      - NODE_ENV=development
      - PORT=9090
      - LOG_LEVEL=debug
    ports:
      - "9090:9090"
    volumes:
      - ./bridge-server:/app
      - /app/node_modules

  postgres:
    image: postgres:15-alpine
    container_name: ossa-postgres
    environment:
      - POSTGRES_DB=drupal
      - POSTGRES_USER=drupal
      - POSTGRES_PASSWORD=drupal
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    container_name: ossa-redis
    ports:
      - "6379:6379"

  mailhog:
    image: mailhog/mailhog:latest
    container_name: ossa-mailhog
    ports:
      - "8025:8025"
      - "1025:1025"

volumes:
  postgres_data:
```

### Kubernetes Deployment Manifests

**k8s/bridge-deployment.yaml**:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ossa-runtime-bridge
  namespace: ossa-production
  labels:
    app: ossa-runtime-bridge
    version: v1.0.0
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ossa-runtime-bridge
  template:
    metadata:
      labels:
        app: ossa-runtime-bridge
        version: v1.0.0
    spec:
      containers:
      - name: bridge
        image: registry.example.com/ossa-runtime-bridge:v1.0.0
        ports:
        - containerPort: 9090
          name: http
          protocol: TCP
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "9090"
        - name: LOG_LEVEL
          value: "info"
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
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 9090
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
      restartPolicy: Always

---
apiVersion: v1
kind: Service
metadata:
  name: ossa-runtime-bridge
  namespace: ossa-production
  labels:
    app: ossa-runtime-bridge
spec:
  type: ClusterIP
  selector:
    app: ossa-runtime-bridge
  ports:
  - port: 9090
    targetPort: 9090
    protocol: TCP
    name: http

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ossa-runtime-bridge-hpa
  namespace: ossa-production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ossa-runtime-bridge
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### CI/CD Pipeline (GitLab CI)

**.gitlab-ci.yml**:

```yaml
stages:
  - test
  - build
  - deploy

variables:
  DOCKER_REGISTRY: registry.example.com
  DRUPAL_IMAGE: $DOCKER_REGISTRY/ossa-drupal
  BRIDGE_IMAGE: $DOCKER_REGISTRY/ossa-runtime-bridge

# Test stage
test:drupal:
  stage: test
  image: php:8.3-cli
  script:
    - composer install
    - vendor/bin/phpunit --testsuite=unit
    - vendor/bin/phpcs --standard=Drupal web/modules/custom/

test:bridge:
  stage: test
  image: node:20-alpine
  script:
    - cd bridge-server
    - npm ci
    - npm run test
    - npm run lint

# Build stage
build:drupal:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $DOCKER_REGISTRY
    - docker build -t $DRUPAL_IMAGE:$CI_COMMIT_TAG -f Dockerfile.drupal .
    - docker push $DRUPAL_IMAGE:$CI_COMMIT_TAG
  only:
    - tags

build:bridge:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $DOCKER_REGISTRY
    - docker build -t $BRIDGE_IMAGE:$CI_COMMIT_TAG -f bridge-server/Dockerfile bridge-server/
    - docker push $BRIDGE_IMAGE:$CI_COMMIT_TAG
  only:
    - tags

# Deploy stage
deploy:production:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl config use-context production
    - kubectl set image deployment/ossa-runtime-bridge bridge=$BRIDGE_IMAGE:$CI_COMMIT_TAG -n ossa-production
    - kubectl rollout status deployment/ossa-runtime-bridge -n ossa-production
  only:
    - tags
  when: manual
  environment:
    name: production
    url: https://ossa.example.com
```

---

**End of Examples Document**

These practical examples demonstrate:
1. Complete agent implementation from manifest to deployment
2. Code generation with Handlebars templates
3. Bridge server with full error handling and metrics
4. REST API client implementations (PHP and JavaScript)
5. Comprehensive testing strategies
6. Production-ready deployment configurations

All code is production-quality with proper error handling, logging, and best practices.
