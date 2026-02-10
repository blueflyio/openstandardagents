/**
 * GitLab Duo Package Generator
 * Orchestrates complete GitLab Duo agent package generation from OSSA manifests
 *
 * Extends BasePackageGenerator for shared npm package logic
 *
 * Generates complete directory structure (30+ files):
 * {agent-name}-gitlab-duo/
 * ├── .gitlab/duo/
 * │   ├── flows/main.yaml, error.yaml, monitor.yaml, governance.yaml
 * │   ├── agents/{name}.yaml
 * │   ├── triggers/mention.yaml, assign.yaml, assign_reviewer.yaml,
 * │   │          schedule.yaml, pipeline.yaml, webhook.yaml, file_pattern.yaml
 * │   ├── routers/conditional.yaml, multi-agent.yaml
 * │   ├── mcp-config.yaml
 * │   ├── mcp-config.json
 * │   ├── custom-tools.json
 * │   └── AGENTS.md
 * ├── src/
 * ├── Dockerfile
 * ├── package.json
 * ├── README.md
 * ├── DEPLOYMENT.md
 * └── agent.ossa.yaml
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import YAML from 'yaml';
import type { OssaAgent } from '../../types/index.js';
import { BasePackageGenerator } from '../npm/package-generator.js';
import { GitLabDuoFlowGenerator } from './flow-generator.js';
import { ExternalAgentGenerator } from './external-agent-generator.js';
import { GitLabDuoTriggerGenerator } from './trigger-generator.js';
import { GitLabDuoRouterGenerator } from './router-generator.js';

export interface PackageGenerationOptions {
  /** Output directory for generated package */
  outputDir: string;
  /** Include source code templates */
  includeSourceTemplates?: boolean;
  /** Include Docker configuration */
  includeDocker?: boolean;
  /** Include CI/CD configuration */
  includeCI?: boolean;
  /** Overwrite existing files */
  overwrite?: boolean;
}

export interface PackageGenerationResult {
  success: boolean;
  packagePath?: string;
  generatedFiles?: string[];
  errors?: string[];
}

export interface GeneratedFile {
  path: string;
  content: string;
}

export class GitLabDuoPackageGenerator extends BasePackageGenerator {
  private flowGenerator: GitLabDuoFlowGenerator;
  private externalAgentGenerator: ExternalAgentGenerator;
  private triggerGenerator: GitLabDuoTriggerGenerator;
  private routerGenerator: GitLabDuoRouterGenerator;

  constructor() {
    super();
    this.flowGenerator = new GitLabDuoFlowGenerator();
    this.externalAgentGenerator = new ExternalAgentGenerator();
    this.triggerGenerator = new GitLabDuoTriggerGenerator();
    this.routerGenerator = new GitLabDuoRouterGenerator();
  }

  /**
   * Generate complete GitLab Duo agent package
   */
  async generate(
    manifest: OssaAgent,
    options: PackageGenerationOptions
  ): Promise<PackageGenerationResult> {
    const errors: string[] = [];

    try {
      // Validate manifest
      const validation = this.validateManifest(manifest);
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors,
        };
      }

      const agentName = this.getAgentName(manifest);
      const packagePath = path.join(
        options.outputDir,
        `${agentName}-gitlab-duo`
      );

      // Check if package already exists
      if (!options.overwrite) {
        try {
          await fs.access(packagePath);
          return {
            success: false,
            errors: [
              `Package directory already exists: ${packagePath}. Use overwrite option to replace.`,
            ],
          };
        } catch {
          // Directory doesn't exist, continue
        }
      }

      // Generate all files
      const files = await this.generateAllFiles(manifest, options);

      // Create directory structure and write files
      const generatedFiles = await this.writeFiles(packagePath, files);

      return {
        success: true,
        packagePath,
        generatedFiles,
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      return {
        success: false,
        errors,
      };
    }
  }

  /**
   * Validate manifest before generation
   */
  private validateManifest(manifest: OssaAgent): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!manifest.metadata?.name) {
      errors.push('Manifest must have metadata.name');
    }

    if (!manifest.spec) {
      errors.push('Manifest must have spec section');
    }

    if (!manifest.spec?.role) {
      errors.push('Manifest must have spec.role');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get sanitized agent name from manifest
   * Overrides base class to support legacy manifest.agent.name fallback
   */
  protected getAgentName(manifest: OssaAgent): string {
    const name = manifest.metadata?.name || manifest.agent?.name || 'agent';
    return this.sanitizePackageName(name);
  }

  /**
   * Generate all package files
   *
   * Generates a comprehensive GitLab Duo agent package:
   * - 4 flows (main, error, monitor, governance)
   * - 7 triggers (mention, assign, assign_reviewer, schedule, pipeline, webhook, file_pattern)
   * - 2 routers (conditional, multi-agent)
   * - 1 MCP config YAML
   * - Agent definition, tools, documentation, and deployment files
   */
  private async generateAllFiles(
    manifest: OssaAgent,
    options: PackageGenerationOptions
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    const agentName = this.getAgentName(manifest);

    // ── Flows (4 files) ──────────────────────────────────────
    const flowFiles = this.flowGenerator.generateAllFlowFiles(manifest);
    for (const [fileName, content] of flowFiles.entries()) {
      files.push({
        path: `.gitlab/duo/flows/${fileName}`,
        content,
      });
    }

    // ── External Agent YAML ──────────────────────────────────
    const externalAgentResult = this.externalAgentGenerator.generate(manifest);
    if (externalAgentResult.success && externalAgentResult.yaml) {
      files.push({
        path: `.gitlab/duo/agents/${agentName}.yaml`,
        content: externalAgentResult.yaml,
      });
    }

    // ── Triggers (7 files - all types) ───────────────────────
    const triggerFiles =
      this.triggerGenerator.generateAllTriggerFiles(manifest);
    for (const [fileName, content] of triggerFiles.entries()) {
      files.push({
        path: `.gitlab/duo/triggers/${fileName}`,
        content,
      });
    }

    // ── Routers (2 files) ────────────────────────────────────
    const routerFiles = this.routerGenerator.generateAllRouterFiles(manifest);
    for (const [fileName, content] of routerFiles.entries()) {
      files.push({
        path: `.gitlab/duo/routers/${fileName}`,
        content,
      });
    }

    // ── MCP Configuration (YAML) ─────────────────────────────
    files.push({
      path: `.gitlab/duo/mcp-config.yaml`,
      content: this.generateMCPConfigYAML(manifest),
    });

    // ── MCP Configuration (JSON - for tooling compatibility) ─
    files.push({
      path: `.gitlab/duo/mcp-config.json`,
      content: this.generateMCPConfig(manifest),
    });

    // ── Custom Tools Definition ──────────────────────────────
    files.push({
      path: `.gitlab/duo/custom-tools.json`,
      content: this.generateCustomTools(manifest),
    });

    // ── AGENTS.md ────────────────────────────────────────────
    files.push({
      path: `.gitlab/duo/AGENTS.md`,
      content: this.generateAgentsMd(manifest),
    });

    // ── OSSA manifest ────────────────────────────────────────
    files.push({
      path: 'agent.ossa.yaml',
      content: this.generateOssaManifest(manifest),
    });

    // ── Documentation ────────────────────────────────────────
    files.push({
      path: 'README.md',
      content: this.generateReadme(manifest),
    });

    files.push({
      path: 'DEPLOYMENT.md',
      content: this.generateDeploymentGuide(manifest),
    });

    files.push({
      path: 'SECURITY.md',
      content: this.generateSecurityGuide(manifest),
    });

    files.push({
      path: 'MONITORING.md',
      content: this.generateMonitoringGuide(manifest),
    });

    files.push({
      path: 'TROUBLESHOOTING.md',
      content: this.generateTroubleshootingGuide(manifest),
    });

    files.push({
      path: 'FAQ.md',
      content: this.generateFAQ(manifest),
    });

    files.push({
      path: 'ARCHITECTURE.md',
      content: this.generateArchitecture(manifest),
    });

    files.push({
      path: 'API.md',
      content: this.generateAPIDocumentation(manifest),
    });

    // ── package.json ─────────────────────────────────────────
    files.push({
      path: 'package.json',
      content: this.generatePackageJsonForManifest(manifest),
    });

    // ── Dockerfile (if enabled) ──────────────────────────────
    if (options.includeDocker !== false) {
      files.push({
        path: 'Dockerfile',
        content: this.generateDockerfile(manifest),
      });
    }

    // ── Source templates (if enabled) ────────────────────────
    if (options.includeSourceTemplates) {
      files.push(...this.generateSourceTemplates(manifest));
    }

    // ── CI/CD configuration (if enabled) ─────────────────────
    if (options.includeCI) {
      files.push({
        path: '.gitlab-ci.yml',
        content: this.generateGitLabCI(manifest),
      });
    }

    // ── .gitignore ───────────────────────────────────────────
    files.push({
      path: '.gitignore',
      content: this.generateGitignore(),
    });

    return files;
  }

  /**
   * Write files to disk
   */
  private async writeFiles(
    packagePath: string,
    files: GeneratedFile[]
  ): Promise<string[]> {
    const generatedPaths: string[] = [];

    for (const file of files) {
      const filePath = path.join(packagePath, file.path);
      const dir = path.dirname(filePath);

      // Create directory
      await fs.mkdir(dir, { recursive: true });

      // Write file
      await fs.writeFile(filePath, file.content, 'utf8');
      generatedPaths.push(file.path);
    }

    return generatedPaths;
  }

  /**
   * Generate AGENTS.md file
   */
  private generateAgentsMd(manifest: OssaAgent): string {
    const agentName = manifest.metadata?.name || 'Agent';
    const description = manifest.metadata?.description || '';
    const role = manifest.spec?.role || '';

    const lines: string[] = [];

    lines.push(`# ${agentName}`);
    lines.push('');
    lines.push(description);
    lines.push('');
    lines.push('## Role');
    lines.push('');
    lines.push(role);
    lines.push('');

    // Add capabilities section
    const tools = manifest.spec?.tools || [];
    if (tools.length > 0) {
      lines.push('## Capabilities');
      lines.push('');
      lines.push('This agent has access to the following tools:');
      lines.push('');
      for (const tool of tools) {
        const toolObj = tool as {
          name?: string;
          description?: string;
          type?: string;
        };
        lines.push(
          `- **${toolObj.name || toolObj.type}**: ${toolObj.description || 'No description'}`
        );
      }
      lines.push('');
    }

    // Add usage section
    lines.push('## Usage');
    lines.push('');
    lines.push('### Trigger Agent');
    lines.push('');
    lines.push('```bash');
    lines.push(`glab duo agent trigger ${this.getAgentName(manifest)}`);
    lines.push('```');
    lines.push('');

    // Add configuration section
    lines.push('## Configuration');
    lines.push('');
    lines.push('### Environment Variables');
    lines.push('');

    const externalAgentResult = this.externalAgentGenerator.generate(manifest);
    if (externalAgentResult.success && externalAgentResult.config) {
      for (const variable of externalAgentResult.config.variables) {
        lines.push(`- \`${variable}\``);
      }
    }
    lines.push('');

    // Add LLM configuration
    const llm = manifest.spec?.llm;
    if (llm) {
      lines.push('### LLM Configuration');
      lines.push('');
      const llmConfig = llm as {
        provider?: string;
        model?: string;
        temperature?: number;
        maxTokens?: number;
      };
      lines.push(`- **Provider**: ${llmConfig.provider || 'Not specified'}`);
      lines.push(`- **Model**: ${llmConfig.model || 'Not specified'}`);
      if (llmConfig.temperature !== undefined) {
        lines.push(`- **Temperature**: ${llmConfig.temperature}`);
      }
      if (llmConfig.maxTokens) {
        lines.push(`- **Max Tokens**: ${llmConfig.maxTokens}`);
      }
      lines.push('');
    }

    // Add deployment section
    lines.push('## Deployment');
    lines.push('');
    lines.push(
      'See [DEPLOYMENT.md](../../../DEPLOYMENT.md) for detailed deployment instructions.'
    );
    lines.push('');

    // Add documentation link
    lines.push('## Documentation');
    lines.push('');
    lines.push(
      '- [GitLab Duo Documentation](https://docs.gitlab.com/ee/user/gitlab_duo/)'
    );
    lines.push('- [OSSA Specification](https://github.com/bluefly-io/ossa)');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Generate OSSA manifest YAML
   */
  private generateOssaManifest(manifest: OssaAgent): string {
    return JSON.stringify(manifest, null, 2);
  }

  /**
   * Generate README.md
   */
  private generateReadme(manifest: OssaAgent): string {
    const agentName = manifest.metadata?.name || 'Agent';
    const description = manifest.metadata?.description || '';
    const version = manifest.metadata?.version || '1.0.0';

    const lines: string[] = [];

    lines.push(`# ${agentName}`);
    lines.push('');
    lines.push(`> ${description}`);
    lines.push('');
    lines.push(`**Version**: ${version}`);
    lines.push('');

    lines.push('## Overview');
    lines.push('');
    lines.push(
      'This is a GitLab Duo agent generated from an OSSA manifest. It integrates with GitLab Duo AI Gateway and can be deployed as a Flow or External Agent.'
    );
    lines.push('');

    lines.push('## Quick Start');
    lines.push('');
    lines.push('### Prerequisites');
    lines.push('');
    lines.push('- GitLab account with Duo access');
    lines.push('- `glab` CLI installed');
    lines.push('- Docker (for local testing)');
    lines.push('');

    lines.push('### Install Dependencies');
    lines.push('');
    lines.push('```bash');
    lines.push('npm install');
    lines.push('```');
    lines.push('');

    lines.push('### Build');
    lines.push('');
    lines.push('```bash');
    lines.push('npm run build');
    lines.push('```');
    lines.push('');

    lines.push('### Deploy');
    lines.push('');
    lines.push(
      'See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment instructions.'
    );
    lines.push('');

    lines.push('## Directory Structure');
    lines.push('');
    lines.push('```');
    lines.push('.gitlab/duo/');
    lines.push('  flows/');
    lines.push('    main.yaml                   # Primary agent flow');
    lines.push(
      '    error.yaml                  # Error handling with retry logic'
    );
    lines.push(
      '    monitor.yaml                # Monitoring and observability'
    );
    lines.push(
      '    governance.yaml             # Compliance and policy checks'
    );
    lines.push(
      `  agents/${this.getAgentName(manifest)}.yaml    # External Agent configuration`
    );
    lines.push('  triggers/');
    lines.push('    mention.yaml                # @agent mention triggers');
    lines.push(
      '    assign.yaml                 # Issue/MR assignment triggers'
    );
    lines.push(
      '    assign_reviewer.yaml        # MR reviewer assignment triggers'
    );
    lines.push(
      '    schedule.yaml               # Cron-based scheduled triggers'
    );
    lines.push('    pipeline.yaml               # CI/CD pipeline triggers');
    lines.push('    webhook.yaml                # External webhook triggers');
    lines.push(
      '    file_pattern.yaml           # File change pattern triggers'
    );
    lines.push('  routers/');
    lines.push('    conditional.yaml            # Conditional routing logic');
    lines.push('    multi-agent.yaml            # Multi-agent orchestration');
    lines.push(
      '  mcp-config.yaml               # MCP server configuration (YAML)'
    );
    lines.push(
      '  mcp-config.json               # MCP server configuration (JSON)'
    );
    lines.push('  custom-tools.json             # Custom tool definitions');
    lines.push('  AGENTS.md                     # Agent documentation');
    lines.push('src/                            # Source code');
    lines.push('agent.ossa.yaml                 # OSSA manifest');
    lines.push('package.json                    # Node.js dependencies');
    lines.push('Dockerfile                      # Container image');
    lines.push('```');
    lines.push('');

    lines.push('## Documentation');
    lines.push('');
    lines.push(
      '- [AGENTS.md](./.gitlab/duo/AGENTS.md) - Agent capabilities and usage'
    );
    lines.push('- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide');
    lines.push(
      '- [GitLab Duo Documentation](https://docs.gitlab.com/ee/user/gitlab_duo/)'
    );
    lines.push('');

    lines.push('## License');
    lines.push('');
    lines.push(manifest.metadata?.license || 'MIT');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Generate DEPLOYMENT.md
   */
  private generateDeploymentGuide(manifest: OssaAgent): string {
    const agentName = this.getAgentName(manifest);

    const lines: string[] = [];

    lines.push('# Deployment Guide');
    lines.push('');
    lines.push(
      `This guide explains how to deploy the **${manifest.metadata?.name || 'Agent'}** to GitLab Duo.`
    );
    lines.push('');

    lines.push('## Deployment Options');
    lines.push('');
    lines.push('This agent supports two deployment modes:');
    lines.push('');
    lines.push(
      '1. **Flow Agent** - Runs within GitLab Duo infrastructure (recommended)'
    );
    lines.push('2. **External Agent** - Runs in your GitLab CI/CD pipeline');
    lines.push('');

    lines.push('## Option 1: Flow Agent (Recommended)');
    lines.push('');
    lines.push('### Register Flow');
    lines.push('');
    lines.push('```bash');
    lines.push(`glab duo flow register .gitlab/duo/flows/${agentName}.yaml`);
    lines.push('```');
    lines.push('');

    lines.push('### Test Flow');
    lines.push('');
    lines.push('```bash');
    lines.push(`glab duo flow test ${agentName}`);
    lines.push('```');
    lines.push('');

    lines.push('### Deploy Flow');
    lines.push('');
    lines.push('```bash');
    lines.push(`glab duo flow deploy ${agentName}`);
    lines.push('```');
    lines.push('');

    lines.push('## Option 2: External Agent');
    lines.push('');
    lines.push('### Build Container Image');
    lines.push('');
    lines.push('```bash');
    lines.push(
      'docker build -t registry.gitlab.com/<namespace>/<project>/<agent>:latest .'
    );
    lines.push(
      'docker push registry.gitlab.com/<namespace>/<project>/<agent>:latest'
    );
    lines.push('```');
    lines.push('');

    lines.push('### Register External Agent');
    lines.push('');
    lines.push('```bash');
    lines.push(
      `glab duo agent register external .gitlab/duo/agents/${agentName}.yaml`
    );
    lines.push('```');
    lines.push('');

    lines.push('### Test External Agent');
    lines.push('');
    lines.push('```bash');
    lines.push(`glab duo agent test ${agentName}`);
    lines.push('```');
    lines.push('');

    lines.push('## Environment Variables');
    lines.push('');
    lines.push('Required environment variables:');
    lines.push('');

    const externalAgentResult = this.externalAgentGenerator.generate(manifest);
    if (externalAgentResult.success && externalAgentResult.config) {
      for (const variable of externalAgentResult.config.variables) {
        lines.push(`- \`${variable}\``);
      }
    }
    lines.push('');

    lines.push('Set these in your GitLab project:');
    lines.push('');
    lines.push('```bash');
    lines.push('glab variable set GITLAB_TOKEN <your-token>');
    lines.push('glab variable set AI_GATEWAY_TOKEN <gateway-token>');
    lines.push('```');
    lines.push('');

    lines.push('## Monitoring');
    lines.push('');
    lines.push('### View Agent Logs');
    lines.push('');
    lines.push('```bash');
    lines.push(`glab duo agent logs ${agentName}`);
    lines.push('```');
    lines.push('');

    lines.push('### Check Agent Status');
    lines.push('');
    lines.push('```bash');
    lines.push(`glab duo agent status ${agentName}`);
    lines.push('```');
    lines.push('');

    lines.push('## Troubleshooting');
    lines.push('');
    lines.push('### Agent Not Responding');
    lines.push('');
    lines.push('1. Check agent logs for errors');
    lines.push('2. Verify environment variables are set correctly');
    lines.push('3. Ensure AI Gateway token is valid');
    lines.push('');

    lines.push('### Authentication Errors');
    lines.push('');
    lines.push('1. Verify `GITLAB_TOKEN` has correct permissions');
    lines.push('2. Check token expiration');
    lines.push('3. Ensure token has `api` and `read_repository` scopes');
    lines.push('');

    lines.push('## Documentation');
    lines.push('');
    lines.push(
      '- [GitLab Duo Flows](https://docs.gitlab.com/ee/user/gitlab_duo/flows.html)'
    );
    lines.push(
      '- [GitLab Duo External Agents](https://docs.gitlab.com/ee/user/gitlab_duo/external_agents.html)'
    );
    lines.push(
      '- [AI Gateway Documentation](https://docs.gitlab.com/ee/architecture/blueprints/ai_gateway/)'
    );
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Generate package.json
   */
  /**
   * Generate GitLab Duo package.json
   * Uses base class generatePackageJson with GitLab-specific configuration
   */
  private generatePackageJsonForManifest(manifest: OssaAgent): string {
    return super.generatePackageJson({
      scope: '@gitlab-duo',
      name: this.getAgentName(manifest),
      version: this.getAgentVersion(manifest),
      description: this.getAgentDescription(manifest),
      type: 'module',
      main: './dist/index.js',
      types: './dist/index.d.ts',
      scripts: {
        build: 'tsc',
        dev: 'tsc --watch',
        test: 'node --test',
        lint: 'eslint src/',
        'lint:fix': 'eslint src/ --fix',
        clean: 'rm -rf dist/',
      },
      dependencies: {
        '@gitlab/duo': '^0.1.0',
        '@gitbeaker/rest': '^41.0.0',
      },
      devDependencies: {
        '@types/node': '^22.0.0',
        typescript: '^5.7.0',
        eslint: '^9.0.0',
      },
      engines: {
        node: '>=22.0.0',
      },
      keywords: ['gitlab-duo', 'ai-agent', 'ossa'],
      author: this.getAgentAuthor(manifest),
      license: this.getAgentLicense(manifest),
    });
  }

  /**
   * Generate Dockerfile
   */
  private generateDockerfile(manifest: OssaAgent): string {
    const lines: string[] = [];

    // Determine base image
    const externalAgentResult = this.externalAgentGenerator.generate(manifest);
    const baseImage = externalAgentResult.config?.image || 'node:22-slim';

    lines.push(`FROM ${baseImage}`);
    lines.push('');
    lines.push('WORKDIR /app');
    lines.push('');

    if (baseImage.startsWith('node:')) {
      lines.push('# Install dependencies');
      lines.push('COPY package*.json ./');
      lines.push('RUN npm ci --only=production');
      lines.push('');
      lines.push('# Copy source');
      lines.push('COPY . .');
      lines.push('');
      lines.push('# Build');
      lines.push('RUN npm run build');
      lines.push('');
      lines.push('# Run');
      lines.push('CMD ["node", "dist/index.js"]');
    } else if (baseImage.startsWith('python:')) {
      lines.push('# Install dependencies');
      lines.push('COPY requirements.txt ./');
      lines.push('RUN pip install --no-cache-dir -r requirements.txt');
      lines.push('');
      lines.push('# Copy source');
      lines.push('COPY . .');
      lines.push('');
      lines.push('# Run');
      lines.push('CMD ["python", "main.py"]');
    } else {
      lines.push('# Copy source');
      lines.push('COPY . .');
      lines.push('');
      lines.push('# Run');
      lines.push('CMD ["./run.sh"]');
    }

    return lines.join('\n');
  }

  /**
   * Generate source templates
   */
  private generateSourceTemplates(manifest: OssaAgent): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    // Generate index.ts
    files.push({
      path: 'src/index.ts',
      content: this.generateIndexTemplate(manifest),
    });

    // Generate agent.ts
    files.push({
      path: 'src/agent.ts',
      content: this.generateAgentTemplate(manifest),
    });

    // Generate tsconfig.json
    files.push({
      path: 'tsconfig.json',
      content: this.generateTsConfig(),
    });

    return files;
  }

  /**
   * Generate index.ts template
   */
  private generateIndexTemplate(manifest: OssaAgent): string {
    const lines: string[] = [];

    lines.push('/**');
    lines.push(` * ${manifest.metadata?.name || 'Agent'}`);
    lines.push(` * ${manifest.metadata?.description || ''}`);
    lines.push(' */');
    lines.push('');
    lines.push("import { Agent } from './agent.js';");
    lines.push('');
    lines.push('const agent = new Agent();');
    lines.push('');
    lines.push('// Start agent');
    lines.push('agent.start().catch((error) => {');
    lines.push('  console.error("Agent failed to start:", error);');
    lines.push('  process.exit(1);');
    lines.push('});');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Generate agent.ts template
   */
  private generateAgentTemplate(manifest: OssaAgent): string {
    const role = manifest.spec?.role || 'You are a helpful AI assistant';

    const lines: string[] = [];

    lines.push('/**');
    lines.push(' * Agent implementation');
    lines.push(' */');
    lines.push('');
    lines.push('export class Agent {');
    lines.push('  private role: string;');
    lines.push('');
    lines.push('  constructor() {');
    lines.push(`    this.role = \`${role}\`;`);
    lines.push('  }');
    lines.push('');
    lines.push('  async start(): Promise<void> {');
    lines.push('    console.log("Agent starting...");');
    lines.push('    console.log("Role:", this.role);');
    lines.push('');
    lines.push('    // Get input from environment');
    lines.push('    const input = process.env.AI_FLOW_INPUT || "Hello";');
    lines.push('');
    lines.push('    // Process input');
    lines.push('    const response = await this.process(input);');
    lines.push('');
    lines.push('    // Output response');
    lines.push('    console.log("Response:", response);');
    lines.push('  }');
    lines.push('');
    lines.push('  async process(input: string): Promise<string> {');
    lines.push('    // TODO: Implement agent logic');
    lines.push('    return `Processed: ${input}`;');
    lines.push('  }');
    lines.push('}');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Generate tsconfig.json
   */
  /**
   * Generate TypeScript configuration
   * Uses base class implementation
   */
  protected generateTsConfig(): string {
    return super.generateTsConfig();
  }

  /**
   * Generate GitLab CI configuration
   */
  private generateGitLabCI(manifest: OssaAgent): string {
    const agentName = this.getAgentName(manifest);

    const lines: string[] = [];

    lines.push('# GitLab CI/CD Configuration');
    lines.push(`# Agent: ${manifest.metadata?.name || 'Agent'}`);
    lines.push('');

    lines.push('stages:');
    lines.push('  - build');
    lines.push('  - test');
    lines.push('  - deploy');
    lines.push('');

    lines.push('build:');
    lines.push('  stage: build');
    lines.push('  image: node:22-slim');
    lines.push('  script:');
    lines.push('    - npm ci');
    lines.push('    - npm run build');
    lines.push('  artifacts:');
    lines.push('    paths:');
    lines.push('      - dist/');
    lines.push('');

    lines.push('test:');
    lines.push('  stage: test');
    lines.push('  image: node:22-slim');
    lines.push('  script:');
    lines.push('    - npm ci');
    lines.push('    - npm test');
    lines.push('');

    lines.push('deploy:');
    lines.push('  stage: deploy');
    lines.push('  image: node:22-slim');
    lines.push('  script:');
    lines.push('    - npm ci');
    lines.push('    - npm run build');
    lines.push(`    - glab duo flow deploy ${agentName}`);
    lines.push('  only:');
    lines.push('    - main');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Generate .gitignore
   * Uses base class implementation
   */
  protected generateGitignore(): string {
    return super.generateGitignore();
  }

  /**
   * Generate MCP Configuration
   */
  private generateMCPConfig(manifest: OssaAgent): string {
    const spec = manifest.spec as Record<string, unknown>;
    const tools = (spec.tools as Array<{ name?: string; type?: string }>) || [];

    const mcpServers: Record<string, unknown> = {};

    // Map OSSA tools to MCP servers
    for (const tool of tools) {
      const toolName = tool.name || tool.type || 'unknown';

      if (toolName.includes('gitlab')) {
        mcpServers['gitlab'] = {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-gitlab'],
          env: {
            GITLAB_TOKEN: '${GITLAB_TOKEN}',
            GITLAB_URL: 'https://gitlab.com',
          },
        };
      } else if (
        toolName.includes('file') ||
        toolName.includes('read') ||
        toolName.includes('write')
      ) {
        mcpServers['filesystem'] = {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-filesystem', '/workspace'],
        };
      } else if (toolName.includes('search')) {
        mcpServers['ripgrep'] = {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-ripgrep', '/workspace'],
        };
      }
    }

    // Always include memory server
    mcpServers['memory'] = {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-memory'],
    };

    const config = {
      mcpServers,
      version: '1.0.0',
      description: `MCP configuration for ${manifest.metadata?.name || 'agent'}`,
    };

    return JSON.stringify(config, null, 2);
  }

  /**
   * Generate MCP Configuration as YAML.
   * Provides a structured, human-readable MCP server configuration
   * with detailed comments for each server and its purpose.
   */
  private generateMCPConfigYAML(manifest: OssaAgent): string {
    const spec = manifest.spec as Record<string, unknown>;
    const tools =
      (spec.tools as Array<{
        name?: string;
        type?: string;
        description?: string;
      }>) || [];
    const agentName = manifest.metadata?.name || 'agent';

    const mcpServers: Record<string, unknown> = {};

    // Map OSSA tools to MCP servers
    for (const tool of tools) {
      const toolName = tool.name || tool.type || 'unknown';

      if (toolName.includes('gitlab')) {
        mcpServers['gitlab'] = {
          description:
            'GitLab API operations (issues, MRs, comments, repository files)',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-gitlab'],
          env: {
            GITLAB_TOKEN: '${GITLAB_TOKEN}',
            GITLAB_URL: '${GITLAB_URL:-https://gitlab.com}',
          },
          capabilities: [
            'issues',
            'merge_requests',
            'comments',
            'repository_files',
            'pipelines',
          ],
        };
      } else if (
        toolName.includes('file') ||
        toolName.includes('read') ||
        toolName.includes('write')
      ) {
        mcpServers['filesystem'] = {
          description: 'File system operations (read, write, list, search)',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-filesystem', '/workspace'],
          capabilities: [
            'read_file',
            'create_file_with_contents',
            'update_file',
            'list_dir',
          ],
        };
      } else if (toolName.includes('search')) {
        mcpServers['ripgrep'] = {
          description:
            'Code search using ripgrep for fast file content searching',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-ripgrep', '/workspace'],
          capabilities: ['search_files', 'regex_search'],
        };
      }
    }

    // Always include memory server
    mcpServers['memory'] = {
      description:
        'Persistent memory across agent sessions for context retention',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-memory'],
      capabilities: ['store', 'retrieve', 'delete', 'list_memories'],
    };

    // Always include fetch server for external data
    mcpServers['fetch'] = {
      description:
        'HTTP fetch for retrieving external documentation and API data',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-fetch'],
      capabilities: ['fetch_url', 'parse_html', 'extract_text'],
    };

    const config = {
      version: 'v1',
      agent_name: agentName,
      description: `MCP server configuration for ${agentName}. Defines the external tool servers that the agent can use during execution.`,
      servers: mcpServers,
      settings: {
        startup_timeout_seconds: 30,
        request_timeout_seconds: 60,
        max_concurrent_servers: 5,
        restart_on_failure: true,
        log_level: 'info',
      },
      security: {
        allowed_hosts: ['gitlab.com', '*.gitlab.com', 'ai-gateway.gitlab.com'],
        deny_shell_execution: true,
        max_file_size_bytes: 10_485_760,
        workspace_root: '/workspace',
      },
    };

    return YAML.stringify(config, { indent: 2, lineWidth: 0 });
  }

  /**
   * Generate Custom Tools Definition
   */
  private generateCustomTools(manifest: OssaAgent): string {
    const spec = manifest.spec as Record<string, unknown>;
    const tools =
      (spec.tools as Array<{
        name?: string;
        description?: string;
        parameters?: Record<string, unknown>;
      }>) || [];

    const customTools = tools.map((tool) => ({
      name: tool.name || 'custom_tool',
      description: tool.description || 'Custom tool implementation',
      input_schema: {
        type: 'object',
        properties: tool.parameters || {},
        required: Object.keys(tool.parameters || {}),
      },
    }));

    const config = {
      tools: customTools,
      version: '1.0.0',
    };

    return JSON.stringify(config, null, 2);
  }

  /**
   * Generate SECURITY.md
   */
  private generateSecurityGuide(manifest: OssaAgent): string {
    const agentName = manifest.metadata?.name || 'Agent';
    const lines: string[] = [];

    lines.push(`# Security Guide: ${agentName}`);
    lines.push('');
    lines.push('## Overview');
    lines.push('');
    lines.push(
      'This document outlines security considerations, best practices, and procedures for deploying and operating this GitLab Duo agent.'
    );
    lines.push('');

    lines.push('## Authentication & Authorization');
    lines.push('');
    lines.push('### GitLab Token Management');
    lines.push('');
    lines.push('**Required Scopes:**');
    lines.push('- `api` - Full API access');
    lines.push('- `read_repository` - Read repository data');
    lines.push(
      '- `write_repository` - Write repository data (if agent modifies files)'
    );
    lines.push('');
    lines.push('**Token Storage:**');
    lines.push('- Store tokens as GitLab CI/CD variables (masked)');
    lines.push('- Use environment-specific tokens (dev/staging/prod)');
    lines.push('- Rotate tokens every 90 days');
    lines.push('');
    lines.push('```bash');
    lines.push('# Set token as masked variable');
    lines.push('glab variable set GITLAB_TOKEN <token> --masked');
    lines.push('```');
    lines.push('');

    lines.push('### AI Gateway Token');
    lines.push('');
    lines.push('- Never commit AI Gateway tokens to repository');
    lines.push('- Use GitLab CI/CD variables with `protected` flag');
    lines.push('- Limit token scope to specific agent');
    lines.push('');

    lines.push('## Access Controls');
    lines.push('');
    lines.push('### Trigger Permissions');
    lines.push('');
    lines.push('Ensure triggers have appropriate permissions:');
    lines.push('');
    lines.push('- **@mentions**: Minimum `Reporter` role');
    lines.push('- **Assignments**: Minimum `Developer` role');
    lines.push('- **Webhooks**: Token-based authentication required');
    lines.push('- **Scheduled**: Runs as project bot account');
    lines.push('');

    lines.push('### Tool Access');
    lines.push('');
    lines.push('Restrict tool capabilities based on environment:');
    lines.push('');
    lines.push(
      '- **Read-only tools**: `read_file`, `list_dir`, `search_files`'
    );
    lines.push(
      '- **Write tools**: `create_file`, `update_file` (production only)'
    );
    lines.push(
      '- **Shell execution**: Disabled by default, enable with caution'
    );
    lines.push('');

    lines.push('## Data Protection');
    lines.push('');
    lines.push('### Sensitive Data Handling');
    lines.push('');
    lines.push('- Never log sensitive data (tokens, passwords, API keys)');
    lines.push('- Redact sensitive patterns in output');
    lines.push("- Use GitLab's built-in secret detection");
    lines.push('');
    lines.push('### Data Retention');
    lines.push('');
    lines.push('- Agent logs retained for 30 days');
    lines.push('- Conversation history cleared after session');
    lines.push('- PII redacted before storage');
    lines.push('');

    lines.push('## Network Security');
    lines.push('');
    lines.push('### Outbound Connections');
    lines.push('');
    lines.push('Agent makes connections to:');
    lines.push('');
    lines.push('- `gitlab.com` (API)');
    lines.push('- `ai-gateway.gitlab.com` (AI Gateway)');
    lines.push('- MCP servers (as configured)');
    lines.push('');
    lines.push('### Inbound Webhooks');
    lines.push('');
    lines.push('If webhook triggers enabled:');
    lines.push('');
    lines.push('- Validate webhook signatures');
    lines.push('- Rate limit webhook endpoints');
    lines.push('- Use HTTPS only');
    lines.push('');

    lines.push('## Vulnerability Management');
    lines.push('');
    lines.push('### Dependency Scanning');
    lines.push('');
    lines.push('```bash');
    lines.push('# Run dependency audit');
    lines.push('npm audit');
    lines.push('');
    lines.push('# Fix vulnerabilities');
    lines.push('npm audit fix');
    lines.push('```');
    lines.push('');

    lines.push('### Container Security');
    lines.push('');
    lines.push('- Use minimal base images (node:22-slim)');
    lines.push('- Scan container images for vulnerabilities');
    lines.push('- Update base images monthly');
    lines.push('');

    lines.push('## Incident Response');
    lines.push('');
    lines.push('### Security Incident');
    lines.push('');
    lines.push('1. **Disable agent** - Stop all triggers');
    lines.push('2. **Rotate tokens** - Invalidate compromised credentials');
    lines.push('3. **Review logs** - Check for unauthorized access');
    lines.push('4. **Notify stakeholders** - Report incident per policy');
    lines.push('');

    lines.push('### Token Compromise');
    lines.push('');
    lines.push('```bash');
    lines.push('# Revoke token immediately');
    lines.push('glab token revoke <token-id>');
    lines.push('');
    lines.push('# Generate new token');
    lines.push('glab token create --scopes api,read_repository');
    lines.push('');
    lines.push('# Update CI/CD variable');
    lines.push('glab variable update GITLAB_TOKEN <new-token> --masked');
    lines.push('```');
    lines.push('');

    lines.push('## Compliance');
    lines.push('');
    lines.push('### Audit Logging');
    lines.push('');
    lines.push('All agent actions are logged:');
    lines.push('');
    lines.push('- Trigger events');
    lines.push('- Tool executions');
    lines.push('- API calls');
    lines.push('- Errors and exceptions');
    lines.push('');

    lines.push('### Data Privacy (GDPR/CCPA)');
    lines.push('');
    lines.push('- PII detection and redaction enabled');
    lines.push('- Data retention policy: 30 days');
    lines.push('- Right to deletion supported');
    lines.push('');

    lines.push('## Security Checklist');
    lines.push('');
    lines.push('- [ ] GitLab tokens stored as masked CI/CD variables');
    lines.push('- [ ] AI Gateway token protected and scoped');
    lines.push('- [ ] Trigger permissions configured correctly');
    lines.push('- [ ] Tool access restricted to minimum required');
    lines.push('- [ ] Sensitive data logging disabled');
    lines.push('- [ ] Dependency scanning enabled in CI/CD');
    lines.push('- [ ] Container image scanning configured');
    lines.push('- [ ] Webhook authentication configured');
    lines.push('- [ ] Incident response plan documented');
    lines.push('- [ ] Token rotation schedule established');
    lines.push('');

    lines.push('## References');
    lines.push('');
    lines.push(
      '- [GitLab Security Best Practices](https://docs.gitlab.com/ee/security/)'
    );
    lines.push(
      '- [GitLab Duo Security](https://docs.gitlab.com/ee/user/gitlab_duo/security.html)'
    );
    lines.push(
      '- [AI Gateway Security](https://docs.gitlab.com/ee/architecture/blueprints/ai_gateway/security.html)'
    );
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Generate MONITORING.md
   */
  private generateMonitoringGuide(manifest: OssaAgent): string {
    const agentName = this.getAgentName(manifest);
    const lines: string[] = [];

    lines.push(`# Monitoring Guide: ${manifest.metadata?.name || 'Agent'}`);
    lines.push('');
    lines.push('## Overview');
    lines.push('');
    lines.push(
      'This guide covers monitoring, observability, and performance tracking for this GitLab Duo agent.'
    );
    lines.push('');

    lines.push('## Metrics');
    lines.push('');
    lines.push('### Key Performance Indicators (KPIs)');
    lines.push('');
    lines.push('| Metric | Description | Target |');
    lines.push('|--------|-------------|--------|');
    lines.push(
      '| Response Time | Time from trigger to first response | < 5s |'
    );
    lines.push(
      '| Success Rate | Percentage of successful executions | > 95% |'
    );
    lines.push('| Error Rate | Percentage of failed executions | < 5% |');
    lines.push('| Token Usage | Average tokens per execution | Monitor |');
    lines.push('| Tool Calls | Number of tool executions | Monitor |');
    lines.push('');

    lines.push('### View Metrics');
    lines.push('');
    lines.push('```bash');
    lines.push(`# View agent metrics`);
    lines.push(`glab duo agent metrics ${agentName}`);
    lines.push('');
    lines.push('# View specific metric');
    lines.push(`glab duo agent metrics ${agentName} --metric response_time`);
    lines.push('');
    lines.push('# Export metrics to JSON');
    lines.push(
      `glab duo agent metrics ${agentName} --format json > metrics.json`
    );
    lines.push('```');
    lines.push('');

    lines.push('## Logging');
    lines.push('');
    lines.push('### Log Levels');
    lines.push('');
    lines.push('- `ERROR` - Failures and exceptions');
    lines.push('- `WARN` - Recoverable issues');
    lines.push('- `INFO` - Normal operations');
    lines.push('- `DEBUG` - Detailed execution info');
    lines.push('');

    lines.push('### View Logs');
    lines.push('');
    lines.push('```bash');
    lines.push(`# View recent logs`);
    lines.push(`glab duo agent logs ${agentName}`);
    lines.push('');
    lines.push('# Follow logs in real-time');
    lines.push(`glab duo agent logs ${agentName} --follow`);
    lines.push('');
    lines.push('# Filter by level');
    lines.push(`glab duo agent logs ${agentName} --level ERROR`);
    lines.push('');
    lines.push('# View logs for specific execution');
    lines.push(`glab duo agent logs ${agentName} --execution-id <id>`);
    lines.push('```');
    lines.push('');

    lines.push('## Tracing');
    lines.push('');
    lines.push('### Execution Traces');
    lines.push('');
    lines.push('View complete execution traces:');
    lines.push('');
    lines.push('```bash');
    lines.push(`# List recent executions`);
    lines.push(`glab duo agent executions ${agentName}`);
    lines.push('');
    lines.push('# View execution trace');
    lines.push(`glab duo agent trace <execution-id>`);
    lines.push('');
    lines.push('# Export trace');
    lines.push(
      `glab duo agent trace <execution-id> --format json > trace.json`
    );
    lines.push('```');
    lines.push('');

    lines.push('### Trace Components');
    lines.push('');
    lines.push('Each trace includes:');
    lines.push('');
    lines.push('- Trigger event details');
    lines.push('- Component execution timeline');
    lines.push('- Tool call sequences');
    lines.push('- LLM requests and responses');
    lines.push('- Router decisions');
    lines.push('- Error details (if any)');
    lines.push('');

    lines.push('## Alerting');
    lines.push('');
    lines.push('### Alert Rules');
    lines.push('');
    lines.push('Configure alerts for critical conditions:');
    lines.push('');
    lines.push('```bash');
    lines.push(`# Create alert rule`);
    lines.push(`glab duo agent alert create ${agentName} \\`);
    lines.push('  --metric error_rate \\');
    lines.push('  --threshold 10 \\');
    lines.push('  --period 5m \\');
    lines.push('  --notify-slack webhook-url');
    lines.push('```');
    lines.push('');

    lines.push('### Recommended Alerts');
    lines.push('');
    lines.push('1. **High Error Rate** - > 10% errors in 5 minutes');
    lines.push('2. **Slow Response** - Average response time > 30s');
    lines.push(
      '3. **Agent Down** - No executions in 1 hour (for scheduled agents)'
    );
    lines.push('4. **Token Limit** - Token usage > 90% of limit');
    lines.push('');

    lines.push('## Dashboards');
    lines.push('');
    lines.push('### GitLab Duo Dashboard');
    lines.push('');
    lines.push('Access built-in dashboard:');
    lines.push('');
    lines.push('1. Navigate to project');
    lines.push('2. Go to **GitLab Duo** > **Agents**');
    lines.push(`3. Select **${manifest.metadata?.name || 'agent'}**`);
    lines.push('4. View **Metrics** tab');
    lines.push('');

    lines.push('### Custom Grafana Dashboard');
    lines.push('');
    lines.push('For advanced monitoring, export metrics to Grafana:');
    lines.push('');
    lines.push('```bash');
    lines.push('# Export metrics endpoint');
    lines.push(`glab duo agent metrics-endpoint ${agentName}`);
    lines.push('');
    lines.push('# Configure Prometheus scraper');
    lines.push('# Add endpoint to prometheus.yml');
    lines.push('```');
    lines.push('');

    lines.push('## Performance Optimization');
    lines.push('');
    lines.push('### Response Time');
    lines.push('');
    lines.push('If response time is high:');
    lines.push('');
    lines.push('1. **Reduce prompt size** - Shorter system prompts');
    lines.push('2. **Optimize tool calls** - Batch operations');
    lines.push('3. **Use smaller model** - Switch to faster model');
    lines.push('4. **Enable caching** - Cache frequently used data');
    lines.push('');

    lines.push('### Token Usage');
    lines.push('');
    lines.push('If token usage is high:');
    lines.push('');
    lines.push('1. **Shorten prompts** - Remove unnecessary context');
    lines.push('2. **Limit history** - Reduce conversation history depth');
    lines.push('3. **Compress tool outputs** - Summarize large responses');
    lines.push('4. **Switch model** - Use more efficient model');
    lines.push('');

    lines.push('## Health Checks');
    lines.push('');
    lines.push('### Agent Health');
    lines.push('');
    lines.push('```bash');
    lines.push(`# Check agent health`);
    lines.push(`glab duo agent health ${agentName}`);
    lines.push('');
    lines.push('# Output:');
    lines.push('# Status: healthy');
    lines.push('# Last execution: 2 minutes ago');
    lines.push('# Success rate (24h): 98.5%');
    lines.push('# Avg response time: 3.2s');
    lines.push('```');
    lines.push('');

    lines.push('### Dependency Health');
    lines.push('');
    lines.push('Monitor dependencies:');
    lines.push('');
    lines.push('- AI Gateway connectivity');
    lines.push('- GitLab API availability');
    lines.push('- MCP server status');
    lines.push('- External service connections');
    lines.push('');

    lines.push('## Incident Investigation');
    lines.push('');
    lines.push('### Debug Failed Execution');
    lines.push('');
    lines.push('```bash');
    lines.push('# 1. Get execution ID from logs');
    lines.push(`glab duo agent logs ${agentName} --level ERROR`);
    lines.push('');
    lines.push('# 2. View full trace');
    lines.push('glab duo agent trace <execution-id>');
    lines.push('');
    lines.push('# 3. Check tool call failures');
    lines.push('glab duo agent trace <execution-id> --filter tool_calls');
    lines.push('');
    lines.push('# 4. Review LLM responses');
    lines.push('glab duo agent trace <execution-id> --filter llm_responses');
    lines.push('```');
    lines.push('');

    lines.push('## References');
    lines.push('');
    lines.push(
      '- [GitLab Duo Monitoring](https://docs.gitlab.com/ee/user/gitlab_duo/monitoring.html)'
    );
    lines.push(
      '- [AI Gateway Metrics](https://docs.gitlab.com/ee/architecture/blueprints/ai_gateway/metrics.html)'
    );
    lines.push(
      '- [Performance Best Practices](https://docs.gitlab.com/ee/user/gitlab_duo/performance.html)'
    );
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Generate TROUBLESHOOTING.md
   */
  private generateTroubleshootingGuide(manifest: OssaAgent): string {
    const agentName = this.getAgentName(manifest);
    const lines: string[] = [];

    lines.push(
      `# Troubleshooting Guide: ${manifest.metadata?.name || 'Agent'}`
    );
    lines.push('');
    lines.push('## Common Issues');
    lines.push('');

    lines.push('### Agent Not Responding');
    lines.push('');
    lines.push('**Symptoms:**');
    lines.push('- No response to @mention');
    lines.push('- Triggers not firing');
    lines.push('- Silent failures');
    lines.push('');
    lines.push('**Solutions:**');
    lines.push('');
    lines.push('1. **Check agent status**');
    lines.push('   ```bash');
    lines.push(`   glab duo agent status ${agentName}`);
    lines.push('   ```');
    lines.push('');
    lines.push('2. **Verify triggers are active**');
    lines.push('   ```bash');
    lines.push(`   glab duo agent triggers ${agentName}`);
    lines.push('   ```');
    lines.push('');
    lines.push('3. **Check recent errors**');
    lines.push('   ```bash');
    lines.push(`   glab duo agent logs ${agentName} --level ERROR --tail 50`);
    lines.push('   ```');
    lines.push('');
    lines.push('4. **Restart agent**');
    lines.push('   ```bash');
    lines.push(`   glab duo agent restart ${agentName}`);
    lines.push('   ```');
    lines.push('');

    lines.push('### Authentication Errors');
    lines.push('');
    lines.push('**Error:** `401 Unauthorized` or `403 Forbidden`');
    lines.push('');
    lines.push('**Solutions:**');
    lines.push('');
    lines.push('1. **Verify GITLAB_TOKEN**');
    lines.push('   ```bash');
    lines.push('   glab variable get GITLAB_TOKEN');
    lines.push('   ```');
    lines.push('');
    lines.push('2. **Check token scopes**');
    lines.push('   - Required: `api`, `read_repository`');
    lines.push('   - Optional: `write_repository` (if agent modifies files)');
    lines.push('');
    lines.push('3. **Verify token not expired**');
    lines.push('   ```bash');
    lines.push('   glab auth status');
    lines.push('   ```');
    lines.push('');
    lines.push('4. **Regenerate token**');
    lines.push('   ```bash');
    lines.push('   glab auth login --stdin');
    lines.push('   ```');
    lines.push('');

    lines.push('### Tool Execution Failures');
    lines.push('');
    lines.push('**Error:** `Tool execution failed: <tool-name>`');
    lines.push('');
    lines.push('**Solutions:**');
    lines.push('');
    lines.push('1. **Check tool availability**');
    lines.push('   ```bash');
    lines.push(`   glab duo agent tools ${agentName}`);
    lines.push('   ```');
    lines.push('');
    lines.push('2. **Verify MCP server status**');
    lines.push('   ```bash');
    lines.push(`   glab duo agent mcp-status ${agentName}`);
    lines.push('   ```');
    lines.push('');
    lines.push('3. **Check tool permissions**');
    lines.push('   - File operations require repository access');
    lines.push('   - GitLab operations require API access');
    lines.push('');
    lines.push('4. **Review tool execution logs**');
    lines.push('   ```bash');
    lines.push(`   glab duo agent logs ${agentName} --filter tool_execution`);
    lines.push('   ```');
    lines.push('');

    lines.push('### High Response Time');
    lines.push('');
    lines.push('**Symptom:** Agent takes > 30s to respond');
    lines.push('');
    lines.push('**Solutions:**');
    lines.push('');
    lines.push('1. **Check AI Gateway latency**');
    lines.push('   ```bash');
    lines.push(
      `   glab duo agent metrics ${agentName} --metric gateway_latency`
    );
    lines.push('   ```');
    lines.push('');
    lines.push('2. **Review token usage**');
    lines.push('   - High token usage = slow responses');
    lines.push('   - Optimize prompts to reduce tokens');
    lines.push('');
    lines.push('3. **Check tool execution time**');
    lines.push('   ```bash');
    lines.push(`   glab duo agent trace <execution-id> --filter tool_duration`);
    lines.push('   ```');
    lines.push('');
    lines.push('4. **Consider faster model**');
    lines.push('   - Switch to `claude-haiku` or `gpt-4o-mini`');
    lines.push('');

    lines.push('### Token Limit Exceeded');
    lines.push('');
    lines.push('**Error:** `Token limit exceeded for model`');
    lines.push('');
    lines.push('**Solutions:**');
    lines.push('');
    lines.push('1. **Reduce prompt size**');
    lines.push('   - Shorten system prompt');
    lines.push('   - Remove unnecessary context');
    lines.push('');
    lines.push('2. **Limit conversation history**');
    lines.push('   - Reduce `max_history` parameter');
    lines.push('   - Summarize previous turns');
    lines.push('');
    lines.push('3. **Compress tool outputs**');
    lines.push('   - Summarize large file contents');
    lines.push('   - Return only relevant data');
    lines.push('');
    lines.push('4. **Switch to larger model**');
    lines.push('   - Use model with higher token limit');
    lines.push('');

    lines.push('### MCP Server Connection Failed');
    lines.push('');
    lines.push('**Error:** `Failed to connect to MCP server: <server-name>`');
    lines.push('');
    lines.push('**Solutions:**');
    lines.push('');
    lines.push('1. **Check MCP configuration**');
    lines.push('   ```bash');
    lines.push('   cat .gitlab/duo/mcp-config.json');
    lines.push('   ```');
    lines.push('');
    lines.push('2. **Verify server is installed**');
    lines.push('   ```bash');
    lines.push('   npm list @modelcontextprotocol/server-*');
    lines.push('   ```');
    lines.push('');
    lines.push('3. **Test server connection manually**');
    lines.push('   ```bash');
    lines.push('   npx @modelcontextprotocol/server-gitlab --test');
    lines.push('   ```');
    lines.push('');
    lines.push('4. **Check environment variables**');
    lines.push('   - Ensure required env vars are set');
    lines.push('   - Example: `GITLAB_TOKEN` for gitlab server');
    lines.push('');

    lines.push('### Webhook Trigger Not Firing');
    lines.push('');
    lines.push('**Symptom:** Webhook events not triggering agent');
    lines.push('');
    lines.push('**Solutions:**');
    lines.push('');
    lines.push('1. **Verify webhook configuration**');
    lines.push('   ```bash');
    lines.push(`   cat .gitlab/duo/triggers/webhook.yaml`);
    lines.push('   ```');
    lines.push('');
    lines.push('2. **Check webhook URL**');
    lines.push('   - Ensure URL is accessible');
    lines.push('   - Test with curl');
    lines.push('');
    lines.push('3. **Verify authentication**');
    lines.push('   - Check WEBHOOK_TOKEN is set');
    lines.push('   - Verify token matches webhook config');
    lines.push('');
    lines.push('4. **Review webhook logs**');
    lines.push('   ```bash');
    lines.push(`   glab duo agent logs ${agentName} --filter webhook`);
    lines.push('   ```');
    lines.push('');

    lines.push('## Diagnostic Commands');
    lines.push('');
    lines.push('```bash');
    lines.push('# Complete diagnostic report');
    lines.push(`glab duo agent diagnose ${agentName}`);
    lines.push('');
    lines.push('# Check agent configuration');
    lines.push(`glab duo agent config ${agentName}`);
    lines.push('');
    lines.push('# Validate flow definition');
    lines.push(`glab duo flow validate .gitlab/duo/flows/${agentName}.yaml`);
    lines.push('');
    lines.push('# Test agent locally');
    lines.push(`glab duo agent test ${agentName} --input "test message"`);
    lines.push('');
    lines.push('# Export debug bundle');
    lines.push(
      `glab duo agent debug-export ${agentName} > debug-bundle.tar.gz`
    );
    lines.push('```');
    lines.push('');

    lines.push('## Getting Help');
    lines.push('');
    lines.push('If issues persist:');
    lines.push('');
    lines.push('1. **Check GitLab Status** - https://status.gitlab.com');
    lines.push(
      '2. **Review Documentation** - https://docs.gitlab.com/ee/user/gitlab_duo/'
    );
    lines.push('3. **Open Support Ticket** - https://support.gitlab.com');
    lines.push('4. **Community Forum** - https://forum.gitlab.com');
    lines.push('');

    lines.push('## Debug Checklist');
    lines.push('');
    lines.push('Before opening a support ticket:');
    lines.push('');
    lines.push('- [ ] Agent status checked');
    lines.push('- [ ] Error logs reviewed');
    lines.push('- [ ] Authentication verified');
    lines.push('- [ ] Triggers validated');
    lines.push('- [ ] MCP servers tested');
    lines.push('- [ ] Network connectivity confirmed');
    lines.push('- [ ] Recent changes identified');
    lines.push('- [ ] Diagnostic report generated');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Generate FAQ.md
   */
  private generateFAQ(manifest: OssaAgent): string {
    const agentName = this.getAgentName(manifest);
    const lines: string[] = [];

    lines.push(`# FAQ: ${manifest.metadata?.name || 'Agent'}`);
    lines.push('');

    lines.push('## General');
    lines.push('');
    lines.push('### What is this agent?');
    lines.push('');
    lines.push(
      manifest.metadata?.description ||
        'A GitLab Duo agent for automating tasks.'
    );
    lines.push('');

    lines.push('### How do I trigger this agent?');
    lines.push('');
    lines.push('Multiple ways:');
    lines.push('');
    lines.push(`- **Mention**: \`@${agentName}\` in issue/MR comments`);
    lines.push('- **Assignment**: Assign issue/MR to agent');
    lines.push('- **Schedule**: Runs automatically based on schedule');
    lines.push('- **Webhook**: Trigger via HTTP webhook');
    lines.push('');

    lines.push('### What permissions does the agent need?');
    lines.push('');
    lines.push('Required GitLab token scopes:');
    lines.push('');
    lines.push('- `api` - Full API access');
    lines.push('- `read_repository` - Read repository data');
    lines.push('- `write_repository` - Modify files (if applicable)');
    lines.push('');

    lines.push('## Deployment');
    lines.push('');
    lines.push('### How do I deploy this agent?');
    lines.push('');
    lines.push('Two deployment options:');
    lines.push('');
    lines.push(
      '1. **Flow Agent** (Recommended) - Runs in GitLab Duo infrastructure'
    );
    lines.push('2. **External Agent** - Runs in your CI/CD pipeline');
    lines.push('');
    lines.push(
      'See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.'
    );
    lines.push('');

    lines.push('### Can I test locally before deploying?');
    lines.push('');
    lines.push('Yes:');
    lines.push('');
    lines.push('```bash');
    lines.push('npm install');
    lines.push('npm run build');
    lines.push(`glab duo agent test ${agentName} --input "test message"`);
    lines.push('```');
    lines.push('');

    lines.push('### How do I update the agent?');
    lines.push('');
    lines.push('```bash');
    lines.push('# 1. Make changes locally');
    lines.push('# 2. Build');
    lines.push('npm run build');
    lines.push('');
    lines.push('# 3. Redeploy flow');
    lines.push(`glab duo flow deploy ${agentName} --update`);
    lines.push('```');
    lines.push('');

    lines.push('## Usage');
    lines.push('');
    lines.push('### How do I see agent execution history?');
    lines.push('');
    lines.push('```bash');
    lines.push(`glab duo agent executions ${agentName}`);
    lines.push('```');
    lines.push('');

    lines.push('### How do I view agent logs?');
    lines.push('');
    lines.push('```bash');
    lines.push(`# Recent logs`);
    lines.push(`glab duo agent logs ${agentName}`);
    lines.push('');
    lines.push('# Follow in real-time');
    lines.push(`glab duo agent logs ${agentName} --follow`);
    lines.push('```');
    lines.push('');

    lines.push('### Can the agent access private repositories?');
    lines.push('');
    lines.push(
      'Yes, if the GitLab token has appropriate permissions. The agent can access any repository the token owner can access.'
    );
    lines.push('');

    lines.push('### What tools does the agent have access to?');
    lines.push('');
    lines.push(
      'See `.gitlab/duo/custom-tools.json` for complete list. Common tools:'
    );
    lines.push('');
    lines.push('- File operations (read, write, search)');
    lines.push('- GitLab operations (issues, MRs, comments)');
    lines.push('- Shell commands (if enabled)');
    lines.push('');

    lines.push('## Customization');
    lines.push('');
    lines.push('### How do I modify the agent behavior?');
    lines.push('');
    lines.push(
      'Edit the system prompt in `.gitlab/duo/flows/${agentName}.yaml`:'
    );
    lines.push('');
    lines.push('```yaml');
    lines.push('prompts:');
    lines.push(`  - prompt_id: ${agentName}_prompt`);
    lines.push('    prompt_template:');
    lines.push('      system: "Your custom instructions here"');
    lines.push('```');
    lines.push('');

    lines.push('### Can I add more triggers?');
    lines.push('');
    lines.push('Yes, create new trigger files in `.gitlab/duo/triggers/`:');
    lines.push('');
    lines.push('```yaml');
    lines.push('version: v1');
    lines.push(`agent_name: ${agentName}`);
    lines.push('trigger:');
    lines.push('  type: schedule');
    lines.push('  cron: "0 * * * *"  # Hourly');
    lines.push('```');
    lines.push('');

    lines.push('### Can I use a different LLM model?');
    lines.push('');
    lines.push('Yes, edit the model configuration in flow YAML:');
    lines.push('');
    lines.push('```yaml');
    lines.push('prompts:');
    lines.push('  - model:');
    lines.push('      params:');
    lines.push('        model_class_provider: anthropic');
    lines.push('        model: claude-opus-4  # Change here');
    lines.push('```');
    lines.push('');

    lines.push('### How do I add custom tools?');
    lines.push('');
    lines.push('1. Define tool in `.gitlab/duo/custom-tools.json`');
    lines.push('2. Implement tool in `src/tools/`');
    lines.push('3. Register in MCP config');
    lines.push('4. Rebuild and redeploy');
    lines.push('');

    lines.push('## Troubleshooting');
    lines.push('');
    lines.push('### Agent not responding?');
    lines.push('');
    lines.push(
      'See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed debugging steps.'
    );
    lines.push('');

    lines.push('### High response time?');
    lines.push('');
    lines.push('Common causes:');
    lines.push('');
    lines.push('- Large prompt size → Reduce context');
    lines.push('- Many tool calls → Optimize workflow');
    lines.push('- Slow model → Use faster model (haiku, gpt-4o-mini)');
    lines.push('');

    lines.push('### Authentication errors?');
    lines.push('');
    lines.push('Check:');
    lines.push('');
    lines.push('1. GitLab token is valid: `glab auth status`');
    lines.push('2. Token has correct scopes');
    lines.push('3. Token not expired');
    lines.push('');

    lines.push('## Performance');
    lines.push('');
    lines.push('### How many executions can the agent handle?');
    lines.push('');
    lines.push('Depends on deployment mode:');
    lines.push('');
    lines.push(
      '- **Flow Agent**: Scales automatically (GitLab handles infrastructure)'
    );
    lines.push('- **External Agent**: Limited by CI/CD runners');
    lines.push('');

    lines.push('### What are the token limits?');
    lines.push('');
    lines.push('Varies by model:');
    lines.push('');
    lines.push('- Claude Sonnet 4: 200K tokens');
    lines.push('- GPT-4o: 128K tokens');
    lines.push('- Gemini 1.5 Pro: 2M tokens');
    lines.push('');

    lines.push('### How much does it cost to run?');
    lines.push('');
    lines.push('Costs depend on:');
    lines.push('');
    lines.push('- Model used (Claude, GPT, Gemini)');
    lines.push('- Token usage per execution');
    lines.push('- Number of executions');
    lines.push('');
    lines.push(
      'Monitor costs: `glab duo agent metrics ${agentName} --metric token_usage`'
    );
    lines.push('');

    lines.push('## Security');
    lines.push('');
    lines.push('### Is my data secure?');
    lines.push('');
    lines.push('Yes:');
    lines.push('');
    lines.push('- All data encrypted in transit (TLS)');
    lines.push('- Tokens stored as masked CI/CD variables');
    lines.push('- Conversation history not persisted');
    lines.push('- PII redaction enabled');
    lines.push('');
    lines.push('See [SECURITY.md](./SECURITY.md) for details.');
    lines.push('');

    lines.push('### Can I restrict agent permissions?');
    lines.push('');
    lines.push('Yes:');
    lines.push('');
    lines.push('- Limit GitLab token scopes');
    lines.push('- Restrict trigger permissions');
    lines.push('- Disable dangerous tools (shell execution)');
    lines.push('- Use read-only mode');
    lines.push('');

    lines.push('## Support');
    lines.push('');
    lines.push('### Where do I get help?');
    lines.push('');
    lines.push('1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)');
    lines.push(
      '2. Review [GitLab Duo Documentation](https://docs.gitlab.com/ee/user/gitlab_duo/)'
    );
    lines.push('3. Open support ticket: https://support.gitlab.com');
    lines.push('4. Community forum: https://forum.gitlab.com');
    lines.push('');

    lines.push('### How do I report a bug?');
    lines.push('');
    lines.push(
      '1. Generate diagnostic report: `glab duo agent diagnose ${agentName}`'
    );
    lines.push('2. Open issue in GitLab project');
    lines.push('3. Include diagnostic report and error logs');
    lines.push('');

    lines.push('### Can I contribute improvements?');
    lines.push('');
    lines.push('Yes! Submit merge requests with:');
    lines.push('');
    lines.push('- Bug fixes');
    lines.push('- New features');
    lines.push('- Documentation improvements');
    lines.push('- Performance optimizations');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Generate ARCHITECTURE.md
   */
  private generateArchitecture(manifest: OssaAgent): string {
    const agentName = this.getAgentName(manifest);
    const lines: string[] = [];

    lines.push(`# Architecture: ${manifest.metadata?.name || 'Agent'}`);
    lines.push('');

    lines.push('## Overview');
    lines.push('');
    lines.push(
      'This document describes the architecture of this GitLab Duo agent, including its components, data flow, and integration points.'
    );
    lines.push('');

    lines.push('## High-Level Architecture');
    lines.push('');
    lines.push('```');
    lines.push('┌─────────────────────────────────────────────────────────┐');
    lines.push('│                    GitLab Platform                      │');
    lines.push('│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │');
    lines.push('│  │  Issues  │  │   MRs    │  │  CI/CD Pipelines     │ │');
    lines.push('│  └────┬─────┘  └────┬─────┘  └──────────┬───────────┘ │');
    lines.push('└───────┼─────────────┼──────────────────┼──────────────┘');
    lines.push('        │             │                  │');
    lines.push('        └─────────────┼──────────────────┘');
    lines.push('                      │ Triggers');
    lines.push('                      ▼');
    lines.push('        ┌─────────────────────────────┐');
    lines.push('        │   GitLab Duo Flow Engine    │');
    lines.push('        │  ┌────────────────────────┐ │');
    lines.push('        │  │  Trigger Handler       │ │');
    lines.push('        │  └──────────┬─────────────┘ │');
    lines.push('        │             │               │');
    lines.push('        │  ┌──────────▼─────────────┐ │');
    lines.push(`        │  │  ${agentName} Agent     │ │`);
    lines.push('        │  │  - System Prompt       │ │');
    lines.push('        │  │  - Router Logic        │ │');
    lines.push('        │  │  - Component Exec      │ │');
    lines.push('        │  └──────────┬─────────────┘ │');
    lines.push('        └─────────────┼───────────────┘');
    lines.push('                      │');
    lines.push('                      ▼');
    lines.push('        ┌─────────────────────────────┐');
    lines.push('        │     AI Gateway              │');
    lines.push('        │  ┌────────────────────────┐ │');
    lines.push('        │  │  Model Router          │ │');
    lines.push('        │  └──────────┬─────────────┘ │');
    lines.push('        │             │               │');
    lines.push('        │  ┌──────────▼─────────────┐ │');
    lines.push('        │  │  LLM Provider          │ │');
    lines.push('        │  │  (Anthropic/OpenAI)    │ │');
    lines.push('        │  └────────────────────────┘ │');
    lines.push('        └─────────────────────────────┘');
    lines.push('                      │');
    lines.push('                      ▼');
    lines.push('        ┌─────────────────────────────┐');
    lines.push('        │     MCP Servers             │');
    lines.push('        │  ┌────────┐  ┌────────────┐ │');
    lines.push('        │  │ GitLab │  │ Filesystem │ │');
    lines.push('        │  └────────┘  └────────────┘ │');
    lines.push('        │  ┌────────┐  ┌────────────┐ │');
    lines.push('        │  │ Memory │  │   Custom   │ │');
    lines.push('        │  └────────┘  └────────────┘ │');
    lines.push('        └─────────────────────────────┘');
    lines.push('```');
    lines.push('');

    lines.push('## Components');
    lines.push('');
    lines.push('### 1. Trigger System');
    lines.push('');
    lines.push('Manages agent activation based on events:');
    lines.push('');
    lines.push('- **Mention Trigger**: @agent mentions in issues/MRs');
    lines.push('- **Assignment Trigger**: Issue/MR assignments');
    lines.push('- **Schedule Trigger**: Cron-based execution');
    lines.push('- **Webhook Trigger**: External HTTP events');
    lines.push('- **Pipeline Trigger**: CI/CD pipeline events');
    lines.push('- **File Pattern Trigger**: File change detection');
    lines.push('');
    lines.push('**Location**: `.gitlab/duo/triggers/*.yaml`');
    lines.push('');

    lines.push('### 2. Flow Engine');
    lines.push('');
    lines.push('Orchestrates agent execution:');
    lines.push('');
    lines.push('- **Entry Point**: Receives trigger events');
    lines.push('- **Context Building**: Gathers relevant data');
    lines.push('- **Component Execution**: Runs agent components');
    lines.push('- **Router Logic**: Routes between components');
    lines.push('- **Output Handling**: Formats and delivers responses');
    lines.push('');
    lines.push('**Location**: `.gitlab/duo/flows/${agentName}.yaml`');
    lines.push('');

    lines.push('### 3. Agent Component');
    lines.push('');
    lines.push('Core agent logic:');
    lines.push('');
    lines.push('```typescript');
    lines.push('interface AgentComponent {');
    lines.push('  name: string;');
    lines.push('  type: "AgentComponent";');
    lines.push('  prompt_id: string;');
    lines.push('  toolset: string[];');
    lines.push('  inputs: FlowInput[];');
    lines.push('}');
    lines.push('```');
    lines.push('');
    lines.push('**Responsibilities:**');
    lines.push('- Receive task from trigger');
    lines.push('- Execute LLM inference');
    lines.push('- Call tools as needed');
    lines.push('- Return structured response');
    lines.push('');

    lines.push('### 4. Prompt System');
    lines.push('');
    lines.push('Manages LLM prompts:');
    lines.push('');
    lines.push('```yaml');
    lines.push('prompts:');
    lines.push(`  - prompt_id: ${agentName}_prompt`);
    lines.push('    prompt_template:');
    lines.push('      system: "System instructions"');
    lines.push('      user: "{{task}}"');
    lines.push('      placeholder: history');
    lines.push('    model:');
    lines.push('      params:');
    lines.push('        model_class_provider: anthropic');
    lines.push('        model: claude-sonnet-4');
    lines.push('```');
    lines.push('');

    lines.push('### 5. Tool System (MCP)');
    lines.push('');
    lines.push('Provides tools via Model Context Protocol:');
    lines.push('');
    lines.push('**MCP Servers:**');
    lines.push('- `gitlab`: GitLab API operations');
    lines.push('- `filesystem`: File operations');
    lines.push('- `memory`: Persistent memory');
    lines.push('- `custom`: Custom tool implementations');
    lines.push('');
    lines.push('**Configuration**: `.gitlab/duo/mcp-config.json`');
    lines.push('');

    lines.push('### 6. Router System');
    lines.push('');
    lines.push('Controls execution flow:');
    lines.push('');
    lines.push('```yaml');
    lines.push('routers:');
    lines.push('  # Simple routing');
    lines.push(`  - from: ${agentName}`);
    lines.push('    to: end');
    lines.push('');
    lines.push('  # Conditional routing');
    lines.push(`  - from: ${agentName}`);
    lines.push('    condition:');
    lines.push('      input: decision');
    lines.push('      routes:');
    lines.push('        approve: next_step');
    lines.push('        reject: error_handler');
    lines.push('```');
    lines.push('');

    lines.push('## Data Flow');
    lines.push('');
    lines.push('### Execution Flow');
    lines.push('');
    lines.push('1. **Trigger Event**');
    lines.push('   - User mentions @agent in issue');
    lines.push('   - Trigger handler receives event');
    lines.push('   - Event validated and queued');
    lines.push('');
    lines.push('2. **Context Building**');
    lines.push('   - Fetch issue content');
    lines.push('   - Load conversation history');
    lines.push('   - Gather relevant context');
    lines.push('');
    lines.push('3. **Agent Execution**');
    lines.push('   - Load system prompt');
    lines.push('   - Build user message with context');
    lines.push('   - Send to AI Gateway');
    lines.push('');
    lines.push('4. **LLM Inference**');
    lines.push('   - AI Gateway routes to model provider');
    lines.push('   - LLM processes prompt');
    lines.push('   - Returns response with tool calls');
    lines.push('');
    lines.push('5. **Tool Execution**');
    lines.push('   - Parse tool calls');
    lines.push('   - Execute via MCP servers');
    lines.push('   - Return tool outputs');
    lines.push('');
    lines.push('6. **Response Generation**');
    lines.push('   - LLM processes tool outputs');
    lines.push('   - Generates final response');
    lines.push('   - Format for delivery');
    lines.push('');
    lines.push('7. **Response Delivery**');
    lines.push('   - Post comment to issue');
    lines.push('   - Update issue status (if applicable)');
    lines.push('   - Log execution metrics');
    lines.push('');

    lines.push('## Integration Points');
    lines.push('');
    lines.push('### GitLab API');
    lines.push('');
    lines.push('- **Authentication**: Personal access token');
    lines.push('- **Endpoints Used**:');
    lines.push('  - `/api/v4/projects/:id/issues`');
    lines.push('  - `/api/v4/projects/:id/merge_requests`');
    lines.push('  - `/api/v4/projects/:id/repository/files`');
    lines.push('- **Rate Limits**: 600 requests/minute');
    lines.push('');

    lines.push('### AI Gateway');
    lines.push('');
    lines.push('- **Protocol**: HTTP/2');
    lines.push('- **Authentication**: JWT token');
    lines.push('- **Endpoints**:');
    lines.push('  - `/v1/chat/completions` - LLM inference');
    lines.push('  - `/v1/embeddings` - Vector embeddings');
    lines.push('');

    lines.push('### MCP Servers');
    lines.push('');
    lines.push('- **Protocol**: JSON-RPC 2.0 over stdio');
    lines.push('- **Lifecycle**: Started on-demand, kept warm');
    lines.push('- **Communication**: Process IPC');
    lines.push('');

    lines.push('## Security Architecture');
    lines.push('');
    lines.push('### Authentication Chain');
    lines.push('');
    lines.push('```');
    lines.push(
      'User → GitLab (OAuth) → Flow Engine (JWT) → AI Gateway (Token) → LLM Provider'
    );
    lines.push('```');
    lines.push('');

    lines.push('### Data Security');
    lines.push('');
    lines.push('- **In Transit**: TLS 1.3 encryption');
    lines.push('- **At Rest**: No persistent storage (ephemeral)');
    lines.push('- **Token Storage**: GitLab CI/CD variables (masked)');
    lines.push('- **PII Handling**: Redacted before logging');
    lines.push('');

    lines.push('## Scalability');
    lines.push('');
    lines.push('### Flow Agent (Managed)');
    lines.push('');
    lines.push('- Horizontal scaling (GitLab manages)');
    lines.push('- Auto-scales based on load');
    lines.push('- No infrastructure management');
    lines.push('');

    lines.push('### External Agent (Self-Hosted)');
    lines.push('');
    lines.push('- Scales with CI/CD runner capacity');
    lines.push('- Concurrent execution limited by runners');
    lines.push('- Manual scaling required');
    lines.push('');

    lines.push('## Monitoring & Observability');
    lines.push('');
    lines.push('### Metrics Collected');
    lines.push('');
    lines.push('- Execution count');
    lines.push('- Response time (p50, p95, p99)');
    lines.push('- Error rate');
    lines.push('- Token usage');
    lines.push('- Tool call count');
    lines.push('');

    lines.push('### Logging');
    lines.push('');
    lines.push('- **Levels**: ERROR, WARN, INFO, DEBUG');
    lines.push('- **Retention**: 30 days');
    lines.push('- **Format**: Structured JSON');
    lines.push('');

    lines.push('### Tracing');
    lines.push('');
    lines.push('- Distributed tracing via OpenTelemetry');
    lines.push('- Trace ID propagation through components');
    lines.push('- Full execution path visualization');
    lines.push('');

    lines.push('## Deployment Models');
    lines.push('');
    lines.push('### Flow Agent (Recommended)');
    lines.push('');
    lines.push('**Pros:**');
    lines.push('- Zero infrastructure management');
    lines.push('- Auto-scaling');
    lines.push('- Built-in monitoring');
    lines.push('- Faster cold starts');
    lines.push('');
    lines.push('**Cons:**');
    lines.push('- Less control over execution environment');
    lines.push('- Potential vendor lock-in');
    lines.push('');

    lines.push('### External Agent');
    lines.push('');
    lines.push('**Pros:**');
    lines.push('- Full control over environment');
    lines.push('- Can use private runners');
    lines.push('- Custom dependencies');
    lines.push('');
    lines.push('**Cons:**');
    lines.push('- Manual scaling required');
    lines.push('- Infrastructure management overhead');
    lines.push('- Slower cold starts');
    lines.push('');

    lines.push('## Future Enhancements');
    lines.push('');
    lines.push('Planned improvements:');
    lines.push('');
    lines.push('- [ ] Multi-agent orchestration');
    lines.push('- [ ] Persistent memory across sessions');
    lines.push('- [ ] Advanced router patterns (parallel, conditional)');
    lines.push('- [ ] Custom model fine-tuning');
    lines.push('- [ ] Enhanced error recovery');
    lines.push('- [ ] Real-time streaming responses');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Generate API.md
   */
  private generateAPIDocumentation(manifest: OssaAgent): string {
    const agentName = this.getAgentName(manifest);
    const lines: string[] = [];

    lines.push(`# API Documentation: ${manifest.metadata?.name || 'Agent'}`);
    lines.push('');

    lines.push('## Overview');
    lines.push('');
    lines.push(
      'This document describes the APIs for interacting with this GitLab Duo agent programmatically.'
    );
    lines.push('');

    lines.push('## GitLab API Integration');
    lines.push('');
    lines.push('### Trigger Agent via API');
    lines.push('');
    lines.push(
      '**Endpoint:** `POST /api/v4/projects/:id/duo/agents/:agent_id/trigger`'
    );
    lines.push('');
    lines.push(
      '**Authentication:** GitLab personal access token with `api` scope'
    );
    lines.push('');
    lines.push('**Request:**');
    lines.push('```bash');
    lines.push('curl -X POST \\');
    lines.push(
      '  "https://gitlab.com/api/v4/projects/PROJECT_ID/duo/agents/${agentName}/trigger" \\'
    );
    lines.push('  -H "PRIVATE-TOKEN: YOUR_TOKEN" \\');
    lines.push('  -H "Content-Type: application/json" \\');
    lines.push("  -d '{");
    lines.push('    "input": "Your task description",');
    lines.push('    "context": {');
    lines.push('      "issue_iid": 123,');
    lines.push('      "merge_request_iid": 456');
    lines.push('    }');
    lines.push("  }'");
    lines.push('```');
    lines.push('');
    lines.push('**Response:**');
    lines.push('```json');
    lines.push('{');
    lines.push('  "execution_id": "exec-abc123",');
    lines.push('  "status": "running",');
    lines.push('  "created_at": "2026-02-07T00:00:00Z"');
    lines.push('}');
    lines.push('```');
    lines.push('');

    lines.push('### Check Execution Status');
    lines.push('');
    lines.push(
      '**Endpoint:** `GET /api/v4/projects/:id/duo/agents/:agent_id/executions/:execution_id`'
    );
    lines.push('');
    lines.push('**Request:**');
    lines.push('```bash');
    lines.push(
      'curl "https://gitlab.com/api/v4/projects/PROJECT_ID/duo/agents/${agentName}/executions/exec-abc123" \\'
    );
    lines.push('  -H "PRIVATE-TOKEN: YOUR_TOKEN"');
    lines.push('```');
    lines.push('');
    lines.push('**Response:**');
    lines.push('```json');
    lines.push('{');
    lines.push('  "execution_id": "exec-abc123",');
    lines.push('  "status": "completed",');
    lines.push('  "result": {');
    lines.push('    "output": "Task completed successfully",');
    lines.push('    "tool_calls": 3,');
    lines.push('    "tokens_used": 1245');
    lines.push('  },');
    lines.push('  "created_at": "2026-02-07T00:00:00Z",');
    lines.push('  "completed_at": "2026-02-07T00:00:15Z"');
    lines.push('}');
    lines.push('```');
    lines.push('');

    lines.push('### List Agent Executions');
    lines.push('');
    lines.push(
      '**Endpoint:** `GET /api/v4/projects/:id/duo/agents/:agent_id/executions`'
    );
    lines.push('');
    lines.push('**Query Parameters:**');
    lines.push('- `page` - Page number (default: 1)');
    lines.push('- `per_page` - Items per page (default: 20, max: 100)');
    lines.push(
      '- `status` - Filter by status (`running`, `completed`, `failed`)'
    );
    lines.push('- `since` - Filter executions after date (ISO 8601)');
    lines.push('');
    lines.push('**Request:**');
    lines.push('```bash');
    lines.push(
      'curl "https://gitlab.com/api/v4/projects/PROJECT_ID/duo/agents/${agentName}/executions?status=completed&per_page=10" \\'
    );
    lines.push('  -H "PRIVATE-TOKEN: YOUR_TOKEN"');
    lines.push('```');
    lines.push('');

    lines.push('### Get Agent Logs');
    lines.push('');
    lines.push(
      '**Endpoint:** `GET /api/v4/projects/:id/duo/agents/:agent_id/logs`'
    );
    lines.push('');
    lines.push('**Query Parameters:**');
    lines.push('- `execution_id` - Filter by execution');
    lines.push(
      '- `level` - Filter by log level (`ERROR`, `WARN`, `INFO`, `DEBUG`)'
    );
    lines.push('- `since` - Filter logs after timestamp');
    lines.push(
      '- `limit` - Max number of log entries (default: 100, max: 1000)'
    );
    lines.push('');
    lines.push('**Request:**');
    lines.push('```bash');
    lines.push(
      'curl "https://gitlab.com/api/v4/projects/PROJECT_ID/duo/agents/${agentName}/logs?level=ERROR&limit=50" \\'
    );
    lines.push('  -H "PRIVATE-TOKEN: YOUR_TOKEN"');
    lines.push('```');
    lines.push('');

    lines.push('### Get Agent Metrics');
    lines.push('');
    lines.push(
      '**Endpoint:** `GET /api/v4/projects/:id/duo/agents/:agent_id/metrics`'
    );
    lines.push('');
    lines.push('**Query Parameters:**');
    lines.push('- `metric` - Specific metric name (optional)');
    lines.push('- `period` - Time period (`1h`, `24h`, `7d`, `30d`)');
    lines.push('- `format` - Output format (`json`, `prometheus`)');
    lines.push('');
    lines.push('**Request:**');
    lines.push('```bash');
    lines.push(
      'curl "https://gitlab.com/api/v4/projects/PROJECT_ID/duo/agents/${agentName}/metrics?period=24h" \\'
    );
    lines.push('  -H "PRIVATE-TOKEN: YOUR_TOKEN"');
    lines.push('```');
    lines.push('');
    lines.push('**Response:**');
    lines.push('```json');
    lines.push('{');
    lines.push('  "period": "24h",');
    lines.push('  "metrics": {');
    lines.push('    "execution_count": 142,');
    lines.push('    "success_rate": 0.985,');
    lines.push('    "avg_response_time_ms": 3245,');
    lines.push('    "p95_response_time_ms": 8932,');
    lines.push('    "total_tokens_used": 125430,');
    lines.push('    "error_count": 2');
    lines.push('  }');
    lines.push('}');
    lines.push('```');
    lines.push('');

    lines.push('## Webhook API');
    lines.push('');
    lines.push('### Trigger via Webhook');
    lines.push('');
    lines.push(
      'If webhook trigger is configured (`.gitlab/duo/triggers/webhook.yaml`):'
    );
    lines.push('');
    lines.push('**Endpoint:** Your configured webhook URL');
    lines.push('');
    lines.push('**Authentication:** Bearer token (set in `WEBHOOK_TOKEN`)');
    lines.push('');
    lines.push('**Request:**');
    lines.push('```bash');
    lines.push('curl -X POST \\');
    lines.push('  "https://your-instance.com/webhooks/${agentName}" \\');
    lines.push('  -H "Authorization: Bearer YOUR_WEBHOOK_TOKEN" \\');
    lines.push('  -H "Content-Type: application/json" \\');
    lines.push("  -d '{");
    lines.push('    "event": "custom_event",');
    lines.push('    "data": {');
    lines.push('      "key": "value"');
    lines.push('    }');
    lines.push("  }'");
    lines.push('```');
    lines.push('');

    lines.push('## glab CLI');
    lines.push('');
    lines.push('### Command Reference');
    lines.push('');
    lines.push('```bash');
    lines.push('# Trigger agent');
    lines.push(
      `glab duo agent trigger ${agentName} --input "task description"`
    );
    lines.push('');
    lines.push('# List executions');
    lines.push(`glab duo agent executions ${agentName}`);
    lines.push('');
    lines.push('# View logs');
    lines.push(`glab duo agent logs ${agentName} --follow`);
    lines.push('');
    lines.push('# Get metrics');
    lines.push(`glab duo agent metrics ${agentName} --period 24h`);
    lines.push('');
    lines.push('# Check status');
    lines.push(`glab duo agent status ${agentName}`);
    lines.push('');
    lines.push('# Test agent');
    lines.push(`glab duo agent test ${agentName} --input "test input"`);
    lines.push('```');
    lines.push('');

    lines.push('## SDK Examples');
    lines.push('');
    lines.push('### TypeScript/Node.js');
    lines.push('');
    lines.push('```typescript');
    lines.push('import { Gitlab } from "@gitbeaker/rest";');
    lines.push('');
    lines.push('const api = new Gitlab({');
    lines.push('  token: process.env.GITLAB_TOKEN,');
    lines.push('  host: "https://gitlab.com",');
    lines.push('});');
    lines.push('');
    lines.push('// Trigger agent');
    lines.push('const execution = await api.DuoAgents.trigger(');
    lines.push('  "project-id",');
    lines.push(`  "${agentName}",`);
    lines.push('  {');
    lines.push('    input: "Your task",');
    lines.push('    context: { issue_iid: 123 },');
    lines.push('  }');
    lines.push(');');
    lines.push('');
    lines.push('// Wait for completion');
    lines.push('let status = "running";');
    lines.push('while (status === "running") {');
    lines.push('  await new Promise(resolve => setTimeout(resolve, 1000));');
    lines.push('  const result = await api.DuoAgents.getExecution(');
    lines.push('    "project-id",');
    lines.push(`    "${agentName}",`);
    lines.push('    execution.execution_id');
    lines.push('  );');
    lines.push('  status = result.status;');
    lines.push('}');
    lines.push('```');
    lines.push('');

    lines.push('### Python');
    lines.push('');
    lines.push('```python');
    lines.push('import gitlab');
    lines.push('import time');
    lines.push('');
    lines.push(
      'gl = gitlab.Gitlab("https://gitlab.com", private_token="YOUR_TOKEN")'
    );
    lines.push('project = gl.projects.get("project-id")');
    lines.push('');
    lines.push('# Trigger agent');
    lines.push(`execution = project.duo_agents.get("${agentName}").trigger(`);
    lines.push('    input="Your task",');
    lines.push('    context={"issue_iid": 123}');
    lines.push(')');
    lines.push('');
    lines.push('# Wait for completion');
    lines.push('while execution.status == "running":');
    lines.push('    time.sleep(1)');
    lines.push('    execution.refresh()');
    lines.push('');
    lines.push('print(f"Result: {execution.result}")');
    lines.push('```');
    lines.push('');

    lines.push('## Rate Limits');
    lines.push('');
    lines.push('| Operation | Limit | Period |');
    lines.push('|-----------|-------|--------|');
    lines.push('| Agent Triggers | 100 | per hour |');
    lines.push('| API Requests | 600 | per minute |');
    lines.push('| Webhook Calls | 1000 | per hour |');
    lines.push('');
    lines.push('**Rate Limit Headers:**');
    lines.push('```');
    lines.push('RateLimit-Limit: 600');
    lines.push('RateLimit-Remaining: 599');
    lines.push('RateLimit-Reset: 1612137600');
    lines.push('```');
    lines.push('');

    lines.push('## Error Responses');
    lines.push('');
    lines.push('### 400 Bad Request');
    lines.push('```json');
    lines.push('{');
    lines.push('  "error": "Invalid input",');
    lines.push('  "message": "Input field is required"');
    lines.push('}');
    lines.push('```');
    lines.push('');

    lines.push('### 401 Unauthorized');
    lines.push('```json');
    lines.push('{');
    lines.push('  "error": "Unauthorized",');
    lines.push('  "message": "Invalid or expired token"');
    lines.push('}');
    lines.push('```');
    lines.push('');

    lines.push('### 404 Not Found');
    lines.push('```json');
    lines.push('{');
    lines.push('  "error": "Not found",');
    lines.push('  "message": "Agent not found"');
    lines.push('}');
    lines.push('```');
    lines.push('');

    lines.push('### 429 Too Many Requests');
    lines.push('```json');
    lines.push('{');
    lines.push('  "error": "Rate limit exceeded",');
    lines.push('  "message": "Too many requests, retry after 60 seconds",');
    lines.push('  "retry_after": 60');
    lines.push('}');
    lines.push('```');
    lines.push('');

    lines.push('### 500 Internal Server Error');
    lines.push('```json');
    lines.push('{');
    lines.push('  "error": "Internal error",');
    lines.push('  "message": "Agent execution failed",');
    lines.push('  "trace_id": "abc123"');
    lines.push('}');
    lines.push('```');
    lines.push('');

    lines.push('## Best Practices');
    lines.push('');
    lines.push("1. **Use polling with backoff** - Don't spam status checks");
    lines.push('2. **Handle rate limits** - Respect RateLimit headers');
    lines.push(
      '3. **Include context** - Provide issue/MR context when available'
    );
    lines.push('4. **Validate inputs** - Check input format before triggering');
    lines.push('5. **Log trace IDs** - Include trace_id in error reports');
    lines.push('');

    lines.push('## OpenAPI Specification');
    lines.push('');
    lines.push('Full OpenAPI spec available at:');
    lines.push('');
    lines.push('```bash');
    lines.push('# Download OpenAPI spec');
    lines.push(
      'curl "https://gitlab.com/api/v4/duo/openapi.yaml" > openapi.yaml'
    );
    lines.push('```');
    lines.push('');

    return lines.join('\n');
  }
}
