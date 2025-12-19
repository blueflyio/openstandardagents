import chalk from 'chalk';
import { Command } from 'commander';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { ValidationService } from '../../services/validation.service.js';

export const testCommand = new Command('test')
  .argument('<path>', 'Path to agent manifest')
  .option('--test-id <id>', 'Run specific test by ID')
  .option('--verbose', 'Verbose output')
  .description('Run agent tests')
  .action(async (manifestPath: string, options: { testId?: string; verbose?: boolean }) => {
    try {
      const manifestRepo = container.get(ManifestRepository);
      const validationService = container.get(ValidationService);
      console.log(chalk.blue(`Loading agent: ${manifestPath}`));
      const manifest: any = await manifestRepo.load(manifestPath);
      const result = await validationService.validate(manifest);
      if (!result.valid) {
        console.error(chalk.red('✗ Agent validation failed'));
        result.errors.forEach((error) => console.error(chalk.red(`  - ${error}`)));
        process.exit(1);
      }
      const agentName = manifest.metadata.name;
      const tests = manifest.spec?.tests || [];
      if (tests.length === 0) {
        console.log(chalk.yellow(`No tests defined for ${agentName}`));
        return;
      }
      const testsToRun = options.testId ? tests.filter((t: any) => t.id === options.testId) : tests;
      if (testsToRun.length === 0) {
        console.error(chalk.red(`✗ Test "${options.testId}" not found`));
        process.exit(1);
      }
      console.log(chalk.blue(`\nRunning ${testsToRun.length} test(s)...\n`));
      let passed = 0;
      let failed = 0;
      for (const test of testsToRun) {
        const testId = test.id || 'unnamed';
        const testType = test.type || 'unit';
        if (options.verbose) {
          console.log(chalk.cyan(`[${testType}] ${testId}`));
        }
        try {
          if (test.assertions) {
            for (const assertion of test.assertions) {
              if (assertion.type === 'equals') {
                const actual = evaluateExpression(assertion.actual, manifest);
                const expected = assertion.expected;
                if (actual !== expected) {
                  throw new Error(`Expected ${expected}, got ${actual}`);
                }
              }
            }
          }
          passed++;
          if (options.verbose) {
            console.log(chalk.green(`  ✓ Passed\n`));
          }
        } catch (error) {
          failed++;
          console.log(
            chalk.red(`  ✗ Failed: ${error instanceof Error ? error.message : String(error)}\n`)
          );
        }
      }
      console.log(chalk.cyan.bold('\nTest Results\n'));
      console.log(chalk.green(`  Passed: ${passed}`));
      if (failed > 0) {
        console.log(chalk.red(`  Failed: ${failed}`));
      }
      console.log(chalk.white(`  Total:  ${passed + failed}\n`));
      if (failed > 0) {
        process.exit(1);
      }
    } catch (error) {
      console.error(
        chalk.red('✗ Test execution failed:'),
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  });

function evaluateExpression(expr: string, manifest: any): any {
  if (expr.startsWith('metadata.')) {
    const path = expr.split('.').slice(1);
    let value: any = manifest.metadata;
    for (const key of path) {
      value = value?.[key];
    }
    return value;
  }
  return expr;
}
