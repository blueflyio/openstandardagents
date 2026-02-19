# Infrastructure Configuration

This directory contains infrastructure-as-code configurations for deployment and orchestration.

## Structure

```
infra/
├── docker-compose.yml        # Docker Compose for local development
├── Dockerfile                 # Main Dockerfile
├── Dockerfile.agent-runner    # Agent runner Dockerfile
└── kubernetes/               # Kubernetes manifests (future)
```

## Docker Compose

The `docker-compose.yml` file defines services for local development:

- **website** - OSSA website (Next.js) on port 3000

### Usage

From project root, specify the path (no symlinks per platform policy):

```bash
docker-compose -f infra/docker-compose.yml up
```

## Related

- **Deployment Templates**: See `src/deployment-templates/` for platform-specific deployment configs
- **Kubernetes**: See `.gitlab/k8s/` for Kubernetes configurations
- **GitLab Infrastructure**: See `.gitlab/infrastructure/` for GitLab-specific infrastructure configs
