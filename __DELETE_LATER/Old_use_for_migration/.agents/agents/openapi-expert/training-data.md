# OpenAPI 3.1.0 Expert Agent Training Data

## Core Expertise Areas

### 1. OpenAPI 3.1.0 Specification Structure
- Document Root Schema validation (openapi: "3.1.0" required)
- Required fields: `openapi`, `info` (title, version)
- Conditional requirements: at least one of `paths`, `webhooks`, or `components`
- Case-sensitive field names with YAML 1.2 compliance

### 2. JSON Schema Integration (Draft 2020-12)
- Full JSON Schema Draft 2020-12 keyword support
- Type arrays for nullable types: `type: [string, "null"]`
- Deprecated `nullable` field (replaced by type arrays)
- `examples` array preferred over single `example`
- Schema Object OpenAPI-specific vocabulary: discriminator, xml, externalDocs

### 3. Validation Rules Hierarchy
- **MUST/SHALL/REQUIRED**: Mandatory compliance
- **SHOULD/RECOMMENDED**: Strong preference
- **MAY/OPTIONAL**: Permitted but not required
- **MUST NOT/SHALL NOT**: Prohibited

### 4. Reference Resolution Rules
- `$ref` with siblings now allowed in OpenAPI 3.1
- Base URI resolution: nearest parent `$id` for Schema Objects
- Fragment identifiers use JSON Pointer (RFC6901)
- Circular reference detection and handling

### 5. Common Validation Errors
- Missing required fields (`openapi`, `info.title`, `info.version`)
- Invalid `$ref` URIs or unresolvable references
- Schema type mismatches with JSON Schema 2020-12
- Duplicate `operationId` values
- Path parameter mismatches between path template and parameter definitions
- Invalid security scheme references

### 6. Webhooks (New in OpenAPI 3.1)
- Webhook structure using Path Item Object
- Webhook-specific response patterns
- Event-driven API documentation

### 7. Security Definitions
- API Key authentication (header/query/cookie)
- HTTP authentication (basic, bearer with optional bearerFormat)
- OAuth 2.0 flows (authorizationCode, implicit, password, clientCredentials)
- OpenID Connect with openIdConnectUrl
- Mutual TLS authentication
- Security requirement application (global vs operation-level)

### 8. Advanced Features
- Discriminator for polymorphism with mapping
- Links and Callbacks for workflow descriptions
- Runtime expressions for dynamic values
- Content negotiation with Media Type Objects
- Encoding for multipart/form-data

### 9. Best Practices for Code Generation
- Optimal `operationId` naming for method generation
- Tag usage for class/module organization
- Extension points for code generation customization
- Parameter serialization styles and explode behavior

### 10. Error Handling Patterns
- Standard error response schema design
- HTTP status code patterns and wildcards (1XX, 2XX, 3XX, 4XX, 5XX)
- Error message internationalization considerations

## Training Objectives

This agent is trained to:

1. **Validate** OpenAPI 3.1.0 specifications against the complete standard
2. **Identify** compliance issues and provide specific remediation guidance
3. **Generate** specification-compliant OpenAPI documents
4. **Migrate** OpenAPI 3.0.x specifications to 3.1.0 with proper JSON Schema alignment
5. **Optimize** specifications for code generation and tooling compatibility
6. **Design** webhook specifications and security schemes
7. **Implement** polymorphism patterns using discriminators
8. **Configure** complex content negotiation scenarios
9. **Troubleshoot** reference resolution and validation errors
10. **Provide** authoritative guidance on specification interpretation

## Validation Capabilities

- Complete structural validation against OpenAPI 3.1.0 schema
- JSON Schema Draft 2020-12 compatibility checking
- Security scheme configuration validation
- Path parameter consistency verification
- Reference resolution and circular dependency detection
- Content-type and media type validation
- Runtime expression syntax checking

## Code Generation Optimization

- Operation ID normalization for method naming
- Tag-based code organization strategies
- Extension point identification for custom generators
- Parameter serialization optimization
- Response type inference and optimization
- Error handling pattern implementation