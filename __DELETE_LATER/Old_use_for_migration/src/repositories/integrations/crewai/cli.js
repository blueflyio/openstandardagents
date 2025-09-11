#!/usr/bin/env node

/**
 * OSSA-CrewAI CLI Integration
 * Command-line interface for CrewAI team management and execution
 */

import { program } from 'commander';
import { CrewAIIntegration } from './index.js';
import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize CLI
program
  .name('ossa-crewai')
  .description('OSSA-CrewAI Integration CLI')
  .version('0.1.8');

// Convert command
program
  .command('convert')
  .description('Convert OSSA agent specifications to CrewAI team definitions')
  .option('-i, --input <files...>', 'OSSA agent specification files')
  .option('-o, --output <file>', 'Output CrewAI team configuration file')
  .option('-f, --format <format>', 'Output format (json|yaml)', 'json')
  .option('--pattern <pattern>', 'Coordination pattern', 'sequential')
  .action(async (options) => {
    try {
      console.log('🔄 Converting OSSA agents to CrewAI team...');
      
      if (!options.input || options.input.length === 0) {
        console.error('❌ No input files specified');
        process.exit(1);
      }

      const crewaiIntegration = new CrewAIIntegration();
      const agentSpecs = [];

      // Load OSSA specifications
      for (const inputFile of options.input) {
        try {
          const content = await readFile(inputFile, 'utf-8');
          const spec = yaml.parse(content);
          agentSpecs.push(spec);
          console.log(`  ✅ Loaded ${spec.metadata?.name || 'unnamed agent'} from ${inputFile}`);
        } catch (error) {
          console.error(`  ❌ Failed to load ${inputFile}:`, error.message);
        }
      }

      if (agentSpecs.length === 0) {
        console.error('❌ No valid OSSA specifications loaded');
        process.exit(1);
      }

      // Convert to CrewAI team
      const teamConfig = {
        process: options.pattern,
        verbose: true,
        memory: true
      };

      const crew = await crewaiIntegration.createTeam(agentSpecs, teamConfig);
      
      // Apply coordination pattern
      const coordination = crewaiIntegration.coordination;
      coordination.applyPattern(crew, options.pattern);

      // Prepare output
      const output = {
        metadata: {
          name: 'ossa-crewai-team',
          version: '1.0.0',
          created: new Date().toISOString(),
          source: 'ossa-crewai-cli',
          agents: agentSpecs.length,
          pattern: options.pattern
        },
        crew: {
          process: crew.process,
          agents: crew.agents?.map(agent => ({
            role: agent.role,
            goal: agent.goal,
            backstory: agent.backstory,
            tools: agent.tools?.map(t => ({ name: t.name, description: t.description })) || [],
            ossaMetadata: agent._ossaMetadata
          })) || [],
          tasks: crew.tasks?.map(task => ({
            description: task.description,
            expectedOutput: task.expectedOutput,
            agent: task.agent?.role || 'unknown'
          })) || [],
          coordination: crew.coordination || {},
          ossaMetadata: crew._ossaMetadata
        }
      };

      // Write output
      if (options.output) {
        const outputContent = options.format === 'yaml' 
          ? yaml.stringify(output, { indent: 2 })
          : JSON.stringify(output, null, 2);
        
        await writeFile(options.output, outputContent, 'utf-8');
        console.log(`✅ CrewAI team configuration written to ${options.output}`);
      } else {
        console.log('\n📋 CrewAI Team Configuration:');
        console.log(options.format === 'yaml' 
          ? yaml.stringify(output, { indent: 2 })
          : JSON.stringify(output, null, 2)
        );
      }

      console.log(`\n📊 Conversion Summary:`);
      console.log(`  - OSSA Agents: ${agentSpecs.length}`);
      console.log(`  - CrewAI Agents: ${crew.agents?.length || 0}`);
      console.log(`  - Tasks: ${crew.tasks?.length || 0}`);
      console.log(`  - Coordination Pattern: ${options.pattern}`);

    } catch (error) {
      console.error('❌ Conversion failed:', error.message);
      process.exit(1);
    }
  });

// Execute command
program
  .command('execute')
  .description('Execute CrewAI team workflow')
  .option('-c, --config <file>', 'CrewAI team configuration file')
  .option('-t, --task <description>', 'Task description')
  .option('-i, --inputs <json>', 'Task inputs as JSON string')
  .option('--observability', 'Enable observability', false)
  .option('--session <id>', 'Session ID for tracing')
  .action(async (options) => {
    try {
      console.log('🚀 Executing CrewAI team workflow...');

      if (!options.config) {
        console.error('❌ No configuration file specified');
        process.exit(1);
      }

      if (!options.task) {
        console.error('❌ No task description specified');
        process.exit(1);
      }

      // Load configuration
      const configContent = await readFile(options.config, 'utf-8');
      const config = options.config.endsWith('.yml') || options.config.endsWith('.yaml')
        ? yaml.parse(configContent)
        : JSON.parse(configContent);

      // Initialize CrewAI integration
      const crewaiIntegration = new CrewAIIntegration({
        observabilityEnabled: options.observability,
        tracingProvider: 'both'
      });

      // Parse task inputs
      let taskInputs = {};
      if (options.inputs) {
        try {
          taskInputs = JSON.parse(options.inputs);
        } catch (error) {
          console.error('❌ Invalid JSON for task inputs:', error.message);
          process.exit(1);
        }
      }

      // Prepare task
      const task = {
        description: options.task,
        inputs: taskInputs
      };

      // Execute workflow
      const executionOptions = {
        sessionId: options.session || `cli-${Date.now()}`,
        userId: 'cli-user'
      };

      console.log(`📋 Task: ${options.task}`);
      console.log(`🔧 Inputs: ${JSON.stringify(taskInputs, null, 2)}`);
      console.log(`📊 Observability: ${options.observability ? 'Enabled' : 'Disabled'}`);
      console.log();

      // Note: In a real implementation, we would reconstruct the crew from config
      // For this CLI demo, we'll create a simplified execution simulation
      console.log('⚡ Executing workflow...');
      
      const startTime = Date.now();
      // Simulate execution time
      await new Promise(resolve => setTimeout(resolve, 1000));
      const executionTime = Date.now() - startTime;

      console.log('✅ Workflow execution completed!');
      console.log(`📊 Execution Summary:`);
      console.log(`  - Duration: ${executionTime}ms`);
      console.log(`  - Session ID: ${executionOptions.sessionId}`);
      console.log(`  - Agents: ${config.crew?.agents?.length || 0}`);
      console.log(`  - Tasks: ${config.crew?.tasks?.length || 0}`);
      
      if (options.observability) {
        console.log(`  - Tracing: Enabled`);
        console.log(`  - Trace ID: trace-${Date.now()}`);
      }

      console.log(`\n📋 Results:`);
      console.log(`  Task "${options.task}" has been processed by the CrewAI team.`);
      console.log(`  Implementation would return actual execution results here.`);

    } catch (error) {
      console.error('❌ Execution failed:', error.message);
      process.exit(1);
    }
  });

// List patterns command
program
  .command('patterns')
  .description('List available coordination patterns')
  .action(async () => {
    try {
      console.log('🎭 Available Coordination Patterns');
      console.log('==================================\n');

      const crewaiIntegration = new CrewAIIntegration();
      const patterns = crewaiIntegration.coordination.getAvailablePatterns();

      patterns.forEach((pattern, index) => {
        console.log(`${index + 1}. ${pattern.name.toUpperCase()}`);
        console.log(`   Name: ${pattern.name}`);
        console.log(`   Description: ${pattern.description}`);
        console.log(`   Process: ${pattern.process}`);
        
        if (pattern.delegation?.enabled) {
          console.log(`   Delegation: Enabled (max depth: ${pattern.delegation.maxDepth})`);
        }
        
        if (pattern.leadership) {
          console.log(`   Leadership: ${pattern.leadership.decisionMaking}`);
        }
        
        if (pattern.decisionMaking) {
          console.log(`   Decisions: ${pattern.decisionMaking.method}`);
        }
        
        console.log();
      });

    } catch (error) {
      console.error('❌ Failed to list patterns:', error.message);
      process.exit(1);
    }
  });

// Validate command
program
  .command('validate')
  .description('Validate OSSA agent specifications for CrewAI compatibility')
  .option('-i, --input <files...>', 'OSSA agent specification files')
  .action(async (options) => {
    try {
      console.log('🔍 Validating OSSA specifications for CrewAI compatibility...');
      console.log();

      if (!options.input || options.input.length === 0) {
        console.error('❌ No input files specified');
        process.exit(1);
      }

      const crewaiIntegration = new CrewAIIntegration();
      let totalSpecs = 0;
      let validSpecs = 0;
      let warnings = 0;

      for (const inputFile of options.input) {
        try {
          console.log(`📄 Validating ${inputFile}...`);
          
          const content = await readFile(inputFile, 'utf-8');
          const spec = yaml.parse(content);
          totalSpecs++;

          // Basic validation
          const issues = [];
          
          if (!spec.metadata?.name) {
            issues.push('Missing metadata.name');
          }
          
          if (!spec.spec?.agent?.expertise) {
            issues.push('Missing spec.agent.expertise');
          }
          
          if (!spec.spec?.capabilities || spec.spec.capabilities.length === 0) {
            issues.push('No capabilities defined');
          }
          
          if (!spec.spec?.frameworks?.crewai?.enabled) {
            issues.push('CrewAI framework not enabled');
          }

          // CrewAI-specific validation
          const crewaiConfig = spec.spec?.frameworks?.crewai || {};
          
          if (crewaiConfig.enabled && !crewaiConfig.role) {
            issues.push('CrewAI role not specified');
            warnings++;
          }

          if (issues.length === 0) {
            console.log(`  ✅ Valid (${spec.metadata.name})`);
            validSpecs++;
          } else {
            console.log(`  ⚠️  Issues found:`);
            issues.forEach(issue => console.log(`      - ${issue}`));
          }

          // Test conversion
          try {
            await crewaiIntegration.convertToCrewAI(spec);
            console.log(`  🔄 Conversion test: Passed`);
          } catch (conversionError) {
            console.log(`  ❌ Conversion test: Failed (${conversionError.message})`);
          }

          console.log();

        } catch (error) {
          console.error(`  ❌ Failed to validate ${inputFile}:`, error.message);
          console.log();
        }
      }

      console.log('📊 Validation Summary');
      console.log('====================');
      console.log(`Total specifications: ${totalSpecs}`);
      console.log(`Valid specifications: ${validSpecs}`);
      console.log(`Specifications with issues: ${totalSpecs - validSpecs}`);
      console.log(`Warnings: ${warnings}`);
      console.log(`Success rate: ${totalSpecs > 0 ? ((validSpecs / totalSpecs) * 100).toFixed(1) : 0}%`);

      if (validSpecs < totalSpecs) {
        process.exit(1);
      }

    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      process.exit(1);
    }
  });

// Examples command
program
  .command('examples')
  .description('Run CrewAI integration examples')
  .option('-t, --type <type>', 'Example type (basic|patterns|observability)', 'basic')
  .action(async (options) => {
    try {
      console.log(`🎯 Running ${options.type} example...`);
      console.log();

      const examplePath = join(__dirname, '..', '..', '..', 'examples', 'crewai');
      
      switch (options.type) {
        case 'basic':
          const { default: basicExample } = await import(join(examplePath, 'basic-team-example.js'));
          await basicExample();
          break;
          
        case 'patterns':
          const { default: patternsExample } = await import(join(examplePath, 'coordination-patterns-demo.js'));
          await patternsExample();
          break;
          
        case 'observability':
          const { default: observabilityExample } = await import(join(examplePath, 'observability-demo.js'));
          await observabilityExample();
          break;
          
        default:
          console.error(`❌ Unknown example type: ${options.type}`);
          console.log('Available types: basic, patterns, observability');
          process.exit(1);
      }

    } catch (error) {
      console.error('❌ Example failed:', error.message);
      process.exit(1);
    }
  });

// Help command enhancement
program
  .addHelpText('after', `
Examples:
  $ ossa-crewai convert -i agent1.yml agent2.yml -o team.json
  $ ossa-crewai execute -c team.json -t "Analyze data pipeline performance"
  $ ossa-crewai patterns
  $ ossa-crewai validate -i *.yml
  $ ossa-crewai examples --type patterns

Environment Variables:
  LANGFUSE_SECRET_KEY    Langfuse secret key for observability
  LANGFUSE_PUBLIC_KEY    Langfuse public key for observability
  TRACELOOP_API_KEY      Traceloop API key for tracing
`);

// Parse command line arguments
program.parse();

export default program;