/**
 * OAAS Validator - Stub implementation for testing
 */

export class OAASValidator {
  constructor(config) {
    this.config = config;
  }

  async validateMultiple(agents) {
    return {
      valid: true,
      agents: agents.length,
      errors: []
    };
  }
}