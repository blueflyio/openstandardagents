/**
 * Protocol Adapters - Stub implementation for testing
 */

export class ProtocolAdapterFactory {
  static create(protocol) {
    switch (protocol) {
      case 'mcp':
        return new MCPProtocolAdapter();
      case 'langchain':
        return new LangChainProtocolAdapter();
      case 'crewai':
        return new CrewAIProtocolAdapter();
      case 'openai':
        return new OpenAIProtocolAdapter();
      case 'anthropic':
        return new AnthropicProtocolAdapter();
      default:
        throw new Error(`Unsupported protocol: ${protocol}`);
    }
  }
}

export class MCPProtocolAdapter {
  constructor() {
    this.protocol = 'mcp';
  }
}

export class LangChainProtocolAdapter {
  constructor() {
    this.protocol = 'langchain';
  }
}

export class CrewAIProtocolAdapter {
  constructor() {
    this.protocol = 'crewai';
  }
}

export class OpenAIProtocolAdapter {
  constructor() {
    this.protocol = 'openai';
  }
}

export class AnthropicProtocolAdapter {
  constructor() {
    this.protocol = 'anthropic';
  }
}