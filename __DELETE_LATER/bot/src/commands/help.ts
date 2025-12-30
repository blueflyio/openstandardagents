import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const helpCommand = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show available commands'),
    
  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('OSSA Bot Commands')
      .setDescription('Available commands for the Open Standard Agents bot')
      .addFields(
        { name: '/ping', value: 'Check bot latency and status' },
        { name: '/help', value: 'Show this help message' },
        { name: '/about', value: 'Learn about OSSA and this bot' }
      )
      .setFooter({ text: 'More commands coming soon!' })
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
  },
};
