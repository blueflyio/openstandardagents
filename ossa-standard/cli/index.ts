#!/usr/bin/env node

import { program } from 'commander';
import { validateAgent } from '../src/validation';
import { initWorkspace } from '../src/workspace';
import { createAgent } from '../src/agent';
import { version } from '../package.json';
import chalk from 'chalk';

program
  .name('ossa')
  .description('OSSA - Open Standard for Scalable Agents')
  .version(version);

program
  .command('init [path]')
  .description('Initialize a new OSSA workspace')
  .action(async (path = '.') => {
    try {
      await initWorkspace(path);
      console.log(chalk.green(`✅ Successfully initialized OSSA workspace in ${path}`));
    } catch (error) {
      console.error(chalk.red(`❌ Error initializing workspace: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('agent:create <name>')
  .description('Create a new agent')
  .option('-t, --type <type>', 'Agent type (tool, orchestrator, specialized)', 'tool')
  .action(async (name, options) => {
    try {
      await createAgent(name, options);
      console.log(chalk.green(`✅ Successfully created agent: ${name}`));
    } catch (error) {
      console.error(chalk.red(`❌ Error creating agent: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('validate <path>')
  .description('Validate an agent or workspace')
  .action(async (path) => {
    try {
      const result = await validateAgent(path);
      if (result.valid) {
        console.log(chalk.green('✅ Agent is valid'));
      } else {
        console.error(chalk.red('❌ Agent validation failed:'));
        console.error(JSON.stringify(result.errors, null, 2));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`❌ Validation error: ${error.message}`));
      process.exit(1);
    }
  });

program.parse(process.argv);
