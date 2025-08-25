const ComplianceValidator = require('../../validators/compliance-validator');

class ComplianceValidatorService {
  constructor() {
    this.validator = new ComplianceValidator();
  }

  async validateCompliance(configuration, frameworks) {
    try {
      // Determine frameworks to validate
      const targetFrameworks = frameworks || this.getConfigFrameworks(configuration);
      
      if (targetFrameworks.length === 0) {
        return {
          framework_results: {},
          totalPassed: 0,
          totalWarnings: 1,
          totalErrors: 0,
          authorization_readiness: 'development'
        };
      }

      // Reset validator state
      this.validator.errors = [];
      this.validator.warnings = [];
      this.validator.passed = [];

      const frameworkResults = {};

      // Validate each framework
      targetFrameworks.forEach(frameworkId => {
        const framework = this.validator.frameworks[frameworkId];
        if (!framework) {
          frameworkResults[frameworkId] = {
            valid: false,
            errors: [`Unknown framework: ${frameworkId}`],
            warnings: [],
            passed: []
          };
          return;
        }

        const frameworkErrors = [];
        const frameworkWarnings = [];
        const frameworkPassed = [];

        framework.requirements.forEach(req => {
          const result = req.validator(configuration);
          if (result.passed) {
            frameworkPassed.push(req.name);
          } else if (result.warning) {
            frameworkWarnings.push(`${req.name} - ${result.message}`);
          } else {
            frameworkErrors.push(`${req.name} - ${result.message}`);
          }
        });

        frameworkResults[frameworkId] = {
          valid: frameworkErrors.length === 0,
          name: framework.name,
          errors: frameworkErrors,
          warnings: frameworkWarnings,
          passed: frameworkPassed
        };
      });

      // Calculate totals
      const totalPassed = Object.values(frameworkResults)
        .reduce((sum, result) => sum + result.passed.length, 0);
      const totalWarnings = Object.values(frameworkResults)
        .reduce((sum, result) => sum + result.warnings.length, 0);
      const totalErrors = Object.values(frameworkResults)
        .reduce((sum, result) => sum + result.errors.length, 0);

      // Determine authorization readiness
      let authorizationReadiness = 'development';
      if (totalErrors === 0) {
        if (totalWarnings === 0) {
          authorizationReadiness = 'production-ready';
        } else if (totalWarnings <= 2) {
          authorizationReadiness = 'pre-production';
        }
      }

      return {
        framework_results: frameworkResults,
        totalPassed,
        totalWarnings,
        totalErrors,
        authorization_readiness: authorizationReadiness
      };

    } catch (error) {
      throw new Error(`Compliance validation failed: ${error.message}`);
    }
  }

  getConfigFrameworks(configuration) {
    const frameworks = [];
    
    if (configuration.compliance && configuration.compliance.frameworks) {
      configuration.compliance.frameworks.forEach(fw => {
        const framework = fw.framework || fw;
        if (this.validator.frameworks[framework]) {
          frameworks.push(framework);
        }
      });
    }
    
    return frameworks;
  }
}

module.exports = ComplianceValidatorService;