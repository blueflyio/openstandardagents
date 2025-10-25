import { execSync } from 'child_process';

const services = [
  { id: 'agent-brain', name: 'Agent Brain', description: 'Qdrant vector database client for semantic search and RAG', port: 6333 },
  { id: 'agent-protocol', name: 'Agent Protocol', description: 'MCP server for Claude Desktop integration', port: 3003 },
  { id: 'workflow-engine', name: 'Workflow Engine', description: 'ECA workflow orchestration with NextJS dashboard', port: 3001 },
  { id: 'agent-mesh', name: 'Agent Mesh', description: 'Service mesh coordination with Istio integration', port: null },
  { id: 'agent-tracer', name: 'Agent Tracer', description: 'Distributed tracing with OpenTelemetry', port: 4318 },
  { id: 'agent-chat', name: 'Agent Chat', description: 'Multi-provider chat interface platform', port: null },
  { id: 'agent-studio', name: 'Agent Studio', description: 'AI-enhanced development environment', port: null },
  { id: 'agent-docker', name: 'Agent Docker', description: 'Docker container management and orchestration', port: null },
  { id: 'agent-ops', name: 'Agent Ops', description: 'Platform operations with NextJS dashboard', port: null },
  { id: 'compliance-engine', name: 'Compliance Engine', description: 'Government compliance validation', port: null },
  { id: 'doc-engine', name: 'Doc Engine', description: 'Documentation generation and PDF processing', port: null },
  { id: 'rfp-automation', name: 'RFP Automation', description: 'Government RFP processing and automation', port: null },
  { id: 'agentic-flows', name: 'Agentic Flows', description: 'Business workflow automation', port: null },
  { id: 'foundation-bridge', name: 'Foundation Bridge', description: 'Apple Foundation framework integration', port: null },
  { id: 'studio-ui', name: 'Studio UI', description: 'React component library for AI interfaces', port: null },
];

console.log(`Generating OSSA manifests for ${services.length} common_npm services...\n`);

for (const service of services) {
  const cmd = `node bin/ossa generate integration --name "${service.name}" --id "${service.id}" --description "${service.description}" --runtime docker --output examples/common_npm/${service.id}.ossa.yaml`;
  
  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log(`✅ ${service.id}\n`);
  } catch (e) {
    console.error(`❌ ${service.id}: ${e.message}\n`);
  }
}

console.log(`\n✅ Generated ${services.length} manifests!`);
