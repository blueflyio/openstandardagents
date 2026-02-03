/**
 * Wizard Prompts
 * Interactive prompts for agent creation wizard
 *
 * SOLID: Single Responsibility - Prompt definitions only
 * DRY: Centralized prompt configurations
 */

import type { QuestionCollection } from 'inquirer';

export interface WizardAnswers {
  name: string;
  displayName?: string;
  description?: string;
  version: string;
  role: string;
  llm_provider: string;
  model: string;
  temperature: number;
  tools: string[];
  memory: string;
  addSafety: boolean;
  contentFiltering?: boolean;
  piiDetection?: boolean;
  configureAutonomy?: boolean;
  autonomyLevel?: string;
  addObservability?: boolean;
  addExtensions?: boolean;
  platforms?: string[];
  autoExport?: boolean;
  exportPlatform?: string;
}

/**
 * DNS-1123 validation regex
 */
const DNS1123_REGEX = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

/**
 * Semver validation regex
 */
const SEMVER_REGEX = /^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/;

/**
 * Core prompts for basic agent information
 */
export const corePrompts: QuestionCollection = [
  {
    type: 'input',
    name: 'name',
    message: 'Agent ID (DNS-1123 format, lowercase alphanumeric with hyphens):',
    default: 'my-agent',
    validate: (value: string) => {
      if (!value || value.trim().length === 0) {
        return 'Agent ID is required';
      }
      if (!DNS1123_REGEX.test(value)) {
        return 'Must be DNS-1123 compliant (e.g., "my-agent", "code-reviewer")';
      }
      if (value.length > 253) {
        return 'Must be 253 characters or less';
      }
      return true;
    },
  },
  {
    type: 'input',
    name: 'displayName',
    message: 'Display Name:',
    default: (answers: Partial<WizardAnswers>) => answers.name,
  },
  {
    type: 'input',
    name: 'description',
    message: 'Description (what does this agent do?):',
    default: (answers: Partial<WizardAnswers>) =>
      `${answers.displayName} - An OSSA-compliant agent`,
  },
  {
    type: 'input',
    name: 'version',
    message: 'Version (semver format):',
    default: '1.0.0',
    validate: (value: string) => {
      if (!SEMVER_REGEX.test(value)) {
        return 'Must be semver format (e.g., 1.0.0, 0.1.0-beta)';
      }
      return true;
    },
  },
];

/**
 * Role and system prompt configuration
 */
export const rolePrompts: QuestionCollection = [
  {
    type: 'editor',
    name: 'role',
    message: 'System Prompt / Role (opens editor):',
    default: (answers: Partial<WizardAnswers>) =>
      `You are ${answers.displayName}. ${answers.description}\n\nYour responsibilities:\n- Provide helpful and accurate assistance\n- Follow best practices and safety guidelines\n- Be transparent about your capabilities and limitations`,
  },
];

/**
 * LLM configuration prompts
 */
export const llmPrompts: QuestionCollection = [
  {
    type: 'list',
    name: 'llm_provider',
    message: 'Select LLM Provider:',
    choices: [
      {
        name: 'Anthropic Claude (Sonnet, Opus, Haiku)',
        value: 'anthropic',
      },
      { name: 'OpenAI (GPT-4, GPT-3.5)', value: 'openai' },
      { name: 'Google (Gemini Pro, Gemini Ultra)', value: 'google' },
      { name: 'Mistral AI (Mistral Large, Mixtral)', value: 'mistral' },
      { name: 'Cohere (Command R+)', value: 'cohere' },
    ],
    default: 'anthropic',
  },
  {
    type: 'list',
    name: 'model',
    message: 'Select Model:',
    choices: (answers: Partial<WizardAnswers>) => {
      const modelChoices: Record<string, Array<{ name: string; value: string }>> =
        {
          anthropic: [
            { name: 'Claude Sonnet 4 (recommended)', value: 'claude-sonnet-4-20250514' },
            { name: 'Claude Opus 4', value: 'claude-opus-4-20250514' },
            { name: 'Claude Haiku 4', value: 'claude-haiku-4-20250514' },
          ],
          openai: [
            { name: 'GPT-4o (recommended)', value: 'gpt-4o' },
            { name: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
            { name: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
          ],
          google: [
            {
              name: 'Gemini 2.0 Flash (recommended)',
              value: 'gemini-2.0-flash-exp',
            },
            { name: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
            { name: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash' },
          ],
          mistral: [
            { name: 'Mistral Large', value: 'mistral-large-latest' },
            { name: 'Mixtral 8x7B', value: 'mixtral-8x7b-32768' },
          ],
          cohere: [
            { name: 'Command R+', value: 'command-r-plus' },
            { name: 'Command R', value: 'command-r' },
          ],
        };
      return modelChoices[answers.llm_provider || 'anthropic'] || [
        { name: 'Default', value: 'default' },
      ];
    },
  },
  {
    type: 'number',
    name: 'temperature',
    message: 'Temperature (0.0-2.0):',
    default: 0.7,
    validate: (value: number) => {
      if (isNaN(value) || value < 0 || value > 2) {
        return 'Temperature must be between 0.0 and 2.0';
      }
      return true;
    },
  },
];

/**
 * Tools and capabilities prompts
 */
export const toolsPrompts: QuestionCollection = [
  {
    type: 'checkbox',
    name: 'tools',
    message: 'Select tools (space to select, enter to continue):',
    choices: [
      { name: 'Search (web search capabilities)', value: 'search' },
      { name: 'File Operations (read/write files)', value: 'file_ops' },
      { name: 'Web (HTTP requests)', value: 'web' },
      { name: 'Calculator (math operations)', value: 'calculator' },
      { name: 'Database (query databases)', value: 'database' },
      { name: 'API Calls (external APIs)', value: 'api' },
    ],
    default: ['search', 'file_ops'],
  },
  {
    type: 'list',
    name: 'memory',
    message: 'Select memory type:',
    choices: [
      {
        name: 'Conversation Buffer (stores all messages)',
        value: 'conversation_buffer',
      },
      {
        name: 'Summary (maintains conversation summary)',
        value: 'summary',
      },
      {
        name: 'Entity (tracks entities mentioned)',
        value: 'entity',
      },
      { name: 'None (stateless)', value: 'none' },
    ],
    default: 'conversation_buffer',
  },
];

/**
 * Safety configuration prompts
 */
export const safetyPrompts: QuestionCollection = [
  {
    type: 'confirm',
    name: 'addSafety',
    message: 'Configure safety controls?',
    default: false,
  },
  {
    type: 'confirm',
    name: 'contentFiltering',
    message: 'Enable content filtering?',
    default: true,
    when: (answers: Partial<WizardAnswers>) => answers.addSafety,
  },
  {
    type: 'confirm',
    name: 'piiDetection',
    message: 'Enable PII detection?',
    default: true,
    when: (answers: Partial<WizardAnswers>) => answers.addSafety,
  },
];

/**
 * Autonomy configuration prompts
 */
export const autonomyPrompts: QuestionCollection = [
  {
    type: 'confirm',
    name: 'configureAutonomy',
    message: 'Configure autonomy settings?',
    default: false,
  },
  {
    type: 'list',
    name: 'autonomyLevel',
    message: 'Autonomy Level:',
    choices: [
      {
        name: 'Full Autonomy (no human approval required)',
        value: 'full',
      },
      {
        name: 'Assisted (human approval for sensitive actions)',
        value: 'assisted',
      },
      {
        name: 'Supervised (human approval for most actions)',
        value: 'supervised',
      },
    ],
    default: 'assisted',
    when: (answers: Partial<WizardAnswers>) => answers.configureAutonomy,
  },
];

/**
 * Observability configuration prompts
 */
export const observabilityPrompts: QuestionCollection = [
  {
    type: 'confirm',
    name: 'addObservability',
    message: 'Configure observability (tracing, metrics, logging)?',
    default: false,
  },
];

/**
 * Platform extensions prompts
 */
export const extensionsPrompts: QuestionCollection = [
  {
    type: 'confirm',
    name: 'addExtensions',
    message: 'Add platform extensions?',
    default: false,
  },
  {
    type: 'checkbox',
    name: 'platforms',
    message: 'Select platforms:',
    choices: [
      { name: 'Cursor (Cursor IDE integration)', value: 'cursor' },
      {
        name: 'OpenAI Assistants (OpenAI Assistants API)',
        value: 'openai',
      },
      { name: 'LangChain (LangChain framework)', value: 'langchain' },
      { name: 'Langflow (Langflow visual builder)', value: 'langflow' },
      { name: 'CrewAI (CrewAI multi-agent)', value: 'crewai' },
      { name: 'Anthropic (Anthropic platform)', value: 'anthropic' },
      { name: 'Vercel AI (Vercel AI SDK)', value: 'vercel' },
      { name: 'LlamaIndex (LlamaIndex RAG)', value: 'llamaindex' },
    ],
    when: (answers: Partial<WizardAnswers>) => answers.addExtensions,
    default: [],
  },
];

/**
 * Export configuration prompts
 */
export const exportPrompts: QuestionCollection = [
  {
    type: 'confirm',
    name: 'autoExport',
    message: 'Auto-export to platform-specific format after creation?',
    default: false,
  },
  {
    type: 'list',
    name: 'exportPlatform',
    message: 'Export to which platform?',
    choices: [
      { name: 'LangChain', value: 'langchain' },
      { name: 'OpenAI Assistants', value: 'openai' },
      { name: 'Anthropic', value: 'anthropic' },
      { name: 'CrewAI', value: 'crewai' },
      { name: 'Cursor', value: 'cursor' },
    ],
    when: (answers: Partial<WizardAnswers>) => answers.autoExport,
  },
];

/**
 * All prompts combined in logical order
 */
export const allPrompts: QuestionCollection = [
  ...(Array.isArray(corePrompts) ? corePrompts : [corePrompts]),
  ...(Array.isArray(rolePrompts) ? rolePrompts : [rolePrompts]),
  ...(Array.isArray(llmPrompts) ? llmPrompts : [llmPrompts]),
  ...(Array.isArray(toolsPrompts) ? toolsPrompts : [toolsPrompts]),
  ...(Array.isArray(safetyPrompts) ? safetyPrompts : [safetyPrompts]),
  ...(Array.isArray(autonomyPrompts) ? autonomyPrompts : [autonomyPrompts]),
  ...(Array.isArray(observabilityPrompts) ? observabilityPrompts : [observabilityPrompts]),
  ...(Array.isArray(extensionsPrompts) ? extensionsPrompts : [extensionsPrompts]),
  ...(Array.isArray(exportPrompts) ? exportPrompts : [exportPrompts]),
];
