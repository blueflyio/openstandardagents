#!/usr/bin/env node
/**
 * Schema to VS Code Snippets Generator
 *
 * Converts OSSA JSON Schema examples to VS Code snippets.
 * This is a DETERMINISTIC task - no LLM required.
 *
 * Usage: node schema-to-snippets.js <schema-path> <output-path> [--prefix=ossa]
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';

// Generate a VS Code snippet from an example
function generateSnippet(name, description, example, prefix = 'ossa') {
  // Convert example object to YAML-like snippet body
  const body = objectToYamlSnippet(example, 0, 1);

  return {
    prefix: `${prefix}-${toKebabCase(name)}`,
    description: description || `OSSA ${name} template`,
    body: body.split('\n'),
    scope: 'yaml',
  };
}

// Convert kebab-case
function toKebabCase(str) {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
}

// Convert object to YAML snippet with tab stops
function objectToYamlSnippet(obj, indent = 0, tabStopStart = 1) {
  const lines = [];
  const spaces = '  '.repeat(indent);
  let tabStop = tabStopStart;

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      lines.push(`${spaces}${key}: \${${tabStop++}:null}`);
    } else if (typeof value === 'string') {
      // Check if it's a placeholder pattern like ${...}
      if (value.startsWith('${') || value.includes('${{')) {
        lines.push(`${spaces}${key}: ${value}`);
      } else {
        lines.push(`${spaces}${key}: \${${tabStop++}:${value}}`);
      }
    } else if (typeof value === 'number') {
      lines.push(`${spaces}${key}: \${${tabStop++}:${value}}`);
    } else if (typeof value === 'boolean') {
      lines.push(`${spaces}${key}: \${${tabStop++}|true,false|}`);
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${spaces}${key}: []`);
      } else if (typeof value[0] === 'object') {
        lines.push(`${spaces}${key}:`);
        for (const item of value) {
          const itemLines = objectToYamlSnippet(item, indent + 1, tabStop);
          const itemLinesArray = itemLines.split('\n');
          // Add - prefix to first line
          if (itemLinesArray.length > 0) {
            lines.push(`${spaces}  - ${itemLinesArray[0].trim()}`);
            for (let i = 1; i < itemLinesArray.length; i++) {
              lines.push(`${spaces}    ${itemLinesArray[i].trim()}`);
            }
          }
          tabStop += countTabStops(itemLines);
        }
      } else {
        lines.push(`${spaces}${key}:`);
        for (const item of value) {
          lines.push(`${spaces}  - \${${tabStop++}:${item}}`);
        }
      }
    } else if (typeof value === 'object') {
      lines.push(`${spaces}${key}:`);
      const nestedLines = objectToYamlSnippet(value, indent + 1, tabStop);
      lines.push(nestedLines);
      tabStop += countTabStops(nestedLines);
    }
  }

  return lines.join('\n');
}

// Count tab stops in a string
function countTabStops(str) {
  const matches = str.match(/\$\{[0-9]+/g);
  return matches ? matches.length : 0;
}

// Generate snippets from schema
function generateSnippetsFromSchema(schemaPath, outputPath, prefix = 'ossa') {
  const schemaContent = readFileSync(schemaPath, 'utf-8');
  const schema = JSON.parse(schemaContent);

  const snippets = {};
  const snippetNames = [];

  // Core OSSA manifest templates
  const coreTemplates = {
    'agent': {
      description: 'Create a new OSSA Agent manifest',
      body: {
        apiVersion: 'ossa/v0.3.0',
        kind: 'Agent',
        metadata: {
          name: '${1:agent-name}',
          version: '${2:1.0.0}',
          description: '${3:Agent description}',
        },
        spec: {
          model: {
            provider: '${4|anthropic,openai,google|}',
            name: '${5:claude-3-sonnet}',
          },
          capabilities: ['${6:read_file}', '${7:write_file}'],
          policy: {
            max_turns: '${8:10}',
            require_approval: '${9|false,true|}',
          },
        },
      },
    },
    'task': {
      description: 'Create a new OSSA Task manifest (deterministic, no LLM)',
      body: {
        apiVersion: 'ossa/v0.3.0',
        kind: 'Task',
        metadata: {
          name: '${1:task-name}',
          version: '${2:1.0.0}',
          description: '${3:Task description}',
          labels: {
            deterministic: 'true',
          },
        },
        spec: {
          execution: {
            type: 'deterministic',
            runtime: '${4|node,python,shell|}',
            timeout_seconds: '${5:60}',
          },
          capabilities: ['${6:read_file}', '${7:write_file}'],
          input: {
            type: 'object',
            properties: {
              '${8:input_name}': {
                type: '${9|string,number,boolean,array,object|}',
              },
            },
          },
          output: {
            type: 'object',
            properties: {
              '${10:output_name}': {
                type: '${11|string,number,boolean,array,object|}',
              },
            },
          },
        },
      },
    },
    'workflow': {
      description: 'Create a new OSSA Workflow manifest',
      body: {
        apiVersion: 'ossa/v0.3.0',
        kind: 'Workflow',
        metadata: {
          name: '${1:workflow-name}',
          version: '${2:1.0.0}',
          description: '${3:Workflow description}',
        },
        spec: {
          triggers: [
            {
              type: '${4|event,schedule,manual|}',
              source: '${5:gitlab}',
            },
          ],
          steps: [
            {
              id: '${6:step-1}',
              name: '${7:First Step}',
              kind: '${8|Task,Agent|}',
              ref: '${9:./tasks/my-task.ossa.yaml}',
            },
          ],
        },
      },
    },
    'capability': {
      description: 'Define an OSSA capability',
      body: {
        '${1:capability_name}': {
          description: '${2:What this capability does}',
          parameters: {
            type: 'object',
            properties: {
              '${3:param_name}': {
                type: '${4|string,number,boolean,array,object|}',
                description: '${5:Parameter description}',
              },
            },
            required: ['${3:param_name}'],
          },
          returns: {
            type: '${6|string,number,boolean,array,object|}',
            description: '${7:Return value description}',
          },
        },
      },
    },
    'policy': {
      description: 'Define an OSSA execution policy',
      body: {
        policy: {
          max_turns: '${1:10}',
          max_tokens: '${2:4096}',
          require_approval: '${3|false,true|}',
          allowed_capabilities: ['${4:read_file}'],
          denied_capabilities: ['${5:execute_shell}'],
          rate_limit: {
            requests_per_minute: '${6:60}',
          },
        },
      },
    },
  };

  // Generate core snippets
  for (const [name, template] of Object.entries(coreTemplates)) {
    const snippetKey = `OSSA ${name.charAt(0).toUpperCase() + name.slice(1)}`;
    snippets[snippetKey] = generateSnippet(name, template.description, template.body, prefix);
    snippetNames.push(snippetKey);
  }

  // Extract examples from schema definitions
  const definitions = schema.$defs || schema.definitions || {};
  for (const [defName, def] of Object.entries(definitions)) {
    if (def.examples && def.examples.length > 0) {
      const snippetKey = `OSSA ${defName}`;
      snippets[snippetKey] = {
        prefix: `${prefix}-${toKebabCase(defName)}`,
        description: def.description || `OSSA ${defName} example`,
        body: JSON.stringify(def.examples[0], null, 2).split('\n'),
        scope: 'yaml,json',
      };
      snippetNames.push(snippetKey);
    }
  }

  // Write output
  writeFileSync(outputPath, JSON.stringify(snippets, null, 2));

  return {
    snippets_file: outputPath,
    snippets_count: snippetNames.length,
    snippet_names: snippetNames,
  };
}

// CLI execution
if (process.argv[1].endsWith('schema-to-snippets.js')) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: schema-to-snippets.js <schema-path> <output-path> [--prefix=ossa]');
    process.exit(1);
  }

  const schemaPath = args[0];
  const outputPath = args[1];
  const prefix = args.find(a => a.startsWith('--prefix='))?.split('=')[1] || 'ossa';

  try {
    const result = generateSnippetsFromSchema(schemaPath, outputPath, prefix);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

export { generateSnippetsFromSchema };
