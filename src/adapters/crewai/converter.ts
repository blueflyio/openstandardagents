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
            id?: string;
            name?: string;
            agent?: string;
            task?: string;
            description?: string;
            tool?: string;
          }>;
        }
      | undefined;

    // Extract agents from workflow or use manifest as single agent
    const agents: CrewAIAgentConfig[] = [];
    const tasks: CrewAITaskConfig[] = [];

    if (workflow?.steps && workflow.steps.length > 0) {
      // Multi-agent workflow - convert workflow steps to agents/tasks
      for (const step of workflow.steps) {
        const stepName = step.name || step.id || step.task || 'Task';
        const stepDesc = step.description || stepName;

        // Create an agent for this step if agent field exists, or use step name as role
        const agentRole = step.agent || this.sanitizeRoleName(stepName);

        if (!agents.find((a) => a.role === agentRole)) {
          agents.push({
            role: agentRole,
            goal: `Successfully complete ${stepName} step`,
            backstory: `Specialized agent for ${stepDesc}`,
            verbose: true,
          });
        }

        // Create task for this step
        tasks.push({
          description: stepDesc,
          agent: agentRole,
          expected_output: `Completed ${stepName}${step.tool ? ` using ${step.tool}` : ''}`,
        });
      }
    }

    // If no agents were created, create a single default agent
    if (agents.length === 0) {
      const mainRole = this.extractRoleFromSpec(spec, manifest.metadata?.name);
      agents.push({
        role: mainRole,
        goal:
          manifest.metadata?.description ||
          'Execute tasks effectively',
        backstory: (spec.role as string) || manifest.metadata?.description || 'AI agent',
        verbose: true,
      });

      // Create default task if none exist
      if (tasks.length === 0) {
        tasks.push({
          description: manifest.metadata?.description || 'Execute agent tasks',
          agent: mainRole,
          expected_output: 'Task completed successfully',
        });
      }
    }

    return {
      agents,
      tasks,
      process: 'sequential',
      verbose: true,
    };
  }

  /**
   * Sanitize role name for CrewAI (remove special chars, convert to title case)
   */
  private sanitizeRoleName(name: string): string {
    return name
      .split(/[-_\s]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Extract role from spec, trying multiple fields
   */
  private extractRoleFromSpec(spec: Record<string, unknown>, fallback?: string): string {
    // Try to extract from role field (could be multiline)
    if (spec.role && typeof spec.role === 'string') {
      const lines = spec.role.split('\n').filter(l => l.trim());
      if (lines.length > 0) {
        const firstLine = lines[0].trim();
        // If first line is reasonable length, use it as role
        if (firstLine.length < 100 && firstLine.length > 5) {
          return firstLine;
        }
      }
    }

    return fallback || 'AI Agent';
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
