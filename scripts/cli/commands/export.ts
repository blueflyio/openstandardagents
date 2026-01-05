/**
 * OSSA CLI: Export command
 * Export agent manifest to different formats
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, extname } from 'path';

interface ExportOptions {
  format?: 'json' | 'yaml' | 'openapi' | 'k8s';
  output?: string;
  pretty?: boolean;
}

async function exportManifest(manifest: string, options: ExportOptions): Promise<void> {
  const manifestPath = resolve(manifest);
  const manifestContent = readFileSync(manifestPath, 'utf-8');
  const agentConfig = parseYaml(manifestContent);

  const format = options.format || 'json';
  let output: string;

  switch (format) {
    case 'json':
      output = JSON.stringify(agentConfig, null, options.pretty ? 2 : 0);
      break;
    case 'yaml':
      output = toYaml(agentConfig);
      break;
    case 'openapi':
      output = toOpenAPI(agentConfig);
      break;
    case 'k8s':
      output = toKubernetes(agentConfig);
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }

  if (options.output) {
    const outputPath = resolve(options.output);
    writeFileSync(outputPath, output);
    console.log(`✅ Exported to ${outputPath}`);
  } else {
    console.log(output);
  }
}

function parseYaml(content: string): any {
  const lines = content.split('\n');
  const result: any = {};
  let currentKey = '';
  let indent = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const currentIndent = line.length - line.trimStart().length;
    const match = trimmed.match(/^(\w+):\s*(.+)?$/);

    if (match) {
      const key = match[1];
      const value = match[2]?.trim();

      if (currentIndent <= indent) {
        result[key] = value || {};
      } else {
        if (!result[currentKey]) {
          result[currentKey] = {};
        }
        result[currentKey][key] = value || {};
      }

      currentKey = key;
      indent = currentIndent;
    }
  }

  return result;
}

function toYaml(obj: any, indent = 0): string {
  const spaces = '  '.repeat(indent);
  let result = '';

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null) {
      result += `${spaces}${key}:\n${toYaml(value, indent + 1)}`;
    } else {
      result += `${spaces}${key}: ${value}\n`;
    }
  }

  return result;
}

function toOpenAPI(agentConfig: any): string {
  const openapi = {
    openapi: '3.1.0',
    info: {
      title: agentConfig.metadata.name,
      version: agentConfig.metadata.version,
      description: agentConfig.metadata.description
    },
    paths: {
      '/execute': {
        post: {
          summary: 'Execute agent',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Success'
            }
          }
        }
      }
    }
  };

  return JSON.stringify(openapi, null, 2);
}

function toKubernetes(agentConfig: any): string {
  const deployment = {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name: agentConfig.metadata.name,
      namespace: agentConfig.metadata.namespace
    },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: {
          app: agentConfig.metadata.name
        }
      },
      template: {
        metadata: {
          labels: {
            app: agentConfig.metadata.name
          }
        },
        spec: {
          containers: [{
            name: agentConfig.metadata.name,
            image: `ossa/${agentConfig.metadata.name}:${agentConfig.metadata.version}`,
            ports: [{
              containerPort: 3000
            }]
          }]
        }
      }
    }
  };

  return JSON.stringify(deployment, null, 2);
}

export { exportManifest };
