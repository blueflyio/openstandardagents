/**
 * Temporal Converter
 * Converts OSSA workflow to Temporal workflow
 */

import type { OssaWorkflow } from '../../types/index.js';
import type {
  TemporalWorkflowConfig,
  TemporalActivityConfig,
} from './types.js';

export class TemporalConverter {
  /**
   * Convert OSSA workflow to Temporal workflow config
   */
  convert(workflow: OssaWorkflow): TemporalWorkflowConfig {
    const spec = workflow.spec as unknown as Record<string, unknown>;
    const steps = spec.steps as
      | Array<{
          name?: string;
          description?: string;
          agent?: string;
          task?: string;
        }>
      | undefined;

    const activities: TemporalActivityConfig[] = [];

    if (steps) {
      for (const step of steps) {
        activities.push({
          name: step.name || step.task || 'activity',
          description: step.description || step.task || '',
          inputType: 'Record<string, unknown>',
          outputType: 'Record<string, unknown>',
          timeout: '30s',
        });
      }
    }

    return {
      name: workflow.metadata?.name || 'workflow',
      description:
        workflow.metadata?.description || (spec.description as string) || '',
      activities,
      executionTimeout: '1h',
      taskTimeout: '30s',
    };
  }

  /**
   * Generate TypeScript code for Temporal workflow
   */
  generateTypeScriptCode(workflow: OssaWorkflow): string {
    const config = this.convert(workflow);

    const activitiesCode = config.activities
      .map((activity) => {
        const step = steps?.find((s) => (s.name || s.task) === activity.name);
        const agentName = step?.agent || 'default-agent';
        const taskName = step?.task || activity.name;

        return `  @Activity()
  async ${activity.name}(input: ${activity.inputType}): Promise<${activity.outputType}> {
    // ${activity.description}
    // Execute OSSA agent task: ${agentName}/${taskName}
    const result = await this.executeAgentTask("${agentName}", "${taskName}", input);
    return result as ${activity.outputType};
  }`;
      })
      .join('\n\n');

    return `/**
 * Temporal Workflow: ${config.name}
 * Generated from OSSA manifest
 */

import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';

const activitiesImpl = proxyActivities<typeof activities>({
  startToCloseTimeout: '${config.taskTimeout}',
});

export async function ${config.name}Workflow(input: Record<string, unknown>): Promise<Record<string, unknown>> {
  // Execute activities in sequence
  ${config.activities.map((a) => `const ${a.name}Result = await activitiesImpl.${a.name}(input);`).join('\n  ')}
  
  return {
    ${config.activities.map((a) => `${a.name}: ${a.name}Result`).join(',\n    ')}
  };
}

// Activities file (activities.ts)
import { Activity } from '@temporalio/activity';

export const activities = {
${activitiesCode}
  
  async executeAgentTask(agentName: string, taskName: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Execute OSSA agent task via agent mesh
    const response = await fetch(\`http://agent-mesh:3005/agents/\${agentName}/execute\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: taskName, input }),
    });
    if (!response.ok) {
      throw new Error(\`Agent task execution failed: \${response.statusText}\`);
    }
    return await response.json();
  }
};
`;
  }
}
