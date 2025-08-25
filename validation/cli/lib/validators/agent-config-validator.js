const AgentConfigValidator = require('../../validators/agent-config-validator');

class AgentConfigValidatorService {
  constructor() {
    this.validator = new AgentConfigValidator();
  }

  async validateConfiguration(configuration) {
    // Reset validator state
    this.validator.errors = [];
    this.validator.warnings = [];
    this.validator.passed = [];

    try {
      // Run all validations
      this.validator.validateMetadata(configuration);
      this.validator.validateClass(configuration);
      this.validator.validateCapabilities(configuration);
      this.validator.validateProtocols(configuration);
      this.validator.validateSecurity(configuration);
      this.validator.validateOrchestration(configuration);
      this.validator.validateCompliance(configuration);
      this.validator.validateTokenManagement(configuration);

      // Determine readiness level
      let readinessLevel = 'development';
      if (this.validator.errors.length === 0) {
        if (this.validator.warnings.length === 0) {
          readinessLevel = 'production';
        } else if (this.validator.warnings.length <= 3) {
          readinessLevel = 'staging';
        }
      }

      return {
        errors: this.validator.errors,
        warnings: this.validator.warnings,
        passed: this.validator.passed,
        readiness_level: readinessLevel
      };

    } catch (error) {
      throw new Error(`Agent config validation failed: ${error.message}`);
    }
  }
}

module.exports = AgentConfigValidatorService;