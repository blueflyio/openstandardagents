import * as fs from 'fs';
import * as path from 'path';

export interface LlmsTxtOptions {
  projectPath: string;
  includeExamples?: boolean;
}

export class LlmsTxtGenerator {
  /**
   * Generate llms.txt file
   * Reference: https://llmstxt.org
   */
  generate(options: LlmsTxtOptions): string {
    const { projectPath, includeExamples = true } = options;

    let content = '';

    // Header
    content += `# llms.txt\n\n`;
    content += `This file provides context about the project for LLM systems.\n\n`;

    // Project info
    const projectName = path.basename(projectPath);
    content += `## Project: ${projectName}\n\n`;

    // Description from package.json
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, 'utf-8')
        );
        content += `**Description:** ${packageJson.description || 'No description'}\n`;
        content += `**Version:** ${packageJson.version || 'unknown'}\n`;
        content += `**License:** ${packageJson.license || 'unknown'}\n\n`;
      } catch {
        // Skip if can't read
      }
    }

    // Key files
    content += `## Key Files\n\n`;
    content += this.listKeyFiles(projectPath);

    // Dependencies
    content += `## Dependencies\n\n`;
    content += this.listDependencies(projectPath);

    // Scripts
    content += `## Available Scripts\n\n`;
    content += this.listScripts(projectPath);

    // API endpoints (if OpenAPI spec exists)
    const openapiPath = path.join(projectPath, 'openapi', 'openapi.yaml');
    if (fs.existsSync(openapiPath)) {
      content += `## API Endpoints\n\n`;
      content += `See openapi/openapi.yaml for complete API specification.\n\n`;
    }

    // Examples
    if (includeExamples) {
      content += `## Examples\n\n`;
      content += this.generateExamples(projectPath);
    }

    // Architecture notes
    content += `## Architecture\n\n`;
    content += this.describeArchitecture(projectPath);

    return content;
  }

  private listKeyFiles(projectPath: string): string {
    const keyFiles = [
      'package.json',
      'tsconfig.json',
      'README.md',
      'AGENTS.md',
      'openapi/openapi.yaml',
      'src/server.ts',
      'src/index.ts',
    ];

    let section = '';

    keyFiles.forEach((file) => {
      const filePath = path.join(projectPath, file);
      if (fs.existsSync(filePath)) {
        section += `- ${file}\n`;
      }
    });

    section += `\n`;
    return section;
  }

  private listDependencies(projectPath: string): string {
    const packageJsonPath = path.join(projectPath, 'package.json');
    let section = '';

    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, 'utf-8')
        );
        const deps = packageJson.dependencies || {};
        const devDeps = packageJson.devDependencies || {};

        section += `**Production:**\n`;
        Object.keys(deps).forEach((dep) => {
          section += `- ${dep}: ${deps[dep]}\n`;
        });
        section += `\n`;

        if (Object.keys(devDeps).length > 0) {
          section += `**Development:**\n`;
          Object.keys(devDeps)
            .slice(0, 10)
            .forEach((dep) => {
              section += `- ${dep}: ${devDeps[dep]}\n`;
            });
          if (Object.keys(devDeps).length > 10) {
            section += `- ... and ${Object.keys(devDeps).length - 10} more\n`;
          }
          section += `\n`;
        }
      } catch {
        section += `See package.json for dependencies\n\n`;
      }
    }

    return section;
  }

  private listScripts(projectPath: string): string {
    const packageJsonPath = path.join(projectPath, 'package.json');
    let section = '';

    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, 'utf-8')
        );
        const scripts = packageJson.scripts || {};

        Object.keys(scripts).forEach((script) => {
          section += `- \`npm run ${script}\`: ${scripts[script]}\n`;
        });
        section += `\n`;
      } catch {
        section += `See package.json for scripts\n\n`;
      }
    }

    return section;
  }

  private generateExamples(projectPath: string): string {
    let section = '';

    section += `### Starting the service\n\n`;
    section += `\`\`\`bash\n`;
    section += `npm install\n`;
    section += `npm run build\n`;
    section += `npm start\n`;
    section += `\`\`\`\n\n`;

    section += `### Running tests\n\n`;
    section += `\`\`\`bash\n`;
    section += `npm test\n`;
    section += `\`\`\`\n\n`;

    return section;
  }

  private describeArchitecture(projectPath: string): string {
    let section = '';

    // Check for TypeScript
    const tsconfigPath = path.join(projectPath, 'tsconfig.json');
    if (fs.existsSync(tsconfigPath)) {
      section += `- **Language:** TypeScript\n`;
    }

    // Check for Express
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, 'utf-8')
        );
        const deps = packageJson.dependencies || {};

        if (deps.express) {
          section += `- **Framework:** Express.js\n`;
        }

        if (deps.zod) {
          section += `- **Validation:** Zod schemas\n`;
        }

        if (deps['express-openapi-validator']) {
          section += `- **API Spec:** OpenAPI 3.1\n`;
        }
      } catch {
        // Skip
      }
    }

    // Check for src structure
    const srcPath = path.join(projectPath, 'src');
    if (fs.existsSync(srcPath)) {
      section += `- **Structure:** Modular architecture with separate layers\n`;
    }

    section += `\n`;

    return section;
  }
}
