/**
 * Spec Generation Commands
 * 
 * SOLID: Single Responsibility - Spec generation only
 * DRY: Reuses Zod schemas from schemas/spec.schema.ts
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { SpecGenerateService } from '../services/spec-generate.service.js';
import { SpecValidateService } from '../services/spec-validate.service.js';

export const specCommand = new Command('spec')
  .alias('s')
  .description('Spec generation commands (for CI)');

// spec:generate - Generate spec from source (for CI)
specCommand
  .command('generate')
  .alias('gen')
  .description('Generate spec from source (for CI - prevents local AI bots from breaking spec)')
  .option('--output-dir <dir>', 'Output directory', 'spec/')
  .option('--no-validate', 'Skip validation after generation', false)
  .action(async (options: { outputDir: string; validate: boolean }) => {
    console.log(chalk.blue('📦 OSSA Spec Generation'));
    console.log(chalk.gray('======================\n'));

    const service = new SpecGenerateService();
    try {
      const result = await service.generate({
        outputDir: options.outputDir,
        validate: options.validate,
      });

      if (result.success) {
        console.log(chalk.green(`\n✅ Spec generated: ${result.outputPath}`));
        console.log(chalk.gray(`\nFiles generated: ${result.filesGenerated.length}`));
        result.filesGenerated.forEach(file => console.log(chalk.gray(`  • ${file}`)));

        if (result.validation) {
          if (result.validation.valid) {
            console.log(chalk.green('\n✅ Spec validation passed'));
          } else {
            console.error(chalk.red('\n❌ Spec validation failed:'));
            result.validation.errors.forEach(err => console.error(chalk.red(`  • ${err}`)));
            process.exit(1);
          }
        }
      } else {
        console.error(chalk.red('\n❌ Spec generation failed'));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

// spec:validate - Validate generated spec
specCommand
  .command('validate')
  .alias('val')
  .description('Validate generated spec')
  .argument('<specPath>', 'Path to spec file to validate')
  .action(async (specPath: string) => {
    console.log(chalk.blue('✅ OSSA Spec Validation'));
    console.log(chalk.gray('========================\n'));

    const service = new SpecValidateService();
    try {
      const result = await service.validate({ specPath });

      if (result.valid) {
        console.log(chalk.green('✅ Spec is valid!'));
        if (result.warnings.length > 0) {
          console.log(chalk.yellow('\n⚠️  Warnings:'));
          result.warnings.forEach(warn => console.log(chalk.yellow(`  • ${warn}`)));
        }
      } else {
        console.error(chalk.red('\n❌ Spec validation failed:'));
        result.errors.forEach(err => console.error(chalk.red(`  • ${err}`)));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });
