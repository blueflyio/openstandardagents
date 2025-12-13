import { GatewayIntentBits } from 'discord.js';

export interface Config {
  discord: {
    token: string;
    clientId: string;
    guildId: string;
    intents: GatewayIntentBits[];
    channels: {
      general: string;
      gitlab: string;
      github: string;
      welcome: string;
    };
  };
  webhook: {
    port: number;
    gitlabSecret?: string;
    githubSecret?: string;
  };
  ai: {
    anthropicApiKey?: string;
    openaiApiKey?: string;
    model?: string;
  };
  moderation: {
    welcomeMessage: string;
    cleanupChannels: string[];
    messageRetentionHours: number;
    spamThreshold: number;
  };
}

export const config: Config = {
  discord: {
    token: process.env.DISCORD_TOKEN || '',
    clientId: process.env.DISCORD_CLIENT_ID || '',
    guildId: process.env.DISCORD_SERVER_ID || '1440574820390801561',
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildModeration,
    ],
    channels: {
      general: process.env.DISCORD_CHANNEL_GENERAL || '',
      gitlab: process.env.DISCORD_CHANNEL_GITLAB || '',
      github: process.env.DISCORD_CHANNEL_GITHUB || '',
      welcome: process.env.DISCORD_CHANNEL_WELCOME || '',
    },
  },
  webhook: {
    port: parseInt(process.env.WEBHOOK_PORT || '3000', 10),
    gitlabSecret: process.env.GITLAB_WEBHOOK_SECRET,
    githubSecret: process.env.GITHUB_WEBHOOK_SECRET,
  },
  ai: {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
    model: process.env.AI_MODEL || 'claude-sonnet-4-5-20250929',
  },
  moderation: {
    welcomeMessage:
      'Welcome to the OSSA community! 🤖 Check out <#CHANNEL_ID> to get started. Use `/spec` to explore the OSSA specification, `/ask` for questions, and `/bootstrap` to create your first agent!',
    cleanupChannels: (process.env.CLEANUP_CHANNELS || '').split(',').filter(Boolean),
    messageRetentionHours: parseInt(process.env.MESSAGE_RETENTION_HOURS || '72', 10),
    spamThreshold: parseInt(process.env.SPAM_THRESHOLD || '5', 10),
  },
};

export function validateConfig(): void {
  const errors: string[] = [];

  if (!config.discord.token) {
    errors.push('DISCORD_TOKEN is required');
  }

  if (!config.discord.clientId) {
    errors.push('DISCORD_CLIENT_ID is required');
  }

  if (!config.discord.guildId) {
    errors.push('DISCORD_SERVER_ID is required');
  }

  if (!config.ai.anthropicApiKey && !config.ai.openaiApiKey) {
    errors.push('Either ANTHROPIC_API_KEY or OPENAI_API_KEY is required for /ask command');
  }

  if (config.webhook.port < 1 || config.webhook.port > 65535) {
    errors.push('WEBHOOK_PORT must be between 1 and 65535');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}
