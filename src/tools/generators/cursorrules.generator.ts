import * as fs from 'fs';
import * as path from 'path';

export interface CursorrulesOptions {
  projectPath: string;
  rules?: string[];
}

export class CursorrulesGenerator {
  /**
   * Generate .cursorrules file
   */
  generate(options: CursorrulesOptions): string {
    const { projectPath, rules = [] } = options;

    let content = '';

    // Header
    content += `# Cursor Rules for ${path.basename(projectPath)}\n\n`;

    // General rules
    content += this.generateGeneralRules();

    // TypeScript rules
    const tsconfigPath = path.join(projectPath, 'tsconfig.json');
    if (fs.existsSync(tsconfigPath)) {
      content += this.generateTypeScriptRules();
    }

    // Testing rules
    content += this.generateTestingRules(projectPath);

    // Git rules
    content += this.generateGitRules();

    // Custom rules
    if (rules.length > 0) {
      content += `## Custom Project Rules\n\n`;
      rules.forEach(rule => {
        content += `- ${rule}\n`;
      });
      content += `\n`;
    }

    // Code style
    content += this.generateCodeStyleRules(projectPath);

    return content;
  }

  private generateGeneralRules(): string {
    let section = `## General Guidelines\n\n`;

    section += `- Write clean, maintainable, and well-documented code\n`;
    section += `- Follow SOLID principles and DRY (Don't Repeat Yourself)\n`;
    section += `- Use meaningful variable and function names\n`;
    section += `- Keep functions small and focused on a single responsibility\n`;
    section += `- Add comments for complex logic, not obvious code\n`;
    section += `- Handle errors gracefully with proper error messages\n`;
    section += `- Validate all inputs and sanitize user data\n\n`;

    return section;
  }

  private generateTypeScriptRules(): string {
    let section = `## TypeScript Guidelines\n\n`;

    section += `- Enable strict mode in tsconfig.json\n`;
    section += `- Avoid using \`any\` type - use \`unknown\` or specific types\n`;
    section += `- Define interfaces for object shapes\n`;
    section += `- Use type aliases for complex types\n`;
    section += `- Leverage union and intersection types appropriately\n`;
    section += `- Use generics for reusable components\n`;
    section += `- Prefer \`const\` over \`let\`, avoid \`var\`\n`;
    section += `- Use optional chaining (?.) and nullish coalescing (??)\n\n`;

    return section;
  }

  private generateTestingRules(projectPath: string): string {
    let section = `## Testing Guidelines\n\n`;

    const packageJsonPath = path.join(projectPath, 'package.json');
    let hasJest = false;

    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        hasJest = !!deps.jest;
      } catch {
        // Skip
      }
    }

    section += `- Write tests for all new features and bug fixes\n`;
    section += `- Aim for high test coverage (>80%)\n`;
    section += `- Use descriptive test names that explain what is being tested\n`;
    section += `- Follow AAA pattern: Arrange, Act, Assert\n`;
    section += `- Mock external dependencies in unit tests\n`;
    section += `- Keep tests independent and isolated\n`;

    if (hasJest) {
      section += `- Use Jest for testing framework\n`;
    }

    section += `\n`;

    return section;
  }

  private generateGitRules(): string {
    let section = `## Git Commit Guidelines\n\n`;

    section += `- Use conventional commit format: \`type(scope): message\`\n`;
    section += `- Types: feat, fix, docs, style, refactor, test, chore\n`;
    section += `- Keep commit messages clear and descriptive\n`;
    section += `- Reference issue numbers in commit messages\n`;
    section += `- Don't commit directly to main/development branches\n`;
    section += `- Always run tests before committing\n`;
    section += `- No "WIP" or "temp" commits in main branches\n\n`;

    return section;
  }

  private generateCodeStyleRules(projectPath: string): string {
    let section = `## Code Style\n\n`;

    section += `- Use 2 spaces for indentation (not tabs)\n`;
    section += `- Use single quotes for strings (except when avoiding escapes)\n`;
    section += `- Add trailing commas in multi-line objects/arrays\n`;
    section += `- Keep lines under 100 characters when reasonable\n`;
    section += `- Use semicolons at end of statements\n`;
    section += `- Organize imports: external, internal, relative\n`;
    section += `- Remove unused imports and variables\n`;
    section += `- Use async/await over raw promises when possible\n\n`;

    // Check for Prettier
    const prettierPath = path.join(projectPath, '.prettierrc');
    if (fs.existsSync(prettierPath)) {
      section += `**Note:** This project uses Prettier. Run \`npm run format\` before committing.\n\n`;
    }

    // Check for ESLint
    const eslintPath = path.join(projectPath, '.eslintrc.js');
    if (fs.existsSync(eslintPath) || fs.existsSync(path.join(projectPath, '.eslintrc.json'))) {
      section += `**Note:** This project uses ESLint. Run \`npm run lint\` to check for issues.\n\n`;
    }

    return section;
  }
}
