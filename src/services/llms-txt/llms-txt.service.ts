/**
 * llms.txt Service
 * Handles bidirectional conversion between OSSA manifests and llms.txt format
 * Follows llmstxt.org specification
 */

import * as fs from 'fs/promises';
import { injectable } from 'inversify';
import type {
  OssaAgent,
  LlmsTxtExtension,
  LlmsTxtSection,
} from '../../types/index.js';
import { LlmsTxtExtensionSchema } from '../../types/llms-txt.zod.js';

/**
 * Service for generating and managing llms.txt files from OSSA manifests
 */
@injectable()
export class LlmsTxtService {
  /**
   * Generate llms.txt content from OSSA manifest
   * @param manifest - OSSA agent manifest
   * @returns Generated llms.txt content as string
   */
  async generateLlmsTxt(manifest: OssaAgent): Promise<string> {
    const rawExtension = (manifest.extensions as any)?.llms_txt;

    if (!rawExtension) {
      throw new Error('llms_txt extension not found in manifest');
    }

    // Validate with Zod (ZOD principle)
    const parseResult = LlmsTxtExtensionSchema.safeParse(rawExtension);
    if (!parseResult.success) {
      throw new Error(
        `Invalid llms_txt extension: ${parseResult.error.message}`
      );
    }

    const extension = parseResult.data;

    if (!extension.enabled) {
      throw new Error('llms_txt extension is not enabled in manifest');
    }

    const sections: string[] = [];
    const format = extension.format || {};
    const includeComments = extension.sync?.include_comments === true;

    // H1 Title
    if (
      format.include_h1_title !== false &&
      extension.mapping?.metadata_to_h1 !== false
    ) {
      const title = manifest.metadata?.name || 'OSSA Agent';
      sections.push(`# ${title}`);
      sections.push('');
    }

    // Blockquote Summary
    if (
      format.include_blockquote !== false &&
      extension.mapping?.description_to_blockquote !== false
    ) {
      const description = manifest.metadata?.description || '';
      if (description) {
        sections.push(`> ${description}`);
        sections.push('');
      }
    }

    // Core Specification
    if (extension.sections?.core_specification?.enabled !== false) {
      const coreSection = this.generateCoreSpecificationSection(
        manifest,
        extension.sections?.core_specification
      );
      if (coreSection) {
        sections.push(coreSection);
        sections.push('');
      }
    }

    // Quick Start
    if (extension.sections?.quick_start?.enabled !== false) {
      const quickStartSection = this.generateQuickStartSection(
        manifest,
        extension.sections?.quick_start
      );
      if (quickStartSection) {
        sections.push(quickStartSection);
        sections.push('');
      }
    }

    // CLI Tools
    if (extension.sections?.cli_tools?.enabled !== false) {
      const cliSection = this.generateCLIToolsSection(
        manifest,
        extension.sections?.cli_tools
      );
      if (cliSection) {
        sections.push(cliSection);
        sections.push('');
      }
    }

    // SDKs
    if (extension.sections?.sdks?.enabled !== false) {
      const sdksSection = this.generateSDKsSection(
        manifest,
        extension.sections?.sdks
      );
      if (sdksSection) {
        sections.push(sdksSection);
        sections.push('');
      }
    }

    // Examples
    if (extension.sections?.examples?.enabled !== false) {
      const examplesSection = this.generateExamplesSection(
        manifest,
        extension.sections?.examples
      );
      if (examplesSection) {
        sections.push(examplesSection);
        sections.push('');
      }
    }

    // Migration Guides
    if (extension.sections?.migration_guides?.enabled !== false) {
      const migrationSection = this.generateMigrationGuidesSection(
        manifest,
        extension.sections?.migration_guides
      );
      if (migrationSection) {
        sections.push(migrationSection);
        sections.push('');
      }
    }

    // Development
    if (extension.sections?.development?.enabled !== false) {
      const devSection = this.generateDevelopmentSection(
        manifest,
        extension.sections?.development
      );
      if (devSection) {
        sections.push(devSection);
        sections.push('');
      }
    }

    // Specification Versions
    if (extension.sections?.specification_versions?.enabled !== false) {
      const versionsSection = this.generateSpecificationVersionsSection(
        manifest,
        extension.sections?.specification_versions
      );
      if (versionsSection) {
        sections.push(versionsSection);
        sections.push('');
      }
    }

    // OpenAPI Specifications
    if (extension.sections?.openapi_specifications?.enabled !== false) {
      const openapiSection = this.generateOpenAPISpecificationsSection(
        manifest,
        extension.sections?.openapi_specifications
      );
      if (openapiSection) {
        sections.push(openapiSection);
        sections.push('');
      }
    }

    // Documentation
    if (extension.sections?.documentation?.enabled !== false) {
      const docsSection = this.generateDocumentationSection(
        manifest,
        extension.sections?.documentation
      );
      if (docsSection) {
        sections.push(docsSection);
        sections.push('');
      }
    }

    // Optional
    if (
      format.include_optional !== false &&
      extension.sections?.optional?.enabled !== false
    ) {
      const optionalSection = this.generateOptionalSection(
        manifest,
        extension.sections?.optional
      );
      if (optionalSection) {
        sections.push(optionalSection);
        sections.push('');
      }
    }

    return sections.join('\n').trim() + '\n';
  }

  private generateCoreSpecificationSection(
    manifest: OssaAgent,
    config?: LlmsTxtSection
  ): string {
    const lines: string[] = ['## Core Specification'];
    lines.push('');

    if (config?.custom) {
      lines.push(config.custom);
    } else if (config?.file_list && config.file_list.length > 0) {
      config.file_list.forEach((file) => {
        lines.push(`- [${this.getFileLabel(file)}](${file})`);
      });
    } else {
      // Default core specification links
      lines.push(
        '- [OSSA Schema v0.3.3](spec/v0.3.3/ossa-0.3.3.schema.json): Complete JSON Schema for agent definitions'
      );
      lines.push(
        '- [OpenAPI Specifications](openapi/): API definitions for agent communication and discovery'
      );
      lines.push(
        '- [Specification Documentation](spec/v0.3.3/): Complete specification with examples and guides'
      );
    }

    if (config?.append) {
      lines.push('');
      lines.push(config.append);
    }

    return lines.join('\n');
  }

  private generateQuickStartSection(
    manifest: OssaAgent,
    config?: LlmsTxtSection
  ): string {
    const lines: string[] = ['## Quick Start'];
    lines.push('');

    if (config?.custom) {
      lines.push(config.custom);
    } else if (config?.file_list && config.file_list.length > 0) {
      config.file_list.forEach((file) => {
        lines.push(`- [${this.getFileLabel(file)}](${file})`);
      });
    } else {
      lines.push(
        '- [Installation Guide](README.md#-quick-start): Install via npm and create your first agent'
      );
      lines.push(
        '- [Quick Start Guide](docs/QUICKSTART.md): Get started in 5 minutes'
      );
      lines.push(
        '- [API Reference](docs/api-reference/): Complete API documentation'
      );
      lines.push(
        '- [Examples Directory](examples/): 100+ reference implementations'
      );
    }

    if (config?.append) {
      lines.push('');
      lines.push(config.append);
    }

    return lines.join('\n');
  }

  private generateCLIToolsSection(
    manifest: OssaAgent,
    config?: LlmsTxtSection
  ): string {
    const lines: string[] = ['## CLI Tools'];
    lines.push('');

    if (config?.custom) {
      lines.push(config.custom);
    } else if (config?.file_list && config.file_list.length > 0) {
      config.file_list.forEach((file) => {
        lines.push(`- [${this.getFileLabel(file)}](${file})`);
      });
    } else {
      lines.push(
        '- [CLI Commands](bin/ossa): Command-line tool for validation, generation, and migration'
      );
      lines.push(
        '- [CLI Documentation](docs/api-reference/endpoints.md): Complete CLI reference'
      );
      lines.push(
        '- [Validation Guide](docs/guides/getting-started.md): How to validate OSSA manifests'
      );
    }

    if (config?.append) {
      lines.push('');
      lines.push(config.append);
    }

    return lines.join('\n');
  }

  private generateSDKsSection(
    manifest: OssaAgent,
    config?: LlmsTxtSection
  ): string {
    const lines: string[] = ['## SDKs'];
    lines.push('');

    if (config?.custom) {
      lines.push(config.custom);
    } else if (config?.file_list && config.file_list.length > 0) {
      config.file_list.forEach((file) => {
        lines.push(`- [${this.getFileLabel(file)}](${file})`);
      });
    } else {
      lines.push(
        '- [TypeScript SDK](src/sdks/typescript/): Type-safe client library with full validation'
      );
      lines.push(
        '- [Python SDK](sdks/python/): Python client library (Pydantic models, CLI, validation)'
      );
      lines.push(
        '- [SDK Documentation](src/sdks/README.md): SDK usage and examples'
      );
    }

    if (config?.append) {
      lines.push('');
      lines.push(config.append);
    }

    return lines.join('\n');
  }

  private generateExamplesSection(
    manifest: OssaAgent,
    config?: LlmsTxtSection
  ): string {
    const lines: string[] = ['## Examples'];
    lines.push('');

    if (config?.custom) {
      lines.push(config.custom);
    } else if (config?.file_list && config.file_list.length > 0) {
      config.file_list.forEach((file) => {
        lines.push(`- [${this.getFileLabel(file)}](${file})`);
      });
    } else {
      lines.push(
        '- [Agent Manifests](examples/agent-manifests/): Basic agent definitions'
      );
      lines.push(
        '- [Platform Adapters](examples/adapters/): Integrations with LangChain, CrewAI, etc.'
      );
      lines.push(
        '- [Multi-Agent Workflows](examples/multi-agent/): Complex orchestration examples'
      );
      lines.push(
        '- [Reference Implementations](examples/reference-implementations/): Production-ready patterns'
      );
    }

    if (config?.append) {
      lines.push('');
      lines.push(config.append);
    }

    return lines.join('\n');
  }

  private generateMigrationGuidesSection(
    manifest: OssaAgent,
    config?: LlmsTxtSection
  ): string {
    const lines: string[] = ['## Migration Guides'];
    lines.push('');

    if (config?.custom) {
      lines.push(config.custom);
    } else if (config?.file_list && config.file_list.length > 0) {
      config.file_list.forEach((file) => {
        lines.push(`- [${this.getFileLabel(file)}](${file})`);
      });
    } else {
      lines.push(
        '- [Migration System](migrations/README.md): How to migrate between OSSA versions'
      );
      lines.push(
        '- [v0.3.3 to v0.3.3](migrations/guides/MIGRATION-v0.3.3-to-v0.3.3.md): Skills Compatibility Extension'
      );
      lines.push(
        '- [Migration Runner](migrations/index.ts): Automated migration tool'
      );
    }

    if (config?.append) {
      lines.push('');
      lines.push(config.append);
    }

    return lines.join('\n');
  }

  private generateDevelopmentSection(
    manifest: OssaAgent,
    config?: LlmsTxtSection
  ): string {
    const lines: string[] = ['## Development'];
    lines.push('');

    if (config?.custom) {
      lines.push(config.custom);
    } else if (config?.file_list && config.file_list.length > 0) {
      config.file_list.forEach((file) => {
        lines.push(`- [${this.getFileLabel(file)}](${file})`);
      });
    } else {
      lines.push(
        '- [Contributing Guide](CONTRIBUTING.md): How to contribute to OSSA'
      );
      lines.push(
        '- [Code of Conduct](CODE_OF_CONDUCT.md): Community standards'
      );
      lines.push(
        '- [Security Policy](SECURITY.md): How to report vulnerabilities'
      );
      lines.push(
        '- [Development Setup](README.md#-development): Setup instructions'
      );
    }

    if (config?.append) {
      lines.push('');
      lines.push(config.append);
    }

    return lines.join('\n');
  }

  private generateSpecificationVersionsSection(
    manifest: OssaAgent,
    config?: LlmsTxtSection
  ): string {
    const lines: string[] = ['## Specification Versions'];
    lines.push('');

    if (config?.custom) {
      lines.push(config.custom);
    } else if (config?.file_list && config.file_list.length > 0) {
      config.file_list.forEach((file) => {
        lines.push(`- [${this.getFileLabel(file)}](${file})`);
      });
    } else {
      lines.push(
        '- [v0.3.3](spec/v0.3.3/): Latest version with Skills Compatibility Extension'
      );
      lines.push('- [v0.3.3](spec/v0.3.3/): Previous stable version');
      lines.push('- [v0.3.3](spec/v0.3.3/): Legacy version');
      lines.push('- [Schema Index](spec/): All specification versions');
    }

    if (config?.append) {
      lines.push('');
      lines.push(config.append);
    }

    return lines.join('\n');
  }

  private generateOpenAPISpecificationsSection(
    manifest: OssaAgent,
    config?: LlmsTxtSection
  ): string {
    const lines: string[] = ['## OpenAPI Specifications'];
    lines.push('');

    if (config?.custom) {
      lines.push(config.custom);
    } else if (config?.file_list && config.file_list.length > 0) {
      config.file_list.forEach((file) => {
        lines.push(`- [${this.getFileLabel(file)}](${file})`);
      });
    } else {
      lines.push(
        '- [Agent CRUD](openapi/agent-crud.yaml): Create, read, update, delete agents'
      );
      lines.push(
        '- [Agent Discovery](openapi/agent-discovery.yaml): Discover and query agents'
      );
      lines.push(
        '- [Agent Communication](openapi/agent-communication.yaml): Agent-to-agent messaging'
      );
      lines.push(
        '- [Agent Identity](openapi/agent-identity.yaml): Identity and authentication'
      );
      lines.push(
        '- [CLI Commands](openapi/cli-commands.openapi.yaml): CLI API specification'
      );
    }

    if (config?.append) {
      lines.push('');
      lines.push(config.append);
    }

    return lines.join('\n');
  }

  private generateDocumentationSection(
    manifest: OssaAgent,
    config?: LlmsTxtSection
  ): string {
    const lines: string[] = ['## Documentation'];
    lines.push('');

    if (config?.custom) {
      lines.push(config.custom);
    } else if (config?.file_list && config.file_list.length > 0) {
      config.file_list.forEach((file) => {
        lines.push(`- [${this.getFileLabel(file)}](${file})`);
      });
    } else {
      lines.push(
        '- [Implementation Summary](docs/IMPLEMENTATION-SUMMARY.md): Architecture overview'
      );
      lines.push(
        '- [Unified Agent Platform](docs/UNIFIED-AGENT-PLATFORM.md): Platform integration guide'
      );
      lines.push(
        '- [GitLab Integration](docs/integrations/gitlab-ultimate-observability.md): GitLab Duo Platform integration'
      );
      lines.push(
        '- [Research](docs/research/): AI agent landscape research and comparisons'
      );
    }

    if (config?.append) {
      lines.push('');
      lines.push(config.append);
    }

    return lines.join('\n');
  }

  private generateOptionalSection(
    manifest: OssaAgent,
    config?: LlmsTxtSection
  ): string {
    const lines: string[] = ['## Optional'];
    lines.push('');

    if (config?.custom) {
      lines.push(config.custom);
    } else if (config?.file_list && config.file_list.length > 0) {
      config.file_list.forEach((file) => {
        lines.push(`- [${this.getFileLabel(file)}](${file})`);
      });
    } else {
      lines.push('- [Roadmap](docs/roadmap/): Future plans and milestones');
      lines.push('- [Whitepaper](docs/whitepaper/): Technical deep-dives');
      lines.push(
        '- [Infrastructure](.gitlab/infrastructure/): Kubernetes and deployment configs'
      );
      lines.push(
        '- [GitLab CI/CD](.gitlab-ci.yml): CI/CD pipeline configuration'
      );
    }

    if (config?.append) {
      lines.push('');
      lines.push(config.append);
    }

    return lines.join('\n');
  }

  private getFileLabel(file: string): string {
    // Extract a readable label from file path
    const parts = file.split('/');
    const filename = parts[parts.length - 1];
    return filename
      .replace(/\.(md|yaml|yml|json|ts|js)$/, '')
      .replace(/-/g, ' ');
  }

  /**
   * Write llms.txt file to disk
   * @param manifest - OSSA agent manifest
   * @param outputPath - Optional output path (defaults to extension config)
   */
  async writeLlmsTxt(manifest: OssaAgent, outputPath?: string): Promise<void> {
    const extension = (manifest.extensions as any)?.llms_txt as
      | LlmsTxtExtension
      | undefined;
    const targetPath = outputPath || extension?.file_path || 'llms.txt';

    const content = await this.generateLlmsTxt(manifest);
    await fs.writeFile(targetPath, content, 'utf-8');
  }

  /**
   * Validate llms.txt against manifest
   */
  async validateLlmsTxt(
    llmsTxtPath: string,
    manifest: OssaAgent
  ): Promise<{ valid: boolean; warnings: string[] }> {
    const warnings: string[] = [];

    try {
      await fs.access(llmsTxtPath);
    } catch {
      return {
        valid: false,
        warnings: ['llms.txt file not found'],
      };
    }

    const content = await fs.readFile(llmsTxtPath, 'utf-8');
    const extension = (manifest.extensions as any)?.llms_txt as
      | LlmsTxtExtension
      | undefined;

    // Check for required sections
    if (extension?.sections?.core_specification?.enabled !== false) {
      if (!content.includes('## Core Specification')) {
        warnings.push('Missing "Core Specification" section');
      }
    }

    return {
      valid: warnings.length === 0,
      warnings,
    };
  }

  /**
   * Sync llms.txt with manifest changes
   */
  async syncLlmsTxt(
    manifestPath: string,
    watch: boolean = false
  ): Promise<void> {
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent) as OssaAgent;

    const rawExtension = (manifest.extensions as any)?.llms_txt;

    if (!rawExtension) {
      throw new Error('llms_txt extension not found in manifest');
    }

    // Validate with Zod (ZOD principle)
    const parseResult = LlmsTxtExtensionSchema.safeParse(rawExtension);
    if (!parseResult.success) {
      throw new Error(
        `Invalid llms_txt extension: ${parseResult.error.message}`
      );
    }

    const extension = parseResult.data;

    if (!extension.enabled) {
      throw new Error('llms_txt extension is not enabled');
    }

    if (!extension.sync?.on_manifest_change) {
      throw new Error('Sync on manifest change is not enabled');
    }

    await this.writeLlmsTxt(manifest);

    if (watch) {
      console.log(`Watching ${manifestPath} for changes...`);
      // TODO: Implement file watching
    }
  }

  /**
   * Read llms.txt file (CRUD: Read)
   */
  async readLlmsTxt(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        throw new Error(`llms.txt file not found: ${filePath}`);
      }
      throw error;
    }
  }

  /**
   * Update llms.txt file (CRUD: Update)
   */
  async updateLlmsTxt(manifest: OssaAgent, filePath?: string): Promise<void> {
    const content = await this.generateLlmsTxt(manifest);
    const targetPath =
      filePath ||
      (manifest.extensions as any)?.llms_txt?.file_path ||
      'llms.txt';
    await this.writeLlmsTxt(manifest, targetPath);
  }

  /**
   * Delete llms.txt file (CRUD: Delete)
   */
  async deleteLlmsTxt(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        throw new Error(`llms.txt file not found: ${filePath}`);
      }
      throw error;
    }
  }
}
