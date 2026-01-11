/**
 * OpenAPI → Zod Generator
 * 
 * DRY, SOLID, ZOD, OPENAPI-FIRST
 * 
 * Generates Zod schemas from OpenAPI 3.1 specs in openapi/ directory.
 * This is the SINGLE SOURCE OF TRUTH - OpenAPI specs drive everything.
 */

import { injectable } from 'inversify';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import type { Generator, GenerateResult, DriftReport } from '../codegen.service.js';
import { getVersion, getApiVersion } from '../../../utils/version.js';
import { safeParseYAML } from '../../../utils/yaml-parser.js';

interface OpenAPISchema {
  type?: string;
  format?: string;
  items?: OpenAPISchema;
  properties?: Record<string, OpenAPISchema>;
  required?: string[];
  enum?: (string | number)[];
  nullable?: boolean;
  description?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  $ref?: string;
  allOf?: OpenAPISchema[];
  oneOf?: OpenAPISchema[];
  anyOf?: OpenAPISchema[];
  additionalProperties?: boolean | OpenAPISchema;
  default?: unknown;
  const?: unknown;
}

interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
  };
  components?: {
    schemas?: Record<string, OpenAPISchema>;
    parameters?: Record<string, unknown>;
    securitySchemes?: Record<string, unknown>;
  };
  paths?: Record<string, unknown>;
}

@injectable()
export class OpenAPIZodGenerator implements Generator {
  name = 'openapi-zod';

  private readonly openapiDir = path.join(process.cwd(), 'openapi');
  private readonly outputDir = path.join(process.cwd(), 'src/types/generated/openapi');

  /**
   * Generate Zod schemas from all OpenAPI specs
   */
  async generate(dryRun: boolean): Promise<GenerateResult> {
    const result: GenerateResult = {
      generator: this.name,
      filesUpdated: 0,
      filesCreated: 0,
      errors: [],
    };

    const version = getVersion();
    const apiVersion = getApiVersion();

    // Find all OpenAPI YAML files
    const openapiFiles = await this.findOpenAPIFiles();

    if (openapiFiles.length === 0) {
      result.errors.push('No OpenAPI files found in openapi/ directory');
      return result;
    }

    // Ensure output directory exists
    if (!dryRun && !fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // Generate Zod from shared schemas first (must be done before individual files)
    const sharedSchemasPath = path.join(this.openapiDir, 'schemas/common');
    if (fs.existsSync(sharedSchemasPath)) {
      const sharedResult = await this.generateFromSharedSchemas(sharedSchemasPath, version, apiVersion, dryRun);
      result.filesCreated += sharedResult.filesCreated;
      result.filesUpdated += sharedResult.filesUpdated;
      result.errors.push(...sharedResult.errors);
    }


    // Generate Zod from each OpenAPI spec
    for (const file of openapiFiles) {
      try {
        const fileResult = await this.generateFromFile(file, version, apiVersion, dryRun);
        result.filesCreated += fileResult.filesCreated;
        result.filesUpdated += fileResult.filesUpdated;
        if (fileResult.errors.length > 0) {
          result.errors.push(`${file}: ${fileResult.errors.join(', ')}`);
        }
      } catch (error) {
        result.errors.push(`${file}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return result;
  }

  /**
   * Find all OpenAPI YAML files
   */
  private async findOpenAPIFiles(): Promise<string[]> {
    const patterns = [
      'openapi/**/*.openapi.yaml',
      'openapi/**/*.openapi.yml',
      'openapi/**/*.yaml',
      'openapi/**/*.yml',
    ];

    const excludePatterns = [
      '**/schemas/**',
      '**/node_modules/**',
      '**/dist/**',
    ];

    const allFiles: string[] = [];

    for (const pattern of patterns) {
      const files = await glob(pattern, {
        ignore: excludePatterns,
        cwd: process.cwd(),
        absolute: true,
      });
      allFiles.push(...files);
    }

    return [...new Set(allFiles)].sort();
  }

  /**
   * Generate Zod from shared schema files
   */
  private async generateFromSharedSchemas(
    schemasDir: string,
    version: string,
    apiVersion: string,
    dryRun: boolean
  ): Promise<GenerateResult> {
    const result: GenerateResult = {
      generator: this.name,
      filesUpdated: 0,
      filesCreated: 0,
      errors: [],
    };

    const schemaFiles = await glob('*.yaml', {
      cwd: schemasDir,
      absolute: true,
    });

    const allSchemas: Record<string, OpenAPISchema> = {};

    for (const file of schemaFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const spec = safeParseYAML<OpenAPISpec>(content);

        if (spec.components?.schemas) {
          Object.assign(allSchemas, spec.components.schemas);
        }
      } catch (error) {
        result.errors.push(`${file}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (Object.keys(allSchemas).length > 0) {
      const outputPath = path.join(this.outputDir, 'common-schemas.zod.ts');
      const content = this.generateZodFile(allSchemas, 'Common Shared Schemas', version, apiVersion, undefined, dryRun);

      if (!dryRun) {
        fs.writeFileSync(outputPath, content, 'utf8');
        result.filesCreated = 1;
      } else {
        result.filesCreated = 1;
      }
    }

    return result;
  }

  /**
   * Generate Zod from a single OpenAPI file
   */
  private async generateFromFile(
    filePath: string,
    version: string,
    apiVersion: string,
    dryRun: boolean
  ): Promise<GenerateResult> {
    const result: GenerateResult = {
      generator: this.name,
      filesUpdated: 0,
      filesCreated: 0,
      errors: [],
    };

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const spec = safeParseYAML<OpenAPISpec>(content);

      if (!spec.components?.schemas || Object.keys(spec.components.schemas).length === 0) {
        return result;
      }

      const fileName = path.basename(filePath, path.extname(filePath));
      const outputPath = path.join(this.outputDir, `${fileName}.zod.ts`);
      const zodContent = this.generateZodFile(
        spec.components.schemas,
        spec.info?.title || fileName,
        version,
        apiVersion,
        filePath,
        dryRun
      );

      if (!dryRun) {
        const exists = fs.existsSync(outputPath);
        fs.writeFileSync(outputPath, zodContent, 'utf8');
        if (exists) {
          result.filesUpdated = 1;
        } else {
          result.filesCreated = 1;
        }
      } else {
        result.filesCreated = 1;
      }
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error));
    }

    return result;
  }

  /**
   * Generate Zod file content from schemas
   */
  private generateZodFile(
    schemas: Record<string, OpenAPISchema>,
    title: string,
    version: string,
    apiVersion: string,
    sourceFile?: string,
    dryRun = false
  ): string {
    const lines: string[] = [];
    const refs = new Map<string, string>();

    // Header
    lines.push('/**');
    lines.push(` * ${title} - Zod Schemas`);
    lines.push(' *');
    lines.push(' * AUTO-GENERATED - DO NOT EDIT');
    lines.push(` * Generated from: ${sourceFile || 'shared schemas'}`);
    lines.push(` * OSSA Version: ${version}`);
    lines.push(` * API Version: ${apiVersion}`);
    lines.push(` * Generated on: ${new Date().toISOString()}`);
    lines.push(' *');
    lines.push(' * Regenerate with: ossa generate zod');
    lines.push(' */');
    lines.push('');
    lines.push("import { z } from 'zod';");
    
    // Import common schemas if this is not the common schemas file itself
    if (sourceFile && !sourceFile.includes('schemas/common')) {
      const commonSchemasPath = path.join(this.outputDir, 'common-schemas.zod.ts');
      // Always import in generated files (common schemas generated first)
      lines.push("import * as CommonSchemas from './common-schemas.zod';");
    }
    
    lines.push('');

    // First pass: collect schema names
    for (const name of Object.keys(schemas)) {
      refs.set(name, this.toSchemaName(name));
    }

    // Second pass: generate schemas
    lines.push('// ============================================================================');
    lines.push('// Component Schemas');
    lines.push('// ============================================================================');
    lines.push('');

    for (const [name, schema] of Object.entries(schemas)) {
      const schemaName = this.toSchemaName(name);
      const typeName = this.toTypeName(name);

      if (schema.description) {
        lines.push('/**');
        lines.push(` * ${schema.description.split('\n').join('\n * ')}`);
        lines.push(' */');
      }

      const zodSchema = this.toZodSchema(schema, name, refs, new Set());
      lines.push(`export const ${schemaName} = ${zodSchema};`);
      lines.push('');
      lines.push(`export type ${typeName} = z.infer<typeof ${schemaName}>;`);
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Convert OpenAPI schema to Zod schema
   */
  private toZodSchema(
    schema: OpenAPISchema,
    schemaName: string,
    refs: Map<string, string>,
    visited: Set<string>
  ): string {
    // Handle $ref
    if (schema.$ref) {
      const refName = this.resolveRef(schema.$ref);
      if (refs.has(refName)) {
        return refs.get(refName)!;
      }
      // External ref to shared schemas
      if (schema.$ref.includes('../schemas/common/') || schema.$ref.includes('schemas/common/')) {
        const parts = schema.$ref.split('#/components/schemas/');
        if (parts.length > 1) {
          const refSchema = parts[1];
          return `CommonSchemas.${this.toSchemaName(refSchema)}`;
        }
      }
      // Local ref within same file
      if (schema.$ref.startsWith('#/components/schemas/')) {
        const localRef = schema.$ref.replace('#/components/schemas/', '');
        if (refs.has(localRef)) {
          return refs.get(localRef)!;
        }
      }
      return 'z.unknown()';
    }

    // Prevent circular references
    if (visited.has(schemaName)) {
      return 'z.unknown()';
    }
    visited.add(schemaName);

    // Handle allOf
    if (schema.allOf && schema.allOf.length > 0) {
      const schemas = schema.allOf.map((s, i) =>
        this.toZodSchema(s, `${schemaName}AllOf${i}`, refs, new Set(visited))
      );
      if (schemas.length === 2) {
        return `z.intersection(${schemas[0]}, ${schemas[1]})`;
      }
      return schemas.reduce((acc, s) => `z.intersection(${acc}, ${s})`);
    }

    // Handle oneOf/anyOf
    if (schema.oneOf || schema.anyOf) {
      const unionSchemas = (schema.oneOf || schema.anyOf || []).map((s, i) =>
        this.toZodSchema(s, `${schemaName}Union${i}`, refs, new Set(visited))
      );
      return `z.union([${unionSchemas.join(', ')}])`;
    }

    let zodSchema = '';

    // Handle const
    if (schema.const !== undefined) {
      return `z.literal(${JSON.stringify(schema.const)})`;
    }

    // Handle enum
    if (schema.enum && schema.enum.length > 0) {
      const enumValues = schema.enum.map((v) => JSON.stringify(v)).join(', ');
      zodSchema = `z.enum([${enumValues}])`;
    } else {
      // Map OpenAPI types to Zod
      switch (schema.type) {
        case 'string':
          zodSchema = this.generateStringSchema(schema);
          break;
        case 'number':
        case 'integer':
          zodSchema = this.generateNumberSchema(schema);
          break;
        case 'boolean':
          zodSchema = 'z.boolean()';
          break;
        case 'array':
          zodSchema = this.generateArraySchema(schema, schemaName, refs, visited);
          break;
        case 'object':
          zodSchema = this.generateObjectSchema(schema, schemaName, refs, visited);
          break;
        default:
          // Implicit object from properties
          if (schema.properties) {
            zodSchema = this.generateObjectSchema(schema, schemaName, refs, visited);
          } else {
            zodSchema = 'z.unknown()';
          }
      }
    }

    // Apply nullable
    if (schema.nullable) {
      zodSchema = `${zodSchema}.nullable()`;
    }

    visited.delete(schemaName);
    return zodSchema;
  }

  /**
   * Generate string schema
   */
  private generateStringSchema(schema: OpenAPISchema): string {
    let zodSchema = 'z.string()';

    // Format validators
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
      case 'date':
        zodSchema = 'z.string().date()';
        break;
      case 'uri':
        zodSchema = 'z.string().url()';
        break;
      case 'ipv4':
      case 'ipv6':
        zodSchema = 'z.string().ip()';
        break;
    }

    // Constraints
    if (schema.minLength !== undefined) {
      zodSchema += `.min(${schema.minLength})`;
    }
    if (schema.maxLength !== undefined) {
      zodSchema += `.max(${schema.maxLength})`;
    }
    if (schema.pattern) {
      const escapedPattern = schema.pattern.replace(/\//g, '\\/');
      zodSchema += `.regex(/${escapedPattern}/)`;
    }

    return zodSchema;
  }

  /**
   * Generate number schema
   */
  private generateNumberSchema(schema: OpenAPISchema): string {
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

  /**
   * Generate array schema
   */
  private generateArraySchema(
    schema: OpenAPISchema,
    schemaName: string,
    refs: Map<string, string>,
    visited: Set<string>
  ): string {
    if (schema.items) {
      const itemSchema = this.toZodSchema(schema.items, `${schemaName}Item`, refs, new Set(visited));
      return `z.array(${itemSchema})`;
    }
    return 'z.array(z.unknown())';
  }

  /**
   * Generate object schema
   */
  private generateObjectSchema(
    schema: OpenAPISchema,
    schemaName: string,
    refs: Map<string, string>,
    visited: Set<string>
  ): string {
    if (!schema.properties) {
      if (schema.additionalProperties === false) {
        return 'z.object({}).strict()';
      }
      if (schema.additionalProperties === true) {
        return 'z.record(z.string(), z.unknown())';
      }
      if (typeof schema.additionalProperties === 'object') {
        const valueSchema = this.toZodSchema(schema.additionalProperties, `${schemaName}Value`, refs, new Set(visited));
        return `z.record(z.string(), ${valueSchema})`;
      }
      return 'z.record(z.string(), z.unknown())';
    }

    const props: string[] = [];
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      const isRequired = schema.required?.includes(key) ?? false;
      const propZod = this.toZodSchema(propSchema, `${schemaName}${this.capitalize(key)}`, refs, new Set(visited));
      if (isRequired) {
        props.push(`  ${key}: ${propZod}`);
      } else {
        props.push(`  ${key}: ${propZod}.optional()`);
      }
    }

    let objectSchema = `z.object({\n${props.join(',\n')}\n})`;

    // Handle additionalProperties
    if (schema.additionalProperties === false) {
      objectSchema += '.strict()';
    } else if (typeof schema.additionalProperties === 'object') {
      const valueSchema = this.toZodSchema(schema.additionalProperties, `${schemaName}Additional`, refs, new Set(visited));
      objectSchema += `.passthrough().catchall(${valueSchema})`;
    }

    return objectSchema;
  }

  /**
   * Resolve $ref to schema name
   */
  private resolveRef(ref: string): string {
    if (ref.startsWith('#/components/schemas/')) {
      return ref.replace('#/components/schemas/', '');
    }
    if (ref.includes('#/components/schemas/')) {
      return ref.split('#/components/schemas/')[1];
    }
    return ref;
  }

  /**
   * Convert schema name to Zod schema variable name
   */
  private toSchemaName(name: string): string {
    return `${name.charAt(0).toLowerCase() + name.slice(1)}Schema`;
  }

  /**
   * Convert schema name to TypeScript type name
   */
  private toTypeName(name: string): string {
    return name;
  }

  /**
   * Capitalize first letter
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * List target files
   */
  async listTargetFiles(): Promise<string[]> {
    const files = await this.findOpenAPIFiles();
    const outputFiles: string[] = [];

    for (const file of files) {
      const fileName = path.basename(file, path.extname(file));
      outputFiles.push(path.join(this.outputDir, `${fileName}.zod.ts`));
    }

    // Add common schemas
    outputFiles.push(path.join(this.outputDir, 'common-schemas.zod.ts'));

    return outputFiles;
  }

  /**
   * Check for drift
   */
  async checkDrift(): Promise<DriftReport['filesWithOldVersion']> {
    return [];
  }
}
