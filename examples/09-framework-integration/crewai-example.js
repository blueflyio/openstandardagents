/**
 * Basic CrewAI Team Example
 * Demonstrates converting OSSA agents to CrewAI teams and executing workflows
 */

import { CrewAIIntegration } from '../../lib/integrations/crewai/index.js';
import { readFile } from 'fs/promises';
import yaml from 'yaml';
import path from 'path';

async function basicTeamExample() {
  console.log('🚀 OSSA-to-CrewAI Basic Team Example');
  console.log('=====================================\n');

  try {
    // Initialize CrewAI integration
    const crewaiIntegration = new CrewAIIntegration({
      observabilityEnabled: true,
      tracingProvider: 'traceloop'
    });

    // Load OSSA agent specifications
    const agentSpecs = await loadOSSAAgents();
    
    if (agentSpecs.length === 0) {
      console.log('⚠️  No OSSA agent specifications found. Creating example agents...');
      agentSpecs.push(...createExampleAgents());
    }

    console.log(`📋 Loaded ${agentSpecs.length} OSSA agent specifications:`);
    agentSpecs.forEach((spec, index) => {
      console.log(`  ${index + 1}. ${spec.metadata.name} (${spec.spec.agent.expertise})`);
    });
    console.log();

    // Convert OSSA agents to CrewAI team
    console.log('🔄 Converting OSSA agents to CrewAI team...');
    const crew = await crewaiIntegration.createTeam(agentSpecs, {
      process: 'sequential',
      verbose: true,
      memory: true,
      tasks: [
        {
          description: 'Analyze the given requirements and create a detailed plan',
          expected_output: 'A comprehensive analysis with actionable recommendations',
          agent_role: 'analyst'
        },
        {
          description: 'Implement the plan using best practices and coding standards',
          expected_output: 'Working implementation with proper documentation',
          agent_role: 'engineer'
        },
        {
          description: 'Review and validate the implementation for quality and compliance',
          expected_output: 'Quality assessment report with any necessary improvements',
          agent_role: 'reviewer'
        }
      ]
    });

    console.log('✅ CrewAI team created successfully!');
    console.log(`   - Agents: ${crew.agents?.length || 0}`);
    console.log(`   - Tasks: ${crew.tasks?.length || 0}`);
    console.log(`   - Process: ${crew.process || 'sequential'}`);
    console.log();

    // Apply role-based coordination pattern
    console.log('⚙️  Applying role-based coordination pattern...');
    const coordinationPattern = crewaiIntegration.getCoordinationPattern('hierarchical');
    console.log(`   - Pattern: ${coordinationPattern.name}`);
    console.log(`   - Description: ${coordinationPattern.description}`);
    console.log();

    // Execute a sample workflow
    console.log('🎯 Executing sample workflow...');
    const sampleTask = {
      description: 'Create a simple web application with user authentication',
      inputs: {
        requirements: [
          'User registration and login',
          'Secure password storage',
          'Session management',
          'Responsive design'
        ],
        technology_stack: 'Node.js, Express, React',
        deadline: '2 weeks'
      }
    };

    const result = await crewaiIntegration.executeWorkflow(crew, sampleTask);

    if (result.success) {
      console.log('✅ Workflow executed successfully!');
      console.log('📊 Execution Summary:');
      console.log(`   - Duration: ${result.observability?.executionTime || 'N/A'}ms`);
      console.log(`   - Session ID: ${result.observability?.sessionId || 'N/A'}`);
      console.log(`   - Tracing Data: ${JSON.stringify(result.observability?.tracingData || {})}`);
      console.log();
      
      console.log('📋 Results:');
      console.log(JSON.stringify(result.result, null, 2));
    } else {
      console.log('❌ Workflow execution failed:');
      console.log(`   Error: ${result.error}`);
      console.log(`   Duration: ${result.observability?.executionTime || 'N/A'}ms`);
    }

  } catch (error) {
    console.error('❌ Example failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

/**
 * Load OSSA agent specifications from examples
 */
async function loadOSSAAgents() {
  const agentSpecs = [];
  
  try {
    // Try to load the basic OSSA example
    const basicAgentPath = path.resolve(process.cwd(), 'examples/01-agent-basic-ossa-v0.1.8.yml');
    const basicAgentYaml = await readFile(basicAgentPath, 'utf-8');
    const basicAgent = yaml.parse(basicAgentYaml);
    agentSpecs.push(basicAgent);
    
    // Try to load additional agents from .agents directory
    const agentDirs = ['agent-name-skill-01', 'agent-name-skill-02'];
    
    for (const agentDir of agentDirs) {
      try {
        const agentPath = path.resolve(process.cwd(), `examples/.agents/${agentDir}/agent.yml`);
        const agentYaml = await readFile(agentPath, 'utf-8');
        const agent = yaml.parse(agentYaml);
        agentSpecs.push(agent);
      } catch (error) {
        // Agent directory doesn't exist, skip
      }
    }
    
  } catch (error) {
    console.log('No existing OSSA agents found, will create examples');
  }
  
  return agentSpecs;
}

/**
 * Create example OSSA agent specifications
 */
function createExampleAgents() {
  return [
    {
      apiVersion: 'open-standards-scalable-agents/v0.1.8',
      kind: 'Agent',
      metadata: {
        name: 'requirements-analyst',
        version: '1.0.0',
        labels: { tier: 'core', domain: 'analysis' },
        description: 'Requirements analysis and planning specialist'
      },
      spec: {
        agent: {
          name: 'Requirements Analyst',
          expertise: 'Business requirements analysis, technical planning, and feasibility assessment'
        },
        capabilities: [
          {
            name: 'analyze_requirements',
            description: 'Analyze business requirements and create technical specifications'
          },
          {
            name: 'create_plans',
            description: 'Create detailed project plans and timelines'
          },
          {
            name: 'assess_feasibility',
            description: 'Assess technical feasibility and identify risks'
          }
        ],
        frameworks: {
          crewai: {
            enabled: true,
            role: 'Senior Business Analyst',
            allow_delegation: true
          }
        }
      }
    },
    {
      apiVersion: 'open-standards-scalable-agents/v0.1.8',
      kind: 'Agent',
      metadata: {
        name: 'software-engineer',
        version: '1.0.0',
        labels: { tier: 'core', domain: 'development' },
        description: 'Full-stack software development specialist'
      },
      spec: {
        agent: {
          name: 'Software Engineer',
          expertise: 'Full-stack web development, API design, and system architecture'
        },
        capabilities: [
          {
            name: 'develop_frontend',
            description: 'Create responsive web interfaces using modern frameworks'
          },
          {
            name: 'develop_backend',
            description: 'Build scalable backend services and APIs'
          },
          {
            name: 'design_architecture',
            description: 'Design system architecture and technical solutions'
          }
        ],
        frameworks: {
          crewai: {
            enabled: true,
            role: 'Senior Software Engineer',
            allow_delegation: false
          }
        }
      }
    },
    {
      apiVersion: 'open-standards-scalable-agents/v0.1.8',
      kind: 'Agent',
      metadata: {
        name: 'quality-reviewer',
        version: '1.0.0',
        labels: { tier: 'core', domain: 'quality' },
        description: 'Code review and quality assurance specialist'
      },
      spec: {
        agent: {
          name: 'Quality Reviewer',
          expertise: 'Code review, testing strategies, and quality assurance processes'
        },
        capabilities: [
          {
            name: 'review_code',
            description: 'Perform comprehensive code reviews for quality and security'
          },
          {
            name: 'create_tests',
            description: 'Design and implement automated testing strategies'
          },
          {
            name: 'validate_compliance',
            description: 'Ensure code meets compliance and security standards'
          }
        ],
        frameworks: {
          crewai: {
            enabled: true,
            role: 'Senior Quality Engineer',
            allow_delegation: true
          }
        }
      }
    }
  ];
}

// Run the example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  basicTeamExample()
    .then(() => {
      console.log('\n🎉 Basic team example completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Example failed:', error);
      process.exit(1);
    });
}

export default basicTeamExample;