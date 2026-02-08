/**
 * Simple Mustache-style Template Engine
 *
 * Zero external dependencies. Supports variable interpolation
 * and conditional blocks for generating adapter output files.
 *
 * SOLID: Single Responsibility - Template rendering only
 * DRY: Reusable across all adapters instead of inline string concatenation
 */

/**
 * Template data - flat key/value pairs for interpolation.
 * Values can be strings, numbers, booleans, arrays, or undefined.
 */
export type TemplateData = Record<
  string,
  string | number | boolean | string[] | undefined
>;

/**
 * Render a template string by replacing {{variable}} placeholders
 * with values from the data object.
 *
 * Missing keys are replaced with empty strings.
 *
 * @param template - Template string with {{variable}} placeholders
 * @param data - Key/value pairs for interpolation
 * @returns Rendered string
 */
export function render(template: string, data: TemplateData): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = data[key];
    if (value === undefined || value === null) {
      return '';
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return String(value);
  });
}

/**
 * Render a template with conditional block support.
 *
 * Supports:
 *   {{#if key}}...content...{{/if}} - Include block when key is truthy
 *   {{#unless key}}...content...{{/unless}} - Include block when key is falsy
 *   {{#each items}}...{{.}}...{{/each}} - Iterate over string arrays
 *   {{variable}} - Standard variable interpolation
 *
 * @param template - Template with conditionals and variables
 * @param data - Key/value pairs for interpolation and conditionals
 * @returns Rendered string
 */
export function renderConditional(
  template: string,
  data: TemplateData
): string {
  let result = template;

  // Process {{#each items}}...{{.}}...{{/each}} blocks
  result = result.replace(
    /\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
    (_match, key: string, content: string) => {
      const value = data[key];
      if (!Array.isArray(value) || value.length === 0) {
        return '';
      }
      return value.map((item) => content.replace(/\{\{\.\}\}/g, item)).join('');
    }
  );

  // Process {{#if key}}...{{/if}} blocks
  result = result.replace(
    /\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_match, key: string, content: string) => {
      const value = data[key];
      const isTruthy =
        value !== undefined &&
        value !== null &&
        value !== false &&
        value !== '' &&
        value !== 0 &&
        !(Array.isArray(value) && value.length === 0);
      return isTruthy ? content : '';
    }
  );

  // Process {{#unless key}}...{{/unless}} blocks
  result = result.replace(
    /\{\{#unless (\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g,
    (_match, key: string, content: string) => {
      const value = data[key];
      const isFalsy =
        value === undefined ||
        value === null ||
        value === false ||
        value === '' ||
        value === 0 ||
        (Array.isArray(value) && value.length === 0);
      return isFalsy ? content : '';
    }
  );

  // Standard variable interpolation
  result = render(result, data);

  return result;
}

// ──────────────────────────────────────────────────────────────────
// Built-in templates for common patterns
// ──────────────────────────────────────────────────────────────────

/**
 * README template with platform-specific sections.
 * Variables: name, description, role, platform, version, license,
 *            installCommand, usageCode, toolsList, llmProvider, llmModel,
 *            llmTemperature, llmMaxTokens, apiVersion
 */
export const README_TEMPLATE = `# {{name}}

{{description}}

## Description

{{role}}

## Installation

\`\`\`bash
{{installCommand}}
\`\`\`

## Usage

\`\`\`
{{usageCode}}
\`\`\`

{{#if toolsList}}
## Tools

{{toolsList}}
{{/if}}

{{#if llmProvider}}
## LLM Configuration

- **Provider**: {{llmProvider}}
- **Model**: {{llmModel}}
- **Temperature**: {{llmTemperature}}
- **Max Tokens**: {{llmMaxTokens}}
{{/if}}

## Generated from OSSA

This agent was generated from an OSSA {{apiVersion}} manifest.

Original manifest: \`agent.ossa.yaml\`

## License

{{license}}
`;

/**
 * INSTALL section template.
 * Variables: platform, installCommand, setupSteps
 */
export const INSTALL_TEMPLATE = `## Installation

### Prerequisites

{{#if prerequisites}}
{{prerequisites}}
{{/if}}

### Setup

\`\`\`bash
{{installCommand}}
\`\`\`

{{#if setupSteps}}
{{setupSteps}}
{{/if}}
`;
