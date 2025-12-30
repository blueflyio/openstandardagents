import { Request, Response } from 'express';
import crypto from 'crypto';
import { Client, TextChannel, EmbedBuilder } from 'discord.js';
import { config } from '../config';
import logger from '../utils/logger';

interface GitHubWorkflowEvent {
  action: string;
  workflow_run: {
    id: number;
    name: string;
    head_branch: string;
    status: string;
    conclusion: string | null;
    html_url: string;
    head_commit: {
      message: string;
    };
  };
  repository: {
    name: string;
    full_name: string;
    html_url: string;
  };
  sender: {
    login: string;
  };
}

interface GitHubPullRequestEvent {
  action: string;
  pull_request: {
    number: number;
    title: string;
    html_url: string;
    state: string;
    merged: boolean;
    user: {
      login: string;
    };
    head: {
      ref: string;
    };
    base: {
      ref: string;
    };
  };
  repository: {
    name: string;
    full_name: string;
  };
}

export class GitHubWebhookHandler {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  verifySignature(req: Request): boolean {
    if (!config.webhook?.githubSecret) {
      return false;
    }

    const signature = req.headers['x-hub-signature-256'] as string;
    if (!signature) {
      return false;
    }

    const payload = JSON.stringify(req.body);
    const hmac = crypto.createHmac('sha256', config.webhook.githubSecret);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  }

  async handle(req: Request, res: Response): Promise<void> {
    if (!this.verifySignature(req)) {
      logger.warn('Invalid GitHub webhook signature');
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const event = req.headers['x-github-event'] as string;
    const payload = req.body;

    logger.info('Received GitHub webhook', { event, repository: payload.repository?.name });

    try {
      switch (event) {
        case 'workflow_run':
          await this.handleWorkflowRun(payload as GitHubWorkflowEvent);
          break;
        case 'pull_request':
          await this.handlePullRequest(payload as GitHubPullRequestEvent);
          break;
        default:
          logger.info(`Unhandled GitHub event: ${event}`);
      }

      res.status(200).json({ message: 'Webhook processed' });
    } catch (error) {
      logger.error('Error processing GitHub webhook', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private async handleWorkflowRun(event: GitHubWorkflowEvent): Promise<void> {
    if (event.action !== 'completed') {
      return;
    }

    const channel = await this.getChannel(config.discord.channels.github);
    if (!channel) return;

    const conclusion = event.workflow_run.conclusion;
    const color = conclusion === 'success' ? 0x2ecc71 : conclusion === 'failure' ? 0xe74c3c : 0x95a5a6;
    const emoji = conclusion === 'success' ? '✅' : conclusion === 'failure' ? '❌' : '⚠️';

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`${emoji} GitHub Workflow ${conclusion}`)
      .setURL(event.workflow_run.html_url)
      .setDescription(`${event.workflow_run.name} in ${event.repository.full_name}`)
      .addFields(
        { name: 'Branch', value: event.workflow_run.head_branch, inline: true },
        { name: 'Status', value: conclusion || 'unknown', inline: true },
        { name: 'Commit', value: event.workflow_run.head_commit.message.split('\n')[0].substring(0, 100) },
        { name: 'Triggered by', value: event.sender.login, inline: true }
      )
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  }

  private async handlePullRequest(event: GitHubPullRequestEvent): Promise<void> {
    const action = event.action;

    // Only notify on specific actions
    if (!['opened', 'closed', 'ready_for_review'].includes(action)) {
      return;
    }

    const channel = await this.getChannel(config.discord.channels.github);
    if (!channel) return;

    const isMerged = event.pull_request.merged;
    const color = isMerged ? 0x2ecc71 : action === 'opened' ? 0x3498db : 0x95a5a6;
    const emoji = isMerged ? '✅' : action === 'opened' ? '📝' : '❌';
    const displayAction = isMerged ? 'merged' : action;

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`${emoji} Pull Request ${displayAction}`)
      .setURL(event.pull_request.html_url)
      .setDescription(event.pull_request.title)
      .addFields(
        { name: 'Repository', value: event.repository.full_name },
        { name: 'Number', value: `#${event.pull_request.number}`, inline: true },
        { name: 'Source', value: event.pull_request.head.ref, inline: true },
        { name: 'Target', value: event.pull_request.base.ref, inline: true },
        { name: 'Author', value: event.pull_request.user.login, inline: true }
      )
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  }

  private async getChannel(channelId?: string): Promise<TextChannel | null> {
    if (!channelId) {
      logger.warn('Channel ID not configured');
      return null;
    }

    try {
      const channel = await this.client.channels.fetch(channelId);
      if (channel?.isTextBased()) {
        return channel as TextChannel;
      }
      return null;
    } catch (error) {
      logger.error('Failed to fetch channel', { channelId, error });
      return null;
    }
  }
}
