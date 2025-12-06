import { Client, TextChannel, EmbedBuilder } from 'discord.js';
import express from 'express';

export class DevOpsWebhookService {
  private client: Client;
  private channelId: string;
  private app: express.Application;
  private server: any;
  
  constructor(client: Client, channelId: string) {
    this.client = client;
    this.channelId = channelId;
    this.app = express();
    this.app.use(express.json());
  }
  
  async start(port: number = 3000) {
    // GitLab webhook
    this.app.post('/webhook/gitlab', async (req, res) => {
      try {
        await this.handleGitLabWebhook(req.body);
        res.status(200).send('OK');
      } catch (error) {
        console.error('GitLab webhook error:', error);
        res.status(500).send('Error');
      }
    });
    
    // GitHub webhook
    this.app.post('/webhook/github', async (req, res) => {
      try {
        await this.handleGitHubWebhook(req.body);
        res.status(200).send('OK');
      } catch (error) {
        console.error('GitHub webhook error:', error);
        res.status(500).send('Error');
      }
    });
    
    this.server = this.app.listen(port, () => {
      console.log(`✅ DevOps webhook server listening on port ${port}`);
    });
  }
  
  stop() {
    if (this.server) {
      this.server.close();
    }
  }
  
  private async handleGitLabWebhook(payload: any) {
    const channel = await this.client.channels.fetch(this.channelId) as TextChannel;
    if (!channel) return;
    
    const objectKind = payload.object_kind;
    
    if (objectKind === 'pipeline') {
      const status = payload.object_attributes.status;
      const ref = payload.object_attributes.ref;
      const url = payload.object_attributes.url;
      
      const color = status === 'success' ? 0x57F287 : status === 'failed' ? 0xED4245 : 0xFEE75C;
      const emoji = status === 'success' ? '✅' : status === 'failed' ? '❌' : '🔄';
      
      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`${emoji} Pipeline ${status}`)
        .setDescription(`Branch: \`${ref}\``)
        .addFields(
          { name: 'Project', value: payload.project.name, inline: true },
          { name: 'Status', value: status, inline: true }
        )
        .setURL(url)
        .setTimestamp();
      
      await channel.send({ embeds: [embed] });
    }
    
    if (objectKind === 'tag_push') {
      const tag = payload.ref.replace('refs/tags/', '');
      const url = payload.project.web_url;
      
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`🏷️ New Release: ${tag}`)
        .setDescription(payload.project.name)
        .setURL(`${url}/-/tags/${tag}`)
        .setTimestamp();
      
      await channel.send({ embeds: [embed] });
    }
  }
  
  private async handleGitHubWebhook(payload: any) {
    const channel = await this.client.channels.fetch(this.channelId) as TextChannel;
    if (!channel) return;
    
    // GitHub release
    if (payload.action === 'published' && payload.release) {
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`🚀 ${payload.release.name || payload.release.tag_name}`)
        .setDescription(payload.repository.full_name)
        .addFields(
          { name: 'Tag', value: payload.release.tag_name, inline: true },
          { name: 'Author', value: payload.release.author.login, inline: true }
        )
        .setURL(payload.release.html_url)
        .setTimestamp();
      
      await channel.send({ embeds: [embed] });
    }
  }
}
