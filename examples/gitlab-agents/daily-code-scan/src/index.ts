import express from 'express';
import pino from 'pino';
import { GitLabClient } from './gitlab-client.js';

import { WorkflowExecutor } from './workflow.js';
import type { WebhookEvent } from './types.js';

const app = express();
app.use(express.json());

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

// Initialize clients
const gitlabClient = new GitLabClient({
  token: process.env.GITLAB_API_TOKEN!,
  baseUrl: process.env.GITLAB_API_URL || 'https://gitlab.com/api/v4',
});



const workflowExecutor = new WorkflowExecutor({
  gitlabClient,

  logger,
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', agent: 'daily-code-scan' });
});

// Ready check endpoint
app.get('/ready', (req, res) => {
  res.json({ status: 'ready', agent: 'daily-code-scan' });
});



const PORT = process.env.PORT || 9090;
app.listen(PORT, () => {
  logger.info(`Agent '${agentName}' listening on port ${PORT}`);
});
