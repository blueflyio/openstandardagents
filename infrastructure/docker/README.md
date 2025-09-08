# OSSA v0.1.8 Docker Configuration

This directory contains comprehensive Docker configurations for the complete OSSA (Open Standards for Scalable Agents) v0.1.8 system, including all agent types, gateway service, and supporting infrastructure.

## Quick Start

```bash
# Start the complete OSSA system
./docker-up.sh complete

# Start development environment
./docker-up.sh development

# Start minimal system (gateway + databases)
./docker-up.sh minimal

# Stop all services
./docker-up.sh stop
```

## Architecture Overview

### Core Services
- **Gateway Service** (port 3000): Main API gateway and routing
- **Coordination Service** (port 3010): Agent coordination and workflow management
- **Discovery Service** (port 3011): Agent discovery and registration
- **Orchestration Service** (port 3012): Workflow execution engine
- **Monitoring Service** (port 3013): System monitoring and metrics

### Agent Types
- **Task Agent** (port 3001): General task processing
- **Communication Agent** (port 3002): Inter-agent messaging and protocol translation
- **MCP Agent** (port 3003): Model Context Protocol bridge
- **Data Agent** (port 3007): Data processing and transformation
- **Analytics Agent** (port 3008): Statistical analysis and reporting
- **Security Agent** (port 3009): Authentication, encryption, and compliance

### Infrastructure
- **PostgreSQL** (port 5432): Primary database
- **Redis** (port 6379): Caching and message broker
- **Qdrant** (ports 6333/6334): Vector database for semantic search
- **Prometheus** (port 9091): Metrics collection
- **Grafana** (port 3080): Monitoring dashboards
- **AlertManager** (port 9093): Alert notifications

## Configuration Files

### Docker Compose Files

| File | Purpose | Usage |
|------|---------|-------|
| `docker-compose.yml` | Base configuration with core services | Production base |
| `docker-compose.complete.yml` | All services and agents | Full system deployment |
| `docker-compose.agents.yml` | Specialized agent services only | Agent-focused deployment |
| `docker-compose.development.yml` | Development overrides | Development environment |
| `docker-compose.production.yml` | Production optimizations | Production deployment |
| `docker-compose.phase3.yml` | Phase 3 scaling configuration | High-scale marketplace |

### Dockerfiles

| File | Service | Description |
|------|---------|-------------|
| `Dockerfile.gateway` | Gateway Service | Main API gateway |
| `Dockerfile.task-agent` | Task Agent | General task processing |
| `Dockerfile.comm-agent` | Communication Agent | Inter-agent messaging |
| `Dockerfile.mcp-agent` | MCP Agent | MCP protocol bridge |
| `Dockerfile.data-agent` | Data Agent | Data processing |
| `Dockerfile.analytics-agent` | Analytics Agent | Analytics and reporting |
| `Dockerfile.security-agent` | Security Agent | Security services |
| `Dockerfile.coordination` | Coordination Service | Agent coordination |
| `Dockerfile.discovery` | Discovery Service | Service discovery |
| `Dockerfile.orchestration` | Orchestration Service | Workflow execution |
| `Dockerfile.monitoring` | Monitoring Service | System monitoring |

## Deployment Modes

### 1. Minimal Mode
Start core services only for development or testing.
```bash
./docker-up.sh minimal
```
**Includes**: Gateway, PostgreSQL, Redis, Qdrant

### 2. Standard Mode
Start core services with basic agents.
```bash
./docker-up.sh standard
```
**Includes**: All minimal services + Task/Communication/MCP agents + Infrastructure services

### 3. Complete Mode
Start all services and agents for full functionality.
```bash
./docker-up.sh complete
```
**Includes**: All services, all agent types, full monitoring stack

### 4. Development Mode
Enhanced development environment with debugging tools.
```bash
./docker-up.sh development
```
**Includes**: All standard services + Redis Commander + pgAdmin + Swagger UI + Debug ports

### 5. Production Mode
Optimized configuration for production deployment.
```bash
./docker-up.sh production
```
**Includes**: All services with production optimizations + Nginx reverse proxy

### 6. Agents Only
Start specialized agent services without core infrastructure.
```bash
./docker-up.sh agents
```
**Includes**: Task, Communication, MCP, Data, Analytics, Security agents

### 7. Monitoring Only
Start monitoring stack for existing OSSA deployment.
```bash
./docker-up.sh monitoring
```
**Includes**: Prometheus, Grafana, AlertManager, Node Exporter

## Environment Configuration

### Environment Variables
Copy `.env.example` to `.env` and customize:

```bash
cp .env.example .env
```

Key variables:
- `NODE_ENV`: Environment mode (development/production)
- `OSSA_VERSION`: OSSA version tag
- `POSTGRES_PASSWORD`: Database password
- `REDIS_URL`: Redis connection string
- `QDRANT_URL`: Qdrant endpoint

### Service Ports

| Service | Port | Protocol | Description |
|---------|------|----------|-------------|
| Gateway | 3000 | HTTP | Main API gateway |
| Task Agent | 3001 | HTTP | Task processing |
| Communication Agent | 3002 | HTTP | Messaging API |
| Communication WebSocket | 3102 | WebSocket | Real-time messaging |
| MCP Agent | 3003 | HTTP | MCP bridge |
| Data Agent | 3007 | HTTP | Data processing |
| Analytics Agent | 3008 | HTTP | Analytics |
| Security Agent | 3009 | HTTP | Security services |
| Coordination | 3010 | HTTP | Agent coordination |
| Discovery | 3011 | HTTP | Service discovery |
| Orchestration | 3012 | HTTP | Workflow execution |
| Monitoring | 3013 | HTTP | System monitoring |
| PostgreSQL | 5432 | TCP | Database |
| Redis | 6379 | TCP | Cache/Message broker |
| Qdrant HTTP | 6333 | HTTP | Vector database |
| Qdrant gRPC | 6334 | gRPC | Vector database |
| Grafana | 3080 | HTTP | Dashboards |
| Prometheus | 9091 | HTTP | Metrics |
| AlertManager | 9093 | HTTP | Alerts |

## Management Commands

### Start Services
```bash
# Quick start with different configurations
./docker-up.sh minimal        # Core services only
./docker-up.sh standard       # Core + basic agents
./docker-up.sh complete       # All services
./docker-up.sh development    # Dev environment
./docker-up.sh production     # Production mode
./docker-up.sh agents         # Agents only
./docker-up.sh monitoring     # Monitoring stack
```

### Management Operations
```bash
./docker-up.sh status         # Show service status
./docker-up.sh logs           # Show all logs
./docker-up.sh logs gateway   # Show specific service logs
./docker-up.sh build          # Build all images
./docker-up.sh pull           # Pull latest base images
./docker-up.sh stop           # Stop all services
./docker-up.sh clean          # Remove all containers and volumes
```

### Direct Docker Compose Usage
```bash
# Start specific configuration
docker-compose -f docker-compose.complete.yml up -d

# Start with overrides
docker-compose -f docker-compose.yml -f docker-compose.development.yml up -d

# Scale specific services
docker-compose -f docker-compose.yml up -d --scale ossa-task-agent=3

# View logs
docker-compose logs -f ossa-gateway

# Stop services
docker-compose down
```

## Health Checks and Monitoring

### Service Health Endpoints
All services provide health endpoints:
```bash
curl http://localhost:3000/health   # Gateway
curl http://localhost:3001/health   # Task Agent
curl http://localhost:3010/health   # Coordination
# ... etc
```

### Monitoring Dashboards
- **Grafana**: http://localhost:3080 (admin/ossa-monitor-2025)
- **Prometheus**: http://localhost:9091
- **AlertManager**: http://localhost:9093

### Development Tools (Development Mode Only)
- **Redis Commander**: http://localhost:8081
- **pgAdmin**: http://localhost:5050 (admin@ossa.dev/ossa-dev-2025)
- **Swagger UI**: http://localhost:8080
- **Node.js Debugger**: Ports 9229-9235

## Volume Management

### Persistent Volumes
- `qdrant-data`: Vector database storage
- `postgres-data`: PostgreSQL data
- `redis-data`: Redis persistence
- `prometheus-data`: Metrics storage
- `grafana-data`: Dashboard configurations
- `alertmanager-data`: Alert configurations

### Backup and Restore
```bash
# Backup volumes
docker run --rm -v ossa_postgres-data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz -C /data .

# Restore volumes
docker run --rm -v ossa_postgres-data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres-backup.tar.gz -C /data
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   - Check if ports are already in use: `lsof -i :3000`
   - Modify port mappings in docker-compose files

2. **Memory Issues**
   - Ensure sufficient Docker memory allocation (8GB+ recommended)
   - Reduce service replicas in production mode

3. **Database Connection Issues**
   - Verify PostgreSQL is healthy: `docker-compose logs postgres`
   - Check connection string in `.env` file

4. **Service Dependencies**
   - Services may take time to start in dependency order
   - Use `./docker-up.sh status` to check readiness

### Debug Mode
Enable debug logging:
```bash
# Set debug environment
export DEBUG=ossa:*

# Start with debug output
./docker-up.sh development
```

### Log Analysis
```bash
# View logs for all services
./docker-up.sh logs

# Follow logs for specific service
docker-compose logs -f ossa-gateway

# Search logs
docker-compose logs | grep ERROR
```

## Security Considerations

### Development Environment
- Default passwords are used (change for production)
- Services exposed on all interfaces (0.0.0.0)
- Debug ports enabled
- Administrative tools accessible

### Production Environment
- Strong passwords required
- SSL/TLS termination via Nginx
- Rate limiting enabled
- Access controls enforced
- Audit logging activated

### Secrets Management
```bash
# Use Docker secrets for production
echo "secure_password" | docker secret create postgres_password -

# Reference in compose file
secrets:
  - postgres_password
```

## Performance Optimization

### Resource Limits
Services include resource limits:
```yaml
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '0.5'
```

### Scaling
```bash
# Scale specific services
docker-compose up -d --scale ossa-task-agent=3
docker-compose up -d --scale ossa-comm-agent=2
```

### Database Tuning
PostgreSQL includes production optimizations:
- Increased connection limits
- Optimized memory settings
- Performance-tuned parameters

## API Documentation

### Gateway API
The gateway provides OpenAPI documentation:
- **Swagger UI**: http://localhost:8080 (development mode)
- **OpenAPI Spec**: http://localhost:3000/openapi.json

### Agent APIs
Each agent provides capability information:
```bash
curl http://localhost:3001/capabilities   # Task Agent
curl http://localhost:3002/capabilities   # Communication Agent
curl http://localhost:3003/capabilities   # MCP Agent
```

## Contributing

### Development Setup
1. Fork the repository
2. Start development environment: `./docker-up.sh development`
3. Make changes to service code
4. Test with: `./docker-up.sh build && ./docker-up.sh development`
5. Submit pull request

### Adding New Agents
1. Create new Dockerfile in `infrastructure/docker/`
2. Add service to appropriate compose files
3. Update port mappings and documentation
4. Test with existing services

### Custom Configurations
Create custom compose files for specific deployments:
```bash
# Custom configuration
docker-compose -f docker-compose.yml -f docker-compose.custom.yml up -d
```

## License

This Docker configuration is part of the OSSA project and is licensed under the Apache 2.0 License.