import { Request, Response } from 'express';
import { Client, TextChannel, EmbedBuilder } from 'discord.js';
import crypto from 'crypto';
import { config } from '../config';
import logger from '../utils/logger';

interface GitLabPipelineEvent {
  object_kind: string;
  object_attributes: {
    id: number;
    ref: string;
    tag: boolean;
    sha: string;
    status: string;
    stages: string[];
    duration: number;
    created_at: string;
    finished_at: string;
  };
  project: {
    name: string;
    web_url: string;
    path_with_namespace: string;
  };
  user: {
    name: string;
    username: string;
  };
  commit: {
    id: string;
    message: string;
    url: string;
  };
}

interface GitLabMergeRequestEvent {
  object_kind: string;
  object_attributes: {
    id: number;
    title: string;
    description: string;
    state: string;
    merge_status: string;
    url: string;
    source_branch: string;
    target_branch: string;
    action: string;
  };
  project: {
    name: string;
    web_url: string;
  };
  user: {
    name: string;
    username: string;
  };
}

interface GitLabPushEvent {
  object_kind: string;
  ref: string;
  commits: Array<{
    id: string;
    message: string;
    url: string;
    author: {
      name: string;
      email: string;
    };
  }>;
  project: {
    name: string;
    web_url: string;
  };
  user_name: string;
}

export class GitLabWebhookHandler {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  verifySignature(req: Request): boolean {
    const token = req.headers['x-gitlab-token'] as string | undefined;
    const secret = config.webhook.gitlabSecret;
    if (!token || !secret) return false;
    // Use timing-safe comparison to prevent timing attacks
    try {
      return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(secret));
    } catch {
      return false;
    }
  }

  async handle(req: Request, res: Response): Promise<void> {
    if (!this.verifySignature(req)) {
      logger.warn('Invalid GitLab webhook signature');
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const event = req.headers['x-gitlab-event'] as string;
    const payload = req.body;

    logger.info('Received GitLab webhook', { event, project: payload.project?.name });

    try {
      switch (event) {
        case 'Pipeline Hook':
          await this.handlePipeline(payload as GitLabPipelineEvent);
          break;
        case 'Merge Request Hook':
          await this.handleMergeRequest(payload as GitLabMergeRequestEvent);
          break;
        case 'Push Hook':
          await this.handlePush(payload as GitLabPushEvent);
          break;
        default:
          logger.info(`Unhandled GitLab event: ${event}`);
      }

      res.status(200).json({ message: 'Webhook processed' });
    } catch (error) {
      logger.error('Error processing GitLab webhook', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private async handlePipeline(event: GitLabPipelineEvent): Promise<void> {
    const channel = await this.getChannel(config.discord.channels.gitlab);
    if (!channel) return;

    const status = event.object_attributes.status;
    const color = this.getStatusColor(status);
    const emoji = this.getStatusEmoji(status);

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`${emoji} Pipeline ${status}`)
      .setURL(`${event.project.web_url}/-/pipelines/${event.object_attributes.id}`)
      .setDescription(`Pipeline for ${event.project.name}`)
      .addFields(
        { name: 'Branch', value: event.object_attributes.ref, inline: true },
        { name: 'Status', value: status, inline: true },
        { name: 'Duration', value: `${event.object_attributes.duration}s`, inline: true },
        { name: 'Commit', value: event.commit.message.split('\n')[0].substring(0, 100) },
        { name: 'Author', value: event.user.name, inline: true }
      )
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  }

  private async handleMergeRequest(event: GitLabMergeRequestEvent): Promise<void> {
    const channel = await this.getChannel(config.discord.channels.gitlab);
    if (!channel) return;

    const action = event.object_attributes.action;

    // Only notify on specific actions
    if (!['open', 'merge', 'close', 'approved'].includes(action)) {
      return;
    }

    const color = action === 'merge' ? 0x2ecc71 : action === 'open' ? 0x3498db : 0x95a5a6;
    const emoji = action === 'merge' ? '✅' : action === 'open' ? '📝' : '❌';

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`${emoji} Merge Request ${action}`)
      .setURL(event.object_attributes.url)
      .setDescription(event.object_attributes.title)
      .addFields(
        { name: 'Project', value: event.project.name },
        { name: 'Source', value: event.object_attributes.source_branch, inline: true },
        { name: 'Target', value: event.object_attributes.target_branch, inline: true },
        { name: 'Author', value: event.user.name, inline: true }
      )
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  }

  private async handlePush(event: GitLabPushEvent): Promise<void> {
    // Check if this is a push to the examples directory
    const hasExampleChanges = event.commits.some((commit) =>
      commit.message.toLowerCase().includes('example')
    );

    if (!hasExampleChanges) return;

    const channel = await this.getChannel(config.discord.channels.gitlab);
    if (!channel) return;

    const branch = event.ref.replace('refs/heads/', '');
    const commits = event.commits.slice(0, 3); // Show max 3 commits

    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle('📦 New Example Added')
      .setDescription(`New commits pushed to ${event.project.name}`)
      .addFields(
        { name: 'Branch', value: branch, inline: true },
        { name: 'Author', value: event.user_name, inline: true },
        { name: 'Commits', value: commits.length.toString(), inline: true }
      );

    commits.forEach((commit) => {
      embed.addFields({
        name: commit.author.name,
        value: `[${commit.id.substring(0, 8)}](${commit.url}) ${commit.message.split('\n')[0]}`,
      });
    });

    embed.setTimestamp();

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

  private getStatusColor(status: string): number {
    switch (status) {
      case 'success':
        return 0x2ecc71;
      case 'failed':
        return 0xe74c3c;
      case 'running':
        return 0x3498db;
      case 'pending':
        return 0xf39c12;
      default:
        return 0x95a5a6;
    }
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'success':
        return '✅';
      case 'failed':
        return '❌';
      case 'running':
        return '⚙️';
      case 'pending':
        return '⏳';
      default:
        return '❓';
    }
  }
}
