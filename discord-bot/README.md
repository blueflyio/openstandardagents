# OSSA Discord Bot

Discord bot for the OSSA (Open Standard for Agent Systems) community with GitLab/GitHub webhook integrations and AI-powered Q&A.

## Features

- **Slash Commands**:
  - `/spec` - Look up OSSA specification sections and manifest field definitions
  - `/ask` - AI-powered Q&A about OSSA (powered by Claude or GPT)
  - `/bootstrap` - Generate starter agent manifests with configuration

- **GitLab Webhooks**:
  - Pipeline status notifications
  - Merge request events
  - Issue tracking
  - Push notifications

- **GitHub Webhooks**:
  - Workflow run status
  - Pull request events
  - Issue tracking
  - Release notifications

- **Moderation**:
  - Spam detection and prevention
  - Welcome messages for new members
  - Suspicious link filtering
  - Auto-cleanup of old messages

## Setup

### Prerequisites

- Node.js >= 18.0.0
- Discord Bot Token (from Discord Developer Portal)
- Discord Server (Guild) ID
- Anthropic API Key or OpenAI API Key (for `/ask` command)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
cd discord-bot
npm install
```

3. Create `.env` file:

```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:

```env
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_SERVER_ID=your_server_id
ANTHROPIC_API_KEY=your_anthropic_key
```

5. Build the bot:

```bash
npm run build
```

6. Start the bot:

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to "Bot" section and create a bot
4. Copy the bot token to `DISCORD_TOKEN` in `.env`
5. Enable the following Privileged Gateway Intents:
   - Server Members Intent
   - Message Content Intent
6. Go to "OAuth2" → "URL Generator"
7. Select scopes: `bot`, `applications.commands`
8. Select bot permissions:
   - Read Messages/View Channels
   - Send Messages
   - Manage Messages
   - Embed Links
   - Read Message History
   - Add Reactions
   - Moderate Members (for timeouts)
9. Copy the generated URL and invite the bot to your server

## Webhook Configuration

### GitLab Webhooks

1. In your GitLab project, go to Settings → Webhooks
2. Set URL to: `https://your-domain.com/webhooks/gitlab`
3. Set Secret Token (optional but recommended) and add to `.env` as `GITLAB_WEBHOOK_SECRET`
4. Select triggers:
   - Push events
   - Merge request events
   - Pipeline events
   - Issue events
   - Wiki page events

### GitHub Webhooks

1. In your GitHub repo, go to Settings → Webhooks
2. Set Payload URL to: `https://your-domain.com/webhooks/github`
3. Set Content type to `application/json`
4. Set Secret (optional but recommended) and add to `.env` as `GITHUB_WEBHOOK_SECRET`
5. Select individual events:
   - Pushes
   - Pull requests
   - Issues
   - Workflow runs
   - Releases

## Slash Commands Usage

### /spec

Look up OSSA specification sections or manifest field definitions:

```
/spec field:name
/spec field:capabilities
/spec section:types
/spec section:manifest
```

### /ask

Ask questions about OSSA using AI:

```
/ask question:What is an OSSA agent?
/ask question:How do I define capabilities? provider:anthropic
```

### /bootstrap

Generate a starter OSSA agent manifest:

```
/bootstrap name:my-agent type:worker runtime:node
/bootstrap name:coordinator type:supervisor description:Coordinates tasks
```

## Project Structure

```
discord-bot/
├── src/
│   ├── index.ts              # Main entry point
│   ├── config.ts             # Configuration management
│   ├── commands/             # Slash command implementations
│   │   ├── spec.ts
│   │   ├── ask.ts
│   │   └── bootstrap.ts
│   ├── handlers/             # Event and webhook handlers
│   │   ├── gitlab-webhook.ts
│   │   ├── github-webhook.ts
│   │   └── moderation.ts
│   └── utils/                # Utilities
│       ├── logger.ts
│       ├── ossa-validator.ts
│       └── llm-router.ts
├── dist/                     # Compiled JavaScript (generated)
├── logs/                     # Application logs (generated)
├── package.json
├── tsconfig.json
└── .env                      # Environment variables (not in git)
```

## Development

### Building

```bash
npm run build
```

### Running in Development Mode

```bash
npm run dev
```

### Watch Mode (Auto-rebuild)

```bash
npm run watch
```

### Linting

```bash
npm run lint
```

### Formatting

```bash
npm run format
```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_TOKEN` | Yes | Discord bot token |
| `DISCORD_CLIENT_ID` | Yes | Discord application client ID |
| `DISCORD_SERVER_ID` | Yes | Discord server (guild) ID |
| `DISCORD_CHANNEL_GENERAL` | No | General channel ID |
| `DISCORD_CHANNEL_GITLAB` | No | GitLab notifications channel ID |
| `DISCORD_CHANNEL_GITHUB` | No | GitHub notifications channel ID |
| `DISCORD_CHANNEL_WELCOME` | No | Welcome messages channel ID |
| `WEBHOOK_PORT` | No | Webhook server port (default: 3000) |
| `GITLAB_WEBHOOK_SECRET` | No | GitLab webhook secret token |
| `GITHUB_WEBHOOK_SECRET` | No | GitHub webhook secret |
| `ANTHROPIC_API_KEY` | One of AI | Anthropic API key for Claude |
| `OPENAI_API_KEY` | One of AI | OpenAI API key for GPT |
| `AI_MODEL` | No | AI model to use (default: claude-sonnet-4-5-20250929) |
| `CLEANUP_CHANNELS` | No | Comma-separated channel IDs for auto-cleanup |
| `MESSAGE_RETENTION_HOURS` | No | Hours to keep messages (default: 72) |
| `SPAM_THRESHOLD` | No | Messages before spam detection (default: 5) |
| `LOG_LEVEL` | No | Logging level (default: info) |

## Deployment

### Docker (Recommended)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### PM2 (Process Manager)

```bash
npm install -g pm2
pm2 start dist/index.js --name ossa-bot
pm2 save
pm2 startup
```

### Systemd Service

Create `/etc/systemd/system/ossa-bot.service`:

```ini
[Unit]
Description=OSSA Discord Bot
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/discord-bot
ExecStart=/usr/bin/node dist/index.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable ossa-bot
sudo systemctl start ossa-bot
```

## Logging

Logs are written to:
- `logs/error.log` - Error level logs
- `logs/combined.log` - All logs
- Console output (in development)

## Health Check

The bot exposes a health check endpoint:

```bash
curl http://localhost:3000/health
```

Response:

```json
{
  "status": "ok",
  "discord": "connected",
  "uptime": 123.45
}
```

## OSSA Compliance

This bot helps enforce OSSA standards by:
- Validating manifest files against the OSSA schema
- Providing specification lookup via `/spec`
- Generating compliant starter manifests via `/bootstrap`
- Answering questions about OSSA via `/ask`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- [OSSA Documentation](https://openstandardagents.org)
- [Discord Server](https://discord.gg/ossa)
- [GitHub Issues](https://github.com/openstandardagents/openstandardagents.org/issues)
