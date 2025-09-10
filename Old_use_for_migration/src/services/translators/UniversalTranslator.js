/**
 * Universal Translator - Stub implementation for testing
 */

export class UniversalTranslator {
  constructor(config) {
    this.config = config;
  }

  async translateToOAAS(agent) {
    return {
      id: agent.id,
      name: agent.name,
      version: '1.0.0',
      capabilities: []
    };
  }
}