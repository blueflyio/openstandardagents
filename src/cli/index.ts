#!/usr/bin/env node
/**
 * OSSA CLI v0.1.9
 * Unified command-line interface for OSSA platform
 * OpenAPI-first architecture with full orchestration support
 */

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// CLI modules are implemented as separate commands
// They will be invoked via child_process when needed

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load package.json for version
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../../package.json'), 'utf-8')
);

// Create main CLI program
const program = new Command();

program
  .name('ossa')
  .description('OSSA Platform CLI - OpenAPI-first AI Agent Orchestration')
  .version(packageJson.version)
  .option('-v, --verbose', 'Enable verbose output')
  .option('--api-url <url>', 'Override API URL', process.env.OSSA_API_URL || 'http://localhost:3000')
  .option('--config <path>', 'Path to configuration file');

// Orchestrator commands
const orchestrator = program
  .command('orchestrator')
  .alias('orch')
  .description('Manage agent orchestration platform');

orchestrator
  .command('start')
  .description('Start the orchestration platform')
  .option('--mock-agents', 'Start with mock agents for testing')
  .option('--port <port>', 'Port to run on', '3012')
  .action(async (options) => {
    const { execSync } = await import('child_process');
    const cmd = `node ${join(__dirname, 'orchestrator-platform.js')} start ${options.mockAgents ? '--mock-agents' : ''} --port ${options.port}`;
    execSync(cmd, { stdio: 'inherit' });
  });

orchestrator
  .command('status')
  .description('Check orchestrator status')
  .action(async () => {
    const { execSync } = await import('child_process');
    execSync(`node ${join(__dirname, 'orchestrator-platform.js')} status`, { stdio: 'inherit' });
  });

// Registry commands
const registry = program
  .command('registry')
  .alias('reg')
  .description('Manage agent registry');

registry
  .command('start')
  .description('Start the agent registry service')
  .option('--port <port>', 'Port to run on', '3011')
  .action(async (options) => {
    const { execSync } = await import('child_process');
    execSync(`node ${join(__dirname, 'registry-core.js')} start --port ${options.port}`, { stdio: 'inherit' });
  });

registry
  .command('list')
  .description('List registered agents')
  .action(async () => {
    const { execSync } = await import('child_process');
    execSync(`node ${join(__dirname, 'registry-core.js')} list`, { stdio: 'inherit' });
  });

// Compliance commands
const compliance = program
  .command('compliance')
  .alias('comp')
  .description('OSSA compliance validation');

compliance
  .command('validate')
  .description('Validate OSSA v0.1.9 compliance')
  .option('--spec <path>', 'Path to OpenAPI specification')
  .action(async (options) => {
    const { execSync } = await import('child_process');
    const specPath = options.spec || join(__dirname, '../api/specification.openapi.yml');
    execSync(`node ${join(__dirname, 'compliance-engine.js')} validate --spec ${specPath}`, { stdio: 'inherit' });
  });

compliance
  .command('report')
  .description('Generate compliance report')
  .option('--format <format>', 'Output format (json|html|markdown)', 'json')
  .action(async (options) => {
    const { execSync } = await import('child_process');
    execSync(`node ${join(__dirname, 'compliance-engine.js')} report --format ${options.format}`, { stdio: 'inherit' });
  });

// API commands
const api = program
  .command('api')
  .description('OpenAPI specification management');

api
  .command('validate')
  .description('Validate OpenAPI specification')
  .action(async () => {
    const { execSync } = await import('child_process');
    execSync('npm run api:validate', { stdio: 'inherit' });
  });

api
  .command('generate')
  .description('Generate TypeScript types from OpenAPI spec')
  .action(async () => {
    const { execSync } = await import('child_process');
    execSync('npm run api:generate', { stdio: 'inherit' });
  });

api
  .command('docs')
  .description('Generate API documentation')
  .option('--port <port>', 'Port for documentation server', '8080')
  .action(async (options) => {
    const { execSync } = await import('child_process');
    console.log(`📚 Generating API documentation...`);
    execSync(`npx @redocly/cli preview-docs ${join(__dirname, '../api/specification.openapi.yml')} --port ${options.port}`, { stdio: 'inherit' });
  });

// Infrastructure commands (new!)
const infra = program
  .command('infra')
  .alias('k8s')
  .description('Infrastructure and Kubernetes management');

infra
  .command('deploy')
  .description('Deploy OSSA to Kubernetes')
  .option('--env <environment>', 'Environment (dev|staging|prod)', 'dev')
  .option('--dry-run', 'Perform dry-run without actual deployment')
  .action(async (options) => {
    const { execSync } = await import('child_process');
    const valuesFile = `infrastructure/helm/ossa-chart/values-${options.env}.yaml`;
    const cmd = `helm ${options.dryRun ? 'install --dry-run --debug' : 'upgrade --install'} ossa-${options.env} infrastructure/helm/ossa-chart/ -f ${valuesFile}`;
    console.log(`🚀 Deploying OSSA to ${options.env} environment...`);
    execSync(cmd, { stdio: 'inherit' });
  });

infra
  .command('status')
  .description('Check deployment status')
  .action(async () => {
    const { execSync } = await import('child_process');
    execSync('kubectl get pods,svc,ingress -l app.kubernetes.io/name=ossa', { stdio: 'inherit' });
  });

// Development commands
const dev = program
  .command('dev')
  .description('Development utilities');

dev
  .command('start')
  .description('Start development environment')
  .option('--with-agents', 'Start with mock agents')
  .action(async (options) => {
    const { execSync } = await import('child_process');
    if (options.withAgents) {
      execSync('npm run dev:with-agents', { stdio: 'inherit' });
    } else {
      execSync('npm run dev', { stdio: 'inherit' });
    }
  });

dev
  .command('test')
  .description('Run tests')
  .option('--watch', 'Run in watch mode')
  .option('--coverage', 'Generate coverage report')
  .action(async (options) => {
    const { execSync } = await import('child_process');
    if (options.watch) {
      execSync('npm run test:watch', { stdio: 'inherit' });
    } else if (options.coverage) {
      execSync('npm run test:coverage', { stdio: 'inherit' });
    } else {
      execSync('npm test', { stdio: 'inherit' });
    }
  });

// Version info command
program
  .command('info')
  .description('Display OSSA platform information')
  .action(() => {
    console.log(`
🏛️  OSSA Platform v${packageJson.version}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Package: @bluefly/open-standards-scalable-agents
🔧 Node Version: ${process.version}
🌐 API URL: ${process.env.OSSA_API_URL || 'http://localhost:3000'}
📁 Working Directory: ${process.cwd()}
🚀 Infrastructure: OrbStack + Kubernetes + Helm
📝 OpenAPI Spec: v3.1.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Available Commands:
  ossa orchestrator  - Manage agent orchestration
  ossa registry      - Manage agent registry
  ossa compliance    - OSSA compliance validation
  ossa api          - OpenAPI specification tools
  ossa infra        - Infrastructure management
  ossa dev          - Development utilities
  ossa info         - Platform information

Run 'ossa <command> --help' for command details
    `);
  });

// Parse command-line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

export default program;