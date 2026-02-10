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
import { getApiVersion } from '../../../utils/version.js';

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

      // 13. CHANGELOG.md
      files.push({
        path: 'CHANGELOG.md',
        content: this.generateChangelog(manifest),
        type: 'documentation',
        language: 'markdown',
      });

      // 14. LICENSE
      files.push({
        path: 'LICENSE',
        content: this.generateLicense(manifest),
        type: 'documentation',
      });

      // 15. CONTRIBUTING.md
      files.push({
        path: 'CONTRIBUTING.md',
        content: this.generateContributing(manifest, packageName),
        type: 'documentation',
        language: 'markdown',
      });

      // 16. SECURITY.md
      files.push({
        path: 'SECURITY.md',
        content: this.generateSecurity(manifest),
        type: 'documentation',
        language: 'markdown',
      });

      // 17. API.md
      files.push({
        path: 'API.md',
        content: this.generateApiDocs(manifest),
        type: 'documentation',
        language: 'markdown',
      });

      // 18. Examples
      const examples = this.generateExamples(manifest, packageName);
      for (const [path, content] of Object.entries(examples)) {
        files.push({
          path: `examples/${path}`,
          content,
          type: 'documentation',
          language: path.endsWith('.ts') ? 'typescript' : 'markdown',
        });
      }

      // 19. Complete test suite
      if (options.includeTests) {
        const testSuite = this.generateCompletedTestSuite(manifest);
        for (const [path, content] of Object.entries(testSuite)) {
          files.push({
            path: `tests/${path}`,
            content,
            type: 'code',
            language: path.endsWith('.ts') ? 'typescript' : 'json',
          });
        }
      }

      // 20. Enhanced source structure
      const enhancedSource = this.generateEnhancedSource(manifest);
      for (const [path, content] of Object.entries(enhancedSource)) {
        files.push({
          path: `src/${path}`,
          content,
          type: 'code',
          language: 'typescript',
        });
      }

      // 21. Quality assurance files
      const qaFiles = this.generateQAFiles(options);
      for (const [path, content] of Object.entries(qaFiles)) {
        files.push({
          path,
          content,
          type: 'config',
          language: this.getLanguageFromPath(path),
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

This package was generated from OSSA v${manifest.apiVersion?.split('/')[1] || getApiVersion()} manifest.

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

  /**
   * Generate CHANGELOG.md
   */
  private generateChangelog(manifest: OssaAgent): string {
    const version = manifest.metadata?.version || '1.0.0';
    const date = new Date().toISOString().split('T')[0];

    return `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [${version}] - ${date}

### Added
- Initial release
- Agent implementation with TypeScript
- Express server with OpenAPI documentation
- Docker support
${manifest.spec?.tools ? `- ${manifest.spec.tools.length} tool(s) implementation` : ''}

### Changed
- N/A

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- N/A
`;
  }

  /**
   * Generate LICENSE file
   */
  private generateLicense(manifest: OssaAgent): string {
    const license = manifest.metadata?.license || 'MIT';
    const year = new Date().getFullYear();
    const author = manifest.metadata?.author || 'The Agent Developers';

    if (license === 'MIT') {
      return `MIT License

Copyright (c) ${year} ${author}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;
    } else if (license === 'Apache-2.0') {
      return `Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/

Copyright ${year} ${author}

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
`;
    }

    return `${license} License

Copyright (c) ${year} ${author}

All rights reserved.
`;
  }

  /**
   * Generate CONTRIBUTING.md
   */
  private generateContributing(
    manifest: OssaAgent,
    packageName: string
  ): string {
    return `# Contributing to ${manifest.metadata?.name || 'this project'}

Thank you for your interest in contributing! This document provides guidelines for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: \`git clone https://github.com/yourusername/${packageName}.git\`
3. Install dependencies: \`npm install\`
4. Create a branch: \`git checkout -b feature/your-feature-name\`

## Development Workflow

### Building

\`\`\`bash
npm run build
\`\`\`

### Testing

\`\`\`bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
\`\`\`

### Linting

\`\`\`bash
# Check for linting errors
npm run lint

# Auto-fix linting errors
npm run lint:fix
\`\`\`

### Code Style

This project uses:
- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety

Please ensure your code:
- Passes all linting checks
- Follows the existing code style
- Includes appropriate tests
- Has clear commit messages

## Pull Request Process

1. Update documentation if needed
2. Add tests for new functionality
3. Ensure all tests pass
4. Update CHANGELOG.md
5. Submit pull request with clear description

### Commit Messages

Follow conventional commits format:

- \`feat: Add new feature\`
- \`fix: Fix bug\`
- \`docs: Update documentation\`
- \`test: Add tests\`
- \`refactor: Refactor code\`
- \`chore: Update dependencies\`

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow project guidelines

## Questions?

Feel free to open an issue for questions or discussions.

## License

By contributing, you agree that your contributions will be licensed under the ${manifest.metadata?.license || 'MIT'} License.
`;
  }

  /**
   * Generate SECURITY.md
   */
  private generateSecurity(manifest: OssaAgent): string {
    return `# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| ${manifest.metadata?.version || '1.0.0'}   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it by:

1. **DO NOT** open a public issue
2. Email security contact (if provided in package.json)
3. Include detailed information:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Security Best Practices

When using this agent:

1. **API Keys**: Never commit API keys or secrets
2. **Environment Variables**: Use \`.env\` files (not committed)
3. **Input Validation**: Always validate user inputs
4. **Dependencies**: Keep dependencies up to date
5. **HTTPS**: Use HTTPS in production
6. **Rate Limiting**: Implement rate limiting for APIs
7. **Error Handling**: Don't expose sensitive information in errors

## Security Updates

Security updates are released as patch versions. Subscribe to releases to stay informed.

## Disclosure Policy

- Report received: We acknowledge within 48 hours
- Assessment: We assess the vulnerability
- Fix: We develop and test a fix
- Release: We release a security patch
- Disclosure: We publicly disclose after users have time to update

## Known Security Considerations

### LLM Security
- Input sanitization for prompts
- Output validation for responses
- Rate limiting for API calls
- Cost monitoring for API usage

### API Security
- Authentication required for sensitive endpoints
- Authorization checks for operations
- Input validation for all requests
- Rate limiting for abuse prevention

### Data Privacy
- No sensitive data in logs
- Secure storage for credentials
- Encryption in transit (HTTPS)
- Data retention policies

## Dependencies

We regularly audit dependencies for security vulnerabilities using:
- npm audit
- Snyk
- Dependabot

## Questions?

For security questions, contact the maintainers through secure channels.
`;
  }

  /**
   * Generate API.md documentation
   */
  private generateApiDocs(manifest: OssaAgent): string {
    const name = manifest.metadata?.name || 'Agent';
    const tools = manifest.spec?.tools || [];

    let toolsDocs = '';
    if (Array.isArray(tools) && tools.length > 0) {
      toolsDocs = `\n## Tools\n\n`;
      for (const tool of tools) {
        if (typeof tool === 'object' && tool !== null && 'name' in tool) {
          toolsDocs += `### ${tool.name}\n\n`;
          if ('description' in tool) {
            toolsDocs += `${tool.description}\n\n`;
          }
          if ('parameters' in tool) {
            toolsDocs += `**Parameters:**\n\n\`\`\`typescript\n${JSON.stringify(tool.parameters, null, 2)}\n\`\`\`\n\n`;
          }
        }
      }
    }

    return `# API Documentation

Complete API reference for ${name}.

## Table of Contents

- [Installation](#installation)
- [Agent Class](#agent-class)
- [Methods](#methods)
- [Types](#types)
${tools.length > 0 ? '- [Tools](#tools)' : ''}
- [Server API](#server-api)
- [Examples](#examples)

## Installation

\`\`\`bash
npm install ${manifest.metadata?.name || 'agent'}
\`\`\`

## Agent Class

### Constructor

\`\`\`typescript
import { Agent } from '${manifest.metadata?.name || 'agent'}';

const agent = new Agent(options?: AgentOptions);
\`\`\`

**AgentOptions:**

\`\`\`typescript
interface AgentOptions {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}
\`\`\`

## Methods

### chat()

Send a message to the agent and receive a response.

\`\`\`typescript
const response = await agent.chat(request: ChatRequest): Promise<ChatResponse>
\`\`\`

**Parameters:**

\`\`\`typescript
interface ChatRequest {
  message: string;
  context?: Record<string, any>;
  sessionId?: string;
}
\`\`\`

**Returns:**

\`\`\`typescript
interface ChatResponse {
  message: string;
  context?: Record<string, any>;
  metadata?: {
    model: string;
    tokens: number;
    duration: number;
  };
}
\`\`\`

**Example:**

\`\`\`typescript
const response = await agent.chat({
  message: 'Hello, how are you?',
  context: { user: 'john' }
});

console.log(response.message);
\`\`\`

### getMetadata()

Get agent metadata information.

\`\`\`typescript
const metadata = agent.getMetadata(): AgentMetadata
\`\`\`

**Returns:**

\`\`\`typescript
interface AgentMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
  license?: string;
}
\`\`\`

### getCapabilities()

Get agent capabilities and features.

\`\`\`typescript
const capabilities = agent.getCapabilities(): Capabilities
\`\`\`

**Returns:**

\`\`\`typescript
interface Capabilities {
  tools: string[];
  models: string[];
  features: string[];
}
\`\`\`

## Types

### ChatRequest

\`\`\`typescript
interface ChatRequest {
  message: string;
  context?: Record<string, any>;
  sessionId?: string;
}
\`\`\`

### ChatResponse

\`\`\`typescript
interface ChatResponse {
  message: string;
  context?: Record<string, any>;
  metadata?: ResponseMetadata;
}
\`\`\`

### AgentOptions

\`\`\`typescript
interface AgentOptions {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}
\`\`\`
${toolsDocs}
## Server API

When running as a server, the following REST endpoints are available:

### POST /chat

Send a message to the agent.

**Request:**

\`\`\`json
{
  "message": "Hello",
  "context": {},
  "sessionId": "optional-session-id"
}
\`\`\`

**Response:**

\`\`\`json
{
  "message": "Response from agent",
  "context": {},
  "metadata": {
    "model": "gpt-4",
    "tokens": 100,
    "duration": 500
  }
}
\`\`\`

### GET /health

Health check endpoint.

**Response:**

\`\`\`json
{
  "status": "ok",
  "uptime": 12345,
  "version": "1.0.0"
}
\`\`\`

### GET /openapi

Get OpenAPI specification.

**Response:**

Returns the OpenAPI 3.0 specification in YAML format.

## Examples

See the [examples](./examples/) directory for complete examples:

- [Basic Usage](./examples/basic-usage.ts)
- [With Tools](./examples/with-tools.ts)
- [With API](./examples/with-api.ts)
- [Advanced Usage](./examples/advanced.ts)

## Error Handling

All methods can throw errors. Always use try-catch:

\`\`\`typescript
try {
  const response = await agent.chat({ message: 'Hello' });
  console.log(response);
} catch (error) {
  console.error('Error:', error.message);
}
\`\`\`

## TypeScript Support

This package includes TypeScript definitions. Import types:

\`\`\`typescript
import type {
  ChatRequest,
  ChatResponse,
  AgentOptions
} from '${manifest.metadata?.name || 'agent'}';
\`\`\`

## Rate Limiting

The server includes rate limiting:
- 100 requests per 15 minutes per IP
- 429 status code when limit exceeded

## Environment Variables

- \`LLM_API_KEY\` - API key for LLM provider (required)
- \`PORT\` - Server port (default: 3000)
- \`LOG_LEVEL\` - Logging level (default: info)
- \`NODE_ENV\` - Environment (development/production)

## License

${manifest.metadata?.license || 'MIT'}
`;
  }

  /**
   * Generate examples
   */
  private generateExamples(
    manifest: OssaAgent,
    packageName: string
  ): Record<string, string> {
    return {
      'README.md': `# Examples

This directory contains examples for using ${manifest.metadata?.name || 'the agent'}.

## Available Examples

- [basic-usage.ts](./basic-usage.ts) - Simple usage example
- [with-tools.ts](./with-tools.ts) - Using agent tools
- [with-api.ts](./with-api.ts) - Using the REST API
- [advanced.ts](./advanced.ts) - Advanced features

## Running Examples

\`\`\`bash
# Install dependencies
npm install

# Run an example
npx tsx examples/basic-usage.ts
\`\`\`

## Environment Setup

Copy \`.env.example\` to \`.env\` and configure:

\`\`\`bash
LLM_API_KEY=your-api-key
\`\`\`
`,
      'basic-usage.ts': `/**
 * Basic Usage Example
 *
 * Demonstrates simple agent interaction
 */

import { Agent } from '${packageName}';

async function main() {
  // Create agent instance
  const agent = new Agent({
    apiKey: process.env.LLM_API_KEY,
  });

  // Send a message
  const response = await agent.chat({
    message: 'Hello! Can you help me?',
  });

  console.log('Agent response:', response.message);

  // Get agent metadata
  const metadata = agent.getMetadata();
  console.log('Agent info:', metadata);
}

main().catch(console.error);
`,
      'with-tools.ts': `/**
 * Tools Example
 *
 * Demonstrates using agent tools
 */

import { Agent } from '${packageName}';

async function main() {
  const agent = new Agent({
    apiKey: process.env.LLM_API_KEY,
  });

  // Get available capabilities
  const capabilities = agent.getCapabilities();
  console.log('Available tools:', capabilities.tools);

  // Use agent with tools
  const response = await agent.chat({
    message: 'Use your tools to help me',
    context: {
      enableTools: true,
    },
  });

  console.log('Response:', response.message);
  console.log('Metadata:', response.metadata);
}

main().catch(console.error);
`,
      'with-api.ts': `/**
 * REST API Example
 *
 * Demonstrates using the agent via REST API
 */

async function main() {
  const baseUrl = 'http://localhost:3000';

  // Health check
  const health = await fetch(\`\${baseUrl}/health\`);
  console.log('Health:', await health.json());

  // Chat with agent
  const response = await fetch(\`\${baseUrl}/chat\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'Hello from API!',
    }),
  });

  const data = await response.json();
  console.log('Response:', data);

  // Get OpenAPI spec
  const openapi = await fetch(\`\${baseUrl}/openapi\`);
  console.log('OpenAPI spec:', await openapi.text());
}

main().catch(console.error);
`,
      'advanced.ts': `/**
 * Advanced Usage Example
 *
 * Demonstrates advanced features
 */

import { Agent } from '${packageName}';

async function main() {
  const agent = new Agent({
    apiKey: process.env.LLM_API_KEY,
    temperature: 0.7,
    maxTokens: 1000,
  });

  // Multi-turn conversation with context
  let context = { conversationId: '123' };

  const turn1 = await agent.chat({
    message: 'Remember my name is Alice',
    context,
  });
  console.log('Turn 1:', turn1.message);
  context = turn1.context || context;

  const turn2 = await agent.chat({
    message: 'What is my name?',
    context,
  });
  console.log('Turn 2:', turn2.message);

  // Error handling
  try {
    await agent.chat({ message: '' });
  } catch (error) {
    console.error('Handled error:', error.message);
  }
}

main().catch(console.error);
`,
    };
  }

  /**
   * Generate complete test suite
   */
  private generateCompletedTestSuite(
    manifest: OssaAgent
  ): Record<string, string> {
    const name = manifest.metadata?.name || 'Agent';

    return {
      'unit/agent.test.ts': `import { describe, it, expect, beforeEach } from '@jest/globals';
import { Agent } from '../../src/index.js';

describe('${name} - Unit Tests', () => {
  let agent: Agent;

  beforeEach(() => {
    agent = new Agent();
  });

  describe('initialization', () => {
    it('should create agent instance', () => {
      expect(agent).toBeDefined();
      expect(agent).toBeInstanceOf(Agent);
    });

    it('should accept configuration options', () => {
      const customAgent = new Agent({
        apiKey: 'test-key',
        temperature: 0.5,
      });
      expect(customAgent).toBeDefined();
    });
  });

  describe('metadata', () => {
    it('should return agent metadata', () => {
      const metadata = agent.getMetadata();
      expect(metadata).toHaveProperty('name');
      expect(metadata).toHaveProperty('version');
      expect(metadata.name).toBe('${name}');
    });
  });

  describe('capabilities', () => {
    it('should return agent capabilities', () => {
      const capabilities = agent.getCapabilities();
      expect(capabilities).toHaveProperty('tools');
      expect(capabilities).toHaveProperty('models');
      expect(Array.isArray(capabilities.tools)).toBe(true);
    });
  });
});
`,
      'unit/tools.test.ts': `import { describe, it, expect } from '@jest/globals';

describe('Tools - Unit Tests', () => {
  it('should have tool implementations', () => {
    // Add tool-specific tests here
    expect(true).toBe(true);
  });
});
`,
      'integration/api.test.ts': `import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { Agent } from '../../src/index.js';

describe('API - Integration Tests', () => {
  let agent: Agent;

  beforeAll(() => {
    agent = new Agent();
  });

  afterAll(() => {
    // Cleanup
  });

  describe('chat', () => {
    it('should respond to messages', async () => {
      const response = await agent.chat({
        message: 'Hello',
      });

      expect(response).toHaveProperty('message');
      expect(typeof response.message).toBe('string');
    });

    it('should handle context', async () => {
      const response = await agent.chat({
        message: 'Test',
        context: { user: 'test' },
      });

      expect(response).toHaveProperty('context');
    });

    it('should handle errors gracefully', async () => {
      await expect(
        agent.chat({ message: '' })
      ).rejects.toThrow();
    });
  });
});
`,
      'e2e/workflow.test.ts': `import { describe, it, expect } from '@jest/globals';
import { Agent } from '../../src/index.js';

describe('Workflow - E2E Tests', () => {
  it('should complete full conversation workflow', async () => {
    const agent = new Agent();

    // Step 1: Initial message
    const response1 = await agent.chat({
      message: 'Start conversation',
    });
    expect(response1.message).toBeDefined();

    // Step 2: Follow-up
    const response2 = await agent.chat({
      message: 'Continue',
      context: response1.context,
    });
    expect(response2.message).toBeDefined();
  });
});
`,
      'fixtures/sample-data.json': JSON.stringify(
        {
          testMessages: [
            { message: 'Hello', expectedType: 'greeting' },
            { message: 'Help', expectedType: 'request' },
            { message: 'Thank you', expectedType: 'gratitude' },
          ],
          testContext: {
            user: 'test-user',
            session: 'test-session',
          },
        },
        null,
        2
      ),
      'setup.ts': `/**
 * Test Setup
 *
 * Global test configuration and utilities
 */

// Set test environment
process.env.NODE_ENV = 'test';

// Configure test timeout
jest.setTimeout(10000);

// Global setup
beforeAll(() => {
  // Setup code here
});

// Global teardown
afterAll(() => {
  // Cleanup code here
});

// Custom matchers
expect.extend({
  toBeValidResponse(received) {
    const pass =
      typeof received === 'object' &&
      'message' in received &&
      typeof received.message === 'string';

    return {
      pass,
      message: () =>
        pass
          ? 'Expected not to be valid response'
          : 'Expected to be valid response',
    };
  },
});
`,
    };
  }

  /**
   * Generate enhanced source structure
   */
  private generateEnhancedSource(manifest: OssaAgent): Record<string, string> {
    return {
      'agent.ts': `/**
 * Agent Implementation
 *
 * Main agent class implementation
 */

import type { ChatRequest, ChatResponse, AgentOptions, AgentMetadata, Capabilities } from './types.js';
import { Logger } from './utils/logger.js';
import { ValidationError } from './utils/errors.js';
import { validateChatRequest } from './utils/validation.js';
import { defaultConfig } from './config/defaults.js';

export class Agent {
  private config: Required<AgentOptions>;
  private logger: Logger;

  constructor(options: AgentOptions = {}) {
    this.config = { ...defaultConfig, ...options };
    this.logger = new Logger('Agent');
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    this.logger.debug('Chat request received', request);

    // Validate request
    const validation = validateChatRequest(request);
    if (!validation.valid) {
      throw new ValidationError(validation.error || 'Invalid request');
    }

    try {
      // Process request
      const response: ChatResponse = {
        message: \`Echo: \${request.message}\`,
        context: request.context,
        metadata: {
          model: this.config.model,
          tokens: 0,
          duration: 0,
        },
      };

      this.logger.debug('Chat response sent', response);
      return response;
    } catch (error) {
      this.logger.error('Chat error', error);
      throw error;
    }
  }

  getMetadata(): AgentMetadata {
    return {
      name: '${manifest.metadata?.name || 'agent'}',
      version: '${manifest.metadata?.version || '1.0.0'}',
      description: '${manifest.metadata?.description || 'OSSA agent'}',
      author: '${manifest.metadata?.author || 'Unknown'}',
      license: '${manifest.metadata?.license || 'MIT'}',
    };
  }

  getCapabilities(): Capabilities {
    return {
      tools: [],
      models: [this.config.model],
      features: ['chat', 'context'],
    };
  }
}
`,
      'utils/logger.ts': `/**
 * Logger Utility
 *
 * Structured logging for the agent
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
  constructor(private context: string) {}

  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  error(message: string, error?: any): void {
    this.log('error', message, error);
  }

  private log(level: LogLevel, message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      context: this.context,
      message,
      ...(data && { data }),
    };

    const logLevel = process.env.LOG_LEVEL || 'info';
    const levels = ['debug', 'info', 'warn', 'error'];

    if (levels.indexOf(level) >= levels.indexOf(logLevel as LogLevel)) {
      console[level === 'debug' ? 'log' : level](
        JSON.stringify(logData)
      );
    }
  }
}
`,
      'utils/errors.ts': `/**
 * Error Classes
 *
 * Custom error types for the agent
 */

export class AgentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AgentError';
  }
}

export class ValidationError extends AgentError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ConfigurationError extends AgentError {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export class ToolError extends AgentError {
  constructor(message: string) {
    super(message);
    this.name = 'ToolError';
  }
}
`,
      'utils/validation.ts': `/**
 * Validation Utilities
 *
 * Request and response validation
 */

import type { ChatRequest } from '../types.js';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateChatRequest(request: ChatRequest): ValidationResult {
  if (!request) {
    return { valid: false, error: 'Request is required' };
  }

  if (!request.message || typeof request.message !== 'string') {
    return { valid: false, error: 'Message is required and must be a string' };
  }

  if (request.message.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }

  if (request.context && typeof request.context !== 'object') {
    return { valid: false, error: 'Context must be an object' };
  }

  return { valid: true };
}
`,
      'config/defaults.ts': `/**
 * Default Configuration
 *
 * Default settings for the agent
 */

import type { AgentOptions } from '../types.js';

export const defaultConfig: Required<AgentOptions> = {
  apiKey: process.env.LLM_API_KEY || '',
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 2000,
};
`,
    };
  }

  /**
   * Generate quality assurance files
   */
  private generateQAFiles(options: NPMExportOptions): Record<string, string> {
    return {
      '.eslintrc.json': JSON.stringify(
        {
          extends: [
            'eslint:recommended',
            'plugin:@typescript-eslint/recommended',
            'prettier',
          ],
          parser: '@typescript-eslint/parser',
          parserOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            project: './tsconfig.json',
          },
          plugins: ['@typescript-eslint'],
          rules: {
            '@typescript-eslint/explicit-function-return-type': 'warn',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': [
              'error',
              { argsIgnorePattern: '^_' },
            ],
            'no-console': ['warn', { allow: ['warn', 'error'] }],
          },
          env: {
            node: true,
            es2022: true,
          },
        },
        null,
        2
      ),
      '.prettierrc': JSON.stringify(
        {
          semi: true,
          trailingComma: 'es5',
          singleQuote: true,
          printWidth: 80,
          tabWidth: 2,
          useTabs: false,
          arrowParens: 'always',
          endOfLine: 'lf',
        },
        null,
        2
      ),
      'jest.config.js': `export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  testMatch: ['**/tests/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};
`,
      '.editorconfig': `root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false

[*.json]
indent_size = 2

[*.{yml,yaml}]
indent_size = 2
`,
      '.nvmrc': options.nodeVersion || '18.0.0',
    };
  }

  /**
   * Get language from file path
   */
  private getLanguageFromPath(path: string): string | undefined {
    const ext = path.split('.').pop();
    const languageMap: Record<string, string> = {
      js: 'javascript',
      ts: 'typescript',
      json: 'json',
      yaml: 'yaml',
      yml: 'yaml',
      md: 'markdown',
    };
    return ext ? languageMap[ext] : undefined;
  }
}
