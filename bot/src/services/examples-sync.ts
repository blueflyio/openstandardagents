import { Client, TextChannel, EmbedBuilder } from 'discord.js';

interface Example {
  title: string;
  description: string;
  category: string;
  url: string;
  manifest_url: string;
}

export class ExamplesSyncService {
  private client: Client;
  private channelId: string;
  private syncInterval: NodeJS.Timeout | null = null;
  
  constructor(client: Client, channelId: string) {
    this.client = client;
    this.channelId = channelId;
  }
  
  async start() {
    console.log('🔄 Starting examples sync service...');
    
    // Initial sync
    await this.syncExamples();
    
    // Sync every 6 hours
    this.syncInterval = setInterval(() => this.syncExamples(), 6 * 60 * 60 * 1000);
    
    console.log('✅ Examples sync service started');
  }
  
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
  
  private async syncExamples() {
    try {
      console.log('📥 Fetching examples from openstandardagents.org...');
      
      const response = await fetch('https://openstandardagents.org/api/examples.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const examples: Example[] = await response.json();
      
      const channel = await this.client.channels.fetch(this.channelId) as TextChannel;
      if (!channel) throw new Error('Examples channel not found');
      
      // Group by category
      const byCategory = examples.reduce((acc, ex) => {
        if (!acc[ex.category]) acc[ex.category] = [];
        acc[ex.category].push(ex);
        return acc;
      }, {} as Record<string, Example[]>);
      
      // Post each category
      for (const [category, items] of Object.entries(byCategory)) {
        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle(`📚 ${category}`)
          .setDescription(`${items.length} example${items.length > 1 ? 's' : ''}`)
          .setTimestamp();
        
        items.slice(0, 10).forEach(ex => {
          embed.addFields({
            name: ex.title,
            value: `${ex.description}\n[View](${ex.url}) | [Manifest](${ex.manifest_url})`
          });
        });
        
        await channel.send({ embeds: [embed] });
      }
      
      console.log(`✅ Synced ${examples.length} examples`);
      
    } catch (error) {
      console.error('❌ Failed to sync examples:', error);
    }
  }
}
