/**
 * Step 2: Basic Agent Information
 * Collects metadata like name, version, and description
 */

import inquirer from 'inquirer';
import { WizardState } from '../types.js';
import { console_ui } from '../ui/console.js';
import { validateDNS1123, validateSemver } from '../validators/index.js';

export async function configureBasicInfoStep(
  state: WizardState
): Promise<WizardState> {
  console_ui.step(2, state.totalSteps, 'Basic Information');

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Agent name (DNS-1123 format):',
      validate: (input: string) => {
        if (!input) return 'Name is required';
        if (!validateDNS1123(input)) {
          return 'Must be DNS-1123 compliant (lowercase alphanumeric with hyphens, e.g., "my-agent")';
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'displayName',
      message: 'Display name (optional):',
      default: (answers: any) => answers.name,
    },
    {
      type: 'input',
      name: 'description',
      message: 'Description:',
      validate: (input: string) => (input ? true : 'Description is required'),
    },
    {
      type: 'input',
      name: 'version',
      message: 'Version:',
      default: '1.0.0',
      validate: (input: string) => {
        if (!validateSemver(input)) {
          return 'Must be semver format (e.g., 1.0.0)';
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'author',
      message: 'Author (optional):',
    },
    {
      type: 'input',
      name: 'tags',
      message: 'Tags (comma-separated, optional):',
      filter: (input: string) =>
        input
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
    },
  ]);

  state.agent.metadata = {
    ...state.agent.metadata,
    name: answers.name,
    version: answers.version,
    description: answers.description,
    labels: {
      'ossa.ai/display-name': answers.displayName || answers.name,
      ...(answers.author && { 'ossa.ai/author': answers.author }),
    },
    annotations: {
      ...(answers.tags.length > 0 && {
        'ossa.ai/tags': answers.tags.join(','),
      }),
    },
  };

  console_ui.success(`Agent: ${answers.name} v${answers.version}`);
  return state;
}
