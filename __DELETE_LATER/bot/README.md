# OSSA Discord Bot

Community support and automation bot for Open Standard Agents.

## Features

- Slash commands for bot interaction
- OSSA specification help
- Example manifest sharing
- DevOps notifications
- LLM-powered assistance

## Commands

- `/ping` - Check bot latency
- `/help` - Show available commands
- `/about` - Learn about OSSA

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your Discord bot token and client ID
```

3. Run in development:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
npm start
```

## Testing

```bash
npm test
npm run test:coverage
```

## Deployment

Bot runs in Kubernetes via agent-buildkit. See deployment docs.

## Development

- TypeScript strict mode enabled
- ESLint for code quality
- Vitest for testing
- discord.js v14

Closes #3
