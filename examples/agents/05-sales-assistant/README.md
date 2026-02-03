# Sales Assistant

Sales automation agent with CRM integration and entity memory.

## Features

- Lead qualification and management
- CRM search and updates
- Automated follow-up emails
- Meeting scheduling
- Entity memory for personalization
- Sales pipeline tracking

## Quick Start

```bash
export OPENAI_API_KEY=sk-...
docker-compose up -d

curl -X POST http://localhost:8084/v1/chat \
  -d '{"message": "Create a lead for John Doe from Acme Corp"}'
```

## Export to LangChain

```bash
ossa export agent.ossa.yaml --platform langchain --output sales_agent.py

# Use in Python
from sales_agent import SalesAssistant
agent = SalesAssistant()
response = agent.run("Search for leads in tech industry")
```

## License

Apache-2.0
