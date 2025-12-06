import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

const execAsync = promisify(exec);

export const ossaValidateCommand = {
  data: new SlashCommandBuilder()
    .setName('ossa-validate')
    .setDescription('Validate an OSSA manifest')
    .addAttachmentOption(option =>
      option.setName('manifest')
        .setDescription('OSSA manifest file (.yaml or .json)')
        .setRequired(true)
    ),
    
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    
    const attachment = interaction.options.getAttachment('manifest', true);
    
    // Validate file type
    if (!attachment.name.endsWith('.yaml') && !attachment.name.endsWith('.yml') && !attachment.name.endsWith('.json')) {
      await interaction.editReply('❌ Invalid file type. Please upload a .yaml, .yml, or .json file.');
      return;
    }
    
    try {
      // Download manifest
      const response = await fetch(attachment.url);
      const content = await response.text();
      
      // Save to temp file
      const tempFile = join(tmpdir(), `ossa-${Date.now()}${attachment.name.endsWith('.json') ? '.json' : '.yaml'}`);
      await writeFile(tempFile, content);
      
      // Run OSSA CLI validation
      const { stdout, stderr } = await execAsync(`npx @bluefly/openstandardagents validate ${tempFile}`);
      
      // Clean up
      await unlink(tempFile);
      
      // Parse results
      const isValid = !stderr && stdout.includes('valid');
      
      const embed = new EmbedBuilder()
        .setColor(isValid ? 0x57F287 : 0xED4245)
        .setTitle(isValid ? '✅ Manifest Valid' : '❌ Validation Failed')
        .setDescription(`File: ${attachment.name}`)
        .addFields(
          { name: 'Result', value: isValid ? 'Manifest is valid OSSA v0.2.8' : 'Validation errors found' }
        );
      
      if (stderr) {
        embed.addFields({ name: 'Errors', value: `\`\`\`\n${stderr.slice(0, 1000)}\n\`\`\`` });
      }
      
      await interaction.editReply({ embeds: [embed] });
      
    } catch (error) {
      await interaction.editReply(`❌ Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
};
