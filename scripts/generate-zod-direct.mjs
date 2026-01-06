#!/usr/bin/env node
/**
 * Direct Zod schema generation from OpenAPI
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

async function generate() {
  const outputDir = join(projectRoot, 'src/types/generated/openapi');
  mkdirSync(outputDir, { recursive: true });

  console.log('Generating Zod schemas from OpenAPI...\n');

  // 1. Generate common schemas first
  const commonSchemasDir = join(projectRoot, 'openapi/schemas/common');
  const schemaFiles = await glob('*.yaml', {
    cwd: commonSchemasDir,
    absolute: true,
  });

  console.log(`Found ${schemaFiles.length} common schema files`);

  const allSchemas = {};
  for (const file of schemaFiles) {
    try {
      const content = readFileSync(file, 'utf8');
      const parsed = YAML.parse(content);
      if (parsed.components?.schemas) {
        Object.assign(allSchemas, parsed.components.schemas);
        console.log(`  Loaded ${Object.keys(parsed.components.schemas).length} schemas from ${file.split('/').pop()}`);
      }
    } catch (error) {
      console.error(`Error reading ${file}:`, error.message);
    }
  }

  console.log(`\nTotal schemas: ${Object.keys(allSchemas).length}\n`);

  // Generate Zod file
  const zodContent = generateZodFile(allSchemas, 'Common Shared Schemas', '0.3.3', 'ossa/v0.3.3');
  const outputPath = join(outputDir, 'common-schemas.zod.ts');
  writeFileSync(outputPath, zodContent, 'utf8');
  console.log(`✅ Generated: ${outputPath}`);

  // 2. Generate from individual OpenAPI files
  const openapiFiles = await glob('openapi/**/*.yaml', {
    ignore: ['**/schemas/**', '**/node_modules/**', '**/dist/**'],
    cwd: projectRoot,
    absolute: true,
  });

  console.log(`\nFound ${openapiFiles.length} OpenAPI files\n`);

  let totalCreated = 1; // common-schemas.zod.ts

  for (const file of openapiFiles.slice(0, 10)) { // Limit to first 10 for now
    try {
      const content = readFileSync(file, 'utf8');
      const parsed = YAML.parse(content);
      
      if (parsed.components?.schemas && Object.keys(parsed.components.schemas).length > 0) {
        const fileName = file.split('/').pop().replace(/\.(yaml|yml)$/, '');
        const zodContent = generateZodFile(
          parsed.components.schemas,
          parsed.info?.title || fileName,
          '0.3.3',
          'ossa/v0.3.3',
          file
        );
        const outputPath = join(outputDir, `${fileName}.zod.ts`);
        writeFileSync(outputPath, zodContent, 'utf8');
        console.log(`✅ Generated: ${fileName}.zod.ts (${Object.keys(parsed.components.schemas).length} schemas)`);
        totalCreated++;
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  }

  console.log(`\n✅ Generated ${totalCreated} Zod schema files`);
}

function generateZodFile(schemas, title, version, apiVersion, sourceFile) {
  const lines = [];
  const refs = new Map();

  // Header
  lines.push('/**');
  lines.push(` * ${title} - Zod Schemas`);
  lines.push(' *');
  lines.push(' * AUTO-GENERATED - DO NOT EDIT');
  lines.push(` * Generated from: ${sourceFile || 'shared schemas'}`);
  lines.push(` * OSSA Version: ${version}`);
  lines.push(` * API Version: ${apiVersion}`);
  lines.push(` * Generated on: ${new Date().toISOString()}`);
  lines.push(' */');
  lines.push('');
  lines.push("import { z } from 'zod';");
  
  if (sourceFile && !sourceFile.includes('schemas/common')) {
    lines.push("import * as CommonSchemas from './common-schemas.zod';");
  }
  
  lines.push('');

  // Collect schema names
  for (const name of Object.keys(schemas)) {
    refs.set(name, toSchemaName(name));
  }

  // Generate schemas
  lines.push('// ============================================================================');
  lines.push('// Component Schemas');
  lines.push('// ============================================================================');
  lines.push('');

  for (const [name, schema] of Object.entries(schemas)) {
    const schemaName = toSchemaName(name);
    const typeName = name;

    if (schema.description) {
      lines.push('/**');
      lines.push(` * ${schema.description.split('\n').join('\n * ')}`);
      lines.push(' */');
    }

    const zodSchema = toZodSchema(schema, name, refs, new Set());
    lines.push(`export const ${schemaName} = ${zodSchema};`);
    lines.push('');
    lines.push(`export type ${typeName} = z.infer<typeof ${schemaName}>;`);
    lines.push('');
  }

  return lines.join('\n');
}

function toZodSchema(schema, schemaName, refs, visited) {
  if (schema.$ref) {
    const refName = schema.$ref.replace('#/components/schemas/', '');
    if (refs.has(refName)) {
      return refs.get(refName);
    }
    if (schema.$ref.includes('../schemas/common/') || schema.$ref.includes('schemas/common/')) {
      const refSchema = schema.$ref.split('#/components/schemas/')[1];
      if (refSchema) {
        return `CommonSchemas.${toSchemaName(refSchema)}`;
      }
    }
    return 'z.unknown()';
  }

  if (visited.has(schemaName)) {
    return 'z.unknown()';
  }
  visited.add(schemaName);

  if (schema.allOf && schema.allOf.length > 0) {
    const schemas = schema.allOf.map((s, i) =>
      toZodSchema(s, `${schemaName}AllOf${i}`, refs, new Set(visited))
    );
    if (schemas.length === 2) {
      return `z.intersection(${schemas[0]}, ${schemas[1]})`;
    }
    return schemas.reduce((acc, s) => `z.intersection(${acc}, ${s})`);
  }

  if (schema.oneOf || schema.anyOf) {
    const unionSchemas = (schema.oneOf || schema.anyOf || []).map((s, i) =>
      toZodSchema(s, `${schemaName}Union${i}`, refs, new Set(visited))
    );
    return `z.union([${unionSchemas.join(', ')}])`;
  }

  if (schema.const !== undefined) {
    return `z.literal(${JSON.stringify(schema.const)})`;
  }

  if (schema.enum && schema.enum.length > 0) {
    const enumValues = schema.enum.map((v) => JSON.stringify(v)).join(', ');
    return `z.enum([${enumValues}])`;
  }

  let zodSchema = '';

  switch (schema.type) {
    case 'string':
      zodSchema = generateStringSchema(schema);
      break;
    case 'number':
    case 'integer':
      zodSchema = generateNumberSchema(schema);
      break;
    case 'boolean':
      zodSchema = 'z.boolean()';
      break;
    case 'array':
      zodSchema = generateArraySchema(schema, schemaName, refs, visited);
      break;
    case 'object':
      zodSchema = generateObjectSchema(schema, schemaName, refs, visited);
      break;
    default:
      if (schema.properties) {
        zodSchema = generateObjectSchema(schema, schemaName, refs, visited);
      } else {
        zodSchema = 'z.unknown()';
      }
  }

  if (schema.nullable) {
    zodSchema = `${zodSchema}.nullable()`;
  }

  visited.delete(schemaName);
  return zodSchema;
}

function generateStringSchema(schema) {
  let zodSchema = 'z.string()';
  switch (schema.format) {
    case 'uuid':
      zodSchema = 'z.string().uuid()';
      break;
    case 'email':
      zodSchema = 'z.string().email()';
      break;
    case 'date-time':
      zodSchema = 'z.string().datetime()';
      break;
    case 'uri':
      zodSchema = 'z.string().url()';
      break;
  }
  if (schema.minLength !== undefined) {
    zodSchema += `.min(${schema.minLength})`;
  }
  if (schema.maxLength !== undefined) {
    zodSchema += `.max(${schema.maxLength})`;
  }
  if (schema.pattern) {
    const escaped = schema.pattern.replace(/\//g, '\\/');
    zodSchema += `.regex(/${escaped}/)`;
  }
  return zodSchema;
}

function generateNumberSchema(schema) {
  const isInt = schema.type === 'integer';
  let zodSchema = isInt ? 'z.number().int()' : 'z.number()';
  if (schema.minimum !== undefined) {
    zodSchema += `.min(${schema.minimum})`;
  }
  if (schema.maximum !== undefined) {
    zodSchema += `.max(${schema.maximum})`;
  }
  return zodSchema;
}

function generateArraySchema(schema, schemaName, refs, visited) {
  if (schema.items) {
    const itemSchema = toZodSchema(schema.items, `${schemaName}Item`, refs, new Set(visited));
    return `z.array(${itemSchema})`;
  }
  return 'z.array(z.unknown())';
}

function generateObjectSchema(schema, schemaName, refs, visited) {
  if (!schema.properties) {
    if (schema.additionalProperties === false) {
      return 'z.object({}).strict()';
    }
    return 'z.record(z.string(), z.unknown())';
  }

  const props = [];
  for (const [key, propSchema] of Object.entries(schema.properties)) {
    const isRequired = schema.required?.includes(key) ?? false;
    const propZod = toZodSchema(propSchema, `${schemaName}${capitalize(key)}`, refs, new Set(visited));
    if (isRequired) {
      props.push(`  ${key}: ${propZod}`);
    } else {
      props.push(`  ${key}: ${propZod}.optional()`);
    }
  }

  let objectSchema = `z.object({\n${props.join(',\n')}\n})`;

  if (schema.additionalProperties === false) {
    objectSchema += '.strict()';
  }

  return objectSchema;
}

function toSchemaName(name) {
  return `${name.charAt(0).toLowerCase() + name.slice(1)}Schema`;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

generate().catch(console.error);
