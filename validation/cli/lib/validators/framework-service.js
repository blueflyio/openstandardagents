class FrameworkService {
  constructor() {
    this.frameworks = {
      'NIST_AI_RMF_1_0': {
        id: 'NIST_AI_RMF_1_0',
        name: 'NIST AI Risk Management Framework 1.0',
        category: 'government',
        description: 'Comprehensive framework for managing AI risks in government systems',
        requirements: [
          'AI Risk Management Documentation',
          'Model Governance',
          'Bias Assessment',
          'Transparency Requirements',
          'Human Oversight'
        ]
      },
      'ISO_42001_2023': {
        id: 'ISO_42001_2023',
        name: 'ISO/IEC 42001:2023 AI Management System',
        category: 'ai_standards',
        description: 'International standard for AI management systems',
        requirements: [
          'AI Management System',
          'AI Lifecycle Management',
          'Risk Management Process',
          'Data Quality Management'
        ]
      },
      'EU_AI_Act': {
        id: 'EU_AI_Act',
        name: 'European Union AI Act',
        category: 'ai_standards',
        description: 'EU regulation for AI systems classification and compliance',
        requirements: [
          'Risk Classification',
          'Conformity Assessment',
          'CE Marking Requirements',
          'Fundamental Rights Impact Assessment'
        ]
      },
      'FISMA': {
        id: 'FISMA',
        name: 'Federal Information Security Management Act',
        category: 'government',
        description: 'US federal framework for information security management',
        requirements: [
          'Security Categorization',
          'Security Controls',
          'Continuous Monitoring',
          'Plan of Action and Milestones (POA&M)'
        ]
      },
      'FedRAMP': {
        id: 'FedRAMP',
        name: 'Federal Risk and Authorization Management Program',
        category: 'government',
        description: 'US government cloud security authorization program',
        requirements: [
          'Authorization Boundary',
          'Impact Level',
          'Third Party Assessment',
          'Supply Chain Risk Management'
        ]
      },
      'StateRAMP': {
        id: 'StateRAMP',
        name: 'State Risk and Authorization Management Program',
        category: 'government',
        description: 'State-level cloud security authorization program',
        requirements: [
          'State Authority Approval',
          'Security Assessment',
          'Privacy Controls'
        ]
      }
    };

    this.protocols = {
      'openapi': {
        id: 'openapi',
        name: 'OpenAPI 3.1',
        description: 'REST API specification standard',
        category: 'api_standards',
        required_fields: ['paths', 'components'],
        optional_fields: ['security', 'servers']
      },
      'mcp': {
        id: 'mcp',
        name: 'Model Context Protocol',
        description: 'Protocol for AI model context management',
        category: 'ai_protocols',
        required_fields: ['tools', 'resources'],
        optional_fields: ['prompts', 'sampling']
      },
      'a2a': {
        id: 'a2a',
        name: 'Agent-to-Agent Protocol',
        description: 'Inter-agent communication protocol',
        category: 'ai_protocols',
        required_fields: ['capabilities', 'communication'],
        optional_fields: ['discovery', 'negotiation']
      },
      'aitp': {
        id: 'aitp',
        name: 'AI Tool Protocol',
        description: 'Protocol for AI tool integration',
        category: 'ai_protocols',
        required_fields: ['functions', 'schemas'],
        optional_fields: ['authentication', 'rate_limits']
      },
      'custom': {
        id: 'custom',
        name: 'Custom Protocol',
        description: 'User-defined protocol implementation',
        category: 'custom',
        required_fields: ['specification', 'implementation'],
        optional_fields: ['documentation', 'examples']
      }
    };
  }

  getAvailableFrameworks() {
    return Object.values(this.frameworks);
  }

  getSupportedProtocols() {
    return Object.values(this.protocols);
  }

  getFrameworkById(id) {
    return this.frameworks[id] || null;
  }

  getProtocolById(id) {
    return this.protocols[id] || null;
  }

  getFrameworksByCategory(category) {
    return Object.values(this.frameworks).filter(fw => fw.category === category);
  }

  getProtocolsByCategory(category) {
    return Object.values(this.protocols).filter(proto => proto.category === category);
  }
}

module.exports = FrameworkService;