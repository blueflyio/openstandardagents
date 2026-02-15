/**
 * Skills Export Service
 * Export Claude Skills as npm packages for installation
 */

import { injectable } from 'inversify';
import { execFileSync } from 'child_process';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { z } from 'zod';
import { sanitizePackageName } from '../../adapters/base/common-file-generator.js';

/**
 * Export Options
 */
export interface SkillExportOptions {
  skillPath: string;
  scope?: string; // npm scope (e.g., '@claude-skills')
  publish?: boolean; // Publish to npm registry
  dryRun?: boolean;
  install?: boolean; // Install to ~/.claude/skills/
  registry?: string; // Custom npm registry URL
  access?: 'public' | 'restricted'; // npm publish access level
}

/**
 * Export Result
 */
export interface SkillExportResult {
  success: boolean;
  outputPath?: string;
  packageName?: string;
  files?: string[];
  message?: string;
  errors?: string[];
  published?: boolean;
  installed?: boolean;
  installPath?: string;
}

/**
 * Skill Frontmatter Schema
 */
const SkillFrontmatterSchema = z.object({
  name: z.string(),
  description: z.string(),
  trigger_keywords: z.array(z.string()),
  version: z.string().optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type SkillFrontmatter = z.infer<typeof SkillFrontmatterSchema>;

/**
 * Package.json Schema
 */
interface PackageJson {
  name: string;
  version: string;
  description: string;
  main: string;
  types: string;
  scripts: {
    install: string;
  };
  keywords: string[];
  author?: string;
  license: string;
  files: string[];
  ossa?: {
    type: 'claude-skill';
    skillPath: string;
  };
}

@injectable()
export class SkillsExportService {
  /**
   * Export Claude Skill as npm package
   */
  async export(options: SkillExportOptions): Promise<SkillExportResult> {
    const {
      skillPath,
      scope = '@claude-skills',
      dryRun,
      install,
      publish,
      registry,
      access = 'public',
    } = options;

    try {
      // Validate skill path
      const skillFile = await this.findSkillFile(skillPath);

      // Parse SKILL.md
      const { frontmatter, content } = await this.parseSkillFile(skillFile);

      // Generate npm package name
      const packageName = `${scope}/${sanitizePackageName(frontmatter.name)}`;

      // Create output directory
      const outputPath = path.join(
        process.cwd(),
        'dist',
        'skills',
        frontmatter.name
      );

      if (!dryRun) {
        await fs.mkdir(outputPath, { recursive: true });
      }

      // Generate package files
      const files = await this.generatePackageFiles(
        outputPath,
        frontmatter,
        content,
        packageName,
        skillPath,
        dryRun
      );

      const result: SkillExportResult = {
        success: true,
        outputPath,
        packageName,
        files,
        message: dryRun
          ? 'Dry run completed (no files written)'
          : `Skill exported successfully: ${packageName}`,
      };

      // Publish to npm registry if requested
      if (publish && !dryRun) {
        const publishResult = this.publishToNpm(outputPath, registry, access);
        result.published = publishResult.success;
        if (!publishResult.success) {
          result.errors = [
            ...(result.errors || []),
            publishResult.error || 'npm publish failed',
          ];
        } else {
          result.message = `Skill published to npm: ${packageName}`;
        }
      }

      // Install to ~/.claude/skills/ if requested
      if (install && !dryRun) {
        await this.installToClaudeSkills(skillPath, frontmatter.name);
        const installValid = this.validateInstallation(frontmatter.name);
        result.installed = installValid;
        result.installPath = path.join(
          process.env.HOME || process.env.USERPROFILE || '~',
          '.claude',
          'skills',
          frontmatter.name
        );
        if (!installValid) {
          result.errors = [
            ...(result.errors || []),
            `Installation verification failed: skill '${frontmatter.name}' not found in ~/.claude/skills/`,
          ];
        }
      }

      return result;
    } catch (error) {
      return {
        success: false,
        message: 'Failed to export skill',
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Find SKILL.md file in directory or use path directly
   */
  private async findSkillFile(skillPath: string): Promise<string> {
    const stat = await fs.stat(skillPath);

    if (stat.isDirectory()) {
      const skillFile = path.join(skillPath, 'SKILL.md');
      try {
        await fs.access(skillFile);
        return skillFile;
      } catch {
        throw new Error(
          `SKILL.md not found in directory: ${skillPath}\nExpected: ${skillFile}`
        );
      }
    } else if (stat.isFile()) {
      if (path.basename(skillPath).toLowerCase() === 'skill.md') {
        return skillPath;
      }
      throw new Error(`File must be named SKILL.md, got: ${skillPath}`);
    }

    throw new Error(`Invalid skill path: ${skillPath}`);
  }

  /**
   * Parse SKILL.md file
   */
  private async parseSkillFile(
    skillFile: string
  ): Promise<{ frontmatter: SkillFrontmatter; content: string }> {
    const content = await fs.readFile(skillFile, 'utf-8');

    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      throw new Error('No frontmatter found in SKILL.md');
    }

    const frontmatterRaw = yaml.parse(frontmatterMatch[1]);
    const frontmatter = SkillFrontmatterSchema.parse(frontmatterRaw);

    return { frontmatter, content };
  }

  /**
   * Generate npm package files
   */
  private async generatePackageFiles(
    outputPath: string,
    frontmatter: SkillFrontmatter,
    content: string,
    packageName: string,
    originalSkillPath: string,
    dryRun?: boolean
  ): Promise<string[]> {
    const files: string[] = [];

    // Generate package.json
    const packageJson = this.generatePackageJson(
      packageName,
      frontmatter,
      originalSkillPath
    );
    files.push('package.json');
    if (!dryRun) {
      await fs.writeFile(
        path.join(outputPath, 'package.json'),
        JSON.stringify(packageJson, null, 2),
        'utf-8'
      );
    }

    // Copy SKILL.md
    files.push('SKILL.md');
    if (!dryRun) {
      await fs.writeFile(path.join(outputPath, 'SKILL.md'), content, 'utf-8');
    }

    // Generate README.md
    const readme = this.generateReadme(frontmatter, packageName);
    files.push('README.md');
    if (!dryRun) {
      await fs.writeFile(path.join(outputPath, 'README.md'), readme, 'utf-8');
    }

    // Generate TypeScript types
    const types = this.generateTypes(frontmatter);
    files.push('index.d.ts');
    if (!dryRun) {
      await fs.writeFile(path.join(outputPath, 'index.d.ts'), types, 'utf-8');
    }

    // Generate install script
    const installScript = this.generateInstallScript(frontmatter.name);
    files.push('install.js');
    if (!dryRun) {
      await fs.writeFile(
        path.join(outputPath, 'install.js'),
        installScript,
        'utf-8'
      );
    }

    // Copy additional directories if they exist
    const skillDir = path.dirname(originalSkillPath);
    const additionalDirs = ['templates', 'knowledge', 'examples'];

    for (const dir of additionalDirs) {
      const sourcePath = path.join(skillDir, dir);
      try {
        const stat = await fs.stat(sourcePath);
        if (stat.isDirectory() && !dryRun) {
          const destPath = path.join(outputPath, dir);
          await this.copyDirectory(sourcePath, destPath);
          files.push(`${dir}/`);
        }
      } catch {
        // Directory doesn't exist, skip
      }
    }

    return files;
  }

  /**
   * Generate package.json
   */
  private generatePackageJson(
    packageName: string,
    frontmatter: SkillFrontmatter,
    originalSkillPath: string
  ): PackageJson {
    return {
      name: packageName,
      version: frontmatter.version || '1.0.0',
      description: frontmatter.description,
      main: 'SKILL.md',
      types: 'index.d.ts',
      scripts: {
        install: 'node install.js',
      },
      keywords: [
        'claude',
        'claude-skill',
        'ossa',
        'ai',
        'agent',
        ...(frontmatter.tags || []),
        ...(frontmatter.trigger_keywords || []),
      ],
      author: frontmatter.author,
      license: 'MIT',
      files: [
        'SKILL.md',
        'README.md',
        'index.d.ts',
        'install.js',
        'templates/**',
        'knowledge/**',
        'examples/**',
      ],
      ossa: {
        type: 'claude-skill',
        skillPath: originalSkillPath,
      },
    };
  }

  /**
   * Generate README.md
   */
  private generateReadme(
    frontmatter: SkillFrontmatter,
    packageName: string
  ): string {
    let content = `# ${frontmatter.name}\n\n`;
    content += `${frontmatter.description}\n\n`;

    content += `## Installation\n\n`;
    content += `\`\`\`bash\n`;
    content += `npm install ${packageName}\n`;
    content += `\`\`\`\n\n`;

    content += `This will automatically install the skill to \`~/.claude/skills/\`.\n\n`;

    content += `## Manual Installation\n\n`;
    content += `\`\`\`bash\n`;
    content += `# Clone or copy SKILL.md to Claude skills directory\n`;
    content += `cp node_modules/${packageName}/SKILL.md ~/.claude/skills/${frontmatter.name}/\n`;
    content += `\`\`\`\n\n`;

    content += `## Trigger Keywords\n\n`;
    for (const keyword of frontmatter.trigger_keywords) {
      content += `- ${keyword}\n`;
    }
    content += `\n`;

    if (frontmatter.tags && frontmatter.tags.length > 0) {
      content += `## Tags\n\n`;
      for (const tag of frontmatter.tags) {
        content += `\`${tag}\` `;
      }
      content += `\n\n`;
    }

    content += `## About Claude Skills\n\n`;
    content += `Claude Skills are reusable prompt templates that enhance Claude's capabilities for specific tasks.\n\n`;

    content += `## Generated by OSSA\n\n`;
    content += `This skill package was generated using [@bluefly/openstandardagents](https://www.npmjs.com/package/@bluefly/openstandardagents)\n`;

    return content;
  }

  /**
   * Generate TypeScript types — produces skill-specific literal types
   * from trigger_keywords and tags for better IDE autocomplete.
   */
  private generateTypes(frontmatter: SkillFrontmatter): string {
    let content = `/**\n`;
    content += ` * Claude Skill: ${frontmatter.name}\n`;
    content += ` * ${frontmatter.description}\n`;
    content += ` *\n`;
    content += ` * @generated by @bluefly/openstandardagents skills-export\n`;
    content += ` */\n\n`;

    // Generate literal union type for trigger keywords
    if (frontmatter.trigger_keywords.length > 0) {
      const literals = frontmatter.trigger_keywords
        .map((k) => `  | '${k.replace(/'/g, "\\'")}'`)
        .join('\n');
      content += `export type TriggerKeyword =\n${literals};\n\n`;
    } else {
      content += `export type TriggerKeyword = string;\n\n`;
    }

    // Generate literal union type for tags
    if (frontmatter.tags && frontmatter.tags.length > 0) {
      const literals = frontmatter.tags
        .map((t) => `  | '${t.replace(/'/g, "\\'")}'`)
        .join('\n');
      content += `export type SkillTag =\n${literals};\n\n`;
    } else {
      content += `export type SkillTag = string;\n\n`;
    }

    content += `export interface ClaudeSkillMetadata {\n`;
    content += `  name: '${frontmatter.name.replace(/'/g, "\\'")}';\n`;
    content += `  description: string;\n`;
    content += `  triggerKeywords: TriggerKeyword[];\n`;
    content += `  version: '${(frontmatter.version || '1.0.0').replace(/'/g, "\\'")}';\n`;
    content += `  author?: string;\n`;
    content += `  tags?: SkillTag[];\n`;
    content += `}\n\n`;

    content += `export interface ClaudeSkill {\n`;
    content += `  metadata: ClaudeSkillMetadata;\n`;
    content += `  skillPath: string;\n`;
    content += `}\n\n`;

    content += `declare const skill: ClaudeSkill;\n`;
    content += `export default skill;\n`;

    return content;
  }

  /**
   * Generate install script (runs post-install)
   */
  private generateInstallScript(skillName: string): string {
    return `#!/usr/bin/env node
/**
 * Post-install script to copy skill to ~/.claude/skills/
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const homeDir = os.homedir();
const claudeSkillsDir = path.join(homeDir, '.claude', 'skills');
const targetDir = path.join(claudeSkillsDir, '${skillName}');

try {
  // Create ~/.claude/skills/ if it doesn't exist
  if (!fs.existsSync(claudeSkillsDir)) {
    fs.mkdirSync(claudeSkillsDir, { recursive: true });
  }

  // Create target directory
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Copy SKILL.md
  const skillSource = path.join(__dirname, 'SKILL.md');
  const skillTarget = path.join(targetDir, 'SKILL.md');
  fs.copyFileSync(skillSource, skillTarget);

  // Copy additional directories if they exist
  const dirs = ['templates', 'knowledge', 'examples'];
  for (const dir of dirs) {
    const sourcePath = path.join(__dirname, dir);
    if (fs.existsSync(sourcePath)) {
      const targetPath = path.join(targetDir, dir);
      fs.cpSync(sourcePath, targetPath, { recursive: true });
    }
  }

  console.log('✓ Skill installed to: ' + targetDir);
} catch (error) {
  console.error('Failed to install skill:', error.message);
  process.exit(1);
}
`;
  }

  /**
   * Copy directory recursively
   */
  private async copyDirectory(source: string, dest: string): Promise<void> {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(source, { withFileTypes: true });

    for (const entry of entries) {
      const sourcePath = path.join(source, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(sourcePath, destPath);
      } else {
        await fs.copyFile(sourcePath, destPath);
      }
    }
  }

  /**
   * Install skill to ~/.claude/skills/
   */
  private async installToClaudeSkills(
    skillPath: string,
    skillName: string
  ): Promise<void> {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '~';
    const claudeSkillsDir = path.join(homeDir, '.claude', 'skills');
    const targetDir = path.join(claudeSkillsDir, skillName);

    // Create target directory
    await fs.mkdir(targetDir, { recursive: true });

    // Copy SKILL.md
    const skillFile = await this.findSkillFile(skillPath);
    await fs.copyFile(skillFile, path.join(targetDir, 'SKILL.md'));

    // Copy additional directories
    const skillDir = path.dirname(skillFile);
    const additionalDirs = ['templates', 'knowledge', 'examples'];

    for (const dir of additionalDirs) {
      const sourcePath = path.join(skillDir, dir);
      try {
        const stat = await fs.stat(sourcePath);
        if (stat.isDirectory()) {
          await this.copyDirectory(sourcePath, path.join(targetDir, dir));
        }
      } catch {
        // Directory doesn't exist, skip
      }
    }
  }

  /**
   * Publish exported skill package to npm registry.
   * Uses execFileSync with array arguments to prevent command injection.
   * Registry URL is validated before use.
   */
  private publishToNpm(
    packagePath: string,
    registry?: string,
    access: 'public' | 'restricted' = 'public'
  ): { success: boolean; error?: string } {
    // Validate registry URL if provided (prevent command injection)
    if (registry && !/^https?:\/\/[\w.-]+(:\d+)?\/?/.test(registry)) {
      return {
        success: false,
        error: `Invalid registry URL: ${registry}`,
      };
    }

    // Verify npm auth first
    try {
      execFileSync('npm', ['whoami'], {
        cwd: packagePath,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch {
      return {
        success: false,
        error: 'Not authenticated with npm. Run `npm login` first.',
      };
    }

    // Build publish command with safe array arguments (no shell injection)
    const args = ['publish', `--access=${access}`];
    if (registry) {
      args.push(`--registry=${registry}`);
    }

    try {
      // Use execFileSync with array args (safe from command injection)
      execFileSync('npm', args, {
        cwd: packagePath,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      return { success: true };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `npm publish failed: ${msg}`,
      };
    }
  }

  /**
   * Validate that a skill was installed correctly to ~/.claude/skills/
   * Checks that the SKILL.md file exists and has valid frontmatter.
   * Uses try-catch instead of existsSync to avoid race conditions.
   */
  private validateInstallation(skillName: string): boolean {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '~';
    const skillFile = path.join(
      homeDir,
      '.claude',
      'skills',
      skillName,
      'SKILL.md'
    );

    // Use try-catch instead of existsSync check to prevent race conditions
    // (file could be deleted between existsSync and readFileSync)
    try {
      const content = fsSync.readFileSync(skillFile, 'utf-8');
      const match = content.match(/^---\n([\s\S]*?)\n---/);
      if (!match) return false;

      const frontmatter = yaml.parse(match[1]);
      return !!(frontmatter?.name && frontmatter?.trigger_keywords);
    } catch (error) {
      // File doesn't exist or is unreadable
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        console.warn(`Skill file not found: ${skillFile}`);
      }
      return false;
    }
  }
}
