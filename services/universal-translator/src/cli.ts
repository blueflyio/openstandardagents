#!/usr/bin/env node
/**
 * OAAS Universal Services CLI
 * Test the enhanced Drupal translator with real modules
 */

import { Command } from 'commander';
import { OAASService } from './index.js';
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
      const oaas = new OAASService({
        projectRoot: options.projectRoot,
        runtimeTranslation: true,
        cacheEnabled: true
      });

      const oaasAgents = await oaas.discoverDrupalAgents();

      if (oaasAgents.length === 0) {
        console.log('❌ No Drupal AI agents found');
        process.exit(1);
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
      console.log(`   - ${oaasAgents.length} agents translated to OAAS format`);
      console.log(`   - Output saved to: ${outputPath}`);
      console.log('');

      // Print summary by module
      const moduleStats = new Map<string, number>();
      for (const agent of oaasAgents) {
        const module = agent.metadata.annotations['drupal/module'] || 'unknown';
        moduleStats.set(module, (moduleStats.get(module) || 0) + 1);
      }

      console.log('📈 Agents by module:');
      for (const [module, count] of moduleStats.entries()) {
        console.log(`   - ${module}: ${count} agents`);
      }

      // Print capability summary
      const capabilityCount = oaasAgents.reduce((sum, agent) => 
        sum + (agent.spec.capabilities?.length || 0), 0
      );
      console.log(`   - Total capabilities: ${capabilityCount}`);
      
      // Print framework support
      const frameworks = new Set<string>();
      for (const agent of oaasAgents) {
        if (agent.spec.frameworks) {
          for (const fw of Object.keys(agent.spec.frameworks)) {
            frameworks.add(fw);
          }
        }
      }
      console.log(`   - Framework support: ${Array.from(frameworks).join(', ')}`);

    } catch (error) {
      console.error('❌ Discovery failed:', error.message);
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

program
  .command('analyze-module')
  .description('Analyze a specific Drupal module')
  .argument('<module-name>', 'Module name (e.g., ai_agent_crewai)')
  .option('-p, --project-root <path>', 'Drupal project root path', '/Users/flux423/Sites/LLM/llm-platform')
  .option('-v, --verbose', 'Verbose logging')
  .action(async (moduleName, options) => {
    console.log(`🔍 Analyzing module: ${moduleName}`);
    console.log(`📁 Project root: ${options.projectRoot}`);
    console.log('');

    try {
      const modulePath = path.join(options.projectRoot, `web/modules/custom/${moduleName}`);
      
      // Check if module exists
      try {
        await fs.access(modulePath);
      } catch {
        console.error(`❌ Module not found: ${modulePath}`);
        process.exit(1);
      }

      const oaas = new OAASService({
        projectRoot: options.projectRoot,
        runtimeTranslation: true
      });

      const oaasAgents = await oaas.discoverDrupalAgents();
      const moduleAgents = oaasAgents.filter(agent => 
        agent.metadata.annotations['drupal/module'] === moduleName
      );

      if (moduleAgents.length === 0) {
        console.log(`⚠️  No agents found in module: ${moduleName}`);
        return;
      }

      console.log(`✅ Found ${moduleAgents.length} agents in ${moduleName}:`);
      console.log('');

      for (const agent of moduleAgents) {
        console.log(`🤖 Agent: ${agent.metadata.name}`);
        console.log(`   - Description: ${agent.metadata.description}`);
        console.log(`   - Class: ${agent.metadata.annotations['drupal/class-name']}`);
        console.log(`   - Plugin Type: ${agent.metadata.annotations['drupal/plugin-type']}`);
        console.log(`   - Capabilities: ${agent.spec.capabilities?.length || 0}`);
        
        if (agent.spec.capabilities?.length > 0) {
          for (const cap of agent.spec.capabilities.slice(0, 3)) { // Show first 3
            console.log(`     - ${cap.name}: ${cap.description}`);
          }
          if (agent.spec.capabilities.length > 3) {
            console.log(`     - ... and ${agent.spec.capabilities.length - 3} more`);
          }
        }
        
        console.log(`   - Frameworks: ${Object.keys(agent.spec.frameworks || {}).join(', ')}`);
        console.log('');
      }

    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate translated OAAS specifications')
  .argument('<file>', 'OAAS YAML file to validate')
  .option('-v, --verbose', 'Verbose logging')
  .action(async (file, options) => {
    console.log(`🔍 Validating OAAS file: ${file}`);

    try {
      const content = await fs.readFile(file, 'utf-8');
      const parsed = yaml.load(content);
      
      console.log(`✅ YAML structure is valid`);
      console.log(`📊 Collection contains ${(parsed as any).agents?.length || 0} agents`);
      
      // Basic validation
      const agents = (parsed as any).agents || [];
      let validAgents = 0;
      let issues = 0;

      for (const agent of agents) {
        if (agent.metadata?.name && agent.spec?.agent?.name) {
          validAgents++;
        } else {
          issues++;
          if (options.verbose) {
            console.warn(`⚠️  Agent missing required fields: ${agent.metadata?.name || 'unknown'}`);
          }
        }
      }

      console.log(`✅ Valid agents: ${validAgents}`);
      if (issues > 0) {
        console.log(`⚠️  Issues found: ${issues}`);
      }

    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

program
  .command('test-translation')
  .description('Test runtime translation performance')
  .option('-p, --project-root <path>', 'Drupal project root path', '/Users/flux423/Sites/LLM/llm-platform')
  .option('-n, --iterations <number>', 'Number of iterations', '10')
  .action(async (options) => {
    console.log('🚀 Testing runtime translation performance...');

    const iterations = parseInt(options.iterations);
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      
      try {
        const oaas = new OAASService({
          projectRoot: options.projectRoot,
          runtimeTranslation: true,
          cacheEnabled: false // Disable cache for accurate timing
        });

        await oaas.discoverDrupalAgents();
        const endTime = Date.now();
        times.push(endTime - startTime);
        
        console.log(`⚡ Iteration ${i + 1}/${iterations}: ${endTime - startTime}ms`);
      } catch (error) {
        console.error(`❌ Iteration ${i + 1} failed:`, error.message);
      }
    }

    if (times.length > 0) {
      const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      
      console.log('');
      console.log('📊 Performance Results:');
      console.log(`   - Average: ${avgTime.toFixed(2)}ms`);
      console.log(`   - Min: ${minTime}ms`);
      console.log(`   - Max: ${maxTime}ms`);
      console.log(`   - Target: <100ms (${avgTime < 100 ? '✅ PASSED' : '❌ FAILED'})`);
    }
  });

// Parse command line arguments
program.parse();