import {
  SlashCommandBuilder,
  CommandInteraction,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
} from 'discord.js';
import logger from '../utils/logger';

export const data = new SlashCommandBuilder()
  .setName('bootstrap')
  .setDescription('Bootstrap the Discord server with OSSA channels and roles')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

interface ChannelStructure {
  category: string;
  channels: Array<{
    name: string;
    type: ChannelType;
    description?: string;
  }>;
}

const SERVER_STRUCTURE: ChannelStructure[] = [
  {
    category: 'INFORMATION',
    channels: [
      { name: 'welcome', type: ChannelType.GuildText, description: 'Welcome to OSSA!' },
      { name: 'announcements', type: ChannelType.GuildText, description: 'Official announcements' },
      { name: 'rules', type: ChannelType.GuildText, description: 'Server rules and guidelines' },
      { name: 'resources', type: ChannelType.GuildText, description: 'Helpful resources and links' },
    ],
  },
  {
    category: 'COMMUNITY',
    channels: [
      { name: 'general', type: ChannelType.GuildText, description: 'General discussion' },
      { name: 'introductions', type: ChannelType.GuildText, description: 'Introduce yourself!' },
      { name: 'showcase', type: ChannelType.GuildText, description: 'Show off your OSSA agents' },
      { name: 'examples', type: ChannelType.GuildText, description: 'Example agents and implementations' },
    ],
  },
  {
    category: 'DEVELOPMENT',
    channels: [
      { name: 'dev-discussion', type: ChannelType.GuildText, description: 'Development discussions' },
      { name: 'spec-feedback', type: ChannelType.GuildText, description: 'OSSA specification feedback' },
      { name: 'pull-requests', type: ChannelType.GuildText, description: 'PR notifications' },
      { name: 'deployments', type: ChannelType.GuildText, description: 'Deployment notifications' },
      { name: 'dev-voice', type: ChannelType.GuildVoice, description: 'Voice chat for developers' },
    ],
  },
  {
    category: 'SUPPORT',
    channels: [
      { name: 'help', type: ChannelType.GuildText, description: 'Get help with OSSA' },
      { name: 'bugs', type: ChannelType.GuildText, description: 'Report bugs' },
      { name: 'feature-requests', type: ChannelType.GuildText, description: 'Request new features' },
    ],
  },
];

const ROLE_HIERARCHY = [
  { name: 'Admin', color: 0xe74c3c, permissions: ['Administrator'] },
  { name: 'Moderator', color: 0x3498db, permissions: ['ManageMessages', 'KickMembers', 'BanMembers'] },
  { name: 'Contributor', color: 0x2ecc71, permissions: [] },
  { name: 'Developer', color: 0x9b59b6, permissions: [] },
  { name: 'Community', color: 0x95a5a6, permissions: [] },
];

export async function execute(interaction: CommandInteraction): Promise<void> {
  if (!interaction.isChatInputCommand()) return;

  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild;
  if (!guild) {
    await interaction.editReply('This command can only be used in a server.');
    return;
  }

  try {
    const results = {
      categories: 0,
      channels: 0,
      roles: 0,
      errors: [] as string[],
    };

    // Create roles
    logger.info('Creating roles...');
    for (const roleConfig of ROLE_HIERARCHY) {
      try {
        const existingRole = guild.roles.cache.find((r) => r.name === roleConfig.name);
        if (!existingRole) {
          await guild.roles.create({
            name: roleConfig.name,
            color: roleConfig.color,
            reason: 'OSSA server bootstrap',
          });
          results.roles++;
          logger.info(`Created role: ${roleConfig.name}`);
        }
      } catch (error) {
        const errorMsg = `Failed to create role ${roleConfig.name}`;
        logger.error(errorMsg, error);
        results.errors.push(errorMsg);
      }
    }

    // Create categories and channels
    logger.info('Creating categories and channels...');
    for (const structure of SERVER_STRUCTURE) {
      try {
        // Create category
        let category = guild.channels.cache.find(
          (c) => c.name === structure.category && c.type === ChannelType.GuildCategory
        );

        if (!category) {
          category = await guild.channels.create({
            name: structure.category,
            type: ChannelType.GuildCategory,
            reason: 'OSSA server bootstrap',
          });
          results.categories++;
          logger.info(`Created category: ${structure.category}`);
        }

        // Create channels in category
        for (const channelConfig of structure.channels) {
          try {
            const existingChannel = guild.channels.cache.find(
              (c) => c.name === channelConfig.name && c.parentId === category?.id
            );

            if (!existingChannel) {
              const createOptions: {
                name: string;
                type: ChannelType.GuildText | ChannelType.GuildVoice | ChannelType.GuildCategory;
                parent?: string;
                reason: string;
                topic?: string;
              } = {
                name: channelConfig.name,
                type: channelConfig.type as ChannelType.GuildText | ChannelType.GuildVoice | ChannelType.GuildCategory,
                parent: category?.id,
                reason: 'OSSA server bootstrap',
              };

              if (channelConfig.description && channelConfig.type === ChannelType.GuildText) {
                createOptions.topic = channelConfig.description;
              }

              await guild.channels.create(createOptions);
              results.channels++;
              logger.info(`Created channel: ${channelConfig.name}`);
            }
          } catch (error) {
            const errorMsg = `Failed to create channel ${channelConfig.name}`;
            logger.error(errorMsg, error);
            results.errors.push(errorMsg);
          }
        }
      } catch (error) {
        const errorMsg = `Failed to create category ${structure.category}`;
        logger.error(errorMsg, error);
        results.errors.push(errorMsg);
      }
    }

    // Build response
    const embed = new EmbedBuilder()
      .setColor(results.errors.length > 0 ? 0xffa500 : 0x00ff00)
      .setTitle('🚀 Server Bootstrap Complete')
      .setDescription('OSSA server structure has been set up!')
      .addFields(
        { name: 'Categories Created', value: results.categories.toString(), inline: true },
        { name: 'Channels Created', value: results.channels.toString(), inline: true },
        { name: 'Roles Created', value: results.roles.toString(), inline: true }
      )
      .setTimestamp();

    if (results.errors.length > 0) {
      embed.addFields({
        name: '⚠️ Errors',
        value: results.errors.join('\n').substring(0, 1024),
      });
    }

    embed.addFields({
      name: 'Next Steps',
      value: '1. Configure channel permissions\n2. Set up welcome messages\n3. Configure webhook channels in .env\n4. Assign roles to team members',
    });

    await interaction.editReply({ embeds: [embed] });

    logger.info('Server bootstrap completed', results);
  } catch (error) {
    logger.error('Error during server bootstrap', error);
    await interaction.editReply({
      content: 'An error occurred during server bootstrap. Check logs for details.',
    });
  }
}
