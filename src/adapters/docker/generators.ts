/**
 * Production-Grade Docker Generators
 * Generate complete Docker deployment packages from OSSA agents
 *
 * Includes:
 * - Multi-stage Dockerfiles (build + runtime)
 * - Development and production Docker files
 * - docker-compose.yml with all services
 * - docker-compose.prod.yml for production
 * - Entrypoint and healthcheck scripts
 * - Configuration files (nginx, supervisor)
 * - Deployment scripts
 * - Complete documentation
 */

import type { OssaAgent } from '../../types/index.js';
import type { DockerConfig, DockerExportOptions } from './types.js';

export class DockerfileGenerator {
  /**
   * Generate multi-stage production Dockerfile
   */
  generate(manifest: OssaAgent, config: DockerExportOptions = {}): string {
    const spec = manifest.spec as Record<string, unknown>;
    const runtime = spec.runtime as
      | {
          type?: string;
          image?: string;
          command?: string[];
          environment?: Record<string, string>;
        }
      | undefined;

    const agentName = manifest.metadata?.name || 'agent';
    const nodeVersion = config.nodeVersion || '20';
    const baseImage =
      config.baseImage || runtime?.image || `node:${nodeVersion}-alpine`;
    const workingDir = config.workingDir || '/app';
    const exposePort = config.exposePort || 3000;

    const dockerfile = `# Multi-stage Dockerfile for ${agentName}
# Generated from OSSA manifest: \${manifest.apiVersion}

# ================================
# Stage 1: Dependencies
# ================================
FROM ${baseImage} AS deps

WORKDIR ${workingDir}

# Install production dependencies only
COPY package*.json ./
RUN npm ci --production --ignore-scripts && \\
    npm cache clean --force

# ================================
# Stage 2: Builder
# ================================
FROM ${baseImage} AS builder

WORKDIR ${workingDir}

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Install all dependencies (including dev)
RUN npm ci --ignore-scripts

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build && \\
    npm prune --production

# ================================
# Stage 3: Runtime
# ================================
FROM ${baseImage} AS runtime

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \\
    adduser -S nodejs -u 1001

WORKDIR ${workingDir}

# Copy production dependencies from deps stage
COPY --from=deps --chown=nodejs:nodejs ${workingDir}/node_modules ./node_modules

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs ${workingDir}/dist ./dist
COPY --from=builder --chown=nodejs:nodejs ${workingDir}/package*.json ./

# Copy scripts
COPY --chown=nodejs:nodejs scripts/ ./scripts/
RUN chmod +x ./scripts/*.sh

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE ${exposePort}

# Health check
${this.generateHealthCheck(config)}

# Set environment
ENV NODE_ENV=production \\
    PORT=${exposePort}

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Run application
CMD ["node", "dist/index.js"]
`;

    return dockerfile;
  }

  /**
   * Generate development Dockerfile
   */
  generateDev(manifest: OssaAgent, config: DockerExportOptions = {}): string {
    const nodeVersion = config.nodeVersion || '20';
    const baseImage = config.baseImage || `node:${nodeVersion}`;
    const workingDir = config.workingDir || '/app';
    const exposePort = config.exposePort || 3000;
    const agentName = manifest.metadata?.name || 'agent';

    return `# Development Dockerfile for ${agentName}
# Hot-reload enabled for development

FROM ${baseImage}

# Install development tools
RUN apt-get update && apt-get install -y \\
    git \\
    curl \\
    vim \\
    && rm -rf /var/lib/apt/lists/*

WORKDIR ${workingDir}

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm install

# Copy source code
COPY . .

# Expose port and debug port
EXPOSE ${exposePort}
EXPOSE 9229

# Set development environment
ENV NODE_ENV=development \\
    PORT=${exposePort}

# Run with nodemon for hot-reload
CMD ["npm", "run", "dev"]
`;
  }

  /**
   * Generate health check configuration
   */
  private generateHealthCheck(config: DockerExportOptions): string {
    if (!config.healthCheck) {
      return `HEALTHCHECK --interval=30s --timeout=10s --retries=3 \\
  CMD node -e "require('http').get('http://localhost:${config.exposePort || 3000}/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); });"`;
    }

    const { command, interval = 30, timeout = 10, retries = 3 } = config.healthCheck;
    return `HEALTHCHECK --interval=${interval}s --timeout=${timeout}s --retries=${retries} \\
  CMD ${command}`;
  }
}

export class DockerComposeGenerator {
  /**
   * Generate development docker-compose.yml
   */
  generate(manifests: OssaAgent[], config: DockerExportOptions = {}): string {
    const services: Record<string, any> = {};

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
          dockerfile: 'Dockerfile.dev',
          target: 'development',
        },
        ports: [`${config.exposePort || 3000}:${config.exposePort || 3000}`, '9229:9229'],
        volumes: [
          '.:/app',
          '/app/node_modules', // Don't override node_modules
        ],
        environment: {
          NODE_ENV: 'development',
          PORT: config.exposePort || 3000,
          LOG_LEVEL: 'debug',
          ...(config.environment || {}),
        },
        networks: ['agent-network'],
        depends_on: this.generateDependencies(manifest),
      };
    }

    // Add common services
    services.postgres = {
      image: 'postgres:16-alpine',
      environment: {
        POSTGRES_DB: 'agent_db',
        POSTGRES_USER: 'agent',
        POSTGRES_PASSWORD: 'development',
      },
      ports: ['5432:5432'],
      volumes: ['postgres-data:/var/lib/postgresql/data'],
      networks: ['agent-network'],
      healthcheck: {
        test: ['CMD-SHELL', 'pg_isready -U agent'],
        interval: '10s',
        timeout: '5s',
        retries: 5,
      },
    };

    services.redis = {
      image: 'redis:7-alpine',
      ports: ['6379:6379'],
      volumes: ['redis-data:/data'],
      networks: ['agent-network'],
      healthcheck: {
        test: ['CMD', 'redis-cli', 'ping'],
        interval: '10s',
        timeout: '5s',
        retries: 5,
      },
    };

    const compose = {
      version: '3.8',
      services,
      networks: {
        'agent-network': {
          driver: 'bridge',
        },
      },
      volumes: {
        'postgres-data': {},
        'redis-data': {},
      },
    };

    return this.formatYAML(compose);
  }

  /**
   * Generate production docker-compose.yml
   */
  generateProduction(
    manifests: OssaAgent[],
    config: DockerExportOptions = {}
  ): string {
    const services: Record<string, any> = {};

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
        image: `${name}:latest`,
        build: {
          context: '.',
          dockerfile: 'Dockerfile',
          target: 'runtime',
        },
        ports: [`${config.exposePort || 3000}:${config.exposePort || 3000}`],
        environment: {
          NODE_ENV: 'production',
          PORT: config.exposePort || 3000,
          LOG_LEVEL: 'info',
          ...(config.environment || {}),
        },
        networks: ['agent-network'],
        restart: 'unless-stopped',
        depends_on: this.generateDependencies(manifest),
        deploy: {
          replicas: 2,
          resources: {
            limits: {
              cpus: constraints?.resources?.cpu || config.resources?.cpus || '1.0',
              memory:
                constraints?.resources?.memory || config.resources?.memory || '512M',
            },
            reservations: {
              cpus: '0.5',
              memory: '256M',
            },
          },
          restart_policy: {
            condition: 'on-failure',
            delay: '5s',
            max_attempts: 3,
            window: '120s',
          },
          update_config: {
            parallelism: 1,
            delay: '10s',
            failure_action: 'rollback',
          },
        },
        healthcheck: {
          test: ['CMD-SHELL', 'node scripts/healthcheck.sh'],
          interval: '30s',
          timeout: '10s',
          retries: 3,
          start_period: '40s',
        },
        logging: {
          driver: 'json-file',
          options: {
            'max-size': '10m',
            'max-file': '3',
          },
        },
      };
    }

    // Production database
    services.postgres = {
      image: 'postgres:16-alpine',
      environment: {
        POSTGRES_DB: '${POSTGRES_DB}',
        POSTGRES_USER: '${POSTGRES_USER}',
        POSTGRES_PASSWORD: '${POSTGRES_PASSWORD}',
      },
      volumes: ['postgres-data:/var/lib/postgresql/data'],
      networks: ['agent-network'],
      restart: 'unless-stopped',
      healthcheck: {
        test: ['CMD-SHELL', 'pg_isready -U ${POSTGRES_USER}'],
        interval: '10s',
        timeout: '5s',
        retries: 5,
      },
    };

    // Production Redis
    services.redis = {
      image: 'redis:7-alpine',
      command: ['redis-server', '--appendonly', 'yes'],
      volumes: ['redis-data:/data'],
      networks: ['agent-network'],
      restart: 'unless-stopped',
      healthcheck: {
        test: ['CMD', 'redis-cli', 'ping'],
        interval: '10s',
        timeout: '5s',
        retries: 5,
      },
    };

    // Nginx reverse proxy (optional)
    if (config.includeNginx) {
      services.nginx = {
        image: 'nginx:alpine',
        ports: ['80:80', '443:443'],
        volumes: [
          './nginx/nginx.conf:/etc/nginx/nginx.conf:ro',
          './nginx/ssl:/etc/nginx/ssl:ro',
        ],
        networks: ['agent-network'],
        depends_on: manifests.map((m) => m.metadata?.name || 'agent'),
        restart: 'unless-stopped',
      };
    }

    const compose = {
      version: '3.8',
      services,
      networks: {
        'agent-network': {
          driver: 'bridge',
        },
      },
      volumes: {
        'postgres-data': {},
        'redis-data': {},
      },
    };

    return this.formatYAML(compose);
  }

  /**
   * Generate service dependencies
   */
  private generateDependencies(manifest: OssaAgent): Record<string, any> {
    const spec = manifest.spec as Record<string, unknown>;
    const dependencies: Record<string, any> = {};

    // Check for database dependencies
    if (spec.storage || spec.memory) {
      dependencies.postgres = {
        condition: 'service_healthy',
      };
    }

    // Check for cache dependencies
    if (spec.cache || spec.session) {
      dependencies.redis = {
        condition: 'service_healthy',
      };
    }

    return dependencies;
  }

  /**
   * Format object as YAML
   */
  private formatYAML(obj: any, indent = 0): string {
    const spaces = '  '.repeat(indent);
    let yaml = '';

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) {
        continue;
      }

      if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        for (const item of value) {
          if (typeof item === 'object') {
            yaml += `${spaces}  - ${this.formatYAML(item, indent + 2).trim()}\n`;
          } else {
            yaml += `${spaces}  - ${item}\n`;
          }
        }
      } else if (typeof value === 'object') {
        yaml += `${spaces}${key}:\n`;
        yaml += this.formatYAML(value, indent + 1);
      } else {
        yaml += `${spaces}${key}: \${value}\n`;
      }
    }

    return yaml;
  }
}

export class DockerScriptsGenerator {
  /**
   * Generate entrypoint.sh script
   */
  generateEntrypoint(manifest: OssaAgent): string {
    const agentName = manifest.metadata?.name || 'agent';

    return `#!/bin/sh
# Entrypoint script for ${agentName}
# Handles initialization and graceful shutdown

set -e

echo "Starting ${agentName}..."

# Wait for dependencies
if [ -n "\$POSTGRES_HOST" ]; then
  echo "Waiting for PostgreSQL..."
  until nc -z "\$POSTGRES_HOST" "\${POSTGRES_PORT:-5432}"; do
    echo "PostgreSQL is unavailable - sleeping"
    sleep 1
  done
  echo "PostgreSQL is up"
fi

if [ -n "\$REDIS_HOST" ]; then
  echo "Waiting for Redis..."
  until nc -z "\$REDIS_HOST" "\${REDIS_PORT:-6379}"; do
    echo "Redis is unavailable - sleeping"
    sleep 1
  done
  echo "Redis is up"
fi

# Run database migrations (if applicable)
if [ -f "scripts/migrate.sh" ]; then
  echo "Running database migrations..."
  ./scripts/migrate.sh
fi

# Execute the main command
echo "Starting application..."
exec "\$@"
`;
  }

  /**
   * Generate healthcheck.sh script
   */
  generateHealthcheck(manifest: OssaAgent, port: number = 3000): string {
    return `#!/bin/sh
# Health check script
# Returns 0 if healthy, 1 if unhealthy

set -e

# Check if process is running
if ! pgrep -f "node" > /dev/null; then
  echo "Process not running"
  exit 1
fi

# Check HTTP health endpoint
response=\$(curl -s -o /dev/null -w "%{http_code}" http://localhost:${port}/health || echo "000")

if [ "\$response" = "200" ]; then
  echo "Health check passed"
  exit 0
else
  echo "Health check failed with status: \$response"
  exit 1
fi
`;
  }

  /**
   * Generate build.sh script
   */
  generateBuild(manifest: OssaAgent): string {
    const agentName = manifest.metadata?.name || 'agent';

    return `#!/bin/bash
# Build Docker image for ${agentName}

set -e

IMAGE_NAME="${agentName}"
VERSION=\${VERSION:-latest}
REGISTRY=\${REGISTRY:-}

echo "Building Docker image: \${IMAGE_NAME}:\${VERSION}"

# Build production image
docker build \\
  --target runtime \\
  --tag "\${IMAGE_NAME}:\${VERSION}" \\
  --tag "\${IMAGE_NAME}:latest" \\
  --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \\
  --build-arg VCS_REF="$(git rev-parse --short HEAD)" \\
  --build-arg VERSION="\${VERSION}" \\
  .

echo "✓ Build complete"
echo "  Image: \${IMAGE_NAME}:\${VERSION}"
echo "  Size: \$(docker images \${IMAGE_NAME}:\${VERSION} --format "{{.Size}}")"
`;
  }

  /**
   * Generate push.sh script
   */
  generatePush(manifest: OssaAgent): string {
    const agentName = manifest.metadata?.name || 'agent';

    return `#!/bin/bash
# Push Docker image to registry

set -e

IMAGE_NAME="${agentName}"
VERSION=\${VERSION:-latest}
REGISTRY=\${REGISTRY:-docker.io}

if [ -z "\$REGISTRY" ]; then
  echo "Error: REGISTRY environment variable is required"
  exit 1
fi

FULL_IMAGE="\${REGISTRY}/\${IMAGE_NAME}:\${VERSION}"

echo "Tagging image: \${FULL_IMAGE}"
docker tag "\${IMAGE_NAME}:\${VERSION}" "\${FULL_IMAGE}"

echo "Pushing image: \${FULL_IMAGE}"
docker push "\${FULL_IMAGE}"

echo "✓ Push complete"
echo "  Image: \${FULL_IMAGE}"
`;
  }

  /**
   * Generate run.sh script
   */
  generateRun(manifest: OssaAgent, port: number = 3000): string {
    const agentName = manifest.metadata?.name || 'agent';

    return `#!/bin/bash
# Run ${agentName} container locally

set -e

IMAGE_NAME="${agentName}"
CONTAINER_NAME="\${CONTAINER_NAME:-${agentName}}"
PORT=\${PORT:-${port}}

echo "Running container: \${CONTAINER_NAME}"

docker run -d \\
  --name "\${CONTAINER_NAME}" \\
  --restart unless-stopped \\
  -p "\${PORT}:${port}" \\
  --env-file .env \\
  "\${IMAGE_NAME}:latest"

echo "✓ Container started"
echo "  Name: \${CONTAINER_NAME}"
echo "  Port: \${PORT}"
echo ""
echo "View logs: docker logs -f \${CONTAINER_NAME}"
echo "Stop container: docker stop \${CONTAINER_NAME}"
`;
  }
}

export class DockerConfigGenerator {
  /**
   * Generate .dockerignore file
   */
  generateDockerignore(): string {
    return `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage/
*.test.ts
*.spec.ts
**/__tests__/
**/__mocks__/

# Build outputs
dist/
build/
*.tsbuildinfo

# Environment
.env
.env.local
.env.*.local

# Development
.git/
.gitignore
.vscode/
.idea/
*.swp
*.swo
*~

# Documentation
*.md
docs/
examples/

# CI/CD
.github/
.gitlab-ci.yml

# Docker
Dockerfile*
docker-compose*.yml
.dockerignore

# Misc
.DS_Store
Thumbs.db
`;
  }

  /**
   * Generate .env.example file
   */
  generateEnvExample(manifest: OssaAgent): string {
    const spec = manifest.spec as Record<string, unknown>;
    const llm = spec.llm as Record<string, unknown> | undefined;

    return `# Environment Configuration
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Database
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=agent_db
POSTGRES_USER=agent
POSTGRES_PASSWORD=changeme

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# LLM Configuration
LLM_PROVIDER=${llm?.provider || 'anthropic'}
LLM_MODEL=${llm?.model || 'claude-sonnet-3-5'}
LLM_API_KEY=your-api-key-here
LLM_MAX_TOKENS=${llm?.maxTokens || 4000}
LLM_TEMPERATURE=${llm?.temperature || 0.7}

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090

# Security
JWT_SECRET=generate-a-secure-random-secret
API_KEY=your-api-key-here

# OSSA Configuration
OSSA_VERSION=${manifest.apiVersion}
AGENT_NAME=${manifest.metadata?.name || 'agent'}
AGENT_VERSION=${manifest.metadata?.version || '1.0.0'}
`;
  }

  /**
   * Generate nginx.conf
   */
  generateNginxConfig(manifest: OssaAgent, port: number = 3000): string {
    const agentName = manifest.metadata?.name || 'agent';

    return `# Nginx configuration for ${agentName}

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                    '\$status \$body_bytes_sent "\$http_referer" '
                    '"\$http_user_agent" "\$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api_limit:10m rate=10r/s;

    upstream agent_backend {
        least_conn;
        server ${agentName}:${port} max_fails=3 fail_timeout=30;
    }

    server {
        listen 80;
        server_name _;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # Health check endpoint (no rate limit)
        location /health {
            proxy_pass http://agent_backend;
            access_log off;
        }

        # API endpoints
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;

            proxy_pass http://agent_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;

            # Timeouts
            proxy_connect_timeout 60;
            proxy_send_timeout 60;
            proxy_read_timeout 60;
        }

        # Deny access to sensitive files
        location ~ /\\. {
            deny all;
            access_log off;
            log_not_found off;
        }
    }
}
`;
  }
}
