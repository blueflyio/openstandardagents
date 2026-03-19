# Deployment Guide

Complete deployment guide for drupal-contributor.

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 2GB+ available memory
- 10GB+ available disk space

## Production Deployment

### 1. Prepare Environment

```bash
# Clone repository
git clone <repository-url>
cd drupal-contributor

# Copy and configure environment
cp .env.example .env
vim .env
```

**Critical environment variables:**

- `LLM_API_KEY` - Your LLM provider API key (required)
- `POSTGRES_PASSWORD` - Secure database password
- `JWT_SECRET` - Secure random string for JWT signing
- `API_KEY` - API authentication key

### 2. Build Image

```bash
# Set version
export VERSION=1.0.0

# Build
node scripts/build.mjs

# Verify build
docker images drupal-contributor
```

### 3. Deploy with Docker Compose

```bash
# Start production stack
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 4. Verify Deployment

```bash
# Health check
curl http://localhost:3000/health

# Check metrics
curl http://localhost:9090/metrics
```

## Kubernetes Deployment

For Kubernetes, convert docker-compose to K8s manifests:

```bash
# Install kompose
curl -L https://github.com/kubernetes/kompose/releases/download/v1.26.0/kompose-linux-amd64 -o kompose
chmod +x kompose
sudo mv kompose /usr/local/bin/

# Convert
kompose convert -f docker-compose.prod.yml

# Deploy
kubectl apply -f .
```

## Cloud Deployments

### AWS ECS

```bash
# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker tag drupal-contributor:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/drupal-contributor:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/drupal-contributor:latest

# Create task definition and service in ECS
```

### Google Cloud Run

```bash
# Push to GCR
gcloud auth configure-docker
docker tag drupal-contributor:latest gcr.io/<project-id>/drupal-contributor:latest
docker push gcr.io/<project-id>/drupal-contributor:latest

# Deploy
gcloud run deploy drupal-contributor \
  --image gcr.io/<project-id>/drupal-contributor:latest \
  --platform managed \
  --region us-central1 \
  --port 3000
```

### Azure Container Instances

```bash
# Push to ACR
az acr login --name <registry-name>
docker tag drupal-contributor:latest <registry-name>.azurecr.io/drupal-contributor:latest
docker push <registry-name>.azurecr.io/drupal-contributor:latest

# Deploy
az container create \
  --resource-group <resource-group> \
  --name drupal-contributor \
  --image <registry-name>.azurecr.io/drupal-contributor:latest \
  --ports 3000
```

## Scaling

### Horizontal Scaling

```bash
# Scale with docker-compose
docker-compose -f docker-compose.prod.yml up -d --scale drupal-contributor=3

# Or update docker-compose.prod.yml:
services:
  drupal-contributor:
    deploy:
      replicas: 3
```

### Vertical Scaling

Update resource limits in `docker-compose.prod.yml`:

```yaml
services:
  drupal-contributor:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
```

## Monitoring

### Health Checks

```bash
# Container health
docker ps

# Application health
curl http://localhost:3000/health
```

### Logs

```bash
# View logs
docker-compose logs -f

# Specific service
docker-compose logs -f drupal-contributor

# With timestamps
docker-compose logs -f --timestamps
```

### Metrics

Access Prometheus metrics at:
`http://localhost:9090/metrics`

## Backup and Recovery

### Database Backup

```bash
# Backup PostgreSQL
docker-compose exec postgres pg_dump -U agent agent_db > backup.sql

# Restore
docker-compose exec -T postgres psql -U agent agent_db < backup.sql
```

### Volume Backup

```bash
# Backup volumes
docker run --rm \
  -v drupal-contributor_postgres-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres-data.tar.gz /data
```

## Security

### Best Practices

1. **Use secrets management**
   - Don't commit `.env` files
   - Use Docker secrets or external secret managers

2. **Update base images regularly**
   ```bash
   docker pull node:20-alpine
   node scripts/build.mjs
   ```

3. **Scan for vulnerabilities**
   ```bash
   docker scan drupal-contributor:latest
   ```

4. **Enable TLS**
   - Use reverse proxy (nginx) with SSL certificates
   - Configure in nginx/ssl/ directory

### Network Security

```yaml
# Isolate services with custom networks
networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true
```

## Troubleshooting

### Container Exits Immediately

```bash
# Check logs
docker logs drupal-contributor

# Run interactively
docker run -it --rm --entrypoint sh drupal-contributor:latest
```

### Out of Memory

Increase memory limits:
```yaml
deploy:
  resources:
    limits:
      memory: 2G
```

### Database Connection Failed

```bash
# Check database is running
docker-compose exec postgres pg_isready

# Test connection
docker-compose exec drupal-contributor sh
nc -zv postgres 5432
```

## Rollback

```bash
# Stop current version
docker-compose -f docker-compose.prod.yml down

# Deploy previous version
docker-compose -f docker-compose.prod.yml up -d drupal-contributor:previous-version
```

## Support

For issues and questions:
- GitHub Issues: <repository-url>/issues
- Documentation: <docs-url>
