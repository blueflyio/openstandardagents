import { Client, Message, GuildMember, EmbedBuilder } from 'discord.js';

interface ModerationRule {
  name: string;
  check: (message: Message) => boolean;
  action: 'warn' | 'delete' | 'timeout';
  duration?: number;
}

export class ModerationService {
  private client: Client;
  private rules: ModerationRule[];
  private warnings: Map<string, number> = new Map();
  
  constructor(client: Client) {
    this.client = client;
    this.rules = [
      {
        name: 'Spam Detection',
        check: (msg) => this.isSpam(msg),
        action: 'delete'
      },
      {
        name: 'Excessive Caps',
        check: (msg) => this.hasExcessiveCaps(msg),
        action: 'warn'
      },
      {
        name: 'Link Spam',
        check: (msg) => this.isLinkSpam(msg),
        action: 'delete'
      }
    ];
  }
  
  start() {
    this.client.on('messageCreate', async (message) => {
      if (message.author.bot) return;
      if (!message.guild) return;
      
      await this.moderateMessage(message);
    });
    
    console.log('✅ Moderation service started');
  }
  
  private async moderateMessage(message: Message) {
    for (const rule of this.rules) {
      if (rule.check(message)) {
        await this.executeAction(message, rule);
        break;
      }
    }
  }
  
  private async executeAction(message: Message, rule: ModerationRule) {
    const userId = message.author.id;
    
    switch (rule.action) {
      case 'delete':
        await message.delete();
        await this.sendModLog(message, rule, 'Message deleted');
        break;
        
      case 'warn':
        const warnings = (this.warnings.get(userId) || 0) + 1;
        this.warnings.set(userId, warnings);
        
        await message.reply(`⚠️ Warning: ${rule.name}. This is warning ${warnings}/3.`);
        
        if (warnings >= 3) {
          await this.timeoutUser(message.member!, 10 * 60 * 1000); // 10 min
          this.warnings.delete(userId);
        }
        break;
        
      case 'timeout':
        await this.timeoutUser(message.member!, rule.duration || 5 * 60 * 1000);
        await this.sendModLog(message, rule, 'User timed out');
        break;
    }
  }
  
  private async timeoutUser(member: GuildMember, duration: number) {
    await member.timeout(duration, 'Auto-moderation');
  }
  
  private async sendModLog(message: Message, rule: ModerationRule, action: string) {
    const logChannel = message.guild?.channels.cache.find(ch => ch.name === 'mod-logs');
    if (!logChannel || !logChannel.isTextBased()) return;
    
    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('🛡️ Auto-Moderation Action')
      .addFields(
        { name: 'Rule', value: rule.name, inline: true },
        { name: 'Action', value: action, inline: true },
        { name: 'User', value: `${message.author.tag} (${message.author.id})` },
        { name: 'Channel', value: `<#${message.channel.id}>` },
        { name: 'Content', value: message.content.slice(0, 200) }
      )
      .setTimestamp();
    
    await logChannel.send({ embeds: [embed] });
  }
  
  private isSpam(message: Message): boolean {
    // Check for repeated characters
    const repeatedChars = /(.)\1{10,}/;
    return repeatedChars.test(message.content);
  }
  
  private hasExcessiveCaps(message: Message): boolean {
    if (message.content.length < 10) return false;
    const caps = message.content.replace(/[^A-Z]/g, '').length;
    const ratio = caps / message.content.length;
    return ratio > 0.7;
  }
  
  private isLinkSpam(message: Message): boolean {
    const links = message.content.match(/https?:\/\/[^\s]+/g);
    return (links?.length || 0) > 3;
  }
}
