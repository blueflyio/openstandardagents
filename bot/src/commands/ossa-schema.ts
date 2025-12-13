import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { OSSA_VERSION_TAG, OSSA_SCHEMA_URL } from '../config/version.js';

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
        { name: 'Version', value: OSSA_VERSION_TAG, inline: true },
        { name: 'Format', value: 'JSON Schema Draft 2020-12', inline: true },
        { name: 'Schema URL', value: `[Download Schema](${OSSA_SCHEMA_URL})` },
        { name: 'Documentation', value: '[View Docs](https://openstandardagents.org/specification)' },
        { name: 'Examples', value: '[Browse Examples](https://openstandardagents.org/examples)' }
      )
      .setFooter({ text: 'Use /ossa-validate to validate your manifests' })
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
  },
};
