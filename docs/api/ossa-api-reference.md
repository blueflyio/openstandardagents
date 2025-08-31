# OpenAPI AI Agents Standard - API Reference

## Overview

The OpenAPI AI Agents Standard (OAAS) provides a comprehensive API for agent validation, compliance checking, and token estimation. This API integrates with TDDAI for enhanced development workflows.

## Base URL

```
http://localhost:3003/api/v1
```

## Authentication

All API requests require an API key in the header:

```bash
X-API-Key: your-api-key
```

For development, use: `dev-key`

## Endpoints

### Health Check

**GET** `/health`

Check the health status of the OAAS validation API.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-26T06:00:00Z",
  "version": "0.1.0",
  "uptime": 3600,
  "services": {
    "database": "connected",
    "storage": "available",
    "validation": "operational"
  },
  "metrics": {
    "requests_total": 150,
    "requests_successful": 145,
    "requests_failed": 5,
    "average_response_time_ms": 25
  }
}
```

### OpenAPI Validation

**POST** `/validate/openapi`

Validate an OpenAPI specification against the AI Agents Standard.

**Request Body:**
```json
{
  "spec": {
    "openapi": "3.1.0",
    "info": {
      "title": "My API",
      "version": "1.0.0"
    },
    "paths": {
      "/health": {
        "get": {
          "responses": {
            "200": {
              "description": "OK"
            }
          }
        }
      }
    }
  }
}
```

**Response:**
```json
{
  "valid": true,
  "errors": [],
  "warnings": [
    "API should have a description"
  ],
  "compliance": {
    "oaas_level": "bronze",
    "missing_features": [
      "schemas",
      "security_schemes"
    ],
    "recommendations": [
      "Add schemas to components for silver level",
      "Define security schemes for better compliance"
    ]
  },
  "metrics": {
    "endpoints_count": 1,
    "schemas_count": 0,
    "security_schemes_count": 0,
    "complexity_score": 2
  }
}
```

### Compliance Validation

**POST** `/validate/compliance`

Validate agent compliance with governance frameworks.

**Request Body:**
```json
{
  "agent": {
    "name": "my-agent",
    "version": "1.0.0",
    "governance": true,
    "monitoring": true,
    "risk_management": true,
    "documentation": true
  },
  "frameworks": ["iso-42001", "nist-ai-rmf", "eu-ai-act"]
}
```

**Response:**
```json
{
  "compliant": true,
  "frameworks": {
    "iso-42001": {
      "compliant": true,
      "score": 100,
      "issues": [],
      "recommendations": []
    },
    "nist-ai-rmf": {
      "compliant": true,
      "score": 100,
      "issues": [],
      "recommendations": []
    },
    "eu-ai-act": {
      "compliant": true,
      "score": 100,
      "issues": [],
      "recommendations": []
    }
  },
  "overall_score": 100,
  "recommendations": [
    "Implement comprehensive AI governance framework",
    "Establish regular compliance monitoring and auditing"
  ]
}
```

### Token Estimation

**POST** `/estimate/tokens`

Estimate token usage and costs for text processing.

**Request Body:**
```json
{
  "text": "This is a sample text for token estimation.",
  "model": "gpt-4"
}
```

**Response:**
```json
{
  "text": "This is a sample text for token estimation.",
  "model": "gpt-4",
  "estimated_tokens": 12,
  "estimated_cost_usd": 0.00036,
  "breakdown": {
    "input_tokens": 10,
    "output_tokens": 2,
    "total_tokens": 12
  },
  "pricing": {
    "input_cost_per_1k": 0.03,
    "output_cost_per_1k": 0.06,
    "currency": "USD"
  },
  "recommendations": [
    "Low token count - you may be able to batch multiple requests",
    "Monitor token usage regularly to optimize costs"
  ]
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "code": "ERROR_CODE"
}
```

**Common Error Codes:**
- `400` - Bad Request (missing required fields)
- `401` - Unauthorized (invalid API key)
- `404` - Not Found (endpoint not found)
- `500` - Internal Server Error

## TDDAI Integration

### Using TDDAI CLI

```bash
# Health check
tddai agents health --api-url=http://localhost:3003/api/v1

# OpenAPI validation
tddai agents validate-openapi --api-url=http://localhost:3003/api/v1 openapi.yaml

# Compliance validation
tddai agents validate-compliance --api-url=http://localhost:3003/api/v1 --frameworks=iso-42001,nist-ai-rmf

# Token estimation
tddai agents estimate-tokens --api-url=http://localhost:3003/api/v1 "Sample text for estimation"
```

### API Gateway Management

```bash
# Create and configure API gateway
tddai integration api-gateway --create oaas-validation-api
tddai integration api-gateway --configure oaas-validation-api
tddai integration api-gateway --monitor
```

## Compliance Frameworks

### ISO 42001: AI Management System
- Risk management framework
- Governance policies
- Monitoring capabilities
- Documentation requirements

### NIST AI Risk Management Framework
- Governance implementation
- AI system mapping
- Performance measurement
- Risk management processes
- Continuous improvement

### EU AI Act
- Risk assessment
- Transparency measures
- Human oversight
- Data governance

## Rate Limits

- **Default**: 100 requests per hour
- **Burst**: 10 requests per minute
- **Headers**: Rate limit information included in response headers

## Monitoring

### Health Checks
- **Endpoint**: `/health`
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Retries**: 3

### Metrics
- Request count and success rate
- Average response time
- Error rates by endpoint
- Compliance validation statistics

## Deployment

### Docker
```bash
# Build and run
docker build -t oaas-validation-api .
docker run -p 3003:3003 oaas-validation-api
```

### Docker Compose
```yaml
services:
  oaas-validation-api:
    build: ./services/validation-api
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=production
      - PORT=3003
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3003/api/v1/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Examples

### Complete Workflow Example

```bash
# 1. Check API health
curl -H "X-API-Key: dev-key" http://localhost:3003/api/v1/health

# 2. Validate OpenAPI spec
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev-key" \
  -d '{"spec": {"openapi": "3.1.0", "info": {"title": "Test API", "version": "1.0.0"}, "paths": {}}}' \
  http://localhost:3003/api/v1/validate/openapi

# 3. Check compliance
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev-key" \
  -d '{"agent": {"governance": true, "monitoring": true}, "frameworks": ["iso-42001"]}' \
  http://localhost:3003/api/v1/validate/compliance

# 4. Estimate tokens
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev-key" \
  -d '{"text": "Sample text", "model": "gpt-4"}' \
  http://localhost:3003/api/v1/estimate/tokens
```

## Support

For issues and questions:
- **Documentation**: [TDDAI Integration](tddai-integration.md)
- **ROADMAP**: [Implementation Plan](ROADMAP.md)
- **Workspace Discovery**: [Discovery Script](../scripts/workspace-discovery.js)
