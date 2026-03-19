# drupal-contributor

Autonomous Drupal issue contributor. Discovers issues on Drupal.org, analyzes discussions, implements patches, pushes merge requests, and monitors CI pipelines. The first OSSA-native development agent.

**Version:** 1.0.0
**OSSA Version:** ossa/v0.4.7

## Quick Start

### Development

```bash
# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
vim .env

# Start services with docker-compose
docker-compose up
```

The agent will be available at `http://localhost:3000`

### Production

```bash
# Build production image
node scripts/build.mjs

# Run with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

## Docker Commands

### Build

```bash
# Build production image
docker build -t drupal-contributor:latest .

# Build development image
docker build -f Dockerfile.dev -t drupal-contributor:dev .

# Or use the Node helper
node scripts/build.mjs
```

### Run

```bash
# Run container
node scripts/run.mjs

# Or manually
docker run -d \
  --name drupal-contributor \
  -p 3000:3000 \
  --env-file .env \
  drupal-contributor:latest
```

### Push to Registry

```bash
# Set registry
export REGISTRY=docker.io/your-username

# Push
node scripts/push.mjs
```

## Configuration

Environment variables are configured in `.env`. See `.env.example` for all available options.

Key configuration:

- `NODE_ENV` - Environment (production/development)
- `PORT` - Server port (default: 3000)
- `LOG_LEVEL` - Logging level (debug/info/warn/error)
- `POSTGRES_HOST` - Database host
- `REDIS_HOST` - Redis host
- `LLM_API_KEY` - LLM provider API key

## Health Checks

The container includes built-in health checks:

```bash
# Check container health
docker ps

# Manual health check
curl http://localhost:3000/health
```

## Logs

```bash
# View logs
docker logs -f drupal-contributor

# With docker-compose
docker-compose logs -f
```

## Architecture

This deployment uses:

- **Multi-stage Dockerfile** - Optimized build and runtime stages
- **Non-root user** - Security best practice
- **Health checks** - Automatic container health monitoring
- **Signal handling** - Graceful shutdown with dumb-init
- **Resource limits** - CPU and memory constraints

## Services

- **drupal-contributor** - Main agent application (port 3000)
- **postgres** - PostgreSQL database (port 5432)
- **redis** - Redis cache (port 6379)

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Development

```bash
# Start in development mode with hot-reload
docker-compose up

# Run tests
docker-compose exec drupal-contributor npm test

# Access shell
docker-compose exec drupal-contributor sh
```

## Troubleshooting

### Container won't start

Check logs:
```bash
docker logs drupal-contributor
```

### Health check failing

Test health endpoint manually:
```bash
curl -v http://localhost:3000/health
```

### Database connection issues

Verify PostgreSQL is running and accessible:
```bash
docker-compose exec postgres pg_isready
```

## License

See LICENSE file for details.
