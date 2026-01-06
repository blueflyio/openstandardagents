#!/usr/bin/env node
/**
 * Generate Zod schemas from OpenAPI - Direct execution
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname, basename } from 'path';
import { glob } from 'glob';
import YAML from 'yaml';

function safeParseYAML(content) {
  return YAML.parse(content, {
    maxAliasCount: 100,
    customTags: [],
    merge: false,
  });
}

function toSchemaName(name) {
  return `${name.charAt(0).toLowerCase() + name.slice(1)}Schema`;
}

function toTypeName(name) {
  return name;
}

function toZodSchema(schema, schemaName, refs, visited = new Set()) {
  if (schema.$ref) {
    const refName = schema.$ref.replace('#/components/schemas/', '');
    if (refs.has(refName)) {
      return refs.get(refName);
    }
    if (schema.$ref.includes('../schemas/common/') || schema.$ref.includes('schemas/common/')) {
      const parts = schema.$ref.split('#/components/schemas/');
      if (parts.length > 1) {
        return `CommonSchemas.${toSchemaName(parts[1])}`;
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
      zodSchema = 'z.string()';
      if (schema.format === 'uuid') zodSchema = 'z.string().uuid()';
      else if (schema.format === 'email') zodSchema = 'z.string().email()';
      else if (schema.format === 'date-time') zodSchema = 'z.string().datetime()';
      else if (schema.format === 'date') zodSchema = 'z.string().date()';
      else if (schema.format === 'uri') zodSchema = 'z.string().url()';
      if (schema.minLength !== undefined) zodSchema += `.min(${schema.minLength})`;
      if (schema.maxLength !== undefined) zodSchema += `.max(${schema.maxLength})`;
      if (schema.pattern) {
        const escaped = schema.pattern.replace(/\//g, '\\/');
        zodSchema += `.regex(/${escaped}/)`;
      }
      break;
    case 'number':
    case 'integer':
      zodSchema = schema.type === 'integer' ? 'z.number().int()' : 'z.number()';
      if (schema.minimum !== undefined) zodSchema += `.min(${schema.minimum})`;
      if (schema.maximum !== undefined) zodSchema += `.max(${schema.maximum})`;
      break;
    case 'boolean':
      zodSchema = 'z.boolean()';
      break;
    case 'array':
      if (schema.items) {
        const itemSchema = toZodSchema(schema.items, `${schemaName}Item`, refs, new Set(visited));
        zodSchema = `z.array(${itemSchema})`;
      } else {
        zodSchema = 'z.array(z.unknown())';
      }
      break;
    case 'object':
      if (schema.properties) {
        const props = [];
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          const isRequired = schema.required?.includes(key) ?? false;
          const propZod = toZodSchema(propSchema, `${schemaName}${key.charAt(0).toUpperCase() + key.slice(1)}`, refs, new Set(visited));
          if (isRequired) {
            props.push(`  ${key}: ${propZod}`);
          } else {
            props.push(`  ${key}: ${propZod}.optional()`);
          }
        }
        zodSchema = `z.object({\n${props.join(',\n')}\n})`;
        if (schema.additionalProperties === false) {
          zodSchema += '.strict()';
        }
      } else {
        zodSchema = 'z.record(z.string(), z.unknown())';
      }
      break;
    default:
      if (schema.properties) {
        const props = [];
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          const isRequired = schema.required?.includes(key) ?? false;
          const propZod = toZodSchema(propSchema, `${schemaName}${key.charAt(0).toUpperCase() + key.slice(1)}`, refs, new Set(visited));
          if (isRequired) {
            props.push(`  ${key}: ${propZod}`);
          } else {
            props.push(`  ${key}: ${propZod}.optional()`);
          }
        }
        zodSchema = `z.object({\n${props.join(',\n')}\n})`;
      } else {
        zodSchema = 'z.unknown()';
      }
  }

  if (schema.nullable) {
    zodSchema += '.nullable()';
  }

  visited.delete(schemaName);
  return zodSchema;
}

function generateZodFile(schemas, title, version, apiVersion, sourceFile, outputDir) {
  const lines = [];
  const refs = new Map();

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

  for (const name of Object.keys(schemas)) {
    refs.set(name, toSchemaName(name));
  }

  lines.push('// ============================================================================');
  lines.push('// Component Schemas');
  lines.push('// ============================================================================');
  lines.push('');

  for (const [name, schema] of Object.entries(schemas)) {
    const schemaName = toSchemaName(name);
    const typeName = toTypeName(name);

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

async function main() {
  const outputDir = join(process.cwd(), 'src/types/generated/openapi');
  mkdirSync(outputDir, { recursive: true });

  const version = '0.3.3';
  const apiVersion = 'ossa/v0.3.3';

  console.log('Generating Zod schemas from OpenAPI specs...\n');

  // Generate common schemas first
  const schemaFiles = await glob('openapi/schemas/common/*.yaml', {
    cwd: process.cwd(),
    absolute: true,
  });

  console.log(`Found ${schemaFiles.length} common schema files`);

  const allSchemas = {};
  for (const file of schemaFiles) {
    try {
      const content = readFileSync(file, 'utf8');
      const parsed = safeParseYAML(content);
      if (parsed.components?.schemas) {
        Object.assign(allSchemas, parsed.components.schemas);
      }
    } catch (error) {
      console.error(`Error reading ${file}:`, error.message);
    }
  }

  if (Object.keys(allSchemas).length > 0) {
    const outputPath = join(outputDir, 'common-schemas.zod.ts');
    const content = generateZodFile(allSchemas, 'Common Shared Schemas', version, apiVersion, undefined, outputDir);
    writeFileSync(outputPath, content, 'utf8');
    console.log(`✅ Generated common-schemas.zod.ts (${Object.keys(allSchemas).length} schemas)`);
  }

  // Generate from individual OpenAPI files
  const openapiFiles = await glob('openapi/**/*.yaml', {
    ignore: ['**/schemas/**', '**/node_modules/**', '**/dist/**'],
    cwd: process.cwd(),
    absolute: true,
  });

  console.log(`Found ${openapiFiles.length} OpenAPI files\n`);

  let totalCreated = 0;
  for (const file of openapiFiles) {
    try {
      const content = readFileSync(file, 'utf8');
      const parsed = safeParseYAML(content);

      if (!parsed.components?.schemas || Object.keys(parsed.components.schemas).length === 0) {
        continue;
      }

      const fileName = basename(file, '.yaml');
      const outputPath = join(outputDir, `${fileName}.zod.ts`);
      const zodContent = generateZodFile(
        parsed.components.schemas,
        parsed.info?.title || fileName,
        version,
        apiVersion,
        file,
        outputDir
      );

      writeFileSync(outputPath, zodContent, 'utf8');
      totalCreated++;
      console.log(`✅ Generated ${fileName}.zod.ts`);
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }

  console.log(`\n✅ Generation complete! Created ${totalCreated + 1} files`);
}

main().catch(console.error);
