/**
 * Protocol Adapters for Multi-Framework Agent Communication
 * Handles translation between different agent frameworks
 */

export interface ProtocolAdapter {
  framework: string;
  translateIncoming(message: any): AgentCommunicationMessage;
  translateOutgoing(message: AgentCommunicationMessage): any;
  validateMessage(message: any): boolean;
}

export interface AgentCommunicationMessage {
  id: string;
  from: string;
  to: string;
  type: 'request' | 'response' | 'notification' | 'error';
  payload: any;
  timestamp: string;
  metadata?: any;
}

/**
 * MCP Protocol Adapter
 */
export class MCPProtocolAdapter implements ProtocolAdapter {
  framework = 'mcp';

  translateIncoming(mcpMessage: any): AgentCommunicationMessage {
    return {
      id: mcpMessage.id || `mcp-${Date.now()}`,
      from: mcpMessage.params?.from || 'mcp-agent',
      to: mcpMessage.params?.to || 'unknown',
      type: this.mapMCPMethod(mcpMessage.method),
      payload: mcpMessage.params?.payload || mcpMessage.params,
      timestamp: new Date().toISOString(),
      metadata: {
        framework: 'mcp',
        jsonrpc: mcpMessage.jsonrpc,
        original_method: mcpMessage.method
      }
    };
  }

  translateOutgoing(message: AgentCommunicationMessage): any {
    return {
      jsonrpc: '2.0',
      id: message.id,
      method: this.mapTypeToMCPMethod(message.type),
      params: {
        from: message.from,
        to: message.to,
        payload: message.payload,
        metadata: message.metadata
      }
    };
  }

  validateMessage(message: any): boolean {
    return message.jsonrpc === '2.0' && 
           message.id && 
           message.method;
  }

  private mapMCPMethod(method: string): AgentCommunicationMessage['type'] {
    const methodMap: Record<string, AgentCommunicationMessage['type']> = {
      'agent/request': 'request',
      'agent/response': 'response',
      'agent/notify': 'notification',
      'agent/error': 'error'
    };
    return methodMap[method] || 'request';
  }

  private mapTypeToMCPMethod(type: AgentCommunicationMessage['type']): string {
    const typeMap: Record<AgentCommunicationMessage['type'], string> = {
      'request': 'agent/request',
      'response': 'agent/response',
      'notification': 'agent/notify',
      'error': 'agent/error'
    };
    return typeMap[type];
  }
}

/**
 * LangChain Protocol Adapter
 */
export class LangChainProtocolAdapter implements ProtocolAdapter {
  framework = 'langchain';

  translateIncoming(langchainMessage: any): AgentCommunicationMessage {
    return {
      id: langchainMessage.id || `lc-${Date.now()}`,
      from: langchainMessage.agent_id || 'langchain-agent',
      to: langchainMessage.target_agent || 'unknown',
      type: this.mapLangChainType(langchainMessage.message_type),
      payload: langchainMessage.content || langchainMessage.data,
      timestamp: langchainMessage.timestamp || new Date().toISOString(),
      metadata: {
        framework: 'langchain',
        chain_type: langchainMessage.chain_type,
        tools_used: langchainMessage.tools_used
      }
    };
  }

  translateOutgoing(message: AgentCommunicationMessage): any {
    return {
      id: message.id,
      agent_id: message.from,
      target_agent: message.to,
      message_type: message.type,
      content: message.payload,
      timestamp: message.timestamp,
      metadata: message.metadata
    };
  }

  validateMessage(message: any): boolean {
    return message.agent_id && 
           message.content !== undefined &&
           message.message_type;
  }

  private mapLangChainType(type: string): AgentCommunicationMessage['type'] {
    const typeMap: Record<string, AgentCommunicationMessage['type']> = {
      'human': 'request',
      'ai': 'response',
      'system': 'notification',
      'error': 'error'
    };
    return typeMap[type] || 'request';
  }
}

/**
 * CrewAI Protocol Adapter
 */
export class CrewAIProtocolAdapter implements ProtocolAdapter {
  framework = 'crewai';

  translateIncoming(crewaiMessage: any): AgentCommunicationMessage {
    return {
      id: crewaiMessage.task_id || `crew-${Date.now()}`,
      from: crewaiMessage.agent || 'crewai-agent',
      to: crewaiMessage.target || 'crew',
      type: this.mapCrewAIType(crewaiMessage.type),
      payload: {
        description: crewaiMessage.description,
        context: crewaiMessage.context,
        tools: crewaiMessage.tools
      },
      timestamp: new Date().toISOString(),
      metadata: {
        framework: 'crewai',
        crew_id: crewaiMessage.crew_id,
        priority: crewaiMessage.priority
      }
    };
  }

  translateOutgoing(message: AgentCommunicationMessage): any {
    return {
      task_id: message.id,
      agent: message.from,
      target: message.to,
      type: message.type,
      description: typeof message.payload === 'string' 
        ? message.payload 
        : JSON.stringify(message.payload),
      context: message.metadata?.context || {},
      timestamp: message.timestamp
    };
  }

  validateMessage(message: any): boolean {
    return message.agent && 
           message.description &&
           message.type;
  }

  private mapCrewAIType(type: string): AgentCommunicationMessage['type'] {
    const typeMap: Record<string, AgentCommunicationMessage['type']> = {
      'task': 'request',
      'result': 'response',
      'delegation': 'notification',
      'error': 'error'
    };
    return typeMap[type] || 'request';
  }
}

/**
 * OpenAI Protocol Adapter
 */
export class OpenAIProtocolAdapter implements ProtocolAdapter {
  framework = 'openai';

  translateIncoming(openaiMessage: any): AgentCommunicationMessage {
    const content = typeof openaiMessage.content === 'string' 
      ? JSON.parse(openaiMessage.content) 
      : openaiMessage.content;

    return {
      id: openaiMessage.id || openaiMessage.metadata?.message_id || `oai-${Date.now()}`,
      from: content.from || 'openai-assistant',
      to: content.to || 'user',
      type: this.mapOpenAIRole(openaiMessage.role),
      payload: content.payload || content,
      timestamp: new Date().toISOString(),
      metadata: {
        framework: 'openai',
        model: openaiMessage.model,
        role: openaiMessage.role,
        thread_id: openaiMessage.thread_id
      }
    };
  }

  translateOutgoing(message: AgentCommunicationMessage): any {
    return {
      role: this.mapTypeToOpenAIRole(message.type),
      content: JSON.stringify({
        from: message.from,
        to: message.to,
        payload: message.payload,
        metadata: message.metadata
      }),
      metadata: {
        message_id: message.id,
        agent_communication: true
      }
    };
  }

  validateMessage(message: any): boolean {
    return message.role && 
           message.content !== undefined;
  }

  private mapOpenAIRole(role: string): AgentCommunicationMessage['type'] {
    const roleMap: Record<string, AgentCommunicationMessage['type']> = {
      'user': 'request',
      'assistant': 'response',
      'system': 'notification',
      'function': 'response'
    };
    return roleMap[role] || 'request';
  }

  private mapTypeToOpenAIRole(type: AgentCommunicationMessage['type']): string {
    const typeMap: Record<AgentCommunicationMessage['type'], string> = {
      'request': 'user',
      'response': 'assistant',
      'notification': 'system',
      'error': 'system'
    };
    return typeMap[type];
  }
}

/**
 * Anthropic Protocol Adapter
 */
export class AnthropicProtocolAdapter implements ProtocolAdapter {
  framework = 'anthropic';

  translateIncoming(anthropicMessage: any): AgentCommunicationMessage {
    const lastMessage = anthropicMessage.messages?.[anthropicMessage.messages.length - 1];
    const content = typeof lastMessage?.content === 'string' 
      ? JSON.parse(lastMessage.content) 
      : lastMessage?.content;

    return {
      id: anthropicMessage.id || `claude-${Date.now()}`,
      from: content?.from || 'claude-agent',
      to: content?.to || 'user',
      type: this.mapAnthropicRole(lastMessage?.role),
      payload: content?.payload || content,
      timestamp: new Date().toISOString(),
      metadata: {
        framework: 'anthropic',
        model: anthropicMessage.model,
        usage: anthropicMessage.usage
      }
    };
  }

  translateOutgoing(message: AgentCommunicationMessage): any {
    return {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{
        role: this.mapTypeToAnthropicRole(message.type),
        content: JSON.stringify({
          agent_communication: true,
          from: message.from,
          to: message.to,
          payload: message.payload,
          metadata: message.metadata
        })
      }]
    };
  }

  validateMessage(message: any): boolean {
    return message.messages && 
           Array.isArray(message.messages) &&
           message.messages.length > 0;
  }

  private mapAnthropicRole(role: string): AgentCommunicationMessage['type'] {
    const roleMap: Record<string, AgentCommunicationMessage['type']> = {
      'user': 'request',
      'assistant': 'response',
      'system': 'notification'
    };
    return roleMap[role] || 'request';
  }

  private mapTypeToAnthropicRole(type: AgentCommunicationMessage['type']): string {
    const typeMap: Record<AgentCommunicationMessage['type'], string> = {
      'request': 'user',
      'response': 'assistant',
      'notification': 'user',
      'error': 'user'
    };
    return typeMap[type];
  }
}

/**
 * Protocol Adapter Factory
 */
export class ProtocolAdapterFactory {
  private adapters: Map<string, ProtocolAdapter> = new Map();

  constructor() {
    this.registerAdapter(new MCPProtocolAdapter());
    this.registerAdapter(new LangChainProtocolAdapter());
    this.registerAdapter(new CrewAIProtocolAdapter());
    this.registerAdapter(new OpenAIProtocolAdapter());
    this.registerAdapter(new AnthropicProtocolAdapter());
  }

  registerAdapter(adapter: ProtocolAdapter): void {
    this.adapters.set(adapter.framework, adapter);
  }

  getAdapter(framework: string): ProtocolAdapter | undefined {
    return this.adapters.get(framework);
  }

  getSupportedFrameworks(): string[] {
    return Array.from(this.adapters.keys());
  }

  translateMessage(message: any, fromFramework: string, toFramework: string): any {
    const fromAdapter = this.getAdapter(fromFramework);
    const toAdapter = this.getAdapter(toFramework);

    if (!fromAdapter || !toAdapter) {
      throw new Error(`Adapter not found for framework: ${fromFramework} -> ${toFramework}`);
    }

    const standardMessage = fromAdapter.translateIncoming(message);
    return toAdapter.translateOutgoing(standardMessage);
  }
}