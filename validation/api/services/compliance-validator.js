class ComplianceValidator {
  constructor() {
    this.supportedFrameworks = [
      'ISO_42001_2023', 'NIST_AI_RMF_1_0', 'EU_AI_Act', 
      'FISMA', 'FedRAMP', 'StateRAMP'
    ];
  }

  async validateCompliance(agentConfig, frameworks) {
    const results = {
      valid: true,
      authorization_readiness: 'basic',
      totalErrors: 0,
      totalWarnings: 0,
      framework_results: {}
    };

    for (const framework of frameworks) {
      if (!this.supportedFrameworks.includes(framework)) {
        results.totalErrors++;
        results.valid = false;
        results.framework_results[framework] = {
          valid: false,
          errors: [`Unsupported framework: ${framework}`],
          warnings: [],
          passed: []
        };
        continue;
      }

      const frameworkResult = this.validateFramework(agentConfig, framework);
      results.framework_results[framework] = frameworkResult;
      results.totalErrors += frameworkResult.errors?.length || 0;
      results.totalWarnings += frameworkResult.warnings?.length || 0;
      
      if (!frameworkResult.valid) {
        results.valid = false;
      }
    }

    // Set authorization readiness based on validation results
    if (results.valid && results.totalErrors === 0) {
      results.authorization_readiness = results.totalWarnings === 0 ? 'production' : 'staging';
    } else {
      results.authorization_readiness = 'development';
    }

    return results;
  }

  validateFramework(agentConfig, framework) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      passed: []
    };

    switch (framework) {
      case 'ISO_42001_2023':
        this.validateISO42001(agentConfig, result);
        break;
      case 'NIST_AI_RMF_1_0':
        this.validateNISTAIRMF(agentConfig, result);
        break;
      case 'EU_AI_Act':
        this.validateEUAIAct(agentConfig, result);
        break;
      default:
        result.warnings.push(`Basic validation for ${framework}`);
    }

    result.valid = result.errors.length === 0;
    return result;
  }

  validateISO42001(agentConfig, result) {
    if (!agentConfig.governance) {
      result.errors.push('ISO 42001 requires governance configuration');
    } else {
      result.passed.push('✅ Governance configuration present');
    }
    if (!agentConfig.risk_management) {
      result.errors.push('ISO 42001 requires risk management processes');
    } else {
      result.passed.push('✅ Risk management processes defined');
    }
    if (!agentConfig.data_quality) {
      result.warnings.push('Data quality management recommended for ISO 42001');
    } else {
      result.passed.push('✅ Data quality management configured');
    }
  }

  validateNISTAIRMF(agentConfig, result) {
    if (!agentConfig.risk_assessment && !agentConfig.risk_management) {
      result.errors.push('NIST AI RMF requires risk assessment or risk management');
    } else {
      result.passed.push('✅ Risk assessment/management implemented');
    }
    if (!agentConfig.bias_testing) {
      result.warnings.push('Bias assessment recommended for NIST AI RMF');
    } else {
      result.passed.push('✅ Bias testing configured');
    }
  }

  validateEUAIAct(agentConfig, result) {
    if (!agentConfig.risk_classification) {
      result.errors.push('EU AI Act requires risk classification');
    }
    if (!agentConfig.transparency) {
      result.warnings.push('Transparency measures recommended for EU AI Act');
    }
  }
}

module.exports = ComplianceValidator;