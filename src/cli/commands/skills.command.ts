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
import {
  importSkillMd,
  exportSkillMd,
  readSkillOssa,
  writeSkillOssa,
  ossaToSkillMd,
} from '../../converters/skill-md-converter.js';
import { createSkillManifest } from '../../types/skill.js';
import { readFile } from 'fs/promises';
import { resolve, dirname, join } from 'path';
import YAML from 'yaml';

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

// ---------------------------------------------------------------------------
// OSSA Skill Manifest Commands (skill.ossa.yaml ↔ SKILL.md)
// ---------------------------------------------------------------------------

/**
 * Import SKILL.md → skill.ossa.yaml
 */
skillsCommandGroup
  .command('import-ossa')
  .argument('<skill-md-path>', 'Path to SKILL.md file')
  .option('--output <path>', 'Output path for skill.ossa.yaml')
  .option('--name <name>', 'Override skill name')
  .option('--did <did>', 'Set DID (e.g., did:ossa:skill:my-skill)')
  .option('--version <version>', 'Set version', '1.0.0')
  .option('--author <name>', 'Author name')
  .option('--license <license>', 'License identifier')
  .option('--platforms <platforms...>', 'Target platforms (claude-code, cursor, etc.)')
  .option('--json', 'Output as JSON instead of YAML')
  .option('--dry-run', 'Preview without writing files')
  .description('Import SKILL.md and convert to skill.ossa.yaml (OSSA manifest)')
  .action(
    async (
      skillMdPath: string,
      options: {
        output?: string;
        name?: string;
        did?: string;
        version?: string;
        author?: string;
        license?: string;
        platforms?: string[];
        json?: boolean;
        dryRun?: boolean;
      }
    ) => {
      try {
        const resolvedPath = resolve(skillMdPath);
        console.log(chalk.blue(`Importing SKILL.md: ${resolvedPath}`));

        const skill = await importSkillMd(resolvedPath, {
          name: options.name,
          did: options.did,
          version: options.version,
          author: options.author ? { name: options.author } : undefined,
          license: options.license,
          platforms: options.platforms,
        });

        if (options.json) {
          console.log(JSON.stringify(skill, null, 2));
          return;
        }

        const yamlContent = YAML.stringify(skill, { lineWidth: 120 });

        if (options.dryRun) {
          console.log(chalk.gray('\n--- Preview ---'));
          console.log(yamlContent);
          console.log(chalk.gray('--- End Preview ---'));
          return;
        }

        const outputPath =
          options.output ||
          join(dirname(resolvedPath), 'skill.ossa.yaml');

        await writeSkillOssa(skill, outputPath);
        console.log(chalk.green(`✓ Created: ${outputPath}`));
        console.log(chalk.gray(`  Name: ${skill.metadata.name}`));
        console.log(chalk.gray(`  Description: ${skill.spec.description?.substring(0, 80)}...`));
        if (skill.spec.allowedTools?.length) {
          console.log(chalk.gray(`  Tools: ${skill.spec.allowedTools.join(', ')}`));
        }
      } catch (error) {
        console.error(chalk.red('✗ Import failed'));
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    }
  );

/**
 * Export skill.ossa.yaml → SKILL.md
 */
skillsCommandGroup
  .command('export-ossa')
  .argument('<skill-ossa-path>', 'Path to skill.ossa.yaml file')
  .option('--output <path>', 'Output path for SKILL.md')
  .option('--dry-run', 'Preview without writing files')
  .description('Export skill.ossa.yaml to SKILL.md (Agent Skills format)')
  .action(
    async (
      skillOssaPath: string,
      options: {
        output?: string;
        dryRun?: boolean;
      }
    ) => {
      try {
        const resolvedPath = resolve(skillOssaPath);
        console.log(chalk.blue(`Exporting skill.ossa.yaml: ${resolvedPath}`));

        const skill = await readSkillOssa(resolvedPath);
        const skillMdContent = ossaToSkillMd(skill);

        if (options.dryRun) {
          console.log(chalk.gray('\n--- Preview ---'));
          console.log(skillMdContent);
          console.log(chalk.gray('--- End Preview ---'));
          return;
        }

        const outputPath =
          options.output ||
          join(dirname(resolvedPath), 'SKILL.md');

        await exportSkillMd(skill, outputPath);
        console.log(chalk.green(`✓ Exported: ${outputPath}`));
        console.log(chalk.gray(`  Name: ${skill.metadata.name}`));
      } catch (error) {
        console.error(chalk.red('✗ Export failed'));
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    }
  );

/**
 * Create skill.ossa.yaml interactively or from flags
 */
skillsCommandGroup
  .command('create-ossa')
  .argument('[name]', 'Skill name (DNS-style slug)')
  .option('--description <desc>', 'Skill description')
  .option('--instructions <text>', 'Inline instructions')
  .option('--instructions-file <path>', 'Load instructions from file')
  .option('--did <did>', 'Set DID')
  .option('--version <version>', 'Set version', '1.0.0')
  .option('--author <name>', 'Author name')
  .option('--license <license>', 'License', 'Apache-2.0')
  .option('--platforms <platforms...>', 'Target platforms')
  .option('--tools <tools...>', 'Allowed tools')
  .option('--categories <categories...>', 'Skill categories')
  .option('--output <path>', 'Output path', 'skill.ossa.yaml')
  .option('--json', 'Output as JSON')
  .option('--dry-run', 'Preview without writing')
  .description('Create a new skill.ossa.yaml manifest')
  .action(
    async (
      name: string | undefined,
      options: {
        description?: string;
        instructions?: string;
        instructionsFile?: string;
        did?: string;
        version?: string;
        author?: string;
        license?: string;
        platforms?: string[];
        tools?: string[];
        categories?: string[];
        output?: string;
        json?: boolean;
        dryRun?: boolean;
      }
    ) => {
      try {
        const skillName = name || 'my-skill';
        const description = options.description || `${skillName} skill`;

        let instructions = options.instructions;
        if (options.instructionsFile) {
          instructions = await readFile(resolve(options.instructionsFile), 'utf-8');
        }

        const skill = createSkillManifest(skillName, description, instructions);

        // Apply optional fields
        if (options.version) skill.metadata.version = options.version;
        if (options.did) skill.metadata.did = options.did;
        if (options.author) skill.metadata.author = { name: options.author };
        if (options.license) skill.metadata.license = options.license;
        if (options.platforms) skill.spec.platforms = options.platforms;
        if (options.tools) skill.spec.allowedTools = options.tools;
        if (options.categories) skill.spec.categories = options.categories;

        if (options.json) {
          console.log(JSON.stringify(skill, null, 2));
          return;
        }

        const yamlContent = YAML.stringify(skill, { lineWidth: 120 });

        if (options.dryRun) {
          console.log(chalk.gray('\n--- Preview ---'));
          console.log(yamlContent);
          console.log(chalk.gray('--- End Preview ---'));
          return;
        }

        const outputPath = resolve(options.output || 'skill.ossa.yaml');
        await writeSkillOssa(skill, outputPath);
        console.log(chalk.green(`✓ Created: ${outputPath}`));
        console.log(chalk.gray(`  Name: ${skill.metadata.name}`));
        console.log(chalk.gray(`  Version: ${skill.metadata.version}`));
        if (skill.spec.instructions) {
          console.log(chalk.gray(`  Instructions: ${skill.spec.instructions.length} chars`));
        }
        console.log(chalk.gray('\nNext steps:'));
        console.log(chalk.gray(`  ossa skills export-ossa ${outputPath}  # Export to SKILL.md`));
        console.log(chalk.gray(`  ossa validate ${outputPath}            # Validate manifest`));
      } catch (error) {
        console.error(chalk.red('✗ Create failed'));
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    }
  );

/**
 * Validate skill.ossa.yaml against schema
 */
skillsCommandGroup
  .command('validate-ossa')
  .argument('<skill-ossa-path>', 'Path to skill.ossa.yaml file')
  .option('--json', 'Output as JSON')
  .option('--verbose', 'Show detailed validation output')
  .description('Validate a skill.ossa.yaml manifest')
  .action(
    async (
      skillOssaPath: string,
      options: { json?: boolean; verbose?: boolean }
    ) => {
      try {
        const resolvedPath = resolve(skillOssaPath);
        if (!options.json) {
          console.log(chalk.blue(`Validating: ${resolvedPath}`));
        }

        const skill = await readSkillOssa(resolvedPath);
        const errors: string[] = [];

        // Basic structural validation
        if (!skill.apiVersion) errors.push('Missing apiVersion');
        if (skill.kind !== 'Skill') errors.push(`kind must be "Skill", got "${skill.kind}"`);
        if (!skill.metadata?.name) errors.push('Missing metadata.name');
        if (!skill.spec?.description) errors.push('Missing spec.description');

        // Metadata validation
        if (skill.metadata.did && !skill.metadata.did.startsWith('did:')) {
          errors.push(`Invalid DID format: ${skill.metadata.did}`);
        }

        // Governance validation
        if (skill.spec.governance?.maxAutonomy !== undefined) {
          if (skill.spec.governance.maxAutonomy < 0 || skill.spec.governance.maxAutonomy > 10) {
            errors.push('governance.maxAutonomy must be between 0 and 10');
          }
        }

        const result = {
          valid: errors.length === 0,
          errors,
          manifest: options.verbose ? skill : undefined,
        };

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
          return;
        }

        if (result.valid) {
          console.log(chalk.green('✓ Validation passed'));
          if (options.verbose) {
            console.log(chalk.gray(`  Name: ${skill.metadata.name}`));
            console.log(chalk.gray(`  Version: ${skill.metadata.version || 'not set'}`));
            console.log(chalk.gray(`  Description: ${skill.spec.description?.substring(0, 80)}`));
            if (skill.spec.platforms?.length) {
              console.log(chalk.gray(`  Platforms: ${skill.spec.platforms.join(', ')}`));
            }
            if (skill.spec.allowedTools?.length) {
              console.log(chalk.gray(`  Tools: ${skill.spec.allowedTools.join(', ')}`));
            }
            if (skill.spec.governance) {
              console.log(chalk.gray(`  Governance: maxAutonomy=${skill.spec.governance.maxAutonomy}`));
            }
          }
        } else {
          console.error(chalk.red('✗ Validation failed'));
          errors.forEach((e) => console.error(chalk.red(`  - ${e}`)));
          process.exit(1);
        }
      } catch (error) {
        if (options.json) {
          console.log(JSON.stringify({ valid: false, errors: [String(error)] }, null, 2));
        } else {
          console.error(chalk.red('✗ Validation failed'));
          console.error(error instanceof Error ? error.message : String(error));
        }
        process.exit(1);
      }
    }
  );
