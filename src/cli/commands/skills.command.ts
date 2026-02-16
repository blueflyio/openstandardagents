/**
 * OSSA Claude Skills Commands
 * Generate, sync, list, and validate Claude Skills from OSSA manifests
 */

import chalk from 'chalk';
import { Command } from 'commander';
import { z } from 'zod';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { ClaudeSkillsService } from '../../services/skills/claude-skills.service.js';
import {
  SkillsResearchService,
  SkillsGeneratorService,
  SkillsExportService,
} from '../../services/skills-pipeline/index.js';

const AgentPathSchema = z.string().min(1);
const SkillPathSchema = z.string().min(1);

/**
 * Skills Command Group
 */
export const skillsCommandGroup = new Command('skills').description(
  'Manage Claude Skills integration with OSSA agents'
);

/**
 * List Skills Command
 */
skillsCommandGroup
  .command('list')
  .option('--path <path>', 'Custom skills directory path')
  .description('List all discovered Claude Skills')
  .action(async (options: { path?: string }) => {
    try {
      const skillsService = container.get(ClaudeSkillsService);
      const skills = await skillsService.discoverSkills();

      if (skills.length === 0) {
        console.log(chalk.yellow('No Claude Skills found'));
        console.log(
          chalk.gray(
            '  Skills are typically located in ~/.claude/skills/ or .claude/skills/'
          )
        );
        return;
      }

      console.log(chalk.green(`\nFound ${skills.length} skill(s):\n`));

      skills.forEach((skill) => {
        console.log(chalk.bold(skill.name));
        console.log(`  Description: ${skill.description.substring(0, 80)}...`);
        console.log(`  Path: ${skill.path}`);
        if (skill.triggerKeywords.length > 0) {
          console.log(
            `  Keywords: ${skill.triggerKeywords.slice(0, 5).join(', ')}`
          );
        }
        console.log('');
      });
    } catch (error) {
      console.error(chalk.red('✗ Failed to list skills'));
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

/**
 * Generate Skill Command
 */
skillsCommandGroup
  .command('generate')
  .argument('<manifest-path>', 'Path to OSSA agent manifest')
  .option('--output <path>', 'Output directory for skill', '.claude/skills')
  .option('--name <name>', 'Custom skill name')
  .option('--examples', 'Include usage examples')
  .description('Generate Claude Skill from OSSA manifest')
  .action(
    async (
      manifestPath: string,
      options: { output?: string; name?: string; examples?: boolean }
    ) => {
      try {
        const validatedPath = AgentPathSchema.parse(manifestPath);
        const manifestRepo = container.get(ManifestRepository);
        const skillsService = container.get(ClaudeSkillsService);

        console.log(chalk.blue(`Loading manifest: ${validatedPath}`));
        const manifest = await manifestRepo.load(validatedPath);

        console.log(chalk.blue('Generating Claude Skill...'));
        const skillPath = await skillsService.generateSkillFromOSSA(manifest, {
          outputPath: options.output,
          skillName: options.name,
          includeExamples: options.examples,
        });

        console.log(chalk.green(`✓ Skill generated: ${skillPath}`));
        console.log(
          chalk.gray(
            '\nNext steps: Install the skill or use it in Claude Desktop'
          )
        );
      } catch (error) {
        console.error(chalk.red('✗ Failed to generate skill'));
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    }
  );

/**
 * Sync Command
 */
skillsCommandGroup
  .command('sync')
  .argument('<skill-path>', 'Path to Claude Skill (SKILL.md)')
  .argument('<manifest-path>', 'Path to OSSA manifest')
  .option('--bidirectional', 'Sync changes both ways')
  .description('Sync Claude Skill with OSSA manifest')
  .action(
    async (
      skillPath: string,
      manifestPath: string,
      options: { bidirectional?: boolean }
    ) => {
      try {
        const validatedSkillPath = SkillPathSchema.parse(skillPath);
        const validatedManifestPath = AgentPathSchema.parse(manifestPath);
        const skillsService = container.get(ClaudeSkillsService);

        console.log(chalk.blue('Syncing skill with manifest...'));

        await skillsService.syncSkillToOSSA(
          validatedSkillPath,
          validatedManifestPath
        );

        console.log(chalk.green('✓ Sync completed'));
        console.log(
          chalk.gray(
            `  Updated manifest: ${validatedManifestPath}\n  Skill: ${validatedSkillPath}`
          )
        );
      } catch (error) {
        console.error(chalk.red('✗ Sync failed'));
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    }
  );

/**
 * Validate Command
 */
skillsCommandGroup
  .command('validate')
  .argument('<skill-path>', 'Path to Claude Skill (SKILL.md)')
  .description('Validate Claude Skill')
  .action(async (skillPath: string) => {
    try {
      const validatedPath = SkillPathSchema.parse(skillPath);
      const skillsService = container.get(ClaudeSkillsService);

      console.log(chalk.blue(`Validating skill: ${validatedPath}`));
      const result = await skillsService.validateSkill(validatedPath);

      if (result.valid) {
        console.log(chalk.green('✓ Skill validation passed'));
      } else {
        console.error(chalk.red('✗ Skill validation failed'));
        result.errors.forEach((error) =>
          console.error(chalk.red(`  - ${error}`))
        );
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('✗ Validation failed'));
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

/**
 * P0-1: Research Command
 * Research and index skills from awesome-claude-code, claude-code-showcase, etc.
 */
skillsCommandGroup
  .command('research')
  .argument('<query>', 'Search query (e.g., "drupal module development")')
  .option('--source <source>', 'Filter by source name')
  .option('--json', 'Output as JSON')
  .option('--limit <number>', 'Maximum results to return', '20')
  .option('--update-index', 'Update skills index before searching')
  .description('Research skills from curated sources')
  .action(
    async (
      query: string,
      options: {
        source?: string;
        json?: boolean;
        limit?: string;
        updateIndex?: boolean;
      }
    ) => {
      try {
        const researchService = container.get(SkillsResearchService);
        const limit = parseInt(options.limit || '20', 10);

        if (!options.json) {
          console.log(chalk.blue(`Researching skills for: "${query}"`));
          if (options.updateIndex) {
            console.log(chalk.gray('Updating skills index...'));
          }
        }

        const results = await researchService.research({
          query,
          sources: options.source ? [options.source] : undefined,
          limit,
          updateIndex: options.updateIndex,
          json: options.json,
        });

        if (options.json) {
          console.log(JSON.stringify(results, null, 2));
          return;
        }

        if (results.length === 0) {
          console.log(chalk.yellow('\nNo skills found matching your query.'));
          console.log(chalk.gray('Try:'));
          console.log(chalk.gray('  - Using different keywords'));
          console.log(
            chalk.gray('  - Running with --update-index to refresh the index')
          );
          return;
        }

        console.log(chalk.green(`\nFound ${results.length} skill(s):\n`));

        results.forEach((skill, index) => {
          console.log(
            chalk.bold(`${index + 1}. ${skill.name}`) +
              (skill.rating ? chalk.gray(` (★ ${skill.rating})`) : '')
          );
          console.log(`   ${skill.description}`);
          console.log(chalk.gray(`   Source: ${skill.sourceUrl}`));
          if (skill.triggers.length > 0) {
            console.log(
              chalk.cyan(
                `   Triggers: ${skill.triggers.slice(0, 3).join(', ')}`
              )
            );
          }
          if (skill.installCommand) {
            console.log(chalk.gray(`   Install: ${skill.installCommand}`));
          }
          console.log('');
        });

        console.log(
          chalk.gray(`\nIndex location: ${researchService.getIndexPath()}`)
        );
      } catch (error) {
        console.error(chalk.red('✗ Research failed'));
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    }
  );

/**
 * P0-2: Enhanced Generate Command
 * Generate Claude Skill from OSSA manifest, Oracle Agent Spec, or AGENTS.md
 */
skillsCommandGroup
  .command('generate-enhanced')
  .alias('gen')
  .argument('<input-path>', 'Path to OSSA manifest, Oracle spec, or AGENTS.md')
  .option(
    '--format <format>',
    'Input format: ossa, oracle, agents-md (auto-detect if not specified)'
  )
  .option('--output <path>', 'Output directory', './generated-skill')
  .option(
    '--output-format <format>',
    'Output format: claude-skill, npm-package',
    'claude-skill'
  )
  .option('--dry-run', 'Preview without writing files')
  .description('Generate Claude Skill from various agent specification formats')
  .action(
    async (
      inputPath: string,
      options: {
        format?: string;
        output?: string;
        outputFormat?: string;
        dryRun?: boolean;
      }
    ) => {
      try {
        const generatorService = container.get(SkillsGeneratorService);

        console.log(chalk.blue(`Generating skill from: ${inputPath}`));
        if (options.format) {
          console.log(chalk.gray(`  Format: ${options.format}`));
        } else {
          console.log(chalk.gray('  Format: auto-detect'));
        }

        const result = await generatorService.generate({
          inputPath,
          format: options.format as any,
          output: options.output,
          outputFormat: options.outputFormat as any,
          dryRun: options.dryRun,
        });

        if (!result.success) {
          console.error(chalk.red('✗ Generation failed'));
          if (result.errors) {
            result.errors.forEach((error) =>
              console.error(chalk.red(`  - ${error}`))
            );
          }
          process.exit(1);
        }

        console.log(chalk.green(`✓ ${result.message}`));
        if (result.outputPath) {
          console.log(chalk.gray(`  Output: ${result.outputPath}`));
        }
        if (result.files) {
          console.log(chalk.gray('\n  Files generated:'));
          result.files.forEach((file) =>
            console.log(chalk.gray(`    - ${file}`))
          );
        }

        if (!options.dryRun) {
          console.log(chalk.gray('\n  Next steps:'));
          console.log(
            chalk.gray(`    ossa skills export ${result.outputPath} --install`)
          );
        }
      } catch (error) {
        console.error(chalk.red('✗ Generation failed'));
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    }
  );

/**
 * P0-3: Export Command
 * Export Claude Skill as npm package
 */
skillsCommandGroup
  .command('export')
  .argument('<skill-path>', 'Path to Claude Skill directory or SKILL.md')
  .option(
    '--scope <scope>',
    'npm scope (e.g., @claude-skills)',
    '@claude-skills'
  )
  .option('--publish', 'Publish to npm registry (requires authentication)')
  .option('--dry-run', 'Preview without writing files')
  .option('--install', 'Install to ~/.claude/skills/ after export')
  .description('Export Claude Skill as installable npm package')
  .action(
    async (
      skillPath: string,
      options: {
        scope?: string;
        publish?: boolean;
        dryRun?: boolean;
        install?: boolean;
      }
    ) => {
      try {
        const exportService = container.get(SkillsExportService);

        console.log(chalk.blue(`Exporting skill: ${skillPath}`));

        const result = await exportService.export({
          skillPath,
          scope: options.scope,
          publish: options.publish,
          dryRun: options.dryRun,
          install: options.install,
        });

        if (!result.success) {
          console.error(chalk.red('✗ Export failed'));
          if (result.errors) {
            result.errors.forEach((error) =>
              console.error(chalk.red(`  - ${error}`))
            );
          }
          process.exit(1);
        }

        console.log(chalk.green(`✓ ${result.message}`));
        if (result.packageName) {
          console.log(chalk.gray(`  Package: ${result.packageName}`));
        }
        if (result.outputPath) {
          console.log(chalk.gray(`  Output: ${result.outputPath}`));
        }
        if (result.files) {
          console.log(chalk.gray('\n  Files exported:'));
          result.files.forEach((file) =>
            console.log(chalk.gray(`    - ${file}`))
          );
        }

        if (!options.dryRun && !options.install) {
          console.log(chalk.gray('\n  Next steps:'));
          if (options.publish) {
            console.log(chalk.gray(`    npm publish ${result.outputPath}`));
          } else {
            console.log(chalk.gray(`    cd ${result.outputPath} && npm link`));
            console.log(chalk.gray('    Or: npm install <path-to-package>'));
          }
        }
      } catch (error) {
        console.error(chalk.red('✗ Export failed'));
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    }
  );
