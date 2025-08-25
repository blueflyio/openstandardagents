const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

class OpenAPIAgentValidator {
  constructor() {
    this.ajv = new Ajv({ allErrors: true, verbose: true });
    addFormats(this.ajv);
    this.errors = [];
    this.warnings = [];
    this.passed = [];
  }

  validateVersion(specification) {
    if (specification.openapi && specification.openapi.startsWith('3.1')) {
      this.passed.push('✅ OpenAPI version 3.1.x');
    } else {
      this.errors.push('❌ Must use OpenAPI 3.1.x specification format');
    }
  }

  validateMetadata(specification) {
    const info = specification.info || {};
    
    if (!info['x-openapi-ai-agents-standard']) {
      this.warnings.push('Missing x-openapi-ai-agents-standard extension');
    } else {
      this.passed.push('✅ OpenAPI AI Agents Standard metadata present');
    }

    if (!info['x-agent-metadata']) {
      this.warnings.push('Missing x-agent-metadata extension');
    } else {
      this.passed.push('✅ Agent metadata extension present');
    }
  }

  validateTokenManagement(specification) {
    const info = specification.info || {};
    
    if (!info['x-token-management']) {
      this.warnings.push('Missing x-token-management extension (required for cost optimization)');
    } else {
      this.passed.push('✅ Token management extension present');
    }
  }

  validateProtocolSupport(specification) {
    const info = specification.info || {};
    const agentMeta = info['x-agent-metadata'] || {};
    
    if (!agentMeta.protocols || agentMeta.protocols.length === 0) {
      this.warnings.push('No protocol bridges configured (limits interoperability)');
    } else {
      this.passed.push(`✅ Protocols configured: ${agentMeta.protocols.join(', ')}`);
    }
  }

  validatePaths(specification) {
    if (!specification.paths || Object.keys(specification.paths).length === 0) {
      this.errors.push('No API paths defined');
    } else {
      this.passed.push(`✅ API paths defined: ${Object.keys(specification.paths).length} endpoints`);
    }
  }

  validateSecurity(specification) {
    if (!specification.components || !specification.components.securitySchemes) {
      this.errors.push('No security schemes defined');
    } else {
      this.passed.push('✅ Security schemes defined');
    }
  }

  validateCompliance(specification) {
    const info = specification.info || {};
    const agentMeta = info['x-agent-metadata'] || {};
    
    if (!agentMeta.compliance || agentMeta.compliance.length === 0) {
      this.warnings.push('No compliance frameworks specified');
    } else {
      this.passed.push(`✅ Compliance frameworks: ${agentMeta.compliance.join(', ')}`);
    }
  }

  /**
   * Main validation method that orchestrates all validation checks
   * @param {Object} specification - OpenAPI specification to validate
   * @returns {Object} Validation result with errors, warnings, and passed checks
   */
  async validateSpecification(specification) {
    // Reset validation state
    this.errors = [];
    this.warnings = [];
    this.passed = [];

    try {
      // Run all validation checks
      this.validateVersion(specification);
      this.validateMetadata(specification);
      this.validateTokenManagement(specification);
      this.validateProtocolSupport(specification);
      this.validatePaths(specification);
      this.validateSecurity(specification);
      this.validateCompliance(specification);

      // Determine certification level based on validation results
      let certification_level = 'bronze';
      if (this.errors.length === 0) {
        if (this.warnings.length === 0) {
          certification_level = 'platinum';
        } else if (this.warnings.length <= 2) {
          certification_level = 'gold';
        } else {
          certification_level = 'silver';
        }
      }

      return {
        errors: this.errors,
        warnings: this.warnings,
        passed: this.passed,
        certification_level
      };
    } catch (error) {
      return {
        errors: [`Validation error: ${error.message}`],
        warnings: this.warnings,
        passed: this.passed,
        certification_level: 'bronze'
      };
    }
  }
}

module.exports = OpenAPIAgentValidator;