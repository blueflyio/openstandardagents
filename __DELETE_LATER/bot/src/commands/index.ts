import { Client, REST, Routes, SlashCommandBuilder } from 'discord.js';
import { pingCommand } from './ping';
import { helpCommand } from './help';
import { aboutCommand } from './about';

export const commands = [
  pingCommand,
  helpCommand,
  aboutCommand,
];

export async function registerCommands(client: Client) {
  const rest = new REST().setToken(process.env.DISCORD_TOKEN!);
  
  try {
    console.log('🔄 Registering slash commands...');
    
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
      { body: commands.map(cmd => cmd.data.toJSON()) }
    );
    
    console.log('✅ Slash commands registered');
  } catch (error) {
    console.error('❌ Failed to register commands:', error);
    throw error;
  }
  
  // Setup command handler
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    
    const command = commands.find(cmd => cmd.data.name === interaction.commandName);
    if (!command) return;
    
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error executing ${interaction.commandName}:`, error);
      await interaction.reply({
        content: 'There was an error executing this command!',
        ephemeral: true,
      });
    }
  });
}
