/**
 * Test script to export multi-agent workflow with LangGraph
 */

import { LangChainExporter } from './src/services/export/langchain/langchain-exporter.js';
import type { OssaAgent } from './src/types/index.js';
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import YAML from 'yaml';

async function main() {
  // Load the multi-agent workflow manifest
  const manifestPath = './examples/multi-agent-research-workflow.ossa.yaml';
  const manifestContent = readFileSync(manifestPath, 'utf-8');
  const manifest = YAML.parse(manifestContent) as OssaAgent;

  console.log('📋 Loaded manifest:', manifest.metadata?.name);
  console.log('   Description:', manifest.metadata?.description);

  // Create exporter
  const exporter = new LangChainExporter();

  // Export with LangGraph support
  console.log('\n🔄 Exporting to LangChain with LangGraph...');
  const result = await exporter.export(manifest, {
    includeApi: true,
    includeOpenApi: true,
    includeDocker: true,
    includeTests: true,
    memoryBackend: 'buffer',
  });

  if (!result.success) {
    console.error('❌ Export failed:', result.error);
    process.exit(1);
  }

  console.log('✅ Export successful!');
  console.log('   Files generated:', result.files.length);
  console.log('   Duration:', result.metadata?.duration, 'ms');

  // Create output directory
  const outputDir = './export-test-output';
  mkdirSync(outputDir, { recursive: true });

  // Write all files
  for (const file of result.files) {
    const filePath = join(outputDir, file.path);
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, file.content, 'utf-8');
    console.log('   ✓', file.path);
  }

  // Check for LangGraph file
  const langGraphFile = result.files.find(f => f.path === 'langgraph.py');
  if (langGraphFile) {
    console.log('\n📊 LangGraph Multi-Agent Workflow Generated:');
    console.log('   File: langgraph.py');
    console.log('   Size:', langGraphFile.content.length, 'bytes');

    // Show some key features detected
    const content = langGraphFile.content;
    const hasStateGraph = content.includes('StateGraph');
    const hasAgentState = content.includes('class AgentState');
    const hasWorkflowBuilder = content.includes('def create_');
    const agentCount = (content.match(/def \w+_agent\(state: AgentState\)/g) || []).length;

    console.log('   Features:');
    console.log('     - StateGraph:', hasStateGraph ? '✓' : '✗');
    console.log('     - AgentState:', hasAgentState ? '✓' : '✗');
    console.log('     - Workflow Builder:', hasWorkflowBuilder ? '✓' : '✗');
    console.log('     - Agent Nodes:', agentCount);
  }

  console.log('\n✅ Export complete! Files written to:', outputDir);
  console.log('\n📦 Next steps:');
  console.log('   cd', outputDir);
  console.log('   pip install -r requirements.txt');
  console.log('   python langgraph.py');
}

main().catch(console.error);
