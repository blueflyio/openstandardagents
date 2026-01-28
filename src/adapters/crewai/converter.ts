/**
 * CrewAI Converter
 * Converts OSSA orchestrator/workflow to CrewAI crew
 */

import type { OssaAgent } from '../../types/index.js';
import type {
  CrewAICrewConfig,
  CrewAIAgentConfig,
  CrewAITaskConfig,
} from './types.js';

export class CrewAIConverter {
  /**
   * Convert OSSA orchestrator to CrewAI crew
   */
  convert(manifest: OssaAgent): CrewAICrewConfig {
    const spec = manifest.spec as Record<string, unknown>;
    const workflow = spec.workflow as
      | {
          steps?: Array<{
            agent?: string;
            task?: string;
            description?: string;
          }>;
        }
      | undefined;

    // Extract agents from workflow or use manifest as single agent
    const agents: CrewAIAgentConfig[] = [];
    const tasks: CrewAITaskConfig[] = [];

    if (workflow?.steps) {
      // Multi-agent workflow
      for (const step of workflow.steps) {
        if (step.agent && !agents.find((a) => a.role === step.agent)) {
          agents.push({
            role: step.agent,
            goal: step.description || `Execute ${step.task || 'task'}`,
            backstory: `Agent responsible for ${step.task || 'workflow step'}`,
            verbose: true,
          });
        }

        if (step.task) {
          tasks.push({
            description: step.description || step.task,
            agent: step.agent || agents[0]?.role || 'agent',
            expected_output: `Completed ${step.task}`,
          });
        }
      }
    } else {
      // Single agent
      agents.push({
        role: (spec.role as string) || manifest.metadata?.name || 'agent',
        goal:
          manifest.metadata?.description ||
          (spec.role as string) ||
          'Execute tasks',
        backstory: manifest.metadata?.description || 'AI agent',
        verbose: true,
      });

      tasks.push({
        description: (spec.role as string) || 'Execute agent tasks',
        agent: agents[0].role,
        expected_output: 'Task completed',
      });
    }

    return {
      agents,
      tasks,
      process: 'sequential',
      verbose: true,
    };
  }

  /**
   * Generate Python code for CrewAI crew
   */
  generatePythonCode(manifest: OssaAgent): string {
    const config = this.convert(manifest);

    const agentsCode = config.agents
      .map(
        (agent) => `    Agent(
        role="${agent.role}",
        goal="${agent.goal}",
        backstory="${agent.backstory}",
        verbose=${agent.verbose ?? true},
    )`
      )
      .join(',\n');

    const tasksCode = config.tasks
      .map(
        (task) => `    Task(
        description="${task.description}",
        agent=${task.agent},
        expected_output="${task.expected_output || 'Task completed'}",
    )`
      )
      .join(',\n');

    return `"""
CrewAI Crew: ${manifest.metadata?.name || 'crew'}
Generated from OSSA manifest
"""

from crewai import Agent, Task, Crew

# Define agents
agents = [
${agentsCode}
]

# Define tasks
tasks = [
${tasksCode}
]

# Create crew
crew = Crew(
    agents=agents,
    tasks=tasks,
    process="${config.process}",
    verbose=${config.verbose ?? true},
)

# Run crew
if __name__ == "__main__":
    result = crew.kickoff()
    print(result)
`;
  }
}
