/**
 * OSSA Generate Command
 *
 * Generates OSSA agent boilerplate from templates.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const TEMPLATES = {
  worker: 'worker',
  orchestrator: 'orchestrator',
  integrator: 'integrator',
  monitor: 'monitor',
  critic: 'critic',
  judge: 'judge',
  governor: 'governor',
  minimal: 'minimal'
};

module.exports = async function generate(type, options) {
  try {
    const { name, output } = options;

    if (!TEMPLATES[type]) {
      console.error(`Error: Unknown template type "${type}"`);
      console.error(`Available templates: ${Object.keys(TEMPLATES).join(', ')}`);
      process.exit(1);
    }

    console.log(`Generating ${type} agent: ${name}`);

    const template = loadTemplate(type, name);
    const outputPath = path.resolve(process.cwd(), output, `${name}.yml`);

    fs.writeFileSync(outputPath, yaml.stringify(template), 'utf-8');

    console.log(`\n\u2713 Generated agent manifest: ${outputPath}`);
    console.log('\nNext steps:');
    console.log(`  1. Review: cat ${outputPath}`);
    console.log(`  2. Validate: ossa validate ${outputPath}`);
    console.log(`  3. Initialize full project: ossa init ${name} --type ${type}`);

  } catch (error) {
    console.error('Error during generation:', error.message);
    process.exit(1);
  }
};

function loadTemplate(type, name) {
  const templates = {
    minimal: createMinimalTemplate(name),
    worker: createWorkerTemplate(name),
    orchestrator: createOrchestratorTemplate(name),
    integrator: createIntegratorTemplate(name),
    monitor: createMonitorTemplate(name),
    critic: createCriticTemplate(name),
    judge: createJudgeTemplate(name),
    governor: createGovernorTemplate(name)
  };

  return templates[type];
}

function createMinimalTemplate(name) {
  return {
    ossaVersion: '1.0',
    agent: {
      id: name,
      name: formatName(name),
      version: '1.0.0',
      role: 'custom',
      runtime: {
        type: 'docker'
      },
      capabilities: [
        {
          name: 'process',
          description: 'Process requests',
          input_schema: { type: 'object' },
          output_schema: { type: 'object' }
        }
      ]
    }
  };
}

function createWorkerTemplate(name) {
  return {
    ossaVersion: '1.0',
    agent: {
      id: name,
      name: formatName(name),
      version: '1.0.0',
      description: 'Task execution worker agent',
      role: 'custom',
      tags: ['worker', 'task-execution'],
      runtime: {
        type: 'k8s',
        image: `ossa/${name}:1.0.0`,
        resources: {
          cpu: '1',
          memory: '2Gi'
        },
        health_check: {
          type: 'http',
          endpoint: '/health',
          port: 3000
        }
      },
      capabilities: [
        {
          name: 'execute_task',
          description: 'Execute computational task',
          input_schema: {
            type: 'object',
            required: ['task_type', 'parameters'],
            properties: {
              task_type: {
                type: 'string',
                description: 'Type of task to execute'
              },
              parameters: {
                type: 'object',
                description: 'Task parameters'
              }
            }
          },
          output_schema: {
            type: 'object',
            properties: {
              result: {
                type: 'object',
                description: 'Task execution result'
              },
              execution_time: {
                type: 'number',
                description: 'Execution time in milliseconds'
              }
            }
          },
          timeout_seconds: 600
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
      }
    }
  };
}

function createOrchestratorTemplate(name) {
  return {
    ossaVersion: '1.0',
    agent: {
      id: name,
      name: formatName(name),
      version: '1.0.0',
      description: 'Multi-agent workflow orchestrator',
      role: 'orchestration',
      tags: ['orchestrator', 'workflow'],
      runtime: {
        type: 'k8s',
        image: `ossa/${name}:1.0.0`,
        resources: {
          cpu: '2',
          memory: '4Gi'
        }
      },
      capabilities: [
        {
          name: 'execute_workflow',
          description: 'Execute multi-agent workflow',
          input_schema: {
            type: 'object',
            required: ['workflow_definition'],
            properties: {
              workflow_definition: {
                type: 'object',
                properties: {
                  steps: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['agent_id', 'capability'],
                      properties: {
                        agent_id: { type: 'string' },
                        capability: { type: 'string' },
                        inputs: { type: 'object' }
                      }
                    }
                  }
                }
              }
            }
          },
          output_schema: {
            type: 'object',
            properties: {
              workflow_id: { type: 'string' },
              status: {
                type: 'string',
                enum: ['pending', 'running', 'completed', 'failed']
              },
              results: {
                type: 'array',
                items: { type: 'object' }
              }
            }
          }
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
      }
    }
  };
}

function createIntegratorTemplate(name) {
  return {
    ossaVersion: '1.0',
    agent: {
      id: name,
      name: formatName(name),
      version: '1.0.0',
      description: 'External system integration agent',
      role: 'integration',
      tags: ['integrator', 'api'],
      runtime: {
        type: 'docker',
        image: `ossa/${name}:1.0.0`
      },
      capabilities: [
        {
          name: 'connect_system',
          description: 'Connect to external system',
          input_schema: {
            type: 'object',
            required: ['endpoint', 'method'],
            properties: {
              endpoint: { type: 'string' },
              method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE'] },
              headers: { type: 'object' },
              body: { type: 'object' }
            }
          },
          output_schema: {
            type: 'object',
            properties: {
              status: { type: 'integer' },
              data: { type: 'object' }
            }
          }
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
          type: 'api_key'
        }
      },
      monitoring: {
        traces: true,
        metrics: true,
        logs: true
      }
    }
  };
}

function createMonitorTemplate(name) {
  return {
    ossaVersion: '1.0',
    agent: {
      id: name,
      name: formatName(name),
      version: '1.0.0',
      description: 'System monitoring and observability agent',
      role: 'monitoring',
      tags: ['monitor', 'observability'],
      runtime: {
        type: 'k8s',
        image: `ossa/${name}:1.0.0`
      },
      capabilities: [
        {
          name: 'collect_metrics',
          description: 'Collect system metrics',
          input_schema: {
            type: 'object',
            properties: {
              targets: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    endpoint: { type: 'string' },
                    interval: { type: 'integer' }
                  }
                }
              }
            }
          },
          output_schema: {
            type: 'object',
            properties: {
              metrics: {
                type: 'array',
                items: { type: 'object' }
              }
            }
          }
        }
      ],
      integration: {
        protocol: 'http',
        endpoints: {
          base_url: 'http://localhost:3000',
          health: '/health',
          metrics: '/metrics'
        }
      },
      monitoring: {
        traces: true,
        metrics: true,
        logs: true
      }
    }
  };
}

function createCriticTemplate(name) {
  return {
    ossaVersion: '1.0',
    agent: {
      id: name,
      name: formatName(name),
      version: '1.0.0',
      description: 'Quality assessment and code review agent',
      role: 'development',
      tags: ['critic', 'quality'],
      runtime: {
        type: 'docker',
        image: `ossa/${name}:1.0.0`
      },
      capabilities: [
        {
          name: 'review_code',
          description: 'Analyze code quality',
          input_schema: {
            type: 'object',
            required: ['code', 'language'],
            properties: {
              code: { type: 'string' },
              language: { type: 'string' }
            }
          },
          output_schema: {
            type: 'object',
            properties: {
              score: { type: 'number' },
              issues: {
                type: 'array',
                items: { type: 'object' }
              }
            }
          }
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
      }
    }
  };
}

function createJudgeTemplate(name) {
  return {
    ossaVersion: '1.0',
    agent: {
      id: name,
      name: formatName(name),
      version: '1.0.0',
      description: 'Decision-making and ranking agent',
      role: 'custom',
      tags: ['judge', 'decision'],
      runtime: {
        type: 'docker',
        image: `ossa/${name}:1.0.0`
      },
      capabilities: [
        {
          name: 'make_decision',
          description: 'Make decision based on criteria',
          input_schema: {
            type: 'object',
            required: ['options', 'criteria'],
            properties: {
              options: {
                type: 'array',
                items: { type: 'object' }
              },
              criteria: {
                type: 'array',
                items: { type: 'object' }
              }
            }
          },
          output_schema: {
            type: 'object',
            properties: {
              decision: { type: 'string' },
              score: { type: 'number' },
              reasoning: { type: 'string' }
            }
          }
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
      }
    }
  };
}

function createGovernorTemplate(name) {
  return {
    ossaVersion: '1.0',
    agent: {
      id: name,
      name: formatName(name),
      version: '1.0.0',
      description: 'Policy enforcement and governance agent',
      role: 'compliance',
      tags: ['governor', 'policy'],
      runtime: {
        type: 'k8s',
        image: `ossa/${name}:1.0.0`
      },
      capabilities: [
        {
          name: 'enforce_policy',
          description: 'Enforce organizational policies',
          input_schema: {
            type: 'object',
            required: ['action', 'context'],
            properties: {
              action: { type: 'string' },
              context: { type: 'object' }
            }
          },
          output_schema: {
            type: 'object',
            properties: {
              allowed: { type: 'boolean' },
              violations: {
                type: 'array',
                items: { type: 'string' }
              }
            }
          }
        }
      ],
      policies: {
        compliance: ['fedramp-moderate', 'soc2-type2'],
        audit: true,
        encryption: true
      },
      integration: {
        protocol: 'http',
        endpoints: {
          base_url: 'http://localhost:3000',
          health: '/health',
          metrics: '/metrics'
        },
        auth: {
          type: 'mtls'
        }
      },
      monitoring: {
        traces: true,
        metrics: true,
        logs: true
      }
    }
  };
}

function formatName(id) {
  return id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
