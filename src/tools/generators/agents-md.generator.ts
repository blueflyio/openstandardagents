import * as fs from 'fs';
import * as path from 'path';

export interface AgentsMdOptions {
  projectPath: string;
  includeRules?: boolean;
  includeCommands?: boolean;
  includeStructure?: boolean;
}

export class AgentsMdGenerator {
  /**
   * Generate AGENTS.md following agents.md standard
   * Reference: https://agents.md
   */
  generate(options: AgentsMdOptions): string {
    const {
      projectPath,
      includeRules = true,
      includeCommands = true,
      includeStructure = true,
    } = options;

    let content = '';

    // Title
    const projectName = path.basename(projectPath);
    content += `# ${projectName}\n\n`;

    // Overview section
    content += this.generateOverview(projectPath);

    // Build commands
    if (includeCommands) {
      content += this.generateBuildCommands(projectPath);
      content += this.generateTestCommands(projectPath);
    }

    // Code style
    content += this.generateCodeStyle(projectPath);

    // Development workflow
    content += this.generateWorkflow(projectPath);

    // Rules
    if (includeRules) {
      content += this.generateRules(projectPath);
    }

    // Project structure
    if (includeStructure) {
      content += this.generateStructure(projectPath);
    }

    // Troubleshooting
    content += this.generateTroubleshooting();

    // Security
    content += this.generateSecurity();

    return content;
  }

  private generateOverview(projectPath: string): string {
    let section = `## Project Overview\n\n`;

    // Try to read package.json for description
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        section += `${packageJson.description || 'No description available'}\n\n`;
        section += `**Version:** ${packageJson.version || 'unknown'}\n\n`;
      } catch {
        section += `No description available\n\n`;
      }
    }

    return section;
  }

  private generateBuildCommands(projectPath: string): string {
    let section = `## Build Commands\n\n`;

    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const scripts = packageJson.scripts || {};

        section += `\`\`\`bash\n`;
        section += `# Install dependencies\n`;
        section += `npm install\n\n`;

        if (scripts.build) {
          section += `# Build project\n`;
          section += `npm run build\n\n`;
        }

        if (scripts.dev || scripts.start) {
          section += `# Start development server\n`;
          section += `npm run ${scripts.dev ? 'dev' : 'start'}\n\n`;
        }

        section += `\`\`\`\n\n`;
      } catch {
        section += `See package.json for available commands\n\n`;
      }
    }

    return section;
  }

  private generateTestCommands(projectPath: string): string {
    let section = `## Testing Commands\n\n`;

    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const scripts = packageJson.scripts || {};

        section += `\`\`\`bash\n`;

        if (scripts.test) {
          section += `# Run tests\n`;
          section += `npm test\n\n`;
        }

        if (scripts['test:watch']) {
          section += `# Run tests in watch mode\n`;
          section += `npm run test:watch\n\n`;
        }

        if (scripts['test:coverage']) {
          section += `# Run tests with coverage\n`;
          section += `npm run test:coverage\n\n`;
        }

        if (scripts.lint) {
          section += `# Lint code\n`;
          section += `npm run lint\n\n`;
        }

        section += `\`\`\`\n\n`;
      } catch {
        section += `See package.json for available test commands\n\n`;
      }
    }

    return section;
  }

  private generateCodeStyle(projectPath: string): string {
    let section = `## Code Style Guidelines\n\n`;

    // Check for TypeScript
    const tsconfigPath = path.join(projectPath, 'tsconfig.json');
    if (fs.existsSync(tsconfigPath)) {
      section += `- **Language:** TypeScript (strict mode)\n`;
      section += `- **Style:** Follow TSLint/ESLint rules\n`;
    } else {
      section += `- **Language:** JavaScript\n`;
    }

    section += `- **Formatting:** Use Prettier (if configured)\n`;
    section += `- **Imports:** Organize imports alphabetically\n`;
    section += `- **Naming:** camelCase for variables/functions, PascalCase for classes\n\n`;

    return section;
  }

  private generateWorkflow(projectPath: string): string {
    let section = `## Development Workflow\n\n`;

    section += `1. **Create feature branch:** \`git checkout -b feature/your-feature\`\n`;
    section += `2. **Make changes:** Write code following style guidelines\n`;
    section += `3. **Run tests:** \`npm test\`\n`;
    section += `4. **Commit:** Use conventional commits format\n`;
    section += `5. **Push:** \`git push origin feature/your-feature\`\n`;
    section += `6. **Create MR:** Open merge request for review\n\n`;

    return section;
  }

  private generateRules(projectPath: string): string {
    let section = `## Important Rules\n\n`;

    section += `### DO\n\n`;
    section += `- Write tests for new features\n`;
    section += `- Follow TypeScript strict mode rules\n`;
    section += `- Use meaningful variable names\n`;
    section += `- Document complex logic with comments\n`;
    section += `- Keep functions small and focused\n`;
    section += `- Use async/await for asynchronous code\n\n`;

    section += `### DON'T\n\n`;
    section += `- Commit directly to main/development branches\n`;
    section += `- Leave console.log statements in production code\n`;
    section += `- Use \`any\` type unless absolutely necessary\n`;
    section += `- Ignore TypeScript errors\n`;
    section += `- Skip writing tests\n`;
    section += `- Push without running tests first\n\n`;

    return section;
  }

  private generateStructure(projectPath: string): string {
    let section = `## Project Structure\n\n`;

    section += `\`\`\`\n`;

    // Try to build a basic structure
    try {
      const items = fs.readdirSync(projectPath);
      const dirs = items.filter(item => {
        const stat = fs.statSync(path.join(projectPath, item));
        return stat.isDirectory() && !item.startsWith('.');
      });

      dirs.forEach(dir => {
        section += `${dir}/\n`;

        // Show one level deep for src
        if (dir === 'src') {
          const srcPath = path.join(projectPath, dir);
          const srcItems = fs.readdirSync(srcPath);
          srcItems.forEach(item => {
            const stat = fs.statSync(path.join(srcPath, item));
            if (stat.isDirectory()) {
              section += `  ${item}/\n`;
            }
          });
        }
      });
    } catch {
      section += `See project directory for structure\n`;
    }

    section += `\`\`\`\n\n`;

    return section;
  }

  private generateTroubleshooting(): string {
    let section = `## Troubleshooting\n\n`;

    section += `### Build Failures\n\n`;
    section += `1. Clear node_modules: \`rm -rf node_modules\`\n`;
    section += `2. Clear npm cache: \`npm cache clean --force\`\n`;
    section += `3. Reinstall: \`npm install\`\n\n`;

    section += `### Test Failures\n\n`;
    section += `1. Check for outdated snapshots\n`;
    section += `2. Verify test environment variables\n`;
    section += `3. Clear test cache if using Jest\n\n`;

    return section;
  }

  private generateSecurity(): string {
    let section = `## Security Considerations\n\n`;

    section += `- Never commit secrets or credentials\n`;
    section += `- Use environment variables for sensitive data\n`;
    section += `- Keep dependencies up to date\n`;
    section += `- Run security audits: \`npm audit\`\n`;
    section += `- Follow principle of least privilege\n\n`;

    section += `---\n\n`;
    section += `*Generated following https://agents.md standard*\n`;

    return section;
  }
}
