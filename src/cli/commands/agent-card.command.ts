/**
 * ossa agent-card — Generate and validate .well-known/agent-card.json
 *
 * Converts OSSA manifests into Google A2A-compatible agent cards
 * for agent discovery and interoperability.
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { fileURLToPath } from 'url';
import { AgentCardGenerator } from '../../services/agent-card-generator.js';
import type { OssaAgent } from '../../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const agentCardCommand = new Command('agent-card')
  .description(
    'Generate and validate agent cards from OSSA manifests. Serve at .well-known/agent-card.json or .well-known/agent.json (A2A). Card is a projection; manifest is single source of truth.'
  )
  .addHelpText(
    'after',
    'Well-known: For A2A compatibility serve the same JSON at /.well-known/agent.json. OSSA schema: spec/v0.4/agent-card.schema.json'
  );

// ── ossa agent-card generate ──────────────────────────────────────────

agentCardCommand
  .command('generate')
  .argument('<manifest>', 'Path to OSSA manifest (.ossa.yaml or .json)')
  .option('-o, --output <path>', 'Output path', '.well-known/agent-card.json')
  .option('--namespace <ns>', 'Agent namespace for URI', 'default')
  .option('--uri <uri>', 'Override agent URI')
  .option('--http <url>', 'HTTP endpoint URL')
  .option('--grpc <url>', 'gRPC endpoint URL')
  .option('--websocket <url>', 'WebSocket endpoint URL')
  .option(
    '--manifest-ref <url>',
    'URL to full OSSA manifest (single source of truth)'
  )
  .option(
    '--manifest-digest <digest>',
    'Content digest of manifest (e.g. SHA-256)'
  )
  .option('--compute-digest', 'Compute SHA-256 digest from manifest content')
  .option(
    '--card-profile <profile>',
    'Card profile: minimal, discovery, or full',
    'full'
  )
  .option('--stdout', 'Print to stdout instead of writing file')
  .description(
    'Generate agent-card.json from an OSSA manifest. Serve at .well-known/agent-card.json or .well-known/agent.json (A2A).'
  )
  .action(
    async (
      manifestPath: string,
      opts: {
        output: string;
        namespace?: string;
        uri?: string;
        http?: string;
        grpc?: string;
        websocket?: string;
        manifestRef?: string;
        manifestDigest?: string;
        computeDigest?: boolean;
        cardProfile?: string;
        stdout?: boolean;
      }
    ) => {
      try {
        // Read manifest
        const fullPath = path.resolve(manifestPath);
        if (!fs.existsSync(fullPath)) {
          console.error(chalk.red(`✗ Manifest not found: ${fullPath}`));
          process.exit(1);
        }

        const content = fs.readFileSync(fullPath, 'utf-8');
        let manifest: OssaAgent;

        if (fullPath.endsWith('.yaml') || fullPath.endsWith('.yml')) {
          manifest = yaml.load(content) as OssaAgent;
        } else {
          manifest = JSON.parse(content) as OssaAgent;
        }

        // Build options
        const endpoints: Record<string, string> = {};
        if (opts.http) endpoints.http = opts.http;
        if (opts.grpc) endpoints.grpc = opts.grpc;
        if (opts.websocket) endpoints.websocket = opts.websocket;

        const profile =
          opts.cardProfile === 'minimal' ||
          opts.cardProfile === 'discovery' ||
          opts.cardProfile === 'full'
            ? opts.cardProfile
            : undefined;

        const generator = new AgentCardGenerator();
        const result = generator.generate(manifest, {
          namespace: opts.namespace,
          uri: opts.uri,
          endpoints: Object.keys(endpoints).length > 0 ? endpoints : undefined,
          manifestRef: opts.manifestRef,
          manifestDigest: opts.manifestDigest,
          manifestContent: opts.computeDigest ? content : undefined,
          cardProfile: profile,
        });

        // Show warnings
        for (const warning of result.warnings) {
          console.error(chalk.yellow(`⚠ ${warning}`));
        }

        if (!result.success) {
          for (const error of result.errors) {
            console.error(chalk.red(`✗ ${error}`));
          }
          process.exit(1);
        }

        if (opts.stdout) {
          console.log(result.json);
          return;
        }

        // Write output
        const outputPath = path.resolve(opts.output);
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(outputPath, result.json! + '\n', 'utf-8');
        console.log(
          chalk.green(
            `✓ Agent card generated: ${path.relative(process.cwd(), outputPath)}`
          )
        );
        console.log(
          chalk.gray(`  Agent: ${result.card!.name} (${result.card!.uri})`)
        );
        console.log(
          chalk.gray(
            `  Capabilities: ${result.card!.capabilities.join(', ') || 'none'}`
          )
        );
        console.log(
          chalk.gray(`  Transport: ${result.card!.transport.join(', ')}`)
        );
      } catch (error: unknown) {
        console.error(
          chalk.red('✗ Generation failed:'),
          error instanceof Error ? error.message : String(error)
        );
        process.exit(1);
      }
    }
  );

// ── ossa agent-card validate ──────────────────────────────────────────

agentCardCommand
  .command('validate')
  .argument('<file>', 'Path to agent-card.json to validate')
  .description('Validate an agent-card.json against the OSSA schema')
  .action(async (filePath: string) => {
    try {
      const fullPath = path.resolve(filePath);
      if (!fs.existsSync(fullPath)) {
        console.error(chalk.red(`✗ File not found: ${fullPath}`));
        process.exit(1);
      }

      const content = fs.readFileSync(fullPath, 'utf-8');
      let card: unknown;
      try {
        card = JSON.parse(content);
      } catch {
        console.error(chalk.red('✗ Invalid JSON'));
        process.exit(1);
      }

      // Load schema
      const schemaPath = path.resolve(
        __dirname,
        '../../../spec/v0.4/agent-card.schema.json'
      );
      if (!fs.existsSync(schemaPath)) {
        console.error(
          chalk.red(
            '✗ Agent card schema not found at spec/v0.4/agent-card.schema.json'
          )
        );
        process.exit(1);
      }

      const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

      const ajv = new Ajv({ allErrors: true, verbose: true });
      addFormats(ajv);
      const validate = ajv.compile(schema);

      if (validate(card)) {
        console.log(chalk.green('✓ Agent card is valid'));
        const c = card as Record<string, unknown>;
        console.log(chalk.gray(`  Name: ${c.name}`));
        console.log(chalk.gray(`  URI: ${c.uri}`));
        console.log(
          chalk.gray(`  Version: ${c.version} (OSSA ${c.ossaVersion})`)
        );
      } else {
        console.error(chalk.red('✗ Agent card validation failed:'));
        for (const error of validate.errors || []) {
          console.error(chalk.red(`  ${error.instancePath} ${error.message}`));
        }
        process.exit(1);
      }
    } catch (error: unknown) {
      console.error(
        chalk.red('✗ Validation failed:'),
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  });
