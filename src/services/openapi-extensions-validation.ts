import Ajv, { type ErrorObject, type ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface OpenApiExtensionsValidationWarning {
  path: string;
  message: string;
}

export interface OpenApiExtensionsSummary {
  hasMetadata: boolean;
  hasOssa: boolean;
  hasAgent: boolean;
  operationExtensions: number;
  capabilitySchemaExtensions: number;
}

export interface OpenApiExtensionsValidationDetails {
  valid: boolean;
  errors: ErrorObject[];
  warnings: OpenApiExtensionsValidationWarning[];
  ossaExtensions: OpenApiExtensionsSummary;
}

const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = dirname(currentFilePath);

const SCHEMA_PATHS = [
  resolve(
    currentDir,
    '../../spec/extensions/openapi/ossa-openapi-extensions.schema.json'
  ),
  resolve(
    currentDir,
    '../spec/extensions/openapi/ossa-openapi-extensions.schema.json'
  ),
];

let cachedValidator: ValidateFunction<Record<string, unknown>> | undefined;

function getSchemaPath(): string {
  const schemaPath = SCHEMA_PATHS.find((candidate) => existsSync(candidate));
  if (!schemaPath) {
    throw new Error(
      `OSSA OpenAPI extensions schema not found. Checked: ${SCHEMA_PATHS.join(', ')}`
    );
  }

  return schemaPath;
}

function getValidator(): ValidateFunction<Record<string, unknown>> {
  if (cachedValidator) {
    return cachedValidator;
  }

  const schema = JSON.parse(
    readFileSync(getSchemaPath(), 'utf-8')
  ) as Record<string, unknown>;

  const ajv = new Ajv({
    allErrors: true,
    strict: false,
    validateFormats: true,
    verbose: true,
  });

  addFormats(ajv);

  cachedValidator = ajv.compile<Record<string, unknown>>(schema);
  return cachedValidator;
}

function countOperationExtensions(doc: Record<string, unknown>): number {
  let count = 0;
  const paths = doc.paths as
    | Record<string, Record<string, unknown>>
    | undefined;

  if (!paths) {
    return count;
  }

  const methods = [
    'get',
    'put',
    'post',
    'delete',
    'options',
    'head',
    'patch',
    'trace',
  ];

  for (const pathItem of Object.values(paths)) {
    for (const method of methods) {
      const operation = pathItem[method] as Record<string, unknown> | undefined;
      if (!operation) {
        continue;
      }

      if (operation['x-ossa-capability']) count++;
      if (operation['x-ossa-autonomy']) count++;
      if (operation['x-ossa-constraints']) count++;
      if (operation['x-ossa-tools']) count++;
      if (operation['x-ossa-llm']) count++;
    }
  }

  return count;
}

function countCapabilitySchemaExtensions(doc: Record<string, unknown>): number {
  const components = doc.components as
    | { schemas?: Record<string, Record<string, unknown>> }
    | undefined;

  if (!components?.schemas) {
    return 0;
  }

  return Object.values(components.schemas).filter(
    (schema) =>
      schema &&
      typeof schema === 'object' &&
      'x-ossa-capability-schema' in schema
  ).length;
}

function generateWarnings(
  doc: Record<string, unknown>
): OpenApiExtensionsValidationWarning[] {
  const warnings: OpenApiExtensionsValidationWarning[] = [];

  if (!doc['x-ossa-metadata']) {
    warnings.push({
      path: '/',
      message:
        'Missing x-ossa-metadata extension. Consider adding OSSA metadata for compliance tracking.',
    });
  } else {
    const metadata = doc['x-ossa-metadata'] as Record<string, unknown>;

    if (!metadata.compliance) {
      warnings.push({
        path: '/x-ossa-metadata',
        message:
          'Missing compliance configuration. Consider adding compliance level and frameworks.',
      });
    }

    if (!metadata.observability) {
      warnings.push({
        path: '/x-ossa-metadata',
        message:
          'Missing observability configuration. Consider enabling tracing, metrics, and logging.',
      });
    }
  }

  if (!doc['x-ossa']) {
    warnings.push({
      path: '/',
      message:
        'Missing x-ossa extension. Agent identification is recommended for OSSA compliance.',
    });
  }

  const paths = doc.paths as
    | Record<string, Record<string, unknown>>
    | undefined;
  if (!paths) {
    return warnings;
  }

  const methods = [
    'get',
    'put',
    'post',
    'delete',
    'options',
    'head',
    'patch',
    'trace',
  ];

  for (const [pathKey, pathItem] of Object.entries(paths)) {
    for (const method of methods) {
      const operation = pathItem[method] as Record<string, unknown> | undefined;
      if (!operation || !operation.operationId) {
        continue;
      }

      if (!operation['x-ossa-capability']) {
        warnings.push({
          path: `/paths${pathKey}/${method}`,
          message: `Operation ${operation.operationId} missing x-ossa-capability. Consider linking to an agent capability.`,
        });
      }

      if (
        ['post', 'put', 'patch', 'delete'].includes(method) &&
        !operation['x-ossa-autonomy']
      ) {
        warnings.push({
          path: `/paths${pathKey}/${method}`,
          message: `Write operation ${operation.operationId} missing x-ossa-autonomy. Consider defining autonomy level.`,
        });
      }
    }
  }

  return warnings;
}

export function validateOpenApiExtensionsDocument(
  openapiSpec: unknown
): OpenApiExtensionsValidationDetails {
  if (!openapiSpec || typeof openapiSpec !== 'object') {
    return {
      valid: false,
      errors: [
        {
          instancePath: '',
          schemaPath: '',
          keyword: 'type',
          params: { type: 'object' },
          message: 'OpenAPI spec must be an object',
        },
      ],
      warnings: [],
      ossaExtensions: {
        hasMetadata: false,
        hasOssa: false,
        hasAgent: false,
        operationExtensions: 0,
        capabilitySchemaExtensions: 0,
      },
    };
  }

  const doc = openapiSpec as Record<string, unknown>;
  const validate = getValidator();
  const valid = validate(doc);

  return {
    valid,
    errors: valid
      ? []
      : (validate.errors || []).map((error) => ({
          instancePath: error.instancePath || '',
          schemaPath: error.schemaPath || '',
          keyword: error.keyword || 'validation',
          params: error.params || {},
          message: error.message || 'Validation error',
        })),
    warnings: generateWarnings(doc),
    ossaExtensions: {
      hasMetadata: !!doc['x-ossa-metadata'],
      hasOssa: !!doc['x-ossa'],
      hasAgent: !!doc['x-agent'],
      operationExtensions: countOperationExtensions(doc),
      capabilitySchemaExtensions: countCapabilitySchemaExtensions(doc),
    },
  };
}
