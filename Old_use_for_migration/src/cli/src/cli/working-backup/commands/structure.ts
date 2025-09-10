#!/usr/bin/env node

/**
 * OSSA CLI Project Structure Commands
 * Implements the 3-level deep project structure standard
 */

import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';
import ora from 'ora';
import inquirer from 'inquirer';
import yaml from 'yaml';

interface ProjectStructure {
  src: {
    api?: {
      http?: string[];
      graphql?: string[];
      controllers?: string[];
    };
    cli?: {
      commands?: string[];
      utils?: string[];
    };
    config?: string[];
    services?: string[];
    types?: string[];
    utils?: string[];
    ui?: {
      app?: string[];
      components?: string[];
      features?: string[];
      services?: string[];
    };
  };
  tests?: {
    unit?: string[];
    integration?: string[];
    e2e?: string[];
  };
  docs?: {
    architecture?: string[];
    guides?: string[];
  };
  examples?: {
    basic?: string[];
    advanced?: string[];
  };
  infrastructure?: {
    helm?: string[];
    compose?: string[];
  };
  '.agents'?: {
    'workspace.json'?: boolean;
    agents?: string[];
  };
}

interface ProjectAnalysis {
  name: string;
  path: string;
  type: 'drupal-module' | 'npm-package' | 'ai-model' | 'platform';
  currentStructure: string[];
  recommendedStructure: ProjectStructure;
  violations: string[];
  cleanupItems: string[];
  score: number;
}

export function createStructureCommands(): Command {
  const cmd = new Command('structure')
    .description('Project structure validation and cleanup system');

  cmd.command('analyze')
    .description('Analyze project structure compliance')
    .argument('[project]', 'Specific project name to analyze')
    .option('-w, --workspace <path>', 'Workspace root path', '/Users/flux423/Sites/LLM')
    .option('--format <type>', 'Output format (table|json|detailed)', 'detailed')
    .option('--min-score <score>', 'Minimum compliance score (0-100)', '70')
    .action(async (project, options) => {
      console.log(chalk.blue('🔍 Analyzing project structure compliance...'));
      
      const analyzer = new ProjectStructureAnalyzer(options.workspace);
      const analyses = project 
        ? [await analyzer.analyzeProject(project)].filter(a => a !== null) as ProjectAnalysis[]
        : await analyzer.analyzeAllProjects();
      
      const filtered = analyses.filter(a => a.score >= parseInt(options.minScore));
      
      if (options.format === 'json') {
        console.log(JSON.stringify(filtered, null, 2));
      } else if (options.format === 'table') {
        console.table(filtered.map(a => ({
          Project: a.name,
          Type: a.type,
          Score: `${a.score}%`,
          Violations: a.violations.length,
          'Cleanup Items': a.cleanupItems.length
        })));
      } else {
        filtered.forEach(analysis => displayDetailedAnalysis(analysis));
      }
    });

  cmd.command('validate')
    .description('Validate projects against 3-level structure standard')
    .argument('[project]', 'Specific project name to validate')
    .option('-w, --workspace <path>', 'Workspace root path', '/Users/flux423/Sites/LLM')
    .option('--fix', 'Automatically fix structure violations')
    .action(async (project, options) => {
      console.log(chalk.blue('✅ Validating project structure...'));
      
      const analyzer = new ProjectStructureAnalyzer(options.workspace);
      const validator = new StructureValidator(options.workspace);
      
      const analyses = project 
        ? [await analyzer.analyzeProject(project)].filter(a => a !== null) as ProjectAnalysis[]
        : await analyzer.analyzeAllProjects();
      
      const violations = analyses.filter(a => a.violations.length > 0);
      
      if (violations.length === 0) {
        console.log(chalk.green('✅ All projects comply with structure standard'));
        return;
      }
      
      console.log(chalk.yellow(`Found ${violations.length} projects with violations:`));
      violations.forEach(v => {
        console.log(`\n${chalk.bold(v.name)} (Score: ${v.score}%)`);
        v.violations.forEach(violation => 
          console.log(`  ${chalk.red('❌')} ${violation}`)
        );
      });
      
      if (options.fix) {
        const { shouldFix } = await inquirer.prompt([{
          type: 'confirm',
          name: 'shouldFix',
          message: 'Apply automatic fixes to all violations?',
          default: false
        }]);
        
        if (shouldFix) {
          for (const analysis of violations) {
            await validator.fixProject(analysis);
          }
          console.log(chalk.green('✅ All fixable violations have been resolved'));
        }
      }
    });

  cmd.command('cleanup')
    .description('Clean up projects (temp files, misplaced files, empty directories)')
    .argument('[project]', 'Specific project name to clean')
    .option('-w, --workspace <path>', 'Workspace root path', '/Users/flux423/Sites/LLM')
    .option('--dry-run', 'Show what would be cleaned without doing it')
    .option('--aggressive', 'Include aggressive cleanup (node_modules, dist, .DS_Store)')
    .action(async (project, options) => {
      console.log(chalk.blue('🧹 Cleaning up project files...'));
      
      const cleaner = new ProjectCleaner(options.workspace);
      
      if (project) {
        await cleaner.cleanProject(project, {
          dryRun: options.dryRun,
          aggressive: options.aggressive
        });
      } else {
        await cleaner.cleanAllProjects({
          dryRun: options.dryRun,
          aggressive: options.aggressive
        });
      }
    });

  cmd.command('standardize')
    .description('Standardize project to 3-level structure')
    .argument('<project>', 'Project name to standardize')
    .option('-w, --workspace <path>', 'Workspace root path', '/Users/flux423/Sites/LLM')
    .option('--template <type>', 'Structure template (npm|drupal|model|platform)', 'npm')
    .option('--dry-run', 'Show standardization plan without executing')
    .action(async (project, options) => {
      console.log(chalk.blue(`🔧 Standardizing project: ${project}`));
      
      const standardizer = new ProjectStandardizer(options.workspace);
      await standardizer.standardizeProject(project, {
        template: options.template,
        dryRun: options.dryRun
      });
    });

  return cmd;
}

class ProjectStructureAnalyzer {
  constructor(private workspaceRoot: string) {}

  async analyzeAllProjects(): Promise<ProjectAnalysis[]> {
    const spinner = ora('Discovering projects...').start();
    
    // Find all projects (those with package.json, composer.json, or .agents)
    const patterns = [
      '**/package.json',
      '**/composer.json', 
      '**/.agents'
    ];
    
    const projectPaths = new Set<string>();
    
    for (const pattern of patterns) {
      const files = await glob(path.join(this.workspaceRoot, pattern), {
        ignore: ['**/__DELETE_LATER*/**', '**/node_modules/**', '**/vendor/**']
      });
      
      files.forEach(file => {
        const projectPath = pattern.endsWith('.agents') 
          ? path.dirname(file)
          : path.dirname(file);
        projectPaths.add(projectPath);
      });
    }
    
    spinner.text = `Analyzing ${projectPaths.size} projects...`;
    
    const analyses = await Promise.all(
      Array.from(projectPaths).map(async projectPath => {
        const name = path.basename(projectPath);
        return this.analyzeProjectPath(projectPath, name);
      })
    );
    
    spinner.succeed(`Analyzed ${analyses.length} projects`);
    return analyses.filter(a => a !== null) as ProjectAnalysis[];
  }

  async analyzeProject(projectName: string): Promise<ProjectAnalysis | null> {
    // Find project by name
    const candidates = await glob(path.join(this.workspaceRoot, `**/${projectName}`), {
      ignore: ['**/__DELETE_LATER*/**', '**/node_modules/**']
    });
    
    if (candidates.length === 0) {
      console.log(chalk.red(`❌ Project '${projectName}' not found`));
      return null;
    }
    
    const projectPath = candidates[0];
    return this.analyzeProjectPath(projectPath, projectName);
  }

  private async analyzeProjectPath(projectPath: string, name: string): Promise<ProjectAnalysis | null> {
    try {
      const type = this.determineProjectType(projectPath);
      const currentStructure = await this.scanCurrentStructure(projectPath);
      const recommendedStructure = this.getRecommendedStructure(type);
      const violations = this.findViolations(currentStructure, recommendedStructure, type);
      const cleanupItems = await this.findCleanupItems(projectPath);
      const score = this.calculateScore(currentStructure, violations, cleanupItems);

      return {
        name,
        path: projectPath,
        type,
        currentStructure,
        recommendedStructure,
        violations,
        cleanupItems,
        score
      };
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  Failed to analyze ${name}: ${error}`));
      return null;
    }
  }

  private determineProjectType(projectPath: string): ProjectAnalysis['type'] {
    const relativePath = path.relative(this.workspaceRoot, projectPath);
    
    if (relativePath.includes('all_drupal_custom/modules')) {
      return 'drupal-module';
    } else if (relativePath.includes('common_npm')) {
      return 'npm-package';
    } else if (relativePath.includes('models')) {
      return 'ai-model';
    } else {
      return 'platform';
    }
  }

  private async scanCurrentStructure(projectPath: string): Promise<string[]> {
    try {
      const allFiles = await glob('**/*', {
        cwd: projectPath,
        ignore: ['node_modules/**', '__DELETE_LATER/**', '.git/**', 'vendor/**']
      });
      return allFiles;
    } catch {
      return [];
    }
  }

  private getRecommendedStructure(type: ProjectAnalysis['type']): ProjectStructure {
    const base: ProjectStructure = {
      src: {
        config: [],
        services: [],
        types: [],
        utils: []
      },
      tests: {
        unit: [],
        integration: [],
        e2e: []
      },
      docs: {
        architecture: [],
        guides: []
      },
      examples: {
        basic: [],
        advanced: []
      },
      '.agents': {
        'workspace.json': true,
        agents: []
      }
    };

    switch (type) {
      case 'npm-package':
        return {
          ...base,
          src: {
            ...base.src,
            api: {
              http: [],
              graphql: [],
              controllers: []
            },
            cli: {
              commands: [],
              utils: []
            },
            ui: {
              app: [],
              components: [],
              features: [],
              services: []
            }
          },
          infrastructure: {
            helm: [],
            compose: []
          }
        };
      
      case 'drupal-module':
        return {
          ...base,
          src: {
            ...base.src,
            // Drupal-specific structure follows Drupal conventions
          }
        };
      
      default:
        return base;
    }
  }

  private findViolations(current: string[], recommended: ProjectStructure, type: ProjectAnalysis['type']): string[] {
    const violations: string[] = [];
    
    // Check for files at root level (except allowed ones)
    const allowedRootFiles = [
      'package.json', 'composer.json', 'README.md', 'ROADMAP.md', 
      'LICENSE', 'tsconfig.json', '.gitignore', '.agents'
    ];
    
    const rootFiles = current.filter(file => 
      !file.includes('/') && 
      !allowedRootFiles.some(allowed => file.startsWith(allowed))
    );
    
    if (rootFiles.length > 0) {
      violations.push(`Root level has ${rootFiles.length} misplaced files: ${rootFiles.slice(0, 3).join(', ')}${rootFiles.length > 3 ? '...' : ''}`);
    }
    
    // Check for deep nesting (more than 3 levels)
    const deepFiles = current.filter(file => {
      const depth = file.split('/').length;
      return depth > 4; // s../src/api/http/file.ts = 4 levels max
    });
    
    if (deepFiles.length > 0) {
      violations.push(`${deepFiles.length} files exceed 3-level depth limit`);
    }
    
    // Check for missing required directories
    const hasSrc = current.some(file => file.startsWith('src/'));
    if (!hasSrc && type !== 'drupal-module') {
      violations.push('Missing src/ directory');
    }
    
    const hasAgents = current.some(file => file.startsWith('.agents/'));
    if (!hasAgents) {
      violations.push('Missing .agents/ directory');
    }
    
    return violations;
  }

  private async findCleanupItems(projectPath: string): Promise<string[]> {
    const items: string[] = [];
    
    try {
      // Find temp files and directories
      const tempPatterns = [
        '**/.DS_Store',
        '**/Thumbs.db', 
        '**/*.tmp',
        '**/*.temp',
        '**/tmp/**',
        '**/__pycache__/**',
        '**/.pytest_cache/**'
      ];
      
      for (const pattern of tempPatterns) {
        const files = await glob(pattern, {
          cwd: projectPath,
          ignore: ['node_modules/**']
        });
        items.push(...files.map(f => `Temp file: ${f}`));
      }
      
      // Find empty directories
      const allDirs = await glob('**/*/', {
        cwd: projectPath,
        ignore: ['node_modules/**', '.git/**']
      });
      
      for (const dir of allDirs) {
        const dirPath = path.join(projectPath, dir);
        try {
          const contents = await fs.readdir(dirPath);
          if (contents.length === 0) {
            items.push(`Empty directory: ${dir}`);
          }
        } catch {
          // Directory might not exist anymore
        }
      }
      
      // Find misplaced files (e.g., test files not in tests/)
      const testFiles = await glob('**/*.{test,spec}.{js,ts,jsx,tsx}', {
        cwd: projectPath,
        ignore: ['node_modules/**', 'tests/**', 'test/**', '__tests__/**']
      });
      
      items.push(...testFiles.map(f => `Misplaced test file: ${f}`));
      
    } catch (error) {
      // Ignore cleanup scanning errors
    }
    
    return items;
  }

  private calculateScore(structure: string[], violations: string[], cleanup: string[]): number {
    let score = 100;
    
    // Deduct points for violations
    score -= violations.length * 10;
    
    // Deduct points for cleanup items
    score -= Math.min(cleanup.length * 2, 30);
    
    // Add points for good structure
    const hasGoodStructure = structure.some(f => f.startsWith('src/')) ? 10 : 0;
    const hasTests = structure.some(f => f.startsWith('tests/')) ? 5 : 0;
    const hasDocs = structure.some(f => f.startsWith('docs/')) ? 5 : 0;
    
    score += hasGoodStructure + hasTests + hasDocs;
    
    return Math.max(0, Math.min(100, score));
  }
}

class StructureValidator {
  constructor(private workspaceRoot: string) {}

  async fixProject(analysis: ProjectAnalysis): Promise<void> {
    const spinner = ora(`Fixing ${analysis.name}...`).start();
    
    try {
      // Create missing directories
      await this.createMissingDirectories(analysis);
      
      // Move misplaced files
      await this.moveMisplacedFiles(analysis);
      
      spinner.succeed(`Fixed ${analysis.name}`);
    } catch (error) {
      spinner.fail(`Failed to fix ${analysis.name}: ${error}`);
    }
  }

  private async createMissingDirectories(analysis: ProjectAnalysis): Promise<void> {
    const requiredDirs = [
      'src',
      'tests/unit',
      'tests/integration', 
      'docs/architecture',
      '.agents/agents'
    ];
    
    for (const dir of requiredDirs) {
      const dirPath = path.join(analysis.path, dir);
      await fs.ensureDir(dirPath);
    }
  }

  private async moveMisplacedFiles(analysis: ProjectAnalysis): Promise<void> {
    // Move test files to tests/ directory
    const testFiles = analysis.currentStructure.filter(f => 
      /\.(test|spec)\.(js|ts|jsx|tsx)$/.test(f) && 
      !f.startsWith('tests/')
    );
    
    for (const testFile of testFiles) {
      const oldPath = path.join(analysis.path, testFile);
      const newPath = path.join(analysis.path, 'tests/unit', path.basename(testFile));
      
      await fs.ensureDir(path.dirname(newPath));
      await fs.move(oldPath, newPath);
    }
  }
}

class ProjectCleaner {
  constructor(private workspaceRoot: string) {}

  async cleanAllProjects(options: {dryRun?: boolean, aggressive?: boolean} = {}): Promise<void> {
    const analyzer = new ProjectStructureAnalyzer(this.workspaceRoot);
    const analyses = await analyzer.analyzeAllProjects();
    
    for (const analysis of analyses) {
      if (analysis.cleanupItems.length > 0) {
        await this.cleanProject(analysis.name, options);
      }
    }
  }

  async cleanProject(projectName: string, options: {dryRun?: boolean, aggressive?: boolean} = {}): Promise<void> {
    const analyzer = new ProjectStructureAnalyzer(this.workspaceRoot);
    const analysis = await analyzer.analyzeProject(projectName);
    
    if (!analysis) return;
    
    const spinner = ora(`${options.dryRun ? 'Planning cleanup for' : 'Cleaning'} ${projectName}...`).start();
    
    try {
      let cleaned = 0;
      
      // Clean temp files
      const tempPatterns = [
        '**/.DS_Store',
        '**/*.tmp',
        '**/*.temp'
      ];
      
      if (options.aggressive) {
        tempPatterns.push(
          '**/node_modules/**',
          '**/dist/**',
          '**/.cache/**'
        );
      }
      
      for (const pattern of tempPatterns) {
        const files = await glob(pattern, {
          cwd: analysis.path,
          ignore: options.aggressive ? [] : ['node_modules/**']
        });
        
        for (const file of files) {
          const filePath = path.join(analysis.path, file);
          
          if (options.dryRun) {
            console.log(chalk.gray(`Would delete: ${file}`));
          } else {
            await fs.remove(filePath);
          }
          cleaned++;
        }
      }
      
      // Remove empty directories
      const allDirs = await glob('**/*/', {
        cwd: analysis.path,
        ignore: ['node_modules/**', '.git/**']
      });
      
      // Sort by depth (deepest first) to remove empty parents
      const sortedDirs = allDirs.sort((a, b) => 
        b.split('/').length - a.split('/').length
      );
      
      for (const dir of sortedDirs) {
        const dirPath = path.join(analysis.path, dir);
        try {
          const contents = await fs.readdir(dirPath);
          if (contents.length === 0) {
            if (options.dryRun) {
              console.log(chalk.gray(`Would remove empty directory: ${dir}`));
            } else {
              await fs.remove(dirPath);
            }
            cleaned++;
          }
        } catch {
          // Directory doesn't exist or can't read
        }
      }
      
      if (options.dryRun) {
        spinner.succeed(`Would clean ${cleaned} items from ${projectName}`);
      } else {
        spinner.succeed(`Cleaned ${cleaned} items from ${projectName}`);
      }
      
    } catch (error) {
      spinner.fail(`Failed to clean ${projectName}: ${error}`);
    }
  }
}

class ProjectStandardizer {
  constructor(private workspaceRoot: string) {}

  async standardizeProject(projectName: string, options: {template: string, dryRun?: boolean}): Promise<void> {
    const analyzer = new ProjectStructureAnalyzer(this.workspaceRoot);
    const analysis = await analyzer.analyzeProject(projectName);
    
    if (!analysis) return;
    
    console.log(chalk.blue(`\n📋 Standardization Plan for ${projectName}:`));
    console.log(`Current structure score: ${analysis.score}%`);
    console.log(`Violations: ${analysis.violations.length}`);
    console.log(`Cleanup items: ${analysis.cleanupItems.length}`);
    
    if (options.dryRun) {
      console.log(chalk.yellow('\n🔍 DRY RUN - Would perform:'));
      console.log('  1. Create standard directory structure');
      console.log('  2. Move files to appropriate locations');
      console.log('  3. Clean up temporary files');
      console.log('  4. Generate missing configuration files');
      return;
    }
    
    const { proceed } = await inquirer.prompt([{
      type: 'confirm',
      name: 'proceed',
      message: 'Proceed with standardization?',
      default: false
    }]);
    
    if (!proceed) {
      console.log(chalk.yellow('Standardization cancelled.'));
      return;
    }
    
    // Perform standardization
    const validator = new StructureValidator(this.workspaceRoot);
    const cleaner = new ProjectCleaner(this.workspaceRoot);
    
    await validator.fixProject(analysis);
    await cleaner.cleanProject(projectName, { aggressive: false });
    
    console.log(chalk.green(`✅ ${projectName} has been standardized`));
  }
}

function displayDetailedAnalysis(analysis: ProjectAnalysis): void {
  console.log(chalk.cyan(`\n📊 ${analysis.name} (${analysis.type})`));
  console.log(chalk.gray(`Path: ${path.relative(process.cwd(), analysis.path)}`));
  console.log(`Score: ${getScoreColor(analysis.score)}${analysis.score}%${chalk.reset()}`);
  
  if (analysis.violations.length > 0) {
    console.log(chalk.red('\nViolations:'));
    analysis.violations.forEach(v => console.log(`  ❌ ${v}`));
  }
  
  if (analysis.cleanupItems.length > 0) {
    console.log(chalk.yellow('\nCleanup Items:'));
    analysis.cleanupItems.slice(0, 5).forEach(item => 
      console.log(`  🧹 ${item}`)
    );
    if (analysis.cleanupItems.length > 5) {
      console.log(`  ... and ${analysis.cleanupItems.length - 5} more`);
    }
  }
  
  if (analysis.violations.length === 0 && analysis.cleanupItems.length === 0) {
    console.log(chalk.green('  ✅ Structure is compliant'));
  }
}

function getScoreColor(score: number): string {
  if (score >= 90) return chalk.green.bold('');
  if (score >= 70) return chalk.yellow.bold('');
  return chalk.red.bold('');
}