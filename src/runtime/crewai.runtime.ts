/**
 * CrewAI Runtime Bridge
 * 
 * Executes OSSA agents via CrewAI.
 * SOLID: Single Responsibility - CrewAI execution only
 * DRY: Reuses CrewAIAdapter for format conversion
 */

import type { OssaAgent } from '../types/index.js';
import { CrewAIAdapter } from '../adapters/crewai-adapter.js';

export interface CrewAIRuntimeConfig {
  python_path?: string;
  working_directory?: string;
}

export class CrewAIRuntime {
  private config: CrewAIRuntimeConfig;

  constructor(config: CrewAIRuntimeConfig = {}) {
    this.config = config;
  }

  /**
   * Execute OSSA agent via CrewAI
   * CRUD: Create operation (executes agent)
   */
  async execute(manifest: OssaAgent, inputs: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Convert OSSA manifest to CrewAI Python code
    const crew = CrewAIAdapter.workflowToCrew(manifest);
    const pythonCode = this.generateCrewAICode(crew, inputs);

    // Execute via Python subprocess
    const { execSync } = await import('child_process');
    const pythonPath = this.config.python_path || 'python3';
    const workingDir = this.config.working_directory || process.cwd();

    try {
      const result = execSync(
        `${pythonPath} -c ${JSON.stringify(pythonCode)}`,
        {
          cwd: workingDir,
          encoding: 'utf-8',
          timeout: 600000, // 10 minutes
        }
      );

      return this.parseExecutionResult(result);
    } catch (error) {
      throw new Error(`CrewAI execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate CrewAI Python code
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private generateCrewAICode(crew: any, inputs: Record<string, unknown>): string {
    const inputJson = JSON.stringify(inputs);
    return `
from crewai import Agent, Task, Crew, Process
from langchain.llms import OpenAI
import json

# Initialize LLM
llm = OpenAI(model_name="${crew.agents[0]?.llm?.model || 'gpt-4'}")

# Create agents
agents = []
${crew.agents.map((agent: { role: string; goal: string; backstory: string; verbose: boolean }, i: number) => `
agent_${i} = Agent(
    role="${agent.role}",
    goal="${agent.goal}",
    backstory="${agent.backstory}",
    verbose=${agent.verbose},
    llm=llm
)
agents.append(agent_${i})
`).join('')}

# Create tasks
tasks = []
${crew.tasks.map((task: { description: string; expected_output: string; agent?: string }, i: number) => `
task_${i} = Task(
    description="${task.description}",
    expected_output="${task.expected_output}",
    agent=agents[${task.agent ? '0' : 'None'}]
)
tasks.append(task_${i})
`).join('')}

# Create crew
crew = Crew(
    agents=agents,
    tasks=tasks,
    process=Process.${crew.process || 'sequential'},
    verbose=${crew.verbose}
)

# Execute
inputs = json.loads(${JSON.stringify(inputJson)})
result = crew.kickoff(inputs=inputs)
print(json.dumps({"output": str(result)}))
`;
  }

  /**
   * Parse execution result
   */
  private parseExecutionResult(output: string): Record<string, unknown> {
    try {
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { output: output.trim() };
    } catch (error) {
      return { output: output.trim() };
    }
  }
}
