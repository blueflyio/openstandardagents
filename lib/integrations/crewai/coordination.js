/**
 * Role-Based Agent Coordination for CrewAI Teams
 * Implements coordination patterns based on 30k+ stars pattern
 */

export class RoleBasedCoordination {
  constructor(options = {}) {
    this.options = {
      defaultPattern: 'sequential',
      enableDelegation: true,
      maxDelegationDepth: 3,
      conflictResolution: 'consensus',
      ...options
    };

    this.patterns = this.initializePatterns();
  }

  /**
   * Initialize coordination patterns
   */
  initializePatterns() {
    return {
      sequential: {
        name: 'Sequential Execution',
        description: 'Agents execute tasks one after another in order',
        process: 'sequential',
        delegation: {
          enabled: true,
          maxDepth: 2,
          requiresApproval: false
        },
        coordination: {
          handoff: 'automatic',
          contextSharing: true,
          errorHandling: 'retry_with_next'
        }
      },

      parallel: {
        name: 'Parallel Execution',
        description: 'Agents execute tasks simultaneously',
        process: 'parallel',
        delegation: {
          enabled: true,
          maxDepth: 1,
          requiresApproval: true
        },
        coordination: {
          handoff: 'synchronized',
          contextSharing: false,
          errorHandling: 'isolate_failures'
        }
      },

      hierarchical: {
        name: 'Hierarchical Leadership',
        description: 'One agent leads and coordinates others',
        process: 'hierarchical',
        leadership: {
          leaderRole: 'manager',
          decisionMaking: 'leader_decides',
          conflictResolution: 'escalate_to_leader'
        },
        delegation: {
          enabled: true,
          maxDepth: 3,
          requiresApproval: true,
          approvalChain: ['leader']
        },
        coordination: {
          handoff: 'managed',
          contextSharing: true,
          errorHandling: 'escalate_to_leader'
        }
      },

      consensus: {
        name: 'Consensus-Based',
        description: 'Agents collaborate and reach consensus on decisions',
        process: 'sequential',
        decisionMaking: {
          method: 'consensus',
          votingThreshold: 0.6,
          maxRounds: 3,
          tieBreaker: 'random'
        },
        delegation: {
          enabled: true,
          maxDepth: 2,
          requiresApproval: true,
          approvalThreshold: 0.5
        },
        coordination: {
          handoff: 'consensus',
          contextSharing: true,
          errorHandling: 'group_decision'
        }
      },

      adaptive: {
        name: 'Adaptive Coordination',
        description: 'Pattern adapts based on task complexity and agent availability',
        process: 'sequential', // Starting point
        adaptation: {
          enabled: true,
          triggers: ['high_complexity', 'agent_failure', 'time_pressure'],
          fallbackPattern: 'sequential'
        },
        delegation: {
          enabled: true,
          maxDepth: 2,
          adaptive: true
        },
        coordination: {
          handoff: 'adaptive',
          contextSharing: true,
          errorHandling: 'adaptive'
        }
      },

      expert_network: {
        name: 'Expert Network',
        description: 'Agents route tasks based on expertise matching',
        process: 'sequential',
        routing: {
          method: 'expertise_matching',
          fallback: 'round_robin',
          expertiseWeights: true
        },
        delegation: {
          enabled: true,
          maxDepth: 3,
          expertiseRequired: true
        },
        coordination: {
          handoff: 'expertise_based',
          contextSharing: true,
          errorHandling: 'reroute_to_expert'
        }
      }
    };
  }

  /**
   * Get coordination pattern configuration
   */
  getPattern(patternName) {
    const pattern = this.patterns[patternName] || this.patterns[this.options.defaultPattern];
    return JSON.parse(JSON.stringify(pattern)); // Deep clone
  }

  /**
   * Apply coordination pattern to CrewAI crew
   */
  applyPattern(crew, patternName, customConfig = {}) {
    const pattern = this.getPattern(patternName);
    const config = { ...pattern, ...customConfig };

    // Apply process type
    crew.process = this.mapProcessType(config.process);

    // Configure delegation
    if (config.delegation?.enabled) {
      this.configureDelegation(crew, config.delegation);
    }

    // Set up leadership if hierarchical
    if (config.leadership) {
      this.configureLeadership(crew, config.leadership);
    }

    // Configure decision making
    if (config.decisionMaking) {
      this.configureDecisionMaking(crew, config.decisionMaking);
    }

    // Set up coordination mechanisms
    if (config.coordination) {
      this.configureCoordination(crew, config.coordination);
    }

    // Configure adaptive behavior
    if (config.adaptation) {
      this.configureAdaptation(crew, config.adaptation);
    }

    // Set up expertise routing
    if (config.routing) {
      this.configureRouting(crew, config.routing);
    }

    return crew;
  }

  /**
   * Map pattern process to CrewAI process type
   */
  mapProcessType(processType) {
    const processMap = {
      'sequential': 'sequential',
      'parallel': 'parallel',
      'hierarchical': 'hierarchical'
    };

    return processMap[processType] || 'sequential';
  }

  /**
   * Configure delegation settings for agents
   */
  configureDelegation(crew, delegationConfig) {
    crew.agents.forEach((agent, index) => {
      agent.delegationConfig = {
        enabled: delegationConfig.enabled,
        maxDepth: delegationConfig.maxDepth || 2,
        requiresApproval: delegationConfig.requiresApproval ?? false,
        approvalChain: delegationConfig.approvalChain || [],
        expertiseRequired: delegationConfig.expertiseRequired ?? false,
        adaptive: delegationConfig.adaptive ?? false
      };

      // Agent-specific delegation rules
      if (delegationConfig.adaptive) {
        agent.delegationConfig.adaptationTriggers = [
          'task_complexity_high',
          'expertise_mismatch',
          'resource_constraints'
        ];
      }
    });
  }

  /**
   * Configure leadership hierarchy
   */
  configureLeadership(crew, leadershipConfig) {
    const leaderRole = leadershipConfig.leaderRole || 'manager';
    
    // Find or designate leader
    let leader = crew.agents.find(agent => 
      agent.role.toLowerCase().includes(leaderRole.toLowerCase())
    );

    if (!leader) {
      // Designate first agent as leader if no specific leader found
      leader = crew.agents[0];
      leader.role = `${leader.role} (Team Leader)`;
    }

    // Configure leader capabilities
    leader.isLeader = true;
    leader.leadershipConfig = {
      decisionMaking: leadershipConfig.decisionMaking || 'leader_decides',
      conflictResolution: leadershipConfig.conflictResolution || 'escalate_to_leader',
      canOverrideDecisions: true,
      managesWorkflow: true
    };

    // Configure team members
    crew.agents.forEach(agent => {
      if (agent !== leader) {
        agent.teamRole = 'member';
        agent.leader = leader;
        agent.escalationRules = {
          escalateToLeader: true,
          escalationTriggers: ['conflict', 'resource_constraints', 'decision_deadlock']
        };
      }
    });

    crew.leadership = {
      leader,
      structure: 'hierarchical',
      decisionMaking: leadershipConfig.decisionMaking
    };
  }

  /**
   * Configure decision making mechanisms
   */
  configureDecisionMaking(crew, decisionConfig) {
    crew.decisionMaking = {
      method: decisionConfig.method || 'consensus',
      votingThreshold: decisionConfig.votingThreshold || 0.6,
      maxRounds: decisionConfig.maxRounds || 3,
      tieBreaker: decisionConfig.tieBreaker || 'random',
      timeoutMs: decisionConfig.timeoutMs || 300000 // 5 minutes
    };

    // Add decision making capabilities to agents
    crew.agents.forEach(agent => {
      agent.decisionMaking = {
        canVote: true,
        votingWeight: agent.isLeader ? 2 : 1,
        consensusRequired: decisionConfig.method === 'consensus'
      };
    });
  }

  /**
   * Configure coordination mechanisms
   */
  configureCoordination(crew, coordinationConfig) {
    crew.coordination = {
      handoff: coordinationConfig.handoff || 'automatic',
      contextSharing: coordinationConfig.contextSharing ?? true,
      errorHandling: coordinationConfig.errorHandling || 'retry_with_next',
      communicationProtocol: 'direct',
      synchronization: coordinationConfig.synchronization || 'task_completion'
    };

    // Configure context sharing
    if (coordinationConfig.contextSharing) {
      crew.contextSharing = {
        enabled: true,
        scope: 'full_context',
        compression: true,
        retention: '1h'
      };
    }
  }

  /**
   * Configure adaptive behavior
   */
  configureAdaptation(crew, adaptationConfig) {
    crew.adaptation = {
      enabled: adaptationConfig.enabled,
      triggers: adaptationConfig.triggers || ['high_complexity', 'agent_failure'],
      fallbackPattern: adaptationConfig.fallbackPattern || 'sequential',
      adaptationStrategy: 'rule_based',
      learningEnabled: false // Future enhancement
    };

    // Add adaptation capabilities to each agent
    crew.agents.forEach(agent => {
      agent.adaptation = {
        canAdapt: true,
        adaptationTriggers: adaptationConfig.triggers,
        fallbackBehavior: 'delegate_to_peer'
      };
    });
  }

  /**
   * Configure expertise-based routing
   */
  configureRouting(crew, routingConfig) {
    crew.routing = {
      method: routingConfig.method || 'expertise_matching',
      fallback: routingConfig.fallback || 'round_robin',
      expertiseWeights: routingConfig.expertiseWeights ?? true,
      loadBalancing: routingConfig.loadBalancing ?? true
    };

    // Build expertise matrix
    const expertiseMatrix = this.buildExpertiseMatrix(crew.agents);
    crew.expertiseMatrix = expertiseMatrix;

    // Add routing capabilities to crew
    crew.routeTask = (task) => {
      return this.routeTaskToAgent(task, crew.agents, expertiseMatrix, routingConfig);
    };
  }

  /**
   * Build expertise matrix from agent capabilities
   */
  buildExpertiseMatrix(agents) {
    const matrix = {};
    
    agents.forEach((agent, index) => {
      const capabilities = agent._ossaMetadata?.capabilities || [];
      matrix[index] = {
        agent,
        capabilities,
        expertise: this.calculateExpertiseScores(capabilities),
        currentLoad: 0,
        availability: 1.0
      };
    });

    return matrix;
  }

  /**
   * Calculate expertise scores for an agent
   */
  calculateExpertiseScores(capabilities) {
    const scores = {};
    
    capabilities.forEach(capability => {
      // Simple scoring based on capability names
      // In practice, this would be more sophisticated
      if (capability.includes('analysis') || capability.includes('analyze')) {
        scores.analysis = (scores.analysis || 0) + 1;
      }
      if (capability.includes('code') || capability.includes('development')) {
        scores.development = (scores.development || 0) + 1;
      }
      if (capability.includes('research')) {
        scores.research = (scores.research || 0) + 1;
      }
      if (capability.includes('writing') || capability.includes('content')) {
        scores.content = (scores.content || 0) + 1;
      }
      if (capability.includes('management') || capability.includes('coordination')) {
        scores.management = (scores.management || 0) + 1;
      }
    });

    return scores;
  }

  /**
   * Route task to most suitable agent based on expertise
   */
  routeTaskToAgent(task, agents, expertiseMatrix, routingConfig) {
    const taskRequirements = this.analyzeTaskRequirements(task);
    
    let bestAgent = null;
    let bestScore = -1;

    Object.values(expertiseMatrix).forEach(agentInfo => {
      let score = 0;
      
      // Calculate expertise match score
      taskRequirements.forEach(requirement => {
        score += agentInfo.expertise[requirement] || 0;
      });

      // Apply load balancing
      if (routingConfig.loadBalancing) {
        score = score * (1 - agentInfo.currentLoad * 0.3);
      }

      // Apply availability factor
      score = score * agentInfo.availability;

      if (score > bestScore) {
        bestScore = score;
        bestAgent = agentInfo.agent;
      }
    });

    return bestAgent || agents[0]; // Fallback to first agent
  }

  /**
   * Analyze task to determine requirements
   */
  analyzeTaskRequirements(task) {
    const description = (task.description || '').toLowerCase();
    const requirements = [];

    if (description.includes('analy') || description.includes('research')) {
      requirements.push('analysis', 'research');
    }
    if (description.includes('code') || description.includes('develop') || description.includes('program')) {
      requirements.push('development');
    }
    if (description.includes('write') || description.includes('content') || description.includes('document')) {
      requirements.push('content');
    }
    if (description.includes('manage') || description.includes('coordinate') || description.includes('organize')) {
      requirements.push('management');
    }

    return requirements.length > 0 ? requirements : ['general'];
  }

  /**
   * Get available coordination patterns
   */
  getAvailablePatterns() {
    return Object.keys(this.patterns).map(key => ({
      name: key,
      ...this.patterns[key]
    }));
  }

  /**
   * Create custom coordination pattern
   */
  createCustomPattern(name, config) {
    this.patterns[name] = {
      name: config.displayName || name,
      description: config.description || 'Custom coordination pattern',
      ...config
    };
    
    return this.patterns[name];
  }
}

export default RoleBasedCoordination;