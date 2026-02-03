# DevOps Agent

Infrastructure management and deployment automation agent.

## Features

- System health monitoring
- Automated deployments (rolling, blue-green, canary)
- Rollback management
- Service scaling
- Log analysis
- Incident response

## Quick Start

```bash
export ANTHROPIC_API_KEY=sk-ant-...
docker-compose up -d

curl -X POST http://localhost:8085/v1/deploy \
  -d '{"service": "api", "version": "v1.2.0", "environment": "staging"}'
```

## Safety Features

- Production environment protection
- Deployment window restrictions
- Change approval workflows
- Automatic validation

## Export to Anthropic SDK

```bash
ossa export agent.ossa.yaml --platform anthropic --output devops-agent.ts
```

## License

Apache-2.0
