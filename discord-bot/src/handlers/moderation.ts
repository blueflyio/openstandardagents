import {
  Client,
  Message,
  GuildMember,
  EmbedBuilder,
  TextChannel,
} from 'discord.js';
import { config } from '../config';
import logger from '../utils/logger';

interface SpamTracker {
  [userId: string]: {
    messages: number;
    lastMessage: number;
  };
}

export class ModerationHandler {
  private client: Client;
  private spamTracker: SpamTracker = {};
  private suspiciousPatterns: RegExp[];
  private blockedDomains: string[];

  constructor(client: Client) {
    this.client = client;

    // Common spam patterns
    this.suspiciousPatterns = [
      /discord\.gg\/[a-zA-Z0-9]+/gi, // Discord invite links
      /free\s+nitro/gi,
      /click\s+here/gi,
      /@everyone|@here/gi, // Mass mentions
      /\$\d+.*crypto/gi,
      /investment.*opportunity/gi,
    ];

    // Blocked domains
    this.blockedDomains = [
      'bit.ly',
      'tinyurl.com',
      'grabify.link',
      // Add more suspicious domains
    ];
  }

  async handleMessage(message: Message): Promise<void> {
    if (message.author.bot) return;
    if (!message.guild) return;

    try {
      // Check for spam
      if (await this.isSpam(message)) {
        await this.handleSpam(message);
        return;
      }

      // Check for suspicious links
      if (await this.hasSuspiciousLinks(message)) {
        await this.handleSuspiciousLink(message);
        return;
      }

      // Check for spam patterns
      if (this.hasSuspiciousPatterns(message)) {
        await this.handleSuspiciousPattern(message);
        return;
      }
    } catch (error) {
      logger.error('Error in moderation handler', error);
    }
  }

  async handleMemberJoin(member: GuildMember): Promise<void> {
    try {
      // Check account age (flag if very new)
      const accountAge = Date.now() - member.user.createdTimestamp;
      const oneDay = 24 * 60 * 60 * 1000;

      if (accountAge < oneDay) {
        await this.logModerationAction(
          'New Account',
          member.user,
          `Account created less than 24 hours ago`,
          0xf39c12
        );
      }

      // Send welcome message
      await this.sendWelcomeMessage(member);
    } catch (error) {
      logger.error('Error handling member join', error);
    }
  }

  private async isSpam(message: Message): Promise<boolean> {
    const userId = message.author.id;
    const now = Date.now();
    const spamWindow = 5000; // 5 seconds
    const spamThreshold = 5; // 5 messages

    if (!this.spamTracker[userId]) {
      this.spamTracker[userId] = { messages: 1, lastMessage: now };
      return false;
    }

    const tracker = this.spamTracker[userId];

    if (now - tracker.lastMessage < spamWindow) {
      tracker.messages++;
      tracker.lastMessage = now;

      if (tracker.messages >= spamThreshold) {
        return true;
      }
    } else {
      // Reset tracker
      tracker.messages = 1;
      tracker.lastMessage = now;
    }

    return false;
  }

  private async hasSuspiciousLinks(message: Message): Promise<boolean> {
    const urlPattern = /https?:\/\/[^\s]+/gi;
    const urls = message.content.match(urlPattern);

    if (!urls) return false;

    for (const url of urls) {
      const domain = this.extractDomain(url);
      if (this.blockedDomains.some((blocked) => domain.includes(blocked))) {
        return true;
      }
    }

    return false;
  }

  private hasSuspiciousPatterns(message: Message): boolean {
    return this.suspiciousPatterns.some((pattern) => pattern.test(message.content));
  }

  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return '';
    }
  }

  private async handleSpam(message: Message): Promise<void> {
    try {
      await message.delete();
      await this.logModerationAction(
        'Spam Detected',
        message.author,
        `Rapid message posting in ${message.channel}`,
        0xe74c3c
      );

      // Timeout user for 5 minutes
      if (message.member) {
        await message.member.timeout(5 * 60 * 1000, 'Spam detection');
      }

      logger.info('Spam detected and handled', {
        user: message.author.tag,
        channel: message.channel.id,
      });
    } catch (error) {
      logger.error('Error handling spam', error);
    }
  }

  private async handleSuspiciousLink(message: Message): Promise<void> {
    try {
      await message.delete();
      await this.logModerationAction(
        'Suspicious Link',
        message.author,
        `Posted blocked domain in ${message.channel}`,
        0xe74c3c
      );

      if ('send' in message.channel) {
        const warning = await message.channel.send(
          `${message.author}, your message was deleted because it contained a blocked link.`
        );

        setTimeout(() => warning.delete().catch(() => {}), 10000);
      }

      logger.info('Suspicious link removed', {
        user: message.author.tag,
        channel: message.channel.id,
      });
    } catch (error) {
      logger.error('Error handling suspicious link', error);
    }
  }

  private async handleSuspiciousPattern(message: Message): Promise<void> {
    try {
      await message.delete();
      await this.logModerationAction(
        'Suspicious Pattern',
        message.author,
        `Matched spam pattern in ${message.channel}`,
        0xf39c12
      );

      if ('send' in message.channel) {
        const warning = await message.channel.send(
          `${message.author}, your message was flagged by our spam filter. Please avoid promotional content.`
        );

        setTimeout(() => warning.delete().catch(() => {}), 10000);
      }

      logger.info('Suspicious pattern detected', {
        user: message.author.tag,
        channel: message.channel.id,
      });
    } catch (error) {
      logger.error('Error handling suspicious pattern', error);
    }
  }

  private async logModerationAction(
    action: string,
    user: any,
    reason: string,
    color: number
  ): Promise<void> {
    const moderationLogChannel = config.discord.channels.general; // Use general for now
    if (!moderationLogChannel) return;

    try {
      const channel = await this.client.channels.fetch(moderationLogChannel);
      if (!channel?.isTextBased()) return;

      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`🛡️ Moderation: ${action}`)
        .addFields(
          { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
          { name: 'Reason', value: reason }
        )
        .setTimestamp();

      await (channel as TextChannel).send({ embeds: [embed] });
    } catch (error) {
      logger.error('Failed to log moderation action', error);
    }
  }

  private async sendWelcomeMessage(member: GuildMember): Promise<void> {
    if (!config.discord.channels.welcome) return;

    try {
      const channel = await this.client.channels.fetch(config.discord.channels.welcome);
      if (!channel?.isTextBased()) return;

      const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle('👋 Welcome to OSSA!')
        .setDescription(`Welcome ${member}, we're glad to have you here!`)
        .addFields(
          { name: '📖 Get Started', value: 'Check out <#rules> and <#resources>' },
          { name: '💬 Introduce Yourself', value: 'Head to <#introductions> and say hi!' },
          { name: '❓ Need Help?', value: 'Visit <#help> for assistance' }
        )
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();

      await (channel as TextChannel).send({ embeds: [embed] });
    } catch (error) {
      logger.error('Failed to send welcome message', error);
    }
  }

  // Clean up spam tracker periodically
  startCleanup(): void {
    setInterval(
      () => {
        const now = Date.now();
        const timeout = 60000; // 1 minute

        for (const [userId, tracker] of Object.entries(this.spamTracker)) {
          if (now - tracker.lastMessage > timeout) {
            delete this.spamTracker[userId];
          }
        }
      },
      60000
    ); // Run every minute
  }
}
