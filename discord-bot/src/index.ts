import {
  Client,
  Collection,
  Events,
  REST,
  Routes,
  CommandInteraction,
} from 'discord.js';
import express from 'express';
import bodyParser from 'body-parser';
import { config, validateConfig } from './config';
import { validator } from './utils/ossa-validator';
import logger from './utils/logger';
import { GitLabWebhookHandler } from './handlers/gitlab-webhook';
import { GitHubWebhookHandler } from './handlers/github-webhook';
import { ModerationHandler } from './handlers/moderation';
import * as specCommand from './commands/spec';
import * as askCommand from './commands/ask';
import * as bootstrapCommand from './commands/bootstrap';

interface Command {
  data: any;
  execute: (interaction: CommandInteraction) => Promise<void>;
}

interface ExtendedClient extends Client {
  commands: Collection<string, Command>;
}

async function main(): Promise<void> {
  try {
    // Validate configuration
    validateConfig();
    logger.info('Configuration validated');

    // Initialize OSSA validator
    await validator.initialize();
    logger.info('OSSA validator initialized');

    // Create Discord client
    const client = new Client({
      intents: config.discord.intents,
    }) as ExtendedClient;

    client.commands = new Collection();

    // Register commands
    const commands = [specCommand, askCommand, bootstrapCommand];
    commands.forEach((command) => {
      client.commands.set(command.data.name, command);
    });

    // Initialize handlers
    const gitlabHandler = new GitLabWebhookHandler(client);
    const githubHandler = new GitHubWebhookHandler(client);
    const moderationHandler = new ModerationHandler(client);

    // Discord event handlers
    client.once(Events.ClientReady, async (c) => {
      logger.info(`Discord bot ready! Logged in as ${c.user.tag}`);

      // Register slash commands
      await registerCommands(client);

      // Start moderation cleanup
      moderationHandler.startCleanup();
    });

    client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      const command = client.commands.get(interaction.commandName);
      if (!command) {
        logger.warn(`Unknown command: ${interaction.commandName}`);
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        logger.error('Error executing command', { command: interaction.commandName, error });

        const reply = {
          content: 'There was an error executing this command!',
          ephemeral: true,
        };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply);
        } else {
          await interaction.reply(reply);
        }
      }
    });

    client.on(Events.MessageCreate, async (message) => {
      await moderationHandler.handleMessage(message);
    });

    client.on(Events.GuildMemberAdd, async (member) => {
      await moderationHandler.handleMemberJoin(member);
    });

    // Login to Discord
    await client.login(config.discord.token);

    // Setup webhook server
    const app = express();
    app.use(bodyParser.json());

    app.post('/webhooks/gitlab', (req, res) => {
      gitlabHandler.handle(req, res).catch((error) => {
        logger.error('GitLab webhook error', error);
        res.status(500).json({ error: 'Internal server error' });
      });
    });

    app.post('/webhooks/github', (req, res) => {
      githubHandler.handle(req, res).catch((error) => {
        logger.error('GitHub webhook error', error);
        res.status(500).json({ error: 'Internal server error' });
      });
    });

    app.get('/health', (_req, res) => {
      res.json({
        status: 'ok',
        discord: client.isReady() ? 'connected' : 'disconnected',
        uptime: process.uptime(),
      });
    });

    app.listen(config.webhook.port, () => {
      logger.info(`Webhook server listening on port ${config.webhook.port}`);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Shutting down gracefully...');
      client.destroy();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Shutting down gracefully...');
      client.destroy();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Fatal error during startup', error);
    process.exit(1);
  }
}

async function registerCommands(client: ExtendedClient): Promise<void> {
  try {
    const rest = new REST().setToken(config.discord.token);

    const commandData = Array.from(client.commands.values()).map((cmd) => cmd.data.toJSON());

    logger.info('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId),
      { body: commandData }
    );

    logger.info('Successfully reloaded application (/) commands.');
  } catch (error) {
    logger.error('Error registering commands', error);
    throw error;
  }
}

// Start the bot
main().catch((error) => {
  logger.error('Unhandled error', error);
  process.exit(1);
});
