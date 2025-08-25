class ProtocolValidator {
  constructor() {
    this.supportedProtocols = ['mcp', 'a2a', 'aitp', 'openapi'];
  }

  async validateProtocol(protocolConfig, protocolType) {
    const result = { valid: true, errors: [], warnings: [], passed: [] };
    
    if (!this.supportedProtocols.includes(protocolType)) {
      result.valid = false;
      result.errors.push(`Unsupported protocol: ${protocolType}`);
      return result;
    }

    result.passed.push(`✅ ${protocolType.toUpperCase()} protocol supported`);
    return result;
  }

  async validateProtocols(configuration, protocols) {
    const results = { valid: true, errors: [], warnings: [], passed: [], interoperability_level: 'basic' };
    
    if (!protocols || protocols.length === 0) {
      results.valid = false;
      results.errors.push('No protocols specified for validation');
      return results;
    }

    for (const protocolType of protocols) {
      const protocolResult = await this.validateProtocol(configuration, protocolType);
      results.errors.push(...protocolResult.errors);
      results.warnings.push(...protocolResult.warnings);
      results.passed.push(...protocolResult.passed);
      
      if (!protocolResult.valid) {
        results.valid = false;
      }
    }

    // Set interoperability level based on results
    if (results.valid && results.errors.length === 0) {
      results.interoperability_level = protocols.length >= 2 ? 'advanced' : 'basic';
    }

    return results;
  }
}
module.exports = ProtocolValidator;
