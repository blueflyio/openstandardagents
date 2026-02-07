# pre-commit-quality-check

Pre-commit quality gate that blocks commits with production-grade issues. Runs locally via git hooks to catch problems before they reach CI.


## Generated from OSSA Manifest

This agent was auto-generated from an OSSA v0.4.1 manifest using:

```bash
ossa export agents/gitlab/pre-commit-quality-check.ossa.yaml --platform gitlab-agent --output ./pre-commit-quality-check
```

## Installation

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

3. Build the agent:

```bash
npm run build
```

4. Run the agent:

```bash
npm start
```

## Development

Run in development mode with hot reload:

```bash
npm run dev
```

## Deployment

### Docker

Build and run with Docker:

```bash
docker build -t pre-commit-quality-check .
docker run -p 9090:9090 --env-file .env pre-commit-quality-check
```

### Kubernetes

Deploy to Kubernetes:

```bash
kubectl apply -f k8s/deployment.yaml
```



## Health Checks

- Health: `GET /health`
- Ready: `GET /ready`

## Monitoring

The agent exposes Prometheus metrics and OpenTelemetry traces.

## License

MIT
