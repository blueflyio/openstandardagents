/**
 * OSSA llms.txt Command
 * Generate, validate, and sync llms.txt files from OSSA manifests
 */

import chalk from 'chalk'
import { Command } from 'commander'
import { container } from '../../di-container.js'
import { ManifestRepository } from '../../repositories/manifest.repository.js'
import { LlmsTxtService } from '../../services/llms-txt/llms-txt.service.js'
import type { OssaAgent } from '../../types/index.js'

export const llmsTxtCommand = new Command('llms-txt')
  .description('Generate, validate, and sync llms.txt files from OSSA manifests')

// Generate subcommand
llmsTxtCommand
  .command('generate')
  .argument('<manifest>', 'Path to OSSA manifest file')
  .option('-o, --output <path>', 'Output path for llms.txt', 'llms.txt')
  .option('-v, --verbose', 'Verbose output')
  .description('Generate llms.txt from OSSA manifest')
  .action(async (manifestPath: string, options: { output: string; verbose?: boolean }) => {
    try {
      console.log(chalk.blue(`Generating llms.txt from ${manifestPath}...`))

      const manifestRepo = container.get(ManifestRepository)
      const llmsTxtService = container.get(LlmsTxtService)

      const manifest = (await manifestRepo.load(manifestPath)) as OssaAgent

      const extension = (manifest.extensions as any)?.llms_txt
      if (!extension?.enabled) {
        console.error(chalk.red('Error: llms_txt extension is not enabled in manifest'))
        console.log(chalk.yellow('\n💡 Add the following to your manifest to enable:'))
        console.log(
          chalk.gray(`
extensions:
  llms_txt:
    enabled: true
    generate: true
    sections:
      core_specification:
        enabled: true
      quick_start:
        enabled: true
`)
        )
        process.exit(1)
      }

      await llmsTxtService.writeLlmsTxt(manifest, options.output)

      console.log(chalk.green(`✓ llms.txt generated successfully`))
      console.log(chalk.gray(`\nOutput: ${chalk.cyan(options.output)}`))

      if (options.verbose) {
        const content = await llmsTxtService.generateLlmsTxt(manifest)
        console.log(chalk.gray('\nGenerated content:'))
        console.log(chalk.gray('─'.repeat(50)))
        console.log(content)
        console.log(chalk.gray('─'.repeat(50)))
      }

      console.log(chalk.yellow('\n💡 Next steps:'))
      console.log(chalk.gray(`  1. Review the generated llms.txt file`))
      console.log(chalk.gray(`  2. Validate: ossa llms-txt validate ${options.output} ${manifestPath}`))
      console.log(chalk.gray(`  3. Commit both manifest and llms.txt`))
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error))
      process.exit(1)
    }
  })

// Validate subcommand
llmsTxtCommand
  .command('validate')
  .argument('<llms-txt>', 'Path to llms.txt file')
  .argument('<manifest>', 'Path to OSSA manifest file')
  .option('-v, --verbose', 'Verbose output')
  .description('Validate llms.txt against manifest')
  .action(async (llmsTxtPath: string, manifestPath: string, options: { verbose?: boolean }) => {
    try {
      console.log(chalk.blue(`Validating llms.txt against manifest...`))

      const manifestRepo = container.get(ManifestRepository)
      const llmsTxtService = container.get(LlmsTxtService)

      const manifest = (await manifestRepo.load(manifestPath)) as OssaAgent
      const result = await llmsTxtService.validateLlmsTxt(llmsTxtPath, manifest)

      if (result.valid) {
        console.log(chalk.green('✓ llms.txt is valid'))
      } else {
        console.log(chalk.yellow('⚠ llms.txt validation found issues:'))
        result.warnings.forEach(warning => {
          console.log(chalk.yellow(`  - ${warning}`))
        })
      }

      if (options.verbose) {
        console.log(chalk.gray('\nValidation details:'))
        console.log(chalk.gray(JSON.stringify(result, null, 2)))
      }
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error))
      process.exit(1)
    }
  })

// Sync subcommand
llmsTxtCommand
  .command('sync')
  .argument('<manifest>', 'Path to OSSA manifest file')
  .option('-w, --watch', 'Watch for manifest changes and auto-sync')
  .option('-v, --verbose', 'Verbose output')
  .description('Sync llms.txt with manifest changes')
  .action(async (manifestPath: string, options: { watch?: boolean; verbose?: boolean }) => {
    try {
      console.log(chalk.blue(`Syncing llms.txt from ${manifestPath}...`))

      const llmsTxtService = container.get(LlmsTxtService)

      await llmsTxtService.syncLlmsTxt(manifestPath, options.watch || false)

      console.log(chalk.green('✓ llms.txt synced successfully'))

      if (options.watch) {
        console.log(chalk.blue('\n👀 Watching for changes... (Press Ctrl+C to stop)'))
        await new Promise(() => { })
      } else {
        process.exit(0)
      }
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error))
      process.exit(1)
    }
  })
