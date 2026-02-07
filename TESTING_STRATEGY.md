# OSSA Testing Strategy
## Comprehensive Testing for All Functions and Advanced Features

**Version**: 0.4.4
**Last Updated**: 2026-02-06
**Status**: Active

---

## 📋 Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Categories](#test-categories)
3. [Test Coverage Requirements](#test-coverage-requirements)
4. [Unit Testing Strategy](#unit-testing-strategy)
5. [Integration Testing Strategy](#integration-testing-strategy)
6. [E2E Testing Strategy](#e2e-testing-strategy)
7. [Advanced Feature Testing](#advanced-feature-testing)
8. [CI/CD Integration](#cicd-integration)
9. [Test Organization](#test-organization)
10. [Test Data Management](#test-data-management)

---

## Testing Philosophy

### Core Principles

1. **Test Everything**: Every function, every feature, every export platform
2. **Test Early**: Write tests BEFORE or ALONGSIDE code (TDD)
3. **Test Often**: Run tests on every commit via CI/CD
4. **Test Realistically**: Use real manifests, real export outputs, real scenarios
5. **Test Automatically**: No manual testing required for standard features

### Success Criteria

- ✅ **100% function coverage** - Every exported function has tests
- ✅ **90%+ line coverage** - Most code paths exercised
- ✅ **80%+ branch coverage** - Most conditional branches tested
- ✅ **All CLI commands tested** - Complete e2e coverage
- ✅ **All export platforms tested** - Each platform output validated
- ✅ **All advanced features tested** - A2A, GAID, registry, wizard, etc.

---

## Test Categories

### 1. Unit Tests (`tests/unit/`)

**What**: Individual functions, classes, methods in isolation

**Coverage**:
- Services (validation, manifest, export, registry)
- Adapters (langchain, crewai, temporal, etc.)
- Generators (package.json, typescript, openapi)
- Utilities (GAID generation, UUID, serial numbers)
- Type guards and validators

**Example Structure**:
```
tests/unit/
├── services/
│   ├── validation.service.test.ts
│   ├── manifest.repository.test.ts
│   ├── agent-protocol-client.test.ts
│   └── export/
│       ├── langchain-exporter.test.ts
│       ├── npm-exporter.test.ts
│       └── drupal-generator.test.ts
├── adapters/
│   ├── langchain/
│   │   ├── converter.test.ts
│   │   └── tools-generator.test.ts
│   └── crewai/
│       └── converter.test.ts
├── cli/
│   ├── gaid-generator.test.ts
│   └── serial-number.test.ts
└── utils/
    ├── uuid.test.ts
    └── validation.test.ts
```

---

### 2. Integration Tests (`tests/integration/`)

**What**: Multiple components working together, CLI commands end-to-end

**Coverage**:
- All CLI commands (wizard, export, validate, run, register, discover, verify, generate-gaid)
- Service interactions (manifest → validation → export)
- Adapter workflows (OSSA → platform conversion)
- File I/O operations (read manifest → write output)

**Example Structure**:
```
tests/integration/
├── cli/
│   ├── wizard-interactive.test.ts ← NEW (needs creation)
│   ├── export.test.ts ← CREATED (2026-02-06)
│   ├── validate.test.ts
│   ├── run.test.ts
│   ├── generate-gaid.test.ts ← NEW (needs creation)
│   ├── register.test.ts ← NEW (needs creation)
│   ├── discover.test.ts ← NEW (needs creation)
│   └── verify.test.ts ← NEW (needs creation)
├── workflows/
│   ├── manifest-to-export.test.ts
│   └── wizard-to-deployment.test.ts
└── adapters/
    ├── langchain-full-export.test.ts
    ├── npm-full-export.test.ts
    └── drupal-full-export.test.ts
```

---

### 3. E2E Tests (`tests/e2e/`)

**What**: Complete user workflows, smoke tests, real-world scenarios

**Coverage**:
- NPM package installation and usage
- Complete agent lifecycle (create → validate → export → deploy)
- Real manifest examples from production
- Platform-specific deployments

**Example Structure**:
```
tests/e2e/
├── npm-pack.smoke.spec.ts ← EXISTS
├── cli.smoke.spec.ts ← EXISTS
├── schema-coverage.smoke.spec.ts ← EXISTS
├── wizard-to-kubernetes.e2e.spec.ts ← NEW (needs creation)
├── agent-deployment.e2e.spec.ts ← NEW (needs creation)
└── platform-exports/
    ├── langchain-deployment.e2e.spec.ts
    ├── drupal-module-install.e2e.spec.ts
    └── npm-package-publish.e2e.spec.ts
```

---

## Test Coverage Requirements

### Per-Component Coverage Targets

| Component | Unit | Integration | E2E | Priority |
|-----------|------|-------------|-----|----------|
| **CLI Commands** | 90% | 100% | 80% | CRITICAL |
| **Export Services** | 95% | 100% | 60% | CRITICAL |
| **Validation** | 100% | 100% | 80% | CRITICAL |
| **Adapters** | 85% | 90% | 50% | HIGH |
| **Generators** | 90% | 80% | 40% | HIGH |
| **Registry** | 90% | 90% | 60% | HIGH |
| **Utilities** | 95% | 70% | 30% | MEDIUM |

### Current Status (2026-02-06)

```bash
npm test -- --coverage

# Target output:
# Statements   : 90% ( xxx/xxxx )
# Branches     : 85% ( xxx/xxxx )
# Functions    : 90% ( xxx/xxxx )
# Lines        : 90% ( xxx/xxxx )
```

---

## Unit Testing Strategy

### 1. Services Testing

**Pattern**: Arrange-Act-Assert with mocked dependencies

```typescript
// tests/unit/services/validation.service.test.ts
import { ValidationService } from '../../../src/services/validation.service';
import { SchemaRepository } from '../../../src/repositories/schema.repository';

describe('ValidationService', () => {
  let service: ValidationService;
  let mockSchemaRepo: jest.Mocked<SchemaRepository>;

  beforeEach(() => {
    mockSchemaRepo = {
      getSchema: jest.fn(),
    } as any;

    service = new ValidationService(mockSchemaRepo);
  });

  describe('validate()', () => {
    it('should validate valid OSSA v0.4.4 manifest', async () => {
      const manifest = {
        apiVersion: 'ossa/v0.4.4',
        kind: 'Agent',
        metadata: { name: 'test', version: '1.0.0' },
        spec: { role: 'test' },
      };

      mockSchemaRepo.getSchema.mockReturnValue(ossaSchema);

      const result = await service.validate(manifest);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject manifest with invalid name', async () => {
      const manifest = {
        apiVersion: 'ossa/v0.4.4',
        kind: 'Agent',
        metadata: { name: 'INVALID_NAME', version: '1.0.0' },
        spec: { role: 'test' },
      };

      mockSchemaRepo.getSchema.mockReturnValue(ossaSchema);

      const result = await service.validate(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Invalid name format');
    });
  });
});
```

### 2. Generators Testing

**Pattern**: Input → Generator → Output validation

```typescript
// tests/unit/generators/package-json-generator.test.ts
describe('PackageJsonGenerator', () => {
  let generator: PackageJsonGenerator;

  beforeEach(() => {
    generator = new PackageJsonGenerator();
  });

  it('should generate valid package.json from manifest', () => {
    const manifest: OssaManifest = {
      apiVersion: 'ossa/v0.4.4',
      kind: 'Agent',
      metadata: {
        name: 'test-agent',
        version: '1.0.0',
        description: 'Test description',
      },
      spec: { role: 'test' },
    };

    const result = generator.generate(manifest);
    const pkg = JSON.parse(result);

    expect(pkg.name).toBe('@bluefly/test-agent');
    expect(pkg.version).toBe('1.0.0');
    expect(pkg.description).toBe('Test description');
    expect(pkg.main).toBeDefined();
    expect(pkg.exports).toBeDefined();
  });
});
```

### 3. Utility Testing

**Pattern**: Pure function testing with comprehensive edge cases

```typescript
// tests/unit/utils/gaid-generator.test.ts
describe('GAID Generator', () => {
  it('should generate deterministic GAID from org + name', () => {
    const gaid1 = generateGAID('blueflyio', 'test-agent', 'AG-12345');
    const gaid2 = generateGAID('blueflyio', 'test-agent', 'AG-12345');

    expect(gaid1).toBe(gaid2); // Deterministic
    expect(gaid1).toMatch(/^did:ossa:blueflyio:[a-zA-Z0-9]{12}$/);
  });

  it('should generate unique GAIDs for different agents', () => {
    const gaid1 = generateGAID('blueflyio', 'agent-1', 'AG-12345');
    const gaid2 = generateGAID('blueflyio', 'agent-2', 'AG-67890');

    expect(gaid1).not.toBe(gaid2);
  });

  it('should handle special characters in org name', () => {
    const gaid = generateGAID('my-org.io', 'test', 'AG-12345');

    expect(gaid).toMatch(/^did:ossa:my-org\.io:[a-zA-Z0-9]{12}$/);
  });
});
```

---

## Integration Testing Strategy

### 1. CLI Command Testing

**Pattern**: Execute CLI → Validate output files + stdout

```typescript
// tests/integration/cli/wizard-interactive.test.ts (NEEDS CREATION)
describe('ossa wizard command', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ossa-wizard-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('Complete Workflow', () => {
    it('should create complete OSSA v0.4.4 manifest', () => {
      const outputPath = path.join(tempDir, 'agent.ossa.yaml');

      // Simulate user input
      const input = [
        'test-agent', // name
        '1.0.0', // version
        'Test description', // description
        'You are a test assistant', // role
        // ... all wizard prompts
      ].join('\n');

      execSync(
        `echo "${input}" | node bin/ossa wizard -o ${outputPath}`,
        { cwd, encoding: 'utf-8' }
      );

      expect(fs.existsSync(outputPath)).toBe(true);

      const manifest = YAML.parse(fs.readFileSync(outputPath, 'utf-8'));
      expect(manifest.apiVersion).toBe('ossa/v0.4.4');
      expect(manifest.metadata.name).toBe('test-agent');
      expect(manifest.spec.role).toBe('You are a test assistant');
    });

    it('should generate GAID when option selected', () => {
      // Test GAID generation flow
    });

    it('should configure A2A messaging', () => {
      // Test A2A configuration
    });

    it('should configure token efficiency', () => {
      // Test token efficiency options
    });

    it('should configure compliance frameworks', () => {
      // Test compliance selection
    });
  });
});
```

### 2. Export Platform Testing

**Pattern**: Manifest → Export → Validate structure + content

```typescript
// tests/integration/cli/export.test.ts (CREATED 2026-02-06)
// See file for complete implementation
```

### 3. Registry Command Testing

```typescript
// tests/integration/cli/register.test.ts (NEEDS CREATION)
describe('ossa register command', () => {
  let mockServer: http.Server;
  let tempDir: string;

  beforeAll(() => {
    // Start mock registry API server
    mockServer = startMockRegistryAPI();
  });

  afterAll(() => {
    mockServer.close();
  });

  it('should register agent to registry', async () => {
    const manifestPath = path.join(tempDir, 'agent.ossa.yaml');

    const output = execSync(
      `node bin/ossa register ${manifestPath} --registry http://localhost:3005`,
      { cwd, encoding: 'utf-8' }
    );

    expect(output).toContain('Agent registered successfully');
    expect(output).toContain('GAID:');
    expect(output).toContain('Registry URL:');
  });

  it('should fail if registry is unreachable', () => {
    // Test error handling
  });

  it('should generate agent ID card', () => {
    // Test .gaid.json creation
  });
});
```

---

## E2E Testing Strategy

### 1. Complete Agent Lifecycle

```typescript
// tests/e2e/agent-deployment.e2e.spec.ts (NEEDS CREATION)
describe('Complete Agent Deployment', () => {
  it('should deploy agent from wizard to Kubernetes', async () => {
    // 1. Create agent with wizard
    const manifestPath = createAgentWithWizard({
      name: 'e2e-test-agent',
      platform: 'kubernetes',
    });

    // 2. Validate manifest
    const validateResult = validateManifest(manifestPath);
    expect(validateResult.valid).toBe(true);

    // 3. Export to Kubernetes
    const k8sManifests = exportToKubernetes(manifestPath);
    expect(k8sManifests).toHaveProperty('deployment');
    expect(k8sManifests).toHaveProperty('service');

    // 4. Apply to test cluster (if available)
    if (process.env.K8S_TEST_CLUSTER) {
      const deployed = await deployToK8s(k8sManifests);
      expect(deployed.status).toBe('Running');

      // Cleanup
      await cleanupK8s(deployed.name);
    }
  });
});
```

### 2. NPM Package Smoke Tests

```typescript
// tests/e2e/npm-pack.smoke.spec.ts (EXISTS - expand)
describe('NPM Package Smoke Tests', () => {
  it('should install and import package', () => {
    // Already implemented - see file
  });

  it('should run exported agent', async () => {
    // NEW: Test running exported NPM agent
    const testScript = `
      const { Agent } = require('@bluefly/test-agent');
      const agent = new Agent();
      agent.run({ message: 'test' })
        .then(result => console.log(JSON.stringify(result)));
    `;

    const output = execSync(`node -e "${testScript}"`, { cwd: tempDir });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
  });
});
```

### 3. Platform Integration Tests

```typescript
// tests/e2e/platform-exports/drupal-module-install.e2e.spec.ts
describe('Drupal Module Installation', () => {
  let drupalContainer: DockerContainer;

  beforeAll(async () => {
    // Start Drupal container if Docker available
    if (process.env.DOCKER_AVAILABLE) {
      drupalContainer = await startDrupalContainer();
    }
  });

  afterAll(async () => {
    if (drupalContainer) {
      await drupalContainer.stop();
    }
  });

  it('should install exported Drupal module', async () => {
    if (!drupalContainer) {
      console.log('Skipping: Docker not available');
      return;
    }

    // 1. Export to Drupal
    const moduleDir = exportToDrupal(testManifest);

    // 2. Copy to Drupal container
    await drupalContainer.copyFiles(moduleDir, '/var/www/html/modules/custom/');

    // 3. Enable module
    const enableResult = await drupalContainer.exec('drush en test_module -y');
    expect(enableResult.exitCode).toBe(0);

    // 4. Verify module loaded
    const moduleList = await drupalContainer.exec('drush pm:list | grep test_module');
    expect(moduleList.stdout).toContain('Enabled');
  });
});
```

---

## Advanced Feature Testing

### 1. A2A (Agent-to-Agent) Communication

```typescript
// tests/integration/advanced/a2a-communication.test.ts
describe('A2A Communication', () => {
  it('should enable A2A messaging in manifest', () => {
    const manifest = createManifestWithA2A({
      protocol: 'nats',
      discovery: 'dns',
      team: 'test-team',
    });

    expect(manifest.spec.messaging.protocol).toBe('nats');
    expect(manifest.spec.messaging.discovery.enabled).toBe(true);
    expect(manifest.spec.messaging.team.name).toBe('test-team');
  });

  it('should export A2A config to platforms', () => {
    const langchainExport = exportToLangChain(manifestWithA2A);

    // Verify A2A code generated
    expect(langchainExport.files).toContainFile('src/messaging.py');
    expect(langchainExport.files['src/messaging.py']).toContain('import nats');
  });

  it('should register A2A agent to discovery', async () => {
    if (process.env.AGENT_MESH_AVAILABLE) {
      const registered = await registerToAgentMesh(manifestWithA2A);
      expect(registered.discoverable).toBe(true);
    }
  });
});
```

### 2. GAID (Global Agent ID) System

```typescript
// tests/integration/advanced/gaid-system.test.ts
describe('GAID System', () => {
  it('should generate deterministic GAID', () => {
    const gaid = generateGAID('blueflyio', 'test-agent', 'AG-12345');
    expect(gaid).toMatch(/^did:ossa:blueflyio:[a-zA-Z0-9]{12}$/);
  });

  it('should create agent ID card', () => {
    const card = createAgentCard(manifestWithGAID);

    expect(card.gaid).toBeDefined();
    expect(card.serialNumber).toMatch(/^AG-[A-Z0-9]+-[A-Z0-9]+$/);
    expect(card.organization).toBe('blueflyio');
    expect(card.identity).toBeDefined();
    expect(card.capabilities).toBeDefined();
  });

  it('should verify agent identity', () => {
    const card = createAgentCard(manifestWithGAID);
    const verified = verifyAgentIdentity(card);

    expect(verified.valid).toBe(true);
    expect(verified.trustLevel).toBe('verified');
  });
});
```

### 3. Token Efficiency

```typescript
// tests/integration/advanced/token-efficiency.test.ts
describe('Token Efficiency', () => {
  it('should configure token efficiency strategies', () => {
    const manifest = createManifestWithTokenEfficiency({
      promptCaching: true,
      contextPruning: true,
      batchedInference: true,
      targetSavings: 85,
    });

    expect(manifest.spec.token_efficiency.strategies).toContain('prompt-caching');
    expect(manifest.spec.token_efficiency.target_savings_percent).toBe(85);
  });

  it('should export token efficiency config', () => {
    const langchainExport = exportToLangChain(manifestWithTokenEfficiency);

    // Verify caching code generated
    expect(langchainExport.files['src/agent.py']).toContain('cache_prompt');
  });
});
```

### 4. Progressive Validation

```typescript
// tests/integration/advanced/progressive-validation.test.ts
describe('Progressive Validation', () => {
  it('should collect multiple errors before failing', () => {
    const invalidManifest = {
      apiVersion: 'ossa/v0.4.4',
      kind: 'Agent',
      metadata: { name: 'INVALID_NAME', version: 'bad-version' },
      spec: { role: '', llm: { provider: 'invalid' } },
    };

    const result = validator.validate(invalidManifest, { progressive: true });

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(3); // Multiple errors collected
    expect(result.errors).toContainEqual(expect.objectContaining({
      field: 'metadata.name',
      message: expect.stringContaining('Invalid name'),
    }));
    expect(result.errors).toContainEqual(expect.objectContaining({
      field: 'metadata.version',
      message: expect.stringContaining('Invalid version'),
    }));
  });
});
```

### 5. Type-Aware Exports

```typescript
// tests/integration/advanced/type-aware-exports.test.ts
describe('Type-Aware Exports', () => {
  it('should generate TypeScript types from manifest', () => {
    const npmExport = exportToNPM(manifest);

    expect(npmExport.files).toContainFile('src/types.ts');

    const types = npmExport.files['src/types.ts'];
    expect(types).toContain('export interface AgentConfig');
    expect(types).toContain('export interface Tool');
  });

  it('should generate Python types for LangChain', () => {
    const langchainExport = exportToLangChain(manifest);

    const types = langchainExport.files['src/types.py'];
    expect(types).toContain('class AgentConfig(TypedDict)');
    expect(types).toContain('class Tool(TypedDict)');
  });
});
```

---

## CI/CD Integration

### GitLab CI Configuration

```yaml
# .gitlab-ci.yml
stages:
  - test
  - coverage
  - deploy

# Unit Tests (Fast)
unit-tests:
  stage: test
  script:
    - npm install
    - npm run test:unit
  cache:
    paths:
      - node_modules/
  artifacts:
    reports:
      junit: junit.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

# Integration Tests (Slower)
integration-tests:
  stage: test
  script:
    - npm install
    - npm run test:integration
  timeout: 30m
  artifacts:
    paths:
      - test-results/

# E2E Tests (Slowest - only on MR/main)
e2e-tests:
  stage: test
  script:
    - npm install
    - npm run test:e2e
  only:
    - merge_requests
    - main
  timeout: 1h

# Coverage Report
coverage:
  stage: coverage
  script:
    - npm run test:coverage
  coverage: '/Statements\s*:\s*(\d+\.?\d*)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
```

### Package.json Test Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest tests/unit --coverage",
    "test:integration": "jest tests/integration --runInBand",
    "test:e2e": "jest tests/e2e --runInBand --detectOpenHandles",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage --coverageReporters=text --coverageReporters=cobertura",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

---

## Test Organization

### Directory Structure

```
tests/
├── unit/                           # Fast, isolated tests
│   ├── services/
│   ├── adapters/
│   ├── generators/
│   ├── cli/
│   └── utils/
├── integration/                    # Component interaction tests
│   ├── cli/
│   │   ├── wizard-interactive.test.ts
│   │   ├── export.test.ts ← CREATED
│   │   ├── validate.test.ts
│   │   ├── run.test.ts
│   │   ├── generate-gaid.test.ts ← NEW
│   │   ├── register.test.ts ← NEW
│   │   ├── discover.test.ts ← NEW
│   │   └── verify.test.ts ← NEW
│   ├── workflows/
│   ├── adapters/
│   └── advanced/
│       ├── a2a-communication.test.ts ← NEW
│       ├── gaid-system.test.ts ← NEW
│       ├── token-efficiency.test.ts ← NEW
│       ├── progressive-validation.test.ts ← NEW
│       └── type-aware-exports.test.ts ← NEW
├── e2e/                            # Complete workflows
│   ├── npm-pack.smoke.spec.ts
│   ├── cli.smoke.spec.ts
│   ├── schema-coverage.smoke.spec.ts
│   ├── wizard-to-kubernetes.e2e.spec.ts ← NEW
│   ├── agent-deployment.e2e.spec.ts ← NEW
│   └── platform-exports/
│       ├── langchain-deployment.e2e.spec.ts ← NEW
│       ├── drupal-module-install.e2e.spec.ts ← NEW
│       └── npm-package-publish.e2e.spec.ts ← NEW
├── fixtures/                       # Test data
│   ├── manifests/
│   │   ├── minimal.ossa.yaml
│   │   ├── complete.ossa.yaml
│   │   ├── with-a2a.ossa.yaml
│   │   ├── with-token-efficiency.ossa.yaml
│   │   └── with-compliance.ossa.yaml
│   └── schemas/
├── helpers/                        # Test utilities
│   ├── manifest-factory.ts
│   ├── mock-server.ts
│   └── docker-helpers.ts
└── results/                        # Test output
```

---

## Test Data Management

### 1. Fixture Manifests

Create reusable test manifests for different scenarios:

```yaml
# tests/fixtures/manifests/complete.ossa.yaml
apiVersion: ossa/v0.4.4
kind: Agent
metadata:
  name: test-complete-agent
  version: 1.0.0
  description: Complete test agent with all v0.4 features
  annotations:
    ossa.org/gaid: did:ossa:test:abc123
    ossa.org/serial-number: AG-TEST-001
spec:
  role: You are a comprehensive test assistant
  llm:
    provider: openai
    model: gpt-4o-mini
    temperature: 0.7
    maxTokens: 4096
  autonomy:
    level: supervised
    approvalRequired:
      - critical-actions
    maxTurns: 10
  tools:
    - name: test-tool
      description: A test tool
      input_schema:
        type: object
        properties:
          query:
            type: string
  messaging:
    protocol: nats
    capabilities:
      - query
      - command
    discovery:
      enabled: true
      mechanism: dns
    team:
      name: test-team
      role: worker
  token_efficiency:
    strategies:
      - prompt-caching
      - context-pruning
    target_savings_percent: 80
  compliance:
    frameworks:
      - SOC2
      - HIPAA
```

### 2. Test Factories

```typescript
// tests/helpers/manifest-factory.ts
export class ManifestFactory {
  static minimal(): OssaManifest {
    return {
      apiVersion: 'ossa/v0.4.4',
      kind: 'Agent',
      metadata: {
        name: 'test-agent',
        version: '1.0.0',
      },
      spec: {
        role: 'Test assistant',
      },
    };
  }

  static withA2A(): OssaManifest {
    return {
      ...this.minimal(),
      spec: {
        ...this.minimal().spec,
        messaging: {
          protocol: 'nats',
          capabilities: ['query', 'command'],
          discovery: {
            enabled: true,
            mechanism: 'dns',
          },
        },
      },
    };
  }

  static withTokenEfficiency(): OssaManifest {
    return {
      ...this.minimal(),
      spec: {
        ...this.minimal().spec,
        token_efficiency: {
          strategies: ['prompt-caching', 'context-pruning'],
          target_savings_percent: 85,
        },
      },
    };
  }
}
```

### 3. Mock Servers

```typescript
// tests/helpers/mock-registry-server.ts
export function startMockRegistryAPI(port: number = 3005): http.Server {
  const app = express();

  app.post('/api/v1/agents', (req, res) => {
    const { manifest } = req.body;
    res.json({
      success: true,
      gaid: `did:ossa:test:${randomUUID()}`,
      url: `http://localhost:${port}/agents/${manifest.metadata.name}`,
    });
  });

  app.get('/api/v1/agents/search', (req, res) => {
    res.json({
      agents: [
        {
          gaid: 'did:ossa:test:agent1',
          name: 'test-agent-1',
          capabilities: ['query'],
        },
      ],
    });
  });

  return app.listen(port);
}
```

---

## Testing Checklist

### Before Every Commit

- [ ] All unit tests pass: `npm run test:unit`
- [ ] Changed files have corresponding tests
- [ ] No new code without tests
- [ ] Test names are descriptive
- [ ] No `.only()` or `.skip()` in tests

### Before Creating MR

- [ ] All tests pass: `npm test`
- [ ] Coverage meets targets: `npm run test:coverage`
- [ ] Integration tests pass: `npm run test:integration`
- [ ] E2E tests pass (if applicable): `npm run test:e2e`
- [ ] No console.log() left in tests
- [ ] Test documentation updated

### Before Release

- [ ] Full test suite passes on CI
- [ ] Coverage report reviewed
- [ ] E2E tests pass in staging environment
- [ ] Smoke tests validated on production
- [ ] Test strategy document updated

---

## Immediate Actions Required (2026-02-06)

### 1. Create Missing Integration Tests

**Priority**: CRITICAL

```bash
# Create these test files:
tests/integration/cli/wizard-interactive.test.ts
tests/integration/cli/generate-gaid.test.ts
tests/integration/cli/register.test.ts
tests/integration/cli/discover.test.ts
tests/integration/cli/verify.test.ts
```

### 2. Create Advanced Feature Tests

**Priority**: HIGH

```bash
# Create these test files:
tests/integration/advanced/a2a-communication.test.ts
tests/integration/advanced/gaid-system.test.ts
tests/integration/advanced/token-efficiency.test.ts
tests/integration/advanced/progressive-validation.test.ts
tests/integration/advanced/type-aware-exports.test.ts
```

### 3. Create E2E Tests

**Priority**: MEDIUM

```bash
# Create these test files:
tests/e2e/wizard-to-kubernetes.e2e.spec.ts
tests/e2e/agent-deployment.e2e.spec.ts
tests/e2e/platform-exports/langchain-deployment.e2e.spec.ts
tests/e2e/platform-exports/drupal-module-install.e2e.spec.ts
```

### 4. Fix Export Test Runtime

**Priority**: CRITICAL

```bash
# Current issue: DI container errors when running `node bin/ossa export`
# Fix: Ensure inversify container is properly initialized in bin/ossa
```

### 5. Expand Fixture Library

**Priority**: MEDIUM

```bash
# Create comprehensive fixture manifests:
tests/fixtures/manifests/minimal.ossa.yaml
tests/fixtures/manifests/complete.ossa.yaml
tests/fixtures/manifests/with-a2a.ossa.yaml
tests/fixtures/manifests/with-token-efficiency.ossa.yaml
tests/fixtures/manifests/with-compliance.ossa.yaml
```

---

## Success Metrics

### Coverage Targets

```
Overall:
- Statements: 90%+
- Branches: 85%+
- Functions: 90%+
- Lines: 90%+

Per Category:
- CLI Commands: 100% integration coverage
- Export Platforms: 100% documentation + 90% execution coverage
- Advanced Features: 90% unit + integration coverage
- Utilities: 95% coverage
```

### Test Execution Times

```
Unit Tests: < 30 seconds
Integration Tests: < 5 minutes
E2E Tests: < 30 minutes
Full Suite: < 40 minutes
```

### CI/CD Requirements

```
✅ All tests pass before merge
✅ Coverage doesn't decrease
✅ No test warnings or deprecations
✅ Test execution time under threshold
✅ No flaky tests (must be deterministic)
```

---

## Conclusion

This testing strategy ensures **every function and feature** in OSSA is comprehensively tested. By following this strategy, we achieve:

1. **Confidence**: Every change is validated
2. **Quality**: Bugs caught before production
3. **Documentation**: Tests serve as usage examples
4. **Velocity**: Fast feedback on changes
5. **Reliability**: Deterministic, repeatable results

**Next Steps**: Create the missing test files listed in "Immediate Actions Required" section.

---

**Last Updated**: 2026-02-06
**Status**: Active - Implementation In Progress
**Owner**: openstandardagents maintainers
