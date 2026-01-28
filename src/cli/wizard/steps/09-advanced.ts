/**
 * Step 9: Advanced Configuration
 * Extensions, safety controls, and advanced features
 */

import inquirer from 'inquirer';
import { WizardState } from '../types.js';
import { console_ui } from '../ui/console.js';

export async function configureAdvancedStep(
  state: WizardState
): Promise<WizardState> {
  console_ui.step(9, state.totalSteps, 'Advanced Configuration');

  // Safety Controls
  const { configureSafety } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'configureSafety',
      message: 'Configure safety controls (content filtering, PII detection)?',
      default: true,
    },
  ]);

  if (configureSafety) {
    const safetyAnswers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'contentFiltering',
        message: 'Enable content filtering?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'piiDetection',
        message: 'Enable PII detection?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'rateLimiting',
        message: 'Enable rate limiting?',
        default: true,
      },
    ]);

    const safety: any = {};

    if (safetyAnswers.contentFiltering) {
      const { categories, threshold } = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'categories',
          message: 'Content categories to filter:',
          choices: [
            { name: 'Hate Speech', value: 'hate_speech', checked: true },
            { name: 'Violence', value: 'violence', checked: true },
            { name: 'Self Harm', value: 'self_harm' },
            { name: 'Sexual', value: 'sexual' },
            {
              name: 'Illegal Activity',
              value: 'illegal_activity',
              checked: true,
            },
          ],
        },
        {
          type: 'list',
          name: 'threshold',
          message: 'Filter threshold:',
          choices: ['low', 'medium', 'high'],
          default: 'medium',
        },
      ]);

      safety.content_filtering = {
        enabled: true,
        categories,
        threshold,
        action: 'block',
      };
    }

    if (safetyAnswers.piiDetection) {
      const { piiTypes } = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'piiTypes',
          message: 'PII types to detect:',
          choices: [
            { name: 'Email', value: 'email', checked: true },
            { name: 'Phone Number', value: 'phone', checked: true },
            { name: 'SSN', value: 'ssn', checked: true },
            { name: 'Credit Card', value: 'credit_card', checked: true },
            { name: 'API Key', value: 'api_key', checked: true },
            { name: 'Password', value: 'password', checked: true },
            { name: 'IP Address', value: 'ip_address' },
          ],
        },
      ]);

      safety.pii_detection = {
        enabled: true,
        types: piiTypes,
        action: 'redact',
      };
    }

    if (safetyAnswers.rateLimiting) {
      const { requestsPerMinute } = await inquirer.prompt([
        {
          type: 'number',
          name: 'requestsPerMinute',
          message: 'Requests per minute:',
          default: 30,
        },
      ]);

      safety.rate_limiting = {
        enabled: true,
        requests_per_minute: requestsPerMinute,
        burst_limit: Math.ceil(requestsPerMinute / 6),
      };
    }

    if (Object.keys(safety).length > 0) {
      (state.agent.spec as any).safety = safety;
      console_ui.success('Safety controls configured');
    }
  }

  // Platform Extensions
  const { enableExtensions } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'enableExtensions',
      message: 'Add platform extensions (Cursor, OpenAI, LangChain, etc.)?',
      default: false,
    },
  ]);

  if (enableExtensions) {
    const { platforms } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'platforms',
        message: 'Select platforms:',
        choices: [
          { name: 'Cursor IDE', value: 'cursor' },
          { name: 'OpenAI Assistants', value: 'openai' },
          { name: 'LangChain', value: 'langchain' },
          { name: 'LangGraph', value: 'langgraph' },
          { name: 'CrewAI', value: 'crewai' },
          { name: 'Anthropic', value: 'anthropic' },
          { name: 'AG2 (AutoGen)', value: 'ag2' },
        ],
      },
    ]);

    if (platforms.length > 0) {
      state.agent.extensions = {};

      platforms.forEach((platform: string) => {
        if (platform === 'cursor') {
          state.agent.extensions!.cursor = {
            enabled: true,
            agent_type: 'composer',
          };
        } else {
          state.agent.extensions![platform] = { enabled: true };
        }
      });

      console_ui.success(`Enabled ${platforms.length} extension(s)`);
    }
  }

  return state;
}
