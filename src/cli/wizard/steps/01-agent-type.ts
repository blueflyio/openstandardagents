/**
 * Step 1: Agent Type Selection
 * Helps users choose the right agent type for their use case
 */

import inquirer from 'inquirer';
import { WizardState } from '../types.js';
import { console_ui, formatAgentType } from '../ui/console.js';
import { AGENT_TYPES } from '../data/agent-types.js';
import { container } from '../../../di-container.js';
import { TemplateService } from '../../../services/template.service.js';

export async function selectAgentTypeStep(
  state: WizardState
): Promise<WizardState> {
  console_ui.step(1, state.totalSteps, 'Agent Type Selection');

  console_ui.info('Choose the type of agent you want to create.');
  console_ui.info(
    'Each type has specific use cases and recommended configurations.\n'
  );

  const { agentType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'agentType',
      message: 'Select agent type:',
      choices: AGENT_TYPES.map((t) => ({
        name: `${formatAgentType(t.type)} ${t.label} - ${t.description}`,
        value: t.type,
        short: t.label,
      })),
      pageSize: 12,
    },
  ]);

  state.agentType = agentType;

  const typeInfo = AGENT_TYPES.find((t) => t.type === agentType);
  if (typeInfo) {
    console_ui.success(`Selected: ${typeInfo.label}`);
    console_ui.info(`Estimated setup time: ${typeInfo.estimatedTime}`);
    console_ui.info('Use cases:');
    console_ui.list(typeInfo.useCases);
  }

  // Show template selection after agent type is selected
  const templateService = container.get<TemplateService>(TemplateService);
  const templates = await templateService.searchTemplates({
    agentType: state.agent.spec?.role || '',
  });

  if (templates.length > 0) {
    const useTemplate = await inquirer.prompt<{ useTemplate: boolean }>({
      type: 'confirm',
      name: 'useTemplate',
      message: `Would you like to use a template? (${templates.length} templates available)`,
      default: false,
    });

    if (useTemplate.useTemplate) {
      const templateChoices = templates.map(
        (t: { metadata: { name: string; description: string } }) => ({
          name: `${t.metadata.name} - ${t.metadata.description}`,
          value: t.metadata.name,
        })
      );

      const selectedTemplate = await inquirer.prompt<{ template: string }>({
        type: 'list',
        name: 'template',
        message: 'Select a template:',
        choices: templateChoices,
      });

      const template = await templateService.getTemplate(
        selectedTemplate.template
      );
      if (template) {
        // Merge template manifest with current state
        state.agent = {
          ...template.manifest,
          metadata: {
            ...template.manifest.metadata,
            ...state.agent.metadata,
            name:
              state.agent.metadata?.name ||
              template.manifest.metadata?.name ||
              'agent',
          },
          spec: {
            ...template.manifest.spec,
            ...state.agent.spec,
            role: state.agent.spec?.role || template.manifest.spec?.role || '',
          },
        };
      }
    }
  }

  return state;
}
