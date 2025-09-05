/**
 * Agent-to-Agent Communication Bridge
 * Enables direct communication between agents regardless of framework
 */

export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  type: 'request' | 'response' | 'notification' | 'error';
  payload: any;
  timestamp: string;
  conversation_id?: string;
  metadata?: {
    framework: string;
    capability?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    timeout_ms?: number;
  };
}

export interface CommunicationChannel {
  id: string;
  participants: string[];
  type: 'direct' | 'broadcast' | 'multicast';
  protocol: 'http' | 'websocket' | 'pubsub' | 'queue';
  encryption?: boolean;
  compression?: boolean;
}

export interface AgentPeer {
  id: string;
  name: string;
  endpoint: string;
  framework: string;
  capabilities: string[];
  status: 'online' | 'offline' | 'busy';
  last_seen: string;
}

export class AgentCommunicationBridge {
  private peers: Map<string, AgentPeer> = new Map();
  private channels: Map<string, CommunicationChannel> = new Map();
  private messageHandlers: Map<string, Function> = new Map();
  private activeConversations: Map<string, AgentMessage[]> = new Map();

  constructor(private config: {
    agentId: string;
    endpoint: string;
    framework: string;
    enableEncryption?: boolean;
    messageTimeout?: number;
  }) {}

  /**
   * Register an agent for communication
   */
  async registerPeer(peer: AgentPeer): Promise<void> {
    this.peers.set(peer.id, peer);
    // Peer registration completed successfully
  }

  /**
   * Send message to another agent
   */
  async sendMessage(to: string, payload: any, type: AgentMessage['type'] = 'request'): Promise<AgentMessage> {
    const peer = this.peers.get(to);
    if (!peer) {
      throw new Error(`Peer ${to} not found`);
    }

    const message: AgentMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      from: this.config.agentId,
      to,
      type,
      payload,
      timestamp: new Date().toISOString(),
      conversation_id: `conv-${Date.now()}`,
      metadata: {
        framework: this.config.framework,
        timeout_ms: this.config.messageTimeout || 30000
      }
    };

    // Route message based on peer's framework
    await this.routeMessage(message, peer);
    
    return message;
  }

  /**
   * Route message to appropriate framework
   */
  private async routeMessage(message: AgentMessage, peer: AgentPeer): Promise<void> {
    switch (peer.framework) {
      case 'mcp':
        await this.sendToMCPAgent(message, peer);
        break;
      case 'langchain':
        await this.sendToLangChainAgent(message, peer);
        break;
      case 'crewai':
        await this.sendToCrewAIAgent(message, peer);
        break;
      case 'openai':
        await this.sendToOpenAIAgent(message, peer);
        break;
      case 'anthropic':
        await this.sendToAnthropicAgent(message, peer);
        break;
      case 'oaas':
        await this.sendToOAASAgent(message, peer);
        break;
      default:
        await this.sendToGenericAgent(message, peer);
    }
  }

  /**
   * Framework-specific message routing implementations
   */
  private async sendToMCPAgent(message: AgentMessage, peer: AgentPeer): Promise<void> {
    // MCP protocol translation
    const mcpMessage = {
      jsonrpc: '2.0',
      id: message.id,
      method: 'agent/communicate',
      params: {
        from: message.from,
        payload: message.payload,
        metadata: message.metadata
      }
    };

    await fetch(`${peer.endpoint}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mcpMessage)
    });
  }

  private async sendToLangChainAgent(message: AgentMessage, peer: AgentPeer): Promise<void> {
    // LangChain message format
    const langchainMessage = {
      agent_id: message.from,
      content: message.payload,
      message_type: message.type,
      metadata: message.metadata
    };

    await fetch(`${peer.endpoint}/langchain/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(langchainMessage)
    });
  }

  private async sendToCrewAIAgent(message: AgentMessage, peer: AgentPeer): Promise<void> {
    // CrewAI task format
    const crewaiTask = {
      description: JSON.stringify(message.payload),
      agent: peer.id,
      context: {
        from_agent: message.from,
        message_id: message.id,
        conversation_id: message.conversation_id
      }
    };

    await fetch(`${peer.endpoint}/crewai/task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(crewaiTask)
    });
  }

  private async sendToOpenAIAgent(message: AgentMessage, peer: AgentPeer): Promise<void> {
    // OpenAI Assistant format
    const openaiMessage = {
      role: 'user',
      content: JSON.stringify({
        from: message.from,
        payload: message.payload,
        metadata: message.metadata
      }),
      metadata: {
        agent_communication: true,
        message_id: message.id
      }
    };

    await fetch(`${peer.endpoint}/openai/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(openaiMessage)
    });
  }

  private async sendToAnthropicAgent(message: AgentMessage, peer: AgentPeer): Promise<void> {
    // Anthropic Claude format
    const anthropicMessage = {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: JSON.stringify({
          agent_communication: true,
          from: message.from,
          payload: message.payload,
          metadata: message.metadata
        })
      }]
    };

    await fetch(`${peer.endpoint}/anthropic/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(anthropicMessage)
    });
  }

  private async sendToOAASAgent(message: AgentMessage, peer: AgentPeer): Promise<void> {
    // Native OAAS communication
    await fetch(`${peer.endpoint}/api/v1/communicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
  }

  private async sendToGenericAgent(message: AgentMessage, peer: AgentPeer): Promise<void> {
    // Generic HTTP POST
    await fetch(`${peer.endpoint}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
  }

  /**
   * Handle incoming messages
   */
  onMessage(handler: (message: AgentMessage) => Promise<any>): void {
    this.messageHandlers.set('default', handler);
  }

  /**
   * Process incoming message
   */
  async processMessage(message: AgentMessage): Promise<any> {
    const handler = this.messageHandlers.get('default');
    if (handler) {
      return await handler(message);
    }
    throw new Error('No message handler registered');
  }

  /**
   * Create communication channel
   */
  async createChannel(participants: string[], type: CommunicationChannel['type'] = 'multicast'): Promise<string> {
    const channelId = `ch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const channel: CommunicationChannel = {
      id: channelId,
      participants,
      type,
      protocol: 'http',
      encryption: this.config.enableEncryption || false
    };

    this.channels.set(channelId, channel);
    return channelId;
  }

  /**
   * Broadcast message to channel
   */
  async broadcastToChannel(channelId: string, payload: any): Promise<void> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }

    const promises = channel.participants
      .filter(id => id !== this.config.agentId)
      .map(id => this.sendMessage(id, payload, 'notification'));

    await Promise.all(promises);
  }

  /**
   * Get agent status and capabilities
   */
  async discoverPeers(): Promise<AgentPeer[]> {
    // This would integrate with OAAS discovery service
    return Array.from(this.peers.values());
  }

  /**
   * Health check for communication system
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    peers_online: number;
    channels_active: number;
    last_message: string;
  }> {
    const onlinePeers = Array.from(this.peers.values())
      .filter(peer => peer.status === 'online').length;

    return {
      status: onlinePeers > 0 ? 'healthy' : 'degraded',
      peers_online: onlinePeers,
      channels_active: this.channels.size,
      last_message: new Date().toISOString()
    };
  }
}