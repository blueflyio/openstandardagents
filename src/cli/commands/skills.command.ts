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
