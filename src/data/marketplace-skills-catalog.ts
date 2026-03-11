/**
 * Bundled Bluefly marketplace skills catalog for OSSA wizard and CLI.
 * Single source: agent-buildkit config-templates/marketplace-skills-catalog.json.
 * Used when BLUEFLY_SKILLS_CATALOG is not set and wizard "Install from catalog" is chosen.
 */

export const marketplaceSkillsCatalog = {
  description:
    'Curated skills for OSSA marketplace / AgentSkills. Install with: ossa skills add <repo> --skill <name> --path <skills-dir>',
  skillsPath: process.env.OSSA_SKILLS_PATH || '',
  skills: [
    {
      repo: 'https://github.com/anthropics/skills',
      skill: 'mcp-builder',
      priority: 1,
    },
    {
      repo: 'https://github.com/anthropics/skills',
      skill: 'webapp-testing',
      priority: 2,
    },
    {
      repo: 'https://github.com/anthropics/skills',
      skill: 'skill-creator',
      priority: 3,
    },
    {
      repo: 'https://github.com/obra/superpowers',
      skill: 'systematic-debugging',
      priority: 4,
    },
    {
      repo: 'https://github.com/obra/superpowers',
      skill: 'test-driven-development',
      priority: 5,
    },
    {
      repo: 'https://github.com/obra/superpowers',
      skill: 'dispatching-parallel-agents',
      priority: 6,
    },
    {
      repo: 'https://github.com/obra/superpowers',
      skill: 'using-git-worktrees',
      priority: 7,
    },
    {
      repo: 'https://github.com/obra/superpowers',
      skill: 'subagent-driven-development',
      priority: 8,
    },
    {
      repo: 'https://github.com/obra/superpowers',
      skill: 'finishing-a-development-branch',
      priority: 9,
    },
    {
      repo: 'https://github.com/obra/superpowers',
      skill: 'requesting-code-review',
      priority: 10,
    },
    {
      repo: 'https://github.com/obra/superpowers',
      skill: 'receiving-code-review',
      priority: 11,
    },
    {
      repo: 'https://github.com/obra/superpowers',
      skill: 'verification-before-completion',
      priority: 12,
    },
    {
      repo: 'https://github.com/sparkfabrik/sf-awesome-copilot',
      skill: 'drupal-cache-maxage',
      priority: 20,
    },
    {
      repo: 'https://github.com/sparkfabrik/sf-awesome-copilot',
      skill: 'drupal-cache-contexts',
      priority: 21,
    },
    {
      repo: 'https://github.com/sparkfabrik/sf-awesome-copilot',
      skill: 'drupal-lazy-builders',
      priority: 22,
    },
    {
      repo: 'https://github.com/sparkfabrik/sf-awesome-copilot',
      skill: 'drupal-cache-debugging',
      priority: 23,
    },
    {
      repo: 'https://github.com/madsnorgaard/agent-resources',
      skill: 'drupal-expert',
      priority: 30,
    },
    {
      repo: 'https://github.com/madsnorgaard/agent-resources',
      skill: 'drupal-security',
      priority: 31,
    },
    {
      repo: 'https://github.com/madsnorgaard/agent-resources',
      skill: 'drupal-migration',
      priority: 32,
    },
    {
      repo: 'https://github.com/grasmash/drupal-claude-skills',
      skill: 'drupal-config-mgmt',
      priority: 40,
    },
    {
      repo: 'https://github.com/grasmash/drupal-claude-skills',
      skill: 'drupal-at-your-fingertips',
      priority: 41,
    },
    {
      repo: 'https://github.com/grasmash/drupal-claude-skills',
      skill: 'drupal-contrib-mgmt',
      priority: 42,
    },
    {
      repo: 'https://github.com/grasmash/drupal-claude-skills',
      skill: 'drupal-ddev',
      priority: 43,
    },
    {
      repo: 'https://github.com/wshobson/agents',
      skill: 'architecture-patterns',
      priority: 50,
    },
    {
      repo: 'https://github.com/wshobson/agents',
      skill: 'api-design-principles',
      priority: 51,
    },
    {
      repo: 'https://github.com/wshobson/agents',
      skill: 'security-requirement-extraction',
      priority: 52,
    },
    {
      repo: 'https://github.com/wshobson/agents',
      skill: 'accessibility-compliance',
      priority: 53,
    },
  ],
} as const;
