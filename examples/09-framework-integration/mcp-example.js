#!/usr/bin/env node

/**
 * Test script for OSSA MCP Server
 * Demonstrates stdio transport protocol communication
 */

import { spawn } from 'child_process';
import { resolve } from 'path';

// Start the MCP server
const serverPath = resolve('./lib/mcp/servers/ossa-validator.js');
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Handle server output
server.stdout.on('data', (data) => {
  console.log('Server response:', data.toString());
});

server.stderr.on('data', (data) => {
  console.log('Server info:', data.toString());
});

// Test message sequence
const testMessages = [
  // Request tools list
  {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list'
  },
  // Test validation tool
  {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'validate-ossa-config',
      arguments: {
        filePath: './examples/01-agent-basic-ossa-v0.1.8.yml'
      }
    }
  },
  // Test examples listing
  {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'list-ossa-examples',
      arguments: {}
    }
  }
];

// Send test messages with delays
async function runTests() {
  console.log('🚀 Starting OSSA MCP Server Test\n');
  
  for (let i = 0; i < testMessages.length; i++) {
    const message = testMessages[i];
    console.log(`📤 Sending message ${message.id}:`, JSON.stringify(message, null, 2));
    
    server.stdin.write(JSON.stringify(message) + '\n');
    
    // Wait between messages
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Clean shutdown
  setTimeout(() => {
    console.log('\n✅ Test completed');
    server.kill();
  }, 2000);
}

runTests().catch(console.error);