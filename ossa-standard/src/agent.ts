import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import { validateAgent } from './validation';

type AgentType = 'tool' | 'orchestrator' | 'specialized';

interface AgentOptions {
  type: AgentType;
  description?: string;
  capabilities?: string[];
}

export async function createAgent(name: string, options: Partial<AgentOptions> = {}) {
  const agentPath = path.join(process.cwd(), 'agents', name);
  
  if (await fs.pathExists(agentPath)) {
    throw new Error(`Agent '${name}' already exists at ${agentPath}`);
  }

  // Gather additional information if not provided
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'description',
      message: 'Agent description:',
      default: options.description || `A ${options.type || 'tool'} agent`,
      when: !options.description,
    },
    {
      type: 'checkbox',
      name: 'capabilities',
      message: 'Select capabilities:',
      choices: [
        'web_search',
        'code_execution',
        'file_io',
        'api_integration',
        'data_processing',
        'natural_language',
      ],
      default: options.capabilities || [],
      when: !options.capabilities || options.capabilities.length === 0,
    },
  ]);

  const agentInfo = {
    name,
    version: '0.1.0',
    description: options.description || answers.description,
    type: options.type || 'tool',
    capabilities: options.capabilities || answers.capabilities || [],
    protocols: ['mcp'],
    dependencies: {
      python: '>=3.8',
    },
    entrypoint: 'src/main.py',
    environment: {
      variables: {
        API_KEY: {
          description: 'API key for external services',
          required: true,
          secret: true,
        },
      },
    },
    versionCompatibility: {
      min: '0.1.0',
      max: '1.0.0',
    },
  };

  // Create agent directory structure
  await fs.ensureDir(path.join(agentPath, 'src'));
  await fs.ensureDir(path.join(agentPath, 'tests'));
  await fs.ensureDir(path.join(agentPath, 'docs'));

  // Create manifest
  await fs.writeJson(
    path.join(agentPath, 'manifest.json'),
    agentInfo,
    { spaces: 2 }
  );

  // Create basic Python entrypoint
  const pythonEntrypoint = `"""
${agentInfo.description}
"""

def main():
    print("Hello from ${name} agent!")

if __name__ == "__main__":
    main()`;

  await fs.writeFile(
    path.join(agentPath, agentInfo.entrypoint),
    pythonEntrypoint
  );

  // Create basic test
  const testContent = `import unittest
import sys
import os

# Add agent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

class Test${name.replace(/[^a-zA-Z0-9]/g, '')}(unittest.TestCase):
    def test_placeholder(self):
        self.assertTrue(True)

if __name__ == '__main__':
    unittest.main()`;

  await fs.writeFile(
    path.join(agentPath, 'tests', 'test_agent.py'),
    testContent
  );

  // Create README
  const readmeContent = `# ${name}

${agentInfo.description}

## Capabilities

${agentInfo.capabilities.map(cap => `- ${cap}`).join('\n')}

## Getting Started

1. Install dependencies:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

2. Run the agent:
   \`\`\`bash
   python ${agentInfo.entrypoint}
   \`\`\`

## Configuration

Set the following environment variables:

- \`API_KEY\`: ${agentInfo.environment.variables.API_KEY.description}
`;

  await fs.writeFile(
    path.join(agentPath, 'README.md'),
    readmeContent
  );

  // Create requirements.txt
  await fs.writeFile(
    path.join(agentPath, 'requirements.txt'),
    '# Add your Python dependencies here\nrequests>=2.25.0\n'
  );

  // Validate the created agent
  const validation = await validateAgent(agentPath);
  if (!validation.valid) {
    throw new Error(`Failed to validate created agent: ${JSON.stringify(validation.errors, null, 2)}`);
  }

  return agentPath;
}
