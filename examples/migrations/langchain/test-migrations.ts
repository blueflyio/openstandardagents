#!/usr/bin/env tsx
/**
 * Test script to validate LangChain migrations
 * Run: npm run tsx examples/migrations/langchain/test-migrations.ts
 */

import { LangChainMigrationService } from '../../../src/services/migration/langchain-migration.service.js';
import { ValidationService } from '../../../src/services/validation.service.js';
import { container } from '../../../src/di-container.js';
import * as path from 'path';
import * as fs from 'fs/promises';
import chalk from 'chalk';

const examplesDir = path.dirname(new URL(import.meta.url).pathname);

const examples = [
  {
    name: 'Python ReAct Agent',
    source: '01-python-react-agent-before.py',
    expected: '01-python-react-agent-after.ossa.yaml',
  },
  {
    name: 'TypeScript Conversational Agent',
    source: '02-typescript-conversational-before.ts',
    expected: '02-typescript-conversational-after.ossa.yaml',
  },
  {
    name: 'Python Sequential Chain',
    source: '03-sequential-chain-before.py',
    expected: '03-sequential-chain-after.ossa.yaml',
  },
  {
    name: 'YAML Config-based Agent',
    source: '04-config-based-before.yaml',
    expected: '04-config-based-after.ossa.yaml',
  },
];

async function testMigrations() {
  console.log(chalk.blue('Testing LangChain Migrations\n'));

  const migrationService = new LangChainMigrationService();
  const validationService = container.get(ValidationService);

  let passed = 0;
  let failed = 0;

  for (const example of examples) {
    console.log(chalk.cyan(`Testing: ${example.name}`));
    const sourcePath = path.join(examplesDir, example.source);

    try {
      // Check if source file exists
      await fs.access(sourcePath);

      // Perform migration
      const { manifest, report } = await migrationService.migrate(sourcePath);

      console.log(chalk.gray(`  Source: ${example.source}`));
      console.log(chalk.gray(`  Format: ${report.sourceFormat}`));
      console.log(chalk.gray(`  Components detected: ${report.components.detected.length}`));
      console.log(chalk.gray(`  Mappings: ${report.components.mapped.length}`));
      console.log(chalk.gray(`  Confidence: ${report.confidence}%`));

      // Validate generated manifest
      const validationResult = await validationService.validate(manifest, 'current');

      if (!validationResult.valid) {
        console.log(chalk.red(`  ✗ Validation failed`));
        validationResult.errors.forEach((error) => {
          console.log(chalk.red(`    - ${error.instancePath}: ${error.message}`));
        });
        failed++;
      } else {
        console.log(chalk.green(`  ✓ Manifest is valid`));

        // Check key properties
        const checks = [
          { name: 'apiVersion', value: manifest.apiVersion },
          { name: 'kind', value: manifest.kind },
          { name: 'metadata.name', value: manifest.metadata?.name },
          { name: 'spec.role', value: manifest.spec?.role },
        ];

        let allChecksPass = true;
        checks.forEach((check) => {
          if (!check.value) {
            console.log(chalk.yellow(`  ⚠ Missing ${check.name}`));
            allChecksPass = false;
          }
        });

        if (allChecksPass) {
          console.log(chalk.green(`  ✓ All required fields present`));
          passed++;
        } else {
          failed++;
        }
      }

      // Display warnings
      if (report.warnings.length > 0) {
        console.log(chalk.yellow(`  Warnings: ${report.warnings.length}`));
        if (report.warnings.length <= 3) {
          report.warnings.forEach((w) => console.log(chalk.yellow(`    - ${w}`)));
        }
      }

      console.log('');
    } catch (error) {
      console.log(chalk.red(`  ✗ Migration failed: ${error instanceof Error ? error.message : String(error)}`));
      failed++;
      console.log('');
    }
  }

  // Summary
  console.log(chalk.blue('Summary:'));
  console.log(chalk.green(`  Passed: ${passed}`));
  console.log(chalk.red(`  Failed: ${failed}`));
  console.log(chalk.gray(`  Total: ${examples.length}`));

  if (failed === 0) {
    console.log(chalk.green('\n✓ All migrations successful!'));
    process.exit(0);
  } else {
    console.log(chalk.red('\n✗ Some migrations failed'));
    process.exit(1);
  }
}

testMigrations().catch((error) => {
  console.error(chalk.red('Test script error:'), error);
  process.exit(1);
});
