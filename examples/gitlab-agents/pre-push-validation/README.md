# pre-push-validation

Pre-push quality gate that validates production-grade score before pushing. Runs comprehensive audit and blocks push if score is below threshold.


## Generated from OSSA Manifest

This agent was auto-generated from an OSSA v0.4.1 manifest using:

```bash
ossa export agents/gitlab/pre-push-validation.ossa.yaml --platform gitlab-agent --output ./pre-push-validation
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
docker build -t pre-push-validation .
docker run -p 9090:9090 --env-file .env pre-push-validation
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
