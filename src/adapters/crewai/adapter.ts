/**
 * CrewAI Platform Adapter
 * Exports OSSA agent manifests to CrewAI format (Python)
 *
 * CrewAI is a framework for orchestrating role-playing autonomous AI agents.
 * It excels at multi-agent collaboration and task delegation.
 *
 * SOLID: Single Responsibility - CrewAI export only
 * DRY: Reuses BaseAdapter validation and existing converter
 */

import { BaseAdapter } from '../base/adapter.interface.js';
import type {
  OssaAgent,
  ExportOptions,
  ExportResult,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from '../base/adapter.interface.js';
import { CrewAIConverter } from './converter.js';

export class CrewAIAdapter extends BaseAdapter {
  readonly platform = 'crewai';
  readonly displayName = 'CrewAI';
  readonly description = 'CrewAI multi-agent framework (Python)';
  readonly supportedVersions = ['v0.3.6', 'v{{VERSION}}'];

  private converter = new CrewAIConverter();

  /**
   * Export OSSA manifest to CrewAI format
   */
  async export(
    manifest: OssaAgent,
    options?: ExportOptions
  ): Promise<ExportResult> {
    const startTime = Date.now();

    try {
      // Validate manifest
      if (options?.validate !== false) {
        const validation = await this.validate(manifest);
        if (!validation.valid) {
          return this.createResult(
            false,
            [],
            `Validation failed: ${validation.errors?.map((e) => e.message).join(', ')}`,
            {
              duration: Date.now() - startTime,
              warnings: validation.warnings?.map((w) => w.message),
            }
          );
        }
      }

      // Convert to CrewAI config
      const config = this.converter.convert(manifest);
      const files = [];

      // Generate crew.py - Main crew definition
      const crewCode = this.converter.generatePythonCode(manifest);
      files.push(
        this.createFile(
          `crewai/${manifest.metadata?.name || 'crew'}.py`,
          crewCode,
          'code',
          'python'
        )
      );

      // Generate agents.py - Individual agent definitions
      const agentsCode = this.generateAgentsCode(config, manifest);
      files.push(
        this.createFile('crewai/agents.py', agentsCode, 'code', 'python')
      );

      // Generate tasks.py - Task definitions
      const tasksCode = this.generateTasksCode(config, manifest);
      files.push(
        this.createFile('crewai/tasks.py', tasksCode, 'code', 'python')
      );

      // Generate tools.py - Tool implementations
      const toolsCode = this.generateToolsCode(manifest);
      files.push(
        this.createFile('crewai/tools.py', toolsCode, 'code', 'python')
      );

      // Generate requirements.txt
      const requirements = this.generateRequirements();
      files.push(
        this.createFile('crewai/requirements.txt', requirements, 'config')
      );

      // Generate README
      const readme = this.generateReadme(manifest, config);
      files.push(this.createFile('crewai/README.md', readme, 'documentation'));

      return this.createResult(true, files, undefined, {
        duration: Date.now() - startTime,
        version: '0.1.0',
      });
    } catch (error) {
      return this.createResult(
        false,
        [],
        error instanceof Error ? error.message : String(error),
        { duration: Date.now() - startTime }
      );
    }
  }

  /**
   * Validate manifest for CrewAI compatibility
   */
  async validate(manifest: OssaAgent): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Base validation
    const baseValidation = await super.validate(manifest);
    if (baseValidation.errors) errors.push(...baseValidation.errors);
    if (baseValidation.warnings) warnings.push(...baseValidation.warnings);

    // CrewAI-specific validation
    const spec = manifest.spec;

    // Check for workflow (CrewAI excels at multi-agent workflows)
    const workflow = spec?.workflow as any;
    if (!workflow || !workflow.steps || workflow.steps.length === 0) {
      warnings.push({
        message: 'No workflow defined, will create single-agent crew',
        path: 'spec.workflow',
        suggestion: 'Add spec.workflow.steps for multi-agent collaboration',
      });
    }

    // Check for role (required for CrewAI agents)
    if (!spec?.role) {
      errors.push({
        message: 'Role is required for CrewAI agents',
        path: 'spec.role',
        code: 'MISSING_REQUIRED_FIELD',
      });
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Get example CrewAI-optimized manifest
   */
  getExample(): OssaAgent {
    return {
      apiVersion: 'ossa/v{{VERSION}}',
      kind: 'Agent',
      metadata: {
        name: 'crewai-research-team',
        version: '1.0.0',
        description: 'Multi-agent research team using CrewAI',
      },
      spec: {
        role: 'Research Team Lead',
        workflow: {
          steps: [
            {
              agent: 'researcher',
              task: 'research',
              description: 'Conduct research on the given topic',
            },
            {
              agent: 'analyst',
              task: 'analyze',
              description: 'Analyze research findings and identify patterns',
            },
            {
              agent: 'writer',
              task: 'write',
              description: 'Write comprehensive report based on analysis',
            },
          ],
        },
        tools: [
          {
            name: 'web_search',
            description: 'Search the web for information',
          },
          {
            name: 'document_analyzer',
            description: 'Analyze documents and extract insights',
          },
        ],
      },
    };
  }

  /**
   * Generate agents.py - Agent definitions
   */
  private generateAgentsCode(config: any, manifest: OssaAgent): string {
    return `"""
CrewAI Agent Definitions
Generated from OSSA manifest: ${manifest.metadata?.name || 'unknown'}
"""

from crewai import Agent
from tools import get_tools

# Define agents
${config.agents
  .map(
    (agent: any) => `
${agent.role.replace(/[^a-zA-Z0-9]/g, '_')}_agent = Agent(
    role="${agent.role}",
    goal="${agent.goal}",
    backstory="""${agent.backstory}""",
    tools=get_tools(),
    verbose=${agent.verbose ?? true},
    allow_delegation=True,
)`
  )
  .join('\n')}

# Export all agents
agents = [
${config.agents.map((agent: any) => `    ${agent.role.replace(/[^a-zA-Z0-9]/g, '_')}_agent`).join(',\n')}
]
`;
  }

  /**
   * Generate tasks.py - Task definitions
   */
  private generateTasksCode(config: any, manifest: OssaAgent): string {
    return `"""
CrewAI Task Definitions
Generated from OSSA manifest: ${manifest.metadata?.name || 'unknown'}
"""

from crewai import Task
from agents import agents

# Define tasks
${config.tasks
  .map(
    (task: any, index: number) => `
task_${index + 1} = Task(
    description="""${task.description}""",
    agent=agents[${config.agents.findIndex((a: any) => a.role === task.agent) || 0}],
    expected_output="""${task.expected_output || 'Task completed'}""",
)`
  )
  .join('\n')}

# Export all tasks
tasks = [
${config.tasks.map((_: any, index: number) => `    task_${index + 1}`).join(',\n')}
]
`;
  }

  /**
   * Generate tools.py - Tool implementations
   */
  private generateToolsCode(manifest: OssaAgent): string {
    const tools = (manifest.spec?.tools || []) as any[];

    return `"""
CrewAI Tool Implementations
Generated from OSSA manifest: ${manifest.metadata?.name || 'unknown'}
"""

from crewai_tools import tool
from typing import Any

${tools
  .map(
    (t) => `
@tool
def ${t.name || 'unknown_tool'}(input_data: str) -> str:
    """${t.description || 'Tool implementation'}"""
    # Implement tool logic here
    return f"Executed ${t.name || 'tool'} with: {input_data}"
`
  )
  .join('\n')}

def get_tools() -> list:
    """Return all available tools"""
    return [
${tools.map((t) => `        ${t.name || 'unknown_tool'}`).join(',\n')}
    ]
`;
  }

  /**
   * Generate requirements.txt
   */
  private generateRequirements(): string {
    return `crewai>=0.22.0
crewai-tools>=0.2.0
python-dotenv>=1.0.0
`;
  }

  /**
   * Generate README.md
   */
  private generateReadme(manifest: OssaAgent, config: any): string {
    return `# ${manifest.metadata?.name || 'CrewAI Crew'}

${manifest.metadata?.description || 'CrewAI multi-agent crew generated from OSSA manifest'}

## Description

${manifest.spec?.role || 'AI Agent Crew'}

## Setup

\`\`\`bash
pip install -r requirements.txt
python ${manifest.metadata?.name || 'crew'}.py
\`\`\`

## Configuration

- **Process**: ${config.process || 'sequential'}
- **Agents**: ${config.agents.length}
- **Tasks**: ${config.tasks.length}

## Agents

${config.agents.map((a: any) => `### ${a.role}\n- **Goal**: ${a.goal}\n- **Backstory**: ${a.backstory}`).join('\n\n')}

## Tasks

${config.tasks.map((t: any, i: number) => `${i + 1}. **${t.description}**\n   - Agent: ${t.agent}\n   - Expected Output: ${t.expected_output}`).join('\n')}

## Generated from OSSA

This crew was generated from an OSSA v${manifest.apiVersion?.split('/')[1] || '{{VERSION}}'} manifest.

Original manifest: \`agent.ossa.yaml\`

## License

${manifest.metadata?.license || 'MIT'}
`;
  }
}
