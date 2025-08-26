# TDDAI Integration with OpenAPI AI Agents Standard

## Overview

The OpenAPI AI Agents Standard (OAAS) project includes full TDDAI (Test-Driven Development AI) integration for enhanced development workflows, agent validation, and API management.

## TDDAI System Status

TDDAI is production ready with:
- **350+ Commands** across 20 namespaces
- **AI-Enhanced Testing** with automated test generation
- **API Gateway Management** for service orchestration
- **Workflow Orchestration** with parallel execution
- **Analytics & Metrics** collection and analysis
- **OpenAPI AI Agents Standard** integration

## Quick Start

```bash
# Check TDDAI system status
tddai status

# Run TDD workflow on OAAS project
tddai workflow tdd --cycle 3 --test-first --metrics

# Validate OpenAPI specifications
tddai agents validate-openapi openapi.yaml

# Check agent compliance
tddai agents validate-compliance --frameworks=iso-42001,nist-ai-rmf
```

## TDDAI Commands for OAAS

### Agent Operations
```bash
# Health check
tddai agents health

# OpenAPI validation
tddai agents validate-openapi <spec-file>

# Token estimation
tddai agents estimate-tokens <text>

# Compliance validation
tddai agents validate-compliance --frameworks=iso-42001,nist-ai-rmf
```

### Development Workflow
```bash
# TDD workflow
tddai workflow tdd --cycle 3 --test-first --metrics

# Debug tools
tddai development debug --network
tddai development debug --performance
tddai development debug --memory

# Profiling
tddai development profiler --memory
tddai development profiler --performance
```

### API Gateway Management
```bash
# Create API gateway
tddai integration api-gateway --create oaas-validation-api

# Configure gateway
tddai integration api-gateway --configure oaas-validation-api

# Monitor gateway
tddai integration api-gateway --monitor

# Webhook management
tddai integration webhook --create
tddai integration webhook --configure
```

### Workflow Orchestration
```bash
# Orchestrate workflows
tddai orchestration orchestrate --workflow oaas-implementation --parallel

# Distributed orchestration
tddai orchestration distributed --nodes 3

# Pipeline management
tddai orchestration pipeline --create
tddai orchestration pipeline --deploy
```

### Analytics & Testing
```bash
# Metrics collection
tddai analytics metrics

# Predictive analytics
tddai analytics predictive --forecast

# AI-powered testing
tddai test ai-testing

# Performance testing
tddai test performance --load

# Security testing
tddai test security-testing --scan
```

## OAAS Project Integration

### Workspace Discovery
The OAAS project includes a workspace discovery system that scans for agents across the LLM ecosystem:

```bash
# Run workspace discovery
node scripts/workspace-discovery.js
```

This discovers agents in:
- `/common_npm/tddai/.agents/agents/` - TDDAI agents
- `/llm-platform/.agents/` - Drupal LLM expert agents
- `/common_npm/bfrfp/.agents/` - RFP generator agents
- `/openapi-ai-agents-standard/.agents/` - OAAS standard agents

### Agent Registry
The discovery system generates a comprehensive registry at:
- `registry/workspace-registry.json` - Complete agent registry

### API Server Integration
TDDAI integrates with the OAAS validation API server:
- **Port**: 3003 (configurable)
- **Endpoints**: `/api/v1/health`, `/api/v1/validate/openapi`, `/api/v1/validate/compliance`, `/api/v1/estimate/tokens`
- **Authentication**: API key support
- **Health Checks**: Built-in monitoring

## ROADMAP Progress

### ✅ Completed Phases
- **Phase 1-4**: TDDAI Integration Complete
- **Phase 5**: API Server Implementation (using TDDAI's API gateway management)
- **Phase 6**: Additional Project Agents (drupal_llm_expert, rfp_generator)
- **Phase 7**: Workspace Orchestration (using TDDAI's orchestration commands)

### 🎯 Current Status
- **TDDAI Integration**: ✅ Production Ready
- **API Gateway**: ✅ Configured and Monitored
- **Workflow Orchestration**: ✅ Parallel Execution Enabled
- **Analytics**: ✅ Metrics Collection Active
- **Testing**: ✅ AI-Powered Testing Integrated

## Configuration

### Environment Variables
```bash
# API Configuration
export OAAS_API_URL="http://localhost:3003/api/v1"
export OAAS_API_KEY="dev-key"

# TDDAI Configuration
export TDDAI_LOG_LEVEL="info"
export TDDAI_METRICS_ENABLED="true"
```

### Docker Integration
The OAAS validation API server is configured for Docker deployment:
- **Dockerfile**: `services/validation-api/Dockerfile`
- **Docker Compose**: Integrated with LLM Platform infrastructure
- **Health Checks**: Built-in container health monitoring

## Troubleshooting

### Common Issues
1. **API Connection Refused**: Ensure validation API server is running on port 3003
2. **Authentication Errors**: Check API key configuration
3. **Agent Discovery Issues**: Verify `.agents/` directory structure

### Debug Commands
```bash
# Network debugging
tddai development debug --network

# Performance profiling
tddai development profiler --performance

# Memory analysis
tddai development profiler --memory
```

## Next Steps

1. **Deploy API Server**: Use Docker Compose to deploy validation API
2. **Validate Agents**: Run compliance validation on all discovered agents
3. **Monitor Performance**: Use TDDAI analytics for continuous monitoring
4. **Scale Orchestration**: Expand parallel workflow execution

## References

- [TDDAI Documentation](../../common_npm/tddai/docs/)
- [OpenAPI AI Agents Standard ROADMAP](ROADMAP.md)
- [Workspace Discovery Script](scripts/workspace-discovery.js)
- [Agent Registry](registry/workspace-registry.json)
