#!/usr/bin/env node

/**
 * Microsoft AutoGen Framework Bridge for OSSA v0.1.8
 * Implements conversational multi-agent patterns with natural language communication
 * 
 * Integrates with:
 * - Existing MCP (Model Context Protocol) implementations
 * - LangChain framework patterns  
 * - CrewAI multi-agent coordination
 * 
 * @version 0.1.8
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class AutoGenBridge {
  constructor(options = {}) {
    this.config = {
      openSource: true,
      frameworks: ['mcp', 'langchain', 'crewai'],
      conversationPatterns: ['round_robin', 'hierarchical', 'group_chat'],
      naturalLanguage: true,
      ...options
    };
  }

  /**
   * Convert OSSA agent specification to AutoGen conversational agent
   */
  async convertToAutoGen(ossaAgentPath) {
    try {
      if (!existsSync(ossaAgentPath)) {
        throw new Error(`OSSA agent file not found: ${ossaAgentPath}`);
      }

      const ossaSpec = parseYaml(readFileSync(ossaAgentPath, 'utf8'));
      
      if (!ossaSpec.spec?.agent) {
        throw new Error('Invalid OSSA specification: missing agent spec');
      }

      return this.generateAutoGenConfig(ossaSpec);
    } catch (error) {
      console.error('AutoGen conversion error:', error.message);
      throw error;
    }
  }

  /**
   * Generate AutoGen configuration from OSSA specification
   */
  generateAutoGenConfig(ossaSpec) {
    const agent = ossaSpec.spec.agent;
    const capabilities = ossaSpec.spec.capabilities || [];
    const frameworks = ossaSpec.spec.frameworks || {};

    const autoGenConfig = {
      config_list: [
        {
          model: "gpt-4",
          api_key: process.env.OPENAI_API_KEY,
          api_base: process.env.LLM_GATEWAY_URL || "http://localhost:4000/api/v1"
        }
      ],
      agents: {
        [agent.name.toLowerCase().replace(/\s+/g, '_')]: {
          name: agent.name,
          system_message: this.generateSystemMessage(agent, capabilities),
          llm_config: {
            config_list: "config_list",
            temperature: 0.7,
            timeout: 30
          },
          human_input_mode: "NEVER",
          max_consecutive_auto_reply: 5,
          code_execution_config: false,
          capabilities: capabilities.map(cap => cap.name),
          frameworks: frameworks
        }
      },
      conversation_patterns: {
        round_robin: {
          type: "sequential",
          participants: [agent.name],
          termination_condition: "max_rounds"
        },
        hierarchical: {
          type: "manager_worker",
          manager: agent.name,
          workers: [],
          delegation_strategy: "capability_based"
        },
        group_chat: {
          type: "multi_agent",
          participants: [agent.name],
          coordination: "natural_language"
        }
      },
      integrations: {
        mcp: frameworks.mcp?.enabled || false,
        langchain: frameworks.langchain?.enabled || false,
        crewai: frameworks.crewai?.enabled || false
      }
    };

    return autoGenConfig;
  }

  /**
   * Generate system message for AutoGen agent from OSSA capabilities
   */
  generateSystemMessage(agent, capabilities) {
    const capabilityDescriptions = capabilities.map(cap => 
      `- ${cap.name}: ${cap.description || 'No description provided'}`
    ).join('\n');

    return `You are ${agent.name}, an AI agent with the following expertise: ${agent.expertise || 'General AI assistance'}.

Your capabilities include:
${capabilityDescriptions}

You should:
1. Respond naturally and conversationally
2. Use your capabilities to provide accurate, helpful information
3. Collaborate effectively with other agents in multi-agent conversations
4. Maintain context throughout conversations
5. Ask clarifying questions when needed

When working with other agents:
- Be respectful and collaborative
- Share relevant information from your domain expertise
- Build on others' contributions constructively
- Clearly state when you're uncertain about something
- Coordinate effectively to avoid redundant responses`;
  }

  /**
   * Create AutoGen conversation group from multiple OSSA agents
   */
  async createConversationGroup(ossaAgentPaths, conversationConfig = {}) {
    const agents = [];
    
    for (const agentPath of ossaAgentPaths) {
      const autoGenConfig = await this.convertToAutoGen(agentPath);
      agents.push(autoGenConfig);
    }

    const groupConfig = {
      name: conversationConfig.name || "ossa_agent_group",
      participants: agents.map(agent => Object.keys(agent.agents)[0]),
      conversation_type: conversationConfig.type || "group_chat",
      coordination_strategy: conversationConfig.coordination || "natural_language",
      termination_conditions: {
        max_rounds: conversationConfig.maxRounds || 10,
        timeout_seconds: conversationConfig.timeout || 300,
        completion_keywords: ["COMPLETE", "FINISHED", "DONE"]
      },
      integration_config: {
        mcp_enabled: true,
        langchain_enabled: true,
        crewai_enabled: true,
        cross_framework_communication: true
      }
    };

    return {
      group_config: groupConfig,
      agents: agents,
      conversation_patterns: this.generateConversationPatterns(agents.length)
    };
  }

  /**
   * Generate conversation patterns based on number of agents
   */
  generateConversationPatterns(agentCount) {
    return {
      round_robin: {
        description: "Sequential agent responses in order",
        suitable_for: "structured information gathering",
        max_agents: agentCount
      },
      hierarchical: {
        description: "Manager-worker delegation pattern",
        suitable_for: "complex task breakdown and coordination",
        requires_manager: true
      },
      group_chat: {
        description: "Natural language multi-agent discussion",
        suitable_for: "collaborative problem solving",
        coordination: "emergent"
      },
      expert_panel: {
        description: "Domain experts provide specialized input",
        suitable_for: "multi-domain analysis and recommendations",
        expertise_based: true
      }
    };
  }

  /**
   * Generate natural language communication protocol
   */
  generateCommunicationProtocol() {
    return {
      message_format: {
        type: "natural_language",
        structure: "conversational",
        context_preservation: true
      },
      coordination_cues: [
        "I'll handle the analysis of...",
        "Based on what [AgentName] mentioned about...",
        "Let me add perspective from my expertise in...",
        "Building on the previous response...",
        "From my domain knowledge..."
      ],
      handoff_patterns: [
        "Passing this to [AgentName] for their expertise in...",
        "[AgentName], can you elaborate on...",
        "This falls under your domain, [AgentName]...",
        "I'll defer to [AgentName] for the technical details..."
      ],
      termination_signals: [
        "I believe we have a comprehensive answer",
        "All perspectives have been covered",
        "The solution is complete",
        "No additional input needed"
      ]
    };
  }

  /**
   * Export AutoGen configuration files
   */
  async exportAutoGenConfig(config, outputPath) {
    try {
      // Main configuration file
      writeFileSync(
        join(outputPath, 'autogen_config.json'),
        JSON.stringify(config, null, 2)
      );

      // Python script template for running AutoGen
      const pythonScript = this.generatePythonScript(config);
      writeFileSync(join(outputPath, 'run_autogen.py'), pythonScript);

      // Conversation templates
      const conversationTemplates = this.generateConversationTemplates();
      writeFileSync(
        join(outputPath, 'conversation_templates.json'),
        JSON.stringify(conversationTemplates, null, 2)
      );

      console.log(`AutoGen configuration exported to: ${outputPath}`);
      return true;
    } catch (error) {
      console.error('Export error:', error.message);
      throw error;
    }
  }

  /**
   * Generate Python script for running AutoGen conversations
   */
  generatePythonScript(config) {
    return `#!/usr/bin/env python3
"""
AutoGen Conversation Script - Generated from OSSA v0.1.8
Implements conversational multi-agent patterns with natural language communication
"""

import json
import os
import autogen
from autogen import ConversableAgent, GroupChat, GroupChatManager

def load_config():
    """Load AutoGen configuration"""
    with open('autogen_config.json', 'r') as f:
        return json.load(f)

def create_agents(config):
    """Create AutoGen agents from configuration"""
    agents = []
    
    for agent_name, agent_config in config['agents'].items():
        agent = ConversableAgent(
            name=agent_config['name'],
            system_message=agent_config['system_message'],
            llm_config=agent_config['llm_config'],
            human_input_mode=agent_config['human_input_mode'],
            max_consecutive_auto_reply=agent_config['max_consecutive_auto_reply']
        )
        agents.append(agent)
    
    return agents

def run_group_chat(agents, initial_message, max_round=10):
    """Run group chat conversation"""
    groupchat = GroupChat(
        agents=agents,
        messages=[],
        max_round=max_round,
        speaker_selection_method="round_robin"  # or "auto" for natural selection
    )
    
    manager = GroupChatManager(
        groupchat=groupchat,
        llm_config=agents[0].llm_config
    )
    
    # Start the conversation
    agents[0].initiate_chat(
        manager,
        message=initial_message
    )

def main():
    """Main execution function"""
    config = load_config()
    agents = create_agents(config)
    
    # Example conversation
    initial_message = "Let's collaborate to analyze this complex problem using our combined expertise."
    
    print(f"Starting conversation with {len(agents)} agents...")
    run_group_chat(agents, initial_message)

if __name__ == "__main__":
    main()
`;
  }

  /**
   * Generate conversation templates for different patterns
   */
  generateConversationTemplates() {
    return {
      problem_solving: {
        description: "Collaborative problem-solving conversation",
        initial_message: "We need to solve this problem together. Let me outline the key challenges and we can each contribute our expertise.",
        coordination_style: "natural_discussion"
      },
      analysis: {
        description: "Multi-perspective analysis conversation",
        initial_message: "Let's analyze this topic from multiple angles. Each agent should provide insights from their domain expertise.",
        coordination_style: "expert_panels"
      },
      planning: {
        description: "Collaborative planning and strategy",
        initial_message: "We need to create a comprehensive plan. Let's break this down and have each agent contribute to their area of expertise.",
        coordination_style: "structured_delegation"
      },
      review: {
        description: "Peer review and quality assurance",
        initial_message: "Please review this proposal and provide feedback from your respective domains of expertise.",
        coordination_style: "sequential_review"
      }
    };
  }
}

// CLI interface for AutoGen bridge
if (import.meta.url === `file://${__filename}`) {
  const bridge = new AutoGenBridge();
  
  const command = process.argv[2];
  const args = process.argv.slice(3);
  
  switch (command) {
    case 'convert':
      if (args.length < 1) {
        console.error('Usage: node autogen-bridge.js convert <ossa-agent-path>');
        process.exit(1);
      }
      
      bridge.convertToAutoGen(args[0])
        .then(config => console.log(JSON.stringify(config, null, 2)))
        .catch(err => {
          console.error('Conversion failed:', err.message);
          process.exit(1);
        });
      break;
      
    case 'group':
      if (args.length < 2) {
        console.error('Usage: node autogen-bridge.js group <agent1> <agent2> [agent3...]');
        process.exit(1);
      }
      
      bridge.createConversationGroup(args)
        .then(group => console.log(JSON.stringify(group, null, 2)))
        .catch(err => {
          console.error('Group creation failed:', err.message);
          process.exit(1);
        });
      break;
      
    case 'export':
      if (args.length < 2) {
        console.error('Usage: node autogen-bridge.js export <config-file> <output-path>');
        process.exit(1);
      }
      
      const config = JSON.parse(readFileSync(args[0], 'utf8'));
      bridge.exportAutoGenConfig(config, args[1])
        .then(() => console.log('AutoGen configuration exported successfully'))
        .catch(err => {
          console.error('Export failed:', err.message);
          process.exit(1);
        });
      break;
      
    default:
      console.log(`
AutoGen Bridge for OSSA v0.1.8 - Conversational Multi-Agent Patterns

Commands:
  convert <ossa-agent-path>              Convert OSSA agent to AutoGen format
  group <agent1> <agent2> [agent3...]    Create conversation group from multiple agents
  export <config-file> <output-path>     Export AutoGen configuration files

Examples:
  node autogen-bridge.js convert ./examples/.agents/test-agent/agent.yml
  node autogen-bridge.js group agent1.yml agent2.yml agent3.yml
  node autogen-bridge.js export autogen_config.json ./autogen_output/

Features:
- Natural language agent communication protocols
- Integration with MCP, LangChain, CrewAI implementations  
- Conversational patterns: round_robin, hierarchical, group_chat
- Open source only - no proprietary dependencies
      `);
      break;
  }
}

export default AutoGenBridge;