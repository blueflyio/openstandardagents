/**
 * CrewAI Team Orchestrator
 * Creates and manages CrewAI crews from converted OSSA agents
 */

import { Crew, Agent, Task } from 'crewai-ts';
import { Process } from 'jcrewai';

export class CrewAITeamOrchestrator {
  constructor(options = {}) {
    this.options = {
      defaultProcess: 'sequential',
      verbose: true,
      memoryEnabled: true,
      maxExecutionTime: 300000, // 5 minutes
      ...options
    };
  }

  /**
   * Create a CrewAI crew from converted agent configurations
   * @param {Object[]} agentConfigs - Array of CrewAI agent configurations
   * @param {Object} teamConfig - Team-level configuration
   * @returns {Crew} Configured CrewAI crew
   */
  async createCrew(agentConfigs, teamConfig = {}) {
    // Create agents
    const agents = await this.createAgents(agentConfigs);
    
    // Create tasks
    const tasks = this.createTasks(agentConfigs, agents, teamConfig);
    
    // Configure crew process
    const process = this.determineProcess(teamConfig);
    
    // Create crew configuration
    const crewConfig = {
      agents,
      tasks,
      process,
      verbose: teamConfig.verbose ?? this.options.verbose,
      memory: teamConfig.memory ?? this.options.memoryEnabled,
      maxExecutionTime: teamConfig.maxExecutionTime ?? this.options.maxExecutionTime,
      ...teamConfig
    };

    // Add OSSA metadata to crew
    crewConfig._ossaMetadata = {
      agentCount: agents.length,
      conformanceLevels: agentConfigs.map(config => 
        config._ossaMetadata?.conformanceLevel || 'core'
      ),
      capabilities: agentConfigs.flatMap(config => 
        config._ossaMetadata?.capabilities || []
      ),
      createdAt: new Date().toISOString()
    };

    return new Crew(crewConfig);
  }

  /**
   * Create CrewAI agents from configurations
   */
  async createAgents(agentConfigs) {
    return Promise.all(
      agentConfigs.map(async (config, index) => {
        const agent = new Agent({
          role: config.role,
          goal: config.goal,
          backstory: config.backstory,
          tools: config.tools || [],
          verbose: config.verbose ?? true,
          allowDelegation: config.allow_delegation ?? true,
          maxIter: config.max_iter ?? 10,
          memory: config.memory ?? true
        });

        // Attach OSSA metadata
        agent._ossaMetadata = config._ossaMetadata;
        agent._index = index;

        return agent;
      })
    );
  }

  /**
   * Create tasks for the crew
   */
  createTasks(agentConfigs, agents, teamConfig) {
    const taskDefinitions = teamConfig.tasks || this.generateDefaultTasks(agentConfigs);
    
    return taskDefinitions.map((taskDef, index) => {
      const assignedAgent = this.assignAgent(taskDef, agents, index);
      
      return new Task({
        description: taskDef.description,
        expectedOutput: taskDef.expected_output || taskDef.expectedOutput,
        agent: assignedAgent,
        tools: taskDef.tools || [],
        async: taskDef.async ?? false,
        context: taskDef.context || [],
        output: taskDef.output
      });
    });
  }

  /**
   * Generate default tasks when none are specified
   */
  generateDefaultTasks(agentConfigs) {
    return agentConfigs.map((config, index) => {
      const capabilities = config._ossaMetadata?.capabilities || [];
      const agentName = config._ossaMetadata?.name || `Agent ${index + 1}`;
      
      return {
        description: `Execute the primary capabilities of ${agentName}: ${capabilities.join(', ')}`,
        expected_output: `Detailed results from ${agentName}'s capabilities execution`,
        agent_index: index
      };
    });
  }

  /**
   * Assign agent to task based on configuration
   */
  assignAgent(taskDef, agents, defaultIndex) {
    // If specific agent is requested
    if (taskDef.agent) {
      return taskDef.agent;
    }

    // If agent index is specified
    if (typeof taskDef.agent_index === 'number') {
      return agents[taskDef.agent_index] || agents[defaultIndex % agents.length];
    }

    // If agent role is specified
    if (taskDef.agent_role) {
      const matchingAgent = agents.find(agent => 
        agent.role.toLowerCase().includes(taskDef.agent_role.toLowerCase())
      );
      if (matchingAgent) return matchingAgent;
    }

    // Default to round-robin assignment
    return agents[defaultIndex % agents.length];
  }

  /**
   * Determine the execution process for the crew
   */
  determineProcess(teamConfig) {
    const processType = teamConfig.process || teamConfig.coordination?.pattern || this.options.defaultProcess;
    
    switch (processType.toLowerCase()) {
      case 'parallel':
        return Process.PARALLEL;
      case 'hierarchical':
        return Process.HIERARCHICAL;
      case 'sequential':
      default:
        return Process.SEQUENTIAL;
    }
  }

  /**
   * Add role-based coordination to crew
   */
  applyRoleBasedCoordination(crew, coordinationConfig = {}) {
    const {
      leaderRole = 'manager',
      delegationEnabled = true,
      maxDelegationDepth = 3,
      conflictResolution = 'leader_decides'
    } = coordinationConfig;

    // Identify leader agent
    const leader = crew.agents.find(agent => 
      agent.role.toLowerCase().includes(leaderRole.toLowerCase())
    ) || crew.agents[0];

    // Configure delegation rules
    if (delegationEnabled) {
      crew.agents.forEach(agent => {
        if (agent !== leader) {
          agent.maxDelegationDepth = maxDelegationDepth;
          agent.delegationRules = {
            canDelegate: true,
            requiresApproval: agent.role !== leader.role,
            approvalAgent: leader
          };
        }
      });

      // Leader can delegate without approval
      leader.delegationRules = {
        canDelegate: true,
        requiresApproval: false,
        maxDelegations: crew.agents.length - 1
      };
    }

    // Set conflict resolution strategy
    crew.conflictResolution = {
      strategy: conflictResolution,
      arbitrator: leader,
      maxRetries: 3
    };

    return crew;
  }

  /**
   * Execute crew with monitoring and error handling
   */
  async executeCrew(crew, inputs = {}) {
    const startTime = Date.now();
    
    try {
      // Pre-execution validation
      this.validateCrew(crew);
      
      // Execute the crew
      const result = await crew.kickoff(inputs);
      
      // Add execution metadata
      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        result,
        metadata: {
          executionTime,
          agentCount: crew.agents.length,
          taskCount: crew.tasks.length,
          process: crew.process,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date().toISOString()
        },
        ossaMetadata: crew._ossaMetadata
      };
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      return {
        success: false,
        error: error.message,
        metadata: {
          executionTime,
          agentCount: crew.agents.length,
          taskCount: crew.tasks.length,
          failurePoint: error.stack,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date().toISOString()
        },
        ossaMetadata: crew._ossaMetadata
      };
    }
  }

  /**
   * Validate crew configuration before execution
   */
  validateCrew(crew) {
    if (!crew.agents || crew.agents.length === 0) {
      throw new Error('Crew must have at least one agent');
    }

    if (!crew.tasks || crew.tasks.length === 0) {
      throw new Error('Crew must have at least one task');
    }

    // Validate that all tasks have assigned agents
    for (const task of crew.tasks) {
      if (!task.agent) {
        throw new Error('All tasks must have an assigned agent');
      }
    }

    // Validate agent capabilities against task requirements
    for (const task of crew.tasks) {
      if (task.requiredCapabilities) {
        const agentCapabilities = task.agent._ossaMetadata?.capabilities || [];
        const missingCapabilities = task.requiredCapabilities.filter(
          cap => !agentCapabilities.includes(cap)
        );
        
        if (missingCapabilities.length > 0) {
          console.warn(`Task "${task.description}" requires capabilities not available in assigned agent: ${missingCapabilities.join(', ')}`);
        }
      }
    }
  }
}

export default CrewAITeamOrchestrator;