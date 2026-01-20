/**
 * Template Commands
 * Manage OSSA agent templates
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { container } from '../../di-container.js';
import { TemplateService } from '../../services/template.service.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';

export const templateCommandGroup = new Command('template')
  .alias('tpl')
  .description('Manage OSSA agent templates');

/**
 * List Templates Command
 */
templateCommandGroup
  .command('list')
  .option('--type <type>', 'Filter by agent type')
  .option('--domain <domain>', 'Filter by domain')
  .option('--tag <tag>', 'Filter by tag (can be used multiple times)')
  .option('--keyword <keyword>', 'Search by keyword')
  .description('List all available templates')
  .action(
    async (options: {
      type?: string;
      domain?: string;
      tag?: string[];
      keyword?: string;
    }) => {
      try {
        const templateService = container.get(TemplateService);
        const templates = await templateService.searchTemplates({
          agentType: options.type,
          domain: options.domain,
          tags: options.tag,
          keyword: options.keyword,
        });

        if (templates.length === 0) {
          console.log(chalk.yellow('No templates found'));
          return;
        }

        console.log(chalk.green(`\nFound ${templates.length} template(s):\n`));

        templates.forEach((template) => {
          console.log(chalk.bold(template.metadata.name));
          console.log(`  Description: ${template.metadata.description}`);
          console.log(`  Type: ${template.metadata.agentType}`);
          console.log(`  Domain: ${template.metadata.domain}`);
          if (template.metadata.tags.length > 0) {
            console.log(`  Tags: ${template.metadata.tags.join(', ')}`);
          }
          console.log(`  Path: ${template.path}\n`);
        });
      } catch (error) {
        console.error(
          chalk.red(
            `Failed to list templates: ${error instanceof Error ? error.message : String(error)}`
          )
        );
        process.exit(1);
      }
    }
  );

/**
 * Show Template Command
 */
templateCommandGroup
  .command('show')
  .argument('<name>', 'Template name')
  .description('Show template details')
  .action(async (name: string) => {
    try {
      const templateService = container.get(TemplateService);
      const template = await templateService.getTemplate(name);

      if (!template) {
        console.error(chalk.red(`Template not found: ${name}`));
        process.exit(1);
      }

      console.log(chalk.bold(`\nTemplate: ${template.metadata.name}\n`));
      console.log(`Description: ${template.metadata.description}`);
      console.log(`Type: ${template.metadata.agentType}`);
      console.log(`Domain: ${template.metadata.domain}`);
      console.log(`Path: ${template.path}`);

      if (template.metadata.tags.length > 0) {
        console.log(`Tags: ${template.metadata.tags.join(', ')}`);
      }

      if (template.metadata.useCases.length > 0) {
        console.log(`\nUse Cases:`);
        template.metadata.useCases.forEach((uc) => console.log(`  - ${uc}`));
      }

      console.log(`\nManifest Preview:`);
      console.log(JSON.stringify(template.manifest, null, 2));
    } catch (error) {
      console.error(
        chalk.red(
          `Failed to show template: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      process.exit(1);
    }
  });

/**
 * Create Agent from Template Command
 */
templateCommandGroup
  .command('create')
  .alias('new')
  .option('-f, --from <template>', 'Template name to use')
  .option('-o, --output <file>', 'Output file path')
  .option(
    '-v, --variable <key=value>',
    'Template variable (can be used multiple times)',
    []
  )
  .description('Create agent from template')
  .action(
    async (options: {
      from?: string;
      output?: string;
      variable?: string[];
    }) => {
      try {
        if (!options.from) {
          console.error(
            chalk.red('Template name required (--from <template>)')
          );
          process.exit(1);
        }

        const templateService = container.get(TemplateService);
        const template = await templateService.getTemplate(options.from);

        if (!template) {
          console.error(chalk.red(`Template not found: ${options.from}`));
          process.exit(1);
        }

        // Parse variables
        const variables: Record<string, string> = {};
        if (options.variable) {
          for (const varStr of options.variable) {
            const [key, value] = varStr.split('=');
            if (key && value) {
              variables[key] = value;
            }
          }
        }

        // Render template
        const manifest = await templateService.renderTemplate(
          template,
          variables
        );

        // Determine output file
        const outputFile =
          options.output || `${manifest.metadata?.name || 'agent'}.ossa.yaml`;

        // Save manifest
        const manifestRepo = container.get(ManifestRepository);
        await manifestRepo.save(outputFile, manifest);

        console.log(
          chalk.green(`✓ Created agent from template: ${outputFile}`)
        );
      } catch (error) {
        console.error(
          chalk.red(
            `Failed to create agent: ${error instanceof Error ? error.message : String(error)}`
          )
        );
        process.exit(1);
      }
    }
  );

/**
 * Validate Template Command
 */
templateCommandGroup
  .command('validate')
  .argument('<path>', 'Path to template file')
  .description('Validate template structure')
  .action(async (templatePath: string) => {
    try {
      const templateService = container.get(TemplateService);
      const result = await templateService.validateTemplate(templatePath);

      if (result.valid) {
        console.log(chalk.green('✓ Template is valid'));
      } else {
        console.error(chalk.red('✗ Template validation failed:'));
        result.errors.forEach((error) =>
          console.error(chalk.red(`  - ${error}`))
        );
        process.exit(1);
      }
    } catch (error) {
      console.error(
        chalk.red(
          `Failed to validate template: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      process.exit(1);
    }
  });
