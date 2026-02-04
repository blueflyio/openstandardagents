# LangServe Export Testing & Validation Framework
## Comprehensive Design Specification v1.0

**Project**: OSSA LangServe Export Validation
**Version**: 1.0.0
**Date**: 2026-02-04
**Status**: Design Phase

---

## Executive Summary

This document defines a production-grade testing and validation framework for LangServe exports following OSSA v0.4.1 specifications. The framework ensures all generated deployments meet security, performance, and reliability standards before production release.

**Key Principles**:
- API-First: OpenAPI 3.1 as single source of truth
- DRY: Zero duplication, all validation from schemas
- SOLID: Dependency injection, single responsibility
- Type-Safe: Auto-generated types + runtime validation (Zod)
- Production-Ready: OWASP Top 10, load testing, contract validation

---

## 1. Test Suite Architecture

### 1.1 Testing Pyramid

```
                    ┌─────────────────┐
                    │   E2E Tests     │ (5%)
                    │  Cross-platform │
                    │   Deployment    │
                    └─────────────────┘
                  ┌───────────────────────┐
                  │  Integration Tests    │ (15%)
                  │  OSSA Validation      │
                  │  API Contract Testing │
                  └───────────────────────┘
              ┌─────────────────────────────────┐
              │       Component Tests           │ (30%)
              │  Template Generation            │
              │  Platform-Specific Exports      │
              └─────────────────────────────────┘
          ┌───────────────────────────────────────────┐
          │           Unit Tests                      │ (50%)
          │  Schema Validation, Type Guards           │
          │  Utility Functions, Transformers          │
          └───────────────────────────────────────────┘
```

### 1.2 Test Categories

#### Unit Tests (50% coverage target)
```typescript
// Location: src/**/__tests__/*.unit.test.ts
// Framework: Vitest
// Coverage: 90%+ required

/**
 * Unit Test Scope:
 * - OSSA manifest validation (schema conformance)
 * - Type guards and validators
 * - Utility functions (pure functions only)
 * - Configuration transformers
 * - Template string generators
 */

// Example structure:
describe('OSSAManifestValidator', () => {
  describe('validateManifest', () => {
    it('should validate valid OSSA v0.4.1 manifest')
    it('should reject invalid version format')
    it('should validate required fields')
    it('should validate optional fields when present')
    it('should reject unknown fields in strict mode')
  })

  describe('validateMetadata', () => {
    it('should validate semantic versioning')
    it('should validate RFC3986 URIs')
    it('should validate ISO8601 timestamps')
  })
})
```

#### Component Tests (30% coverage target)
```typescript
// Location: src/**/__tests__/*.component.test.ts
// Framework: Vitest + Testcontainers
// Coverage: 80%+ required

/**
 * Component Test Scope:
 * - Template generation (Dockerfile, K8s manifests, etc.)
 * - Export workflow orchestration
 * - File system operations (mocked)
 * - Configuration builders
 * - Platform-specific adapters
 */

describe('DockerTemplateGenerator', () => {
  it('should generate valid Dockerfile for Python 3.11')
  it('should include all dependencies from manifest')
  it('should apply security hardening')
  it('should generate multi-stage builds')
  it('should handle custom environment variables')
})

describe('KubernetesManifestGenerator', () => {
  it('should generate valid Deployment manifest')
  it('should generate Service manifest with correct ports')
  it('should apply resource limits from manifest')
  it('should include health check probes')
  it('should generate HPA when autoscaling configured')
})
```

#### Integration Tests (15% coverage target)
```typescript
// Location: tests/integration/**/*.integration.test.ts
// Framework: Vitest + Docker Compose
// Coverage: Critical paths required

/**
 * Integration Test Scope:
 * - Full export workflow (manifest → deployment artifacts)
 * - Multi-platform export in single run
 * - API contract validation against OpenAPI spec
 * - Database interactions (if applicable)
 * - External service mocking (registries, APIs)
 */

describe('LangServeExportWorkflow', () => {
  it('should export to all platforms from single manifest')
  it('should validate OSSA manifest against v0.4.1 schema')
  it('should generate deployment-ready artifacts')
  it('should include all required configuration files')
  it('should apply platform-specific optimizations')
})

describe('OSSARegistryIntegration', () => {
  it('should publish manifest to registry')
  it('should validate manifest on publish')
  it('should retrieve manifest from registry')
  it('should handle registry authentication')
})
```

#### End-to-End Tests (5% coverage target)
```typescript
// Location: tests/e2e/**/*.e2e.test.ts
// Framework: Playwright + Testcontainers
// Coverage: Critical user journeys only

/**
 * E2E Test Scope:
 * - Complete deployment lifecycle
 * - Platform-specific deployment verification
 * - Cross-platform compatibility
 * - Production deployment simulation
 */

describe('DeploymentLifecycle', () => {
  describe('Docker', () => {
    it('should build and run Docker image')
    it('should respond to health checks')
    it('should handle graceful shutdown')
  })

  describe('Kubernetes', () => {
    it('should deploy to kind cluster')
    it('should pass readiness probes')
    it('should autoscale under load')
  })

  describe('AWS Lambda', () => {
    it('should deploy using SAM CLI')
    it('should respond to invocations')
    it('should handle cold starts')
  })
})
```

### 1.3 Directory Structure

```
langserve-export-validator/
├── src/
│   ├── validators/
│   │   ├── __tests__/
│   │   │   ├── ossa-validator.unit.test.ts
│   │   │   ├── template-validator.unit.test.ts
│   │   │   └── deployment-validator.unit.test.ts
│   │   ├── ossa-validator.ts
│   │   ├── template-validator.ts
│   │   └── deployment-validator.ts
│   ├── generators/
│   │   ├── __tests__/
│   │   │   ├── docker-generator.component.test.ts
│   │   │   ├── kubernetes-generator.component.test.ts
│   │   │   └── serverless-generator.component.test.ts
│   │   ├── docker-generator.ts
│   │   ├── kubernetes-generator.ts
│   │   └── serverless-generator.ts
│   ├── schemas/
│   │   ├── ossa-v0.4.1.schema.ts       # Zod schema
│   │   ├── deployment-config.schema.ts
│   │   └── platform-config.schema.ts
│   └── generated/
│       └── types.ts                     # Auto-generated from OpenAPI
├── tests/
│   ├── integration/
│   │   ├── export-workflow.integration.test.ts
│   │   ├── registry-integration.integration.test.ts
│   │   └── api-contract.integration.test.ts
│   ├── e2e/
│   │   ├── docker-deployment.e2e.test.ts
│   │   ├── kubernetes-deployment.e2e.test.ts
│   │   ├── cloudrun-deployment.e2e.test.ts
│   │   ├── lambda-deployment.e2e.test.ts
│   │   └── azure-functions-deployment.e2e.test.ts
│   ├── security/
│   │   ├── owasp-top10.security.test.ts
│   │   ├── dependency-scan.security.test.ts
│   │   └── secrets-scan.security.test.ts
│   ├── performance/
│   │   ├── load-testing.perf.test.ts
│   │   ├── stress-testing.perf.test.ts
│   │   └── benchmarks.perf.test.ts
│   └── fixtures/
│       ├── manifests/
│       │   ├── valid-v0.4.1.json
│       │   ├── invalid-version.json
│       │   └── complete-example.json
│       └── expected-outputs/
│           ├── docker/
│           ├── kubernetes/
│           └── serverless/
├── openapi/
│   └── langserve-export-api.yaml        # API specification
├── .gitlab-ci.yml                       # CI/CD pipeline
└── vitest.config.ts                     # Test configuration
```

---

## 2. Validation Schemas

### 2.1 OSSA Manifest Validation (Zod)

```typescript
// src/schemas/ossa-v0.4.1.schema.ts

import { z } from 'zod';

/**
 * OSSA v0.4.1 Manifest Schema
 *
 * Validates complete OSSA manifest according to specification.
 * Single source of truth for runtime validation.
 */

// Base types
const SemanticVersion = z.string().regex(
  /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/,
  'Must be valid semantic version (e.g., 1.0.0, 1.0.0-beta.1)'
);

const RFC3986URI = z.string().url('Must be valid RFC3986 URI');

const ISO8601Timestamp = z.string().datetime({
  message: 'Must be ISO8601 timestamp'
});

// Metadata schema
const MetadataSchema = z.object({
  version: SemanticVersion,
  created_at: ISO8601Timestamp,
  updated_at: ISO8601Timestamp,
  author: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  homepage: RFC3986URI.optional(),
  documentation: RFC3986URI.optional(),
  repository: RFC3986URI.optional(),
  license: z.string().optional(),
});

// Capability schema
const CapabilityTypeSchema = z.enum([
  'mcp',
  'langchain',
  'langserve',
  'openai_function',
  'anthropic_tool',
  'generic_api',
  'custom'
]);

const CapabilitySchema = z.object({
  type: CapabilityTypeSchema,
  name: z.string().min(1),
  description: z.string().optional(),
  input_schema: z.record(z.any()).optional(),
  output_schema: z.record(z.any()).optional(),
  config: z.record(z.any()).optional(),
});

// Deployment schema
const PlatformSchema = z.enum([
  'docker',
  'kubernetes',
  'cloud_run',
  'aws_lambda',
  'azure_functions',
  'heroku',
  'fly_io'
]);

const ResourceRequirementsSchema = z.object({
  cpu: z.string().regex(/^\d+m?$/).optional(),
  memory: z.string().regex(/^\d+[KMG]i?$/).optional(),
  storage: z.string().regex(/^\d+[KMG]i?$/).optional(),
});

const HealthCheckSchema = z.object({
  path: z.string(),
  interval_seconds: z.number().int().positive(),
  timeout_seconds: z.number().int().positive(),
  healthy_threshold: z.number().int().positive().optional(),
  unhealthy_threshold: z.number().int().positive().optional(),
});

const AutoscalingSchema = z.object({
  enabled: z.boolean(),
  min_instances: z.number().int().positive(),
  max_instances: z.number().int().positive(),
  target_cpu_utilization: z.number().min(0).max(100).optional(),
  target_memory_utilization: z.number().min(0).max(100).optional(),
});

const DeploymentConfigSchema = z.object({
  platform: PlatformSchema,
  runtime: z.string(),
  resources: ResourceRequirementsSchema.optional(),
  environment: z.record(z.string()).optional(),
  secrets: z.array(z.string()).optional(),
  health_check: HealthCheckSchema.optional(),
  autoscaling: AutoscalingSchema.optional(),
});

// Main OSSA manifest schema
export const OSSAManifestSchema = z.object({
  ossa_version: z.literal('0.4.1'),
  agent_id: z.string().uuid('agent_id must be valid UUID'),
  name: z.string().min(1),
  metadata: MetadataSchema,
  capabilities: z.array(CapabilitySchema).min(1),
  deployment: DeploymentConfigSchema,
  dependencies: z.object({
    python: z.string().optional(),
    packages: z.array(z.string()).optional(),
    npm: z.record(z.string()).optional(),
  }).optional(),
}).strict(); // Reject unknown fields

export type OSSAManifest = z.infer<typeof OSSAManifestSchema>;

// Validator function
export function validateOSSAManifest(data: unknown): OSSAManifest {
  return OSSAManifestSchema.parse(data);
}

// Safe validator (returns result object)
export function safeValidateOSSAManifest(data: unknown) {
  return OSSAManifestSchema.safeParse(data);
}
```

### 2.2 Template Validation Schema

```typescript
// src/schemas/template-validation.schema.ts

import { z } from 'zod';

/**
 * Template Validation Schemas
 *
 * Validates generated templates for each platform.
 */

// Docker template validation
export const DockerfileValidationSchema = z.object({
  base_image: z.string().regex(/^[\w.-]+(?::[\w.-]+)?$/),
  python_version: z.string().regex(/^3\.(8|9|10|11|12)$/),
  working_directory: z.string().startsWith('/'),
  exposed_ports: z.array(z.number().int().min(1).max(65535)),
  has_healthcheck: z.boolean(),
  has_non_root_user: z.boolean(),
  has_security_hardening: z.boolean(),
  layers_optimized: z.boolean(),
});

// Kubernetes manifest validation
export const KubernetesManifestValidationSchema = z.object({
  apiVersion: z.string(),
  kind: z.enum(['Deployment', 'Service', 'ConfigMap', 'Secret', 'HorizontalPodAutoscaler']),
  metadata: z.object({
    name: z.string(),
    namespace: z.string().optional(),
    labels: z.record(z.string()).optional(),
  }),
  spec: z.record(z.any()), // Platform-specific validation
});

// Serverless template validation
export const ServerlessTemplateValidationSchema = z.object({
  runtime: z.string(),
  handler: z.string(),
  timeout_seconds: z.number().int().positive(),
  memory_mb: z.number().int().positive(),
  environment: z.record(z.string()).optional(),
  has_iam_role: z.boolean(),
  has_vpc_config: z.boolean().optional(),
});
```

### 2.3 Deployment Configuration Validation

```typescript
// src/schemas/deployment-config.schema.ts

import { z } from 'zod';

/**
 * Deployment Configuration Validation
 *
 * Validates platform-specific deployment configurations.
 */

export const DockerDeploymentConfigSchema = z.object({
  image_name: z.string(),
  image_tag: z.string().regex(/^[\w.-]+$/),
  registry: z.string().url().optional(),
  build_args: z.record(z.string()).optional(),
  labels: z.record(z.string()).optional(),
  networks: z.array(z.string()).optional(),
  volumes: z.array(z.string()).optional(),
});

export const KubernetesDeploymentConfigSchema = z.object({
  cluster_name: z.string(),
  namespace: z.string(),
  replicas: z.number().int().positive(),
  image_pull_policy: z.enum(['Always', 'IfNotPresent', 'Never']),
  service_type: z.enum(['ClusterIP', 'NodePort', 'LoadBalancer']),
  ingress_enabled: z.boolean(),
  tls_enabled: z.boolean(),
});

export const AWSLambdaDeploymentConfigSchema = z.object({
  function_name: z.string(),
  runtime: z.enum(['python3.8', 'python3.9', 'python3.10', 'python3.11', 'python3.12']),
  handler: z.string(),
  role_arn: z.string().regex(/^arn:aws:iam::\d{12}:role\/[\w+=,.@-]+$/),
  region: z.string(),
  layers: z.array(z.string()).optional(),
  vpc_config: z.object({
    subnet_ids: z.array(z.string()),
    security_group_ids: z.array(z.string()),
  }).optional(),
});
```

### 2.4 API Contract Schema (OpenAPI 3.1)

```yaml
# openapi/langserve-export-api.yaml

openapi: 3.1.0
info:
  title: LangServe Export API
  version: 1.0.0
  description: API for LangServe deployment export and validation

servers:
  - url: http://localhost:8000/api/v1
    description: Local development
  - url: https://langserve-export.bluefly.io/api/v1
    description: Production

paths:
  /export:
    post:
      operationId: exportDeployment
      summary: Export LangServe deployment
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ExportRequest'
      responses:
        '200':
          description: Export successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ExportResponse'
        '400':
          description: Invalid request
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /validate:
    post:
      operationId: validateManifest
      summary: Validate OSSA manifest
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/OSSAManifest'
      responses:
        '200':
          description: Validation result
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ValidationResponse'

components:
  schemas:
    OSSAManifest:
      type: object
      required:
        - ossa_version
        - agent_id
        - name
        - metadata
        - capabilities
        - deployment
      properties:
        ossa_version:
          type: string
          const: "0.4.1"
        agent_id:
          type: string
          format: uuid
        name:
          type: string
        metadata:
          $ref: '#/components/schemas/Metadata'
        capabilities:
          type: array
          items:
            $ref: '#/components/schemas/Capability'
        deployment:
          $ref: '#/components/schemas/DeploymentConfig'

    ExportRequest:
      type: object
      required:
        - manifest
        - platforms
      properties:
        manifest:
          $ref: '#/components/schemas/OSSAManifest'
        platforms:
          type: array
          items:
            type: string
            enum: [docker, kubernetes, cloud_run, aws_lambda, azure_functions]
        output_format:
          type: string
          enum: [archive, directory]
          default: archive

    ExportResponse:
      type: object
      required:
        - export_id
        - platforms
        - artifacts
      properties:
        export_id:
          type: string
          format: uuid
        platforms:
          type: array
          items:
            type: string
        artifacts:
          type: object
          additionalProperties:
            $ref: '#/components/schemas/PlatformArtifact'

    ValidationResponse:
      type: object
      required:
        - valid
        - errors
      properties:
        valid:
          type: boolean
        errors:
          type: array
          items:
            $ref: '#/components/schemas/ValidationError'
```

---

## 3. CI/CD Pipeline Configuration

### 3.1 GitLab CI Pipeline (Component-Based)

```yaml
# .gitlab-ci.yml

include:
  # GitLab CI Components from blueflyio/gitlab_components
  - component: gitlab.com/blueflyio/gitlab_components/validate-ossa@v1
  - component: gitlab.com/blueflyio/gitlab_components/security-scan@v1
  - component: gitlab.com/blueflyio/gitlab_components/test-runner@v1
  - component: gitlab.com/blueflyio/gitlab_components/deploy-validator@v1

variables:
  OSSA_VERSION: "0.4.1"
  NODE_VERSION: "20"
  PYTHON_VERSION: "3.11"
  DOCKER_VERSION: "24"

stages:
  - validate
  - test
  - security
  - integration
  - e2e
  - performance
  - report

# Stage 1: Validation
validate:manifest:
  stage: validate
  extends: .validate-ossa
  script:
    - npm run validate:ossa
    - npm run validate:openapi
  artifacts:
    reports:
      junit: reports/validation-*.xml

validate:types:
  stage: validate
  script:
    - npm run generate:types
    - npm run type-check
  artifacts:
    paths:
      - src/generated/types.ts

# Stage 2: Unit & Component Tests
test:unit:
  stage: test
  extends: .test-runner
  script:
    - npm run test:unit
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  artifacts:
    reports:
      junit: reports/unit-*.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

test:component:
  stage: test
  extends: .test-runner
  services:
    - docker:dind
  script:
    - npm run test:component
  artifacts:
    reports:
      junit: reports/component-*.xml

# Stage 3: Security Scanning
security:owasp:
  stage: security
  extends: .security-scan
  variables:
    SCAN_TYPE: "owasp_top_10"
  script:
    - npm run test:security:owasp
  artifacts:
    reports:
      junit: reports/security-owasp-*.xml

security:dependencies:
  stage: security
  extends: .security-scan
  variables:
    SCAN_TYPE: "dependencies"
  script:
    - npm audit --production --audit-level=moderate
    - npm run test:security:deps
  allow_failure: false

security:secrets:
  stage: security
  extends: .security-scan
  variables:
    SCAN_TYPE: "secrets"
  script:
    - gitleaks detect --source . --no-git
    - npm run test:security:secrets
  allow_failure: false

security:container:
  stage: security
  image: aquasec/trivy:latest
  script:
    - trivy image --exit-code 1 --severity HIGH,CRITICAL $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  allow_failure: false

# Stage 4: Integration Tests
test:integration:
  stage: integration
  services:
    - docker:dind
    - postgres:15
  variables:
    POSTGRES_DB: testdb
    POSTGRES_USER: test
    POSTGRES_PASSWORD: test
  script:
    - npm run test:integration
  artifacts:
    reports:
      junit: reports/integration-*.xml

test:api-contract:
  stage: integration
  script:
    - npm run test:api-contract
  artifacts:
    reports:
      junit: reports/api-contract-*.xml

# Stage 5: E2E Platform Tests
test:e2e:docker:
  stage: e2e
  extends: .deploy-validator
  services:
    - docker:dind
  variables:
    PLATFORM: "docker"
  script:
    - npm run test:e2e:docker
  artifacts:
    reports:
      junit: reports/e2e-docker-*.xml

test:e2e:kubernetes:
  stage: e2e
  extends: .deploy-validator
  variables:
    PLATFORM: "kubernetes"
  before_script:
    - curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
    - chmod +x ./kind
    - ./kind create cluster --name test
  script:
    - npm run test:e2e:kubernetes
  after_script:
    - ./kind delete cluster --name test
  artifacts:
    reports:
      junit: reports/e2e-k8s-*.xml

test:e2e:lambda:
  stage: e2e
  extends: .deploy-validator
  variables:
    PLATFORM: "aws_lambda"
  before_script:
    - pip install aws-sam-cli
  script:
    - npm run test:e2e:lambda
  artifacts:
    reports:
      junit: reports/e2e-lambda-*.xml

# Stage 6: Performance Tests
test:performance:load:
  stage: performance
  services:
    - docker:dind
  script:
    - npm run test:performance:load
  artifacts:
    reports:
      junit: reports/performance-load-*.xml
    paths:
      - reports/performance/load-test-results.html

test:performance:stress:
  stage: performance
  script:
    - npm run test:performance:stress
  artifacts:
    reports:
      junit: reports/performance-stress-*.xml

test:performance:benchmark:
  stage: performance
  script:
    - npm run test:performance:benchmark
  artifacts:
    paths:
      - reports/performance/benchmarks.json

# Stage 7: Reporting
report:coverage:
  stage: report
  script:
    - npm run coverage:report
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    paths:
      - coverage/
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

report:aggregate:
  stage: report
  script:
    - npm run report:aggregate
  artifacts:
    paths:
      - reports/aggregate/
    expose_as: 'Test Reports'
```

### 3.2 GitLab CI Components (Reusable)

```yaml
# Component: validate-ossa (blueflyio/gitlab_components)
spec:
  inputs:
    ossa_version:
      default: "0.4.1"
    manifest_path:
      default: "ossa-manifest.json"
---
.validate-ossa:
  image: node:20-alpine
  before_script:
    - npm install -g @bluefly/ossa-validator
  script:
    - ossa-validator validate $[[ inputs.manifest_path ]] --version $[[ inputs.ossa_version ]]
```

### 3.3 Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run --dir src/**/__tests__ --pattern '*.unit.test.ts'",
    "test:component": "vitest run --dir src/**/__tests__ --pattern '*.component.test.ts'",
    "test:integration": "vitest run --dir tests/integration",
    "test:e2e": "playwright test",
    "test:e2e:docker": "playwright test tests/e2e/docker-deployment.e2e.test.ts",
    "test:e2e:kubernetes": "playwright test tests/e2e/kubernetes-deployment.e2e.test.ts",
    "test:e2e:lambda": "playwright test tests/e2e/lambda-deployment.e2e.test.ts",
    "test:security": "npm run test:security:owasp && npm run test:security:deps && npm run test:security:secrets",
    "test:security:owasp": "vitest run tests/security/owasp-top10.security.test.ts",
    "test:security:deps": "npm audit && snyk test",
    "test:security:secrets": "gitleaks detect --source . --no-git",
    "test:performance": "npm run test:performance:load && npm run test:performance:stress",
    "test:performance:load": "k6 run tests/performance/load-testing.js",
    "test:performance:stress": "k6 run tests/performance/stress-testing.js",
    "test:performance:benchmark": "vitest bench",
    "test:api-contract": "dredd openapi/langserve-export-api.yaml http://localhost:8000",
    "validate:ossa": "zod-to-json-schema src/schemas/ossa-v0.4.1.schema.ts | ajv validate",
    "validate:openapi": "openapi-validator openapi/langserve-export-api.yaml",
    "generate:types": "openapi-typescript openapi/langserve-export-api.yaml -o src/generated/types.ts",
    "type-check": "tsc --noEmit",
    "coverage:report": "vitest run --coverage",
    "report:aggregate": "node scripts/aggregate-reports.js"
  }
}
```

---

## 4. Platform Deployment Verification Tests

### 4.1 Docker Deployment Test

```typescript
// tests/e2e/docker-deployment.e2e.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Docker from 'dockerode';
import { validateOSSAManifest } from '../../src/validators/ossa-validator';
import { DockerExporter } from '../../src/exporters/docker-exporter';

describe('Docker Deployment E2E', () => {
  let docker: Docker;
  let containerId: string;

  beforeAll(async () => {
    docker = new Docker();
  });

  afterAll(async () => {
    if (containerId) {
      const container = docker.getContainer(containerId);
      await container.stop();
      await container.remove();
    }
  });

  it('should build Docker image from OSSA manifest', async () => {
    // Load and validate manifest
    const manifest = await loadManifest('fixtures/manifests/complete-example.json');
    const validatedManifest = validateOSSAManifest(manifest);

    // Export to Docker
    const exporter = new DockerExporter(validatedManifest);
    const artifacts = await exporter.export();

    // Build image
    const stream = await docker.buildImage({
      context: artifacts.buildContext,
      src: ['Dockerfile', 'requirements.txt', 'app.py']
    }, {
      t: 'langserve-test:latest'
    });

    await new Promise((resolve, reject) => {
      docker.modem.followProgress(stream, (err, res) =>
        err ? reject(err) : resolve(res)
      );
    });

    // Verify image exists
    const images = await docker.listImages();
    const image = images.find(img =>
      img.RepoTags?.includes('langserve-test:latest')
    );
    expect(image).toBeDefined();
  }, 60000);

  it('should run container and pass health checks', async () => {
    // Create and start container
    const container = await docker.createContainer({
      Image: 'langserve-test:latest',
      ExposedPorts: { '8000/tcp': {} },
      HostConfig: {
        PortBindings: { '8000/tcp': [{ HostPort: '8000' }] }
      }
    });

    containerId = container.id;
    await container.start();

    // Wait for container to be healthy
    await waitForHealthy(container, 30000);

    // Verify health endpoint
    const response = await fetch('http://localhost:8000/health');
    expect(response.ok).toBe(true);

    const health = await response.json();
    expect(health.status).toBe('healthy');
  }, 60000);

  it('should handle graceful shutdown', async () => {
    const container = docker.getContainer(containerId);

    // Send SIGTERM
    await container.kill({ signal: 'SIGTERM' });

    // Wait for container to stop
    const info = await container.wait();
    expect(info.StatusCode).toBe(0);
  });

  it('should include security hardening', async () => {
    const image = docker.getImage('langserve-test:latest');
    const inspect = await image.inspect();

    // Verify non-root user
    expect(inspect.Config.User).not.toBe('root');
    expect(inspect.Config.User).not.toBe('0');

    // Verify no privileged mode
    expect(inspect.Config.Privileged).toBe(false);

    // Verify read-only filesystem (where applicable)
    expect(inspect.Config.ReadonlyRootfs).toBe(true);
  });
});
```

### 4.2 Kubernetes Deployment Test

```typescript
// tests/e2e/kubernetes-deployment.e2e.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { KubeConfig, AppsV1Api, CoreV1Api } from '@kubernetes/client-node';
import { KubernetesExporter } from '../../src/exporters/kubernetes-exporter';
import { validateOSSAManifest } from '../../src/validators/ossa-validator';

describe('Kubernetes Deployment E2E', () => {
  let k8sApps: AppsV1Api;
  let k8sCore: CoreV1Api;
  const namespace = 'langserve-test';

  beforeAll(async () => {
    const kc = new KubeConfig();
    kc.loadFromDefault();

    k8sApps = kc.makeApiClient(AppsV1Api);
    k8sCore = kc.makeApiClient(CoreV1Api);

    // Create test namespace
    await k8sCore.createNamespace({
      metadata: { name: namespace }
    });
  });

  afterAll(async () => {
    // Cleanup namespace
    await k8sCore.deleteNamespace(namespace);
  });

  it('should deploy to Kubernetes cluster', async () => {
    // Load and validate manifest
    const manifest = await loadManifest('fixtures/manifests/complete-example.json');
    const validatedManifest = validateOSSAManifest(manifest);

    // Export to Kubernetes
    const exporter = new KubernetesExporter(validatedManifest);
    const manifests = await exporter.export();

    // Apply deployment
    const deployment = manifests.deployment;
    await k8sApps.createNamespacedDeployment(namespace, deployment);

    // Apply service
    const service = manifests.service;
    await k8sCore.createNamespacedService(namespace, service);

    // Verify deployment created
    const deployments = await k8sApps.listNamespacedDeployment(namespace);
    expect(deployments.body.items).toHaveLength(1);
  }, 60000);

  it('should pass readiness probes', async () => {
    // Wait for pods to be ready
    await waitForPodsReady(k8sCore, namespace, 'app=langserve-test', 60000);

    // Get pod status
    const pods = await k8sCore.listNamespacedPod(namespace, undefined, undefined, undefined, undefined, 'app=langserve-test');
    const pod = pods.body.items[0];

    expect(pod.status?.phase).toBe('Running');
    expect(pod.status?.conditions?.find(c => c.type === 'Ready')?.status).toBe('True');
  }, 90000);

  it('should autoscale under load', async () => {
    // Create HPA if configured
    const manifest = await loadManifest('fixtures/manifests/complete-example.json');
    if (manifest.deployment.autoscaling?.enabled) {
      const exporter = new KubernetesExporter(manifest);
      const hpa = await exporter.generateHPA();

      await k8sApps.createNamespacedHorizontalPodAutoscaler(namespace, hpa);

      // Generate load
      await generateLoad('http://langserve-test.langserve-test.svc.cluster.local:8000', 60000);

      // Wait for scale-up
      await new Promise(resolve => setTimeout(resolve, 30000));

      // Verify increased replicas
      const deployment = await k8sApps.readNamespacedDeployment('langserve-test', namespace);
      expect(deployment.body.status?.replicas).toBeGreaterThan(1);
    }
  }, 120000);

  it('should enforce resource limits', async () => {
    const pods = await k8sCore.listNamespacedPod(namespace, undefined, undefined, undefined, undefined, 'app=langserve-test');
    const pod = pods.body.items[0];

    const container = pod.spec?.containers[0];
    expect(container?.resources?.limits).toBeDefined();
    expect(container?.resources?.requests).toBeDefined();

    // Verify CPU limits
    expect(container?.resources?.limits?.cpu).toBeDefined();
    expect(container?.resources?.requests?.cpu).toBeDefined();

    // Verify memory limits
    expect(container?.resources?.limits?.memory).toBeDefined();
    expect(container?.resources?.requests?.memory).toBeDefined();
  });
});
```

### 4.3 AWS Lambda Deployment Test

```typescript
// tests/e2e/lambda-deployment.e2e.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { LambdaClient, CreateFunctionCommand, InvokeCommand, DeleteFunctionCommand } from '@aws-sdk/client-lambda';
import { LambdaExporter } from '../../src/exporters/lambda-exporter';
import { validateOSSAManifest } from '../../src/validators/ossa-validator';

describe('AWS Lambda Deployment E2E', () => {
  let lambda: LambdaClient;
  const functionName = 'langserve-test';

  beforeAll(() => {
    lambda = new LambdaClient({ region: 'us-east-1' });
  });

  afterAll(async () => {
    // Cleanup function
    await lambda.send(new DeleteFunctionCommand({ FunctionName: functionName }));
  });

  it('should deploy Lambda function from OSSA manifest', async () => {
    // Load and validate manifest
    const manifest = await loadManifest('fixtures/manifests/complete-example.json');
    const validatedManifest = validateOSSAManifest(manifest);

    // Export to Lambda
    const exporter = new LambdaExporter(validatedManifest);
    const artifacts = await exporter.export();

    // Create Lambda function
    const command = new CreateFunctionCommand({
      FunctionName: functionName,
      Runtime: 'python3.11',
      Role: process.env.LAMBDA_ROLE_ARN,
      Handler: 'handler.main',
      Code: {
        ZipFile: artifacts.zipFile
      },
      Timeout: 30,
      MemorySize: 512
    });

    const response = await lambda.send(command);
    expect(response.FunctionArn).toBeDefined();
  }, 60000);

  it('should respond to invocations', async () => {
    // Invoke function
    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify({ action: 'health' })
    });

    const response = await lambda.send(command);
    expect(response.StatusCode).toBe(200);

    const payload = JSON.parse(new TextDecoder().decode(response.Payload));
    expect(payload.status).toBe('healthy');
  }, 30000);

  it('should handle cold starts efficiently', async () => {
    // Wait for function to become inactive
    await new Promise(resolve => setTimeout(resolve, 300000)); // 5 minutes

    // Measure cold start time
    const startTime = Date.now();

    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify({ action: 'ping' })
    });

    await lambda.send(command);
    const coldStartTime = Date.now() - startTime;

    // Cold start should be under 3 seconds
    expect(coldStartTime).toBeLessThan(3000);
  }, 400000);
});
```

### 4.4 Platform Test Matrix

```typescript
// tests/e2e/platform-matrix.e2e.test.ts

import { describe, it } from 'vitest';
import { validateOSSAManifest } from '../../src/validators/ossa-validator';

/**
 * Platform Compatibility Matrix
 *
 * Tests all platform exports from single manifest.
 */

const platforms = [
  'docker',
  'kubernetes',
  'cloud_run',
  'aws_lambda',
  'azure_functions'
] as const;

describe('Platform Export Matrix', () => {
  const manifest = loadManifest('fixtures/manifests/complete-example.json');

  platforms.forEach(platform => {
    describe(platform, () => {
      it('should export successfully', async () => {
        const validatedManifest = validateOSSAManifest(manifest);
        const exporter = getExporter(platform, validatedManifest);
        const artifacts = await exporter.export();

        expect(artifacts).toBeDefined();
        expect(artifacts.platform).toBe(platform);
      });

      it('should validate exported artifacts', async () => {
        const validatedManifest = validateOSSAManifest(manifest);
        const exporter = getExporter(platform, validatedManifest);
        const artifacts = await exporter.export();

        const validator = getValidator(platform);
        const result = await validator.validate(artifacts);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should include required configuration files', async () => {
        const validatedManifest = validateOSSAManifest(manifest);
        const exporter = getExporter(platform, validatedManifest);
        const artifacts = await exporter.export();

        const requiredFiles = getRequiredFiles(platform);
        requiredFiles.forEach(file => {
          expect(artifacts.files).toContain(file);
        });
      });
    });
  });
});
```

---

## 5. Performance Benchmarks

### 5.1 Load Testing Configuration

```javascript
// tests/performance/load-testing.js

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

/**
 * Load Testing Configuration
 *
 * Simulates production traffic patterns.
 */

// Custom metrics
const errorRate = new Rate('errors');
const exportDuration = new Trend('export_duration');

export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp-up to 10 users
    { duration: '5m', target: 10 },   // Stay at 10 users
    { duration: '2m', target: 50 },   // Ramp-up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Ramp-up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp-down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],     // 95% of requests under 2s
    http_req_failed: ['rate<0.01'],        // Error rate under 1%
    errors: ['rate<0.05'],                 // Business error rate under 5%
    export_duration: ['p(95)<30000'],      // 95% of exports under 30s
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export default function () {
  group('Export Workflow', () => {
    // Health check
    group('Health Check', () => {
      const res = http.get(`${BASE_URL}/health`);
      check(res, {
        'health check status is 200': (r) => r.status === 200,
        'health check returns healthy': (r) => JSON.parse(r.body).status === 'healthy',
      });
      errorRate.add(res.status !== 200);
    });

    // Validate manifest
    group('Validate Manifest', () => {
      const manifest = getTestManifest();
      const res = http.post(
        `${BASE_URL}/api/v1/validate`,
        JSON.stringify(manifest),
        { headers: { 'Content-Type': 'application/json' } }
      );

      check(res, {
        'validation status is 200': (r) => r.status === 200,
        'validation returns valid result': (r) => JSON.parse(r.body).valid === true,
      });
      errorRate.add(res.status !== 200);
    });

    // Export deployment
    group('Export Deployment', () => {
      const manifest = getTestManifest();
      const exportRequest = {
        manifest,
        platforms: ['docker', 'kubernetes'],
        output_format: 'archive'
      };

      const startTime = Date.now();
      const res = http.post(
        `${BASE_URL}/api/v1/export`,
        JSON.stringify(exportRequest),
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: '60s'
        }
      );
      const duration = Date.now() - startTime;

      exportDuration.add(duration);

      check(res, {
        'export status is 200': (r) => r.status === 200,
        'export returns artifacts': (r) => JSON.parse(r.body).artifacts !== undefined,
        'export completes in under 30s': (r) => duration < 30000,
      });
      errorRate.add(res.status !== 200);
    });
  });

  sleep(1);
}

function getTestManifest() {
  return {
    ossa_version: '0.4.1',
    agent_id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'test-agent',
    metadata: {
      version: '1.0.0',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    capabilities: [
      {
        type: 'langserve',
        name: 'test-capability',
        description: 'Test capability'
      }
    ],
    deployment: {
      platform: 'docker',
      runtime: 'python3.11',
      resources: {
        cpu: '500m',
        memory: '512Mi'
      }
    }
  };
}
```

### 5.2 Stress Testing Configuration

```javascript
// tests/performance/stress-testing.js

import http from 'k6/http';
import { check, group } from 'k6';
import { Rate } from 'k6/metrics';

/**
 * Stress Testing Configuration
 *
 * Pushes system to breaking point.
 */

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp-up to 100 users
    { duration: '5m', target: 100 },   // Stay at 100 users
    { duration: '2m', target: 200 },   // Ramp-up to 200 users
    { duration: '5m', target: 200 },   // Stay at 200 users
    { duration: '2m', target: 300 },   // Ramp-up to 300 users
    { duration: '5m', target: 300 },   // Stay at 300 users
    { duration: '2m', target: 400 },   // Ramp-up to 400 users
    { duration: '5m', target: 400 },   // Stay at 400 users
    { duration: '10m', target: 0 },    // Ramp-down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(99)<5000'],     // 99% under 5s
    http_req_failed: ['rate<0.05'],        // Error rate under 5%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export default function () {
  const res = http.post(
    `${BASE_URL}/api/v1/export`,
    JSON.stringify(getTestManifest()),
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: '120s'
    }
  );

  check(res, {
    'status is 200 or 429': (r) => [200, 429].includes(r.status),
  });
  errorRate.add(![200, 429].includes(res.status));
}
```

### 5.3 Benchmark Tests

```typescript
// tests/performance/benchmarks.perf.test.ts

import { bench, describe } from 'vitest';
import { validateOSSAManifest } from '../../src/validators/ossa-validator';
import { DockerExporter } from '../../src/exporters/docker-exporter';
import { KubernetesExporter } from '../../src/exporters/kubernetes-exporter';

/**
 * Performance Benchmarks
 *
 * Measures critical path performance.
 */

describe('Validation Performance', () => {
  const manifest = loadManifest('fixtures/manifests/complete-example.json');

  bench('validate OSSA manifest', () => {
    validateOSSAManifest(manifest);
  });

  bench('validate 100 manifests', () => {
    for (let i = 0; i < 100; i++) {
      validateOSSAManifest(manifest);
    }
  });
});

describe('Export Performance', () => {
  const manifest = validateOSSAManifest(
    loadManifest('fixtures/manifests/complete-example.json')
  );

  bench('export to Docker', async () => {
    const exporter = new DockerExporter(manifest);
    await exporter.export();
  });

  bench('export to Kubernetes', async () => {
    const exporter = new KubernetesExporter(manifest);
    await exporter.export();
  });

  bench('export to all platforms', async () => {
    const platforms = ['docker', 'kubernetes', 'cloud_run', 'aws_lambda', 'azure_functions'];
    await Promise.all(
      platforms.map(async platform => {
        const exporter = getExporter(platform, manifest);
        return exporter.export();
      })
    );
  });
});

describe('Template Generation Performance', () => {
  const manifest = validateOSSAManifest(
    loadManifest('fixtures/manifests/complete-example.json')
  );

  bench('generate Dockerfile', () => {
    const generator = new DockerfileGenerator(manifest);
    generator.generate();
  });

  bench('generate Kubernetes manifests', () => {
    const generator = new KubernetesManifestGenerator(manifest);
    generator.generateDeployment();
    generator.generateService();
    generator.generateConfigMap();
  });
});

/**
 * Performance Targets
 *
 * - Manifest validation: < 10ms
 * - Single platform export: < 500ms
 * - Multi-platform export (5 platforms): < 2s
 * - Template generation: < 100ms
 */
```

### 5.4 Performance Monitoring

```typescript
// src/monitoring/performance-monitor.ts

/**
 * Performance Monitoring
 *
 * Tracks export performance in production.
 */

export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  startTimer(operation: string): () => void {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(operation, duration);
    };
  }

  private recordMetric(operation: string, duration: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    this.metrics.get(operation)!.push(duration);
  }

  getMetrics(operation: string): PerformanceMetrics {
    const durations = this.metrics.get(operation) || [];
    if (durations.length === 0) {
      return { count: 0, avg: 0, p50: 0, p95: 0, p99: 0, max: 0 };
    }

    const sorted = [...durations].sort((a, b) => a - b);
    return {
      count: durations.length,
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      max: sorted[sorted.length - 1],
    };
  }

  reset(): void {
    this.metrics.clear();
  }
}

interface PerformanceMetrics {
  count: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
  max: number;
}
```

---

## 6. Security Testing (OWASP Top 10)

### 6.1 OWASP Top 10 Test Suite

```typescript
// tests/security/owasp-top10.security.test.ts

import { describe, it, expect } from 'vitest';
import { validateOSSAManifest } from '../../src/validators/ossa-validator';

/**
 * OWASP Top 10 Security Tests
 *
 * Tests for common web application vulnerabilities.
 */

describe('OWASP Top 10 Security Tests', () => {
  describe('A01:2021 - Broken Access Control', () => {
    it('should enforce authentication on protected endpoints', async () => {
      const response = await fetch('http://localhost:8000/api/v1/export');
      expect(response.status).toBe(401); // Unauthorized
    });

    it('should validate authorization for user-owned resources', async () => {
      // Attempt to access another user's export
      const response = await fetch('http://localhost:8000/api/v1/exports/other-user-id', {
        headers: { 'Authorization': 'Bearer valid-token' }
      });
      expect(response.status).toBe(403); // Forbidden
    });
  });

  describe('A02:2021 - Cryptographic Failures', () => {
    it('should enforce HTTPS in production', async () => {
      const manifest = loadManifest('fixtures/manifests/complete-example.json');
      const exporter = new DockerExporter(manifest);
      const artifacts = await exporter.export();

      // Verify HTTPS enforcement in generated config
      expect(artifacts.config.enforce_https).toBe(true);
    });

    it('should encrypt sensitive data at rest', async () => {
      // Verify secrets are encrypted
      const manifest = loadManifest('fixtures/manifests/with-secrets.json');
      expect(manifest.deployment.secrets).toBeDefined();

      // Secrets should reference encrypted values, not plaintext
      manifest.deployment.secrets?.forEach(secret => {
        expect(secret).not.toMatch(/password|apikey|token/i);
      });
    });
  });

  describe('A03:2021 - Injection', () => {
    it('should prevent SQL injection', async () => {
      const maliciousInput = "'; DROP TABLE agents; --";
      const response = await fetch('http://localhost:8000/api/v1/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: maliciousInput })
      });

      // Should validate and reject
      expect(response.status).toBe(400);
    });

    it('should prevent command injection in exports', async () => {
      const maliciousManifest = {
        ...getValidManifest(),
        name: 'test; rm -rf /',
      };

      expect(() => validateOSSAManifest(maliciousManifest)).toThrow();
    });

    it('should sanitize template inputs', async () => {
      const manifest = getValidManifest();
      manifest.deployment.environment = {
        'COMMAND': '$(whoami)'
      };

      const exporter = new DockerExporter(manifest);
      const artifacts = await exporter.export();

      // Command substitution should be escaped
      expect(artifacts.dockerfile).not.toMatch(/\$\(whoami\)/);
    });
  });

  describe('A04:2021 - Insecure Design', () => {
    it('should enforce rate limiting', async () => {
      const requests = Array.from({ length: 101 }, () =>
        fetch('http://localhost:8000/api/v1/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(getValidManifest())
        })
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);

      expect(rateLimited.length).toBeGreaterThan(0);
    });

    it('should implement request size limits', async () => {
      const hugeManifest = {
        ...getValidManifest(),
        metadata: {
          ...getValidManifest().metadata,
          description: 'A'.repeat(10 * 1024 * 1024) // 10MB string
        }
      };

      const response = await fetch('http://localhost:8000/api/v1/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hugeManifest)
      });

      expect(response.status).toBe(413); // Payload Too Large
    });
  });

  describe('A05:2021 - Security Misconfiguration', () => {
    it('should disable directory listing', async () => {
      const response = await fetch('http://localhost:8000/');
      const html = await response.text();

      expect(html).not.toMatch(/Index of/i);
    });

    it('should remove default credentials', async () => {
      const manifest = loadManifest('fixtures/manifests/complete-example.json');
      const exporter = new DockerExporter(manifest);
      const artifacts = await exporter.export();

      // No default passwords in config
      const configStr = JSON.stringify(artifacts.config);
      expect(configStr).not.toMatch(/admin|password|secret/i);
    });

    it('should include security headers', async () => {
      const response = await fetch('http://localhost:8000/health');

      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
    });
  });

  describe('A06:2021 - Vulnerable and Outdated Components', () => {
    it('should use up-to-date dependencies', async () => {
      const manifest = loadManifest('fixtures/manifests/complete-example.json');
      const dependencies = manifest.dependencies?.packages || [];

      // Run npm audit
      const audit = await runNpmAudit();
      expect(audit.vulnerabilities.high).toBe(0);
      expect(audit.vulnerabilities.critical).toBe(0);
    });
  });

  describe('A07:2021 - Identification and Authentication Failures', () => {
    it('should enforce strong password policies', async () => {
      const weakPasswords = ['password', '123456', 'admin'];

      for (const password of weakPasswords) {
        const response = await fetch('http://localhost:8000/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });

        expect(response.status).toBe(400);
      }
    });

    it('should implement account lockout after failed attempts', async () => {
      const attempts = Array.from({ length: 6 }, () =>
        fetch('http://localhost:8000/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'test', password: 'wrong' })
        })
      );

      const responses = await Promise.all(attempts);
      const lastResponse = responses[responses.length - 1];

      expect(lastResponse.status).toBe(429); // Too Many Requests
    });
  });

  describe('A08:2021 - Software and Data Integrity Failures', () => {
    it('should verify integrity of downloaded packages', async () => {
      const manifest = loadManifest('fixtures/manifests/complete-example.json');
      const exporter = new DockerExporter(manifest);
      const artifacts = await exporter.export();

      // Dockerfile should include checksum verification
      expect(artifacts.dockerfile).toMatch(/sha256/i);
    });
  });

  describe('A09:2021 - Security Logging and Monitoring Failures', () => {
    it('should log authentication failures', async () => {
      await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'test', password: 'wrong' })
      });

      // Verify log entry created
      const logs = await readLogs();
      expect(logs).toContain('authentication_failed');
    });

    it('should log export operations', async () => {
      await fetch('http://localhost:8000/api/v1/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify(getValidManifest())
      });

      const logs = await readLogs();
      expect(logs).toContain('export_initiated');
    });
  });

  describe('A10:2021 - Server-Side Request Forgery (SSRF)', () => {
    it('should prevent SSRF via manifest URLs', async () => {
      const maliciousManifest = {
        ...getValidManifest(),
        metadata: {
          ...getValidManifest().metadata,
          repository: 'http://169.254.169.254/latest/meta-data/' // AWS metadata endpoint
        }
      };

      const response = await fetch('http://localhost:8000/api/v1/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(maliciousManifest)
      });

      expect(response.status).toBe(400);
    });
  });
});
```

### 6.2 Dependency Security Scanning

```typescript
// tests/security/dependency-scan.security.test.ts

import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

/**
 * Dependency Security Tests
 *
 * Scans for vulnerable dependencies.
 */

describe('Dependency Security', () => {
  it('should pass npm audit', () => {
    try {
      execSync('npm audit --production --audit-level=moderate', {
        stdio: 'pipe'
      });
    } catch (error: any) {
      // Parse audit output
      const output = error.stdout.toString();
      expect(output).not.toMatch(/high|critical/i);
    }
  });

  it('should pass Snyk test', async () => {
    try {
      execSync('snyk test --severity-threshold=high', {
        stdio: 'pipe'
      });
    } catch (error: any) {
      const output = error.stdout.toString();
      expect(output).not.toMatch(/high|critical/i);
    }
  });

  it('should have no outdated critical dependencies', () => {
    const output = execSync('npm outdated --json', {
      stdio: 'pipe',
      encoding: 'utf-8'
    });

    if (output) {
      const outdated = JSON.parse(output);
      const critical = Object.values(outdated).filter(
        (pkg: any) => pkg.type === 'dependencies'
      );

      expect(critical).toHaveLength(0);
    }
  });
});
```

### 6.3 Secrets Scanning

```typescript
// tests/security/secrets-scan.security.test.ts

import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

/**
 * Secrets Scanning Tests
 *
 * Detects hardcoded secrets in codebase.
 */

describe('Secrets Scanning', () => {
  it('should not contain hardcoded secrets', () => {
    try {
      execSync('gitleaks detect --source . --no-git --exit-code 1', {
        stdio: 'pipe'
      });
    } catch (error: any) {
      // Gitleaks exits with 1 if secrets found
      if (error.status === 1) {
        const output = error.stdout.toString();
        throw new Error(`Secrets detected:\n${output}`);
      }
    }
  });

  it('should not include .env files in exports', async () => {
    const manifest = loadManifest('fixtures/manifests/complete-example.json');
    const exporter = new DockerExporter(manifest);
    const artifacts = await exporter.export();

    expect(artifacts.files).not.toContain('.env');
    expect(artifacts.dockerfile).toMatch(/\.env/); // Should be in .dockerignore
  });
});
```

---

## 7. Implementation Timeline

### Phase 1: Foundation (Week 1-2)
- [ ] Set up test infrastructure (Vitest, Playwright, Testcontainers)
- [ ] Implement OSSA v0.4.1 Zod schemas
- [ ] Create validation test suite (unit tests)
- [ ] Set up CI/CD pipeline skeleton

### Phase 2: Core Testing (Week 3-4)
- [ ] Implement component tests for template generators
- [ ] Create integration tests for export workflows
- [ ] Add API contract testing (Dredd)
- [ ] Implement security scanning (OWASP, dependencies, secrets)

### Phase 3: Platform Tests (Week 5-6)
- [ ] Docker deployment E2E tests
- [ ] Kubernetes deployment E2E tests
- [ ] AWS Lambda deployment E2E tests
- [ ] Cloud Run deployment E2E tests
- [ ] Azure Functions deployment E2E tests

### Phase 4: Performance (Week 7-8)
- [ ] Load testing configuration (k6)
- [ ] Stress testing configuration
- [ ] Performance benchmarks (Vitest bench)
- [ ] Performance monitoring implementation

### Phase 5: Polish & Documentation (Week 9-10)
- [ ] Complete test coverage (90%+ target)
- [ ] CI/CD pipeline optimization
- [ ] Test report aggregation
- [ ] Documentation and runbooks

---

## 8. Success Criteria

### Test Coverage
- Unit tests: 90%+ code coverage
- Component tests: 80%+ coverage of critical paths
- Integration tests: All export workflows covered
- E2E tests: All platforms verified
- Security tests: OWASP Top 10 complete

### Performance Targets
- Manifest validation: < 10ms (p95)
- Single platform export: < 2s (p95)
- Multi-platform export: < 10s (p95)
- API response time: < 500ms (p95)
- Error rate: < 1%

### Security Requirements
- Zero high/critical vulnerabilities
- All OWASP Top 10 mitigations in place
- Dependency scanning passing
- Secrets scanning passing
- Container security hardening verified

### Platform Compatibility
- Docker: Build and run successfully
- Kubernetes: Deploy and pass health checks
- AWS Lambda: Deploy and respond to invocations
- Cloud Run: Deploy and autoscale
- Azure Functions: Deploy and handle triggers

---

## 9. Tools & Dependencies

### Test Framework
```json
{
  "devDependencies": {
    "vitest": "^1.2.0",
    "@playwright/test": "^1.40.0",
    "@testcontainers/node": "^10.3.0",
    "k6": "^0.48.0",
    "dredd": "^14.1.0"
  }
}
```

### Validation
```json
{
  "dependencies": {
    "zod": "^3.22.0",
    "openapi-typescript": "^6.7.0",
    "express-openapi-validator": "^5.1.0"
  }
}
```

### Security
```json
{
  "devDependencies": {
    "snyk": "^1.1258.0",
    "gitleaks": "^8.18.0",
    "trivy": "^0.48.0"
  }
}
```

### Platform SDKs
```json
{
  "devDependencies": {
    "dockerode": "^4.0.0",
    "@kubernetes/client-node": "^0.20.0",
    "@aws-sdk/client-lambda": "^3.478.0",
    "@azure/functions": "^4.4.0"
  }
}
```

---

## 10. Continuous Improvement

### Monitoring
- Track test execution times
- Monitor flaky tests (< 1% failure rate)
- Measure code coverage trends
- Track performance regression

### Maintenance
- Update OSSA schema on spec changes
- Refresh platform SDK versions monthly
- Review security scan results weekly
- Update performance benchmarks quarterly

### Feedback Loop
- Post-deployment verification in production
- User-reported issues feed test cases
- Performance metrics inform benchmarks
- Security incidents drive new tests

---

## Conclusion

This comprehensive testing framework ensures LangServe exports are production-ready before release. By combining validation, security, performance, and platform-specific testing, we achieve confidence in deployment quality across all supported platforms.

**Key Benefits:**
- Early detection of issues (shift-left testing)
- Platform compatibility verification
- Security compliance (OWASP Top 10)
- Performance validation under load
- Continuous quality monitoring

**Next Steps:**
1. Review and approve design
2. Set up test infrastructure
3. Implement Phase 1 (Foundation)
4. Iterate based on feedback
