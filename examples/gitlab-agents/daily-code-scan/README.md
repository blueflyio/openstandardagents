# daily-code-scan

Daily comprehensive code quality scan. Creates issues for regressions, tracks metrics over time, and identifies technical debt. Runs at 2am daily.


## Generated from OSSA Manifest

This agent was auto-generated from an OSSA v0.4.1 manifest using:

```bash
ossa export agents/gitlab/daily-code-scan.ossa.yaml --platform gitlab-agent --output ./daily-code-scan
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
docker build -t daily-code-scan .
docker run -p 9090:9090 --env-file .env daily-code-scan
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
