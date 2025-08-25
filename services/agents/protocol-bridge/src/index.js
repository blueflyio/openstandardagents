import express from 'express';
import yaml from 'yaml';
import { readFileSync } from 'fs';
import { ProtocolConverter } from './protocol-converter.js';
import { MCPBridge } from './mcp-bridge.js';
import { A2ABridge } from './a2a-bridge.js';

const app = express();
app.use(express.json());

const protocolConverter = new ProtocolConverter();
const mcpBridge = new MCPBridge();
const a2aBridge = new A2ABridge();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', agent: 'protocol-bridge', version: '0.1.0' });
});

// Convert OpenAPI to MCP tools format
app.post('/convert/openapi-to-mcp', async (req, res) => {
  try {
    const { openapi } = req.body;
    const mcpTools = await protocolConverter.openAPIToMCP(openapi);
    res.json({ success: true, tools: mcpTools });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Convert MCP to OpenAPI format
app.post('/convert/mcp-to-openapi', async (req, res) => {
  try {
    const { tools, prompts, resources } = req.body;
    const openapi = await protocolConverter.MCPToOpenAPI({ tools, prompts, resources });
    res.json({ success: true, openapi });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Agent-to-Agent protocol bridge
app.post('/a2a/discover', async (req, res) => {
  try {
    const agents = await a2aBridge.discoverAgents();
    res.json({ success: true, agents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/a2a/handoff', async (req, res) => {
  try {
    const { fromAgent, toAgent, context, task } = req.body;
    const result = await a2aBridge.handoffTask({ fromAgent, toAgent, context, task });
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MCP tools endpoint
app.get('/mcp/tools', async (req, res) => {
  try {
    const tools = await mcpBridge.getAvailableTools();
    res.json({ tools });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/mcp/tools/execute', async (req, res) => {
  try {
    const { tool, parameters } = req.body;
    const result = await mcpBridge.executeTool(tool, parameters);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3011;
app.listen(PORT, () => {
  console.log(`Protocol Bridge Agent running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;