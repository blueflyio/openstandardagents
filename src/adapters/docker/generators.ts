/**
 * Docker Generators
 * Generate Dockerfiles and docker-compose.yml from OSSA agents
 */

import type { OssaAgent } from '../../types/index.js';
import type { DockerConfig } from './types.js';

export class DockerfileGenerator {
  /**
   * Generate Dockerfile from OSSA agent
   */
  generate(manifest: OssaAgent, config: DockerConfig = {}): string {
    const spec = manifest.spec as Record<string, unknown>;
    const runtime = spec.runtime as
      | {
          type?: string;
          image?: string;
          command?: string[];
        }
      | undefined;

    const baseImage = config.baseImage || runtime?.image || 'node:20-alpine';
    const workingDir = config.workingDir || '/app';
    const exposePort = config.exposePort || 3000;

    let dockerfile = `# Dockerfile for ${manifest.metadata?.name || 'OSSA Agent'}
# Generated from OSSA manifest

FROM ${baseImage}

WORKDIR ${workingDir}

# Install dependencies
COPY package*.json ./
RUN npm ci --production

# Copy application files
COPY . .

# Expose port
EXPOSE ${exposePort}

# Health check
`;

    if (config.healthCheck) {
      dockerfile += `HEALTHCHECK --interval=${config.healthCheck.interval ?? 30}s \\
    --timeout=${config.healthCheck.timeout ?? 10}s \\
    --retries=${config.healthCheck.retries ?? 3} \\
    CMD ${config.healthCheck.command}\n\n`;
    }

    const command = runtime?.command?.[0] || 'node dist/index.js';
    dockerfile += `# Run agent
CMD ["${command}"]\n`;

    return dockerfile;
  }
}

export class DockerComposeGenerator {
  /**
   * Generate docker-compose.yml from OSSA agents
   */
  generate(manifests: OssaAgent[], config: DockerConfig = {}): string {
    const services: Record<string, unknown> = {};

    for (const manifest of manifests) {
      const name = manifest.metadata?.name || 'agent';
      const spec = manifest.spec as Record<string, unknown>;
      const constraints = spec.constraints as
        | {
            resources?: {
              cpu?: string;
              memory?: string;
            };
          }
        | undefined;

      services[name] = {
        build: {
          context: '.',
          dockerfile: `Dockerfile.${name}`,
        },
        ports: [`${config.exposePort || 3000}:${config.exposePort || 3000}`],
        environment: {
          NODE_ENV: 'production',
        },
        ...(constraints?.resources && {
          deploy: {
            resources: {
              limits: {
                cpus: constraints.resources.cpu || '1',
                memory: constraints.resources.memory || '512m',
              },
            },
          },
        }),
      };
    }

    return `# docker-compose.yml
# Generated from OSSA manifests

version: '3.8'

services:
${Object.entries(services)
  .map(
    ([name, service]) => `  ${name}:
${JSON.stringify(service, null, 4)
  .split('\n')
  .map((line) => `    ${line}`)
  .join('\n')}`
  )
  .join('\n\n')}
`;
  }
}
