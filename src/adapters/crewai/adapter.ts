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

import * as yaml from 'yaml';
import { BaseAdapter } from '../base/adapter.interface.js';
import { getApiVersion } from '../../utils/version.js';
import type {
  OssaAgent,
  ExportOptions,
  ExportResult,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from '../base/adapter.interface.js';
import { generatePythonToolParams } from '../base/tool-params.js';
import { CrewAIConverter } from './converter.js';

export class CrewAIAdapter extends BaseAdapter {
  readonly platform = 'crewai';
  readonly displayName = 'CrewAI';
  readonly description = 'CrewAI multi-agent framework (Python)';
  readonly status = 'beta' as const;
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
      const projectName = manifest.metadata?.name || 'crew';

      // Generate directory structure: agents/, tasks/, crew/, tools/

      // 1. agents/ directory - Individual agent definitions
      const agentsCode = this.generateAgentsCode(config, manifest);
      files.push(
        this.createFile('agents/__init__.py', agentsCode, 'code', 'python')
      );

      // 2. tasks/ directory - Task definitions
      const tasksCode = this.generateTasksCode(config, manifest);
      files.push(
        this.createFile('tasks/__init__.py', tasksCode, 'code', 'python')
      );

      // 3. tools/ directory - Custom tool implementations
      const toolsCode = this.generateToolsCode(manifest);
      files.push(
        this.createFile('tools/__init__.py', toolsCode, 'code', 'python')
      );

      const customToolsCode = this.generateCustomToolsCode(manifest);
      files.push(
        this.createFile(
          'tools/custom_tools.py',
          customToolsCode,
          'code',
          'python'
        )
      );

      // 4. crew/ directory - Crew setup and orchestration
      const crewCode = this.generateCrewCode(config, manifest);
      files.push(
        this.createFile('crew/__init__.py', crewCode, 'code', 'python')
      );

      const crewSetupCode = this.generateCrewSetupCode(config, manifest);
      files.push(
        this.createFile('crew/crew.py', crewSetupCode, 'code', 'python')
      );

      // 5. main.py - Entry point
      const mainCode = this.generateMainCode(manifest);
      files.push(this.createFile('main.py', mainCode, 'code', 'python'));

      // 6. Configuration files
      const requirements = this.generateRequirements();
      files.push(this.createFile('requirements.txt', requirements, 'config'));

      const envExample = this.generateEnvExample(manifest);
      files.push(this.createFile('.env.example', envExample, 'config'));

      const dockerignore = this.generateDockerignore();
      files.push(this.createFile('.dockerignore', dockerignore, 'config'));

      const gitignore = this.generateGitignore();
      files.push(this.createFile('.gitignore', gitignore, 'config'));

      // 7. Documentation
      const readme = this.generateReadme(manifest, config);
      files.push(this.createFile('README.md', readme, 'documentation'));

      const deployment = this.generateDeploymentGuide(manifest);
      files.push(this.createFile('DEPLOYMENT.md', deployment, 'documentation'));

      // Include source OSSA manifest for provenance
      files.push(
        this.createFile(
          'agent.ossa.yaml',
          yaml.stringify(manifest),
          'config',
          'yaml'
        )
      );

      // 8. Examples
      const exampleUsage = this.generateExampleUsage(manifest);
      files.push(
        this.createFile(
          'examples/basic_usage.py',
          exampleUsage,
          'code',
          'python'
        )
      );

      const exampleAsync = this.generateExampleAsync(manifest);
      files.push(
        this.createFile(
          'examples/async_usage.py',
          exampleAsync,
          'code',
          'python'
        )
      );

      // 9. Tests (if requested)
      if (options?.includeTests) {
        const testsCode = this.generateTestsCode(manifest);
        files.push(
          this.createFile('tests/test_crew.py', testsCode, 'test', 'python')
        );

        const testToolsCode = this.generateTestToolsCode(manifest);
        files.push(
          this.createFile(
            'tests/test_tools.py',
            testToolsCode,
            'test',
            'python'
          )
        );
      }

      // Perfect Agent files
      files.push(...(await this.generatePerfectAgentFiles(manifest, options)));

      return this.createResult(true, files, undefined, {
        duration: Date.now() - startTime,
        version: '0.1.0',
        structure: 'production-grade',
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
            type: 'api',
            name: 'web_search',
            description: 'Search the web for information',
          },
          {
            type: 'api',
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
    verbose=${agent.verbose ? 'True' : 'False'},
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
    const allImports = new Set<string>();

    const toolDefs = tools.map((t) => {
      const { params, imports, docParams } = generatePythonToolParams(t);
      imports.forEach((i) => allImports.add(i));

      return `
@tool
def ${t.name || 'unknown_tool'}(${params}) -> str:
    """${t.description || 'Tool implementation'}

    Args:
${docParams}
    """
    raise NotImplementedError("Tool '${t.name || 'tool'}' requires implementation")
`;
    });

    const extraImports =
      allImports.size > 0 ? '\n' + Array.from(allImports).join('\n') : '';

    return `"""
CrewAI Tool Implementations
Generated from OSSA manifest: ${manifest.metadata?.name || 'unknown'}
"""

from crewai_tools import tool
from typing import Any${extraImports}

${toolDefs.join('\n')}

def get_tools() -> list:
    """Return all available tools"""
    return [
${tools.map((t) => `        ${t.name || 'unknown_tool'}`).join(',\n')}
    ]
`;
  }

  /**
   * Generate crew/__init__.py - Crew module exports
   */
  private generateCrewCode(config: any, manifest: OssaAgent): string {
    return `"""
${manifest.metadata?.name || 'CrewAI'} Crew Module
Generated from OSSA manifest

This module exports the main crew instance.
"""

from .crew import ${this.toPascalCase(manifest.metadata?.name || 'crew')}

__all__ = ['${this.toPascalCase(manifest.metadata?.name || 'crew')}']
`;
  }

  /**
   * Generate crew/crew.py - Main crew setup
   */
  private generateCrewSetupCode(config: any, manifest: OssaAgent): string {
    const className = this.toPascalCase(manifest.metadata?.name || 'crew');

    return `"""
${manifest.metadata?.name || 'CrewAI'} Crew Setup
Generated from OSSA manifest: ${manifest.metadata?.name || 'unknown'}

This module defines the main crew orchestration.
"""

from crewai import Crew, Process
from agents import agents
from tasks import tasks


class ${className}:
    """Main crew orchestration class"""

    def __init__(self):
        """Initialize the crew"""
        self.agents = agents
        self.tasks = tasks
        self.crew = self._create_crew()

    def _create_crew(self) -> Crew:
        """Create and configure the crew"""
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.${config.process || 'sequential'},
            verbose=${config.verbose ? 'True' : 'False'},
        )

    def kickoff(self, inputs: dict = None) -> str:
        """
        Execute the crew with optional inputs

        Args:
            inputs: Dictionary of input parameters

        Returns:
            Crew execution result
        """
        if inputs is None:
            inputs = {}

        return self.crew.kickoff(inputs=inputs)

    async def kickoff_async(self, inputs: dict = None) -> str:
        """
        Execute the crew asynchronously

        Args:
            inputs: Dictionary of input parameters

        Returns:
            Crew execution result
        """
        if inputs is None:
            inputs = {}

        return await self.crew.kickoff_async(inputs=inputs)
`;
  }

  /**
   * Generate tools/custom_tools.py - Custom tool implementations
   */
  private generateCustomToolsCode(manifest: OssaAgent): string {
    const tools = (manifest.spec?.tools || []) as any[];
    const allImports = new Set<string>();

    const toolDefs = tools.map((t) => {
      const { params, imports, docParams } = generatePythonToolParams(t);
      imports.forEach((i) => allImports.add(i));

      return `@tool("${t.name || 'unknown_tool'}")
def ${t.name || 'unknown_tool'}(${params}) -> str:
    """
    ${t.description || 'Tool implementation'}

    Args:
${docParams}

    Returns:
        Tool execution result
    """
    raise NotImplementedError("Tool '${t.name || 'tool'}' requires implementation")
`;
    });

    const extraImports =
      allImports.size > 0 ? '\n' + Array.from(allImports).join('\n') : '';

    return `"""
Custom Tool Implementations
Generated from OSSA manifest: ${manifest.metadata?.name || 'unknown'}

Implement your custom tools here following CrewAI's tool decorator pattern.
"""

from crewai_tools import tool
from typing import Any, Optional${extraImports}
import os


${toolDefs.join('\n\n')}


# Add more custom tools as needed
${
  tools.length === 0
    ? `
@tool("example_tool")
def example_tool(query: str) -> str:
    """
    Example tool implementation

    Args:
        query: Query string

    Returns:
        Tool result
    """
    raise NotImplementedError("Example tool requires implementation")
`
    : ''
}
`;
  }

  /**
   * Generate main.py - Entry point
   */
  private generateMainCode(manifest: OssaAgent): string {
    const className = this.toPascalCase(manifest.metadata?.name || 'crew');
    const llmProvider = (manifest.spec?.llm as any)?.provider || 'openai';
    const primaryApiKey =
      llmProvider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY';

    return `#!/usr/bin/env python3
"""
${manifest.metadata?.name || 'CrewAI Crew'} - Main Entry Point
Generated from OSSA manifest

Run this file to execute the crew.
"""

import os
import sys
from dotenv import load_dotenv
from crew import ${className}


def main():
    """Main execution function"""
    # Load environment variables
    load_dotenv()

    # Validate required environment variables
    required_vars = ['${primaryApiKey}']
    missing_vars = [var for var in required_vars if not os.getenv(var)]

    if missing_vars:
        print(f"Error: Missing required environment variables: {', '.join(missing_vars)}")
        print("Please copy .env.example to .env and set the required values")
        sys.exit(1)

    # Initialize crew
    print("Initializing ${manifest.metadata?.name || 'crew'}...")
    crew = ${className}()

    # Execute crew
    print("\\nExecuting crew...\\n")

    inputs = {
        # Add your input parameters here
        # "topic": "AI agents",
        # "context": "research paper",
    }

    try:
        result = crew.kickoff(inputs=inputs)

        print("\\n" + "="*80)
        print("CREW EXECUTION RESULT")
        print("="*80)
        print(result)
        print("="*80 + "\\n")

    except Exception as e:
        print(f"Error executing crew: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
`;
  }

  /**
   * Generate requirements.txt
   */
  private generateRequirements(): string {
    return `# CrewAI Framework
crewai>=0.28.0
crewai-tools>=0.4.0

# LLM Providers
openai>=1.12.0
anthropic>=0.18.0

# Utilities
python-dotenv>=1.0.0
pydantic>=2.6.0

# Optional: Enhanced features
langchain>=0.1.0
langchain-community>=0.0.20
`;
  }

  /**
   * Generate .env.example
   */
  private generateEnvExample(manifest: OssaAgent): string {
    const llmProvider = (manifest.spec?.llm as any)?.provider || 'openai';

    const primaryKey =
      llmProvider === 'anthropic'
        ? 'ANTHROPIC_API_KEY=sk-ant-...'
        : 'OPENAI_API_KEY=sk-...';
    const secondaryKey =
      llmProvider === 'anthropic'
        ? '# OPENAI_API_KEY=sk-...'
        : '# ANTHROPIC_API_KEY=sk-ant-...';

    return `# ${manifest.metadata?.name || 'CrewAI Crew'} Environment Configuration

# LLM Provider API Keys
${primaryKey}
${secondaryKey}

# CrewAI Configuration
CREWAI_VERBOSE=true
CREWAI_LOG_LEVEL=INFO

# Optional: Tool-specific configuration
# Add your tool-specific env vars here

# Optional: Logging and monitoring
# LANGSMITH_API_KEY=lsv2_pt_...
# LANGSMITH_PROJECT=${manifest.metadata?.name || 'crew'}
`;
  }

  /**
   * Generate .dockerignore
   */
  private generateDockerignore(): string {
    return `# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
.venv/

# Environment
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# Testing
.pytest_cache/
.coverage
htmlcov/

# Documentation build
docs/_build/

# OS
.DS_Store
Thumbs.db

# Git
.git/
.gitignore
`;
  }

  /**
   * Generate .gitignore
   */
  private generateGitignore(): string {
    return `# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Virtual Environment
venv/
ENV/
env/
.venv/

# Environment Variables
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*.sublime-project
*.sublime-workspace

# Testing
.pytest_cache/
.coverage
.coverage.*
htmlcov/
.tox/

# Jupyter
.ipynb_checkpoints/

# OS
.DS_Store
Thumbs.db
desktop.ini

# Logs
*.log
logs/

# CrewAI specific
crew_output/
`;
  }

  /**
   * Generate examples/basic_usage.py
   */
  private generateExampleUsage(manifest: OssaAgent): string {
    const className = this.toPascalCase(manifest.metadata?.name || 'crew');

    return `#!/usr/bin/env python3
"""
Basic Usage Example for ${manifest.metadata?.name || 'CrewAI Crew'}

This example demonstrates how to use the crew in your applications.
"""

import os
from dotenv import load_dotenv
from crew import ${className}


def basic_example():
    """Run a basic crew execution"""
    # Load environment
    load_dotenv()

    # Initialize crew
    crew = ${className}()

    # Prepare inputs
    inputs = {
        "topic": "artificial intelligence",
        "context": "Write a comprehensive analysis"
    }

    # Execute crew
    result = crew.kickoff(inputs=inputs)

    # Process result
    print("Crew Result:")
    print("-" * 80)
    print(result)

    return result


if __name__ == "__main__":
    basic_example()
`;
  }

  /**
   * Generate examples/async_usage.py
   */
  private generateExampleAsync(manifest: OssaAgent): string {
    const className = this.toPascalCase(manifest.metadata?.name || 'crew');

    return `#!/usr/bin/env python3
"""
Async Usage Example for ${manifest.metadata?.name || 'CrewAI Crew'}

This example demonstrates asynchronous crew execution.
"""

import asyncio
import os
from dotenv import load_dotenv
from crew import ${className}


async def async_example():
    """Run crew execution asynchronously"""
    # Load environment
    load_dotenv()

    # Initialize crew
    crew = ${className}()

    # Prepare inputs
    inputs = {
        "topic": "machine learning",
        "context": "Generate a detailed report"
    }

    # Execute crew asynchronously
    print("Starting async crew execution...")
    result = await crew.kickoff_async(inputs=inputs)

    # Process result
    print("\\nCrew Result:")
    print("-" * 80)
    print(result)

    return result


async def parallel_execution_example():
    """Run multiple crew executions in parallel"""
    # Load environment
    load_dotenv()

    # Initialize crew
    crew = ${className}()

    # Prepare multiple inputs
    inputs_list = [
        {"topic": "AI ethics", "context": "research"},
        {"topic": "neural networks", "context": "technical"},
        {"topic": "robotics", "context": "industry"},
    ]

    # Execute in parallel
    print("Starting parallel executions...")
    tasks = [crew.kickoff_async(inputs=inputs) for inputs in inputs_list]
    results = await asyncio.gather(*tasks)

    # Process results
    for i, result in enumerate(results, 1):
        print(f"\\nResult {i}:")
        print("-" * 80)
        print(result)

    return results


if __name__ == "__main__":
    # Run async example
    asyncio.run(async_example())

    # Uncomment to run parallel example
    # asyncio.run(parallel_execution_example())
`;
  }

  /**
   * Generate tests/test_crew.py
   */
  private generateTestsCode(manifest: OssaAgent): string {
    const className = this.toPascalCase(manifest.metadata?.name || 'crew');

    return `"""
Unit Tests for ${manifest.metadata?.name || 'CrewAI Crew'}
"""

import pytest
from crew import ${className}


class Test${className}:
    """Test suite for ${className}"""

    @pytest.fixture
    def crew(self):
        """Fixture to create crew instance"""
        return ${className}()

    def test_crew_initialization(self, crew):
        """Test crew initializes correctly"""
        assert crew is not None
        assert crew.agents is not None
        assert crew.tasks is not None
        assert crew.crew is not None

    def test_crew_has_agents(self, crew):
        """Test crew has configured agents"""
        assert len(crew.agents) > 0

    def test_crew_has_tasks(self, crew):
        """Test crew has configured tasks"""
        assert len(crew.tasks) > 0

    def test_kickoff_with_empty_inputs(self, crew):
        """Test crew execution with empty inputs"""
        # This test requires mocking or integration environment
        # Implement based on your testing strategy
        pass

    def test_kickoff_with_valid_inputs(self, crew):
        """Test crew execution with valid inputs"""
        # This test requires mocking or integration environment
        # Implement based on your testing strategy
        pass


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
`;
  }

  /**
   * Generate tests/test_tools.py
   */
  private generateTestToolsCode(manifest: OssaAgent): string {
    const tools = (manifest.spec?.tools || []) as any[];

    return `"""
Unit Tests for Custom Tools
"""

import pytest
from tools.custom_tools import *


${tools
  .map(
    (t) => `
class Test${this.toPascalCase(t.name || 'Tool')}:
    """Test suite for ${t.name || 'tool'}"""

    def test_${t.name || 'tool'}_executes(self):
        """Test ${t.name || 'tool'} executes without error"""
        result = ${t.name || 'tool'}("test input")
        assert result is not None
        assert isinstance(result, str)

    def test_${t.name || 'tool'}_handles_empty_input(self):
        """Test ${t.name || 'tool'} handles empty input"""
        result = ${t.name || 'tool'}("")
        assert result is not None
`
  )
  .join('\n')}


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
`;
  }

  /**
   * Convert string to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
      .replace(/^(.)/, (char) => char.toUpperCase());
  }

  /**
   * Generate README.md - Production-grade documentation
   */
  private generateReadme(manifest: OssaAgent, config: any): string {
    const projectName = manifest.metadata?.name || 'crewai-crew';
    const description =
      manifest.metadata?.description || 'CrewAI multi-agent crew';

    return `# ${projectName}

${description}

> **Generated from OSSA v${manifest.apiVersion?.split('/')[1] || getApiVersion()} manifest**

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Agents](#agents)
- [Tasks](#tasks)
- [Tools](#tools)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Overview

${manifest.spec?.role || 'This is a multi-agent crew built with CrewAI, designed to collaborate on complex tasks through structured agent orchestration.'}

### Key Specifications

- **Process Type**: ${config.process || 'sequential'}
- **Number of Agents**: ${config.agents.length}
- **Number of Tasks**: ${config.tasks.length}
- **LLM Provider**: ${(manifest.spec?.llm as any)?.provider || 'openai'}
- **Model**: ${(manifest.spec?.llm as any)?.model || 'gpt-4'}

## Features

- ✅ Multi-agent collaboration with CrewAI
- ✅ ${config.process === 'sequential' ? 'Sequential task processing' : 'Hierarchical agent organization'}
- ✅ Custom tool implementations
- ✅ Async execution support
- ✅ Environment-based configuration
- ✅ Production-ready structure
- ✅ Comprehensive testing
- ✅ Docker deployment ready

## Installation

### Prerequisites

- Python 3.9 or higher
- pip or poetry for package management
- OpenAI API key (or other LLM provider credentials)

### Setup

1. **Clone the repository**

\`\`\`bash
git clone <repository-url>
cd ${projectName}
\`\`\`

2. **Create virtual environment**

\`\`\`bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
\`\`\`

3. **Install dependencies**

\`\`\`bash
pip install -r requirements.txt
\`\`\`

4. **Configure environment**

\`\`\`bash
cp .env.example .env
# Edit .env with your API keys and configuration
\`\`\`

## Quick Start

### Basic Execution

\`\`\`bash
python main.py
\`\`\`

### Programmatic Usage

\`\`\`python
from crew import ${this.toPascalCase(projectName)}

# Initialize crew
crew = ${this.toPascalCase(projectName)}()

# Execute with inputs
result = crew.kickoff(inputs={
    "topic": "your topic here",
    "context": "additional context"
})

print(result)
\`\`\`

### Async Execution

\`\`\`python
import asyncio
from crew import ${this.toPascalCase(projectName)}

async def run():
    crew = ${this.toPascalCase(projectName)}()
    result = await crew.kickoff_async(inputs={
        "topic": "your topic"
    })
    return result

asyncio.run(run())
\`\`\`

## Configuration

### Environment Variables

See \`.env.example\` for all configuration options:

- \`OPENAI_API_KEY\`: Your OpenAI API key (required)
- \`CREWAI_VERBOSE\`: Enable verbose logging (default: true)
- \`CREWAI_LOG_LEVEL\`: Logging level (default: INFO)

### Crew Configuration

Modify \`crew/crew.py\` to adjust:

- Process type (sequential/hierarchical)
- Verbose mode
- Custom agent configurations

## Usage

### Examples

See the \`examples/\` directory for detailed usage examples:

- \`basic_usage.py\`: Simple crew execution
- \`async_usage.py\`: Asynchronous and parallel execution

### Running Examples

\`\`\`bash
python examples/basic_usage.py
python examples/async_usage.py
\`\`\`

## Project Structure

\`\`\`
${projectName}/
├── agents/                 # Agent definitions
│   └── __init__.py        # Agent configurations
├── tasks/                  # Task definitions
│   └── __init__.py        # Task configurations
├── tools/                  # Custom tools
│   ├── __init__.py        # Tool exports
│   └── custom_tools.py    # Tool implementations
├── crew/                   # Crew orchestration
│   ├── __init__.py        # Module exports
│   └── crew.py            # Main crew class
├── examples/               # Usage examples
│   ├── basic_usage.py
│   └── async_usage.py
├── tests/                  # Test suite
│   ├── test_crew.py
│   └── test_tools.py
├── main.py                 # Entry point
├── requirements.txt        # Python dependencies
├── .env.example           # Environment template
├── .gitignore             # Git ignore rules
├── README.md              # This file
└── DEPLOYMENT.md          # Deployment guide
\`\`\`

## Agents

This crew consists of ${config.agents.length} specialized agent(s):

${config.agents
  .map(
    (a: any, i: number) => `
### ${i + 1}. ${a.role}

**Goal:** ${a.goal}

**Backstory:** ${a.backstory}

**Capabilities:**
- Utilizes custom tools for enhanced functionality
- Collaborates with other agents in the crew
- Produces structured outputs for downstream tasks
`
  )
  .join('\n')}

## Tasks

The crew executes ${config.tasks.length} task(s) in ${config.process} order:

${config.tasks
  .map(
    (t: any, i: number) => `
### Task ${i + 1}: ${t.description}

- **Assigned Agent:** ${t.agent}
- **Expected Output:** ${t.expected_output || 'Completed task result'}
${i < config.tasks.length - 1 ? '- **Flows to:** Task ' + (i + 2) : '- **Final Output:** Yes'}
`
  )
  .join('\n')}

## Tools

Custom tools are implemented in \`tools/custom_tools.py\`:

${
  (manifest.spec?.tools || []).length > 0
    ? (manifest.spec?.tools as any[])
        .map(
          (t: any) => `
### ${t.name || 'Tool'}

${t.description || 'Custom tool implementation'}

\`\`\`python
from tools.custom_tools import ${t.name || 'tool'}

result = ${t.name || 'tool'}("input data")
\`\`\`
`
        )
        .join('\n')
    : `
No custom tools defined. Add tools in \`tools/custom_tools.py\`.
`
}

## Development

### Adding New Agents

Edit \`agents/__init__.py\`:

\`\`\`python
from crewai import Agent

new_agent = Agent(
    role="New Role",
    goal="Agent goal",
    backstory="Agent backstory",
    tools=get_tools(),
    verbose=True
)

agents.append(new_agent)
\`\`\`

### Adding New Tasks

Edit \`tasks/__init__.py\`:

\`\`\`python
from crewai import Task

new_task = Task(
    description="Task description",
    agent=agents[0],
    expected_output="Expected result"
)

tasks.append(new_task)
\`\`\`

### Adding Custom Tools

Edit \`tools/custom_tools.py\`:

\`\`\`python
from crewai_tools import tool

@tool("my_custom_tool")
def my_custom_tool(input: str) -> str:
    """Tool description"""
    # Implementation
    return result
\`\`\`

## Testing

Run the test suite:

\`\`\`bash
# Install test dependencies
pip install pytest pytest-cov pytest-asyncio

# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test file
pytest tests/test_crew.py -v
\`\`\`

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions covering:

- Docker deployment
- Kubernetes deployment
- Cloud platforms (AWS, GCP, Azure)
- Environment configuration
- Monitoring and logging
- Production best practices

### Quick Docker Deployment

\`\`\`bash
# Build image
docker build -t ${projectName}:latest .

# Run container
docker run -e OPENAI_API_KEY=your-key ${projectName}:latest
\`\`\`

## Troubleshooting

### Common Issues

**Import Errors**

\`\`\`bash
pip install -r requirements.txt --force-reinstall
\`\`\`

**API Key Errors**

Ensure your \`.env\` file has valid API keys:

\`\`\`bash
# Verify .env file exists
ls -la .env

# Check API key is set
source .env && echo $OPENAI_API_KEY
\`\`\`

**Agent Execution Failures**

Enable verbose logging:

\`\`\`python
crew = ${this.toPascalCase(projectName)}()
crew.crew.verbose = True
\`\`\`

### Debug Mode

Run with debug logging:

\`\`\`bash
CREWAI_LOG_LEVEL=DEBUG python main.py
\`\`\`

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

${manifest.metadata?.license || 'MIT'}

---

**Generated by OSSA v${manifest.apiVersion?.split('/')[1] || getApiVersion()}**

For more information about OSSA, visit: https://openstandardagents.org
`;
  }

  /**
   * Generate DEPLOYMENT.md - Production deployment guide
   */
  private generateDeploymentGuide(manifest: OssaAgent): string {
    const projectName = manifest.metadata?.name || 'crewai-crew';

    return `# Deployment Guide - ${projectName}

This guide covers production deployment options for your CrewAI crew.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Cloud Platforms](#cloud-platforms)
- [Environment Configuration](#environment-configuration)
- [Monitoring & Logging](#monitoring--logging)
- [Security Best Practices](#security-best-practices)
- [Scaling](#scaling)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Docker (20.10+) and Docker Compose (2.0+)
- kubectl (for Kubernetes deployments)
- Cloud CLI tools (AWS CLI, gcloud, or az)
- Valid LLM provider API keys

## Docker Deployment

### Dockerfile

Create a \`Dockerfile\` in the project root:

\`\`\`dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Run as non-root user
RUN useradd -m -u 1000 crewai && chown -R crewai:crewai /app
USER crewai

# Set environment
ENV PYTHONUNBUFFERED=1

# Run application
CMD ["python", "main.py"]
\`\`\`

### Build and Run

\`\`\`bash
# Build image
docker build -t ${projectName}:latest .

# Run container
docker run -d \\
  --name ${projectName} \\
  -e OPENAI_API_KEY=\${OPENAI_API_KEY} \\
  -e CREWAI_VERBOSE=true \\
  --restart unless-stopped \\
  ${projectName}:latest

# View logs
docker logs -f ${projectName}
\`\`\`

### Docker Compose

Create \`docker-compose.yml\`:

\`\`\`yaml
version: '3.8'

services:
  crew:
    build: .
    image: ${projectName}:latest
    container_name: ${projectName}
    env_file:
      - .env
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
    networks:
      - crew-network

networks:
  crew-network:
    driver: bridge
\`\`\`

Run with Docker Compose:

\`\`\`bash
docker-compose up -d
docker-compose logs -f
\`\`\`

## Kubernetes Deployment

### Deployment Manifest

Create \`k8s/deployment.yaml\`:

\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${projectName}
  labels:
    app: ${projectName}
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ${projectName}
  template:
    metadata:
      labels:
        app: ${projectName}
    spec:
      containers:
      - name: crew
        image: ${projectName}:latest
        ports:
        - containerPort: 8080
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: llm-credentials
              key: openai-api-key
        - name: CREWAI_VERBOSE
          value: "true"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          exec:
            command:
            - python
            - -c
            - "import sys; sys.exit(0)"
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          exec:
            command:
            - python
            - -c
            - "import sys; sys.exit(0)"
          initialDelaySeconds: 5
          periodSeconds: 5
\`\`\`

### Secret Management

\`\`\`bash
# Create secret for API keys
kubectl create secret generic llm-credentials \\
  --from-literal=openai-api-key=\${OPENAI_API_KEY}

# Deploy
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# Check status
kubectl get pods -l app=${projectName}
kubectl logs -f deployment/${projectName}
\`\`\`

## Cloud Platforms

### AWS ECS

\`\`\`bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker tag ${projectName}:latest <account>.dkr.ecr.us-east-1.amazonaws.com/${projectName}:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/${projectName}:latest

# Create ECS task definition and service
aws ecs create-service \\
  --cluster production \\
  --service-name ${projectName} \\
  --task-definition ${projectName}:1 \\
  --desired-count 3
\`\`\`

### Google Cloud Run

\`\`\`bash
# Build and deploy
gcloud builds submit --tag gcr.io/\${PROJECT_ID}/${projectName}
gcloud run deploy ${projectName} \\
  --image gcr.io/\${PROJECT_ID}/${projectName} \\
  --platform managed \\
  --region us-central1 \\
  --set-env-vars OPENAI_API_KEY=\${OPENAI_API_KEY}
\`\`\`

### Azure Container Instances

\`\`\`bash
# Build and push to ACR
az acr build --registry <registry-name> --image ${projectName}:latest .

# Deploy to ACI
az container create \\
  --resource-group <resource-group> \\
  --name ${projectName} \\
  --image <registry-name>.azurecr.io/${projectName}:latest \\
  --environment-variables OPENAI_API_KEY=\${OPENAI_API_KEY}
\`\`\`

## Environment Configuration

### Production Environment Variables

\`\`\`bash
# Required
OPENAI_API_KEY=sk-...

# Optional
CREWAI_VERBOSE=false
CREWAI_LOG_LEVEL=WARNING
CREWAI_MAX_RETRIES=3
CREWAI_TIMEOUT=300

# Monitoring
LANGSMITH_API_KEY=lsv2_pt_...
LANGSMITH_PROJECT=${projectName}-production

# Performance
CREWAI_CACHE_ENABLED=true
CREWAI_PARALLEL_EXECUTION=true
\`\`\`

### Secrets Management

**AWS Secrets Manager**

\`\`\`python
import boto3
import json

def get_secret(secret_name):
    client = boto3.client('secretsmanager')
    response = client.get_secret_value(SecretId=secret_name)
    return json.loads(response['SecretString'])
\`\`\`

**Kubernetes Secrets**

\`\`\`bash
kubectl create secret generic ${projectName}-secrets \\
  --from-literal=openai-api-key=\${OPENAI_API_KEY} \\
  --from-literal=anthropic-api-key=\${ANTHROPIC_API_KEY}
\`\`\`

## Monitoring & Logging

### Application Logging

Configure structured logging in \`main.py\`:

\`\`\`python
import logging
import json

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/crew.log'),
        logging.StreamHandler()
    ]
)
\`\`\`

### LangSmith Integration

\`\`\`python
import os
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_PROJECT"] = "${projectName}"
os.environ["LANGCHAIN_API_KEY"] = "your-langsmith-key"
\`\`\`

### Prometheus Metrics

Expose metrics for Prometheus scraping:

\`\`\`python
from prometheus_client import Counter, Histogram, start_http_server

crew_executions = Counter('crew_executions_total', 'Total crew executions')
crew_duration = Histogram('crew_duration_seconds', 'Crew execution duration')

# Start metrics server
start_http_server(8000)
\`\`\`

## Security Best Practices

1. **Never commit secrets to version control**
   - Use \`.env\` files (gitignored)
   - Use secret managers in production

2. **Use environment-specific configurations**
   - Separate dev/staging/prod configs
   - Validate all environment variables on startup

3. **Implement rate limiting**
   - Prevent API abuse
   - Use exponential backoff for retries

4. **Enable audit logging**
   - Log all crew executions
   - Track API usage and costs

5. **Regular security updates**
   - Keep dependencies updated
   - Monitor for vulnerabilities

6. **Network security**
   - Use private networks where possible
   - Implement proper firewall rules
   - Enable TLS for all communications

## Scaling

### Horizontal Scaling

**Kubernetes HPA:**

\`\`\`yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ${projectName}-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ${projectName}
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
\`\`\`

### Vertical Scaling

Adjust resource limits based on actual usage:

\`\`\`yaml
resources:
  requests:
    memory: "1Gi"
    cpu: "1000m"
  limits:
    memory: "2Gi"
    cpu: "2000m"
\`\`\`

## Troubleshooting

### Container Fails to Start

\`\`\`bash
# Check logs
docker logs ${projectName}

# Verify environment variables
docker exec ${projectName} env

# Test manually
docker run -it ${projectName}:latest /bin/bash
\`\`\`

### High Memory Usage

- Monitor memory consumption
- Adjust resource limits
- Implement caching strategies
- Consider using smaller LLM models

### API Rate Limits

- Implement exponential backoff
- Use rate limiting middleware
- Cache responses when possible
- Consider using multiple API keys

### Network Issues

\`\`\`bash
# Test connectivity
kubectl exec -it pod-name -- curl https://api.openai.com/v1/models

# Check DNS resolution
kubectl exec -it pod-name -- nslookup api.openai.com
\`\`\`

## Performance Optimization

1. **Enable caching** for repeated queries
2. **Use async execution** for parallel tasks
3. **Implement connection pooling**
4. **Optimize tool implementations**
5. **Monitor and tune LLM parameters**

## Rollback Procedures

**Docker:**

\`\`\`bash
docker tag ${projectName}:latest ${projectName}:backup
docker pull ${projectName}:previous
docker tag ${projectName}:previous ${projectName}:latest
\`\`\`

**Kubernetes:**

\`\`\`bash
kubectl rollout undo deployment/${projectName}
kubectl rollout status deployment/${projectName}
\`\`\`

## Health Checks

Implement health endpoints:

\`\`\`python
from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/health')
def health():
    return jsonify({"status": "healthy"}), 200

@app.route('/ready')
def ready():
    # Check crew initialization
    return jsonify({"status": "ready"}), 200
\`\`\`

---

For additional support, see the main [README.md](./README.md) or consult the OSSA documentation.
`;
  }
}
