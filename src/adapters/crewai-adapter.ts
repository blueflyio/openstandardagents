/**
 * CrewAI Adapter
 * Exports OSSA agent manifests to CrewAI format
 */

import type { OssaAgent } from '../types/index.js';

export interface CrewAIAgent {
  role: string;
  goal: string;
  backstory: string;
  tools: string[];
  verbose?: boolean;
  allow_delegation?: boolean;
  max_iter?: number;
  max_rpm?: number;
  llm?: {
    model: string;
    temperature?: number;
    max_tokens?: number;
  };
}

export interface CrewAITask {
  description: string;
  expected_output: string;
  agent?: string;
  tools?: string[];
}

export interface CrewAICrew {
  agents: CrewAIAgent[];
  tasks: CrewAITask[];
  process?: 'sequential' | 'hierarchical';
  verbose?: boolean;
}

export class CrewAIAdapter {
  /**
   * Convert OSSA agent manifest to CrewAI agent format
   */
  static toCrewAI(manifest: OssaAgent): CrewAIAgent {
    const spec = manifest.spec || { role: '' };
    const metadata = manifest.metadata || { name: 'unknown-agent', description: '' };
    const tools = spec.tools || [];

    // Extract role, goal, and backstory from spec.role
    const roleText = spec.role || '';
    const { role, goal, backstory } = this.parseRoleText(roleText, metadata.description);

    // Convert OSSA tools to CrewAI tool names
    const crewaiTools = tools.map((tool: any) => tool.name || 'unknown_tool');

    return {
      role,
      goal,
      backstory,
      tools: crewaiTools,
      verbose: true,
      allow_delegation: false,
      max_iter: 15,
      llm: {
        model: spec.llm?.model || 'gpt-4',
        temperature: spec.llm?.temperature,
        max_tokens: spec.llm?.maxTokens,
      },
    };
  }

  /**
   * Parse role text into role, goal, and backstory components
   */
  private static parseRoleText(
    roleText: string,
    description?: string
  ): { role: string; goal: string; backstory: string } {
    // Try to extract structured information from role text
    const lines = roleText.split('\n').filter(l => l.trim());

    let role = lines[0] || 'AI Assistant';
    let goal = description || 'Assist users with their queries';
    let backstory = 'An AI agent designed to help users effectively';

    // Look for specific patterns
    const goalMatch = roleText.match(/goal:?\s*(.+)/i);
    if (goalMatch) {
      goal = goalMatch[1].trim();
    }

    const backstoryMatch = roleText.match(/backstory:?\s*(.+)/i);
    if (backstoryMatch) {
      backstory = backstoryMatch[1].trim();
    }

    const roleMatch = roleText.match(/role:?\s*(.+)/i);
    if (roleMatch) {
      role = roleMatch[1].trim();
    }

    // If no structured format found, use heuristics
    if (!goalMatch && !backstoryMatch && !roleMatch) {
      if (lines.length >= 2) {
        role = lines[0];
        goal = lines[1];
        backstory = lines.slice(2).join(' ') || backstory;
      } else if (lines.length === 1) {
        role = lines[0];
      }
    }

    return { role, goal, backstory };
  }

  /**
   * Convert OSSA agent manifest to CrewAI Python code
   */
  static toPythonCode(manifest: OssaAgent): string {
    const crewaiAgent = this.toCrewAI(manifest);
    const metadata = manifest.metadata || { name: 'unknown-agent' };

    let code = `"""
CrewAI Agent: ${metadata.name}
Generated from OSSA manifest
"""

from crewai import Agent, Task, Crew, Process
from langchain.llms import OpenAI
`;

    // Add tool imports if tools are present
    if (crewaiAgent.tools.length > 0) {
      code += `from crewai_tools import ${crewaiAgent.tools.join(', ')}\n`;
    }

    code += `
# Initialize LLM
llm = OpenAI(
    model_name="${crewaiAgent.llm?.model || 'gpt-4'}",
`;

    if (crewaiAgent.llm?.temperature !== undefined) {
      code += `    temperature=${crewaiAgent.llm.temperature},\n`;
    }

    code += `)

# Create agent
agent = Agent(
    role="${this.escapeString(crewaiAgent.role)}",
    goal="${this.escapeString(crewaiAgent.goal)}",
    backstory="${this.escapeString(crewaiAgent.backstory)}",
`;

    if (crewaiAgent.tools.length > 0) {
      code += `    tools=[${crewaiAgent.tools.join(', ')}],\n`;
    }

    code += `    verbose=${crewaiAgent.verbose ? 'True' : 'False'},
    allow_delegation=${crewaiAgent.allow_delegation ? 'True' : 'False'},
    max_iter=${crewaiAgent.max_iter},
    llm=llm
)

# Create a task for the agent
task = Task(
    description="${this.escapeString(metadata.description || 'Process user request')}",
    expected_output="A comprehensive response to the user's query",
    agent=agent
)

# Create crew
crew = Crew(
    agents=[agent],
    tasks=[task],
    process=Process.sequential,
    verbose=${crewaiAgent.verbose ? 'True' : 'False'}
)

# Execute the crew
if __name__ == "__main__":
    result = crew.kickoff()
    print(result)
`;

    return code;
  }

  /**
   * Escape strings for Python code generation
   */
  private static escapeString(str: string): string {
    return str.replace(/"/g, '\\"').replace(/\n/g, '\\n');
  }

  /**
   * Convert OSSA workflow to CrewAI crew with multiple agents
   */
  static workflowToCrew(manifest: OssaAgent): CrewAICrew {
    const spec = manifest.spec || {};
    const metadata = manifest.metadata || { name: 'unknown-crew' };

    // For a single agent manifest, create a simple crew
    const agent = this.toCrewAI(manifest);

    const task: CrewAITask = {
      description: metadata.description || 'Execute agent task',
      expected_output: 'Completed task output',
      agent: metadata.name,
      tools: agent.tools,
    };

    return {
      agents: [agent],
      tasks: [task],
      process: 'sequential',
      verbose: true,
    };
  }
}

export default CrewAIAdapter;
