/**
 * LangChain Quick Start - Convert OSSA to LangChain
 *
 * This example shows how to load an OSSA manifest and convert it
 * to LangChain agent format for use in LangChain applications.
 */

import { LangChainAdapter } from '@bluefly/openstandardagents';
import { parse } from 'yaml';
import { readFileSync } from 'fs';

// Load OSSA manifest from file
const manifestPath = './examples/getting-started/02-agent-with-tools.ossa.yaml';
const manifestYaml = readFileSync(manifestPath, 'utf-8');
const ossaManifest = parse(manifestYaml);

// Convert OSSA manifest to LangChain format
const langchainAgent = LangChainAdapter.toLangChain(ossaManifest);

console.log('LangChain Agent Configuration:');
console.log(JSON.stringify(langchainAgent, null, 2));

// Generate Python code for LangChain
const pythonCode = LangChainAdapter.toPythonCode(ossaManifest);

console.log('\nGenerated LangChain Python Code:');
console.log(pythonCode);

/**
 * Usage:
 *
 * 1. Install dependencies:
 *    npm install @bluefly/openstandardagents yaml
 *
 * 2. Run this example:
 *    npx tsx examples/adapters/langchain-quickstart.ts
 *
 * 3. Save generated Python code to a file and run with LangChain:
 *    python langchain_agent.py
 */
