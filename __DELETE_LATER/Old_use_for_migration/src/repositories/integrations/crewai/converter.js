/**
 * OSSA-to-CrewAI Converter
 * Converts OSSA agent specifications into CrewAI agent/task/crew definitions
 */

// Using crewai-ts and jcrewai packages
// crewai-ts provides more comprehensive TypeScript support
// jcrewai provides the core agent functionality

export class OSSAToCrewAIConverter {
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * Convert OSSA agent specification to CrewAI agent definition
   * @param {Object} ossaSpec - OSSA agent specification
   * @returns {Object} CrewAI agent configuration
   */
  async convert(ossaSpec) {
    const { metadata, spec } = ossaSpec;
    
    // Extract OSSA agent information
    const agentInfo = spec.agent || {};
    const capabilities = spec.capabilities || [];
    const frameworks = spec.frameworks || {};
    const crewaiConfig = frameworks.crewai || {};

    // Map OSSA expertise to CrewAI role
    const role = this.mapToCrewAIRole(agentInfo, crewaiConfig);
    
    // Convert capabilities to goals and tools
    const goal = this.extractGoal(agentInfo, capabilities);
    const backstory = this.generateBackstory(agentInfo, metadata);
    const tools = this.mapCapabilitiesToTools(capabilities);

    // Create CrewAI agent configuration
    const agentConfig = {
      role,
      goal,
      backstory,
      tools,
      verbose: true,
      allow_delegation: crewaiConfig.allow_delegation ?? true,
      max_iter: crewaiConfig.max_iter ?? 10,
      memory: crewaiConfig.memory_enabled ?? true
    };

    // Add OSSA metadata as agent properties
    agentConfig._ossaMetadata = {
      name: metadata.name,
      version: metadata.version,
      conformanceLevel: metadata.labels?.tier || 'core',
      capabilities: capabilities.map(cap => cap.name)
    };

    return agentConfig;
  }

  /**
   * Map OSSA agent information to CrewAI role
   */
  mapToCrewAIRole(agentInfo, crewaiConfig) {
    // Use CrewAI-specific role if defined
    if (crewaiConfig.role) {
      return crewaiConfig.role;
    }

    // Extract role from agent name or expertise
    const name = agentInfo.name || '';
    const expertise = agentInfo.expertise || '';
    
    // Common role mapping patterns
    if (expertise.toLowerCase().includes('analyst') || expertise.toLowerCase().includes('analysis')) {
      return 'Senior Data Analyst';
    }
    if (expertise.toLowerCase().includes('code') || expertise.toLowerCase().includes('development')) {
      return 'Senior Software Engineer';
    }
    if (expertise.toLowerCase().includes('research') || expertise.toLowerCase().includes('researcher')) {
      return 'Research Specialist';
    }
    if (expertise.toLowerCase().includes('writer') || expertise.toLowerCase().includes('content')) {
      return 'Content Writer';
    }
    if (expertise.toLowerCase().includes('manager') || expertise.toLowerCase().includes('coordination')) {
      return 'Project Manager';
    }

    // Default role based on agent name
    return `${name} Specialist`.replace(/Agent$/, 'Specialist');
  }

  /**
   * Extract goal from agent information and capabilities
   */
  extractGoal(agentInfo, capabilities) {
    const expertise = agentInfo.expertise || '';
    
    if (expertise) {
      return `Execute tasks related to: ${expertise}`;
    }

    // Generate goal from capabilities
    if (capabilities.length > 0) {
      const capNames = capabilities.map(cap => cap.description || cap.name).join(', ');
      return `Provide specialized services including: ${capNames}`;
    }

    return 'Complete assigned tasks with high quality and accuracy';
  }

  /**
   * Generate backstory from agent information and metadata
   */
  generateBackstory(agentInfo, metadata) {
    const name = agentInfo.name || metadata.name;
    const description = agentInfo.description || metadata.description;
    const expertise = agentInfo.expertise || '';

    let backstory = `You are ${name}, a specialized AI agent built using the OSSA (Open Standards for Scalable Agents) specification. `;
    
    if (expertise) {
      backstory += `Your expertise lies in ${expertise.toLowerCase()}. `;
    }

    if (description) {
      backstory += `${description} `;
    }

    backstory += 'You work collaboratively with other agents to achieve complex goals while maintaining high standards of quality and efficiency.';

    return backstory;
  }

  /**
   * Map OSSA capabilities to CrewAI tools
   */
  mapCapabilitiesToTools(capabilities) {
    return capabilities.map(capability => {
      return {
        name: capability.name,
        description: capability.description || `Tool for ${capability.name}`,
        // For now, return a mock tool function
        // In practice, this would map to actual tool implementations
        func: async (input) => {
          return {
            result: `Executed ${capability.name} with input: ${JSON.stringify(input)}`,
            capability: capability.name,
            timestamp: new Date().toISOString()
          };
        }
      };
    });
  }

  /**
   * Create task definitions from OSSA workflow specifications
   */
  createTasksFromWorkflow(workflow, agents) {
    if (!workflow || !workflow.tasks) {
      // Create a default task if no workflow is specified
      return [{
        description: 'Execute the primary agent capabilities',
        expected_output: 'Completed task results',
        agent: agents[0] // Assign to first agent
      }];
    }

    return workflow.tasks.map((task, index) => ({
      description: task.description || `Execute task ${index + 1}`,
      expected_output: task.expected_output || 'Task completion confirmation',
      agent: agents[index % agents.length] // Round-robin assignment
    }));
  }

  /**
   * Convert coordination pattern to CrewAI process
   */
  mapCoordinationToProcess(coordination) {
    if (!coordination) return 'sequential';

    const pattern = coordination.pattern || coordination.executionMode || 'sequential';
    
    switch (pattern.toLowerCase()) {
      case 'parallel':
        return 'parallel';
      case 'hierarchical':
        return 'hierarchical';
      case 'sequential':
      default:
        return 'sequential';
    }
  }
}

export default OSSAToCrewAIConverter;