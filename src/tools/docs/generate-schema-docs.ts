#!/usr/bin/env tsx
/**
 * Generate schema documentation from JSON Schema
 *
 * Usage: npm run docs:schema:generate
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

// Dynamic version detection - find latest spec directory
function getLatestSchemaVersion(): { dir: string; file: string } {
  const specDir = join(process.cwd(), 'spec');
  const dirs = readdirSync(specDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith('v'))
    .map((d) => d.name)
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

  if (dirs.length === 0) {
    throw new Error('No schema version directories found in spec/');
  }

  const latestDir = dirs[0];
  const version = latestDir.slice(1); // Remove 'v' prefix
  return {
    dir: latestDir,
    file: `ossa-${version}.schema.json`,
  };
}

interface SchemaProperty {
  type: string | string[];
  description?: string;
  format?: string;
  pattern?: string;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
  default?: any;
  examples?: any[];
  properties?: Record<string, SchemaProperty>;
  items?: SchemaProperty;
}

// Dynamic paths based on detected version
const schemaVersion = getLatestSchemaVersion();
const SPEC_DIR = join(process.cwd(), 'spec', schemaVersion.dir);
const OUTPUT_DIR = join(process.cwd(), 'docs/schema-reference');

// Field documentation metadata
const FIELD_DOCS: Record<
  string,
  {
    why: string;
    how: string;
    where: string;
    examples: string[];
    relatedFields: string[];
    relatedDocs: string[];
  }
> = {
  'agent.id': {
    why: 'Unique identifier for agent registration, API routing, and inter-agent communication',
    how: 'Use DNS-1123 subdomain format: lowercase alphanumeric with hyphens, max 63 chars',
    where:
      'Used in API endpoints (/agents/{id}), Kubernetes resources, and registry URLs',
    examples: ['my-agent', 'data-processor-v2', 'compliance-checker-prod'],
    relatedFields: ['agent.name', 'agent.version', 'agent.role'],
    relatedDocs: [
      '../cli-reference/ossa-validate.md',
      '../api-reference/core-api.md',
    ],
  },
  'agent.name': {
    why: 'Human-readable name for display in UIs and documentation',
    how: "Use descriptive names that clearly indicate the agent's purpose",
    where: 'Displayed in agent lists, dashboards, and documentation',
    examples: [
      'Data Processing Agent',
      'Compliance Checker',
      'Customer Support Bot',
    ],
    relatedFields: ['agent.id', 'agent.description'],
    relatedDocs: ['../guides/creating-agents.md'],
  },
  'agent.version': {
    why: 'Track agent versions for compatibility, rollback, and change management',
    how: 'Use semantic versioning (MAJOR.MINOR.PATCH)',
    where: 'Used in registry, deployment manifests, and API responses',
    examples: ['1.0.0', '2.1.3', '0.1.0-beta'],
    relatedFields: ['agent.id', 'ossaVersion'],
    relatedDocs: ['../guides/versioning.md'],
  },
  'agent.role': {
    why: 'Classify agents by their function in the system for routing and orchestration',
    how: 'Choose from predefined roles or use custom roles',
    where: 'Used for agent discovery, filtering, and orchestration patterns',
    examples: ['worker', 'orchestrator', 'compliance', 'monitor'],
    relatedFields: ['agent.capabilities', 'agent.taxonomy'],
    relatedDocs: ['../architecture/multi-agent-systems.md'],
  },
  'agent.capabilities': {
    why: 'Define what the agent can do, enabling capability-based routing and discovery',
    how: 'List all capabilities with input/output schemas and descriptions',
    where: 'Used by orchestrators to route tasks and by registry for discovery',
    examples: ['process_data', 'validate_compliance', 'generate_report'],
    relatedFields: ['agent.tools', 'agent.role'],
    relatedDocs: ['../guides/defining-capabilities.md'],
  },
};

function generateFieldDoc(fieldPath: string, property: SchemaProperty): string {
  const metadata = FIELD_DOCS[fieldPath] || {
    why: 'No documentation available',
    how: 'No documentation available',
    where: 'No documentation available',
    examples: [],
    relatedFields: [],
    relatedDocs: [],
  };

  let doc = `# ${fieldPath}\n\n`;

  // Type and requirements
  const typeStr = Array.isArray(property.type)
    ? property.type.join(' | ')
    : property.type;
  doc += `**Type**: \`${typeStr}\`\n`;
  doc += `**Required**: ${property.required ? 'Yes' : 'No'}\n`;
  if (property.format) {
    doc += `**Format**: ${property.format}\n`;
  }
  doc += '\n';

  // Description
  if (property.description) {
    doc += `## Description\n\n${property.description}\n\n`;
  }

  // Why
  doc += `## Why This Field Exists\n\n${metadata.why}\n\n`;

  // How
  doc += `## How to Use\n\n${metadata.how}\n\n`;

  // Where
  doc += `## Where It's Used\n\n${metadata.where}\n\n`;

  // Format requirements
  if (property.pattern) {
    doc += `## Format Requirements\n\n`;
    doc += `Must match pattern: \`${property.pattern}\`\n\n`;
  }

  if (property.enum) {
    doc += `## Allowed Values\n\n`;
    for (const value of property.enum) {
      doc += `- \`${value}\`\n`;
    }
    doc += '\n';
  }

  if (property.minimum !== undefined || property.maximum !== undefined) {
    doc += `## Constraints\n\n`;
    if (property.minimum !== undefined) {
      doc += `- Minimum: ${property.minimum}\n`;
    }
    if (property.maximum !== undefined) {
      doc += `- Maximum: ${property.maximum}\n`;
    }
    doc += '\n';
  }

  if (property.minLength !== undefined || property.maxLength !== undefined) {
    doc += `## Length Constraints\n\n`;
    if (property.minLength !== undefined) {
      doc += `- Minimum length: ${property.minLength}\n`;
    }
    if (property.maxLength !== undefined) {
      doc += `- Maximum length: ${property.maxLength}\n`;
    }
    doc += '\n';
  }

  // Examples
  if (metadata.examples.length > 0) {
    doc += `## Examples\n\n`;
    for (const example of metadata.examples) {
      doc += `\`\`\`yaml\n${fieldPath}: ${example}\n\`\`\`\n\n`;
    }
  }

  // Validation
  doc += `## Validation\n\n`;
  doc += `\`\`\`bash\nossa validate agent.ossa.yaml\n\`\`\`\n\n`;

  // Related fields
  if (metadata.relatedFields.length > 0) {
    doc += `## Related Fields\n\n`;
    for (const field of metadata.relatedFields) {
      const filename = field.replace(/\./g, '-') + '.md';
      doc += `- [${field}](./${filename})\n`;
    }
    doc += '\n';
  }

  // Related documentation
  if (metadata.relatedDocs.length > 0) {
    doc += `## Related Documentation\n\n`;
    for (const docLink of metadata.relatedDocs) {
      doc += `- [${docLink.split('/').pop()?.replace('.md', '')}](${docLink})\n`;
    }
    doc += '\n';
  }

  return doc;
}

function main() {
  console.log('🚀 Generating schema documentation...\n');

  // Create output directory
  mkdirSync(OUTPUT_DIR, { recursive: true });

  // Read schema dynamically
  const schemaPath = join(SPEC_DIR, schemaVersion.file);
  console.log(`📜 Using schema: ${schemaVersion.dir}/${schemaVersion.file}`);
  const schemaContent = readFileSync(schemaPath, 'utf-8');
  const schema = JSON.parse(schemaContent);

  console.log(`📁 Processing schema fields...\n`);

  // Generate documentation for documented fields
  let count = 0;
  for (const [fieldPath, metadata] of Object.entries(FIELD_DOCS)) {
    // Create a mock property for now (in real implementation, extract from schema)
    const property: SchemaProperty = {
      type: 'string',
      description: `The ${fieldPath} field`,
      required: true,
    };

    const docContent = generateFieldDoc(fieldPath, property);
    const filename = fieldPath.replace(/\./g, '-') + '.md';
    const outputFile = join(OUTPUT_DIR, filename);

    writeFileSync(outputFile, docContent);
    console.log(`✅ Generated: ${filename}`);
    count++;
  }

  // Generate index
  const indexContent = `# Schema Reference

Complete reference for the OSSA agent manifest schema.

## Overview

The OSSA schema defines the structure of agent manifests. Every field serves a specific purpose in the agent lifecycle.

## Core Fields

### Agent Identification
- [agent.id](./agent-id.md) - Unique agent identifier
- [agent.name](./agent-name.md) - Human-readable name
- [agent.version](./agent-version.md) - Semantic version
- [agent.role](./agent-role.md) - Agent role classification

### Agent Capabilities
- [agent.capabilities](./agent-capabilities.md) - What the agent can do

## Schema Versions

- **Current**: ${schemaVersion.dir}

See [Versioning Guide](../guides/versioning.md) for migration information.

## Validation

Validate your agent manifests:

\`\`\`bash
ossa validate agent.ossa.yaml
\`\`\`

## Complete Schema

View the complete JSON Schema:
- [${schemaVersion.dir} Schema](https://github.com/blueflyio/openstandardagents/blob/main/spec/${schemaVersion.dir}/${schemaVersion.file})

## Related Documentation

- [CLI Reference](../cli-reference/index.md)
- [API Reference](../api-reference/index.md)
- [Creating Agents Guide](../guides/creating-agents.md)
`;

  writeFileSync(join(OUTPUT_DIR, 'index.md'), indexContent);
  console.log(`✅ Generated: index.md`);

  console.log(`\n✨ Schema documentation generated successfully!`);
  console.log(`📂 Output: ${OUTPUT_DIR}`);
  console.log(`📊 Fields documented: ${count}`);
}

main();
