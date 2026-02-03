# Email Triage Agent

Email automation agent for categorization and response.

## Features

- Automatic email categorization
- Priority detection
- Smart routing to departments
- Automated response drafting
- PII protection

## Quick Start

```bash
export OPENAI_API_KEY=sk-...
docker-compose up -d

curl -X POST http://localhost:8087/v1/triage \
  -d '{"emailId": "email_123"}'
```

## Export to npm

```bash
ossa export agent.ossa.yaml --platform npm --output dist/

npm install @company/email-triage-agent
```

## License

Apache-2.0
