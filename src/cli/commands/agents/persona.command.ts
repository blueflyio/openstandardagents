/**
 * Agents Persona Command
 * Display and edit agent persona configuration
 *
 * SOLID: Single Responsibility - Persona management only
 * DRY: Reusable persona display and editing logic
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import yaml from 'yaml';
import inquirer from 'inquirer';
import type { OssaAgent } from '../../../types/index.js';
import type {
  PersonalitySpec,
  TonePreset,
  ExpertiseDomain,
  ExpertiseLevel,
  BehavioralTraits,
  ExpertiseEntry,
} from '../../../types/personality.js';
import {
  normalizeExpertise,
  normalizeTone,
  isExpertiseEntry,
} from '../../../types/personality.js';
import { ValidationBuilder } from '../../utils/validation-builder.js';

export const agentsPersonaCommand = new Command('persona')
  .description('Display or edit agent persona configuration')
  .argument('<name-or-path>', 'Agent name or path to manifest file')
  .option('--show', 'Display agent persona (default)')
  .option('--edit', 'Edit persona interactively')
  .option('--json', 'Output as JSON (only with --show)')
  .action(async (nameOrPath: string, options) => {
    try {
      const { manifest, filePath } = await loadAgent(nameOrPath);

      // Default to show if no option specified
      if (!options.edit && !options.show) {
        options.show = true;
      }

      if (options.edit) {
        await editPersona(manifest, filePath);
      } else {
        await showPersona(manifest, options.json);
      }
    } catch (error) {
      console.error(
        chalk.red(
          `Failed to manage persona: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      process.exit(1);
    }
  });

/**
 * Load agent by name or file path
 */
async function loadAgent(
  nameOrPath: string
): Promise<{ manifest: OssaAgent; filePath: string }> {
  let filePath: string = '';

  // Check if it's a file path
  if (fs.existsSync(nameOrPath)) {
    filePath = nameOrPath;
  } else {
    // Search for agent by name
    const glob = await import('glob');
    const patterns = [
      `**/${nameOrPath}.ossa.yaml`,
      `**/${nameOrPath}.ossa.yml`,
      `**/${nameOrPath}/agent.yaml`,
      `**/${nameOrPath}/agent.yml`,
    ];

    let found = false;
    for (const pattern of patterns) {
      const files = glob.sync(pattern, {
        cwd: process.cwd(),
        ignore: ['**/node_modules/**', '**/vendor/**', '**/.git/**'],
        absolute: true,
      });

      if (files.length > 0) {
        filePath = files[0];
        found = true;
        break;
      }
    }

    if (!found) {
      throw new Error(`Agent not found: ${nameOrPath}`);
    }
  }

  if (!filePath) {
    throw new Error(`File path not found for: ${nameOrPath}`);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const manifest = yaml.parse(content) as OssaAgent;

  if (!manifest.apiVersion?.startsWith('ossa/')) {
    throw new Error(`Not a valid OSSA manifest: ${filePath}`);
  }

  return { manifest, filePath };
}

/**
 * Show agent persona configuration
 */
async function showPersona(
  manifest: OssaAgent,
  jsonOutput: boolean = false
): Promise<void> {
  const personality = (manifest.spec as any)?.personality as
    | PersonalitySpec
    | undefined;

  if (!personality) {
    console.log(
      chalk.yellow(
        '\nNo persona configured for this agent.\nUse --edit to add a persona.'
      )
    );
    return;
  }

  if (jsonOutput) {
    console.log(JSON.stringify(personality, null, 2));
    return;
  }

  // Display formatted persona
  console.log(chalk.blue.bold(`\nAgent Persona: ${personality.name}`));
  console.log(chalk.gray('─'.repeat(60)));

  // Role and Tagline
  console.log(chalk.bold('\nRole & Identity:'));
  console.log(`  ${chalk.cyan('Name:')} ${personality.name}`);
  if (personality.tagline) {
    console.log(`  ${chalk.cyan('Tagline:')} "${personality.tagline}"`);
  }
  if (personality.description) {
    console.log(`  ${chalk.cyan('Description:')} ${personality.description}`);
  }

  // Communication Tone
  console.log(chalk.bold('\nCommunication Style:'));
  const tone = normalizeTone(personality.tone);
  if (tone.preset) {
    console.log(`  ${chalk.cyan('Tone:')} ${tone.preset}`);
  }
  if (tone.custom) {
    console.log(`  ${chalk.cyan('Custom Tone:')} ${tone.custom}`);
  }
  if (tone.formality !== undefined) {
    console.log(
      `  ${chalk.cyan('Formality:')} ${(tone.formality * 100).toFixed(0)}%`
    );
  }
  if (tone.verbosity !== undefined) {
    console.log(
      `  ${chalk.cyan('Verbosity:')} ${(tone.verbosity * 100).toFixed(0)}%`
    );
  }

  // Expertise Domains
  if (personality.expertise && personality.expertise.length > 0) {
    console.log(chalk.bold('\nExpertise Domains:'));
    const normalized = normalizeExpertise(personality.expertise);
    normalized.forEach((exp) => {
      const level = exp.level ? ` (${chalk.green(exp.level)})` : '';
      console.log(`  • ${chalk.cyan(exp.domain)}${level}`);
      if (exp.years) {
        console.log(`    ${chalk.gray(`${exp.years} years experience`)}`);
      }
      if (exp.specializations && exp.specializations.length > 0) {
        console.log(
          `    ${chalk.gray(`Specializations: ${exp.specializations.join(', ')}`)}`
        );
      }
    });
  }

  // Decision Boundaries
  const autonomy = manifest.spec?.autonomy as any;
  if (autonomy && (autonomy.allowed_actions || autonomy.blocked_actions)) {
    console.log(chalk.bold('\nDecision Boundaries:'));
    if (autonomy.allowed_actions && autonomy.allowed_actions.length > 0) {
      console.log(`  ${chalk.cyan('Autonomous Actions:')}`);
      autonomy.allowed_actions.forEach((action: string) => {
        console.log(`    ${chalk.green('✓')} ${action}`);
      });
    }
    if (autonomy.blocked_actions && autonomy.blocked_actions.length > 0) {
      console.log(`  ${chalk.cyan('Requires Approval:')}`);
      autonomy.blocked_actions.forEach((action: string) => {
        console.log(`    ${chalk.red('⚠')} ${action}`);
      });
    }
  }

  // Behavioral Traits
  if (personality.traits) {
    console.log(chalk.bold('\nBehavioral Traits:'));
    const traits = personality.traits;
    if (traits.uncertainty_handling) {
      console.log(
        `  ${chalk.cyan('Uncertainty Handling:')} ${traits.uncertainty_handling}`
      );
    }
    if (traits.error_response) {
      console.log(
        `  ${chalk.cyan('Error Response:')} ${traits.error_response}`
      );
    }
    if (traits.proactivity) {
      console.log(`  ${chalk.cyan('Proactivity:')} ${traits.proactivity}`);
    }
    if (traits.collaboration) {
      console.log(`  ${chalk.cyan('Collaboration:')} ${traits.collaboration}`);
    }
    if (traits.detail_orientation) {
      console.log(
        `  ${chalk.cyan('Detail Orientation:')} ${traits.detail_orientation}`
      );
    }
    if (traits.risk_tolerance) {
      console.log(
        `  ${chalk.cyan('Risk Tolerance:')} ${traits.risk_tolerance}`
      );
    }
  }

  // Communication Format
  if (personality.format) {
    console.log(chalk.bold('\nCommunication Format:'));
    const format = personality.format;
    if (format.response_length) {
      console.log(
        `  ${chalk.cyan('Response Length:')} ${format.response_length}`
      );
    }
    if (format.use_bullets !== undefined) {
      console.log(
        `  ${chalk.cyan('Use Bullets:')} ${format.use_bullets ? 'Yes' : 'No'}`
      );
    }
    if (format.use_code_blocks !== undefined) {
      console.log(
        `  ${chalk.cyan('Use Code Blocks:')} ${format.use_code_blocks ? 'Yes' : 'No'}`
      );
    }
  }

  console.log(); // Blank line at end
}

/**
 * Edit agent persona interactively
 */
async function editPersona(
  manifest: OssaAgent,
  filePath: string
): Promise<void> {
  console.log(
    chalk.blue(
      '\n🎭 Edit Agent Persona\n   Configure personality and communication style\n'
    )
  );

  const currentPersonality = (manifest.spec as any)?.personality as
    | PersonalitySpec
    | undefined;

  // Step 1: Role and Identity
  console.log(chalk.bold('Step 1: Role & Identity'));
  const roleAnswers = await inquirer.prompt([
    {
      type: 'input',
      name: 'roleDescription',
      message: 'Agent role (e.g., "Senior DevOps Engineer"):',
      default: currentPersonality?.name,
      validate: ValidationBuilder.required('Role description'),
    },
    {
      type: 'input',
      name: 'tagline',
      message: 'Tagline/motto (optional):',
      default: currentPersonality?.tagline || '',
    },
  ]);

  // Step 2: Communication Tone
  console.log(chalk.bold('\nStep 2: Communication Tone'));
  const toneChoices: { name: string; value: TonePreset }[] = [
    { name: 'Professional - Formal and business-like', value: 'professional' },
    { name: 'Friendly - Warm and approachable', value: 'friendly' },
    { name: 'Technical - Detail-oriented and precise', value: 'technical' },
    { name: 'Concise - Brief and to the point', value: 'concise' },
    { name: 'Empathetic - Understanding and supportive', value: 'empathetic' },
    { name: 'Formal - Strictly professional', value: 'formal' },
    { name: 'Casual - Relaxed and informal', value: 'casual' },
  ];

  const currentTone = currentPersonality?.tone
    ? typeof currentPersonality.tone === 'string'
      ? currentPersonality.tone
      : (currentPersonality.tone as any).preset || 'professional'
    : 'professional';

  const toneAnswers = await inquirer.prompt([
    {
      type: 'list',
      name: 'tone',
      message: 'Communication tone:',
      choices: toneChoices,
      default: currentTone,
    },
  ]);

  // Step 3: Expertise Domains
  console.log(chalk.bold('\nStep 3: Expertise Domains'));
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

  // Get current expertise domains
  const currentExpertise = currentPersonality?.expertise
    ? normalizeExpertise(currentPersonality.expertise).map((e) => e.domain)
    : [];

  const expertiseAnswers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'expertiseDomains',
      message: 'Select expertise domains (use space to select):',
      choices: expertiseDomains.map((domain) => ({
        name: domain,
        value: domain,
        checked: currentExpertise.includes(domain),
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
  console.log(chalk.bold('\nStep 4: Proficiency Levels'));
  const expertiseEntries: ExpertiseEntry[] = [];
  const currentExpertiseMap = currentPersonality?.expertise
    ? new Map(
        normalizeExpertise(currentPersonality.expertise).map((e) => [
          e.domain,
          e.level || 'intermediate',
        ])
      )
    : new Map();

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
        default: currentExpertiseMap.get(domain) || 'intermediate',
      },
    ]);

    expertiseEntries.push({ domain, level });
  }

  // Step 5: Decision Boundaries
  console.log(
    chalk.bold(
      '\nStep 5: Decision Boundaries\n   Define what your agent can do autonomously'
    )
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

  const currentAutonomy = manifest.spec?.autonomy as any;
  const currentAllowed = currentAutonomy?.allowed_actions || [
    'read_code',
    'run_tests',
    'analyze_logs',
  ];
  const currentBlocked = currentAutonomy?.blocked_actions || [
    'db_migration',
    'breaking_changes',
    'security_changes',
    'deploy',
  ];

  const boundariesAnswers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'autonomousActions',
      message: 'What can the agent do autonomously?',
      choices: autonomousActions,
      default: currentAllowed.map(
        (action: string) =>
          autonomousActions.find((a) => a.startsWith(action)) || action
      ),
    },
    {
      type: 'checkbox',
      name: 'requiresApproval',
      message: 'What requires human approval?',
      choices: requiresApprovalActions,
      default: currentBlocked.map(
        (action: string) =>
          requiresApprovalActions.find((a) => a.startsWith(action)) || action
      ),
    },
  ]);

  // Clean action strings (remove descriptions)
  const cleanActions = (actions: string[]): string[] =>
    actions.map((a) => a.split(' - ')[0]);

  // Step 6: Behavioral Traits
  console.log(chalk.bold('\nStep 6: Behavioral Traits'));
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
      default:
        currentPersonality?.traits?.uncertainty_handling || 'acknowledge',
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
      default: currentPersonality?.traits?.error_response || 'solution-focused',
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
      default: currentPersonality?.traits?.proactivity || 'suggestive',
    },
    {
      type: 'list',
      name: 'risk_tolerance',
      message: 'Risk tolerance for agent decisions:',
      choices: [
        { name: 'Conservative - Avoid any risk', value: 'conservative' },
        {
          name: 'Moderate - Balance safety and innovation',
          value: 'moderate',
        },
        {
          name: 'Progressive - Favor innovation over caution',
          value: 'progressive',
        },
        { name: 'Experimental - Push boundaries', value: 'experimental' },
      ],
      default: currentPersonality?.traits?.risk_tolerance || 'moderate',
    },
  ]);

  const traits: BehavioralTraits = {
    uncertainty_handling: traitsAnswers.uncertainty_handling,
    error_response: traitsAnswers.error_response,
    proactivity: traitsAnswers.proactivity,
    collaboration: currentPersonality?.traits?.collaboration || 'collaborative',
    detail_orientation:
      currentPersonality?.traits?.detail_orientation || 'balanced',
    risk_tolerance: traitsAnswers.risk_tolerance,
  };

  // Build PersonalitySpec
  const personality: PersonalitySpec = {
    name: roleAnswers.roleDescription,
    tone: toneAnswers.tone,
    expertise: expertiseEntries,
    tagline: roleAnswers.tagline || undefined,
    description: manifest.metadata?.description || undefined,
    traits,
    format: currentPersonality?.format || {
      response_length: 'moderate',
      use_bullets: true,
      use_code_blocks: true,
      use_headings: true,
      include_summaries: false,
    },
    pronouns: currentPersonality?.pronouns || 'it',
  };

  // Update manifest
  if (!manifest.spec) {
    manifest.spec = {
      role: roleAnswers.roleDescription,
    };
  }

  // Add personality to spec
  (manifest.spec as any).personality = personality;

  // Update decision boundaries in spec.autonomy
  if (!manifest.spec.autonomy) {
    manifest.spec.autonomy = {};
  }

  manifest.spec.autonomy.allowed_actions = cleanActions(
    boundariesAnswers.autonomousActions
  );
  manifest.spec.autonomy.blocked_actions = cleanActions(
    boundariesAnswers.requiresApproval
  );

  // Validate manifest before saving
  try {
    const { ValidationService } =
      await import('../../../services/validation.service.js');
    const { container } = await import('../../../di-container.js');
    const validationService = container.get(ValidationService);
    const result = await validationService.validate(manifest);

    if (!result.valid) {
      console.error(chalk.red('\n✗ Validation failed:'));
      result.errors.forEach((error) =>
        console.error(chalk.red(`  - ${error}`))
      );
      console.log(
        chalk.yellow(
          '\nPersona was not saved due to validation errors. Please fix the issues and try again.'
        )
      );
      return;
    }
  } catch (validationError) {
    console.warn(
      chalk.yellow(
        '\n⚠ Could not validate manifest (validation service unavailable)'
      )
    );
    console.log(chalk.gray('   Continuing with save...'));
  }

  // Save manifest
  const yamlContent = yaml.stringify(manifest);
  fs.writeFileSync(filePath, yamlContent, 'utf-8');

  console.log(
    chalk.green(
      `\n✓ Persona updated successfully: ${personality.name} (${personality.tone} tone, ${expertiseEntries.length} expertise areas)`
    )
  );
  console.log(
    chalk.gray(`   Saved to: ${path.relative(process.cwd(), filePath)}`)
  );
  console.log(
    chalk.gray(
      `\n   View persona: ossa agents persona ${manifest.metadata?.name} --show`
    )
  );
}
