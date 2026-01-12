/**
 * Workflow Help Commands
 * 
 * SOLID: Single Responsibility - Workflow guidance only
 */

import { Command } from 'commander';
import chalk from 'chalk';

export const workflowCommand = new Command('workflow')
  .alias('wf')
  .description('Workflow help commands');

// workflow:release - Show release workflow
workflowCommand
  .command('release')
  .description('Show release workflow')
  .action(() => {
    console.log(chalk.blue('📋 OSSA Release Workflow'));
    console.log(chalk.gray('========================\n'));

    const steps = [
      {
        number: 1,
        description: 'Run version audit to find hardcoded versions',
        command: 'ossa-dev version:audit --fix',
      },
      {
        number: 2,
        description: 'Release new version (one command)',
        command: 'ossa-dev version:release patch|minor|major',
      },
      {
        number: 3,
        description: 'Validate version consistency',
        command: 'ossa-dev version:validate',
      },
      {
        number: 4,
        description: 'Generate spec from source (CI will do this)',
        command: 'ossa-dev spec:generate',
        optional: true,
      },
      {
        number: 5,
        description: 'Commit and push changes',
        command: 'git add . && git commit -m "chore: release vX.Y.Z" && git push',
      },
      {
        number: 6,
        description: 'CI will handle the rest (publish to npm, create GitLab release, etc.)',
        command: '',
        optional: true,
      },
    ];

    steps.forEach(step => {
      console.log(chalk.cyan(`${step.number}. ${step.description}`));
      if (step.command) {
        console.log(chalk.gray(`   ${step.command}`));
      }
      if (step.optional) {
        console.log(chalk.yellow('   (Optional)'));
      }
      console.log('');
    });
  });

// workflow:validate - Show validation workflow
workflowCommand
  .command('validate')
  .description('Show validation workflow')
  .action(() => {
    console.log(chalk.blue('✅ OSSA Validation Workflow'));
    console.log(chalk.gray('===========================\n'));

    const steps = [
      {
        number: 1,
        description: 'Audit for hardcoded versions',
        command: 'ossa-dev version:audit',
      },
      {
        number: 2,
        description: 'Validate version consistency',
        command: 'ossa-dev version:validate',
      },
      {
        number: 3,
        description: 'Validate generated spec',
        command: 'ossa-dev spec:validate spec/vX.Y.Z/ossa-X.Y.Z.schema.json',
      },
    ];

    steps.forEach(step => {
      console.log(chalk.cyan(`${step.number}. ${step.description}`));
      console.log(chalk.gray(`   ${step.command}`));
      console.log('');
    });
  });
