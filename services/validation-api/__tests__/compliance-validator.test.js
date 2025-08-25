const ComplianceValidator = require('../services/compliance-validator');

describe('ComplianceValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new ComplianceValidator();
  });

  describe('ISO 42001:2023 Validation', () => {
    test('should validate compliant ISO 42001 configuration', async () => {
      const agentConfig = {
        governance: {
          policies: ['AI Ethics Policy', 'Data Governance Policy', 'Risk Management Policy'],
          roles: ['AI Ethics Officer', 'Data Steward', 'Risk Manager'],
          accountability: 'Clear accountability framework established'
        },
        risk_management: {
          assessment: 'Comprehensive risk assessment methodology',
          mitigation: ['Risk mitigation strategy A', 'Risk mitigation strategy B'],
          monitoring: 'Continuous risk monitoring process'
        },
        data_quality: {
          validation: 'Data validation framework',
          cleansing: 'Data cleansing procedures',
          monitoring: 'Data quality monitoring'
        },
        monitoring: {
          metrics: ['Performance metrics', 'Quality metrics', 'Compliance metrics', 'Risk metrics', 'Audit metrics'],
          alerts: ['Performance alerts', 'Quality alerts', 'Compliance alerts'],
          reporting: 'Regular reporting framework'
        }
      };

      const result = await validator.validateCompliance(agentConfig, ['ISO_42001_2023']);
      
      expect(result.valid).toBe(true);
      expect(result.compliance_score).toBeGreaterThanOrEqual(90);
      expect(result.certification_level).toBe('gold');
      expect(result.framework_results.ISO_42001_2023.valid).toBe(true);
      expect(result.framework_results.ISO_42001_2023.score).toBeGreaterThanOrEqual(90);
    });

    test('should reject non-compliant ISO 42001 configuration', async () => {
      const agentConfig = {
        // Missing required governance section
        risk_management: {
          assessment: 'Basic risk assessment'
        }
      };

      const result = await validator.validateCompliance(agentConfig, ['ISO_42001_2023']);
      
      expect(result.valid).toBe(false);
      expect(result.compliance_score).toBeLessThan(70);
      expect(result.framework_results.ISO_42001_2023.valid).toBe(false);
      expect(result.framework_results.ISO_42001_2023.errors.length).toBeGreaterThan(0);
    });

    test('should provide warnings for suboptimal configurations', async () => {
      const agentConfig = {
        governance: {
          policies: ['AI Ethics Policy'], // Only 1 policy
          roles: ['AI Ethics Officer'],
          accountability: 'Accountability framework'
        },
        risk_management: {
          assessment: 'Risk assessment',
          mitigation: ['Risk mitigation'], // Only 1 strategy
          monitoring: 'Risk monitoring'
        },
        data_quality: {
          validation: 'Data validation',
          cleansing: 'Data cleansing',
          monitoring: 'Data monitoring'
        },
        monitoring: {
          metrics: ['Metric 1', 'Metric 2'], // Only 2 metrics
          alerts: ['Alert 1'],
          reporting: 'Reporting'
        }
      };

      const result = await validator.validateCompliance(agentConfig, ['ISO_42001_2023']);
      
      expect(result.valid).toBe(true);
      expect(result.framework_results.ISO_42001_2023.warnings.length).toBeGreaterThan(0);
      expect(result.framework_results.ISO_42001_2023.score).toBeLessThan(100);
    });
  });

  describe('NIST AI RMF 1.0 Validation', () => {
    test('should validate compliant NIST AI RMF configuration', async () => {
      const agentConfig = {
        govern: {
          policies: ['AI Governance Policy', 'Risk Management Policy'],
          roles: ['AI Governance Officer', 'Risk Manager'],
          oversight: 'Oversight framework'
        },
        map: {
          context: 'AI system context',
          risk_categories: ['Technical risks', 'Operational risks'],
          threat_analysis: 'Adversarial threat analysis included'
        },
        measure: {
          metrics: ['Performance metrics', 'Bias detection metrics'],
          baselines: 'Performance baselines',
          thresholds: 'Risk thresholds'
        },
        manage: {
          response_plan: 'Incident response plan with incident response procedures',
          communication: 'Communication plan',
          review: 'Regular review process'
        }
      };

      const result = await validator.validateCompliance(agentConfig, ['NIST_AI_RMF_1_0']);
      
      expect(result.valid).toBe(true);
      expect(result.framework_results.NIST_AI_RMF_1_0.valid).toBe(true);
      expect(result.framework_results.NIST_AI_RMF_1_0.score).toBeGreaterThanOrEqual(90);
    });

    test('should warn about missing recommended features', async () => {
      const agentConfig = {
        govern: {
          policies: ['AI Governance Policy'],
          roles: ['AI Governance Officer'],
          oversight: 'Oversight framework'
        },
        map: {
          context: 'AI system context',
          risk_categories: ['Technical risks'],
          threat_analysis: 'Basic threat analysis' // Missing adversarial
        },
        measure: {
          metrics: ['Performance metrics'], // Missing bias detection
          baselines: 'Performance baselines',
          thresholds: 'Risk thresholds'
        },
        manage: {
          response_plan: 'Response plan', // Missing incident response
          communication: 'Communication plan',
          review: 'Review process'
        }
      };

      const result = await validator.validateCompliance(agentConfig, ['NIST_AI_RMF_1_0']);
      
      expect(result.framework_results.NIST_AI_RMF_1_0.warnings.length).toBeGreaterThan(0);
      expect(result.framework_results.NIST_AI_RMF_1_0.score).toBeLessThan(100);
    });
  });

  describe('EU AI Act Validation', () => {
    test('should validate compliant EU AI Act configuration', async () => {
      const agentConfig = {
        risk_classification: 'limited',
        transparency: {
          documentation: 'Comprehensive documentation including training data',
          user_information: 'User information provided'
        },
        human_oversight: {
          human_in_loop: true,
          override_capability: true
        }
      };

      const result = await validator.validateCompliance(agentConfig, ['EU_AI_Act']);
      
      expect(result.valid).toBe(true);
      expect(result.framework_results.EU_AI_Act.valid).toBe(true);
    });

    test('should enforce human oversight for high-risk systems', async () => {
      const agentConfig = {
        risk_classification: 'high',
        transparency: {
          documentation: 'Documentation',
          user_information: 'User information'
        },
        human_oversight: {
          human_in_loop: false, // Missing for high-risk
          override_capability: true
        }
      };

      const result = await validator.validateCompliance(agentConfig, ['EU_AI_Act']);
      
      expect(result.valid).toBe(false);
      expect(result.framework_results.EU_AI_Act.errors.length).toBeGreaterThan(0);
    });

    test('should recommend training data documentation', async () => {
      const agentConfig = {
        risk_classification: 'limited',
        transparency: {
          documentation: 'Basic documentation', // Missing training data
          user_information: 'User information'
        },
        human_oversight: {
          human_in_loop: true,
          override_capability: true
        }
      };

      const result = await validator.validateCompliance(agentConfig, ['EU_AI_Act']);
      
      expect(result.framework_results.EU_AI_Act.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Multi-Framework Validation', () => {
    test('should validate multiple frameworks simultaneously', async () => {
      const agentConfig = {
        governance: {
          policies: ['AI Ethics Policy', 'Data Governance Policy', 'Risk Management Policy'],
          roles: ['AI Ethics Officer', 'Data Steward', 'Risk Manager'],
          accountability: 'Accountability framework'
        },
        risk_management: {
          assessment: 'Risk assessment',
          mitigation: ['Risk mitigation A', 'Risk mitigation B'],
          monitoring: 'Risk monitoring'
        },
        data_quality: {
          validation: 'Data validation',
          cleansing: 'Data cleansing',
          monitoring: 'Data monitoring'
        },
        monitoring: {
          metrics: ['Metric 1', 'Metric 2', 'Metric 3', 'Metric 4', 'Metric 5'],
          alerts: ['Alert 1', 'Alert 2'],
          reporting: 'Reporting'
        },
        govern: {
          policies: ['AI Governance Policy'],
          roles: ['AI Governance Officer'],
          oversight: 'Oversight framework'
        },
        map: {
          context: 'AI system context',
          risk_categories: ['Technical risks'],
          threat_analysis: 'Threat analysis'
        },
        measure: {
          metrics: ['Performance metrics'],
          baselines: 'Performance baselines',
          thresholds: 'Risk thresholds'
        },
        manage: {
          response_plan: 'Response plan',
          communication: 'Communication plan',
          review: 'Review process'
        },
        risk_classification: 'limited',
        transparency: {
          documentation: 'Documentation',
          user_information: 'User information'
        },
        human_oversight: {
          human_in_loop: true,
          override_capability: true
        }
      };

      const result = await validator.validateCompliance(agentConfig, [
        'ISO_42001_2023', 
        'NIST_AI_RMF_1_0', 
        'EU_AI_Act'
      ]);
      
      expect(result.valid).toBe(true);
      expect(result.compliance_score).toBeGreaterThan(80);
      expect(result.certification_level).toBe('gold');
      expect(Object.keys(result.framework_results)).toHaveLength(3);
    });

    test('should handle unsupported frameworks gracefully', async () => {
      const agentConfig = {
        governance: {
          policies: ['Policy 1'],
          roles: ['Role 1'],
          accountability: 'Accountability'
        }
      };

      const result = await validator.validateCompliance(agentConfig, [
        'ISO_42001_2023', 
        'UNSUPPORTED_FRAMEWORK'
      ]);
      
      expect(result.valid).toBe(false);
      expect(result.framework_results.UNSUPPORTED_FRAMEWORK.valid).toBe(false);
      expect(result.framework_results.UNSUPPORTED_FRAMEWORK.errors).toContain('Unsupported framework: UNSUPPORTED_FRAMEWORK');
    });
  });

  describe('Certification Level Determination', () => {
    test('should determine platinum certification for excellent compliance', async () => {
      const agentConfig = {
        governance: {
          policies: ['Policy 1', 'Policy 2', 'Policy 3'],
          roles: ['Role 1', 'Role 2', 'Role 3'],
          accountability: 'Accountability'
        },
        risk_management: {
          assessment: 'Assessment',
          mitigation: ['Mitigation 1', 'Mitigation 2'],
          monitoring: 'Monitoring'
        },
        data_quality: {
          validation: 'Validation',
          cleansing: 'Cleansing',
          monitoring: 'Monitoring'
        },
        monitoring: {
          metrics: ['Metric 1', 'Metric 2', 'Metric 3', 'Metric 4', 'Metric 5'],
          alerts: ['Alert 1', 'Alert 2', 'Alert 3'],
          reporting: 'Reporting'
        }
      };

      const result = await validator.validateCompliance(agentConfig, ['ISO_42001_2023']);
      
      expect(result.certification_level).toBe('platinum');
      expect(result.authorization_readiness).toBe('production');
    });

    test('should determine bronze certification for basic compliance', async () => {
      const agentConfig = {
        governance: {
          policies: ['Policy 1'],
          roles: ['Role 1'],
          accountability: 'Accountability'
        },
        risk_management: {
          assessment: 'Assessment',
          mitigation: ['Mitigation 1'],
          monitoring: 'Monitoring'
        },
        data_quality: {
          validation: 'Validation',
          cleansing: 'Cleansing',
          monitoring: 'Monitoring'
        },
        monitoring: {
          metrics: ['Metric 1', 'Metric 2'],
          alerts: ['Alert 1'],
          reporting: 'Reporting'
        }
      };

      const result = await validator.validateCompliance(agentConfig, ['ISO_42001_2023']);
      
      expect(result.certification_level).toBe('bronze');
      expect(result.authorization_readiness).toBe('development');
    });
  });

  describe('Next Steps Generation', () => {
    test('should generate appropriate next steps for improvement', async () => {
      const agentConfig = {
        governance: {
          policies: ['Policy 1'],
          roles: ['Role 1'],
          accountability: 'Accountability'
        }
      };

      const result = await validator.validateCompliance(agentConfig, ['ISO_42001_2023']);
      
      expect(result.next_steps.length).toBeGreaterThan(0);
      expect(result.next_steps).toContain('Fix all validation errors before proceeding');
    });

    test('should provide specific improvement guidance', async () => {
      const agentConfig = {
        governance: {
          policies: ['Policy 1', 'Policy 2'],
          roles: ['Role 1', 'Role 2'],
          accountability: 'Accountability'
        },
        risk_management: {
          assessment: 'Assessment',
          mitigation: ['Mitigation 1'],
          monitoring: 'Monitoring'
        },
        data_quality: {
          validation: 'Validation',
          cleansing: 'Cleansing',
          monitoring: 'Monitoring'
        },
        monitoring: {
          metrics: ['Metric 1', 'Metric 2', 'Metric 3'],
          alerts: ['Alert 1'],
          reporting: 'Reporting'
        }
      };

      const result = await validator.validateCompliance(agentConfig, ['ISO_42001_2023']);
      
      expect(result.next_steps).toContain('Address warnings to reach silver certification');
    });
  });

  describe('Error Handling', () => {
    test('should handle validation errors gracefully', async () => {
      const agentConfig = null; // Invalid config

      const result = await validator.validateCompliance(agentConfig, ['ISO_42001_2023']);
      
      expect(result.valid).toBe(false);
      expect(result.compliance_score).toBe(0);
      expect(result.framework_results.ISO_42001_2023.errors.length).toBeGreaterThan(0);
    });

    test('should provide detailed error information', async () => {
      const agentConfig = {
        // Missing required fields
        metadata: {
          name: 'test-agent'
        }
      };

      const result = await validator.validateCompliance(agentConfig, ['ISO_42001_2023']);
      
      expect(result.framework_results.ISO_42001_2023.errors.length).toBeGreaterThan(0);
      expect(result.framework_results.ISO_42001_2023.errors[0]).toContain('ISO 42001:');
    });
  });
});
