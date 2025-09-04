#!/usr/bin/env node

/**
 * Multi-Agent Conversation Example using OSSA v0.1.8 AutoGen Integration
 * Demonstrates natural language communication between agents from different frameworks
 * 
 * Integrates with:
 * - MCP (Model Context Protocol) agents
 * - LangChain framework agents
 * - CrewAI team-based agents
 * 
 * @version 0.1.8
 */

import { AutoGenBridge } from '../../lib/frameworks/autogen/autogen-bridge.js';
import { ConversationPatterns } from '../../lib/frameworks/autogen/conversation-patterns.js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class MultiAgentConversationDemo {
  constructor() {
    this.autoGenBridge = new AutoGenBridge({
      openSource: true,
      naturalLanguage: true
    });
    this.conversationPatterns = new ConversationPatterns({
      maxRounds: 8,
      timeout: 300000
    });
    
    this.agents = [];
    this.activeConversations = new Map();
  }

  /**
   * Load sample agents from different frameworks
   */
  async loadSampleAgents() {
    const agentPaths = [
      '../../examples/.agents/01-agent-basic/agent.yml',
      '../../examples/.agents/02-agent-integration/agent.yml',
      '../../examples/.agents/03-agent-production/agent.yml'
    ];

    this.agents = [];
    
    for (const agentPath of agentPaths) {
      const fullPath = join(__dirname, agentPath);
      if (existsSync(fullPath)) {
        try {
          const autoGenAgent = await this.autoGenBridge.convertToAutoGen(fullPath);
          this.agents.push({
            ...autoGenAgent,
            sourceFramework: this.detectFramework(fullPath),
            originalPath: fullPath
          });
          console.log(`✅ Loaded agent from: ${agentPath}`);
        } catch (error) {
          console.warn(`⚠️  Failed to load agent from ${agentPath}:`, error.message);
        }
      } else {
        console.warn(`⚠️  Agent file not found: ${fullPath}`);
      }
    }

    if (this.agents.length === 0) {
      // Create mock agents for demonstration
      this.agents = this.createMockAgents();
      console.log('📝 Using mock agents for demonstration');
    }

    return this.agents;
  }

  /**
   * Detect framework type from agent specification
   */
  detectFramework(agentPath) {
    try {
      const content = readFileSync(agentPath, 'utf8');
      
      if (content.includes('mcp:')) return 'MCP';
      if (content.includes('langchain:')) return 'LangChain';
      if (content.includes('crewai:')) return 'CrewAI';
      return 'OSSA';
    } catch {
      return 'Unknown';
    }
  }

  /**
   * Create mock agents for demonstration purposes
   */
  createMockAgents() {
    return [
      {
        config_list: [{ model: "gpt-4", api_base: "http://localhost:4000/api/v1" }],
        agents: {
          technical_analyst: {
            name: "Technical Analyst",
            system_message: "You are a Technical Analyst AI agent specializing in code analysis and system architecture. You provide detailed technical insights and identify potential issues or improvements.",
            capabilities: ['code_analysis', 'architecture_review', 'performance_optimization'],
            frameworks: { mcp: { enabled: true }, langchain: { enabled: true } }
          }
        },
        sourceFramework: 'MCP'
      },
      {
        config_list: [{ model: "gpt-4", api_base: "http://localhost:4000/api/v1" }],
        agents: {
          business_strategist: {
            name: "Business Strategist", 
            system_message: "You are a Business Strategist AI agent with expertise in market analysis and strategic planning. You provide business insights and strategic recommendations.",
            capabilities: ['market_analysis', 'strategic_planning', 'business_optimization'],
            frameworks: { langchain: { enabled: true }, crewai: { enabled: true } }
          }
        },
        sourceFramework: 'LangChain'
      },
      {
        config_list: [{ model: "gpt-4", api_base: "http://localhost:4000/api/v1" }],
        agents: {
          security_expert: {
            name: "Security Expert",
            system_message: "You are a Security Expert AI agent specializing in cybersecurity and risk assessment. You identify security vulnerabilities and recommend protective measures.",
            capabilities: ['security_audit', 'vulnerability_assessment', 'compliance_review'],
            frameworks: { crewai: { enabled: true }, mcp: { enabled: true } }
          }
        },
        sourceFramework: 'CrewAI'
      }
    ];
  }

  /**
   * Start a collaborative problem-solving conversation
   */
  async startProblemSolvingConversation(problem) {
    console.log('\n🚀 Starting Multi-Agent Problem-Solving Conversation');
    console.log('=' .repeat(60));
    console.log(`Problem: ${problem}\n`);

    const conversationId = `problem_solving_${Date.now()}`;
    const agentList = this.agents.map(agent => {
      const agentKey = Object.keys(agent.agents)[0];
      return {
        name: agent.agents[agentKey].name,
        capabilities: agent.agents[agentKey].capabilities,
        framework: agent.sourceFramework
      };
    });

    // Create conversation group
    const conversation = await this.conversationPatterns.startConversation(
      conversationId,
      'group_chat',
      agentList,
      `We need to solve this problem collaboratively: ${problem}. Each agent should contribute insights from their area of expertise.`,
      { maxRounds: 8 }
    );

    this.activeConversations.set(conversationId, conversation);
    
    // Simulate conversation rounds
    await this.simulateConversationRounds(conversationId, problem);
    
    return this.conversationPatterns.getConversationSummary(conversationId);
  }

  /**
   * Simulate conversation rounds between agents
   */
  async simulateConversationRounds(conversationId, problem) {
    const conversation = this.activeConversations.get(conversationId);
    let round = 1;

    while (conversation.context.status === 'active' && round <= conversation.context.maxRounds) {
      console.log(`\n--- Round ${round} ---`);
      
      // Select next agent based on pattern
      const nextAgent = await this.selectNextAgent(conversationId, round);
      if (!nextAgent) break;

      console.log(`🎤 ${nextAgent.name} (${nextAgent.framework}):`);
      
      // Generate response based on agent's expertise
      const response = await this.generateAgentResponse(nextAgent, problem, conversation, round);
      
      // Process the response
      const result = await this.conversationPatterns.processNextStep(conversationId, {
        content: response,
        timestamp: new Date(),
        metadata: {
          source: nextAgent.name,
          framework: nextAgent.framework,
          round: round,
          capabilities: nextAgent.capabilities
        }
      });

      console.log(`   ${response}\n`);

      if (result.completed) {
        console.log('✅ Conversation completed successfully!');
        break;
      }

      round++;
    }
  }

  /**
   * Select next agent for conversation
   */
  async selectNextAgent(conversationId, round) {
    const conversation = this.activeConversations.get(conversationId);
    const pattern = this.conversationPatterns.patterns.group_chat;
    
    // Use round-robin for simplicity, but in real implementation
    // this would use capability matching and natural language cues
    const agentIndex = (round - 1) % conversation.agents.length;
    return conversation.agents[agentIndex];
  }

  /**
   * Generate agent response based on expertise and conversation context
   */
  async generateAgentResponse(agent, problem, conversation, round) {
    const responses = {
      'Technical Analyst': [
        `From a technical perspective, this problem requires us to consider the system architecture and potential bottlenecks. I'd recommend analyzing the core components and their interactions.`,
        `Building on the previous analysis, I see several technical implementation paths. The most robust approach would involve modular design patterns.`,
        `The technical solution is becoming clearer. We need to ensure scalability and maintainability in our implementation.`,
        `I agree with the strategic direction. From a technical standpoint, this solution is feasible and aligns with best practices.`
      ],
      'Business Strategist': [
        `From a business strategy standpoint, we need to consider market implications and user value proposition. This solution should align with our strategic objectives.`,
        `The technical approach mentioned makes sense. From a business perspective, we should also consider implementation costs and timeline to market.`,
        `I concur with the technical and security assessments. The business case is strong, especially considering the competitive advantages.`,
        `This comprehensive approach addresses all business requirements. I believe we have a solid foundation for moving forward.`
      ],
      'Security Expert': [
        `Security-wise, this problem has several attack vectors we need to consider. I recommend implementing defense-in-depth strategies.`,
        `The proposed technical solution is sound, but we need to add security controls at each layer. Authentication and authorization are critical.`,
        `From a security compliance perspective, this approach meets industry standards. The risk assessment looks favorable.`,
        `All security concerns have been addressed effectively. The solution provides adequate protection while maintaining usability.`
      ]
    };

    const agentResponses = responses[agent.name] || [
      `As ${agent.name}, I believe this problem requires careful consideration of multiple factors.`,
      `Building on the previous discussion, I can contribute insights from my expertise area.`,
      `I see the solution taking shape. My analysis suggests this approach is viable.`,
      `Based on our collaborative analysis, I support this comprehensive solution.`
    ];

    const responseIndex = Math.min(round - 1, agentResponses.length - 1);
    return agentResponses[responseIndex];
  }

  /**
   * Run expert panel analysis
   */
  async runExpertPanelAnalysis(topic) {
    console.log('\n🎯 Starting Expert Panel Analysis');
    console.log('=' .repeat(60));
    console.log(`Topic: ${topic}\n`);

    const conversationId = `expert_panel_${Date.now()}`;
    const agentList = this.agents.map(agent => {
      const agentKey = Object.keys(agent.agents)[0];
      return {
        name: agent.agents[agentKey].name,
        capabilities: agent.agents[agentKey].capabilities,
        framework: agent.sourceFramework
      };
    });

    const conversation = await this.conversationPatterns.startConversation(
      conversationId,
      'expert_panel',
      agentList,
      `Please provide expert analysis on: ${topic}. Each expert should focus on their domain of expertise.`,
      { maxRounds: 6 }
    );

    // Simulate expert panel discussion
    for (const agent of agentList) {
      console.log(`\n📊 Expert Analysis from ${agent.name} (${agent.framework}):`);
      
      const analysis = this.generateExpertAnalysis(agent, topic);
      console.log(`   ${analysis}\n`);
      
      await this.conversationPatterns.processNextStep(conversationId, {
        content: analysis,
        timestamp: new Date(),
        metadata: {
          source: agent.name,
          framework: agent.framework,
          type: 'expert_analysis',
          capabilities: agent.capabilities
        }
      });
    }

    return this.conversationPatterns.getConversationSummary(conversationId);
  }

  /**
   * Generate expert analysis based on agent's domain
   */
  generateExpertAnalysis(agent, topic) {
    const analyses = {
      'Technical Analyst': `Technical Analysis: The system architecture considerations for "${topic}" involve scalability, performance optimization, and integration patterns. Key technical risks include data consistency and system reliability.`,
      
      'Business Strategist': `Strategic Analysis: From a business perspective, "${topic}" presents opportunities for competitive advantage and market positioning. ROI projections show positive outcomes with proper execution.`,
      
      'Security Expert': `Security Analysis: The security implications of "${topic}" require attention to data protection, access controls, and compliance frameworks. Recommended security controls include encryption and audit logging.`
    };

    return analyses[agent.name] || `Analysis from ${agent.name}: This topic requires careful consideration from multiple perspectives. My expertise suggests a structured approach to implementation.`;
  }

  /**
   * Demonstrate framework integration
   */
  async demonstrateFrameworkIntegration() {
    console.log('\n🔗 Framework Integration Demonstration');
    console.log('=' .repeat(60));
    
    for (const agent of this.agents) {
      const agentKey = Object.keys(agent.agents)[0];
      const agentConfig = agent.agents[agentKey];
      
      console.log(`\n🤖 Agent: ${agentConfig.name}`);
      console.log(`   Framework: ${agent.sourceFramework}`);
      console.log(`   Capabilities: ${agentConfig.capabilities.join(', ')}`);
      
      const frameworks = agentConfig.frameworks;
      const enabledFrameworks = Object.keys(frameworks).filter(f => frameworks[f].enabled);
      console.log(`   Integrated Frameworks: ${enabledFrameworks.join(', ')}`);
      
      // Show integration capabilities
      if (frameworks.mcp?.enabled) {
        console.log(`   ✅ MCP Integration: Ready for Claude Desktop`);
      }
      if (frameworks.langchain?.enabled) {
        console.log(`   ✅ LangChain Integration: Tool and chain compatibility`);
      }
      if (frameworks.crewai?.enabled) {
        console.log(`   ✅ CrewAI Integration: Role-based team coordination`);
      }
    }
  }

  /**
   * Run comprehensive demonstration
   */
  async runDemo() {
    try {
      console.log('🎭 OSSA v0.1.8 AutoGen Multi-Agent Conversation Demo');
      console.log('=' .repeat(60));
      console.log('Demonstrating natural language communication between agents');
      console.log('from different frameworks (MCP, LangChain, CrewAI)\n');

      // Load agents
      await this.loadSampleAgents();
      
      // Demonstrate framework integration
      await this.demonstrateFrameworkIntegration();
      
      // Run problem-solving conversation
      const problemSummary = await this.startProblemSolvingConversation(
        'How can we implement a scalable, secure, and business-viable AI agent system?'
      );
      
      console.log('\n📋 Problem-Solving Summary:');
      console.log(`   Duration: ${Math.round(problemSummary.duration / 1000)}s`);
      console.log(`   Messages: ${problemSummary.messageCount}`);
      console.log(`   Participants: ${problemSummary.participants}`);
      
      // Run expert panel analysis
      const panelSummary = await this.runExpertPanelAnalysis(
        'Multi-framework AI agent interoperability standards'
      );
      
      console.log('\n📋 Expert Panel Summary:');
      console.log(`   Duration: ${Math.round(panelSummary.duration / 1000)}s`);
      console.log(`   Messages: ${panelSummary.messageCount}`);
      console.log(`   Experts: ${panelSummary.participants}`);
      
      console.log('\n✨ Demo completed successfully!');
      console.log('\nKey Features Demonstrated:');
      console.log('- Natural language agent communication');
      console.log('- Cross-framework integration (MCP, LangChain, CrewAI)');
      console.log('- Multiple conversation patterns (group chat, expert panel)');
      console.log('- Collaborative problem-solving workflows');
      console.log('- Open source implementation only');
      
    } catch (error) {
      console.error('❌ Demo failed:', error.message);
      console.error(error.stack);
    }
  }
}

// Run demo if called directly
if (import.meta.url === `file://${__filename}`) {
  const demo = new MultiAgentConversationDemo();
  demo.runDemo().catch(console.error);
}

export default MultiAgentConversationDemo;