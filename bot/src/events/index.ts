import { Client, Events } from 'discord.js';

export function setupEventHandlers(client: Client) {
  // Error handling
  client.on(Events.Error, (error) => {
    console.error('Discord client error:', error);
  });
  
  // Guild join
  client.on(Events.GuildCreate, (guild) => {
    console.log(`✅ Joined guild: ${guild.name} (${guild.id})`);
  });
  
  // Guild leave
  client.on(Events.GuildDelete, (guild) => {
    console.log(`❌ Left guild: ${guild.name} (${guild.id})`);
  });
  
  // Interaction errors
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    console.log(`Command: ${interaction.commandName} by ${interaction.user.tag}`);
  });
}
