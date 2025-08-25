class AgentConfigValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = [];
  }

  async validateConfiguration(config) {
    this.errors = [];
    this.warnings = [];
    this.passed = [];

    try {
      this.validateBasicStructure(config);
      this.validateProtocols(config);
      this.validateCapabilities(config);
      this.validateTokenLimits(config);
      this.validateSecurity(config);

      return {
        valid: this.errors.length === 0,
        passed: this.passed,
        warnings: this.warnings,
        errors: this.errors
      };
    } catch (error) {
      throw new Error(`Agent config validation failed: ${error.message}`);
    }
  }

  validateBasicStructure(config) {
    if (!config.name) {
      this.errors.push('Agent name is required');
    } else {
      this.passed.push('✅ Agent name defined');
    }

    if (!config.version) {
      this.warnings.push('Agent version not specified');
    } else {
      this.passed.push('✅ Agent version defined');
    }

    if (!config.description) {
      this.warnings.push('Agent description not provided');
    } else {
      this.passed.push('✅ Agent description provided');
    }
  }

  validateProtocols(config) {
    if (!config.protocols || config.protocols.length === 0) {
      this.errors.push('At least one protocol must be specified');
    } else {
      const validProtocols = ['mcp', 'openapi', 'a2a', 'aitp'];
      const invalidProtocols = config.protocols.filter(p => !validProtocols.includes(p));
      
      if (invalidProtocols.length > 0) {
        this.errors.push(`Invalid protocols: ${invalidProtocols.join(', ')}`);
      } else {
        this.passed.push(`✅ Valid protocols: ${config.protocols.join(', ')}`);
      }
    }
  }

  validateCapabilities(config) {
    if (!config.capabilities || config.capabilities.length === 0) {
      this.warnings.push('No capabilities defined');
    } else {
      this.passed.push(`✅ Capabilities defined: ${config.capabilities.join(', ')}`);
    }
  }

  validateTokenLimits(config) {
    if (config.token_limits) {
      if (config.token_limits.max_tokens && config.token_limits.max_tokens > 0) {
        this.passed.push('✅ Token limits configured');
      } else {
        this.warnings.push('Token limits should be positive numbers');
      }
    } else {
      this.warnings.push('No token limits specified');
    }
  }

  validateSecurity(config) {
    if (!config.security) {
      this.warnings.push('No security configuration provided');
    } else {
      if (config.security.authentication) {
        this.passed.push('✅ Authentication configured');
      } else {
        this.warnings.push('Authentication not configured');
      }
    }
  }
}

module.exports = AgentConfigValidator;