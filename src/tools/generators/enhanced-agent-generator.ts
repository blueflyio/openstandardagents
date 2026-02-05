#!/usr/bin/env tsx
/**
 * Enhanced Agent Manifest Generator
 *
 * Generates comprehensive OSSA agent manifests using the comprehensive template
 * with all v0.3.3+ features
 *
 * Usage: npm run agent:generate -- --name "My Agent" --type worker
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

interface AgentOptions {
  name: string;
  type?: 'worker' | 'orchestrator' | 'task' | 'workflow';
  description?: string;
  domain?: string;
  capability?: string;
  provider?: string;
  model?: string;
  output?: string;
  template?: string;
}

class EnhancedAgentGenerator {
  private templatePath: string;
  private defaultTemplate: string;

  constructor() {
    this.templatePath = join(
      process.cwd(),
      '.gitlab/agents/templates/TEMPLATE-v0.3.0-comprehensive.ossa.yaml'
    );
    this.defaultTemplate = this.loadTemplate();
  }

  private loadTemplate(): string {
    try {
      if (existsSync(this.templatePath)) {
        return readFileSync(this.templatePath, 'utf-8');
      }
    } catch (error) {
      console.warn(
        `⚠️  Template not found at ${this.templatePath}, using default`
      );
    }

    // Fallback default template
    return `apiVersion: ossa/v0.3.3
kind: Agent
metadata:
  name: {{NAME}}
  version: 1.0.0
  description: {{DESCRIPTION}}
  labels:
    domain: {{DOMAIN}}
    capability: {{CAPABILITY}}
    environment: production
spec:
  role: |
    You are {{DESCRIPTION}}.
  llm:
    provider: {{PROVIDER}}
    model: {{MODEL}}
    temperature: 0.2
  tools: []`;
  }

  private normalizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private generateManifest(options: AgentOptions): string {
    const normalizedName = this.normalizeName(options.name);
    const description = options.description || `${options.name} agent`;
    const domain = options.domain || 'platform';
    const capability = options.capability || normalizedName.replace(/-/g, '_');
    const provider = options.provider || 'anthropic';
    const model = options.model || 'claude-sonnet-4.5-20250929';

    // Replace template variables
    let manifest = this.defaultTemplate
      .replace(/{{NAME}}/g, normalizedName)
      .replace(/{{DESCRIPTION}}/g, description)
      .replace(/{{DOMAIN}}/g, domain)
      .replace(/{{CAPABILITY}}/g, capability)
      .replace(/{{PROVIDER}}/g, provider)
      .replace(/{{MODEL}}/g, model);

    // Parse and customize based on type
    try {
      const parsed = yaml.load(manifest, { schema: yaml.JSON_SCHEMA }) as any;

      // Set kind based on type
      if (options.type === 'task') {
        parsed.kind = 'Task';
      } else if (options.type === 'workflow') {
        parsed.kind = 'Workflow';
      }

      // Add taxonomy if not present
      if (!parsed.metadata.labels) {
        parsed.metadata.labels = {};
      }
      parsed.metadata.labels.domain = domain;
      parsed.metadata.labels.capability = capability;
      parsed.metadata.labels.type = options.type || 'worker';

      // Enhance role based on type
      if (parsed.spec.role) {
        const rolePrefix =
          options.type === 'orchestrator'
            ? 'You are an orchestrator agent that coordinates multiple agents'
            : options.type === 'task'
              ? 'You are a deterministic task executor'
              : 'You are an autonomous agent';

        parsed.spec.role = `${rolePrefix} for ${description}.\n\n${parsed.spec.role}`;
      }

      manifest = yaml.dump(parsed, {
        indent: 2,
        lineWidth: 120,
        quotingType: '"',
        forceQuotes: false,
      });
    } catch (error) {
      console.warn(
        `⚠️  Failed to parse template, using simple replacement: ${(error as Error).message}`
      );
    }

    return manifest;
  }

  async generate(options: AgentOptions): Promise<void> {
    console.log(
      `🚀 Generating ${options.type || 'agent'} manifest: ${options.name}\n`
    );

    const manifest = this.generateManifest(options);
    const outputPath =
      options.output ||
      join(
        process.cwd(),
        `.gitlab/agents/${this.normalizeName(options.name)}/manifest.ossa.yaml`
      );

    // Ensure output directory exists
    const outputDir = outputPath.split('/').slice(0, -1).join('/');
    mkdirSync(outputDir, { recursive: true });

    // Write manifest
    writeFileSync(outputPath, manifest);

    console.log(`✅ Generated: ${outputPath}`);
    console.log(`   Name: ${options.name}`);
    console.log(`   Type: ${options.type || 'agent'}`);
    console.log(`   Domain: ${options.domain || 'platform'}`);
    console.log(
      `   Capability: ${options.capability || this.normalizeName(options.name)}`
    );
  }
}

// CLI interface
function parseArgs(): AgentOptions {
  const options: AgentOptions = {
    name: '',
  };

  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith('--name=')) {
      options.name = arg.split('=')[1];
    } else if (arg.startsWith('--type=')) {
      options.type = arg.split('=')[1] as any;
    } else if (arg.startsWith('--description=')) {
      options.description = arg.split('=')[1];
    } else if (arg.startsWith('--domain=')) {
      options.domain = arg.split('=')[1];
    } else if (arg.startsWith('--capability=')) {
      options.capability = arg.split('=')[1];
    } else if (arg.startsWith('--provider=')) {
      options.provider = arg.split('=')[1];
    } else if (arg.startsWith('--model=')) {
      options.model = arg.split('=')[1];
    } else if (arg.startsWith('--output=')) {
      options.output = arg.split('=')[1];
    } else if (arg.startsWith('--template=')) {
      options.template = arg.split('=')[1];
    }
  });

  if (!options.name) {
    console.error('❌ --name is required');
    console.log(
      'Usage: npm run agent:generate -- --name "My Agent" [--type worker|orchestrator|task] [--domain platform]'
    );
    process.exit(1);
  }

  return options;
}

const options = parseArgs();
const generator = new EnhancedAgentGenerator();
generator.generate(options).catch((error) => {
  console.error('❌ Error generating agent:', error);
  process.exit(1);
});
