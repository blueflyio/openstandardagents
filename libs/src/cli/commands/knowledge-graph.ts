import { Command } from 'commander';
import { AgentGraphBuilder } from '../../services/knowledge-graph/AgentGraphBuilder.js';
import chalk from 'chalk';
import { writeFileSync } from 'fs';
import { trace, context } from '@opentelemetry/api';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

/**
 * Knowledge Graph Command - Build agent graph with Phoenix tracing
 */

export function createKnowledgeGraphCommand(): Command {
  const cmd = new Command('knowledge-graph');

  cmd
    .description('Build knowledge graph from all agents with Phoenix tracing')
    .option('--buildkit <path>', 'agent_buildkit path', '/Users/flux423/Sites/LLM/agent_buildkit/.agents')
    .option('--ossa <path>', 'OSSA agents path', '/Users/flux423/Sites/LLM/OSSA/.agents')
    .option('-o, --output <dir>', 'Output directory', './knowledge-graph')
    .option('--phoenix', 'Send traces to Phoenix (port 6006)', true)
    .action(async (options) => {
      await executeKnowledgeGraph(options);
    });

  return cmd;
}

async function executeKnowledgeGraph(options: any): Promise<void> {
  console.log(chalk.blue('🧠 Building Agent Knowledge Graph with Phoenix Tracing'));
  console.log(chalk.gray('═'.repeat(70)));

  // Initialize OpenTelemetry with Phoenix exporter
  let sdk: NodeSDK | undefined;
  if (options.phoenix) {
    try {
      sdk = await initializePhoenixTracing();
    } catch (error) {
      console.log(chalk.yellow('⚠️  Phoenix not available, continuing without tracing'));
    }
  }

  const tracer = trace.getTracer('knowledge-graph-cli');
  const mainSpan = tracer.startSpan('build_knowledge_graph_main');

  try {
    const startTime = Date.now();

    // Step 1: Load agents
    console.log(chalk.cyan('\n📥 Step 1: Loading agents from filesystem...'));
    const builder = new AgentGraphBuilder();

    const paths = [options.buildkit, options.ossa].filter(Boolean);
    await builder.loadAgents(paths);

    // Step 2: Build relationships
    console.log(chalk.cyan('\n🔗 Step 2: Building relationships...'));
    await builder.buildRelationships();

    // Step 3: Generate complete graph
    console.log(chalk.cyan('\n📊 Step 3: Generating knowledge graph...'));
    const graph = await builder.buildGraph();

    // Step 4: Export formats
    console.log(chalk.cyan('\n💾 Step 4: Exporting graph formats...'));
    const exports = await builder.exportGraph(graph);

    // Write outputs
    writeFileSync(`${options.output}/graph.json`, exports.json);
    writeFileSync(`${options.output}/graph.graphml`, exports.graphml);
    writeFileSync(`${options.output}/graph-cytoscape.json`, exports.cytoscape);

    const duration = Date.now() - startTime;

    // Display results
    console.log(chalk.green('\n✅ Knowledge Graph Built Successfully!'));
    console.log(chalk.gray('─'.repeat(70)));
    console.log(chalk.white('\n📊 Graph Statistics:'));
    console.log(chalk.gray(`  Total Agents:     ${graph.stats.totalAgents}`));
    console.log(chalk.gray(`  Relationships:    ${graph.relationships.length}`));
    console.log(chalk.gray(`  Clusters:         ${graph.clusters.size}`));
    console.log(chalk.gray(`  Avg Dependencies: ${graph.stats.avgDependencies.toFixed(2)}`));

    console.log(chalk.white('\n🏷️  Agents by Type:'));
    for (const [type, count] of Object.entries(graph.stats.byType)) {
      console.log(chalk.gray(`  ${type.padEnd(15)}: ${count}`));
    }

    console.log(chalk.white('\n🌐 Top Domains:'));
    const topDomains = Object.entries(graph.stats.byDomain)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
    for (const [domain, count] of topDomains) {
      console.log(chalk.gray(`  ${domain.padEnd(20)}: ${count} agents`));
    }

    console.log(chalk.white('\n💾 Exported Files:'));
    console.log(chalk.gray(`  ${options.output}/graph.json (JSON)`));
    console.log(chalk.gray(`  ${options.output}/graph.graphml (GraphML)`));
    console.log(chalk.gray(`  ${options.output}/graph-cytoscape.json (Cytoscape)`));

    console.log(chalk.white(`\n⏱️  Duration: ${duration}ms`));

    if (options.phoenix) {
      console.log(chalk.yellow('\n🔥 Phoenix Traces:'));
      console.log(chalk.gray(`  Dashboard: http://localhost:6006`));
      console.log(chalk.gray(`  View traces for: build_knowledge_graph_main`));
    }

    console.log(chalk.gray('═'.repeat(70)));

    mainSpan.setStatus({ code: 1 }); // OK
    mainSpan.setAttribute('total_agents', graph.stats.totalAgents);
    mainSpan.setAttribute('total_relationships', graph.relationships.length);
    mainSpan.setAttribute('duration_ms', duration);
  } catch (error) {
    console.error(chalk.red('\n❌ Error building knowledge graph:'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));

    mainSpan.setStatus({
      code: 2, // ERROR
      message: error instanceof Error ? error.message : 'Unknown error'
    });

    process.exit(1);
  } finally {
    mainSpan.end();

    // Flush traces to Phoenix
    if (sdk) {
      try {
        await sdk.shutdown();
        console.log(chalk.gray('\n📤 Traces sent to Phoenix'));
      } catch (error) {
        console.log(chalk.yellow('\n⚠️  Phoenix not available (traces not sent)'));
      }
    }
  }
}

async function initializePhoenixTracing(): Promise<NodeSDK> {
  const exporter = new OTLPTraceExporter({
    url: 'http://localhost:4317/v1/traces'
  });

  const sdk = new NodeSDK({
    traceExporter: exporter
  });

  await sdk.start();
  console.log(chalk.gray('🔥 Phoenix tracing initialized (port 4317)'));

  return sdk;
}

export default createKnowledgeGraphCommand;
