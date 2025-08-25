const OpenAPIValidator = require('../validators/openapi-validator');

describe('OpenAPI Validator', () => {
  test('should validate OpenAPI specification', () => {
    const validator = new OpenAPIValidator();
    expect(validator).toBeDefined();
    expect(typeof validator.validateSpecification).toBe('function');
  });

  test('should detect OpenAPI version', () => {
    const validator = new OpenAPIValidator();
    const spec = { openapi: '3.1.0', info: { title: 'Test', version: '1.0.0' } };
    
    validator.validateVersion(spec);
    expect(validator.passed).toContain('✅ OpenAPI version 3.1.x');
  });

  test('should detect missing security schemes', () => {
    const validator = new OpenAPIValidator();
    const spec = { openapi: '3.1.0', info: { title: 'Test', version: '1.0.0' } };
    
    validator.validateSecurity(spec);
    expect(validator.errors).toContain('No security schemes defined');
  });
});