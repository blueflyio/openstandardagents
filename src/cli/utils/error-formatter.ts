/**
 * Error Formatter for OSSA CLI
 * Transforms AJV validation errors into helpful, actionable error messages
 * Inspired by professional tools like npm, cargo, rustc
 */

import chalk from 'chalk';
import type { ErrorObject } from 'ajv';

/**
 * Common typos and their corrections
 */
const COMMON_TYPOS: Record<string, string[]> = {
  apiVersion: ['apiversion', 'api_version', 'api-version', 'version'],
  provider: ['providers', 'Provider', 'llm_provider'],
  model: ['models', 'Model', 'llm_model'],
  role: ['roles', 'Role', 'type'],
  metadata: ['meta', 'Metadata', 'metaData'],
  name: ['Name', 'agent_name', 'agentName'],
  description: ['desc', 'Description', 'summary'],
  tools: ['tool', 'Tools', 'capabilities'],
  capabilities: ['capability', 'Capabilities', 'tools'],
  temperature: ['temp', 'Temperature'],
  maxTokens: ['max_tokens', 'MaxTokens', 'maxtokens'],
  observability: ['monitoring', 'telemetry', 'observ'],
  messaging: ['messages', 'message', 'pubsub'],
  publishes: ['publish', 'publishers', 'publishing'],
  subscribes: ['subscribe', 'subscribers', 'subscriptions'],
  commands: ['command', 'cmds', 'cmd'],
};

/**
 * Known enum values for validation
 */
const KNOWN_ENUMS: Record<string, string[]> = {
  provider: ['anthropic', 'openai', 'google', 'cohere', 'mistral', 'meta', 'local'],
  role: ['chat', 'worker', 'workflow', 'compliance', 'orchestrator', 'specialist'],
  kind: ['Agent', 'Task', 'Workflow', 'Policy'],
  deliveryGuarantee: ['at-least-once', 'at-most-once', 'exactly-once'],
  priority: ['low', 'normal', 'high', 'critical'],
  level: ['supervised', 'semi-autonomous', 'autonomous', 'fully-autonomous'],
};

/**
 * Provider-specific model mappings (for helpful suggestions)
 */
const PROVIDER_MODELS: Record<string, string[]> = {
  anthropic: [
    'claude-opus-4-5-20251101',
    'claude-sonnet-4-5-20250929',
    'claude-3-5-sonnet-20241022',
  ],
  openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  google: ['gemini-pro', 'gemini-ultra'],
};

/**
 * Documentation links for different error types
 */
const DOCS_LINKS: Record<string, string> = {
  apiVersion: 'https://openstandardagents.org/docs/manifest#apiversion',
  provider: 'https://openstandardagents.org/docs/llm-config#providers',
  model: 'https://openstandardagents.org/docs/llm-config#models',
  role: 'https://openstandardagents.org/docs/agent-roles',
  tools: 'https://openstandardagents.org/docs/tools',
  messaging: 'https://openstandardagents.org/docs/messaging',
  observability: 'https://openstandardagents.org/docs/observability',
  autonomy: 'https://openstandardagents.org/docs/autonomy',
  constraints: 'https://openstandardagents.org/docs/constraints',
};

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Find the closest match from a list of valid values
 */
function findClosestMatch(invalid: string, validValues: string[]): string | null {
  let minDistance = Infinity;
  let closest: string | null = null;

  for (const valid of validValues) {
    const distance = levenshteinDistance(invalid.toLowerCase(), valid.toLowerCase());
    // Only suggest if distance is reasonable (less than 40% of the word length)
    if (distance < minDistance && distance <= Math.max(3, valid.length * 0.4)) {
      minDistance = distance;
      closest = valid;
    }
  }

  return closest;
}

/**
 * Extract field name from JSON path
 */
function extractFieldName(path: string): string {
  const parts = path.split('/').filter(Boolean);
  return parts[parts.length - 1] || 'root';
}

/**
 * Get value from manifest at path
 */
function getValueAtPath(manifest: unknown, path: string): unknown {
  if (!manifest || typeof manifest !== 'object') {
    return undefined;
  }

  const parts = path.split('/').filter(Boolean);
  let current: any = manifest;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Format a single validation error with helpful context
 */
function formatError(error: ErrorObject, index: number, manifest?: unknown): string {
  const path = error.instancePath || '/';
  const fieldName = extractFieldName(path);
  const lines: string[] = [];

  // Try to get the actual value from the manifest if error.data is undefined
  let actualValue = error.data;
  if (actualValue === undefined && manifest) {
    actualValue = getValueAtPath(manifest, path);
  }

  // Error header with number
  lines.push(chalk.red(`\n${index + 1}. Validation Error at ${chalk.bold(path)}`));
  lines.push('');

  // Handle different error types
  switch (error.keyword) {
    case 'required': {
      const missingProp = error.params?.missingProperty as string;
      lines.push(chalk.red(`   Missing required field: ${chalk.bold(missingProp)}`));
      lines.push('');

      // Check for common typos
      if (COMMON_TYPOS[missingProp]) {
        const typos = COMMON_TYPOS[missingProp];
        lines.push(chalk.yellow(`   [TIP] Did you mean one of these?`));
        typos.forEach((typo) => {
          lines.push(chalk.yellow(`      • ${typo}`));
        });
        lines.push('');
      }

      {
        // Add example
        lines.push(chalk.gray('   Example:'));
        lines.push(chalk.gray(`      ${missingProp}: <value>`));
      }
      break;
    }

    case 'type': {
      const expectedType = error.params?.type as string;
      const actualType = Array.isArray(actualValue) ? 'array' : typeof actualValue;

      lines.push(chalk.red(`   Type mismatch:`));
      lines.push(chalk.red(`      Expected: ${chalk.bold(expectedType)}`));
      lines.push(chalk.red(`      Received: ${chalk.bold(actualType)}`));
      lines.push('');

      // Helpful suggestion
      if (expectedType === 'array' && actualType === 'string') {
        lines.push(chalk.yellow(`   [TIP] This field expects an array. Try:`));
        lines.push(chalk.yellow(`      ${fieldName}: [${JSON.stringify(actualValue)}]`));
        lines.push('');
      } else if (expectedType === 'string' && actualType === 'array') {
        lines.push(chalk.yellow(`   [TIP] This field expects a single value, not an array`));
        lines.push('');
      }
      break;
    }

    case 'pattern': {
      const pattern = error.params?.pattern as string;
      lines.push(chalk.red(`   Value doesn't match required pattern`));
      lines.push(chalk.gray(`   Pattern: ${pattern}`));
      lines.push('');

      // Special handling for apiVersion pattern
      if (fieldName === 'apiVersion') {
        lines.push(
          chalk.yellow(`   [TIP] apiVersion should follow format: ${chalk.bold('ossa/v0.3.0')}`)
        );
        lines.push(chalk.yellow(`      Your value: ${JSON.stringify(actualValue)}`));
        lines.push('');
      }
      break;
    }

    case 'additionalProperties': {
      const additionalProp = error.params?.additionalProperty as string;
      lines.push(chalk.red(`   Unexpected property: ${chalk.bold(additionalProp)}`));
      lines.push('');

      // Check if it's a typo
      const knownFields = Object.keys(COMMON_TYPOS);
      const suggestion = findClosestMatch(additionalProp, knownFields);
      if (suggestion) {
        lines.push(chalk.yellow(`   [TIP] Did you mean "${chalk.bold(suggestion)}"?`));
        lines.push('');
      }
      break;
    }

    case 'minItems': {
      const minItems = error.params?.limit as number;
      const actualItems = Array.isArray(actualValue) ? actualValue.length : 0;
      lines.push(chalk.red(`   Array must have at least ${minItems} item(s)`));
      lines.push(chalk.red(`   Currently has: ${actualItems}`));
      lines.push('');
      break;
    }

    default: {
      // Generic error message
      lines.push(chalk.red(`   ${error.message || 'Validation failed'}`));
      if (error.params && Object.keys(error.params).length > 0) {
        lines.push(chalk.gray(`   Details: ${JSON.stringify(error.params)}`));
      }
      lines.push('');
    }
  }

  // Add documentation link if available
  const docKey = fieldName;
  if (DOCS_LINKS[docKey]) {
    lines.push(chalk.blue(`   📖 Docs: ${DOCS_LINKS[docKey]}`));
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format multiple validation errors into a helpful error message
 */
export function formatValidationErrors(errors: ErrorObject[], manifest?: unknown): string {
  const lines: string[] = [];

  // Header
  lines.push(chalk.red.bold('\n✗ Validation Failed'));
  lines.push(chalk.red(`Found ${errors.length} error(s):\n`));

  // Format each error
  errors.forEach((error, index) => {
    lines.push(formatError(error, index, manifest));
  });

  // Footer with helpful tips
  lines.push(chalk.gray('─'.repeat(70)));
  lines.push('');
  lines.push(chalk.cyan('[TIP] Common fixes:'));
  lines.push(chalk.cyan('   • Check spelling of field names (case-sensitive)'));
  lines.push(chalk.cyan('   • Verify apiVersion format: ossa/v0.3.0'));
  lines.push(chalk.cyan('   • Use --verbose for detailed error information'));
  lines.push(chalk.cyan('   • Check examples/claude-code/ for reference manifests'));
  lines.push('');
  lines.push(chalk.blue('📚 Full documentation: https://openstandardagents.org/docs'));
  lines.push('');

  return lines.join('\n');
}

/**
 * Create a helpful suggestion based on manifest content
 */
export function suggestFix(manifest: unknown, error: ErrorObject): string | null {
  if (!manifest || typeof manifest !== 'object') {
    return null;
  }

  const m = manifest as Record<string, unknown>;
  const suggestions: string[] = [];

  // Check for common mistakes
  if (error.keyword === 'required' && error.params?.missingProperty === 'apiVersion') {
    suggestions.push('Add apiVersion field:');
    suggestions.push('  apiVersion: ossa/v0.3.0');
  }

  if (error.keyword === 'required' && error.params?.missingProperty === 'kind') {
    suggestions.push('Add kind field:');
    suggestions.push('  kind: Agent');
  }

  // Check for provider/model mismatches
  if (m.spec && typeof m.spec === 'object') {
    const spec = m.spec as Record<string, unknown>;
    if (spec.llm && typeof spec.llm === 'object') {
      const llm = spec.llm as Record<string, unknown>;
      const provider = llm.provider as string;
      const model = llm.model as string;

      if (provider && model) {
        const validModels = PROVIDER_MODELS[provider];
        if (validModels && !validModels.some((m) => model.includes(m))) {
          suggestions.push(`Warning: Model "${model}" may not be valid for provider "${provider}"`);
          suggestions.push(`Valid ${provider} models: ${validModels.join(', ')}`);
        }
      }
    }
  }

  return suggestions.length > 0 ? suggestions.join('\n') : null;
}

/**
 * Format a single error for compact output (non-verbose)
 */
export function formatErrorCompact(error: ErrorObject, index: number, manifest?: unknown): string {
  const path = error.instancePath || 'root';
  const fieldName = extractFieldName(path);

  // Try to get the actual value from the manifest if error.data is undefined
  let actualValue = error.data;
  if (actualValue === undefined && manifest) {
    actualValue = getValueAtPath(manifest, path);
  }

  let message = error.message || 'validation error';

  // Enhance message based on error type
  if (error.keyword === 'required') {
    const missingProp = error.params?.missingProperty;
    message = `missing required field "${missingProp}"`;
  } else if (error.keyword === 'enum') {
    message = `invalid value ${JSON.stringify(actualValue)}`;
  } else if (error.keyword === 'type') {
    const expectedType = error.params?.type as string;
    const actualType = Array.isArray(actualValue) ? 'array' : typeof actualValue;
    message = `expected ${expectedType}, got ${actualType}`;
  }

  return chalk.red(`  ${index + 1}. ${path}: ${message}`);
}
