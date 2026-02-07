/**
 * Docker Exporter Service
 *
 * Exports OSSA manifests to production-ready Docker deployments with:
 * - Multi-stage Dockerfile (build + runtime)
 * - Dockerfile.dev for development
 * - docker-compose.yml with all services
 * - docker-compose.prod.yml for production
 * - Shell scripts (entrypoint, healthcheck, build, push, run)
 * - Configuration files (.dockerignore, .env.example, nginx.conf)
 * - Complete documentation (README.md, DEPLOYMENT.md)
 *
 * SOLID: Single Responsibility - Docker export orchestration
 * DRY: Reuses generators for each component
 */

import type { OssaAgent } from '../../types/index.js';
import type {
  ExportResult,
  ExportFile,
} from '../base/adapter.interface.js';
import type { DockerExportOptions } from './types.js';
import {
  DockerfileGenerator,
  DockerComposeGenerator,
  DockerScriptsGenerator,
  DockerConfigGenerator,
} from './generators.js';

export class DockerExporter {
  private dockerfileGenerator: DockerfileGenerator;
  private composeGenerator: DockerComposeGenerator;
  private scriptsGenerator: DockerScriptsGenerator;
  private configGenerator: DockerConfigGenerator;

  constructor() {
    this.dockerfileGenerator = new DockerfileGenerator();
    this.composeGenerator = new DockerComposeGenerator();
    this.scriptsGenerator = new DockerScriptsGenerator();
    this.configGenerator = new DockerConfigGenerator();
  }

  /**
   * Export OSSA manifest to complete Docker deployment package
   */
  async export(
    manifest: OssaAgent,
    options: DockerExportOptions = {}
  ): Promise<ExportResult> {
    const startTime = Date.now();
    const files: ExportFile[] = [];
    const warnings: string[] = [];

    try {
      const agentName = manifest.metadata?.name || 'agent';
      const port = options.exposePort || 3000;

      // 1. Generate production Dockerfile
      files.push({
        path: 'Dockerfile',
        content: this.dockerfileGenerator.generate(manifest, options),
        type: 'config',
        language: 'dockerfile',
      });

      // 2. Generate development Dockerfile
      if (options.includeDev !== false) {
        files.push({
          path: 'Dockerfile.dev',
          content: this.dockerfileGenerator.generateDev(manifest, options),
          type: 'config',
          language: 'dockerfile',
        });
      }

      // 3. Generate docker-compose.yml (development)
      files.push({
        path: 'docker-compose.yml',
        content: this.composeGenerator.generate([manifest], options),
        type: 'config',
        language: 'yaml',
      });

      // 4. Generate docker-compose.prod.yml (production)
      if (options.includeComposeProd !== false) {
        files.push({
          path: 'docker-compose.prod.yml',
          content: this.composeGenerator.generateProduction([manifest], options),
          type: 'config',
          language: 'yaml',
        });
      }

      // 5. Generate shell scripts
      files.push({
        path: 'scripts/entrypoint.sh',
        content: this.scriptsGenerator.generateEntrypoint(manifest),
        type: 'other',
        language: 'shell',
      });

      files.push({
        path: 'scripts/healthcheck.sh',
        content: this.scriptsGenerator.generateHealthcheck(manifest, port),
        type: 'other',
        language: 'shell',
      });

      files.push({
        path: 'scripts/build.sh',
        content: this.scriptsGenerator.generateBuild(manifest),
        type: 'other',
        language: 'shell',
      });

      files.push({
        path: 'scripts/push.sh',
        content: this.scriptsGenerator.generatePush(manifest),
        type: 'other',
        language: 'shell',
      });

      files.push({
        path: 'scripts/run.sh',
        content: this.scriptsGenerator.generateRun(manifest, port),
        type: 'other',
        language: 'shell',
      });

      // 6. Generate configuration files
      files.push({
        path: '.dockerignore',
        content: this.configGenerator.generateDockerignore(),
        type: 'config',
      });

      files.push({
        path: '.env.example',
        content: this.configGenerator.generateEnvExample(manifest),
        type: 'config',
      });

      // 7. Generate nginx configuration (optional)
      if (options.includeNginx) {
        files.push({
          path: 'nginx/nginx.conf',
          content: this.configGenerator.generateNginxConfig(manifest, port),
          type: 'config',
          language: 'nginx',
        });
      }

      // 8. Generate documentation
      files.push({
        path: 'README.md',
        content: this.generateReadme(manifest, options),
        type: 'documentation',
        language: 'markdown',
      });

      files.push({
        path: 'DEPLOYMENT.md',
        content: this.generateDeploymentGuide(manifest, options),
        type: 'documentation',
        language: 'markdown',
      });

      const duration = Date.now() - startTime;

      return {
        platform: 'docker',
        success: true,
        files,
        metadata: {
          duration,
          version: manifest.apiVersion,
          warnings,
          agentName,
          port,
          includeNginx: options.includeNginx || false,
          includeDev: options.includeDev !== false,
          includeComposeProd: options.includeComposeProd !== false,
        },
      };
    } catch (error) {
      return {
        platform: 'docker',
        success: false,
        files: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate README.md
   */
  private generateReadme(
    manifest: OssaAgent,
    options: DockerExportOptions
  ): string {
    const agentName = manifest.metadata?.name || 'agent';
    const version = manifest.metadata?.version || '1.0.0';
    const description = manifest.metadata?.description || 'OSSA Agent';
    const port = options.exposePort || 3000;

    return `# ${agentName}

${description}

**Version:** ${version}
**OSSA Version:** ${manifest.apiVersion}

## Quick Start

### Development

\`\`\`bash
# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
vim .env

# Start services with docker-compose
docker-compose up
\`\`\`

The agent will be available at \`http://localhost:${port}\`

### Production

\`\`\`bash
# Build production image
./scripts/build.sh

# Run with docker-compose
docker-compose -f docker-compose.prod.yml up -d
\`\`\`

## Docker Commands

### Build

\`\`\`bash
# Build production image
docker build -t ${agentName}:latest .

# Build development image
docker build -f Dockerfile.dev -t ${agentName}:dev .

# Or use the script
./scripts/build.sh
\`\`\`

### Run

\`\`\`bash
# Run container
./scripts/run.sh

# Or manually
docker run -d \\
  --name ${agentName} \\
  -p ${port}:${port} \\
  --env-file .env \\
  ${agentName}:latest
\`\`\`

### Push to Registry

\`\`\`bash
# Set registry
export REGISTRY=docker.io/your-username

# Push
./scripts/push.sh
\`\`\`

## Configuration

Environment variables are configured in \`.env\`. See \`.env.example\` for all available options.

Key configuration:

- \`NODE_ENV\` - Environment (production/development)
- \`PORT\` - Server port (default: ${port})
- \`LOG_LEVEL\` - Logging level (debug/info/warn/error)
- \`POSTGRES_HOST\` - Database host
- \`REDIS_HOST\` - Redis host
- \`LLM_API_KEY\` - LLM provider API key

## Health Checks

The container includes built-in health checks:

\`\`\`bash
# Check container health
docker ps

# Manual health check
curl http://localhost:${port}/health
\`\`\`

## Logs

\`\`\`bash
# View logs
docker logs -f ${agentName}

# With docker-compose
docker-compose logs -f
\`\`\`

## Architecture

This deployment uses:

- **Multi-stage Dockerfile** - Optimized build and runtime stages
- **Non-root user** - Security best practice
- **Health checks** - Automatic container health monitoring
- **Signal handling** - Graceful shutdown with dumb-init
- **Resource limits** - CPU and memory constraints${options.includeNginx ? '\n- **Nginx reverse proxy** - Load balancing and SSL termination' : ''}

## Services

- **${agentName}** - Main agent application (port ${port})
- **postgres** - PostgreSQL database (port 5432)
- **redis** - Redis cache (port 6379)${options.includeNginx ? '\n- **nginx** - Reverse proxy (ports 80, 443)' : ''}

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Development

\`\`\`bash
# Start in development mode with hot-reload
docker-compose up

# Run tests
docker-compose exec ${agentName} npm test

# Access shell
docker-compose exec ${agentName} sh
\`\`\`

## Troubleshooting

### Container won't start

Check logs:
\`\`\`bash
docker logs ${agentName}
\`\`\`

### Health check failing

Test health endpoint manually:
\`\`\`bash
curl -v http://localhost:${port}/health
\`\`\`

### Database connection issues

Verify PostgreSQL is running and accessible:
\`\`\`bash
docker-compose exec postgres pg_isready
\`\`\`

## License

See LICENSE file for details.
`;
  }

  /**
   * Generate DEPLOYMENT.md
   */
  private generateDeploymentGuide(
    manifest: OssaAgent,
    options: DockerExportOptions
  ): string {
    const agentName = manifest.metadata?.name || 'agent';
    const port = options.exposePort || 3000;

    return `# Deployment Guide

Complete deployment guide for ${agentName}.

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 2GB+ available memory
- 10GB+ available disk space

## Production Deployment

### 1. Prepare Environment

\`\`\`bash
# Clone repository
git clone <repository-url>
cd ${agentName}

# Copy and configure environment
cp .env.example .env
vim .env
\`\`\`

**Critical environment variables:**

- \`LLM_API_KEY\` - Your LLM provider API key (required)
- \`POSTGRES_PASSWORD\` - Secure database password
- \`JWT_SECRET\` - Secure random string for JWT signing
- \`API_KEY\` - API authentication key

### 2. Build Image

\`\`\`bash
# Set version
export VERSION=1.0.0

# Build
./scripts/build.sh

# Verify build
docker images ${agentName}
\`\`\`

### 3. Deploy with Docker Compose

\`\`\`bash
# Start production stack
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
\`\`\`

### 4. Verify Deployment

\`\`\`bash
# Health check
curl http://localhost:${port}/health

# Check metrics
curl http://localhost:9090/metrics
\`\`\`

## Kubernetes Deployment

For Kubernetes, convert docker-compose to K8s manifests:

\`\`\`bash
# Install kompose
curl -L https://github.com/kubernetes/kompose/releases/download/v1.26.0/kompose-linux-amd64 -o kompose
chmod +x kompose
sudo mv kompose /usr/local/bin/

# Convert
kompose convert -f docker-compose.prod.yml

# Deploy
kubectl apply -f .
\`\`\`

## Cloud Deployments

### AWS ECS

\`\`\`bash
# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker tag ${agentName}:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/${agentName}:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/${agentName}:latest

# Create task definition and service in ECS
\`\`\`

### Google Cloud Run

\`\`\`bash
# Push to GCR
gcloud auth configure-docker
docker tag ${agentName}:latest gcr.io/<project-id>/${agentName}:latest
docker push gcr.io/<project-id>/${agentName}:latest

# Deploy
gcloud run deploy ${agentName} \\
  --image gcr.io/<project-id>/${agentName}:latest \\
  --platform managed \\
  --region us-central1 \\
  --port ${port}
\`\`\`

### Azure Container Instances

\`\`\`bash
# Push to ACR
az acr login --name <registry-name>
docker tag ${agentName}:latest <registry-name>.azurecr.io/${agentName}:latest
docker push <registry-name>.azurecr.io/${agentName}:latest

# Deploy
az container create \\
  --resource-group <resource-group> \\
  --name ${agentName} \\
  --image <registry-name>.azurecr.io/${agentName}:latest \\
  --ports ${port}
\`\`\`

## Scaling

### Horizontal Scaling

\`\`\`bash
# Scale with docker-compose
docker-compose -f docker-compose.prod.yml up -d --scale ${agentName}=3

# Or update docker-compose.prod.yml:
services:
  ${agentName}:
    deploy:
      replicas: 3
\`\`\`

### Vertical Scaling

Update resource limits in \`docker-compose.prod.yml\`:

\`\`\`yaml
services:
  ${agentName}:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
\`\`\`

## Monitoring

### Health Checks

\`\`\`bash
# Container health
docker ps

# Application health
curl http://localhost:${port}/health
\`\`\`

### Logs

\`\`\`bash
# View logs
docker-compose logs -f

# Specific service
docker-compose logs -f ${agentName}

# With timestamps
docker-compose logs -f --timestamps
\`\`\`

### Metrics

Access Prometheus metrics at:
\`http://localhost:9090/metrics\`

## Backup and Recovery

### Database Backup

\`\`\`bash
# Backup PostgreSQL
docker-compose exec postgres pg_dump -U agent agent_db > backup.sql

# Restore
docker-compose exec -T postgres psql -U agent agent_db < backup.sql
\`\`\`

### Volume Backup

\`\`\`bash
# Backup volumes
docker run --rm \\
  -v ${agentName}_postgres-data:/data \\
  -v $(pwd):/backup \\
  alpine tar czf /backup/postgres-data.tar.gz /data
\`\`\`

## Security

### Best Practices

1. **Use secrets management**
   - Don't commit \`.env\` files
   - Use Docker secrets or external secret managers

2. **Update base images regularly**
   \`\`\`bash
   docker pull node:20-alpine
   ./scripts/build.sh
   \`\`\`

3. **Scan for vulnerabilities**
   \`\`\`bash
   docker scan ${agentName}:latest
   \`\`\`

4. **Enable TLS**
   - Use reverse proxy (nginx) with SSL certificates
   - Configure in nginx/ssl/ directory

### Network Security

\`\`\`yaml
# Isolate services with custom networks
networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true
\`\`\`

## Troubleshooting

### Container Exits Immediately

\`\`\`bash
# Check logs
docker logs ${agentName}

# Run interactively
docker run -it --rm --entrypoint sh ${agentName}:latest
\`\`\`

### Out of Memory

Increase memory limits:
\`\`\`yaml
deploy:
  resources:
    limits:
      memory: 2G
\`\`\`

### Database Connection Failed

\`\`\`bash
# Check database is running
docker-compose exec postgres pg_isready

# Test connection
docker-compose exec ${agentName} sh
nc -zv postgres 5432
\`\`\`

## Rollback

\`\`\`bash
# Stop current version
docker-compose -f docker-compose.prod.yml down

# Deploy previous version
docker-compose -f docker-compose.prod.yml up -d ${agentName}:previous-version
\`\`\`

## Support

For issues and questions:
- GitHub Issues: <repository-url>/issues
- Documentation: <docs-url>
`;
  }
}
