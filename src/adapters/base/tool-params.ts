/**
 * Shared utility for generating typed tool parameters from JSON Schema
 * Used by CrewAI, LangChain, and other Python/TS adapters
 */

interface ToolSchema {
  name?: string;
  description?: string;
  type?: string;
  input_schema?: JsonSchema;
  inputSchema?: JsonSchema;
  schema?: JsonSchema;
  parameters?: JsonSchema;
}

interface JsonSchema {
  type?: string;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
}

interface JsonSchemaProperty {
  type?: string;
  description?: string;
  enum?: string[];
  default?: any;
  items?: { type?: string };
}

/**
 * Map JSON Schema type to Python type hint
 */
function jsonTypeToPython(prop: JsonSchemaProperty): string {
  switch (prop.type) {
    case 'string':
      return prop.enum
        ? `Literal[${prop.enum.map((e) => `"${e}"`).join(', ')}]`
        : 'str';
    case 'integer':
      return 'int';
    case 'number':
      return 'float';
    case 'boolean':
      return 'bool';
    case 'array':
      const itemType = prop.items?.type
        ? jsonTypeToPython({ type: prop.items.type })
        : 'Any';
      return `list[${itemType}]`;
    case 'object':
      return 'dict';
    default:
      return 'str';
  }
}

/**
 * Generate Python function signature from tool schema
 * Returns: { params: "name: str, age: int = 0", imports: Set<string> }
 */
export function generatePythonToolParams(tool: ToolSchema): {
  params: string;
  imports: Set<string>;
  docParams: string;
} {
  const schema =
    tool.input_schema || tool.inputSchema || tool.schema || tool.parameters;
  const imports = new Set<string>();

  if (!schema?.properties || Object.keys(schema.properties).length === 0) {
    return {
      params: 'input_data: str',
      imports,
      docParams: '    input_data: Input data for the tool',
    };
  }

  const required = new Set(schema.required || []);
  const params: string[] = [];
  const docLines: string[] = [];

  // Required params first, then optional
  const entries = Object.entries(schema.properties);
  const sortedEntries = [
    ...entries.filter(([name]) => required.has(name)),
    ...entries.filter(([name]) => !required.has(name)),
  ];

  for (const [name, prop] of sortedEntries) {
    const pyType = jsonTypeToPython(prop);

    if (pyType.startsWith('Literal[')) {
      imports.add('from typing import Literal');
    }
    if (pyType === 'Any') {
      imports.add('from typing import Any');
    }

    const isRequired = required.has(name);
    const defaultVal =
      prop.default !== undefined
        ? ` = ${JSON.stringify(prop.default)}`
        : isRequired
          ? ''
          : ' = None';

    const optionalType = isRequired ? pyType : `${pyType} | None`;
    params.push(`${name}: ${isRequired ? pyType : optionalType}${defaultVal}`);

    const desc = prop.description || `${name} parameter`;
    docLines.push(`    ${name}: ${desc}`);
  }

  return {
    params: params.join(', '),
    imports,
    docParams: docLines.join('\n'),
  };
}

/**
 * Map JSON Schema type to TypeScript type
 */
function jsonTypeToTS(prop: JsonSchemaProperty): string {
  switch (prop.type) {
    case 'string':
      return prop.enum ? prop.enum.map((e) => `'${e}'`).join(' | ') : 'string';
    case 'integer':
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'array':
      const itemType = prop.items?.type
        ? jsonTypeToTS({ type: prop.items.type })
        : 'unknown';
      return `${itemType}[]`;
    case 'object':
      return 'Record<string, unknown>';
    default:
      return 'string';
  }
}

/**
 * Generate TypeScript interface from tool schema
 */
export function generateTSToolInterface(tool: ToolSchema): string {
  const schema =
    tool.input_schema || tool.inputSchema || tool.schema || tool.parameters;
  const toolName = (tool.name || 'unknown').replace(/[^a-zA-Z0-9]/g, '');
  const interfaceName =
    toolName.charAt(0).toUpperCase() + toolName.slice(1) + 'Input';

  if (!schema?.properties || Object.keys(schema.properties).length === 0) {
    return `interface ${interfaceName} { input: string; }`;
  }

  const required = new Set(schema.required || []);
  const fields = Object.entries(schema.properties)
    .map(([name, prop]) => {
      const tsType = jsonTypeToTS(prop);
      const optional = required.has(name) ? '' : '?';
      const comment = prop.description ? ` // ${prop.description}` : '';
      return `  ${name}${optional}: ${tsType};${comment}`;
    })
    .join('\n');

  return `interface ${interfaceName} {\n${fields}\n}`;
}
