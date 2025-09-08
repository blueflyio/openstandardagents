# OSSA v0.1.8 Compliance Validation System

[![OSSA v0.1.8](https://img.shields.io/badge/OSSA-v0.1.8-green.svg)](https://ossa.agents)
[![Compliance](https://img.shields.io/badge/Compliance-FedRAMP%20%7C%20NIST-blue.svg)]()
[![API](https://img.shields.io/badge/API-OpenAPI%203.1-orange.svg)]()

Comprehensive compliance validation, scoring, and reporting system for OSSA v0.1.8 workspaces. Supports major government and industry compliance frameworks with automated validation, advanced scoring algorithms, and executive-level reporting.

## 🎯 Overview

The OSSA Compliance System provides:

- **Multi-Framework Validation**: FedRAMP, NIST 800-53 Rev 5
- **Advanced Scoring**: Weighted algorithms considering control criticality
- **Automated Reporting**: PDF, HTML, JSON, CSV, Excel formats
- **Trend Analysis**: Historical compliance tracking and projections
- **Executive Summaries**: C-suite ready compliance reports
- **CLI Integration**: Command-line tools for developers and operators
- **REST API**: Full programmatic access with OpenAPI 3.1 specification

## 🏛️ Supported Frameworks

### FedRAMP (Federal Risk and Authorization Management Program)
- **Version**: 2.0
- **Authority**: GSA (General Services Administration)
- **Classification**: Moderate Impact Level
- **Controls Covered**: 16 core controls (AC, AU, CM, IA, SC, SI families)
- **Use Case**: Federal cloud services and government contractors

### NIST 800-53 Rev 5
- **Version**: Revision 5
- **Authority**: NIST (National Institute of Standards and Technology)
- **Classification**: Comprehensive security framework
- **Controls Covered**: 32+ controls across multiple families
- **Use Case**: Federal agencies, critical infrastructure, enterprise security

## 🚀 Quick Start

### CLI Usage

```bash
# Initialize compliance validation in your workspace
ossa compliance init --workspace /path/to/workspace --frameworks fedramp,nist-800-53

# Quick compliance check
ossa compliance quick-check --framework fedramp

# Full validation with report generation
ossa compliance validate --framework all --detailed --report json,pdf

# Generate executive summary
ossa compliance executive-summary --output exec-summary.json

# View compliance dashboard
ossa compliance dashboard

# Show recommendations
ossa compliance recommendations --priority critical
```

### Programmatic Usage

```typescript
import { 
  ComplianceService, 
  validateCompliance, 
  generateComplianceReport 
} from '@ossa/compliance';

// Quick validation
const quickResult = await validateCompliance(
  '/path/to/workspace',
  'FEDRAMP'
);

console.log(`Compliance Score: ${quickResult.score}%`);
console.log(`Status: ${quickResult.status}`);

// Generate report
const reportPath = await generateComplianceReport(
  '/path/to/workspace',
  'NIST_800_53',
  'pdf'
);

console.log(`Report generated: ${reportPath}`);
```

### REST API Usage

```bash
# Validate workspace compliance
curl -X POST https://api.llm.bluefly.io/ossa/v1/compliance/validate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "framework": "FEDRAMP",
    "workspacePath": "/path/to/workspace",
    "options": {
      "detailedAnalysis": true,
      "generateReport": true,
      "reportFormat": "json"
    }
  }'

# Get compliance dashboard
curl https://api.llm.bluefly.io/ossa/v1/compliance/dashboard/workspace \
  -H "X-API-Key: your-api-key"

# List supported frameworks
curl https://api.llm.bluefly.io/ossa/v1/compliance/frameworks \
  -H "X-API-Key: your-api-key"
```

## 📊 Scoring Methodology

### Weighted Scoring Algorithm

The compliance scoring system uses a sophisticated weighted algorithm that considers:

1. **Control Family Weights**: Higher weights for critical families (AC, SC, IA)
2. **Control Criticality**: Critical controls (AC-3, SC-7) get 2x weight multiplier
3. **Implementation Status**: 
   - Compliant: 1.0x multiplier
   - Partially Compliant: 0.6-0.7x multiplier  
   - Non-Compliant: 0.1-0.2x multiplier
4. **Evidence Quality**: Multiple evidence types increase scores
5. **Risk Factors**: High-risk findings amplify score impact

### Maturity Assessment

Compliance maturity is assessed across five levels:

- **Initial**: Basic compliance awareness (0-50%)
- **Developing**: Some controls implemented (50-65%)
- **Defined**: Most controls in place (65-80%)
- **Managed**: Comprehensive implementation (80-95%)
- **Optimizing**: Continuous improvement (95%+)

### Benchmark Comparison

Industry benchmarks provide context:

- **Technology Sector Average**: 75.2% (FedRAMP), 72.1% (NIST)
- **Financial Services**: 82.3% (FedRAMP), 78.9% (NIST)
- **Healthcare**: 79.1% (FedRAMP), 76.4% (NIST)

## 📋 Control Mapping

### FedRAMP Control Families

- **AC** (Access Control): Role-based access, least privilege, enforcement
- **AU** (Audit & Accountability): Event logging, audit records, analysis
- **CM** (Configuration Management): Baseline config, change control
- **IA** (Identification & Authentication): User identity, authenticators
- **SC** (System & Communications Protection): Boundary protection, encryption
- **SI** (System & Information Integrity): Flaw remediation, monitoring

### NIST 800-53 Enhanced Coverage

Additional families and enhanced controls:

- **RA** (Risk Assessment): Risk analysis, vulnerability monitoring
- **CA** (Security Assessment): Control assessment, monitoring strategy
- **PL** (Planning): Security planning, rules of behavior
- **PS** (Personnel Security): Personnel screening, access agreements

## 📈 Reporting Features

### Executive Summary
- C-suite appropriate language and metrics
- Strategic recommendations
- Risk assessment summary
- Industry benchmark comparison
- Compliance trend projections

### Detailed Technical Reports
- Control-by-control assessment results
- Evidence documentation and gaps
- Risk-prioritized remediation plan
- Implementation roadmap with timelines
- Cross-framework gap analysis

### Compliance Dashboard
- Real-time compliance scores
- Trend visualization
- Alert notifications
- Framework comparison
- Action item tracking

## 🔧 Configuration

### Workspace Configuration

Create `.agents-workspace/compliance.json`:

```json
{
  "enabledFrameworks": ["FEDRAMP", "NIST_800_53"],
  "assessmentFrequency": "monthly",
  "automatedScanning": true,
  "thresholds": {
    "minimumCompliance": 80,
    "criticalControlFailureThreshold": 5,
    "riskScoreThreshold": 70
  },
  "notifications": {
    "enabled": true,
    "channels": ["email", "slack"],
    "criticalOnly": false
  },
  "reporting": {
    "defaultFormat": "json",
    "includeEvidence": true,
    "customBranding": {
      "organizationName": "Your Organization",
      "primaryColor": "#0066cc"
    }
  }
}
```

### Required OSSA Workspace Structure

```
workspace/
├── .agents-workspace/
│   ├── workspace.json              # Core workspace config
│   ├── compliance.json             # Compliance settings
│   └── config/
│       └── security.yaml           # Security configuration
├── agents/                         # Agent definitions
└── infrastructure/                 # Compliance mappings (auto-generated)
    └── compliance/
        ├── fedramp/
        │   └── mapping.yaml
        └── nist-800-53/
            └── mapping.yaml
```

## 🎨 Customization

### Custom Report Templates

Create custom report templates in `compliance/templates/`:

```yaml
# custom-template.yaml
name: "Custom Executive Report"
description: "Organization-specific executive summary"
framework: "FEDRAMP"
sections:
  - id: "executive_summary"
    title: "Executive Summary"
    type: "executive_summary"
    required: true
    template: "custom-executive.md"
  - id: "risk_matrix"
    title: "Risk Assessment Matrix"
    type: "findings"
    required: true
    template: "risk-matrix.html"
styling:
  colors:
    primary: "#003366"
    secondary: "#0066cc"
    accent: "#ff6600"
  fonts:
    heading: "Arial, sans-serif"
    body: "Calibri, sans-serif"
```

### Custom Scoring Weights

Override default scoring weights:

```typescript
const customWeights: ScoringWeights = {
  controlFamily: {
    'AC': 2.0,  // Higher weight for access controls
    'AU': 1.8,  // Increased audit importance
    'SC': 1.9,  // System protection priority
  },
  controlCriticality: {
    'AC-3': 2.5,  // Critical access enforcement
    'ORG-1': 3.0, // Custom organizational control
  }
};

const scorer = new ComplianceScorer(customWeights);
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all compliance tests
npm test -- --testPathPattern=compliance

# Run specific test suites
npm test -- compliance/services
npm test -- compliance/scoring
npm test -- compliance/reporting

# Run with coverage
npm test -- --coverage --testPathPattern=compliance

# Integration tests
npm test -- compliance/__tests__/integration
```

### Test Coverage Targets

- **Services**: >95% line coverage
- **Scoring**: >90% branch coverage  
- **Reporting**: >85% function coverage
- **API Endpoints**: >90% integration coverage

## 🔒 Security Considerations

### Sensitive Data Handling

- Compliance evidence files may contain sensitive information
- Report outputs should be stored in secure locations
- API endpoints require authentication (API key or JWT)
- Audit trails maintained for all validation activities

### Access Controls

- Workspace-level permissions required for validation
- Report generation may require elevated privileges
- Configuration changes logged and auditable
- Framework mappings cryptographically signed

## 📚 API Reference

Full OpenAPI 3.1 specification available at:
- **Development**: `http://localhost:4000/api/v1/compliance/docs`
- **Production**: `https://api.llm.bluefly.io/ossa/v1/compliance/docs`

### Key Endpoints

| Endpoint | Method | Description |
|----------|---------|-------------|
| `/compliance/validate` | POST | Validate workspace compliance |
| `/compliance/validate/bulk` | POST | Multi-framework validation |
| `/compliance/score` | POST | Calculate compliance scores |
| `/compliance/reports/generate` | POST | Generate compliance reports |
| `/compliance/frameworks` | GET | List supported frameworks |
| `/compliance/dashboard/{workspace}` | GET | Compliance dashboard data |

## 🤝 Integration Examples

### CI/CD Pipeline Integration

```yaml
# .github/workflows/compliance.yml
name: Compliance Validation
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  compliance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install OSSA CLI
        run: npm install -g @ossa/cli
      - name: Validate Compliance
        run: |
          ossa compliance validate \
            --framework fedramp \
            --workspace . \
            --output json \
            --fail-threshold 80
        env:
          OSSA_API_KEY: ${{ secrets.OSSA_API_KEY }}
      - name: Upload Compliance Report
        uses: actions/upload-artifact@v3
        with:
          name: compliance-report
          path: compliance-report-*.json
```

### Docker Integration

```dockerfile
# Dockerfile.compliance
FROM node:18-alpine

WORKDIR /app

# Install OSSA CLI and compliance tools
RUN npm install -g @ossa/cli @ossa/compliance

# Copy workspace configuration
COPY .agents-workspace/ .agents-workspace/
COPY infrastructure/ infrastructure/

# Run compliance validation
CMD ["ossa", "compliance", "validate", "--framework", "all", "--detailed"]
```

### Terraform Integration

```hcl
# compliance-monitoring.tf
resource "aws_lambda_function" "compliance_monitor" {
  function_name = "ossa-compliance-monitor"
  runtime       = "nodejs18.x"
  handler       = "index.handler"
  filename      = "compliance-monitor.zip"

  environment {
    variables = {
      OSSA_API_ENDPOINT = "https://api.llm.bluefly.io/ossa/v1"
      COMPLIANCE_FRAMEWORKS = "FEDRAMP,NIST_800_53"
      NOTIFICATION_TOPIC = aws_sns_topic.compliance_alerts.arn
    }
  }
}

resource "aws_cloudwatch_event_rule" "daily_compliance_check" {
  name                = "daily-compliance-validation"
  schedule_expression = "cron(0 6 * * ? *)"
}

resource "aws_cloudwatch_event_target" "lambda_target" {
  rule      = aws_cloudwatch_event_rule.daily_compliance_check.name
  target_id = "ComplianceLambdaTarget"
  arn       = aws_lambda_function.compliance_monitor.arn
}
```

## 🔄 Migration Guide

### From Legacy Compliance Systems

1. **Assessment Phase**:
   ```bash
   # Analyze existing compliance documentation
   ossa compliance analyze-legacy --input /path/to/legacy/docs
   
   # Generate migration report
   ossa compliance migrate-plan --from legacy --to ossa-v0.1.8
   ```

2. **Data Migration**:
   ```bash
   # Import existing control mappings
   ossa compliance import --format csv --file existing-controls.csv
   
   # Validate imported data
   ossa compliance validate --framework all --strict
   ```

3. **Verification**:
   ```bash
   # Compare results with legacy system
   ossa compliance compare --legacy-report legacy.pdf --ossa-report new.json
   ```

## 🐛 Troubleshooting

### Common Issues

**Error**: `Failed to load FedRAMP mapping: ENOENT`
```bash
# Solution: Initialize infrastructure
ossa compliance init --frameworks fedramp
```

**Error**: `Workspace configuration not found`
```bash
# Solution: Create workspace config
mkdir -p .agents-workspace
echo '{"version": "OSSA v0.1.8"}' > .agents-workspace/workspace.json
```

**Error**: `Insufficient permissions for compliance validation`
```bash
# Solution: Check workspace permissions
chmod -R 755 .agents-workspace/
```

### Debug Mode

Enable detailed logging:

```bash
export OSSA_DEBUG=compliance:*
export OSSA_LOG_LEVEL=debug

ossa compliance validate --framework fedramp --verbose
```

### Performance Optimization

For large workspaces:

```bash
# Use parallel validation
ossa compliance validate --framework all --parallel --max-workers 4

# Cache control mappings
export OSSA_CACHE_MAPPINGS=true

# Optimize evidence collection
ossa compliance validate --no-evidence --quick
```

## 📖 Additional Resources

- **OSSA v0.1.8 Specification**: [https://ossa.agents/spec/v0.1.8](https://ossa.agents/spec/v0.1.8)
- **FedRAMP Documentation**: [https://fedramp.gov/](https://fedramp.gov/)
- **NIST 800-53 Controls**: [https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final](https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final)
- **API Documentation**: [https://api.llm.bluefly.io/ossa/v1/compliance/docs](https://api.llm.bluefly.io/ossa/v1/compliance/docs)
- **Support Forum**: [https://community.ossa.agents/compliance](https://community.ossa.agents/compliance)

## 🤝 Contributing

We welcome contributions to the OSSA Compliance System:

1. **Framework Support**: Add new compliance frameworks
2. **Scoring Algorithms**: Enhance scoring methodologies
3. **Report Templates**: Create industry-specific templates
4. **Integration Examples**: Share CI/CD and tooling integrations

See [CONTRIBUTING.md](../../../CONTRIBUTING.md) for detailed guidelines.

## 📄 License

Licensed under Apache 2.0. See [LICENSE](../../../LICENSE) for details.

---

**OSSA v0.1.8 Compliance System** - Enterprise-grade compliance validation for AI agent systems.

For technical support: [compliance-support@ossa.agents](mailto:compliance-support@ossa.agents)