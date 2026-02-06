# pipeline-auto-fix

Automatically analyzes failed pipelines, identifies root causes, generates fixes, and creates MRs with solutions. Prevents pipelines from failing for days by auto-remediation.


## Generated from OSSA Manifest

This agent was auto-generated from an OSSA v0.4.1 manifest using:

```bash
ossa export agents/gitlab/pipeline-auto-fix.ossa.yaml --platform gitlab-agent --output ./pipeline-auto-fix
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
docker build -t pipeline-auto-fix .
docker run -p 9090:9090 --env-file .env pipeline-auto-fix
```

### Kubernetes

Deploy to Kubernetes:

```bash
kubectl apply -f k8s/deployment.yaml
```

## GitLab Webhook Configuration

Configure the webhook in your GitLab project:

1. Go to **Settings** → **Webhooks**
2. Add webhook URL: `http://api.blueflyagents.com/webhook/pipeline-auto-fix`
3. Set secret token (from .env WEBHOOK_SECRET)
4. Select events: Pipelines
5. Save webhook

Test the webhook:

```bash
curl -X POST http://localhost:9090/webhook/pipeline-auto-fix \
  -H "Content-Type: application/json" \
  -H "X-Gitlab-Token: your-secret" \
  -d @test-event.json
```


## Health Checks

- Health: `GET /health`
- Ready: `GET /ready`

## Monitoring

The agent exposes Prometheus metrics and OpenTelemetry traces.

## License

MIT
