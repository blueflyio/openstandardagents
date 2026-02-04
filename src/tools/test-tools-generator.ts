#!/usr/bin/env ts-node

import { ToolsGenerator } from '../services/export/langchain/tools-generator.js';
import * as fs from 'fs';
import * as yaml from 'yaml';

// Read the manifest
const manifestPath = process.argv[2] || 'examples/export/langchain/production-agent-with-tools/agent.ossa.yaml';
const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
const manifest = yaml.parse(manifestContent);

// Generate tools
const generator = new ToolsGenerator();
const toolsCode = generator.generate(manifest);

// Write to file
const outputPath = '/tmp/generated-tools.py';
fs.writeFileSync(outputPath, toolsCode);

console.log(`✓ Tools generated successfully!`);
console.log(`✓ Output: ${outputPath}`);
console.log(`✓ Tools count: ${manifest.spec?.tools?.length || 0}`);
console.log('\n' + '='.repeat(80));
console.log('GENERATED tools.py:');
console.log('='.repeat(80));
console.log(toolsCode);
