#!/usr/bin/env node
/**
 * OAAS Universal Services CLI
 * Test the enhanced Drupal translator with real modules
 */

import { Command } from 'commander';
import { EnhancedDrupalTranslator } from './translators/EnhancedDrupalTranslator.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';

const program = new Command();

program
  .name('oaas-services')
  .description('Universal Services Package for OpenAPI AI Agents Standard')
  .version('0.1.0');

program
  .command('discover-drupal')
  .description('Discover and translate Drupal AI agent modules')
  .option('-p, --project-root <path>', 'Drupal project root path', '/Users/flux423/Sites/LLM/llm-platform')
  .option('-o, --output <file>', 'Output file for OAAS specs', 'drupal-agents-oaas.yml')
  .option('-v, --verbose', 'Verbose logging')
  .action(async (options) => {
    console.log('🚀 OAAS Universal Services - Drupal Discovery');
    console.log(`📁 Project root: ${options.projectRoot}`);
    console.log(`📄 Output file: ${options.output}`);
    console.log('');

    try {
      const translator = new EnhancedDrupalTranslator();
      const modules = await translator.discoverAllDrupalAgents(options.projectRoot);

      if (modules.length === 0) {
        console.log('❌ No Drupal AI agent modules found');
        process.exit(1);
      }

      // Translate all modules to OAAS
      const oaasAgents: any[] = [];
      for (const module of modules) {
        const moduleOaasSpecs = await translator.translateModuleToOAAS(module);
        oaasAgents.push(...moduleOaasSpecs as any[]);
      }

      if (oaasAgents.length === 0) {
        console.log('❌ No agents found to translate');
        return;
      }

      // Save to output file
      const outputPath = path.resolve(options.output);
      const yamlContent = yaml.dump({
        apiVersion: 'openapi-ai-agents/v0.1.1',
        kind: 'AgentCollection',
        metadata: {
          name: 'drupal-ai-agents',
          created: new Date().toISOString(),
          source: 'Drupal LLM Platform',
          translator: 'OAAS Universal Services v0.1.0'
        },
        agents: oaasAgents
      }, { 
        indent: 2,
        lineWidth: 120,
        noRefs: true
      });

      await fs.writeFile(outputPath, yamlContent, 'utf-8');

      console.log('');
      console.log('✅ Discovery and translation completed successfully!');
      console.log(`📊 Results:`);
      console.log(`   - ${modules.length} modules analyzed`);
      console.log(`   - ${oaasAgents.length} agents translated to OAAS format`);
      console.log(`   - Output saved to: ${outputPath}`);
      console.log('');

      // Print summary by module
      const moduleStats = new Map<string, number>();
      for (const agent of oaasAgents) {
        const module = (agent as any)?.metadata?.annotations?.['drupal/module'] || 'unknown';
        moduleStats.set(module, (moduleStats.get(module) || 0) + 1);
      }

      console.log('📈 Agents by module:');
      for (const [module, count] of moduleStats.entries()) {
        console.log(`   - ${module}: ${count} agents`);
      }

      // Print capability summary
      const capabilityCount = oaasAgents.reduce((sum: number, agent: any) => 
        sum + (agent.spec.capabilities?.length || 0), 0
      );
      console.log(`   - Total capabilities: ${capabilityCount}`);
      
    } catch (error: any) {
      console.error('❌ Discovery failed:', error.message);
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();