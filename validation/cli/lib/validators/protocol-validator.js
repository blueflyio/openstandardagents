const ProtocolValidator = require('../../validators/protocol-validator');

class ProtocolValidatorService {
  constructor() {
    this.validator = new ProtocolValidator();
  }

  async validateProtocols(configuration, protocols) {
    try {
      // Determine protocols to validate
      const targetProtocols = protocols || this.getConfigProtocols(configuration);
      
      if (targetProtocols.length === 0) {
        return {
          protocol_results: {},
          protocolsValidated: 0,
          totalPassed: 0,
          totalWarnings: 1,
          totalErrors: 0,
          interoperability_level: 'basic'
        };
      }

      // Reset validator state
      this.validator.errors = [];
      this.validator.warnings = [];
      this.validator.passed = [];

      const protocolResults = {};

      // Validate each protocol
      targetProtocols.forEach(protocolId => {
        const protocol = this.validator.protocols[protocolId];
        if (!protocol) {
          protocolResults[protocolId] = {
            enabled: false,
            valid: false,
            errors: [`Unknown protocol: ${protocolId}`],
            warnings: [],
            passed: []
          };
          return;
        }

        const protocolConfig = this.getProtocolConfig(configuration, protocolId);
        if (!protocolConfig) {
          protocolResults[protocolId] = {
            enabled: false,
            valid: false,
            errors: [`Configuration not found for protocol: ${protocolId}`],
            warnings: [],
            passed: []
          };
          return;
        }

        const protocolErrors = [];
        const protocolWarnings = [];
        const protocolPassed = [];

        // Check if protocol is enabled
        const isEnabled = protocolConfig.enabled !== false;
        
        if (isEnabled) {
          // Validate required fields
          protocol.required.forEach(field => {
            if (!protocolConfig[field] && !configuration[field]) {
              protocolErrors.push(`Missing required field '${field}'`);
            }
          });

          // Run protocol-specific validators
          protocol.validators.forEach(validator => {
            const result = validator(configuration, protocolConfig);
            if (result.passed) {
              protocolPassed.push(validator.name);
            } else if (result.warning) {
              protocolWarnings.push(`${validator.name} - ${result.message}`);
            } else {
              protocolErrors.push(`${validator.name} - ${result.message}`);
            }
          });
        }

        protocolResults[protocolId] = {
          enabled: isEnabled,
          valid: protocolErrors.length === 0,
          name: protocol.name,
          errors: protocolErrors,
          warnings: protocolWarnings,
          passed: protocolPassed
        };
      });

      // Validate interoperability if multiple protocols
      if (targetProtocols.length > 1) {
        this.validateInteroperability(configuration, targetProtocols, protocolResults);
      }

      // Calculate totals
      const totalPassed = Object.values(protocolResults)
        .reduce((sum, result) => sum + result.passed.length, 0);
      const totalWarnings = Object.values(protocolResults)
        .reduce((sum, result) => sum + result.warnings.length, 0);
      const totalErrors = Object.values(protocolResults)
        .reduce((sum, result) => sum + result.errors.length, 0);

      // Determine interoperability level
      let interoperabilityLevel = 'basic';
      if (totalErrors === 0) {
        if (totalWarnings === 0) {
          interoperabilityLevel = 'advanced';
        } else if (totalWarnings <= 2) {
          interoperabilityLevel = 'standard';
        }
      }

      return {
        protocol_results: protocolResults,
        protocolsValidated: targetProtocols.length,
        totalPassed,
        totalWarnings,
        totalErrors,
        interoperability_level: interoperabilityLevel
      };

    } catch (error) {
      throw new Error(`Protocol validation failed: ${error.message}`);
    }
  }

  getConfigProtocols(configuration) {
    const protocols = [];
    
    // From x-protocol-bridges
    if (configuration['x-protocol-bridges']) {
      Object.keys(configuration['x-protocol-bridges']).forEach(protocol => {
        if (this.validator.protocols[protocol]) {
          protocols.push(protocol);
        }
      });
    }
    
    // From protocol_bridges in agent config
    if (configuration.protocol_bridges) {
      Object.keys(configuration.protocol_bridges).forEach(protocol => {
        if (this.validator.protocols[protocol] && !protocols.includes(protocol)) {
          protocols.push(protocol);
        }
      });
    }
    
    return protocols;
  }

  getProtocolConfig(configuration, protocolId) {
    // Check x-protocol-bridges
    if (configuration['x-protocol-bridges'] && configuration['x-protocol-bridges'][protocolId]) {
      return configuration['x-protocol-bridges'][protocolId];
    }
    
    // Check protocol_bridges in agent config
    if (configuration.protocol_bridges && configuration.protocol_bridges[protocolId]) {
      return configuration.protocol_bridges[protocolId];
    }
    
    // For OpenAPI, the entire config is the protocol config
    if (protocolId === 'openapi') {
      return configuration;
    }
    
    return null;
  }

  validateInteroperability(configuration, protocols, protocolResults) {
    // Check for protocol adapters
    if (configuration.protocol_adapters) {
      // Add to all protocol results
      Object.keys(protocolResults).forEach(protocol => {
        protocolResults[protocol].passed.push('Protocol adapters configured');
      });
    } else if (protocols.length > 1) {
      Object.keys(protocolResults).forEach(protocol => {
        protocolResults[protocol].warnings.push('Multiple protocols without adapters may cause issues');
      });
    }
  }
}

module.exports = ProtocolValidatorService;