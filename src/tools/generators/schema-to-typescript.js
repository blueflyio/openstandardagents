#!/usr/bin/env node
/**
 * Schema to TypeScript Types Generator
 *
 * Converts OSSA JSON Schema to TypeScript types with Zod schemas.
 * This is a DETERMINISTIC task - no LLM required.
 *
 * Usage: node schema-to-typescript.js <schema-path> <output-path> [--generator=zod]
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';

// Type mapping: JSON Schema -> TypeScript
const TYPE_MAP = {
  string: 'string',
  integer: 'number',
  number: 'number',
  boolean: 'boolean',
  array: 'unknown[]',
  object: 'Record<string, unknown>',
  null: 'null',
};

// Type mapping: JSON Schema -> Zod
const ZOD_TYPE_MAP = {
  string: 'z.string()',
  integer: 'z.number().int()',
  number: 'z.number()',
  boolean: 'z.boolean()',
  array: 'z.array(z.unknown())',
  object: 'z.record(z.unknown())',
  null: 'z.null()',
};

// Convert to PascalCase
function toPascalCase(str) {
  return str.replace(/(^|[-_])(\w)/g, (_, __, c) => c.toUpperCase());
}

// Generate TypeScript type from JSON Schema property
function generateTSType(prop, definitions) {
  if (!prop) return 'unknown';

  // Handle $ref
  if (prop.$ref) {
    const refName = prop.$ref.split('/').pop();
    return toPascalCase(refName);
  }

  // Handle anyOf/oneOf (Union types)
  if (prop.anyOf || prop.oneOf) {
    const types = (prop.anyOf || prop.oneOf).map(t => generateTSType(t, definitions));
    return types.join(' | ');
  }

  // Handle allOf (intersection)
  if (prop.allOf) {
    const types = prop.allOf.map(t => generateTSType(t, definitions));
    return types.join(' & ');
  }

  // Handle enum
  if (prop.enum) {
    return prop.enum.map(v => typeof v === 'string' ? `'${v}'` : v).join(' | ');
  }

  // Handle const
  if (prop.const !== undefined) {
    return typeof prop.const === 'string' ? `'${prop.const}'` : String(prop.const);
  }

  const baseType = TYPE_MAP[prop.type] || 'unknown';

  // Handle array with items
  if (prop.type === 'array' && prop.items) {
    const itemType = generateTSType(prop.items, definitions);
    return `${itemType}[]`;
  }

  // Handle object with additionalProperties
  if (prop.type === 'object' && prop.additionalProperties) {
    const valueType = generateTSType(prop.additionalProperties, definitions);
    return `Record<string, ${valueType}>`;
  }

  return baseType;
}

// Generate Zod schema from JSON Schema property
function generateZodType(prop, definitions, indent = '  ') {
  if (!prop) return 'z.unknown()';

  // Handle $ref
  if (prop.$ref) {
    const refName = prop.$ref.split('/').pop();
    return `${toPascalCase(refName)}Schema`;
  }

  // Handle anyOf/oneOf
  if (prop.anyOf || prop.oneOf) {
    const types = (prop.anyOf || prop.oneOf).map(t => generateZodType(t, definitions, indent));
    return `z.union([${types.join(', ')}])`;
  }

  // Handle allOf
  if (prop.allOf) {
    const types = prop.allOf.map(t => generateZodType(t, definitions, indent));
    return types.reduce((acc, t) => `${acc}.and(${t})`);
  }

  // Handle enum
  if (prop.enum) {
    const values = prop.enum.map(v => typeof v === 'string' ? `'${v}'` : v);
    return `z.enum([${values.join(', ')}])`;
  }

  // Handle const
  if (prop.const !== undefined) {
    const value = typeof prop.const === 'string' ? `'${prop.const}'` : prop.const;
    return `z.literal(${value})`;
  }

  let zodType = ZOD_TYPE_MAP[prop.type] || 'z.unknown()';

  // Handle array with items
  if (prop.type === 'array' && prop.items) {
    const itemType = generateZodType(prop.items, definitions, indent);
    zodType = `z.array(${itemType})`;
  }

  // Handle object with properties
  if (prop.type === 'object' && prop.properties) {
    const required = new Set(prop.required || []);
    const propLines = [];

    for (const [name, propDef] of Object.entries(prop.properties)) {
      let propZod = generateZodType(propDef, definitions, indent + '  ');
      if (!required.has(name)) {
        propZod = `${propZod}.optional()`;
      }
      if (propDef.description) {
        propZod = `${propZod}.describe('${propDef.description.replace(/'/g, "\\'")}')`;
      }
      propLines.push(`${indent}  ${name}: ${propZod},`);
    }

    zodType = `z.object({\n${propLines.join('\n')}\n${indent}})`;
  }

  // Handle object with additionalProperties
  if (prop.type === 'object' && prop.additionalProperties && !prop.properties) {
    const valueType = generateZodType(prop.additionalProperties, definitions, indent);
    zodType = `z.record(${valueType})`;
  }

  // Add constraints
  if (prop.minLength !== undefined) zodType = `${zodType}.min(${prop.minLength})`;
  if (prop.maxLength !== undefined) zodType = `${zodType}.max(${prop.maxLength})`;
  if (prop.minimum !== undefined) zodType = `${zodType}.min(${prop.minimum})`;
  if (prop.maximum !== undefined) zodType = `${zodType}.max(${prop.maximum})`;
  if (prop.pattern) zodType = `${zodType}.regex(/${prop.pattern}/)`;

  return zodType;
}

// Generate TypeScript interface from JSON Schema definition
function generateInterface(name, schema, definitions) {
  const interfaceName = toPascalCase(name);
  const lines = [];

  // JSDoc comment
  if (schema.description) {
    lines.push('/**');
    lines.push(` * ${schema.description}`);
    lines.push(' */');
  }

  lines.push(`export interface ${interfaceName} {`);

  const required = new Set(schema.required || []);
  const properties = schema.properties || {};

  for (const [propName, prop] of Object.entries(properties)) {
    const tsType = generateTSType(prop, definitions);
    const isRequired = required.has(propName);
    const optional = isRequired ? '' : '?';

    if (prop.description) {
      lines.push(`  /** ${prop.description} */`);
    }
    lines.push(`  ${propName}${optional}: ${tsType};`);
  }

  lines.push('}');
  return lines.join('\n');
}

// Generate Zod schema from JSON Schema definition
function generateZodSchema(name, schema, definitions) {
  const schemaName = `${toPascalCase(name)}Schema`;
  const lines = [];

  if (schema.description) {
    lines.push(`/** ${schema.description} */`);
  }

  const required = new Set(schema.required || []);
  const properties = schema.properties || {};
  const propLines = [];

  for (const [propName, prop] of Object.entries(properties)) {
    let zodType = generateZodType(prop, definitions);
    if (!required.has(propName)) {
      zodType = `${zodType}.optional()`;
    }
    propLines.push(`  ${propName}: ${zodType},`);
  }

  lines.push(`export const ${schemaName} = z.object({`);
  lines.push(propLines.join('\n'));
  lines.push('});');
  lines.push('');
  lines.push(`export type ${toPascalCase(name)} = z.infer<typeof ${schemaName}>;`);

  return lines.join('\n');
}

// Main generator function
function generateTypeScriptFromSchema(schemaPath, outputPath, generator = 'zod') {
  const schemaContent = readFileSync(schemaPath, 'utf-8');
  const schema = JSON.parse(schemaContent);

  const definitions = schema.$defs || schema.definitions || {};
  const outputs = [];
  const generatedNames = [];

  // Header
  const header = `/* Auto-generated from OSSA JSON Schema - DO NOT EDIT */
/* Generated by: src/tools/generators/schema-to-typescript.js */
/* Schema: ${basename(schemaPath)} */
/* Generator: ${generator} */

${generator === 'zod' ? "import { z } from 'zod';\n" : ''}
`;

  // Generate types for each definition
  for (const [name, def] of Object.entries(definitions)) {
    if (def.type === 'object' || def.properties) {
      if (generator === 'zod') {
        outputs.push(generateZodSchema(name, def, definitions));
      } else {
        outputs.push(generateInterface(name, def, definitions));
      }
      generatedNames.push(toPascalCase(name));
    }
  }

  // Generate root type if schema has properties
  if (schema.properties) {
    if (generator === 'zod') {
      outputs.push(generateZodSchema('OSSAManifest', schema, definitions));
    } else {
      outputs.push(generateInterface('OSSAManifest', schema, definitions));
    }
    generatedNames.push('OSSAManifest');
  }

  // Write output
  const output = header + outputs.join('\n\n') + '\n';
  writeFileSync(outputPath, output);

  return {
    generated_file: outputPath,
    types_count: generatedNames.length,
    definitions: generatedNames,
  };
}

// CLI execution
if (process.argv[1].endsWith('schema-to-typescript.js')) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: schema-to-typescript.js <schema-path> <output-path> [--generator=zod|type-only]');
    process.exit(1);
  }

  const schemaPath = args[0];
  const outputPath = args[1];
  const generator = args.find(a => a.startsWith('--generator='))?.split('=')[1] || 'zod';

  try {
    const result = generateTypeScriptFromSchema(schemaPath, outputPath, generator);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

export { generateTypeScriptFromSchema };
