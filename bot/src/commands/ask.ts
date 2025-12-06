import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { LLMRouter } from '../services/llm-router';

const llmRouter = new LLMRouter();

export const askCommand = {
  data: new SlashCommandBuilder()
    .setName('ask')
    .setDescription('Ask a question about OSSA')
    .addStringOption(option =>
      option.setName('question')
        .setDescription('Your question')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('provider')
        .setDescription('LLM provider (auto-selected if not specified)')
        .addChoices(
          { name: 'Auto', value: 'auto' },
          { name: 'Claude', value: 'claude' },
          { name: 'GPT', value: 'gpt' }
        )
    ),
    
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    
    const question = interaction.options.getString('question', true);
    const provider = (interaction.options.getString('provider') || 'auto') as 'auto' | 'claude' | 'gpt';
    
    try {
      const answer = await llmRouter.ask(question, provider);
      
      await interaction.editReply({
        content: `**Q:** ${question}\n\n**A:** ${answer}\n\n*Powered by ${provider === 'auto' ? 'Auto-routed' : provider}*`
      });
      
    } catch (error) {
      await interaction.editReply(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
};
