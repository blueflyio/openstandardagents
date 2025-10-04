import { Command } from 'commander';
import { VisualizationService, type VisualizationType } from '../../services/visualization/index.js';
import chalk from 'chalk';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Visualize Command - Generate architecture visualizations
 *
 * Provides CLI access to all visualization capabilities:
 * - Mermaid diagrams (6 types)
 * - Graphviz graphs (7 types)
 * - D3.js data (9 formats)
 * - Complete suites
 * - Batch processing
 */

export function createVisualizeCommand(): Command {
  const cmd = new Command('visualize');

  cmd
    .description('Generate architecture visualizations from OpenAPI specifications')
    .option('-s, --spec <path>', 'Path to OpenAPI specification file')
    .option('-t, --type <type>', 'Visualization type', 'mermaid-flowchart')
    .option('-o, --output <path>', 'Output file path')
    .option('--suite', 'Generate complete visualization suite')
    .option('--list-types', 'List all available visualization types')
    .action(async (options) => {
      if (options.listTypes) {
        listVisualizationTypes();
        return;
      }

      await executeVisualize(options);
    });

  // Subcommands
  cmd
    .command('mermaid')
    .description('Generate Mermaid diagrams')
    .option('-s, --spec <path>', 'OpenAPI spec path', required())
    .option('-t, --type <type>', 'Diagram type', 'flowchart')
    .option('-o, --output <path>', 'Output file')
    .action(async (options) => {
      await generateMermaid(options);
    });

  cmd
    .command('graphviz')
    .description('Generate Graphviz DOT graphs')
    .option('-s, --spec <path>', 'OpenAPI spec path', required())
    .option('-t, --type <type>', 'Graph type', 'digraph')
    .option('-o, --output <path>', 'Output file')
    .option('--layout <layout>', 'Layout engine', 'dot')
    .action(async (options) => {
      await generateGraphviz(options);
    });

  cmd
    .command('d3')
    .description('Generate D3.js compatible data')
    .option('-s, --spec <path>', 'OpenAPI spec path', required())
    .option('-t, --type <type>', 'Data format', 'force')
    .option('-o, --output <path>', 'Output file')
    .action(async (options) => {
      await generateD3(options);
    });

  cmd
    .command('suite')
    .description('Generate complete visualization suite')
    .requiredOption('-s, --spec <path>', 'OpenAPI spec path')
    .requiredOption('-o, --output-dir <dir>', 'Output directory')
    .action(async (options, command) => {
      // Merge parent options with command options
      const parentOpts = command.parent?.opts() || {};
      const mergedOpts = { ...parentOpts, ...options };
      await generateSuite(mergedOpts);
    });

  return cmd;
}

/**
 * Main visualize execution
 */
async function executeVisualize(options: any): Promise<void> {
  try {
    const vizService = new VisualizationService();

    console.log(chalk.blue('🎨 OSSA Visualization Generator'));
    console.log(chalk.gray('─'.repeat(50)));

    if (options.suite) {
      if (!options.spec) {
        console.error(chalk.red('Error: --spec required for suite generation'));
        process.exit(1);
      }

      console.log(chalk.cyan(`Generating suite from: ${options.spec}`));
      const suite = await vizService.generateSuite(options.spec);

      const outputDir = options.outputDir || './visualizations';
      await vizService.exportSuite(suite, outputDir);

      console.log(chalk.green(`✓ Suite generated: ${suite.size} visualizations`));
      console.log(chalk.gray(`  Output: ${path.resolve(outputDir)}`));
    } else {
      if (!options.spec) {
        console.error(chalk.red('Error: --spec required'));
        process.exit(1);
      }

      const result = await vizService.generate({
        type: options.type as VisualizationType,
        specPath: options.spec
      });

      if (options.output) {
        await vizService.exportToFile(result, options.output);
        console.log(chalk.green(`✓ Visualization saved: ${options.output}`));
      } else {
        console.log(chalk.yellow('\nVisualization Output:'));
        console.log(chalk.gray('─'.repeat(50)));

        if (typeof result.content === 'string') {
          console.log(result.content);
        } else {
          console.log(JSON.stringify(result.content, null, 2));
        }
      }

      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.cyan('Metadata:'));
      console.log(chalk.gray(`  Type: ${result.type}`));
      console.log(chalk.gray(`  Format: ${result.format}`));
      console.log(chalk.gray(`  Nodes: ${result.metadata.nodeCount || 'N/A'}`));
      console.log(chalk.gray(`  Edges: ${result.metadata.edgeCount || 'N/A'}`));
    }
  } catch (error) {
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

/**
 * Generate Mermaid diagram
 */
async function generateMermaid(options: any): Promise<void> {
  const vizService = new VisualizationService();
  const type = `mermaid-${options.type}` as VisualizationType;

  console.log(chalk.blue(`Generating Mermaid ${options.type} diagram...`));

  const result = await vizService.generate({
    type,
    specPath: options.spec
  });

  if (options.output) {
    await vizService.exportToFile(result, options.output);
    console.log(chalk.green(`✓ Saved: ${options.output}`));
  } else {
    console.log(result.content);
  }
}

/**
 * Generate Graphviz graph
 */
async function generateGraphviz(options: any): Promise<void> {
  const vizService = new VisualizationService();
  const type = `graphviz-${options.type}` as VisualizationType;

  console.log(chalk.blue(`Generating Graphviz ${options.type} graph...`));

  const result = await vizService.generate({
    type,
    specPath: options.spec,
    options: {
      layout: options.layout
    }
  });

  if (options.output) {
    await vizService.exportToFile(result, options.output);
    console.log(chalk.green(`✓ Saved: ${options.output}`));
  } else {
    console.log(result.content);
  }
}

/**
 * Generate D3 data
 */
async function generateD3(options: any): Promise<void> {
  const vizService = new VisualizationService();
  const type = `d3-${options.type}` as VisualizationType;

  console.log(chalk.blue(`Generating D3 ${options.type} data...`));

  const result = await vizService.generate({
    type,
    specPath: options.spec
  });

  const content = typeof result.content === 'string' ? result.content : JSON.stringify(result.content, null, 2);

  if (options.output) {
    await fs.writeFile(options.output, content, 'utf-8');
    console.log(chalk.green(`✓ Saved: ${options.output}`));
  } else {
    console.log(content);
  }
}

/**
 * Generate complete suite
 */
async function generateSuite(options: any): Promise<void> {
  const vizService = new VisualizationService();

  // Debug: log received options
  console.log(chalk.gray('DEBUG: Received options:'), options);

  // Commander.js converts --output-dir to outputDir in camelCase
  const specPath = options.spec;
  const outputDir = options.outputDir;

  if (!specPath) {
    console.error(chalk.red('Error: --spec is required'));
    process.exit(1);
  }

  if (!outputDir) {
    console.error(chalk.red('Error: --output-dir is required'));
    process.exit(1);
  }

  console.log(chalk.blue('Generating visualization suite...'));
  console.log(chalk.gray(`Spec: ${specPath}`));
  console.log(chalk.gray(`Output: ${outputDir}`));

  const suite = await vizService.generateSuite(specPath);
  await vizService.exportSuite(suite, outputDir);

  console.log(chalk.green(`\n✓ Generated ${suite.size} visualizations:`));

  for (const type of suite.keys()) {
    console.log(chalk.gray(`  • ${type}`));
  }

  console.log(chalk.cyan(`\nOutput directory: ${path.resolve(outputDir)}`));
}

/**
 * List all visualization types
 */
function listVisualizationTypes(): void {
  console.log(chalk.blue('\n📊 Available Visualization Types\n'));

  console.log(chalk.cyan('Mermaid Diagrams:'));
  console.log(chalk.gray('  mermaid-flowchart   - Flow diagram of agent interactions'));
  console.log(chalk.gray('  mermaid-class       - Class hierarchy of agents'));
  console.log(chalk.gray('  mermaid-sequence    - Sequence diagram of workflows'));
  console.log(chalk.gray('  mermaid-state       - Agent lifecycle state machine'));
  console.log(chalk.gray('  mermaid-erd         - Entity relationship diagram'));
  console.log(chalk.gray('  mermaid-architecture - High-level architecture diagram'));

  console.log(chalk.cyan('\nGraphviz Graphs:'));
  console.log(chalk.gray('  graphviz-digraph    - Directed graph of relationships'));
  console.log(chalk.gray('  graphviz-cluster    - Clustered graph by agent type'));
  console.log(chalk.gray('  graphviz-dependency - Dependency graph'));
  console.log(chalk.gray('  graphviz-execution  - Execution flow graph'));
  console.log(chalk.gray('  graphviz-capability - Capability mapping'));
  console.log(chalk.gray('  graphviz-communication - Communication patterns'));

  console.log(chalk.cyan('\nD3.js Data Formats:'));
  console.log(chalk.gray('  d3-force       - Force-directed graph data'));
  console.log(chalk.gray('  d3-hierarchy   - Hierarchical tree data'));
  console.log(chalk.gray('  d3-network     - Network topology data'));
  console.log(chalk.gray('  d3-matrix      - Adjacency matrix data'));
  console.log(chalk.gray('  d3-sankey      - Sankey flow diagram data'));
  console.log(chalk.gray('  d3-chord       - Chord relationship data'));

  console.log(chalk.gray('\nUse: ossa visualize --type <type> --spec <path>\n'));
}

/**
 * Helper for required options
 */
function required(): string {
  return undefined as any; // Commander will enforce
}

export default createVisualizeCommand;
