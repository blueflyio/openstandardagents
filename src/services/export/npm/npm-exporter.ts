/**
 * NPM Package Exporter Service
 *
 * Generates TypeScript agent code with Express server + OpenAPI
 * Exports OSSA agents as publishable npm packages
 *
 * SOLID: Single Responsibility - Coordinates npm export generation
 * DRY: Delegates to specialized generators
 */

import type { OssaAgent } from '../../../types/index.js';
import { TypeScriptGenerator } from './typescript-generator.js';
import { ExpressGenerator } from './express-generator.js';
import { OpenAPIGenerator } from './openapi-generator.js';
import { PackageJsonGenerator } from './package-json-generator.js';

export interface NPMExportOptions {
  /**
   * Output directory for generated package
   */
  outputDir?: string;

  /**
   * Include Docker configuration
   */
  includeDocker?: boolean;

  /**
   * Include tests
   */
  includeTests?: boolean;

  /**
   * Package scope (e.g., '@ossa', '@mycompany')
   */
  scope?: string;

  /**
   * Additional npm dependencies
   */
  additionalDeps?: Record<string, string>;

  /**
   * Target TypeScript version
   */
  tsVersion?: string;

  /**
   * Target Node version
   */
  nodeVersion?: string;
}

export interface NPMExportFile {
  /**
   * Relative path from package root
   */
  path: string;

  /**
   * File content
   */
  content: string;

  /**
   * File type
   */
  type: 'code' | 'config' | 'documentation' | 'docker';

  /**
   * Language/format
   */
  language?: string;
}

export interface NPMExportResult {
  /**
   * Success status
   */
  success: boolean;

  /**
   * Generated files
   */
  files: NPMExportFile[];

  /**
   * Package name
   */
  packageName?: string;

  /**
   * Package version
   */
  version?: string;

  /**
   * Error message if failed
   */
  error?: string;

  /**
   * Export metadata
   */
  metadata?: {
    duration: number;
    fileCount: number;
    hasDocker: boolean;
    hasTests: boolean;
  };
}

/**
 * NPM Package Exporter
 *
 * Generates complete npm packages with TypeScript + Express + OpenAPI
 */
export class NPMExporter {
  private tsGenerator: TypeScriptGenerator;
  private expressGenerator: ExpressGenerator;
  private openapiGenerator: OpenAPIGenerator;
  private packageJsonGenerator: PackageJsonGenerator;

  constructor() {
    this.tsGenerator = new TypeScriptGenerator();
    this.expressGenerator = new ExpressGenerator();
    this.openapiGenerator = new OpenAPIGenerator();
    this.packageJsonGenerator = new PackageJsonGenerator();
  }

  /**
   * Export OSSA manifest to npm package
   */
  async export(
    manifest: OssaAgent,
    options: NPMExportOptions = {}
  ): Promise<NPMExportResult> {
    const startTime = Date.now();
    const files: NPMExportFile[] = [];

    try {
      // Validate manifest
      this.validateManifest(manifest);

      const metadata = manifest.metadata || { name: 'agent', version: '1.0.0' };
      const packageName = this.getPackageName(metadata.name, options.scope);

      // 1. Generate package.json
      const packageJson = this.packageJsonGenerator.generate(manifest, {
        scope: options.scope,
        additionalDeps: options.additionalDeps,
      });
      files.push({
        path: 'package.json',
        content: packageJson,
        type: 'config',
        language: 'json',
      });

      // 2. Generate TypeScript agent class
      const agentClass = this.tsGenerator.generateAgentClass(manifest);
      files.push({
        path: 'src/index.ts',
        content: agentClass,
        type: 'code',
        language: 'typescript',
      });

      // 3. Generate TypeScript types
      const types = this.tsGenerator.generateTypes(manifest);
      files.push({
        path: 'src/types.ts',
        content: types,
        type: 'code',
        language: 'typescript',
      });

      // 4. Generate tool implementations
      if (manifest.spec?.tools && Array.isArray(manifest.spec.tools)) {
        const toolsDir = this.tsGenerator.generateTools(manifest.spec.tools);
        for (const [path, content] of Object.entries(toolsDir)) {
          files.push({
            path: `src/tools/${path}`,
            content,
            type: 'code',
            language: 'typescript',
          });
        }
      }

      // 5. Generate Express server
      const serverCode = this.expressGenerator.generateServer(manifest);
      files.push({
        path: 'src/server.ts',
        content: serverCode,
        type: 'code',
        language: 'typescript',
      });

      // 6. Generate OpenAPI spec
      const openapi = this.openapiGenerator.generate(manifest);
      files.push({
        path: 'openapi.yaml',
        content: openapi,
        type: 'config',
        language: 'yaml',
      });

      // 7. Generate tsconfig.json
      const tsconfig = this.generateTsConfig(options.tsVersion);
      files.push({
        path: 'tsconfig.json',
        content: tsconfig,
        type: 'config',
        language: 'json',
      });

      // 8. Generate README.md
      const readme = this.generateReadme(manifest, packageName);
      files.push({
        path: 'README.md',
        content: readme,
        type: 'documentation',
        language: 'markdown',
      });

      // 9. Generate .gitignore
      files.push({
        path: '.gitignore',
        content: this.generateGitIgnore(),
        type: 'config',
      });

      // 10. Generate .npmignore
      files.push({
        path: '.npmignore',
        content: this.generateNpmIgnore(),
        type: 'config',
      });

      // 11. Docker files (optional)
      if (options.includeDocker !== false) {
        const dockerfile = this.generateDockerfile(options.nodeVersion);
        files.push({
          path: 'Dockerfile',
          content: dockerfile,
          type: 'docker',
        });

        const dockerCompose = this.generateDockerCompose(manifest);
        files.push({
          path: 'docker-compose.yaml',
          content: dockerCompose,
          type: 'docker',
          language: 'yaml',
        });
      }

      // 12. Tests (optional)
      if (options.includeTests) {
        const tests = this.generateTests(manifest);
        files.push({
          path: 'tests/agent.test.ts',
          content: tests,
          type: 'code',
          language: 'typescript',
        });
      }

      return {
        success: true,
        files,
        packageName,
        version: metadata.version || '1.0.0',
        metadata: {
          duration: Date.now() - startTime,
          fileCount: files.length,
          hasDocker: options.includeDocker !== false,
          hasTests: options.includeTests === true,
        },
      };
    } catch (error) {
      return {
        success: false,
        files: [],
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          duration: Date.now() - startTime,
          fileCount: 0,
          hasDocker: false,
          hasTests: false,
        },
      };
    }
  }

  /**
   * Validate OSSA manifest
   */
  private validateManifest(manifest: OssaAgent): void {
    if (!manifest.metadata?.name) {
      throw new Error('manifest.metadata.name is required');
    }

    if (!manifest.metadata?.version) {
      throw new Error('manifest.metadata.version is required');
    }

    if (!manifest.spec) {
      throw new Error('manifest.spec is required');
    }
  }

  /**
   * Get npm package name with scope
   */
  private getPackageName(name: string, scope?: string): string {
    const sanitized = name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/^-+|-+$/g, '');

    return scope ? `${scope}/${sanitized}` : sanitized;
  }

  /**
   * Generate tsconfig.json
   */
  private generateTsConfig(tsVersion?: string): string {
    return JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          lib: ['ES2022'],
          outDir: './dist',
          rootDir: './src',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          resolveJsonModule: true,
          declaration: true,
          declarationMap: true,
          sourceMap: true,
          types: ['node'],
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist', 'tests'],
      },
      null,
      2
    );
  }

  /**
   * Generate README.md
   */
  private generateReadme(manifest: OssaAgent, packageName: string): string {
    const metadata = manifest.metadata || { name: 'agent', version: '1.0.0' };
    const spec = manifest.spec || {};

    return `# ${metadata.name}

${metadata.description || 'OSSA agent package'}

## Installation

\`\`\`bash
npm install ${packageName}
\`\`\`

## Usage

### Import the Agent

\`\`\`typescript
import { Agent } from '${packageName}';

const agent = new Agent();
const response = await agent.chat({ message: 'Hello!' });
console.log(response);
\`\`\`

### Run as Server

\`\`\`bash
npm start
\`\`\`

The server will start on port 3000 (configurable via PORT env var).

### API Endpoints

- \`POST /chat\` - Send message to agent
- \`GET /health\` - Health check
- \`GET /openapi\` - OpenAPI specification

See \`openapi.yaml\` for full API documentation.

## Configuration

Environment variables:

- \`PORT\` - Server port (default: 3000)
- \`LLM_API_KEY\` - API key for LLM provider
- \`LOG_LEVEL\` - Logging level (default: info)

## Development

\`\`\`bash
# Install dependencies
npm install

# Build
npm run build

# Run in development
npm run dev

# Run tests
npm test
\`\`\`

## Docker

\`\`\`bash
# Build image
docker build -t ${metadata.name} .

# Run container
docker-compose up
\`\`\`

## License

${metadata.license || 'MIT'}

## Generated from OSSA

This package was generated from OSSA v${manifest.apiVersion?.split('/')[1] || '0.4.0'} manifest.

- [OSSA Specification](https://openstandardagents.org)
- [Documentation](https://docs.openstandardagents.org)
`;
  }

  /**
   * Generate .gitignore
   */
  private generateGitIgnore(): string {
    return `# Dependencies
node_modules/

# Build output
dist/
build/
*.tsbuildinfo

# Tests
coverage/
.nyc_output/

# Logs
*.log
logs/

# Environment
.env
.env.local
.env.*.local

# IDEs
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Temp
*.tmp
.tmp/
`;
  }

  /**
   * Generate .npmignore
   */
  private generateNpmIgnore(): string {
    return `# Source files
src/
tests/
*.test.ts
*.spec.ts

# Config
tsconfig.json
.eslintrc.json
.prettierrc

# Docker
Dockerfile
docker-compose.yaml
.dockerignore

# CI/CD
.gitlab-ci.yml
.github/

# Development
coverage/
.nyc_output/
*.log

# Misc
.git/
.DS_Store
`;
  }

  /**
   * Generate Dockerfile
   */
  private generateDockerfile(nodeVersion?: string): string {
    const version = nodeVersion || '18-alpine';
    return `FROM node:${version}

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy built files
COPY dist/ ./dist/
COPY openapi.yaml ./

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "dist/server.js"]
`;
  }

  /**
   * Generate docker-compose.yaml
   */
  private generateDockerCompose(manifest: OssaAgent): string {
    const name = manifest.metadata?.name || 'agent';
    const sanitized = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    return `version: '3.8'

services:
  ${sanitized}:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - LLM_API_KEY=\${LLM_API_KEY}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
`;
  }

  /**
   * Generate test file
   */
  private generateTests(manifest: OssaAgent): string {
    const name = manifest.metadata?.name || 'Agent';
    return `import { describe, it, expect, beforeEach } from '@jest/globals';
import { Agent } from '../src/index.js';

describe('${name}', () => {
  let agent: Agent;

  beforeEach(() => {
    agent = new Agent();
  });

  it('should create agent instance', () => {
    expect(agent).toBeDefined();
  });

  it('should respond to chat', async () => {
    const response = await agent.chat({ message: 'Hello' });
    expect(response).toHaveProperty('message');
  });

  it('should have metadata', () => {
    const metadata = agent.getMetadata();
    expect(metadata).toHaveProperty('name');
    expect(metadata).toHaveProperty('version');
  });
});
`;
  }
}
