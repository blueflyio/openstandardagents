# kAgent Examples

OSSA agent manifests for Kubernetes-native agent deployment.

## Examples

- **compliance-validator.ossa.yaml** - Validates FedRAMP/HIPAA compliance
- **cost-optimizer.ossa.yaml** - Optimizes cloud infrastructure costs
- **documentation-agent.ossa.yaml** - Generates technical documentation
- **k8s-troubleshooter.ossa.yaml** - Kubernetes troubleshooting and diagnostics
- **security-scanner.ossa.yaml** - Security vulnerability scanning

All examples follow OSSA v0.2.2 specification.

## Usage

Validate any example:

```bash
ossa validate compliance-validator.ossa.yaml
```

Deploy to Kubernetes (requires agent-buildkit):

```bash
buildkit agents deploy compliance-validator.ossa.yaml
```

## Schema

All manifests validate against: `spec/v0.2.2/ossa-0.2.2.schema.json`
