import {
  SlashCommandBuilder,
  CommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { llmRouter } from '../utils/llm-router';
import logger from '../utils/logger';

export const data = new SlashCommandBuilder()
  .setName('ask')
  .setDescription('Ask a question about OSSA (powered by AI)')
  .addStringOption((option: any) =>
    option
      .setName('question')
      .setDescription('Your question about OSSA')
      .setRequired(true)
  )
  .addStringOption((option: any) =>
    option
      .setName('provider')
      .setDescription('LLM provider to use')
      .addChoices(
        { name: 'Claude (Anthropic)', value: 'anthropic' },
        { name: 'GPT (OpenAI)', value: 'openai' }
      )
  );

export async function execute(interaction: CommandInteraction): Promise<void> {
  await interaction.deferReply();

  if (!interaction.isChatInputCommand()) return;

  const question = interaction.options.getString('question', true);
  const provider = interaction.options.getString('provider') as 'anthropic' | 'openai' | undefined;

  try {
    // Get relevant OSSA context
    const context = await llmRouter.getOSSAContext(question);

    // Ask the LLM
    const response = await llmRouter.ask(question, context, provider);

    // Truncate if response is too long for Discord (2000 char limit)
    let answer = response.answer;
    if (answer.length > 1900) {
      answer = answer.substring(0, 1900) + '...\n\n*Response truncated*';
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🤖 OSSA Assistant')
      .setDescription(answer)
      .addFields(
        { name: 'Question', value: question },
        { name: 'Provider', value: `${response.provider} (${response.model})`, inline: true }
      )
      .setFooter({
        text: 'AI-generated response. Always verify with official documentation.',
      })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    logger.info('LLM query processed', {
      question,
      provider: response.provider,
      model: response.model,
      user: interaction.user.tag,
    });
  } catch (error) {
    logger.error('Error processing /ask command', error);
    await interaction.editReply({
      content: 'Sorry, I encountered an error while processing your question. The LLM service may not be configured or available.',
    });
  }
}
