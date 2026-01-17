#!/usr/bin/env tsx
/**
 * Merge v0.3.5 component schemas into main schema.json
 * 
 * This script:
 * 1. Reads the base v0.3.4 schema
 * 2. Merges all v0.3.5 extension schemas
 * 3. Generates the complete ossa-0.3.5.schema.json
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const rootDir = process.cwd();
const specDir = join(rootDir, 'spec');
const v035Dir = join(specDir, 'v0.3.5');
const v034SchemaPath = join(specDir, 'v0.3.4', 'ossa-0.3.4.schema.json');
const outputPath = join(v035Dir, 'ossa-0.3.5.schema.json');

interface SchemaDefinition {
  definitions?: Record<string, unknown>;
  properties?: Record<string, unknown>;
}

function mergeSchemas(base: any, extension: SchemaDefinition): any {
  const merged = JSON.parse(JSON.stringify(base));
  
  // Merge definitions
  if (extension.definitions) {
    merged.definitions = merged.definitions || {};
    Object.assign(merged.definitions, extension.definitions);
  }
  
  // Merge properties (for extensions)
  if (extension.properties) {
    // This will be merged into extensions.properties in the main schema
    return extension.properties;
  }
  
  return merged;
}

function main() {
  console.log('🔧 Merging OSSA v0.3.5 schemas...\n');
  
  // Read base v0.3.4 schema
  const baseSchema = JSON.parse(readFileSync(v034SchemaPath, 'utf-8'));
  
  // Update metadata for v0.3.5
  baseSchema.$id = 'https://openstandardagents.org/schemas/v0.3.5/manifest.json';
  baseSchema.title = 'OSSA v0.3.5 Manifest Schema';
  baseSchema.description = 'Open Standard for Software Agents (OSSA) v0.3.5 - The Next OpenAPI for Software Agents. A specification standard (not a framework) that defines contracts/metadata for production agent systems. Includes completion signals, checkpointing, MoE, BAT framework, MOE metrics, Flow kind, capability discovery, feedback loops, and infrastructure substrate.';
  
  // Update apiVersion pattern to include v0.3.5
  baseSchema.properties.apiVersion.pattern = '^ossa/v(0\\.3\\.[4-9]|0\\.3\\.[0-9]+(-[a-zA-Z0-9]+)?|0\\.2\\.[2-9](-dev)?|1)(\\.[0-9]+)?(-[a-zA-Z0-9]+)?$';
  baseSchema.properties.apiVersion.examples = ['ossa/v0.3.5', 'ossa/v0.3.4', 'ossa/v1'];
  
  // Add Flow to kind enum
  if (!baseSchema.properties.kind.enum.includes('Flow')) {
    baseSchema.properties.kind.enum.push('Flow');
  }
  
  // Initialize definitions if not present
  baseSchema.definitions = baseSchema.definitions || {};
  
  // Load and merge extension schemas
  const extensionFiles = [
    'completion-signals.schema.json',
    'checkpoint.schema.json',
    'mixture-of-experts.schema.json',
    'bat-framework.schema.json',
    'moe-metrics.schema.json',
    'flow-kind.schema.json',
    'capability-discovery.schema.json',
    'feedback-loops.schema.json',
    'infrastructure-substrate.schema.json',
  ];
  
  const extensionProperties: Record<string, any> = {};
  
  for (const file of extensionFiles) {
    const filePath = join(v035Dir, file);
    try {
      const extension = JSON.parse(readFileSync(filePath, 'utf-8'));
      
      // Merge definitions
      if (extension.definitions) {
        Object.assign(baseSchema.definitions, extension.definitions);
      }
      
      // Collect properties for extensions section
      if (extension.properties) {
        Object.assign(extensionProperties, extension.properties);
      }
      
      console.log(`  ✅ Merged ${file}`);
    } catch (error) {
      console.error(`  ❌ Failed to merge ${file}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Add v0.3.5 extensions to extensions.properties
  if (!baseSchema.definitions.Extensions) {
    baseSchema.definitions.Extensions = {
      type: 'object',
      description: 'Framework-specific extensions',
      properties: {},
      additionalProperties: true,
    };
  }
  
  const extensionsDef = baseSchema.definitions.Extensions as any;
  if (!extensionsDef.properties) {
    extensionsDef.properties = {};
  }
  
  // Add v0.3.5 extension properties
  Object.assign(extensionsDef.properties, extensionProperties);
  
  // Add Flow kind support
  baseSchema.allOf.push({
    if: {
      properties: {
        kind: {
          const: 'Flow',
        },
      },
    },
    then: {
      properties: {
        spec: {
          $ref: '#/definitions/FlowSpec',
        },
      },
      required: ['spec'],
    },
  });
  
  // Add completion signals to AgentSpec
  if (baseSchema.definitions.AgentSpec) {
    const agentSpec = baseSchema.definitions.AgentSpec as any;
    if (!agentSpec.properties) {
      agentSpec.properties = {};
    }
    agentSpec.properties.completion = {
      $ref: '#/definitions/CompletionSignalConfiguration',
    };
    agentSpec.properties.checkpointing = {
      $ref: '#/definitions/CheckpointConfiguration',
    };
  }
  
  // Write merged schema
  writeFileSync(
    outputPath,
    JSON.stringify(baseSchema, null, 2) + '\n',
    'utf-8'
  );
  
  console.log(`\n✅ Generated: ${outputPath}`);
  console.log(`   Definitions: ${Object.keys(baseSchema.definitions).length}`);
  console.log(`   Extensions: ${Object.keys(extensionsDef.properties).length}`);
  console.log(`\n🎉 OSSA v0.3.5 schema merge complete!`);
}

main();
