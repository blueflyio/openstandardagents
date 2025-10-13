/**
 * OSSA Init Command
 *
 * Initializes a new OSSA agent project with proper directory structure.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const AGENT_TYPES = ['worker', 'orchestrator', 'integrator', 'monitor', 'critic', 'judge', 'governor'];

module.exports = async function init(name, options) {
  try {
    const { type, directory } = options;

    // Validate agent type
    if (!AGENT_TYPES.includes(type)) {
      console.error(`Error: Invalid agent type "${type}"`);
      console.error(`Valid types: ${AGENT_TYPES.join(', ')}`);
      process.exit(1);
    }

    // Create directories
    const baseDir = path.resolve(process.cwd(), directory);
    const agentsDir = path.join(baseDir, '.agents');
    const agentDir = path.join(agentsDir, name);
    const workspaceDir = path.join(baseDir, '.agents-workspace');

    console.log(`Initializing OSSA agent: ${name}`);
    console.log(`Type: ${type}`);
    console.log(`Location: ${agentDir}`);

    // Create directory structure
    if (fs.existsSync(agentDir)) {
      console.error(`Error: Agent directory already exists: ${agentDir}`);
      process.exit(1);
    }

    fs.mkdirSync(agentDir, { recursive: true });
    fs.mkdirSync(path.join(agentDir, 'behaviors'), { recursive: true });
    fs.mkdirSync(path.join(agentDir, 'handlers'), { recursive: true });
    fs.mkdirSync(path.join(agentDir, 'schemas'), { recursive: true });
    fs.mkdirSync(path.join(agentDir, 'tests', 'unit'), { recursive: true });
    fs.mkdirSync(workspaceDir, { recursive: true });

    // Create agent manifest
    const manifest = createManifest(name, type);
    fs.writeFileSync(
      path.join(agentDir, 'agent.yml'),
      yaml.stringify(manifest),
      'utf-8'
    );

    // Create README
    const readme = createReadme(name, type);
    fs.writeFileSync(
      path.join(agentDir, 'README.md'),
      readme,
      'utf-8'
    );

    // Create basic OpenAPI spec
    const openapi = createOpenAPI(name);
    fs.writeFileSync(
      path.join(agentDir, 'openapi.yml'),
      yaml.stringify(openapi),
      'utf-8'
    );

    console.log('\n\u2713 Agent initialized successfully\n');
    console.log('Directory structure:');
    console.log(`  ${agentDir}/`);
    console.log('    \u251c\u2500\u2500 agent.yml         # OSSA manifest');
    console.log('    \u251c\u2500\u2500 openapi.yml       # API specification');
    console.log('    \u251c\u2500\u2500 README.md         # Documentation');
    console.log('    \u251c\u2500\u2500 behaviors/        # Behavior definitions');
    console.log('    \u251c\u2500\u2500 handlers/         # Implementation handlers');
    console.log('    \u251c\u2500\u2500 schemas/          # JSON schemas');
    console.log('    \u2514\u2500\u2500 tests/            # Unit tests');
    console.log('\nNext steps:');
    console.log(`  1. Edit ${name}/agent.yml to define capabilities`);
    console.log(`  2. Run: ossa validate .agents/${name}/agent.yml`);
    console.log(`  3. Implement handlers in ${name}/handlers/`);

  } catch (error) {
    console.error('Error during initialization:', error.message);
    process.exit(1);
  }
};

function createManifest(name, type) {
  const roleMap = {
    worker: 'custom',
    orchestrator: 'orchestration',
    integrator: 'integration',
    monitor: 'monitoring',
    critic: 'development',
    judge: 'custom',
    governor: 'compliance'
  };

  return {
    ossaVersion: '1.0',
    agent: {
      id: name,
      name: name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      version: '1.0.0',
      description: `OSSA ${type} agent`,
      role: roleMap[type] || 'custom',
      tags: [type],
      runtime: {
        type: 'docker',
        image: `ossa/${name}:1.0.0`,
        resources: {
          cpu: '500m',
          memory: '512Mi'
        },
        health_check: {
          type: 'http',
          endpoint: '/health',
          port: 3000
        }
      },
      capabilities: [
        {
          name: 'process_request',
          description: 'Process incoming requests',
          input_schema: {
            type: 'object',
            required: ['input'],
            properties: {
              input: {
                type: 'string',
                description: 'Input data'
              }
            }
          },
          output_schema: {
            type: 'object',
            properties: {
              result: {
                type: 'string',
                description: 'Processing result'
              }
            }
          },
          timeout_seconds: 300
        }
      ],
      integration: {
        protocol: 'http',
        endpoints: {
          base_url: 'http://localhost:3000',
          health: '/health',
          metrics: '/metrics'
        },
        auth: {
          type: 'jwt'
        }
      },
      monitoring: {
        traces: true,
        metrics: true,
        logs: true
      },
      metadata: {
        author: 'OSSA Team',
        license: 'Apache-2.0'
      }
    }
  };
}

function createReadme(name, type) {
  return `# ${name}

OSSA ${type} agent

## Description

This is an OSSA 1.0 compliant ${type} agent.

## Usage

### Validate Agent

\`\`\`bash
ossa validate .agents/${name}/agent.yml
\`\`\`

### API Documentation

See \`openapi.yml\` for complete API specification.

## Development

### Directory Structure

- \`agent.yml\` - OSSA manifest
- \`openapi.yml\` - OpenAPI specification
- \`behaviors/\` - Behavior definitions
- \`handlers/\` - Implementation handlers
- \`schemas/\` - JSON schemas
- \`tests/\` - Unit tests

### Testing

\`\`\`bash
npm test
\`\`\`

## License

Apache-2.0
`;
}

function createOpenAPI(name) {
  return {
    openapi: '3.1.0',
    info: {
      title: `${name} API`,
      version: '1.0.0',
      description: `OSSA agent API for ${name}`
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local development'
      }
    ],
    paths: {
      '/health': {
        get: {
          summary: 'Health check',
          operationId: 'healthCheck',
          responses: {
            '200': {
              description: 'Health status',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: {
                        type: 'string',
                        enum: ['healthy', 'degraded', 'unhealthy']
                      },
                      timestamp: {
                        type: 'string',
                        format: 'date-time'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/execute': {
        post: {
          summary: 'Execute capability',
          operationId: 'executeCapability',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['capability', 'input'],
                  properties: {
                    capability: {
                      type: 'string'
                    },
                    input: {
                      type: 'object'
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Execution result',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      output: {
                        type: 'object'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };
}
