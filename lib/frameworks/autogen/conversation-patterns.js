#!/usr/bin/env node

/**
 * AutoGen Conversation Patterns for OSSA v0.1.8
 * Implements natural language communication protocols for multi-agent systems
 * 
 * @version 0.1.8
 */

import { EventEmitter } from 'events';

export class ConversationPatterns extends EventEmitter {
  constructor(options = {}) {
    super();
    this.config = {
      naturalLanguage: true,
      contextPreservation: true,
      maxRounds: 10,
      timeout: 300000, // 5 minutes
      ...options
    };
    
    this.activeConversations = new Map();
    this.patterns = this.initializePatterns();
  }

  /**
   * Initialize available conversation patterns
   */
  initializePatterns() {
    return {
      round_robin: new RoundRobinPattern(this.config),
      hierarchical: new HierarchicalPattern(this.config),
      group_chat: new GroupChatPattern(this.config),
      expert_panel: new ExpertPanelPattern(this.config),
      debate: new DebatePattern(this.config),
      consensus: new ConsensusPattern(this.config)
    };
  }

  /**
   * Start a new conversation with specified pattern
   */
  async startConversation(conversationId, patternType, agents, initialMessage, options = {}) {
    const pattern = this.patterns[patternType];
    if (!pattern) {
      throw new Error(`Unknown conversation pattern: ${patternType}`);
    }

    const conversation = {
      id: conversationId,
      pattern: patternType,
      agents: agents,
      messages: [],
      context: {
        startTime: new Date(),
        currentRound: 0,
        maxRounds: options.maxRounds || this.config.maxRounds,
        status: 'active'
      },
      options: options
    };

    this.activeConversations.set(conversationId, conversation);
    
    // Initialize the conversation pattern
    await pattern.initialize(conversation, initialMessage);
    
    this.emit('conversationStarted', conversation);
    return conversation;
  }

  /**
   * Process next step in conversation
   */
  async processNextStep(conversationId, response) {
    const conversation = this.activeConversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }

    const pattern = this.patterns[conversation.pattern];
    const result = await pattern.processStep(conversation, response);
    
    this.emit('stepProcessed', { conversationId, result });
    
    if (result.completed) {
      conversation.context.status = 'completed';
      this.emit('conversationCompleted', conversation);
    }

    return result;
  }

  /**
   * Get conversation summary and insights
   */
  getConversationSummary(conversationId) {
    const conversation = this.activeConversations.get(conversationId);
    if (!conversation) {
      return null;
    }

    const pattern = this.patterns[conversation.pattern];
    return pattern.generateSummary(conversation);
  }
}

/**
 * Base class for conversation patterns
 */
class ConversationPattern {
  constructor(config) {
    this.config = config;
  }

  async initialize(conversation, initialMessage) {
    conversation.messages.push({
      type: 'system',
      content: initialMessage,
      timestamp: new Date(),
      metadata: { source: 'system', pattern: this.constructor.name }
    });
  }

  async processStep(conversation, response) {
    conversation.messages.push(response);
    conversation.context.currentRound++;
    
    return {
      nextAgent: this.selectNextAgent(conversation),
      completed: this.isCompleted(conversation),
      context: this.updateContext(conversation)
    };
  }

  selectNextAgent(conversation) {
    // Default implementation - override in subclasses
    return conversation.agents[0];
  }

  isCompleted(conversation) {
    // Check termination conditions
    const { maxRounds, currentRound } = conversation.context;
    
    if (currentRound >= maxRounds) {
      return true;
    }

    // Check for completion keywords in recent messages
    const recentMessages = conversation.messages.slice(-3);
    const completionKeywords = ['COMPLETE', 'FINISHED', 'DONE', 'SOLVED'];
    
    return recentMessages.some(msg => 
      completionKeywords.some(keyword => 
        msg.content?.toUpperCase().includes(keyword)
      )
    );
  }

  updateContext(conversation) {
    return {
      ...conversation.context,
      lastUpdate: new Date(),
      messageCount: conversation.messages.length
    };
  }

  generateSummary(conversation) {
    return {
      id: conversation.id,
      pattern: conversation.pattern,
      duration: new Date() - conversation.context.startTime,
      messageCount: conversation.messages.length,
      participants: conversation.agents.length,
      status: conversation.context.status
    };
  }
}

/**
 * Round Robin Pattern - Sequential agent responses
 */
class RoundRobinPattern extends ConversationPattern {
  constructor(config) {
    super(config);
    this.currentAgentIndex = 0;
  }

  async initialize(conversation, initialMessage) {
    await super.initialize(conversation, initialMessage);
    this.currentAgentIndex = 0;
  }

  selectNextAgent(conversation) {
    const agent = conversation.agents[this.currentAgentIndex];
    this.currentAgentIndex = (this.currentAgentIndex + 1) % conversation.agents.length;
    return agent;
  }
}

/**
 * Hierarchical Pattern - Manager-worker delegation
 */
class HierarchicalPattern extends ConversationPattern {
  constructor(config) {
    super(config);
    this.manager = null;
    this.workers = [];
    this.delegationQueue = [];
  }

  async initialize(conversation, initialMessage) {
    await super.initialize(conversation, initialMessage);
    
    // First agent is manager, rest are workers
    this.manager = conversation.agents[0];
    this.workers = conversation.agents.slice(1);
  }

  selectNextAgent(conversation) {
    // Manager coordinates and delegates
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    
    if (lastMessage?.metadata?.source === 'system' || 
        !lastMessage?.metadata?.source ||
        this.workers.includes(lastMessage.metadata.source)) {
      return this.manager;
    }
    
    // Manager delegates to workers based on capability matching
    return this.selectBestWorker(conversation, lastMessage);
  }

  selectBestWorker(conversation, context) {
    // Simple implementation - can be enhanced with capability matching
    if (this.delegationQueue.length === 0) {
      this.delegationQueue = [...this.workers];
    }
    
    return this.delegationQueue.shift();
  }
}

/**
 * Group Chat Pattern - Natural language coordination
 */
class GroupChatPattern extends ConversationPattern {
  constructor(config) {
    super(config);
    this.speakerSelection = 'natural'; // or 'round_robin'
  }

  selectNextAgent(conversation) {
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    
    // Look for explicit mentions of other agents
    const mentionedAgent = this.findMentionedAgent(conversation, lastMessage);
    if (mentionedAgent) {
      return mentionedAgent;
    }
    
    // Use capability-based selection
    return this.selectByCapability(conversation, lastMessage);
  }

  findMentionedAgent(conversation, message) {
    if (!message?.content) return null;
    
    const content = message.content.toLowerCase();
    return conversation.agents.find(agent => 
      content.includes(agent.name?.toLowerCase()) ||
      content.includes('@' + agent.name?.toLowerCase())
    );
  }

  selectByCapability(conversation, message) {
    // Analyze message content and select most relevant agent
    // This is a simplified implementation
    const words = message?.content?.toLowerCase().split(/\s+/) || [];
    
    let bestAgent = conversation.agents[0];
    let bestScore = 0;
    
    for (const agent of conversation.agents) {
      const capabilities = agent.capabilities || [];
      let score = 0;
      
      for (const capability of capabilities) {
        const capWords = capability.name?.toLowerCase().split(/[-_\s]+/) || [];
        score += words.filter(word => capWords.includes(word)).length;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
      }
    }
    
    return bestAgent;
  }
}

/**
 * Expert Panel Pattern - Domain-specific expertise coordination
 */
class ExpertPanelPattern extends ConversationPattern {
  constructor(config) {
    super(config);
    this.expertDomains = new Map();
  }

  async initialize(conversation, initialMessage) {
    await super.initialize(conversation, initialMessage);
    
    // Map agents to their domains of expertise
    for (const agent of conversation.agents) {
      const capabilities = agent.capabilities || [];
      const domains = capabilities.map(cap => cap.domain || 'general');
      this.expertDomains.set(agent.name, domains);
    }
  }

  selectNextAgent(conversation) {
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    const requiredExpertise = this.analyzeRequiredExpertise(lastMessage);
    
    // Select expert with best domain match
    let bestAgent = conversation.agents[0];
    let bestMatch = 0;
    
    for (const agent of conversation.agents) {
      const domains = this.expertDomains.get(agent.name) || [];
      const matches = requiredExpertise.filter(req => 
        domains.some(domain => domain.includes(req) || req.includes(domain))
      ).length;
      
      if (matches > bestMatch) {
        bestMatch = matches;
        bestAgent = agent;
      }
    }
    
    return bestAgent;
  }

  analyzeRequiredExpertise(message) {
    // Simple keyword-based expertise analysis
    const content = message?.content?.toLowerCase() || '';
    const expertiseKeywords = {
      'technical': ['code', 'programming', 'software', 'system', 'architecture'],
      'business': ['strategy', 'market', 'revenue', 'customer', 'business'],
      'security': ['security', 'auth', 'encryption', 'vulnerability', 'risk'],
      'data': ['data', 'analytics', 'database', 'query', 'analysis'],
      'ui': ['interface', 'user', 'design', 'frontend', 'experience']
    };
    
    const requiredExpertise = [];
    for (const [domain, keywords] of Object.entries(expertiseKeywords)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        requiredExpertise.push(domain);
      }
    }
    
    return requiredExpertise.length > 0 ? requiredExpertise : ['general'];
  }
}

/**
 * Debate Pattern - Structured argumentation
 */
class DebatePattern extends ConversationPattern {
  constructor(config) {
    super(config);
    this.positions = new Map();
    this.currentPhase = 'opening'; // opening, arguments, rebuttals, closing
  }

  async initialize(conversation, initialMessage) {
    await super.initialize(conversation, initialMessage);
    
    // Assign positions to agents (pro/con/neutral/moderator)
    conversation.agents.forEach((agent, index) => {
      const position = index % 2 === 0 ? 'pro' : 'con';
      this.positions.set(agent.name, position);
    });
  }

  selectNextAgent(conversation) {
    switch (this.currentPhase) {
      case 'opening':
        return this.selectForOpening(conversation);
      case 'arguments':
        return this.selectForArguments(conversation);
      case 'rebuttals':
        return this.selectForRebuttals(conversation);
      case 'closing':
        return this.selectForClosing(conversation);
      default:
        return conversation.agents[0];
    }
  }

  selectForOpening(conversation) {
    // Alternate between pro and con for opening statements
    const roundsInPhase = conversation.messages.filter(m => m.metadata?.phase === 'opening').length;
    return conversation.agents[roundsInPhase % conversation.agents.length];
  }

  selectForArguments(conversation) {
    // Allow natural back-and-forth argumentation
    const lastSpeaker = conversation.messages[conversation.messages.length - 1]?.metadata?.source;
    const position = this.positions.get(lastSpeaker);
    
    // Select agent with opposing position
    const opposingAgents = conversation.agents.filter(agent => 
      this.positions.get(agent.name) !== position
    );
    
    return opposingAgents[Math.floor(Math.random() * opposingAgents.length)];
  }

  selectForRebuttals(conversation) {
    return this.selectForArguments(conversation);
  }

  selectForClosing(conversation) {
    return this.selectForOpening(conversation);
  }
}

/**
 * Consensus Pattern - Collaborative agreement building
 */
class ConsensusPattern extends ConversationPattern {
  constructor(config) {
    super(config);
    this.proposals = [];
    this.votes = new Map();
    this.consensusThreshold = 0.8; // 80% agreement required
  }

  selectNextAgent(conversation) {
    // Rotate through all agents to gather input
    const participationCount = new Map();
    
    conversation.messages.forEach(msg => {
      const source = msg.metadata?.source;
      if (source && source !== 'system') {
        participationCount.set(source, (participationCount.get(source) || 0) + 1);
      }
    });
    
    // Select agent with least participation
    let leastParticipation = Infinity;
    let nextAgent = conversation.agents[0];
    
    for (const agent of conversation.agents) {
      const participation = participationCount.get(agent.name) || 0;
      if (participation < leastParticipation) {
        leastParticipation = participation;
        nextAgent = agent;
      }
    }
    
    return nextAgent;
  }

  isCompleted(conversation) {
    // Check if consensus has been reached
    const consensusIndicators = [
      'we agree', 'consensus reached', 'all agree', 'unanimous',
      'settled', 'concluded', 'agreement achieved'
    ];
    
    const recentMessages = conversation.messages.slice(-3);
    const hasConsensusIndicator = recentMessages.some(msg =>
      consensusIndicators.some(indicator =>
        msg.content?.toLowerCase().includes(indicator)
      )
    );
    
    return hasConsensusIndicator || super.isCompleted(conversation);
  }
}

export { ConversationPatterns, ConversationPattern };
export default ConversationPatterns;