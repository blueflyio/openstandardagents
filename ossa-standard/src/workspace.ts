import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function initWorkspace(targetPath: string = '.') {
  const workspacePath = path.resolve(process.cwd(), targetPath);
  
  // Create basic directory structure
  const dirs = [
    'agents',
    'workflows',
    'protocols/mcp',
    'protocols/a2a',
    'config'
  ];

  await Promise.all(
    dirs.map(dir => 
      fs.ensureDir(path.join(workspacePath, dir))
    )
  );

  // Create workspace config
  const workspaceConfig = {
    name: path.basename(workspacePath),
    version: '0.1.0',
    description: 'An OSSA workspace',
    agents: {},
    protocols: {
      mcp: { enabled: true },
      a2a: { enabled: true }
    },
    dependencies: {}
  };

  await fs.writeJson(
    path.join(workspacePath, 'ossa-workspace.json'),
    workspaceConfig,
    { spaces: 2 }
  );

  // Create .gitignore
  const gitignoreContent = `# Dependencies
node_modules/
__pycache__/
*.py[cod]
*$py.class

# Environment variables
.env

# Logs
logs
*.log
npm-debug.log*

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db`;

  await fs.writeFile(
    path.join(workspacePath, '.gitignore'),
    gitignoreContent
  );

  // Create README
  const readmeContent = `# OSSA Workspace

This workspace follows the OSSA (Open Standard for Scalable Agents) specification.

## Getting Started

1. Install the OSSA CLI:
   \`\`\`bash
   npm install -g @ossa/cli
   \`\`\`

2. Create a new agent:
   \`\`\`bash
   ossa agent:create my-agent
   \`\`\`

3. Validate your agent:
   \`\`\`bash
   ossa validate agents/my-agent
   \`\`\`

## Directory Structure

- \`agents/\` - Individual agent implementations
- \`workflows/\` - Multi-agent workflows
- \`protocols/\` - Protocol adapters (MCP, A2A, etc.)
- \`config/\` - Workspace configuration

## Documentation

For more information, see the [OSSA Documentation](https://github.com/oss-agents/ossa-standard).
`;

  await fs.writeFile(
    path.join(workspacePath, 'README.md'),
    readmeContent
  );
}
