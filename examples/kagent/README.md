# kAgent Examples

OSSA agent manifests for Kubernetes-native agent deployment.

## Examples

- **ossa-kagent-poc.ossa.yaml** - POC: OSSA-first manifest for kagent.dev (v1alpha2). Export with `ossa export ossa-kagent-poc.ossa.yaml --platform kagent --crd-version v1alpha2 -o ./out`; deploy with `kubectl apply -f out/`.
- **compliance-validator.ossa.yaml** - Validates FedRAMP/HIPAA compliance
- **cost-optimizer.ossa.yaml** - Optimizes cloud infrastructure costs
- **documentation-agent.ossa.yaml** - Generates technical documentation
- **k8s-troubleshooter.ossa.yaml** - Kubernetes troubleshooting and diagnostics
- **security-scanner.ossa.yaml** - Security vulnerability scanning

All examples follow OSSA v0.4 specification.

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
