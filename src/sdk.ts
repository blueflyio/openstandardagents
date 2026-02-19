/**
 * OSSA SDK - Single entry for programmatic use in other projects.
 *
 * Exposes agent card generation, lightweight validation, and types.
 * For full ValidationService (schema repo, DI) use @bluefly/openstandardagents/validation.
 * For mesh use @bluefly/openstandardagents/mesh.
 *
 * @example
 * ```ts
 * import {
 *   AgentCardGenerator,
 *   validateManifest,
 *   loadManifestFromFile,
 *   loadManifestFromString,
 *   OSSAValidator,
 * } from '@bluefly/openstandardagents/sdk';
 * import type { AgentCard, OssaAgent, ValidationResult } from '@bluefly/openstandardagents/sdk';
 *
 * const manifest = loadManifestFromFile('agent.ossa.yaml');
 * const result = validateManifest(manifest);
 * if (result.valid) {
 *   const gen = new AgentCardGenerator();
 *   const cardResult = gen.generate(manifest, { namespace: 'myteam' });
 *   if (cardResult.success && cardResult.card) console.log(cardResult.card.uri);
 * }
 * ```
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { OSSAValidator as ValidatorClass } from './validation/validator.js';
import { safeParseYAML } from './utils/yaml-parser.js';

export { AgentCardGenerator } from './services/agent-card-generator.js';
export type {
  AgentCardGeneratorOptions,
  AgentCardResult,
} from './services/agent-card-generator.js';

export { OSSAValidator } from './validation/validator.js';
export type { ValidationResult } from './validation/validator.js';

const _distDir = dirname(fileURLToPath(import.meta.url));
const _defaultSchemaPath = join(_distDir, 'spec', 'v0.4', 'agent.schema.json');
let _validator: ValidatorClass | null = null;

/**
 * Load manifest from file path (YAML or JSON). Does not validate; call validateManifest after if needed.
 */
export function loadManifestFromFile(filePath: string): Record<string, unknown> {
  const content = readFileSync(filePath, 'utf-8');
  const isYaml = filePath.endsWith('.yaml') || filePath.endsWith('.yml');
  return (isYaml ? safeParseYAML<Record<string, unknown>>(content) : JSON.parse(content)) as Record<string, unknown>;
}

/**
 * Load manifest from string (YAML or JSON). Does not validate; call validateManifest after if needed.
 */
export function loadManifestFromString(
  content: string,
  format: 'yaml' | 'json' = 'yaml'
): Record<string, unknown> {
  return (format === 'yaml'
    ? safeParseYAML<Record<string, unknown>>(content)
    : JSON.parse(content)) as Record<string, unknown>;
}

/**
 * Validate an OSSA manifest (sync, schema + separation-of-duties).
 * Uses default v0.4 schema from package dist. For custom schema use OSSAValidator directly.
 */
export function validateManifest(manifest: Record<string, unknown>): import('./validation/validator.js').ValidationResult {
  if (!_validator) _validator = new ValidatorClass(_defaultSchemaPath);
  return _validator.validate(manifest);
}

export type { OssaAgent, SchemaVersion } from './types/index.js';

export type {
  AgentCard,
  AgentCardState,
  TokenEfficiencySummary,
  AgentCardSeparation,
} from './mesh/types.js';
