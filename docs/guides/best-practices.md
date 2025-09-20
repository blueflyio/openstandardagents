# OSSA Platform Best Practices

## Development Best Practices

### Code Style and Conventions

#### TypeScript Standards
```typescript
// ✅ GOOD: Explicit types, clear naming, error handling
interface AgentConfig {
  name: string;
  version: string;
  capabilities: string[];
  tier: 'core' | 'governed' | 'advanced';
}

async function registerAgent(config: AgentConfig): Promise<Agent> {
  try {
    validateConfig(config);
    const agent = await agentService.create(config);
    logger.info('Agent registered', { agentId: agent.id });
    return agent;
  } catch (error) {
    logger.error('Agent registration failed', { error, config });
    throw new AgentRegistrationError('Failed to register agent', { cause: error });
  }
}

// ❌ BAD: Any types, poor naming, no error handling
async function reg(data: any) {
  const a = await svc.create(data);
  return a;
}
```

#### TypeScript Configuration
```json
// tsconfig.json - Strict mode enabled
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

#### ESLint Configuration
```javascript
// .eslintrc.js
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:security/recommended',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    'security/detect-object-injection': 'warn',
    'no-console': ['error', { allow: ['warn', 'error'] }]
  }
};
```

### Testing Standards

#### Vitest Configuration
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '*.config.ts'],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80
      }
    },
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 10000,
    hookTimeout: 10000
  }
});
```

#### Test Structure
```typescript
// Follow AAA pattern: Arrange, Act, Assert
describe('AgentService', () => {
  let service: AgentService;
  
  beforeEach(() => {
    service = new AgentService();
  });
  
  describe('registerAgent', () => {
    it('should register a valid agent', async () => {
      // Arrange
      const config: AgentConfig = {
        name: 'test-agent',
        version: '1.0.0',
        capabilities: ['nlp', 'translation'],
        tier: 'core'
      };
      
      // Act
      const agent = await service.registerAgent(config);
      
      // Assert
      expect(agent).toBeDefined();
      expect(agent.name).toBe(config.name);
      expect(agent.status).toBe('active');
    });
  });
});
```

### API Design Principles

#### RESTful Resource Design
```yaml
# ✅ GOOD: Consistent, versioned, resource-based
endpoints:
  - GET /api/v1/agents?tier=advanced&limit=20
  - POST /api/v1/agents
  - GET /api/v1/agents/{id}
  - PUT /api/v1/agents/{id}
  - DELETE /api/v1/agents/{id}

# ❌ BAD: Inconsistent, action-based
bad_endpoints:
  - GET /getAgents
  - POST /createNewAgent
  - GET /agent_details?agent={id}
```

#### Error Handling Standards
```typescript
// Use RFC7807 Problem Details
class ProblemDetails {
  type: string;      // URI reference
  title: string;     // Human-readable summary
  status: number;    // HTTP status code
  detail?: string;   // Specific error details
  instance?: string; // URI of specific occurrence
  traceId: string;   // Correlation ID for tracing
}

// Example usage
throw new ProblemDetails({
  type: 'https://api.llm.bluefly.io/problems/agent-not-found',
  title: 'Agent Not Found',
  status: 404,
  detail: `Agent with ID ${agentId} does not exist`,
  instance: `/api/v1/agents/${agentId}`
});
```

### Security Best Practices

#### Secrets Management
```yaml
# Never hardcode secrets
❌ BAD:
  database_url: "postgresql://user:password@localhost/db"
  api_key: "sk_live_1234567890"
  
✅ GOOD:
  database_url: ${DATABASE_URL}
  api_key: ${API_KEY}
  
# Use secret management tools
secrets_management:
  development: .env files with .env.example
  staging: AWS Secrets Manager / Parameter Store
  production: HashiCorp Vault / AWS KMS
```

#### Input Validation
```typescript
// Always validate and sanitize inputs
import { z } from 'zod';

const AgentSchema = z.object({
  name: z.string()
    .min(3, 'Name must be at least 3 characters')
    .max(50, 'Name must be at most 50 characters')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Invalid characters in name'),
  version: z.string()
    .regex(/^\d+\.\d+\.\d+$/, 'Version must follow semver'),
  capabilities: z.array(z.string())
    .min(1, 'At least one capability required')
    .max(20, 'Maximum 20 capabilities allowed'),
  tier: z.enum(['core', 'governed', 'advanced'])
});

function validateInput(input: unknown): AgentConfig {
  return AgentSchema.parse(input);
}
```

### Performance Optimization

#### Database Best Practices
```typescript
// Use connection pooling
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Use prepared statements to prevent SQL injection
const getAgentQuery = {
  name: 'get-agent',
  text: 'SELECT * FROM agents WHERE id = $1 AND deleted_at IS NULL',
  values: [agentId]
};

// Implement query result caching
class AgentRepository {
  private cache: Redis;
  
  async findById(id: string): Promise<Agent> {
    // Check cache first
    const cached = await this.cache.get(`agent:${id}`);
    if (cached) return JSON.parse(cached);
    
    // Query database
    const result = await this.db.query(getAgentQuery);
    const agent = result.rows[0];
    
    // Cache result with TTL
    await this.cache.setex(`agent:${id}`, 3600, JSON.stringify(agent));
    
    return agent;
  }
}
```

#### Caching Strategy
```yaml
caching_layers:
  cdn_cache:
    static_assets: 1 year
    api_responses: 5 minutes
    
  application_cache:
    session_data: 5 minutes
    user_preferences: 1 hour
    agent_list: 10 minutes
    discovery_results: 5 minutes
    
  database_cache:
    query_results: 5 minutes
    materialized_views: 1 hour
    
  redis_cache:
    hot_data: 60 seconds
    warm_data: 5 minutes
    cold_data: 1 hour
```

### Drupal-Specific Best Practices

#### Drupal 11 Coding Standards
```php
<?php
// Follow Drupal coding standards (PHPCS)
namespace Drupal\ossa_agents\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;

/**
 * Provides agent management endpoints.
 */
class AgentController extends ControllerBase {
  
  /**
   * The agent service.
   *
   * @var \Drupal\ossa_agents\Service\AgentServiceInterface
   */
  protected $agentService;
  
  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('ossa_agents.agent_service')
    );
  }
  
  /**
   * Lists all agents.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   JSON response with agent list.
   */
  public function list(): JsonResponse {
    $agents = $this->agentService->getAllAgents();
    return new JsonResponse($agents);
  }
}
```

#### PHPStan Configuration
```yaml
# phpstan.neon
parameters:
  level: 8  # Maximum strictness
  paths:
    - src
    - modules/custom
  excludePaths:
    - */tests/*
    - */node_modules/*
  checkMissingIterableValueType: false
  reportUnmatchedIgnoredErrors: false
```

#### PHPUnit Coverage
```xml
<!-- phpunit.xml -->
<phpunit>
  <coverage processUncoveredFiles="true">
    <include>
      <directory suffix=".php">src</directory>
      <directory suffix=".php">modules/custom</directory>
    </include>
    <exclude>
      <directory>tests</directory>
    </exclude>
    <report>
      <html outputDirectory="coverage-report"/>
      <text outputFile="php://stdout" showUncoveredFiles="true"/>
    </report>
  </coverage>
  <testsuites>
    <testsuite name="unit">
      <directory>tests/Unit</directory>
    </testsuite>
    <testsuite name="kernel">
      <directory>tests/Kernel</directory>
    </testsuite>
  </testsuites>
</phpunit>
```

#### Drupal Performance Optimization
```php
// Use render caching
$build = [
  '#theme' => 'agent_list',
  '#agents' => $agents,
  '#cache' => [
    'contexts' => ['user.permissions'],
    'tags' => ['agent_list'],
    'max-age' => 300, // 5 minutes
  ],
];

// Use BigPipe for progressive loading
$build['#attached']['library'][] = 'core/drupal.ajax';
$build['#attached']['drupalSettings']['bigPipe'] = TRUE;

// Queue workers for async processing
\Drupal::queue('agent_processing')->createItem($agent_data);
```

### CI/CD Best Practices

#### GitLab CI Pipeline
```yaml
stages:
  - validate
  - build
  - test
  - security
  - deploy

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: ""

validate:
  stage: validate
  script:
    - npm run lint
    - npm run typecheck
    - composer validate
    - ./vendor/bin/phpcs
    - ./vendor/bin/phpstan analyse

build:
  stage: build
  script:
    - npm ci
    - npm run build
    - composer install --no-dev --optimize-autoloader
  artifacts:
    paths:
      - dist/
      - vendor/
    expire_in: 1 hour

test:
  stage: test
  parallel:
    matrix:
      - TEST_SUITE: [unit, integration, e2e]
  script:
    - npm run test:$TEST_SUITE
    - ./vendor/bin/phpunit --testsuite=$TEST_SUITE
  coverage: '/Coverage: \d+\.\d+%/'

security:
  stage: security
  script:
    - npm audit --audit-level=high
    - composer audit
    - trivy fs --severity HIGH,CRITICAL .

deploy:
  stage: deploy
  script:
    - npm run deploy:$CI_ENVIRONMENT_NAME
  environment:
    name: $CI_ENVIRONMENT_NAME
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
      when: manual
```

### Documentation Standards

#### Code Documentation
```typescript
/**
 * Registers a new agent in the OSSA platform.
 * 
 * @param config - Agent configuration object
 * @returns Promise resolving to the created Agent
 * @throws {ValidationError} If configuration is invalid
 * @throws {ConflictError} If agent name already exists
 * 
 * @example
 * ```typescript
 * const agent = await registerAgent({
 *   name: 'nlp-processor',
 *   version: '1.0.0',
 *   capabilities: ['text-analysis'],
 *   tier: 'advanced'
 * });
 * ```
 */
async function registerAgent(config: AgentConfig): Promise<Agent> {
  // Implementation
}
```

#### Documentation as Code
- Keep docs in repository
- Version control all changes
- Review docs in PRs
- Validate in CI pipeline
- Auto-generate from code where possible
- Check for drift between code and docs

### Monitoring & Observability

#### Structured Logging
```typescript
import { Logger } from 'winston';

const logger = new Logger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'ossa-platform' },
  transports: [
    new winston.transports.Console({
      level: process.env.LOG_LEVEL || 'info'
    })
  ]
});

// Log with structured data
logger.info('Agent registered', {
  agentId: agent.id,
  agentName: agent.name,
  tier: agent.tier,
  userId: user.id,
  duration: endTime - startTime,
  correlationId: req.correlationId
});
```

#### Health Checks
```typescript
// Implement comprehensive health checks
app.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

app.get('/health/ready', async (req, res) => {
  const checks = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkKafka()
  ]);
  
  const ready = checks.every(check => check.healthy);
  res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'not ready',
    checks
  });
});
```

## Operational Best Practices

### Deployment Strategy
- Use blue-green deployments for zero downtime
- Implement feature flags for gradual rollouts
- Maintain rollback procedures
- Test in staging environment first
- Use canary deployments for critical changes

### Incident Response
1. **Detection**: Automated monitoring and alerting
2. **Triage**: Assess severity and impact
3. **Communication**: Notify stakeholders via established channels
4. **Investigation**: Root cause analysis with logs and metrics
5. **Resolution**: Apply fix and verify
6. **Post-mortem**: Document lessons learned without blame

### Capacity Planning
- Monitor resource utilization trends
- Plan for 20% headroom on all resources
- Load test before major releases
- Review and adjust quarterly
- Implement auto-scaling for traffic spikes