import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const aboutCommand = {
  data: new SlashCommandBuilder()
    .setName('about')
    .setDescription('Learn about OSSA and this bot'),
    
  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle('About Open Standard Agents (OSSA)')
      .setDescription(
        'OSSA is a vendor-neutral specification for multi-agent systems. ' +
        'Write once, deploy anywhere.'
      )
      .addFields(
        { name: 'Website', value: 'https://openstandardagents.org' },
        { name: 'Specification', value: 'https://openstandardagents.org/specification' },
        { name: 'Examples', value: 'https://openstandardagents.org/examples' },
        { name: 'Version', value: 'v0.2.8' }
      )
      .setFooter({ text: 'Built with OSSA' })
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
  },
};
