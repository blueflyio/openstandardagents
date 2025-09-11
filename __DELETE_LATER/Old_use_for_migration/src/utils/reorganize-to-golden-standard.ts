#!/usr/bin/env npx tsx
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const OSSA_ROOT = '/Users/flux423/Sites/LLM/OSSA';

console.log('🏆 OSSA Golden Standard Reorganization - v0.1.8');
console.log('🔥 API-First, Contract-Driven, Agent-Ready Architecture');
console.log('='.repeat(60));

// Create golden standard directories (comprehensive structure)
const goldenDirs = [
  // Main source tree
  'src',
  'src/cli',
  'src/cli/commands',
  'src/cli/utils',
  'src/api',
  'src/api/http',
  'src/api/http/health',
  'src/api/http/auth',
  'src/api/mcp',
  'src/api/mcp/tools',
  'src/api/mcp/discovery',
  'src/api/graphql',
  'src/services',
  'src/services/shared',
  'src/repositories',
  'src/repositories/database',
  'src/repositories/database/entities',
  'src/repositories/database/migrations',
  'src/repositories/external',
  'src/repositories/cache',
  'src/middleware',
  'src/schemas',
  'src/schemas/requests',
  'src/schemas/responses',
  'src/config',
  'src/telemetry',
  'src/utils',
  'src/types',
  
  // API contracts (AUTHORITATIVE)
  'api',
  'api/schemas',
  'api/examples',
  'api/examples/requests',
  'api/examples/responses',
  
  // Agent configurations
  '.agents',
  '.agents/manifests',
  '.agents/runtime',
  '.agents/state',
  '.agents/state/checkpoints',
  '.agents/state/metrics',
  
  // Infrastructure as Code
  'infrastructure',
  'infrastructure/terraform',
  'infrastructure/terraform/modules',
  'infrastructure/terraform/environments',
  'infrastructure/kubernetes',
  'infrastructure/kubernetes/base',
  'infrastructure/kubernetes/overlays',
  'infrastructure/docker',
  'infrastructure/ci-cd',
  'infrastructure/ci-cd/.github',
  
  // Documentation
  'docs',
  'docs/api',
  'docs/architecture',
  'docs/architecture/decisions',
  'docs/development',
  'docs/operations',
  
  // Test suites
  'tests',
  'tests/unit',
  'tests/integration',
  'tests/integration/api',
  'tests/integration/services',
  'tests/e2e',
  'tests/e2e/scenarios',
  'tests/e2e/fixtures',
  'tests/contract',
  'tests/performance',
  
  // Scripts and executables
  'scripts',
  'scripts/dev',
  'scripts/ci',
  'scripts/deploy',
  'bin',
  
  // Build output (will be gitignored)
  'dist',
  'coverage'
];

console.log('\n📁 Creating golden standard directories...');
goldenDirs.forEach(dir => {
  const fullPath = path.join(OSSA_ROOT, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`  ✅ Created: ${dir}`);
  }
});

// Move existing content to golden structure
console.log('\n📦 Reorganizing existing code to golden standard...');
const moves = [
  // Move existing services (preserve what's already there)
  ['src/services', 'src/services/_existing'],
  
  // Move lib contents to proper locations
  ['lib/services', 'src/services/lib-migrated'],
  ['lib/frameworks', 'src/utils/frameworks'],
  ['lib/integrations', 'src/repositories/integrations'],
  ['lib/mcp', 'src/api/mcp'],
  ['lib/observability', 'src/telemetry'],
  ['lib/validation', 'src/utils/validation'],
  ['lib/uadp-discovery.ts', 'src/services/shared/uadp-discovery.ts'],
  ['lib/uadp-discovery.js', 'src/services/shared/uadp-discovery.js'],
  ['lib/uadp-discovery.d.ts', 'src/types/uadp-discovery.d.ts'],
  
  // Move CLI structure
  ['cli/src', 'src/cli/legacy'],
  ['cli/bin', 'bin'],
  ['cli/package.json', 'src/cli/legacy-package.json'],
  
  // Move any existing API files
  ['api', 'api/_existing'],
  
  // Move agent configs
  ['.ossa', '.agents/manifests'],
  ['agents', '.agents/runtime'],
  
  // Move documentation
  ['docs', 'docs/_existing'],
  
  // Move test files
  ['test', 'tests/legacy'],
  ['__tests__', 'tests/unit/legacy']
];

moves.forEach(([from, to]) => {
  const fromPath = path.join(OSSA_ROOT, from);
  const toPath = path.join(OSSA_ROOT, to);
  
  if (fs.existsSync(fromPath)) {
    // Ensure parent directory exists
    const toDir = path.dirname(toPath);
    if (!fs.existsSync(toDir)) {
      fs.mkdirSync(toDir, { recursive: true });
    }
    
    try {
      execSync(`mv "${fromPath}" "${toPath}" 2>/dev/null || true`, { cwd: OSSA_ROOT });
      console.log(`  ✅ Moved: ${from} → ${to}`);
    } catch (e) {
      console.log(`  ⚠️  Skip: ${from} (already moved or doesn't exist)`);
    }
  }
});

// Move CLI to src/cli
console.log('\n🔧 Reorganizing CLI...');
if (fs.existsSync(path.join(OSSA_ROOT, 'cli/src'))) {
  execSync('mv cli/src/* src/cli/ 2>/dev/null || true', { cwd: OSSA_ROOT });
  console.log('  ✅ Moved CLI source to src/cli');
}

// Move docs that belong in root
console.log('\n📚 Organizing documentation...');
const docsToMove = [
  ['AUDIT_REPORT.md', 'docs/AUDIT_REPORT.md'],
  ['CHANGELOG.md', 'docs/CHANGELOG.md'], 
  ['CODE_OF_CONDUCT.md', 'docs/CODE_OF_CONDUCT.md'],
  ['CONTRIBUTING.md', 'docs/CONTRIBUTING.md'],
  ['FOLDER_STRUCTURE.md', 'docs/FOLDER_STRUCTURE.md'],
  ['test-results.json', 'reports/test-results.json']
];

docsToMove.forEach(([from, to]) => {
  const fromPath = path.join(OSSA_ROOT, from);
  const toPath = path.join(OSSA_ROOT, to);
  
  if (fs.existsSync(fromPath)) {
    const toDir = path.dirname(toPath);
    if (!fs.existsSync(toDir)) {
      fs.mkdirSync(toDir, { recursive: true });
    }
    
    execSync(`mv "${fromPath}" "${toPath}" 2>/dev/null || true`, { cwd: OSSA_ROOT });
    console.log(`  ✅ Moved: ${from} → ${to}`);
  }
});

// Clean up directories to be removed
console.log('\n🧹 Cleaning up old directories...');
const toDelete = [
  'lib',
  'compliance',
  'validators', 
  'registry',
  'extensions',
  'v0.1.8',
  'coordination-plans',
  'services',
  'examples',
  'agent-validator',
  'naming-auditor',
  'workspace-auditor'
];

toDelete.forEach(dir => {
  const dirPath = path.join(OSSA_ROOT, dir);
  if (fs.existsSync(dirPath)) {
    execSync(`mv "${dirPath}" __DELETE_LATER/ 2>/dev/null || true`, { cwd: OSSA_ROOT });
    console.log(`  ✅ Moved to __DELETE_LATER: ${dir}`);
  }
});

// Create essential config files following golden standards
console.log('\n📝 Creating golden standard configuration files...');

// Create src/index.ts
if (!fs.existsSync(path.join(OSSA_ROOT, 'src/index.ts'))) {
  fs.writeFileSync(path.join(OSSA_ROOT, 'src/index.ts'), `// OSSA - Open Standard Software Architecture v0.1.8
// API-First, Contract-Driven, Agent-Ready Platform

export * from './cli';
export * from './api/fastify-server';
export * from './services';
export * from './types';
export * from './utils';

// Re-export key types for external consumers
export type { 
  OSSAConfig,
  AgentManifest,
  HealthStatus,
  ServiceCapability 
} from './types';
`);
  console.log('  ✅ Created src/index.ts');
}

// Create OpenAPI 3.1 specification with OSSA compliance
if (!fs.existsSync(path.join(OSSA_ROOT, 'api/openapi.yaml'))) {
  fs.writeFileSync(path.join(OSSA_ROOT, 'api/openapi.yaml'), `openapi: 3.1.0
info:
  title: OSSA Platform API
  version: 0.1.8
  description: |
    Open Standard Software Architecture Platform
    Enterprise-grade agent orchestration with full OSSA v0.1.8 compliance
  contact:
    name: OSSA Platform Team
    url: https://ossa.platform
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: http://localhost:3000
    description: Development server
  - url: https://api.ossa.platform
    description: Production server

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
    apiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key

  schemas:
    HealthResponse:
      type: object
      required: [status, service, version, timestamp]
      properties:
        status:
          type: string
          enum: [healthy, degraded, unhealthy]
        service:
          type: string
        version:
          type: string
        timestamp:
          type: string
          format: date-time
        uptime:
          type: number
          minimum: 0

    ErrorResponse:
      type: object
      required: [error]
      properties:
        error:
          type: object
          required: [code, message, timestamp]
          properties:
            code:
              type: string
            message:
              type: string
            timestamp:
              type: string
              format: date-time
            traceId:
              type: string

security:
  - bearerAuth: []
  - apiKeyAuth: []

tags:
  - name: health
    description: Health and readiness checks
  - name: agents
    description: Agent lifecycle management
  - name: orchestration
    description: Multi-agent orchestration

paths:
  /health:
    get:
      operationId: ossa.health.check
      tags: [health]
      summary: Service health check
      description: Returns current health status of the OSSA platform
      responses:
        '200':
          description: Service is healthy
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HealthResponse'
        '503':
          description: Service is unhealthy
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /ready:
    get:
      operationId: ossa.health.ready
      tags: [health]
      summary: Readiness probe
      description: Kubernetes-style readiness probe
      responses:
        '200':
          description: Service is ready
          content:
            application/json:
              schema:
                type: object
                properties:
                  ready:
                    type: boolean
                    example: true

  /capabilities:
    get:
      operationId: ossa.platform.capabilities
      tags: [agents]
      summary: Platform capabilities
      description: Returns all available platform capabilities
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Available capabilities
          content:
            application/json:
              schema:
                type: object
                properties:
                  capabilities:
                    type: array
                    items:
                      type: object
                      properties:
                        name:
                          type: string
                        version:
                          type: string
                        status:
                          type: string
`);
  console.log('  ✅ Created api/openapi.yaml');
}

// Create Fastify server template
if (!fs.existsSync(path.join(OSSA_ROOT, 'src/api/fastify-server.ts'))) {
  fs.writeFileSync(path.join(OSSA_ROOT, 'src/api/fastify-server.ts'), `#!/usr/bin/env node
/**
 * OSSA Platform Fastify Server with OpenAPI 3.1
 * Contract-first API with OSSA v0.1.8 compliance
 */

import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Type, Static } from '@sinclair/typebox';

export interface OSSAServerConfig {
  host?: string;
  port?: number;
  logger?: boolean;
}

export class OSSAFastifyServer {
  private server: FastifyInstance;
  private config: OSSAServerConfig;
  private startTime: number = Date.now();

  constructor(config: Partial<OSSAServerConfig> = {}) {
    this.config = {
      host: '0.0.0.0',
      port: 3000,
      logger: process.env.NODE_ENV !== 'production',
      ...config
    };

    this.server = Fastify({
      logger: this.config.logger,
      ajv: {
        customOptions: {
          strict: true,
          validateFormats: true
        }
      }
    });

    this.setupPlugins();
    this.setupRoutes();
  }

  private async setupPlugins() {
    // OpenAPI 3.1 Documentation
    await this.server.register(import('@fastify/swagger'), {
      openapi: {
        openapi: '3.1.0',
        info: {
          title: 'OSSA Platform API',
          version: '0.1.8',
          description: 'Open Standard Software Architecture Platform'
        }
      }
    });

    // Swagger UI
    await this.server.register(import('@fastify/swagger-ui'), {
      routePrefix: '/docs'
    });
  }

  private setupRoutes() {
    // Health check
    this.server.get('/health', {
      schema: {
        operationId: 'ossa.health.check',
        tags: ['health'],
        response: {
          200: Type.Object({
            status: Type.String(),
            service: Type.String(),
            version: Type.String(),
            timestamp: Type.String(),
            uptime: Type.Number()
          })
        }
      }
    }, async () => ({
      status: 'healthy',
      service: 'ossa-platform',
      version: '0.1.8',
      timestamp: new Date().toISOString(),
      uptime: (Date.now() - this.startTime) / 1000
    }));

    // OpenAPI spec endpoint
    this.server.get('/openapi.json', async () => {
      return this.server.swagger();
    });
  }

  async start(): Promise<string> {
    const address = await this.server.listen({
      host: this.config.host,
      port: this.config.port
    });

    console.log(\`🏆 OSSA Platform started at \${address}\`);
    console.log(\`📚 OpenAPI docs: \${address}/docs\`);
    
    return address;
  }

  async stop(): Promise<void> {
    await this.server.close();
  }

  get fastify(): FastifyInstance {
    return this.server;
  }
}

// CLI execution
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  const server = new OSSAFastifyServer();
  server.start().catch(console.error);
}
`);
  console.log('  ✅ Created src/api/fastify-server.ts');
}

// Create CHANGELOG.md (Keep a Changelog)
if (!fs.existsSync(path.join(OSSA_ROOT, 'CHANGELOG.md'))) {
  fs.writeFileSync(path.join(OSSA_ROOT, 'CHANGELOG.md'), `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- 

### Changed
- 

### Fixed
- 

## [0.1.0] - ${new Date().toISOString().split('T')[0]}
### Added
- Initial project setup
`);
  console.log('  ✅ Created CHANGELOG.md');
}

// Create .spectral.yaml for OpenAPI linting
if (!fs.existsSync(path.join(OSSA_ROOT, '.spectral.yaml'))) {
  fs.writeFileSync(path.join(OSSA_ROOT, '.spectral.yaml'), `# Spectral OpenAPI 3.1 Linting Rules - OSSA v0.1.8
extends: ["@stoplight/spectral-owasp", "@stoplight/spectral-oas"]

rules:
  # OpenAPI 3.1 compliance
  openapi-version-3-1:
    description: "OpenAPI specification must be version 3.1.0"
    given: "$"
    severity: error
    then:
      field: openapi
      function: pattern
      functionOptions:
        match: "^3\\\\.1\\\\.0$"

  # OSSA capability prefix format
  capability-prefix-format:
    description: "operationId must follow ossa.capability.action format"
    given: "$.paths.*[get,put,post,delete,options,head,patch,trace]"
    severity: error
    then:
      field: operationId
      function: pattern
      functionOptions:
        match: "^ossa\\\\.[a-zA-Z][a-zA-Z0-9]*(\\\\.[a-zA-Z][a-zA-Z0-9]*)*$"

  # OSSA version alignment
  ossa-version-alignment:
    description: "API version must align with OSSA platform version 0.1.8"
    given: "$.info"
    severity: error
    then:
      field: version
      function: pattern
      functionOptions:
        match: "^0\\\\.1\\\\.8$"
`);
  console.log('  ✅ Created .spectral.yaml');
}

// Create tsconfig.build.json
if (!fs.existsSync(path.join(OSSA_ROOT, 'tsconfig.build.json'))) {
  fs.writeFileSync(path.join(OSSA_ROOT, 'tsconfig.build.json'), JSON.stringify({
    extends: "./tsconfig.json",
    exclude: [
      "**/*.test.ts", 
      "**/*.spec.ts", 
      "tests/**/*", 
      "scripts/**/*",
      "__DELETE_LATER/**/*"
    ],
    compilerOptions: {
      outDir: "./dist",
      declaration: true,
      declarationMap: true,
      sourceMap: true
    }
  }, null, 2));
  console.log('  ✅ Created tsconfig.build.json');
}

console.log('\n✨ Reorganization complete!');
console.log('\n📊 Final structure:');
execSync('tree -L 2 -d -I "node_modules|__DELETE_LATER|.git"', { 
  cwd: OSSA_ROOT,
  stdio: 'inherit'
});