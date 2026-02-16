import express from 'express';
import pino from 'pino';
import { GitLabClient } from './gitlab-client.js';
import { LLMClient } from './llm-client.js';
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

const llmClient = new LLMClient({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  model: 'claude-sonnet-4-5',
});

const workflowExecutor = new WorkflowExecutor({
  gitlabClient,
  llmClient,
  logger,
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', agent: 'duo-comment-responder' });
});

// Ready check endpoint
app.get('/ready', (req, res) => {
  res.json({ status: 'ready', agent: 'duo-comment-responder' });
});

// Webhook endpoint
app.post('/webhook/duo-comment-responder', async (req, res) => {
  const event: WebhookEvent = req.body;

  // Validate webhook token
  const webhookToken = req.headers['x-gitlab-token'];
  if (webhookToken !== process.env.WEBHOOK_SECRET) {
    logger.warn({ event: event.object_kind }, 'Invalid webhook token');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  logger.info({ event: event.object_kind }, 'Webhook received');

  try {
    // Check if event matches filter
    if (!matchesFilter(event, {"note_author":"GitLab Duo Bot","note_contains":["@claude","review","suggestion","consider","refactor"]})) {
      logger.info({ event: event.object_kind }, 'Event filtered out');
      return res.status(200).json({ skipped: true });
    }

    // Execute workflow
    const result = await workflowExecutor.execute(event);

    logger.info({ result }, 'Workflow completed successfully');
    return res.status(200).json(result);
  } catch (error) {
    logger.error({ err: error }, 'Workflow execution failed');
    return res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

function matchesFilter(event: WebhookEvent, filter: any): boolean {
  // Implement filter matching logic based on manifest
  
  if (filter.note_author && event.object_attributes?.author?.username !== filter.note_author) {
    return false;
  }

  if (filter.note_contains && Array.isArray(filter.note_contains)) {
    const noteBody = event.object_attributes?.note || '';
    const matches = filter.note_contains.some((keyword: string) =>
      noteBody.toLowerCase().includes(keyword.toLowerCase())
    );
    if (!matches) return false;
  }
  

  return true;
}

const PORT = process.env.PORT || 9090;
app.listen(PORT, () => {
  logger.info(`Agent '${agentName}' listening on port ${PORT}`);
});
