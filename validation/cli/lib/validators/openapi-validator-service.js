const OpenAPIAgentValidator = require('./openapi-validator');

class OpenAPIValidatorService {
  constructor() {
    this.validator = new OpenAPIAgentValidator();
  }

  async validateSpecification(specification) {
    // Reset validator state
    this.validator.errors = [];
    this.validator.warnings = [];
    this.validator.passed = [];

    try {
      // Run all validations
      this.validator.validateVersion(specification);
      this.validator.validateMetadata(specification);
      this.validator.validateTokenManagement(specification);
      this.validator.validateProtocolSupport(specification);
      this.validator.validatePaths(specification);
      this.validator.validateSecurity(specification);
      this.validator.validateCompliance(specification);

      // Determine certification level based on validation results
      let certificationLevel = 'bronze';
      if (this.validator.errors.length === 0) {
        certificationLevel = this.validator.warnings.length === 0 ? 'gold' : 'silver';
      }

      return {
        valid: this.validator.errors.length === 0,
        certification_level: certificationLevel,
        passed: this.validator.passed,
        warnings: this.validator.warnings,
        errors: this.validator.errors
      };

    } catch (error) {
      throw new Error(`OpenAPI validation failed: ${error.message}`);
    }
  }
}

module.exports = OpenAPIValidatorService;