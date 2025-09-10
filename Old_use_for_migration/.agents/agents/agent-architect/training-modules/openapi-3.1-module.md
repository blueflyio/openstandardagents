# OpenAPI 3.1 Training Module

## Core Specifications

### JSON Schema Draft 2020-12 Compatibility
- Full support for prefixItems, unevaluatedItems, unevaluatedProperties
- Dynamic references with $dynamicRef and $dynamicAnchor
- Vocabulary-based validation with $vocabulary
- Meta-schema validation improvements

### Breaking Changes from OpenAPI 3.0
- `nullable` property replaced with `type: [string, "null"]` arrays
- Webhooks defined at root level alongside paths
- Info object supports `summary` field
- PathItem objects support `$ref`
- Discriminator property names must exist in schema

### Advanced Features
```yaml
# Webhook definitions at root level
webhooks:
  newPet:
    post:
      requestBody:
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/Pet"
      responses:
        '200':
          description: Return a 200 status to indicate success

# Type arrays instead of nullable
components:
  schemas:
    Pet:
      type: object
      properties:
        name:
          type: [string, "null"]  # replaces nullable: true
        status:
          type: string
          enum: [available, pending, sold]
```

## Implementation Patterns

### Design-First Approach
1. Define OpenAPI specification first
2. Generate server stubs and client SDKs
3. Implement business logic in generated stubs
4. Validate implementation against specification

### Security Schemes
```yaml
components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
    OAuth2:
      type: oauth2
      flows:
        authorizationCode:
          authorizationUrl: https://example.com/oauth/authorize
          tokenUrl: https://example.com/oauth/token
          scopes:
            read: Grants read access
            write: Grants write access
    OpenID:
      type: openIdConnect
      openIdConnectUrl: https://example.com/.well-known/openapi-configuration
    MutualTLS:
      type: mutualTLS
```

### Runtime Expressions
```yaml
# For callbacks and links
callbacks:
  myWebhook:
    '{$request.body#/callbackUrl}':
      post:
        requestBody:
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Payment completed"

links:
  UserRepositories:
    operationRef: '#/paths/~1repositories~1{username}/get'
    parameters:
      username: '$response.body#/login'
```

## GitLab Integration Patterns

### CI/CD Validation Pipeline
```yaml
validate-openapi:
  stage: validate
  script:
    - npx @stoplight/spectral lint api/openapi.yaml --ruleset .spectral.yaml
    - openapi-generator-cli validate -i api/openapi.yaml
    - swagger-codegen-cli validate -i api/openapi.yaml

generate-docs:
  stage: build
  script:
    - redocly build-docs api/openapi.yaml --output public/api-docs.html
    - swagger-ui-cli -f api/openapi.yaml -d public/swagger-ui

test-contracts:
  stage: test
  script:
    - dredd api/openapi.yaml http://localhost:3000
    - newman run tests/api-contract-tests.json --env-var baseUrl=http://localhost:3000
```

### Automated Documentation
```yaml
pages:
  stage: deploy
  dependencies:
    - generate-docs
  script:
    - mkdir public
    - cp -r api-docs/* public/
  artifacts:
    paths:
      - public
  only:
    - main
```

## Validation Rules

### Spectral Linting Configuration
```yaml
# .spectral.yaml
extends: ["@stoplight/spectral/rulesets/oas"]
rules:
  oas3-api-servers: error
  oas3-examples-value-or-externalValue: error
  oas3-server-not-example.com: error
  oas3-valid-media-type: error
  oas3-schema: error
  openapi-tags: error
  operation-description: error
  operation-operationId: error
  operation-summary: error
  operation-tags: error
  path-params: error
  typed-enum: error
```

## Best Practices

### Component Reusability
```yaml
components:
  schemas:
    Error:
      type: object
      required: [code, message]
      properties:
        code:
          type: integer
          format: int32
        message:
          type: string
    PaginationMeta:
      type: object
      properties:
        page:
          type: integer
          minimum: 1
        per_page:
          type: integer
          minimum: 1
          maximum: 100
        total:
          type: integer
        total_pages:
          type: integer

  responses:
    BadRequest:
      description: Bad request
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    Unauthorized:
      description: Unauthorized
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'

  parameters:
    PageParam:
      name: page
      in: query
      schema:
        type: integer
        minimum: 1
        default: 1
    PerPageParam:
      name: per_page
      in: query
      schema:
        type: integer
        minimum: 1
        maximum: 100
        default: 20
```

### Polymorphism and Discriminators
```yaml
components:
  schemas:
    Pet:
      type: object
      discriminator:
        propertyName: petType
        mapping:
          cat: '#/components/schemas/Cat'
          dog: '#/components/schemas/Dog'
      required:
        - name
        - petType
      properties:
        name:
          type: string
        petType:
          type: string

    Cat:
      allOf:
        - $ref: '#/components/schemas/Pet'
        - type: object
          properties:
            huntingSkill:
              type: string
              enum: [clueless, lazy, adventurous, aggressive]

    Dog:
      allOf:
        - $ref: '#/components/schemas/Pet'
        - type: object
          properties:
            packSize:
              type: integer
              format: int32
              minimum: 0
```