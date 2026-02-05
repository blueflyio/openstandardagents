/**
 * Step 4a: Agent Persona Configuration
 * Configures personality, communication style, expertise, and decision boundaries
 *
 * Based on research from Anthropic and arxiv.org/pdf/2601.23228:
 * - Role-based personas with skill levels and learning goals
 * - Decision boundaries define autonomous actions vs. approval required
 * - Context engineering for focused agent behavior
 * - Process rewards and reasoning transparency
 */

import inquirer from 'inquirer';
import { WizardState } from '../types.js';
import { console_ui } from '../ui/console.js';
import { ValidationBuilder } from '../../utils/validation-builder.js';
import type {
  PersonalitySpec,
  TonePreset,
  ExpertiseDomain,
  ExpertiseLevel,
  BehavioralTraits,
} from '../../../types/personality.js';

/**
 * Configure agent persona step
 */
export async function configurePersonaStep(
  state: WizardState
): Promise<WizardState> {
  console_ui.step(5, state.totalSteps, 'Agent Persona & Personality');

  console_ui.info(
    '🎭 Define how your agent communicates and behaves.\n   This makes agents feel like real team members with distinct personalities.'
  );

  // Ask if user wants to configure persona (optional)
  const { configurePersona } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'configurePersona',
      message: 'Configure agent persona and personality?',
      default: true,
    },
  ]);

  if (!configurePersona) {
    console_ui.info('Skipping persona configuration (can be added later)');
    return state;
  }

  // Step 1: Role and Identity
  const roleAnswers = await inquirer.prompt([
    {
      type: 'input',
      name: 'roleDescription',
      message:
        'Agent role (e.g., "Senior DevOps Engineer", "Junior Frontend Developer"):',
      validate: ValidationBuilder.required('Role description'),
    },
    {
      type: 'input',
      name: 'tagline',
      message: 'Tagline/motto (optional, e.g., "Automate everything"):',
    },
  ]);

  // Step 2: Communication Tone
  const toneChoices: { name: string; value: TonePreset }[] = [
    { name: 'Professional - Formal and business-like', value: 'professional' },
    { name: 'Friendly - Warm and approachable', value: 'friendly' },
    { name: 'Technical - Detail-oriented and precise', value: 'technical' },
    { name: 'Concise - Brief and to the point', value: 'concise' },
    { name: 'Empathetic - Understanding and supportive', value: 'empathetic' },
    { name: 'Formal - Strictly professional', value: 'formal' },
    { name: 'Casual - Relaxed and informal', value: 'casual' },
  ];

  const toneAnswers = await inquirer.prompt([
    {
      type: 'list',
      name: 'tone',
      message: 'Communication tone:',
      choices: toneChoices,
      default: 'professional',
    },
  ]);

  // Step 3: Expertise Domains
  const expertiseDomains: ExpertiseDomain[] = [
    'software-development',
    'frontend',
    'backend',
    'fullstack',
    'devops',
    'sre',
    'security',
    'testing',
    'typescript',
    'javascript',
    'python',
    'go',
    'kubernetes',
    'terraform',
    'machine-learning',
    'llm',
    'agents',
    'api-design',
    'database',
    'cicd',
    'observability',
  ];

  const expertiseAnswers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'expertiseDomains',
      message: 'Select expertise domains (use space to select):',
      choices: expertiseDomains.map((domain) => ({
        name: domain,
        value: domain,
        checked: false,
      })),
      validate: (input: string[]) => {
        if (input.length === 0) {
          return 'Select at least one expertise domain';
        }
        if (input.length > 5) {
          return 'Select up to 5 domains (agents should be focused)';
        }
        return true;
      },
    },
  ]);

  // Step 4: Proficiency Levels for Selected Domains
  const expertiseEntries = [];
  for (const domain of expertiseAnswers.expertiseDomains) {
    const { level } = await inquirer.prompt([
      {
        type: 'list',
        name: 'level',
        message: `Proficiency level for ${domain}:`,
        choices: [
          { name: 'Beginner - Learning the basics', value: 'beginner' },
          { name: 'Intermediate - Working knowledge', value: 'intermediate' },
          { name: 'Advanced - Deep expertise', value: 'advanced' },
          { name: 'Expert - Industry-leading knowledge', value: 'expert' },
        ],
        default: 'intermediate',
      },
    ]);

    expertiseEntries.push({ domain, level });
  }

  // Step 5: Decision Boundaries (Key for agent autonomy)
  console_ui.info(
    '\n🎯 Decision Boundaries define what your agent can do autonomously vs. requiring approval.'
  );

  const autonomousActions = [
    'read_code - Read and analyze code',
    'run_tests - Execute tests',
    'generate_code - Create new code',
    'update_docs - Modify documentation',
    'format_code - Apply formatting',
    'analyze_logs - Examine logs and metrics',
    'suggest_improvements - Provide recommendations',
  ];

  const requiresApprovalActions = [
    'db_migration - Database schema changes',
    'breaking_changes - API or interface changes',
    'security_changes - Security-related modifications',
    'deploy - Deploy to production',
    'delete_data - Delete or purge data',
    'external_api_calls - Call external services',
    'create_issues - Create tickets or issues',
  ];

  const boundariesAnswers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'autonomousActions',
      message: 'What can the agent do autonomously? (no approval needed)',
      choices: autonomousActions,
      default: ['read_code', 'run_tests', 'analyze_logs'],
    },
    {
      type: 'checkbox',
      name: 'requiresApproval',
      message: 'What requires human approval?',
      choices: requiresApprovalActions,
      default: [
        'db_migration',
        'breaking_changes',
        'security_changes',
        'deploy',
      ],
    },
  ]);

  // Clean action strings (remove descriptions)
  const cleanActions = (actions: string[]): string[] =>
    actions.map((a) => a.split(' - ')[0]);

  // Step 6: Behavioral Traits
  const traitsAnswers = await inquirer.prompt([
    {
      type: 'list',
      name: 'uncertainty_handling',
      message: 'How should the agent handle uncertainty?',
      choices: [
        { name: 'Acknowledge - State when unsure', value: 'acknowledge' },
        {
          name: 'Investigate - Research before answering',
          value: 'investigate',
        },
        { name: 'Defer - Ask human for guidance', value: 'defer' },
        {
          name: 'Estimate - Provide best guess with caveats',
          value: 'estimate',
        },
      ],
      default: 'acknowledge',
    },
    {
      type: 'list',
      name: 'error_response',
      message: 'How should the agent respond to errors?',
      choices: [
        {
          name: 'Solution-focused - Immediately suggest fixes',
          value: 'solution-focused',
        },
        {
          name: 'Detailed - Provide comprehensive analysis',
          value: 'detailed',
        },
        {
          name: 'Matter-of-fact - State facts without emotion',
          value: 'matter-of-fact',
        },
        {
          name: 'Apologetic - Express concern and empathy',
          value: 'apologetic',
        },
      ],
      default: 'solution-focused',
    },
    {
      type: 'list',
      name: 'proactivity',
      message: 'Agent proactivity level:',
      choices: [
        { name: 'Reactive - Respond only when asked', value: 'reactive' },
        {
          name: 'Suggestive - Offer occasional suggestions',
          value: 'suggestive',
        },
        {
          name: 'Proactive - Regularly identify improvements',
          value: 'proactive',
        },
        {
          name: 'Autonomous - Take initiative independently',
          value: 'autonomous',
        },
      ],
      default: 'suggestive',
    },
    {
      type: 'list',
      name: 'risk_tolerance',
      message: 'Risk tolerance for agent decisions:',
      choices: [
        { name: 'Conservative - Avoid any risk', value: 'conservative' },
        { name: 'Moderate - Balance safety and innovation', value: 'moderate' },
        {
          name: 'Progressive - Favor innovation over caution',
          value: 'progressive',
        },
        { name: 'Experimental - Push boundaries', value: 'experimental' },
      ],
      default: 'moderate',
    },
  ]);

  const traits: BehavioralTraits = {
    uncertainty_handling: traitsAnswers.uncertainty_handling,
    error_response: traitsAnswers.error_response,
    proactivity: traitsAnswers.proactivity,
    collaboration: 'collaborative', // Default
    detail_orientation: 'balanced', // Default
    risk_tolerance: traitsAnswers.risk_tolerance,
  };

  // Build PersonalitySpec
  const personality: PersonalitySpec = {
    name: roleAnswers.roleDescription,
    tone: toneAnswers.tone,
    expertise: expertiseEntries,
    tagline: roleAnswers.tagline || undefined,
    description: state.agent.metadata?.description || undefined,
    traits,
    format: {
      response_length: 'moderate',
      use_bullets: true,
      use_code_blocks: true,
      use_headings: true,
      include_summaries: false,
    },
    pronouns: 'it',
  };

  // Store in agent spec
  if (!state.agent.spec) {
    state.agent.spec = {
      role: roleAnswers.roleDescription, // Required field
    };
  }

  // Add personality to spec (using 'any' as personality is optional extension)
  (state.agent.spec as any).personality = personality;

  // Store decision boundaries in spec.autonomy
  if (!state.agent.spec.autonomy) {
    state.agent.spec.autonomy = {};
  }

  // Add decision boundaries as allowed/blocked actions
  state.agent.spec.autonomy.allowed_actions = cleanActions(
    boundariesAnswers.autonomousActions
  );
  state.agent.spec.autonomy.blocked_actions = cleanActions(
    boundariesAnswers.requiresApproval
  );

  console_ui.success(
    `Persona configured: ${personality.name} (${personality.tone} tone, ${expertiseEntries.length} expertise areas)`
  );

  return state;
}
