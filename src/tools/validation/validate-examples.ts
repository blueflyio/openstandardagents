import { readFileSync } from 'node:fs';
import path, { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv, { type ErrorObject, type ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { globSync } from 'glob';
import * as yaml from 'yaml';
import { SchemaRepository } from '../../repositories/schema.repository.js';
import { ValidationService } from '../../services/validation.service.js';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = dirname(currentFilePath);
const projectRoot = resolve(currentDir, '../../..');
const exampleRoot = path.join(projectRoot, 'examples');
const skillSchemaPath = path.join(projectRoot, 'spec/v0.5/skill.schema.json');
const ignoredPathFragments = ['swarm-to-ossa'];
let skillValidator: ValidateFunction | null = null;

export function shouldIgnoreExamplePath(filePath: string): boolean {
  return ignoredPathFragments.some((fragment) => filePath.includes(fragment));
}

export function discoverExampleFiles(): string[] {
  return globSync('**/*.{ossa.yaml,ossa.yml}', {
    cwd: exampleRoot,
    nodir: true,
    absolute: true,
  })
    .filter((filePath) => !shouldIgnoreExamplePath(filePath))
    .sort((left, right) => left.localeCompare(right));
}

function getSkillValidator(): ValidateFunction {
  if (skillValidator) {
    return skillValidator;
  }

  const ajv = new Ajv({
    allErrors: true,
    strict: false,
    validateFormats: true,
  });
  addFormats(ajv);

  skillValidator = ajv.compile(
    JSON.parse(readFileSync(skillSchemaPath, 'utf8'))
  );
  return skillValidator;
}

function formatErrors(errors: ErrorObject[] | null | undefined): string[] {
  return (errors ?? []).map(
    (error) =>
      `${error.instancePath || '/'} ${error.message || 'Validation error'}`
  );
}

export async function validateManifest(
  manifest: unknown
): Promise<{ valid: boolean; messages: string[] }> {
  if (
    manifest &&
    typeof manifest === 'object' &&
    'kind' in manifest &&
    (manifest as { kind?: unknown }).kind === 'Skill'
  ) {
    const validator = getSkillValidator();
    const valid = validator(manifest);

    return {
      valid: Boolean(valid),
      messages: formatErrors(validator.errors),
    };
  }

  const validationService = new ValidationService(new SchemaRepository());
  const result = await validationService.validate(manifest);

  return {
    valid: result.valid,
    messages: formatErrors(result.errors),
  };
}

async function main(): Promise<void> {
  const exampleFiles = discoverExampleFiles();
  const failures: Array<{ file: string; messages: string[] }> = [];

  if (exampleFiles.length === 0) {
    console.error('No example manifests found under examples/.');
    process.exit(1);
  }

  for (const filePath of exampleFiles) {
    const relativePath = relative(projectRoot, filePath);

    try {
      const manifest = yaml.parse(readFileSync(filePath, 'utf8'));
      const result = await validateManifest(manifest);

      if (!result.valid) {
        failures.push({
          file: relativePath,
          messages: result.messages,
        });
      }
    } catch (error) {
      failures.push({
        file: relativePath,
        messages: [
          error instanceof Error ? error.message : 'Unknown validation failure',
        ],
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        checked: exampleFiles.length,
        ignored: ignoredPathFragments,
        invalid: failures.length,
      },
      null,
      2
    )
  );

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(`\n${failure.file}`);
      for (const message of failure.messages) {
        console.error(`  - ${message}`);
      }
    }
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(
      error instanceof Error ? error.message : 'Unknown validation failure'
    );
    process.exit(1);
  });
}
