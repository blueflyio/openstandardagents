import { CommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { validator } from '../utils/ossa-validator';
import logger from '../utils/logger';

export const data = new SlashCommandBuilder()
  .setName('spec')
  .setDescription('Look up OSSA specification sections')
  .addStringOption((option) =>
    option
      .setName('field')
      .setDescription('Manifest field to look up (e.g., "name", "capabilities", "runtime.engine")')
      .setRequired(false)
  )
  .addStringOption((option) =>
    option
      .setName('section')
      .setDescription('Specification section')
      .setRequired(false)
      .addChoices(
        { name: 'Overview', value: 'overview' },
        { name: 'Manifest Structure', value: 'manifest' },
        { name: 'Agent Types', value: 'types' },
        { name: 'Capabilities', value: 'capabilities' },
        { name: 'Communication', value: 'communication' },
        { name: 'Runtime', value: 'runtime' }
      )
  );

export async function execute(interaction: CommandInteraction): Promise<void> {
  if (!interaction.isChatInputCommand()) return;

  const field = interaction.options.getString('field') || undefined;
  const section = interaction.options.getString('section') || undefined;

  logger.info('Spec command executed', { field, section, user: interaction.user.tag });

  if (field) {
    await handleFieldLookup(interaction, field);
  } else if (section) {
    await handleSectionLookup(interaction, section);
  } else {
    await handleOverview(interaction);
  }
}

async function handleFieldLookup(interaction: CommandInteraction, field: string): Promise<void> {
  const description = validator.getFieldDescription(field);

  if (!description) {
    await interaction.reply({
      content: `Field "${field}" not found in OSSA specification. Try: name, version, type, capabilities, runtime, communication, dependencies, metadata`,
      ephemeral: true,
    });
    return;
  }

  const schema = validator.getSchemaForField(field);
  const embed = new EmbedBuilder()
    .setTitle(`📖 OSSA Spec: ${field}`)
    .setDescription(description)
    .setColor(0x0099ff);

  if (schema) {
    if (schema.type) {
      embed.addFields({ name: 'Type', value: `\`${schema.type}\``, inline: true });
    }
    if (schema.enum) {
      embed.addFields({ name: 'Allowed Values', value: schema.enum.map((v: string) => `\`${v}\``).join(', ') });
    }
    if (schema.pattern) {
      embed.addFields({ name: 'Pattern', value: `\`${schema.pattern}\`` });
    }
    if (schema.required) {
      embed.addFields({ name: 'Required', value: 'Yes', inline: true });
    }
  }

  embed.addFields({
    name: 'Documentation',
    value: '[Full OSSA Specification](https://openstandardagents.org/spec)',
  });

  await interaction.reply({ embeds: [embed] });
}

async function handleSectionLookup(interaction: CommandInteraction, section: string): Promise<void> {
  const sections: { [key: string]: { title: string; description: string; fields: string } } = {
    overview: {
      title: 'OSSA Overview',
      description:
        'Open Standard for Agent Systems (OSSA) defines interoperable agent architectures with standardized manifests, communication protocols, and execution environments.',
      fields: 'Key concepts: Agents, Manifests, Capabilities, Communication',
    },
    manifest: {
      title: 'Manifest Structure',
      description: 'Every OSSA agent has a manifest.json file defining its identity, capabilities, and requirements.',
      fields:
        'Required: `name`, `version`, `ossa_version`, `type`, `capabilities`\nOptional: `description`, `runtime`, `communication`, `dependencies`, `metadata`',
    },
    types: {
      title: 'Agent Types',
      description: 'OSSA defines three agent types based on execution patterns.',
      fields:
        '**Worker**: Executes tasks, stateless, no sub-agents\n**Supervisor**: Coordinates other agents, stateful\n**Hybrid**: Can execute tasks AND coordinate agents',
    },
    capabilities: {
      title: 'Capabilities',
      description: 'Capabilities define what an agent can do. Each capability has a name, description, and schema.',
      fields:
        'Structure: `{ name, description, parameters?, returns? }`\nExample: `{ name: "parse-json", description: "Parse JSON", parameters: {...}, returns: {...} }`',
    },
    communication: {
      title: 'Communication Protocols',
      description: 'Agents can communicate via multiple protocols.',
      fields:
        'Supported: `http`, `grpc`, `websocket`, `stdio`, `message-queue`\nDefine endpoints and formats in manifest',
    },
    runtime: {
      title: 'Runtime Configuration',
      description: 'Specifies how the agent executes.',
      fields:
        'Engines: `node`, `python`, `docker`, `bash`\nDefine version, entrypoint, and environment requirements',
    },
  };

  const info = sections[section];
  if (!info) {
    await interaction.reply({ content: 'Section not found.', ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`📖 ${info.title}`)
    .setDescription(info.description)
    .setColor(0x0099ff)
    .addFields({ name: 'Details', value: info.fields })
    .addFields({
      name: 'Documentation',
      value: '[Full OSSA Specification](https://openstandardagents.org/spec)',
    });

  await interaction.reply({ embeds: [embed] });
}

async function handleOverview(interaction: CommandInteraction): Promise<void> {
  const embed = new EmbedBuilder()
    .setTitle('📖 OSSA Specification Reference')
    .setDescription(
      'Open Standard for Agent Systems - defining interoperable, composable agent architectures.\n\nUse `/spec field:<name>` to look up manifest fields or `/spec section:<name>` for specification sections.'
    )
    .setColor(0x0099ff)
    .addFields(
      {
        name: '📋 Quick Examples',
        value: '`/spec field:name`\n`/spec field:capabilities`\n`/spec section:types`',
      },
      {
        name: '🔗 Resources',
        value:
          '[Specification](https://openstandardagents.org/spec)\n[Examples](https://openstandardagents.org/examples)\n[GitHub](https://github.com/openstandardagents)',
      }
    );

  await interaction.reply({ embeds: [embed] });
}
