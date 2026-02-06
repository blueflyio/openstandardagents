# OSSA Bridge Server - Quick Start Guide

Get the OSSA Bridge Server running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- npm or pnpm package manager
- (Optional) Docker for containerized deployment

## Installation

```bash
# Navigate to bridge-server directory
cd bridge-server

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit configuration (optional)
vim .env
```

## Configuration

Edit `.env` to configure the server:

```bash
# Server settings
BRIDGE_PORT=9090
BRIDGE_HOST=0.0.0.0
NODE_ENV=development

# OSSA settings
OSSA_REGISTRY_PATH=./agents

# OpenTelemetry (optional - leave blank to disable)
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

## Run Development Server

```bash
# Start with hot reload
npm run dev
```

The server will start at `http://localhost:9090`.

You should see output like:

```
============================================================
OSSA Bridge Server
============================================================
Server running at http://0.0.0.0:9090
Environment: development
Tracing: disabled
Registry: ./agents
============================================================
Endpoints:
  GET  /health              - Health check
  GET  /api/v1/agents       - List agents
  GET  /api/v1/agents/:id   - Get agent
  POST /api/v1/execute      - Execute agent
============================================================
```

## Test the Server

### Health Check

```bash
curl http://localhost:9090/health
```

Expected response:

```json
{
  "status": "ok",
  "version": "0.1.0",
  "uptime": 12345,
  "timestamp": "2026-02-04T12:00:00Z",
  "services": {
    "agentRuntime": "ok",
    "tracing": "error"
  }
}
```

### List Agents

```bash
curl http://localhost:9090/api/v1/agents
```

### Execute Agent

```bash
curl -X POST http://localhost:9090/api/v1/execute \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "example-agent",
    "input": {
      "message": "Hello OSSA!"
    },
    "timeout": 5000
  }'
```

### Run All Tests

Use the provided test script:

```bash
# Make executable (first time only)
chmod +x test-api.sh

# Run tests
./test-api.sh
```

## Production Build

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## Docker Deployment

### Build Image

```bash
docker build -t ossa-bridge-server .
```

### Run Container

```bash
docker run -p 9090:9090 \
  -e OSSA_REGISTRY_PATH=/agents \
  -v $(pwd)/agents:/agents:ro \
  ossa-bridge-server
```

### Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f bridge-server

# Stop services
docker-compose down
```

## Next Steps

### 1. Connect to agent-protocol

The bridge server currently uses placeholder agent execution. To connect to real agents:

1. Deploy `agent-protocol` service
2. Update `agent-runtime.service.ts` with agent-protocol integration
3. Set `AGENT_PROTOCOL_URL` environment variable

See [INTEGRATION.md](./INTEGRATION.md) for detailed instructions.

### 2. Enable Tracing

To enable OpenTelemetry tracing:

1. Deploy Grafana Tempo or Jaeger
2. Set `OTEL_EXPORTER_OTLP_ENDPOINT` in `.env`
3. Restart bridge server

Example with Docker:

```bash
# Start Tempo
docker run -d -p 4318:4318 -p 3200:3200 grafana/tempo

# Update .env
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318

# Restart bridge server
npm run dev
```

View traces at: `http://localhost:3200`

### 3. Integrate with Drupal

Install the Drupal OSSA module and configure it to use the bridge server:

```yaml
# Drupal settings
ai_agents_ossa:
  bridge_url: 'http://localhost:9090'
  default_timeout: 300000
```

See [INTEGRATION.md](./INTEGRATION.md#drupal-integration) for PHP client code.

### 4. Production Deployment

For production deployment:

1. Review security settings in [INTEGRATION.md](./INTEGRATION.md#security-considerations)
2. Set up Kubernetes or Docker Compose deployment
3. Configure HTTPS/TLS termination
4. Enable monitoring and alerting
5. Set up CI/CD pipeline

See [INTEGRATION.md](./INTEGRATION.md#production-deployment) for examples.

## Troubleshooting

### Port already in use

```bash
# Change port in .env
BRIDGE_PORT=9091

# Or kill process using port 9090
lsof -ti:9090 | xargs kill
```

### Module not found errors

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors

```bash
# Check types
npm run type-check

# Rebuild
npm run build
```

### Agent execution fails

The default implementation uses placeholder agents. To execute real agents:

1. Check `agent-protocol` is running
2. Verify `AGENT_PROTOCOL_URL` environment variable
3. Review logs for errors

## Project Structure

```
bridge-server/
├── src/
│   ├── server.ts                    # Express app & startup
│   ├── routes/
│   │   ├── execute.ts              # POST /api/v1/execute
│   │   ├── agents.ts               # GET /api/v1/agents
│   │   └── health.ts               # GET /health
│   ├── services/
│   │   ├── agent-runtime.service.ts # Agent execution
│   │   └── tracing.service.ts       # OpenTelemetry
│   └── types/
│       └── index.ts                 # TypeScript types
├── package.json
├── tsconfig.json
├── Dockerfile
├── docker-compose.yml
├── test-api.sh                      # API test script
├── README.md                        # Full documentation
├── INTEGRATION.md                   # Integration guide
└── QUICKSTART.md                    # This file
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BRIDGE_PORT` | `9090` | HTTP server port |
| `BRIDGE_HOST` | `0.0.0.0` | Server bind address |
| `NODE_ENV` | `development` | Environment mode |
| `OSSA_REGISTRY_PATH` | `./agents` | Path to agent registry |
| `AGENT_PROTOCOL_URL` | - | agent-protocol service URL |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | - | OpenTelemetry OTLP endpoint |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/v1/agents` | List all agents |
| GET | `/api/v1/agents/:id` | Get agent details |
| POST | `/api/v1/execute` | Execute agent |

## Resources

- [README.md](./README.md) - Complete documentation
- [INTEGRATION.md](./INTEGRATION.md) - Integration guides
- [OpenAPI Spec](https://gitlab.com/blueflyio/openstandardagents) - API specification
- [GitLab Issues](https://gitlab.com/blueflyio/openstandardagents/-/issues) - Bug reports

## Support

For questions or issues:

1. Check [INTEGRATION.md](./INTEGRATION.md#troubleshooting) troubleshooting section
2. Review [GitLab Issues](https://gitlab.com/blueflyio/openstandardagents/-/issues)
3. Contact BlueFly.io platform team

---

Happy agent orchestration!
