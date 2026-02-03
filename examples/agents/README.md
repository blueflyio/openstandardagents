# Production-Ready OSSA Agent Examples

This directory contains 10 complete, production-ready agent examples built with OSSA v0.3.6. Each example includes:

- OSSA manifest (`agent.ossa.yaml`)
- OpenAPI specification
- Docker deployment configuration
- Complete documentation
- Working exports to target platforms

## Examples Overview

| # | Agent | Platform | Export | Use Case | Port |
|---|-------|----------|--------|----------|------|
| 01 | [Customer Support Bot](./01-customer-support-bot/) | LangChain + OpenAI | LangChain (Python/TS) | Customer service automation | 8080 |
| 02 | [Code Review Agent](./02-code-review-agent/) | Anthropic | Anthropic SDK | Automated code review | 8081 |
| 03 | [Data Analysis Agent](./03-data-analysis-agent/) | npm package | npm | Data analysis & visualization | 8082 |
| 04 | [Content Moderator](./04-content-moderator/) | OpenAI Assistant | OpenAI Assistant | Content moderation | 8083 |
| 05 | [Sales Assistant](./05-sales-assistant/) | LangChain + GPT-4 | LangChain (Python/TS) | Sales & CRM automation | 8084 |
| 06 | [DevOps Agent](./06-devops-agent/) | Anthropic | Anthropic SDK | Infrastructure management | 8085 |
| 07 | [Research Assistant](./07-research-assistant/) | LangChain + Claude | LangChain (Python/TS) | Academic research | 8086 |
| 08 | [Email Triage Agent](./08-email-triage-agent/) | npm package | npm | Email automation | 8087 |
| 09 | [Security Scanner](./09-security-scanner/) | Anthropic | Anthropic SDK | Security analysis | 8088 |
| 10 | [Meeting Assistant](./10-meeting-assistant/) | LangChain + GPT-4o | LangChain (Python/TS) | Meeting automation | 8089 |

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+
- Python 3.9+ (for LangChain exports)
- API keys for:
  - OpenAI (`OPENAI_API_KEY`)
  - Anthropic (`ANTHROPIC_API_KEY`)
  - GitHub/GitLab (for some examples)

### Running an Example

Each example is self-contained and can be run independently:

```bash
# Navigate to example directory
cd 01-customer-support-bot

# Set required environment variables
export OPENAI_API_KEY=sk-...

# Start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Test the API
curl http://localhost:8080/v1/health
```

### Exporting Agents

All examples can be exported to their target platforms using the OSSA CLI:

```bash
# Export to LangChain (Python)
ossa export 01-customer-support-bot/agent.ossa.yaml \
  --platform langchain \
  --output customer_support.py

# Export to Anthropic SDK (TypeScript)
ossa export 02-code-review-agent/agent.ossa.yaml \
  --platform anthropic \
  --output code-review.ts

# Export to npm package
ossa export 03-data-analysis-agent/agent.ossa.yaml \
  --platform npm \
  --output dist/
```

## Features by Agent

### 01. Customer Support Bot
**Platform:** LangChain + OpenAI
- Multi-turn conversations with memory
- Documentation search
- Automated ticket creation
- Email notifications
- PII redaction
- Redis-backed persistence

**Key Tools:**
- `search_docs` - Search knowledge base
- `create_ticket` - Create support tickets
- `send_email` - Send follow-up emails

**Export:** LangChain Python/TypeScript

---

### 02. Code Review Agent
**Platform:** Anthropic Claude
- Static code analysis
- Security vulnerability detection
- Performance suggestions
- GitHub/GitLab integration
- Extended thinking for deep analysis

**Key Tools:**
- `read_file` - Read source files
- `analyze_code` - Static analysis
- `suggest_fix` - Generate fixes

**Export:** Anthropic SDK (TypeScript)

---

### 03. Data Analysis Agent
**Platform:** npm package
- Load data from multiple sources
- Statistical analysis
- Data visualization
- Trend detection
- Predictive modeling

**Key Tools:**
- `load_data` - Load datasets
- `analyze_data` - Statistical analysis
- `visualize_data` - Create charts

**Export:** npm package

---

### 04. Content Moderator
**Platform:** OpenAI Assistant
- Content policy violation detection
- Hate speech detection
- Automated flagging
- Human escalation
- Decision audit trail

**Key Tools:**
- `check_content` - Analyze content
- `flag_violation` - Flag violations
- `escalate_issue` - Escalate to humans

**Export:** OpenAI Assistant API

---

### 05. Sales Assistant
**Platform:** LangChain + GPT-4
- Lead management
- CRM integration
- Automated follow-ups
- Meeting scheduling
- Entity memory for personalization

**Key Tools:**
- `search_crm` - Search CRM
- `create_lead` - Create leads
- `send_followup` - Send follow-ups
- `schedule_meeting` - Schedule meetings

**Export:** LangChain Python/TypeScript

---

### 06. DevOps Agent
**Platform:** Anthropic Claude
- System health monitoring
- Automated deployments
- Rollback management
- Service scaling
- Log analysis

**Key Tools:**
- `check_status` - Health checks
- `deploy_service` - Deploy services
- `rollback_deployment` - Rollback
- `scale_service` - Scale instances

**Export:** Anthropic SDK (TypeScript)

---

### 07. Research Assistant
**Platform:** LangChain + Claude
- Academic paper search
- Paper summarization
- Citation generation
- Study comparison
- Summary memory for long sessions

**Key Tools:**
- `search_papers` - Search literature
- `summarize_paper` - Summarize papers
- `generate_citations` - Generate citations

**Export:** LangChain Python/TypeScript

---

### 08. Email Triage Agent
**Platform:** npm package
- Email categorization
- Priority detection
- Automated responses
- Smart routing
- PII protection

**Key Tools:**
- `read_email` - Read emails
- `categorize_email` - Categorize
- `draft_response` - Draft responses
- `route_email` - Route emails

**Export:** npm package

---

### 09. Security Scanner
**Platform:** Anthropic Claude
- SAST scanning
- Dependency analysis
- Secret detection
- SARIF report generation
- GitHub/GitLab integration

**Key Tools:**
- `scan_code` - Scan repositories
- `find_vulnerabilities` - Find vulnerabilities
- `generate_report` - Generate reports

**Export:** Anthropic SDK (TypeScript)

---

### 10. Meeting Assistant
**Platform:** LangChain + GPT-4o
- Meeting transcription
- Summary generation
- Action item extraction
- Meeting minutes
- Zoom/Google Meet integration

**Key Tools:**
- `transcribe_audio` - Transcribe audio
- `summarize_meeting` - Summarize
- `extract_action_items` - Extract actions
- `generate_minutes` - Create minutes

**Export:** LangChain Python/TypeScript

## Common Features

All examples include:

- **Production-ready configuration**
  - Docker deployment
  - Health checks
  - Logging and metrics
  - OpenTelemetry tracing

- **Safety and security**
  - Input validation
  - Output filtering
  - PII protection
  - Rate limiting

- **Observability**
  - Structured JSON logging
  - Prometheus metrics
  - Distributed tracing
  - Error reporting

- **OpenAPI specifications**
  - Complete API documentation
  - Type-safe contracts
  - Auto-generated clients

## Validation

All OSSA manifests are validated against the v0.3.6 schema:

```bash
# Validate all examples
ossa validate-all production-ready/**/*.ossa.yaml

# Validate single example
ossa validate 01-customer-support-bot/agent.ossa.yaml
```

## Deployment

### Docker Compose (Development)

Each example includes a `docker-compose.yml` for local development:

```bash
cd 01-customer-support-bot
docker-compose up -d
```

### Kubernetes (Production)

Generate Kubernetes manifests from OSSA:

```bash
ossa export 01-customer-support-bot/agent.ossa.yaml \
  --platform kubernetes \
  --output k8s/

kubectl apply -f k8s/
```

### Serverless

Deploy to serverless platforms:

```bash
# AWS Lambda
ossa export agent.ossa.yaml --platform lambda --output dist/

# Vercel
ossa export agent.ossa.yaml --platform vercel --output dist/

# Google Cloud Functions
ossa export agent.ossa.yaml --platform gcp-functions --output dist/
```

## Testing

Each example includes tests:

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Test API endpoints
npm run test:api
```

## Monitoring

All agents expose metrics at `/metrics`:

```bash
curl http://localhost:8080/metrics
```

Common metrics:
- `requests_total` - Total requests handled
- `request_duration_seconds` - Request duration
- `errors_total` - Total errors
- `llm_tokens_used` - LLM tokens consumed

## Cost Optimization

Monitor LLM costs:

```bash
# View token usage
curl http://localhost:8080/v1/metrics/tokens

# Set budget limits (in agent.ossa.yaml)
observability:
  cost_tracking:
    enabled: true
    budget_limit_usd: 100
    alert_threshold: 80
```

## Architecture Patterns

### Memory Types Used

- **Conversation Buffer** (01, 10) - Recent conversation history
- **Entity Memory** (05) - Track entities across conversations
- **Summary Memory** (07) - Summarize long conversations

### Tool Patterns

- **HTTP Tools** - External API calls
- **Function Tools** - Custom business logic
- **LLM Tools** - Nested LLM calls
- **Vector Search** - Semantic search

### Safety Patterns

- **Input Validation** - Schema validation, sanitization
- **Output Filtering** - Tone check, PII redaction
- **Approval Workflows** - Human-in-the-loop for critical actions
- **Guardrails** - Rate limits, confidence thresholds

## Troubleshooting

### Common Issues

**Agent not responding:**
```bash
# Check logs
docker-compose logs -f

# Check health
curl http://localhost:8080/v1/health
```

**High latency:**
```bash
# Check metrics
curl http://localhost:8080/metrics | grep duration

# Enable debug logging
export LOG_LEVEL=debug
docker-compose restart
```

**Memory issues:**
```bash
# Check memory usage
docker stats

# Clear cache (if using Redis)
redis-cli FLUSHDB
```

## Contributing

To add a new example:

1. Create directory: `11-your-agent/`
2. Add OSSA manifest: `agent.ossa.yaml`
3. Add OpenAPI spec: `openapi.yaml`
4. Add Docker files: `Dockerfile`, `docker-compose.yml`
5. Add README: `README.md`
6. Validate: `ossa validate agent.ossa.yaml`
7. Test: Ensure all endpoints work
8. Update this README with your example

## License

Apache-2.0

## Support

- Documentation: https://openstandardagents.org
- Issues: https://github.com/org/repo/issues
- Discord: https://discord.gg/ossa
