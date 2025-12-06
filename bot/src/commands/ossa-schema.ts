import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const ossaSchemaCommand = {
  data: new SlashCommandBuilder()
    .setName('ossa-schema')
    .setDescription('Get OSSA JSON Schema information'),
    
  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('OSSA JSON Schema')
      .setDescription('Current OSSA specification schema')
      .addFields(
        { name: 'Version', value: 'v0.2.8', inline: true },
        { name: 'Format', value: 'JSON Schema Draft 2020-12', inline: true },
        { name: 'Schema URL', value: '[Download Schema](https://openstandardagents.org/schema/v0.2.8/ossa-0.2.8.schema.json)' },
        { name: 'Documentation', value: '[View Docs](https://openstandardagents.org/specification)' },
        { name: 'Examples', value: '[Browse Examples](https://openstandardagents.org/examples)' }
      )
      .setFooter({ text: 'Use /ossa-validate to validate your manifests' })
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
  },
};
