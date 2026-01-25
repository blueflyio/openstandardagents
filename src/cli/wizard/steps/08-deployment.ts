/**
 * Step 8: Deployment Configuration
 * Configure deployment targets and runtime settings
 */

import inquirer from 'inquirer';
import { WizardState } from '../types.js';
import { console_ui } from '../ui/console.js';

export async function configureDeploymentStep(
  state: WizardState
): Promise<WizardState> {
  console_ui.step(8, state.totalSteps, 'Deployment Configuration');

  const { configureDeployment } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'configureDeployment',
      message: 'Configure deployment settings?',
      default: true,
    },
  ]);

  if (!configureDeployment) return state;

  const deploymentAnswers = await inquirer.prompt([
    {
      type: 'list',
      name: 'target',
      message: 'Deployment target:',
      choices: [
        { name: 'Kubernetes', value: 'kubernetes' },
        { name: 'Docker', value: 'docker' },
        { name: 'Serverless (Lambda/Cloud Functions)', value: 'serverless' },
        { name: 'Local / Development', value: 'local' },
      ],
      default: 'kubernetes',
    },
    {
      type: 'number',
      name: 'replicas',
      message: 'Number of replicas:',
      default: 1,
      when: (answers: any) =>
        answers.target === 'kubernetes' || answers.target === 'docker',
    },
    {
      type: 'input',
      name: 'resources',
      message: 'Resource requests (e.g., "cpu=500m,memory=512Mi"):',
      default: 'cpu=500m,memory=512Mi',
      when: (answers: any) => answers.target === 'kubernetes',
      filter: (input: string) => {
        const parts = input.split(',').map((p) => p.trim());
        const resources: any = {};
        parts.forEach((p) => {
          const [key, value] = p.split('=');
          if (key && value) resources[key] = value;
        });
        return resources;
      },
    },
    {
      type: 'confirm',
      name: 'autoScaling',
      message: 'Enable auto-scaling?',
      default: false,
      when: (answers: any) =>
        answers.target === 'kubernetes' || answers.target === 'serverless',
    },
    {
      type: 'number',
      name: 'minReplicas',
      message: 'Minimum replicas:',
      default: 1,
      when: (answers: any) => answers.autoScaling,
    },
    {
      type: 'number',
      name: 'maxReplicas',
      message: 'Maximum replicas:',
      default: 10,
      when: (answers: any) => answers.autoScaling,
    },
  ]);

  const deployment: any = {
    target: deploymentAnswers.target,
  };

  if (deploymentAnswers.target === 'kubernetes') {
    deployment.kubernetes = {
      replicas: deploymentAnswers.replicas,
      resources: {
        requests: deploymentAnswers.resources,
      },
    };

    if (deploymentAnswers.autoScaling) {
      deployment.kubernetes.autoscaling = {
        enabled: true,
        min_replicas: deploymentAnswers.minReplicas,
        max_replicas: deploymentAnswers.maxReplicas,
        target_cpu_utilization: 80,
      };
    }
  } else if (deploymentAnswers.target === 'docker') {
    deployment.docker = {
      replicas: deploymentAnswers.replicas,
    };
  } else if (deploymentAnswers.target === 'serverless') {
    deployment.serverless = {
      timeout: 300,
      memory: 512,
    };

    if (deploymentAnswers.autoScaling) {
      deployment.serverless.autoscaling = {
        min_instances: deploymentAnswers.minReplicas,
        max_instances: deploymentAnswers.maxReplicas,
      };
    }
  }

  if (!state.agent.spec) state.agent.spec = { role: '' };
  (state.agent.spec as any).deployment = deployment;

  console_ui.success(`Deployment target: ${deploymentAnswers.target}`);

  return state;
}
