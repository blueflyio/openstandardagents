import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const ossaExamplesCommand = {
  data: new SlashCommandBuilder()
    .setName('ossa-examples')
    .setDescription('Browse OSSA manifest examples'),
    
  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setColor(0xFEE75C)
      .setTitle('OSSA Manifest Examples')
      .setDescription('Example manifests to get started with OSSA')
      .addFields(
        { 
          name: 'Getting Started', 
          value: '[Hello World](https://openstandardagents.org/examples/getting-started/hello-world)\n' +
                 '[Basic Agent](https://openstandardagents.org/examples/getting-started/basic-agent)'
        },
        { 
          name: 'CI/CD Integration', 
          value: '[GitLab CI](https://openstandardagents.org/examples/ci-cd/gitlab-ci)\n' +
                 '[GitHub Actions](https://openstandardagents.org/examples/ci-cd/github-actions)'
        },
        { 
          name: 'Multi-Agent Systems', 
          value: '[Team Coordination](https://openstandardagents.org/examples/multi-agent/team)\n' +
                 '[Workflow Orchestration](https://openstandardagents.org/examples/multi-agent/workflow)'
        },
        {
          name: 'Browse All',
          value: '[View All Examples](https://openstandardagents.org/examples)'
        }
      )
      .setFooter({ text: 'Check #examples channel for auto-synced examples' })
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
  },
};
