/**
 * OSSA Claude Skills Commands
 * Generate, sync, list, and validate Claude Skills from OSSA manifests
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs/promises';
import * as path from 'path';
import { z } from 'zod';
import { getSkillsPathDefault } from '../../config/cli-config.js';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import {
    SkillsExportService,
    SkillsGeneratorService,
    SkillsInstallService,
    SkillsResearchService,
} from '../../services/skills-pipeline/index.js';
import { ClaudeSkillsService } from '../../services/skills/claude-skills.service.js';

const AgentPathSchema = z.string().min(1);
const SkillPathSchema = z.string().min(1);

/** Parse skills.sh URL into GitHub repo URL + skill name. e.g. https://skills.sh/sparkfabrik/sf-awesome-copilot/drupal-cache-maxage -> { repoUrl, skill } */
function parseSkillsShUrl(
  input: string
): { repoUrl: string; skill: string } | null {
  const trimmed = input
    .trim()
    .replace(/^https:\/\/skills\.sh\/?/i, '')
    .replace(/\/$/, '');
  if (trimmed === input.trim()) return null;
  const parts = trimmed.split('/').filter(Boolean);
  if (parts.length < 2) return null;
  const repoUrl = `https://github.com/${parts[0]}/${parts[1]}`;
  const skill = parts.length >= 3 ? parts[2] : parts[1];
  return { repoUrl, skill };
}

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
  .option('--path <path>', 'Custom skills directory path (or set SKILLS_PATH)')
  .option('--json', 'Output as JSON for API/UI consumption')
  .description('List all discovered Claude Skills')
  .action(async (options: { path?: string; json?: boolean }) => {
    try {
      const skillsService = container.get(ClaudeSkillsService);
      const basePath = options.path || process.env.SKILLS_PATH;
      const skills = await skillsService.discoverSkills(basePath);

      if (skills.length === 0) {
        if (options.json) {
          console.log(JSON.stringify({ skills: [], count: 0 }));
          return;
        }
        console.log(chalk.yellow('No Claude Skills found'));
        console.log(
          chalk.gray(
            '  Skills are typically located in ~/.claude/skills/ or set SKILLS_PATH'
          )
        );
        return;
      }

      if (options.json) {
        console.log(
          JSON.stringify({
            skills: skills.map((s) => ({
              name: s.name,
              description: s.description,
              path: s.path,
              skillPath: s.skillPath,
              triggerKeywords: s.triggerKeywords,
            })),
            count: skills.length,
          })
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
      console.error(chalk.red('Failed to list skills'));
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
 * Add Command
 * Install a skill from a GitHub repo or from skills.sh URL into a target directory (AgentSkills / Claude Skill format).
 * Examples:
 *   ossa skills add https://github.com/sparkfabrik/sf-awesome-copilot --skill drupal-cache-maxage --path /Volumes/AgentPlatform/services/marketplace/skills
 *   ossa skills add https://skills.sh/sparkfabrik/sf-awesome-copilot/drupal-cache-maxage --path /Volumes/AgentPlatform/services/marketplace/skills
 */
skillsCommandGroup
  .command('add <repo-url>')
  .option(
    '--skill <name>',
    'Skill name (subdir in repo, e.g. drupal-cache-maxage). Not needed when repo-url is a skills.sh URL.',
    ''
  )
  .option(
    '--path <dir>',
    'Target directory to install into (default: config SKILLS_PATH or ~/.claude/skills)',
    ''
  )
  .option('--ref <ref>', 'Git ref (branch/tag/sha)', 'HEAD')
  .option('--dry-run', 'Show what would be installed without writing', false)
  .description(
    'Install a Claude Skill from a GitHub repo or from skills.sh URL'
  )
  .action(
    async (
      repoUrl: string,
      options: { skill?: string; path?: string; ref?: string; dryRun?: boolean }
    ) => {
      try {
        const installService = container.get(SkillsInstallService);
        const targetPath = options.path || getSkillsPathDefault();

        let resolvedRepoUrl = repoUrl;
        let resolvedSkill = options.skill ?? '';

        const skillsSh = parseSkillsShUrl(repoUrl);
        if (skillsSh) {
          resolvedRepoUrl = skillsSh.repoUrl;
          resolvedSkill = skillsSh.skill;
        }

        if (!resolvedSkill) {
          const list = await installService.listInRepo(
            resolvedRepoUrl,
            options.ref
          );
          if (list.length === 0) {
            console.log(
              chalk.yellow(
                'No skills found in repo. Use --skill <name> or a skills.sh URL.'
              )
            );
            console.log(
              chalk.gray(
                '  Example: ossa skills add <repo-url> --skill <skill-name>'
              )
            );
            console.log(
              chalk.gray(
                '  Example: ossa skills add https://skills.sh/owner/repo/skill-name'
              )
            );
            return;
          }
          console.log(chalk.blue(`Skills in ${resolvedRepoUrl}:`));
          list.forEach((s) =>
            console.log(chalk.gray(`  - ${s.name} (${s.path})`))
          );
          console.log(
            chalk.gray(
              `\nInstall with: ossa skills add ${resolvedRepoUrl} --skill <name> --path ${targetPath}`
            )
          );
          return;
        }

        if (options.dryRun) {
          console.log(
            chalk.blue(
              `Would install skill "${resolvedSkill}" from ${resolvedRepoUrl} to ${targetPath}`
            )
          );
          return;
        }

        const result = await installService.install({
          repoUrl: resolvedRepoUrl,
          skill: resolvedSkill,
          path: targetPath,
          ref: options.ref,
        });

        if (!result.success) {
          console.error(chalk.red('✗ ' + result.message));
          if (result.errors) {
            result.errors.forEach((e) => console.error(chalk.red(`  - ${e}`)));
          }
          process.exit(1);
        }

        console.log(chalk.green('✓ ' + result.message));
        if (result.installedPath) {
          console.log(chalk.gray(`  Path: ${result.installedPath}`));
          console.log(
            chalk.gray(
              '  Validate: ossa skills validate ' +
                result.installedPath +
                '/SKILL.md'
            )
          );
        }
      } catch (error) {
        console.error(chalk.red('✗ Add failed'));
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    }
  );

/**
 * Create Command
 * Create a new skill from scratch (AgentSkills.io-compatible SKILL.md).
 * Optionally push to agent-protocol Skills API when SKILLS_API_URL is set and --push-api.
 */
skillsCommandGroup
  .command('create <name>')
  .option('--description <text>', 'Short description for the skill', '')
  .option(
    '--instructions <text>',
    'Instruction body (prompt) for the skill',
    ''
  )
  .option(
    '--instructions-file <path>',
    'Path to file containing instructions (overrides --instructions)',
    ''
  )
  .option(
    '--path <dir>',
    'Output directory for the skill folder',
    process.env.SKILLS_PATH ||
      (process.env.HOME
        ? `${process.env.HOME}/.claude/skills`
        : '.claude/skills')
  )
  .option('--push-api', 'POST to Skills API (requires SKILLS_API_URL)', false)
  .option('--dry-run', 'Print SKILL.md content without writing', false)
  .description('Create a new AgentSkills.io-compatible skill (SKILL.md)')
  .action(
    async (
      name: string,
      options: {
        description?: string;
        instructions?: string;
        instructionsFile?: string;
        path?: string;
        pushApi?: boolean;
        dryRun?: boolean;
      }
    ) => {
      try {
        const fsp = await import('fs/promises');
        const pathMod = await import('path');
        const skillName =
          name
            .replace(/[^a-z0-9-]/gi, '-')
            .toLowerCase()
            .replace(/^-+|-+$/g, '') || 'skill';
        const instructions = options.instructionsFile
          ? await fsp.readFile(
              pathMod.resolve(options.instructionsFile),
              'utf-8'
            )
          : options.instructions ||
            `You are a ${skillName} skill. Add instructions here.`;
        const description = options.description || `Skill: ${skillName}`;
        const frontmatter = `---
name: ${skillName}
description: ${description}
---
`;
        const content = frontmatter + instructions.trim() + '\n';
        const outDir = pathMod.resolve(options.path!, skillName);
        const skillMdPath = pathMod.join(outDir, 'SKILL.md');

        if (options.dryRun) {
          console.log(chalk.blue('SKILL.md content (dry-run):\n'));
          console.log(content);
          return;
        }

        await fsp.mkdir(outDir, { recursive: true });
        await fsp.writeFile(skillMdPath, content, 'utf-8');
        console.log(chalk.green(`Skill created: ${skillMdPath}`));
        console.log(
          chalk.gray(`  Validate: ossa skills validate ${skillMdPath}`)
        );

        if (options.pushApi && process.env.SKILLS_API_URL) {
          const base = process.env.SKILLS_API_URL.replace(/\/$/, '');
          const url = `${base}/`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: skillName, content }),
          });
          if (!res.ok) {
            const err = await res.text();
            console.error(
              chalk.yellow(`Push to API failed (${res.status}): ${err}`)
            );
            return;
          }
          console.log(chalk.green(`Pushed to ${base}`));
        } else if (options.pushApi && !process.env.SKILLS_API_URL) {
          console.log(
            chalk.yellow(
              'SKILLS_API_URL not set; skip push. Set it to agent-protocol /api/skills base.'
            )
          );
        }
      } catch (error) {
        console.error(chalk.red('Create failed'));
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    }
  );

/**
 * List-remote Command
 * List skill names available in a GitHub repo.
 */
skillsCommandGroup
  .command('list-remote <repo-url>')
  .option('--ref <ref>', 'Git ref (branch/tag/sha)', 'HEAD')
  .description('List skills available in a GitHub repo')
  .action(async (repoUrl: string, options: { ref?: string }) => {
    try {
      const installService = container.get(SkillsInstallService);
      const list = await installService.listInRepo(repoUrl, options.ref);
      if (list.length === 0) {
        console.log(chalk.yellow('No skills (SKILL.md) found in repo.'));
        return;
      }
      console.log(chalk.green(`Skills in ${repoUrl}:\n`));
      list.forEach((s) =>
        console.log(`  ${chalk.bold(s.name)}  ${chalk.gray(s.path)}`)
      );
      console.log(
        chalk.gray(
          `\nInstall: ossa skills add ${repoUrl} --skill <name> [--path <dir>]`
        )
      );
    } catch (error) {
      console.error(chalk.red('List-remote failed'));
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

/**
 * Catalog Command
 * List skills from the Bluefly marketplace catalog (marketplace-skills-catalog.json).
 */
skillsCommandGroup
  .command('catalog')
  .option(
    '--catalog <path>',
    'Path to catalog JSON (default: BLUEFLY_SKILLS_CATALOG env)'
  )
  .option('--json', 'Output as JSON')
  .description('List skills from the marketplace catalog')
  .action(async (options: { catalog?: string; json?: boolean }) => {
    try {
      const catalogPath =
        options.catalog || process.env.BLUEFLY_SKILLS_CATALOG || '';
      if (!catalogPath) {
        console.log(
          chalk.yellow(
            'Set BLUEFLY_SKILLS_CATALOG to path to marketplace-skills-catalog.json, or use --catalog <path>'
          )
        );
        if (options.json) console.log(JSON.stringify({ skills: [], count: 0 }));
        return;
      }
      const resolved = path.resolve(catalogPath);
      const raw = await fs.readFile(resolved, 'utf-8');
      const data = JSON.parse(raw) as {
        skillsPath?: string;
        skills?: Array<{ repo?: string; url?: string; skill?: string }>;
      };
      const entries = data.skills || [];
      const list = entries.map((e, i) => {
        const repo =
          e.repo || (e.url ? parseSkillsShUrl(e.url)?.repoUrl : '') || '';
        const skill =
          e.skill || (e.url ? parseSkillsShUrl(e.url)?.skill : '') || '';
        const addTarget = e.url || repo;
        const install = skill
          ? `ossa skills add ${addTarget} --skill ${skill} --path <dir>`
          : `ossa skills add ${addTarget} --path <dir>`;
        return { index: i + 1, repo, skill, url: e.url, install };
      });

      if (options.json) {
        console.log(
          JSON.stringify({
            skillsPath: data.skillsPath,
            skills: list,
            count: list.length,
          })
        );
        return;
      }
      console.log(chalk.green(`\nCatalog (${list.length} entries):\n`));
      list.forEach((e) => {
        console.log(chalk.bold(`${e.index}. ${e.skill || e.repo}`));
        if (e.repo) console.log(chalk.gray(`   Repo: ${e.repo}`));
        if (e.url) console.log(chalk.gray(`   URL: ${e.url}`));
        console.log(chalk.gray(`   Install: ${e.install}\n`));
      });
    } catch (error) {
      console.error(chalk.red('Catalog failed'));
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

/**
 * Show Command
 * Show full SKILL.md content and metadata for a skill by name.
 */
skillsCommandGroup
  .command('show <name>')
  .option(
    '--path <dir>',
    'Skills directory (default: SKILLS_PATH or ~/.claude/skills)'
  )
  .option('--json', 'Output metadata as JSON (content in .content)')
  .description('Show skill details and full content')
  .action(async (name: string, options: { path?: string; json?: boolean }) => {
    try {
      const basePath =
        options.path ||
        process.env.SKILLS_PATH ||
        (process.env.HOME
          ? path.join(process.env.HOME, '.claude', 'skills')
          : '.claude/skills');
      const skillsService = container.get(ClaudeSkillsService);
      const result = await skillsService.getSkillContentByName(name, basePath);

      if (options.json) {
        console.log(
          JSON.stringify({
            name: result.name,
            path: result.path,
            content: result.content,
          })
        );
        return;
      }
      console.log(chalk.green(`\nSkill: ${result.name}\n`));
      console.log(chalk.gray(`Path: ${result.path}\n`));
      console.log('---');
      console.log(result.content);
      console.log('---');
    } catch (error) {
      console.error(chalk.red('Show failed'));
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

/**
 * Attach Command
 * Add a skill reference to an OSSA manifest (extensions.skills.skillRefs).
 */
skillsCommandGroup
  .command('attach <skill-name>')
  .requiredOption('--manifest <path>', 'Path to OSSA manifest file')
  .description('Add skill to manifest extensions.skills.skillRefs')
  .action(async (skillName: string, options: { manifest: string }) => {
    try {
      const manifestPath = AgentPathSchema.parse(options.manifest);
      const manifestRepo = container.get(ManifestRepository);
      const manifest = await manifestRepo.load(manifestPath);

      const ext = (manifest as Record<string, unknown>).extensions as
        | Record<string, unknown>
        | undefined;
      const skillsExt = (ext?.skills as Record<string, unknown>) || {};
      const refs = Array.isArray(skillsExt.skillRefs)
        ? [...(skillsExt.skillRefs as string[])]
        : [];
      if (refs.includes(skillName)) {
        console.log(chalk.yellow(`Skill "${skillName}" already attached.`));
        return;
      }
      refs.push(skillName);
      if (!(manifest as Record<string, unknown>).extensions) {
        (manifest as Record<string, unknown>).extensions = {};
      }
      (
        (manifest as Record<string, unknown>).extensions as Record<
          string,
          unknown
        >
      ).skills = {
        ...skillsExt,
        skillRefs: refs,
      };

      await manifestRepo.save(manifestPath, manifest);
      console.log(
        chalk.green(`Attached skill "${skillName}" to ${manifestPath}`)
      );
      console.log(
        chalk.gray(`  extensions.skills.skillRefs: [${refs.join(', ')}]`)
      );
    } catch (error) {
      console.error(chalk.red('Attach failed'));
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
