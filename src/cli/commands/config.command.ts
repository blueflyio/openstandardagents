/**
 * ossa config set <key> <value> | get [key] | list | unset <key>
 * Persists to ~/.ossa/config.json. process.env overrides config file when reading.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import {
  getConfigPath,
  getConfigValue,
  setConfigValue,
  unsetConfigValue,
  listConfig,
  KNOWN_KEYS,
} from '../../config/cli-config.js';

export const configCommand = new Command('config')
  .description(
    'Get or set OSSA CLI config (stored in ~/.ossa/config.json). Env vars override config when running commands.'
  )
  .configureHelp({ sortSubcommands: true });

configCommand
  .command('set <key> <value>')
  .description('Set a config key (e.g. SKILLS_PATH, BLUEFLY_SKILLS_CATALOG)')
  .action((key: string, value: string) => {
    if (!key || !value) {
      console.error(chalk.red('Usage: ossa config set <key> <value>'));
      process.exit(1);
    }
    setConfigValue(key, value);
    console.log(chalk.gray(`Config: ${getConfigPath()}`));
    console.log(chalk.green(`${key}=${value}`));
  });

configCommand
  .command('get [key]')
  .description('Get a config value (env overrides file). Omit key to show config path.')
  .action((key: string | undefined) => {
    if (!key) {
      console.log(getConfigPath());
      return;
    }
    const v = getConfigValue(key);
    if (v === undefined || v === '') {
      console.log('');
      process.exit(1);
    }
    console.log(v);
  });

configCommand
  .command('list')
  .description('List all keys and values stored in the config file')
  .option('-q, --quiet', 'Only print keys')
  .action((opts: { quiet?: boolean }) => {
    const data = listConfig();
    const keys = Object.keys(data).sort();
    if (keys.length === 0) {
      console.log(chalk.gray('No keys in config file. Use: ossa config set SKILLS_PATH <path>'));
      console.log(chalk.gray('Config path: ' + getConfigPath()));
      return;
    }
    if (opts.quiet) {
      keys.forEach((k) => console.log(k));
      return;
    }
    console.log(chalk.gray('Config: ' + getConfigPath() + '\n'));
    keys.forEach((k) => {
      const val = data[k];
      const display = val.length > 60 ? val.slice(0, 57) + '...' : val;
      console.log(`  ${chalk.cyan(k)}=${display}`);
    });
  });

configCommand
  .command('unset <key>')
  .description('Remove a key from the config file')
  .action((key: string) => {
    const removed = unsetConfigValue(key);
    if (removed) {
      console.log(chalk.green(`Removed ${key}`));
    } else {
      console.log(chalk.yellow(`Key not in config: ${key}`));
      process.exit(1);
    }
  });

configCommand.addHelpText(
  'after',
  `
Known keys (you can set any key; these are commonly used):
  SKILLS_PATH              Directory for skills add/list (e.g. /Volumes/AgentPlatform/services/marketplace/skills)
  BLUEFLY_SKILLS_MARKETPLACE   Set to 1 to prefer marketplace skills path in MCP
  BLUEFLY_SKILLS_CATALOG   Path to marketplace-skills-catalog.json
  BLUEFLY_SKILLS_PATH      Alias for skills path
  OSSA_WEBAGENTS_API_URL   OSSA UI / agent builder API base URL
  OSSA_CONFIG_PATH         Override config file path
  MCP_URL                  MCP server URL
  GITLAB_URL               GitLab instance URL
  GITLAB_TOKEN             GitLab token (prefer env for secrets)

Examples:
  ossa config set SKILLS_PATH /Volumes/AgentPlatform/services/marketplace/skills
  ossa config get SKILLS_PATH
  ossa config list
  ossa config unset SKILLS_PATH
`
);
