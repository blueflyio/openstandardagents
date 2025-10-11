#!/usr/bin/env node
/**
 * OSSA Registry CLI
 *
 * Command-line interface for interacting with OSSA Registry.
 */

import axios from 'axios';
import chalk from 'chalk';
import { Command } from 'commander';
import FormData from 'form-data';
import { existsSync, readFileSync } from 'fs';
import ora from 'ora';
import { join } from 'path';

const program = new Command();

program.name('ossa-registry').description('CLI for OSSA Agent Registry').version('1.0.0');

// ============================================================================
// Configuration
// ============================================================================

interface RegistryConfig {
  url: string;
  token?: string;
}

function loadConfig(): RegistryConfig {
  const defaultConfig: RegistryConfig = {
    url: process.env.OSSA_REGISTRY_URL || 'https://registry.ossa.io/api/v1',
    token: process.env.OSSA_REGISTRY_TOKEN
  };

  const configPath = join(process.cwd(), '.ossarc');
  if (existsSync(configPath)) {
    try {
      const fileConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
      return { ...defaultConfig, ...fileConfig };
    } catch {
      // Ignore parse errors
    }
  }

  return defaultConfig;
}

const config = loadConfig();

// ============================================================================
// API Client
// ============================================================================

const client = axios.create({
  baseURL: config.url,
  headers: config.token ? { Authorization: `Bearer ${config.token}` } : {}
});

// ============================================================================
// Commands
// ============================================================================

// Search agents
program
  .command('search <query>')
  .description('Search for agents')
  .option('-c, --certified', 'Only certified agents')
  .option('--compliance <frameworks...>', 'Filter by compliance')
  .option('--limit <n>', 'Results per page', '20')
  .action(async (query, options) => {
    const spinner = ora('Searching agents...').start();

    try {
      const response = await client.get('/search', {
        params: {
          q: query,
          limit: options.limit,
          filters: {
            certified: options.certified,
            compliance: options.compliance
          }
        }
      });

      spinner.succeed(`Found ${response.data.total} agents`);

      if (response.data.data.length === 0) {
        console.log(chalk.yellow('\nNo agents found.'));
        return;
      }

      console.log('');
      response.data.data.forEach((agent: any) => {
        console.log(chalk.bold.blue(agent.full_name));
        console.log(chalk.gray(`  ${agent.description}`));
        console.log(
          chalk.gray(`  Downloads: ${agent.downloads} | Stars: ${agent.stars} | Latest: ${agent.latest_version}`)
        );
        if (agent.certified) {
          console.log(chalk.green('  ✓ OSSA Certified'));
        }
        console.log('');
      });
    } catch (error: any) {
      spinner.fail('Search failed');
      console.error(chalk.red(error.response?.data?.message || error.message));
      process.exit(1);
    }
  });

// Register new agent
program
  .command('register')
  .description('Register a new agent')
  .requiredOption('-n, --namespace <namespace>', 'Agent namespace')
  .requiredOption('--name <name>', 'Agent name')
  .requiredOption('-d, --description <description>', 'Short description')
  .option('--homepage <url>', 'Homepage URL')
  .option('--repository <url>', 'Repository URL')
  .option('--tags <tags...>', 'Tags')
  .action(async (options) => {
    const spinner = ora('Registering agent...').start();

    try {
      const response = await client.post('/agents', {
        namespace: options.namespace,
        name: options.name,
        description: options.description,
        homepage: options.homepage,
        repository: options.repository,
        tags: options.tags
      });

      spinner.succeed(`Agent registered: ${response.data.full_name}`);
      console.log(chalk.gray(`ID: ${response.data.id}`));
    } catch (error: any) {
      spinner.fail('Registration failed');
      console.error(chalk.red(error.response?.data?.message || error.message));
      process.exit(1);
    }
  });

// Publish version
program
  .command('publish <manifest>')
  .description('Publish a new version')
  .requiredOption('-n, --namespace <namespace>', 'Agent namespace')
  .requiredOption('--name <name>', 'Agent name')
  .requiredOption('-v, --version <version>', 'Version number (semver)')
  .option('-r, --readme <file>', 'README file')
  .option('-s, --signature <file>', 'GPG signature file')
  .action(async (manifestPath, options) => {
    if (!existsSync(manifestPath)) {
      console.error(chalk.red(`Manifest file not found: ${manifestPath}`));
      process.exit(1);
    }

    const spinner = ora('Publishing version...').start();

    try {
      const form = new FormData();
      form.append('version', options.version);
      form.append('manifest', readFileSync(manifestPath), {
        filename: 'agent.yml'
      });

      if (options.readme && existsSync(options.readme)) {
        form.append('readme', readFileSync(options.readme, 'utf-8'));
      }

      if (options.signature && existsSync(options.signature)) {
        form.append('signature', readFileSync(options.signature));
      }

      const response = await client.post(`/agents/${options.namespace}/${options.name}/versions`, form, {
        headers: form.getHeaders()
      });

      spinner.succeed(`Version ${response.data.version} published for ${options.namespace}/${options.name}`);
      console.log(chalk.gray(`Manifest URL: ${response.data.manifest_url}`));
    } catch (error: any) {
      spinner.fail('Publish failed');
      console.error(chalk.red(error.response?.data?.message || error.message));
      process.exit(1);
    }
  });

// Download manifest
program
  .command('install <agent>')
  .description('Download agent manifest')
  .option('-v, --version <version>', 'Specific version (default: latest)')
  .option('-o, --output <file>', 'Output file', 'agent.yml')
  .action(async (agent, options) => {
    const [namespace, name] = agent.split('/');
    if (!namespace || !name) {
      console.error(chalk.red('Invalid agent format. Use: namespace/name'));
      process.exit(1);
    }

    const spinner = ora('Downloading manifest...').start();

    try {
      // Get agent details
      const agentResponse = await client.get(`/agents/${namespace}/${name}`);
      const version = options.version || agentResponse.data.latest_version;

      // Download manifest
      const manifestResponse = await client.get(`/agents/${namespace}/${name}/versions/${version}/manifest`, {
        responseType: 'arraybuffer'
      });

      const fs = await import('fs/promises');
      await fs.writeFile(options.output, manifestResponse.data);

      spinner.succeed(`Downloaded ${agent}@${version} to ${options.output}`);
    } catch (error: any) {
      spinner.fail('Download failed');
      console.error(chalk.red(error.response?.data?.message || error.message));
      process.exit(1);
    }
  });

// List versions
program
  .command('versions <agent>')
  .description('List agent versions')
  .action(async (agent) => {
    const [namespace, name] = agent.split('/');
    if (!namespace || !name) {
      console.error(chalk.red('Invalid agent format. Use: namespace/name'));
      process.exit(1);
    }

    const spinner = ora('Fetching versions...').start();

    try {
      const response = await client.get(`/agents/${namespace}/${name}/versions`);

      spinner.succeed(`Versions for ${agent}`);

      if (response.data.data.length === 0) {
        console.log(chalk.yellow('\nNo versions published.'));
        return;
      }

      console.log('');
      response.data.data.forEach((version: any) => {
        console.log(chalk.bold(version.version));
        console.log(chalk.gray(`  Published: ${new Date(version.created_at).toLocaleDateString()}`));
        console.log(chalk.gray(`  Downloads: ${version.downloads}`));
        if (version.verified) {
          console.log(chalk.green('  ✓ Signature Verified'));
        }
        console.log('');
      });
    } catch (error: any) {
      spinner.fail('Failed to fetch versions');
      console.error(chalk.red(error.response?.data?.message || error.message));
      process.exit(1);
    }
  });

// Request certification
program
  .command('certify <agent>')
  .description('Request OSSA certification')
  .requiredOption('-v, --version <version>', 'Version to certify')
  .requiredOption('-l, --level <level>', 'Certification level (compatible|certified|enterprise)')
  .option('--compliance <frameworks...>', 'Compliance frameworks')
  .option('--docs <url>', 'Documentation URL')
  .action(async (agent, options) => {
    const [namespace, name] = agent.split('/');
    if (!namespace || !name) {
      console.error(chalk.red('Invalid agent format. Use: namespace/name'));
      process.exit(1);
    }

    const spinner = ora('Requesting certification...').start();

    try {
      const response = await client.post(`/certifications/${namespace}/${name}/request`, {
        level: options.level,
        version: options.version,
        compliance_frameworks: options.compliance,
        documentation_url: options.docs
      });

      spinner.succeed('Certification request submitted');
      console.log(chalk.gray(`Request ID: ${response.data.id}`));
      console.log(chalk.gray(`Status: ${response.data.status}`));
    } catch (error: any) {
      spinner.fail('Certification request failed');
      console.error(chalk.red(error.response?.data?.message || error.message));
      process.exit(1);
    }
  });

// Get agent info
program
  .command('info <agent>')
  .description('Get agent information')
  .action(async (agent) => {
    const [namespace, name] = agent.split('/');
    if (!namespace || !name) {
      console.error(chalk.red('Invalid agent format. Use: namespace/name'));
      process.exit(1);
    }

    const spinner = ora('Fetching agent info...').start();

    try {
      const response = await client.get(`/agents/${namespace}/${name}`);
      const data = response.data;

      spinner.stop();

      console.log('');
      console.log(chalk.bold.blue(data.full_name));
      console.log(chalk.gray(data.description));
      console.log('');

      if (data.homepage) {
        console.log(chalk.gray(`Homepage: ${data.homepage}`));
      }
      if (data.repository) {
        console.log(chalk.gray(`Repository: ${data.repository}`));
      }

      console.log('');
      console.log(`Latest Version: ${chalk.bold(data.latest_version)}`);
      console.log(`Downloads: ${chalk.bold(data.downloads)}`);
      console.log(`Stars: ${chalk.bold(data.stars)}`);

      if (data.certified) {
        console.log(chalk.green('\n✓ OSSA Certified'));
      }

      if (data.compliance && data.compliance.length > 0) {
        console.log(`\nCompliance: ${data.compliance.join(', ')}`);
      }

      if (data.tags && data.tags.length > 0) {
        console.log(`\nTags: ${data.tags.join(', ')}`);
      }

      console.log('');
    } catch (error: any) {
      spinner.fail('Failed to fetch agent info');
      console.error(chalk.red(error.response?.data?.message || error.message));
      process.exit(1);
    }
  });

program.parse();
