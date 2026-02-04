/**
 * NPM Package Platform Adapter
 * Exports OSSA agent manifests as installable npm packages
 *
 * SOLID: Single Responsibility - NPM package export only
 * DRY: Reuses BaseAdapter validation and helpers
 */

import { BaseAdapter } from '../base/adapter.interface.js';
import type {
  OssaAgent,
  ExportOptions,
  ExportResult,
  ExportFile,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from '../base/adapter.interface.js';
import { NPMConverter } from './converter.js';
import type { NPMPackageConfig } from './types.js';
import { ClaudeSkillsService } from '../../services/skills/claude-skills.service.js';
import { container } from '../../di-container.js';
import * as yaml from 'yaml';

export class NPMAdapter extends BaseAdapter {
  readonly platform = 'npm';
  readonly displayName = 'NPM Package';
  readonly description = 'Export agent as installable npm package';
  readonly supportedVersions = ['v0.3.6', 'v0.4.1'];

  private converter = new NPMConverter();
  private _skillsService?: ClaudeSkillsService;

  /**
   * Lazy-load skills service to avoid circular dependency
   */
  private get skillsService(): ClaudeSkillsService {
    if (!this._skillsService) {
      this._skillsService = container.get(ClaudeSkillsService);
    }
    return this._skillsService;
  }

  /**
   * Export OSSA manifest to NPM package format
   */
  async export(
    manifest: OssaAgent,
    options?: ExportOptions
  ): Promise<ExportResult> {
    const startTime = Date.now();

    try {
      // Validate manifest
      if (options?.validate !== false) {
        const validation = await this.validate(manifest);
        if (!validation.valid) {
          return this.createResult(
            false,
            [],
            `Validation failed: ${validation.errors?.map((e) => e.message).join(', ')}`,
            {
              duration: Date.now() - startTime,
              warnings: validation.warnings?.map((w) => w.message),
            }
          );
        }
      }

      // Convert to NPM package config
      const config = this.converter.convert(manifest);
      const metadata = this.converter.extractMetadata(manifest);
      const files: ExportFile[] = [];

      // Generate package.json
      const packageJson = this.converter.generatePackageJson(config);
      files.push(
        this.createFile('package.json', packageJson, 'config', 'json')
      );

      // Generate index.js entry point
      const entryPoint = this.converter.generateEntryPoint(manifest, metadata);
      files.push(
        this.createFile('index.js', entryPoint, 'code', 'javascript')
      );

      // Generate index.d.ts TypeScript types
      const types = this.converter.generateTypes(metadata);
      files.push(
        this.createFile('index.d.ts', types, 'code', 'typescript')
      );

      // Include original OSSA manifest
      const manifestYaml = yaml.stringify(manifest);
      files.push(
        this.createFile('agent.ossa.yaml', manifestYaml, 'config', 'yaml')
      );

      // Generate README.md
      const readme = this.converter.generateReadme(manifest, metadata);
      files.push(
        this.createFile('README.md', readme, 'documentation', 'markdown')
      );

      // Generate .npmignore
      const npmIgnore = this.converter.generateNpmIgnore();
      files.push(
        this.createFile('.npmignore', npmIgnore, 'config', 'text')
      );

      // Generate LICENSE if specified
      if (manifest.metadata?.license) {
        const license = this.generateLicense(manifest.metadata.license);
        files.push(
          this.createFile('LICENSE', license, 'documentation', 'text')
        );
      }

      // Generate Claude Skill if requested (DRY: reuse ClaudeSkillsService)
      if (options?.includeSkill) {
        const skillContent = await this.generateClaudeSkill(manifest);
        files.push(
          this.createFile('SKILL.md', skillContent, 'documentation', 'markdown')
        );
      }

      return this.createResult(true, files, undefined, {
        duration: Date.now() - startTime,
        version: config.version,
        includeSkill: options?.includeSkill,
      });
    } catch (error) {
      return this.createResult(
        false,
        [],
        error instanceof Error ? error.message : String(error),
        { duration: Date.now() - startTime }
      );
    }
  }

  /**
   * Validate manifest for NPM package compatibility
   */
  async validate(manifest: OssaAgent): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Base validation
    const baseValidation = await super.validate(manifest);
    if (baseValidation.errors) errors.push(...baseValidation.errors);
    if (baseValidation.warnings) warnings.push(...baseValidation.warnings);

    // NPM-specific validation
    const metadata = manifest.metadata;
    const annotations = metadata?.annotations || {};

    // Check package name follows npm naming rules
    if (metadata?.name) {
      const npmNameRegex = /^[a-z0-9-]+$/;
      const sanitizedName = metadata.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');

      if (!npmNameRegex.test(sanitizedName)) {
        warnings.push({
          message: `Package name '${metadata.name}' will be sanitized to '${sanitizedName}' for npm compatibility`,
          path: 'metadata.name',
          suggestion: 'Use lowercase letters, numbers, and hyphens only',
        });
      }
    }

    // Check version is valid semver
    if (metadata?.version) {
      const semverRegex = /^\d+\.\d+\.\d+(-[a-z0-9.-]+)?(\+[a-z0-9.-]+)?$/i;
      if (!semverRegex.test(metadata.version)) {
        errors.push({
          message: `Version '${metadata.version}' is not valid semver format`,
          path: 'metadata.version',
          code: 'INVALID_SEMVER',
        });
      }
    }

    // Check for description
    if (!metadata?.description) {
      warnings.push({
        message: 'Package description is recommended for better npm discoverability',
        path: 'metadata.description',
        suggestion: 'Add metadata.description field',
      });
    }

    // Check for license
    if (!metadata?.license) {
      warnings.push({
        message: 'License not specified, will default to MIT',
        path: 'metadata.license',
        suggestion: 'Add metadata.license field (e.g., "MIT", "Apache-2.0")',
      });
    }

    // Check for repository (in annotations)
    const repository = annotations['repository'] as string | undefined;
    if (!repository) {
      warnings.push({
        message: 'Repository URL not specified, npm package will not link to source code',
        path: 'metadata.annotations.repository',
        suggestion: 'Add metadata.annotations.repository field with git URL',
      });
    }

    // Check for author
    if (!metadata?.author) {
      warnings.push({
        message: 'Author not specified',
        path: 'metadata.author',
        suggestion: 'Add metadata.author field',
      });
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Get example NPM-optimized manifest
   */
  getExample(): OssaAgent {
    return {
      apiVersion: 'ossa/v0.4.1',
      kind: 'Agent',
      metadata: {
        name: 'example-npm-agent',
        version: '1.0.0',
        description: 'Example agent packaged as npm module',
        author: 'OSSA Team',
        license: 'MIT',
        annotations: {
          repository: 'https://github.com/example/example-npm-agent',
        },
        labels: {
          category: 'utility',
          framework: 'ossa',
        },
      },
      spec: {
        role: 'You are a helpful AI assistant that can be installed via npm.',
        llm: {
          provider: 'openai',
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2000,
        },
        tools: [
          {
            name: 'search',
            description: 'Search the web for information',
            type: 'api',
          },
        ],
        capabilities: ['conversation', 'web-search', 'npm-installable'] as any,
      },
    };
  }

  /**
   * Generate LICENSE file content
   */
  private generateLicense(license: string): string {
    const year = new Date().getFullYear();

    // Common license templates
    const licenses: Record<string, string> = {
      MIT: `MIT License

Copyright (c) ${year}

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
SOFTWARE.`,
      'Apache-2.0': `Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/

Copyright ${year}

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.`,
      ISC: `ISC License

Copyright (c) ${year}

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.`,
    };

    return licenses[license] || licenses['MIT'];
  }

  /**
   * Generate Claude Skill content from OSSA manifest
   * DRY: Delegates to ClaudeSkillsService instead of reimplementing
   * SOLID: Single Responsibility - NPM adapter orchestrates, skills service generates
   */
  private async generateClaudeSkill(manifest: OssaAgent): Promise<string> {
    const agentName = manifest.metadata?.name || 'unknown-agent';
    const description = manifest.metadata?.description || manifest.spec?.role || 'OSSA agent';

    // Extract trigger keywords from manifest
    const triggerKeywords: string[] = [];
    const taxonomy = (manifest.spec as Record<string, unknown>)?.taxonomy as
      | { domain?: string; subdomain?: string; capability?: string }
      | undefined;

    if (taxonomy?.domain) triggerKeywords.push(taxonomy.domain);
    if (taxonomy?.subdomain) triggerKeywords.push(taxonomy.subdomain);
    if (taxonomy?.capability) triggerKeywords.push(taxonomy.capability);

    // Extract from capabilities
    const specRecord = manifest.spec as Record<string, unknown>;
    if (specRecord.capabilities) {
      const capabilities = specRecord.capabilities as unknown[];
      for (const cap of capabilities) {
        if (typeof cap === 'string') {
          triggerKeywords.push(cap);
        } else if (cap && typeof cap === 'object' && 'name' in cap) {
          triggerKeywords.push(String((cap as { name: string }).name));
        }
      }
    }

    // Generate frontmatter
    const frontmatter = {
      name: agentName,
      description: description.substring(0, 200),
      trigger_keywords: [...new Set(triggerKeywords)].slice(0, 10),
    };

    // Build skill content
    let content = `---\n${yaml.stringify(frontmatter)}---\n\n`;
    content += `# ${agentName}\n\n`;
    content += `${description}\n\n`;
    content += `## NPM Package\n\n`;
    content += `This agent is available as an npm package:\n\n`;
    content += `\`\`\`bash\n`;
    content += `npm install @ossa/${agentName.toLowerCase().replace(/[^a-z0-9-]/g, '-')}\n`;
    content += `\`\`\`\n\n`;
    content += `## Usage\n\n`;
    content += `\`\`\`javascript\n`;
    content += `import agent from '@ossa/${agentName.toLowerCase().replace(/[^a-z0-9-]/g, '-')}';\n\n`;
    content += `// Get agent metadata\n`;
    content += `console.log(agent.metadata);\n\n`;
    content += `// Load OSSA manifest\n`;
    content += `const manifest = agent.manifest();\n`;
    content += `\`\`\`\n\n`;

    if (manifest.spec?.tools && manifest.spec.tools.length > 0) {
      content += `## Available Tools\n\n`;
      for (const tool of manifest.spec.tools) {
        const toolName = typeof tool === 'string' ? tool : tool.name || 'unknown';
        const toolDesc = typeof tool === 'object' && 'description' in tool ? tool.description : '';
        content += `- **${toolName}**${toolDesc ? `: ${toolDesc}` : ''}\n`;
      }
      content += `\n`;
    }

    content += `## When to Use\n\n`;
    content += `This skill activates when:\n`;
    for (const keyword of triggerKeywords.slice(0, 5)) {
      content += `- Task involves: ${keyword}\n`;
    }

    return content;
  }
}
