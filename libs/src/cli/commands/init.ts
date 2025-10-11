import { Command } from 'commander';
import chalk from 'chalk';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Init Command - Scaffold new OSSA knowledge graph project
 */

interface InitOptions {
  name: string;
  template: 'small' | 'medium' | 'full' | 'custom';
  agents?: string[];
  output: string;
}

export function createInitCommand(): Command {
  const cmd = new Command('init');

  cmd
    .description('Initialize a new knowledge graph project with templates')
    .argument('<name>', 'Project name')
    .option('-t, --template <type>', 'Template size: small (10 agents) | medium (100) | full (300) | custom', 'small')
    .option('-a, --agents <paths...>', 'Custom agent paths for template=custom')
    .option('-o, --output <dir>', 'Output directory', './ossa-project')
    .action(async (name: string, options) => {
      await executeInit(name, {
        ...options,
        name
      } as InitOptions);
    });

  return cmd;
}

async function executeInit(name: string, options: InitOptions): Promise<void> {
  console.log(chalk.blue(`🚀 Initializing OSSA Knowledge Graph Project: ${name}`));
  console.log(chalk.gray('═'.repeat(70)));

  const projectDir = join(options.output, name);

  // Create project structure
  console.log(chalk.cyan('\n📁 Creating project structure...'));
  createProjectStructure(projectDir);

  // Generate config files
  console.log(chalk.cyan('\n⚙️  Generating configuration files...'));
  generateConfigFiles(projectDir, name, options);

  // Generate sample scripts
  console.log(chalk.cyan('\n📜 Creating utility scripts...'));
  generateScripts(projectDir, options);

  // Generate .env.example
  console.log(chalk.cyan('\n🔐 Creating environment template...'));
  generateEnvExample(projectDir);

  // Generate README
  console.log(chalk.cyan('\n📝 Creating project documentation...'));
  generateReadme(projectDir, name, options);

  console.log(chalk.green('\n✅ Project initialized successfully!'));
  console.log(chalk.gray('─'.repeat(70)));
  console.log(chalk.white('\n📂 Project Structure:'));
  console.log(chalk.gray(`  ${projectDir}/`));
  console.log(chalk.gray(`    ├── config/`));
  console.log(chalk.gray(`    │   ├── knowledge-graph.config.json`));
  console.log(chalk.gray(`    │   └── agents.json`));
  console.log(chalk.gray(`    ├── scripts/`));
  console.log(chalk.gray(`    │   ├── build-graph.sh`));
  console.log(chalk.gray(`    │   ├── visualize.sh`));
  console.log(chalk.gray(`    │   └── export-metrics.sh`));
  console.log(chalk.gray(`    ├── .env.example`));
  console.log(chalk.gray(`    ├── .gitignore`));
  console.log(chalk.gray(`    └── README.md`));

  console.log(chalk.white('\n🎯 Next Steps:'));
  console.log(chalk.gray(`  1. cd ${projectDir}`));
  console.log(chalk.gray(`  2. cp .env.example .env`));
  console.log(chalk.gray(`  3. Edit config/knowledge-graph.config.json`));
  console.log(chalk.gray(`  4. Run: ./scripts/build-graph.sh`));

  console.log(chalk.yellow('\n💡 Template Info:'));
  const templateInfo = getTemplateInfo(options.template);
  console.log(chalk.gray(`  Template: ${options.template}`));
  console.log(chalk.gray(`  Agents: ${templateInfo.agentCount}`));
  console.log(chalk.gray(`  Description: ${templateInfo.description}`));

  console.log(chalk.gray('\n' + '═'.repeat(70)));
}

function createProjectStructure(projectDir: string): void {
  const dirs = [
    projectDir,
    join(projectDir, 'config'),
    join(projectDir, 'scripts'),
    join(projectDir, 'output'),
    join(projectDir, 'docs')
  ];

  for (const dir of dirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      console.log(chalk.gray(`  ✓ Created ${dir}`));
    }
  }
}

function generateConfigFiles(projectDir: string, name: string, options: InitOptions): void {
  // knowledge-graph.config.json
  const templatePaths = getTemplatePaths(options.template);
  const graphConfig = {
    project: {
      name,
      version: '0.1.0',
      description: `Knowledge graph for ${name} agent ecosystem`,
      template: options.template
    },
    agents: {
      paths: options.agents || templatePaths,
      autoDiscover: true,
      extensions: ['.yml', '.yaml']
    },
    graph: {
      buildRelationships: true,
      inferDomains: true,
      inferTypes: true,
      clusterByType: true
    },
    export: {
      formats: ['json', 'graphml', 'cytoscape'],
      outputDir: './output',
      includeStats: true
    },
    observability: {
      enableTracing: true,
      phoenixUrl: 'http://localhost:6006',
      otlpEndpoint: 'http://localhost:4317/v1/traces',
      prometheusUrl: 'http://localhost:9090'
    }
  };

  writeFileSync(join(projectDir, 'config', 'knowledge-graph.config.json'), JSON.stringify(graphConfig, null, 2));
  console.log(chalk.gray('  ✓ config/knowledge-graph.config.json'));

  // agents.json (starter list)
  const agentsConfig = {
    agents: getTemplateAgents(options.template),
    metadata: {
      totalAgents: getTemplateInfo(options.template).agentCount,
      template: options.template,
      generatedAt: new Date().toISOString()
    }
  };

  writeFileSync(join(projectDir, 'config', 'agents.json'), JSON.stringify(agentsConfig, null, 2));
  console.log(chalk.gray('  ✓ config/agents.json'));
}

function generateScripts(projectDir: string, options: InitOptions): void {
  // build-graph.sh
  const buildScript = `#!/bin/bash
# Build Knowledge Graph Script
set -e

echo "🧠 Building Knowledge Graph..."

# Load config
CONFIG_FILE="./config/knowledge-graph.config.json"
if [ ! -f "$CONFIG_FILE" ]; then
  echo "❌ Config file not found: $CONFIG_FILE"
  exit 1
fi

# Run OSSA knowledge graph builder
ossa knowledge-graph \\
  --buildkit /Users/flux423/Sites/LLM/agent_buildkit/.agents \\
  --ossa /Users/flux423/Sites/LLM/OSSA/.agents \\
  --output ./output \\
  --phoenix

echo "✅ Graph built successfully!"
echo "📁 Outputs: ./output/graph.json, graph.graphml, graph-cytoscape.json"
`;

  writeFileSync(join(projectDir, 'scripts', 'build-graph.sh'), buildScript, { mode: 0o755 });
  console.log(chalk.gray('  ✓ scripts/build-graph.sh'));

  // visualize.sh
  const visualizeScript = `#!/bin/bash
# Visualize Knowledge Graph Script
set -e

echo "📊 Generating visualizations..."

# Check if graph exists
if [ ! -f "./output/graph.json" ]; then
  echo "❌ Graph not found. Run ./scripts/build-graph.sh first"
  exit 1
fi

# Export stats
node -e "
  const graph = require('./output/graph.json');
  console.log('📊 Graph Statistics:');
  console.log('  Total Agents:', graph.stats.totalAgents);
  console.log('  Relationships:', graph.relationships.length);
  console.log('  Clusters:', Object.keys(graph.stats.byType).length);
  console.log();
  console.log('🏷️  By Type:', JSON.stringify(graph.stats.byType, null, 2));
  console.log();
  console.log('🌐 By Domain:', JSON.stringify(graph.stats.byDomain, null, 2));
"

echo ""
echo "💡 To visualize:"
echo "  - Import output/graph-cytoscape.json to Cytoscape"
echo "  - Import output/graph.graphml to Gephi/yEd"
echo "  - View output/graph.json programmatically"
`;

  writeFileSync(join(projectDir, 'scripts', 'visualize.sh'), visualizeScript, { mode: 0o755 });
  console.log(chalk.gray('  ✓ scripts/visualize.sh'));

  // export-metrics.sh
  const metricsScript = `#!/bin/bash
# Export Metrics Script
set -e

echo "📈 Exporting metrics to Prometheus..."

# Check if graph exists
if [ ! -f "./output/graph.json" ]; then
  echo "❌ Graph not found. Run ./scripts/build-graph.sh first"
  exit 1
fi

# Generate metrics file
cat > ./output/metrics.prom << EOF
# HELP agent_graph_total_agents Total number of agents in graph
# TYPE agent_graph_total_agents gauge
agent_graph_total_agents $(jq '.stats.totalAgents' ./output/graph.json)

# HELP agent_graph_relationships Total number of relationships
# TYPE agent_graph_relationships gauge
agent_graph_relationships $(jq '.relationships | length' ./output/graph.json)

# HELP agent_graph_clusters Total number of clusters
# TYPE agent_graph_clusters gauge
agent_graph_clusters $(jq '.stats.byType | length' ./output/graph.json)
EOF

echo "✅ Metrics exported to ./output/metrics.prom"
echo "📊 Push to Prometheus pushgateway or serve via HTTP"
`;

  writeFileSync(join(projectDir, 'scripts', 'export-metrics.sh'), metricsScript, { mode: 0o755 });
  console.log(chalk.gray('  ✓ scripts/export-metrics.sh'));
}

function generateEnvExample(projectDir: string): void {
  const envContent = `# OSSA Knowledge Graph Configuration

# Project Settings
PROJECT_NAME=my-knowledge-graph
ENVIRONMENT=development

# Agent Paths
AGENT_BUILDKIT_PATH=/Users/flux423/Sites/LLM/agent_buildkit/.agents
OSSA_AGENTS_PATH=/Users/flux423/Sites/LLM/OSSA/.agents

# Observability
ENABLE_PHOENIX_TRACING=true
PHOENIX_URL=http://localhost:6006
OTLP_ENDPOINT=http://localhost:4317/v1/traces

# Prometheus
PROMETHEUS_URL=http://localhost:9090
PROMETHEUS_PUSHGATEWAY=http://localhost:9091

# Graph Export
GRAPH_OUTPUT_DIR=./output
EXPORT_FORMATS=json,graphml,cytoscape

# Optional: Drupal/ECA Integration
DRUPAL_API_URL=http://localhost:8080
DRUPAL_API_KEY=your-api-key-here
ECA_WEBHOOK_ENDPOINT=/api/eca/trigger
`;

  writeFileSync(join(projectDir, '.env.example'), envContent);
  console.log(chalk.gray('  ✓ .env.example'));

  // .gitignore
  const gitignoreContent = `.env
output/
*.log
node_modules/
dist/
.DS_Store
`;

  writeFileSync(join(projectDir, '.gitignore'), gitignoreContent);
  console.log(chalk.gray('  ✓ .gitignore'));
}

function generateReadme(projectDir: string, name: string, options: InitOptions): void {
  const templateInfo = getTemplateInfo(options.template);
  const readme = `# ${name}

OSSA Knowledge Graph Project - ${options.template} template

## Overview

This project builds a knowledge graph from ${templateInfo.agentCount} agents across your OSSA ecosystem.

**Template:** ${options.template}
**Description:** ${templateInfo.description}

## Quick Start

\`\`\`bash
# 1. Configure environment
cp .env.example .env
# Edit .env with your settings

# 2. Build knowledge graph
./scripts/build-graph.sh

# 3. View statistics
./scripts/visualize.sh

# 4. Export metrics
./scripts/export-metrics.sh
\`\`\`

## Project Structure

\`\`\`
.
├── config/
│   ├── knowledge-graph.config.json  # Main configuration
│   └── agents.json                  # Agent registry
├── scripts/
│   ├── build-graph.sh              # Build graph from agents
│   ├── visualize.sh                # Generate visualizations
│   └── export-metrics.sh           # Export to Prometheus
├── output/                         # Generated graphs
│   ├── graph.json
│   ├── graph.graphml
│   └── graph-cytoscape.json
└── docs/                           # Documentation
\`\`\`

## Configuration

Edit \`config/knowledge-graph.config.json\` to customize:

- **Agent Paths**: Where to discover agents
- **Graph Settings**: Relationship building, domain inference
- **Export Formats**: JSON, GraphML, Cytoscape
- **Observability**: Phoenix tracing, Prometheus metrics

## Visualization

### Cytoscape
\`\`\`bash
# Import output/graph-cytoscape.json into Cytoscape Desktop
# Or use cytoscape.js for web visualization
\`\`\`

### Gephi
\`\`\`bash
# Import output/graph.graphml into Gephi
# Use Force Atlas 2 layout for best results
\`\`\`

### Phoenix Dashboard
\`\`\`bash
# View traces at http://localhost:6006
# Traces show graph construction performance
\`\`\`

## Advanced Usage

### Drupal/ECA Integration

Trigger graph rebuilds from Drupal events:

\`\`\`yaml
# ECA Model: Rebuild Graph on Content Update
events:
  - entity_update:node
conditions:
  - content_type: analysis
actions:
  - http_request:
      url: {{ env.DRUPAL_API_URL }}/api/graph/rebuild
      method: POST
\`\`\`

### Git Hooks

Auto-rebuild on push:

\`\`\`bash
# .git/hooks/pre-push
#!/bin/bash
./scripts/build-graph.sh
git add output/
\`\`\`

### CI/CD

Schedule nightly builds:

\`\`\`yaml
# .gitlab-ci.yml
nightly-graph-rebuild:
  schedule: "0 2 * * *"
  script:
    - ./scripts/build-graph.sh
    - ./scripts/export-metrics.sh
\`\`\`

## Metrics

Graph metrics are available in Prometheus format:

- \`agent_graph_total_agents\` - Total agents
- \`agent_graph_relationships\` - Total edges
- \`agent_graph_clusters\` - Agent type clusters

## Resources

- [OSSA Documentation](https://github.com/your-org/ossa)
- [Agent BuildKit](https://github.com/your-org/agent-buildkit)
- [Knowledge Graph Guide](./docs/AGENT_KNOWLEDGE_GRAPH_GUIDE.md)

## License

MIT
`;

  writeFileSync(join(projectDir, 'README.md'), readme);
  console.log(chalk.gray('  ✓ README.md'));
}

function getTemplatePaths(template: string): string[] {
  switch (template) {
    case 'small':
      return ['/Users/flux423/Sites/LLM/OSSA/.agents'];
    case 'medium':
      return ['/Users/flux423/Sites/LLM/agent_buildkit/.agents'];
    case 'full':
      return ['/Users/flux423/Sites/LLM/agent_buildkit/.agents', '/Users/flux423/Sites/LLM/OSSA/.agents'];
    default:
      return [];
  }
}

function getTemplateAgents(template: string): any[] {
  // Return sample agent definitions based on template
  switch (template) {
    case 'small':
      return [
        { id: 'agent-1', name: 'Orchestrator', type: 'orchestrator' },
        { id: 'agent-2', name: 'Worker 1', type: 'worker' },
        { id: 'agent-3', name: 'Worker 2', type: 'worker' },
        { id: 'agent-4', name: 'Monitor', type: 'monitor' },
        { id: 'agent-5', name: 'Critic', type: 'critic' }
      ];
    case 'medium':
    case 'full':
      return [{ note: 'Auto-discovered from agent paths' }];
    default:
      return [];
  }
}

function getTemplateInfo(template: string): { agentCount: string; description: string } {
  switch (template) {
    case 'small':
      return {
        agentCount: '~10',
        description: 'Small project with OSSA core agents'
      };
    case 'medium':
      return {
        agentCount: '~100',
        description: 'Medium project with agent_buildkit agents'
      };
    case 'full':
      return {
        agentCount: '~300',
        description: 'Full ecosystem with all agents'
      };
    default:
      return {
        agentCount: 'custom',
        description: 'Custom agent selection'
      };
  }
}

export default createInitCommand;
