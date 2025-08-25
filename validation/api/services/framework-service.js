class FrameworkService {
  constructor() {
    this.frameworks = [
      { id: 'NIST_AI_RMF_1_0', name: 'NIST AI Risk Management Framework 1.0', category: 'government' },
      { id: 'ISO_42001_2023', name: 'ISO/IEC 42001:2023 AI Management System', category: 'ai_standards' },
      { id: 'EU_AI_Act', name: 'European Union AI Act', category: 'ai_standards' }
    ];
    this.protocols = ['mcp', 'a2a', 'aitp', 'openapi'];
  }

  getFrameworks() {
    return this.frameworks.map(f => ({
      ...f,
      description: `Framework for ${f.category}`,
      requirements: ['Documentation', 'Risk Assessment', 'Monitoring']
    }));
  }

  getAvailableFrameworks() {
    return this.getFrameworks();
  }

  getSupportedProtocols() {
    return this.protocols.map(protocol => ({
      id: protocol,
      name: this.getProtocolName(protocol),
      required_fields: ['configuration', 'endpoints'],
      description: `${protocol.toUpperCase()} protocol support`,
      version: '1.0'
    }));
  }

  getProtocolName(protocol) {
    const names = {
      'mcp': 'Model Context Protocol',
      'openapi': 'OpenAPI 3.1',
      'a2a': 'Agent-to-Agent Protocol',
      'aitp': 'AI Transfer Protocol'
    };
    return names[protocol] || protocol.toUpperCase();
  }
}
module.exports = FrameworkService;
