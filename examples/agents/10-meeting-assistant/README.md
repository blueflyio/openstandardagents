# Meeting Assistant

Meeting transcription, summarization, and action item extraction.

## Features

- Audio transcription with speaker diarization
- Meeting summarization
- Action item extraction
- Meeting minutes generation
- Zoom/Google Meet integration
- Email distribution

## Quick Start

```bash
export OPENAI_API_KEY=sk-...
docker-compose up -d

curl -X POST http://localhost:8089/v1/process-recording \
  -d '{
    "recordingUrl": "https://zoom.us/rec/...",
    "meetingTitle": "Product Planning",
    "attendees": ["alice@company.com", "bob@company.com"]
  }'
```

## Integration

### Zoom Webhook

Configure Zoom webhook to automatically process recordings:

```json
{
  "url": "https://your-domain.com/v1/webhook/zoom",
  "event_types": ["recording.completed"]
}
```

### Google Meet

Use Google Calendar API integration for automatic processing.

## Export to LangChain

```bash
ossa export agent.ossa.yaml --platform langchain --output meeting_assistant.py
```

## License

Apache-2.0
