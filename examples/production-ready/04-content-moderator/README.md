# Content Moderator

Content moderation agent using OpenAI with automated flagging and human escalation.

## Features

- Detect hate speech, violence, harassment, spam, adult content
- Automatic flagging with severity levels
- Human-in-the-loop escalation
- Multi-modal support (text, image, video, audio)
- Decision audit trail

## Quick Start

```bash
export OPENAI_API_KEY=sk-...
docker-compose up -d

# Moderate content
curl -X POST http://localhost:8083/v1/moderate \
  -H "Content-Type: application/json" \
  -d '{
    "content": "user submitted content",
    "contentType": "text"
  }'
```

## Export to OpenAI Assistant

```bash
ossa export agent.ossa.yaml --platform openai-assistant --output moderator.json

# Create assistant via API
curl https://api.openai.com/v1/assistants \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d @moderator.json
```

## Configuration

Set moderation thresholds in `agent.ossa.yaml`:

```yaml
safety:
  input_filters:
    - type: content_sanitization
  output_validation:
    - type: decision_audit
      log_all_decisions: true
```

## License

Apache-2.0
