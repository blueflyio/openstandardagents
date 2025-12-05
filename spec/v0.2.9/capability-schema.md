# OSSA Capability Schema Specification v0.2.9

This specification defines the capability abstraction layer for OSSA agents, enabling interoperability across different tool implementations and transport mechanisms.

## 1. Overview

Capabilities are the fundamental unit of functionality in OSSA. They provide an abstract interface between agents and concrete tool implementations, enabling:

- **Portability**: Same capability, different implementations
- **Discovery**: Agents can advertise and discover capabilities
- **Versioning**: Semantic versioning for capability contracts
- **Negotiation**: Agents can negotiate capability versions

## 2. Capability URI Scheme

### 2.1 Format

```
ossa:<domain>/<capability>@<version>
```

### 2.2 Components

| Component | Description | Pattern |
|-----------|-------------|---------|
| `ossa:` | URI scheme prefix | Fixed |
| `domain` | Functional domain | `[a-z][a-z0-9-]*` |
| `capability` | Capability name | `[a-z][a-z0-9_]*` |
| `version` | Semver version | `MAJOR.MINOR` |

### 2.3 Examples

```yaml
# Standard OSSA capabilities
- ossa:security/scan_vulnerabilities@1.0
- ossa:security/apply_patches@1.0
- ossa:code/lint@2.0
- ossa:code/test@1.0
- ossa:content/publish@1.0
- ossa:a2a/send@1.0

# External capabilities (MCP tools)
- mcp:filesystem/read_file@1.0
- mcp:gitlab/create_issue@1.0
```

## 3. Capability Definition Schema

### 3.1 Full Schema

```yaml
capability:
  # Identity
  uri: "ossa:security/scan_vulnerabilities@1.0"
  name: "scan_vulnerabilities"
  domain: "security"
  version: "1.0.0"

  # Documentation
  description: "Scan codebase for security vulnerabilities"
  documentation_url: "https://ossa.dev/capabilities/security/scan_vulnerabilities"

  # Stability
  stability: "stable"  # experimental | beta | stable | deprecated
  deprecated_by: null  # URI of replacement capability if deprecated
  sunset_date: null    # ISO8601 date when capability will be removed

  # Contract
  input:
    type: object
    required:
      - target
    properties:
      target:
        type: string
        description: "Path or URL to scan"
      severity_threshold:
        type: string
        enum: [low, medium, high, critical]
        default: medium
      scanners:
        type: array
        items:
          type: string
          enum: [sast, dast, sca, secrets, container]
        default: [sast, sca, secrets]

  output:
    type: object
    properties:
      vulnerabilities:
        type: array
        items:
          $ref: "#/definitions/Vulnerability"
      summary:
        type: object
        properties:
          total: { type: integer }
          critical: { type: integer }
          high: { type: integer }
          medium: { type: integer }
          low: { type: integer }
      scan_duration_ms:
        type: integer

  # Error definitions
  errors:
    - code: "SCAN_FAILED"
      description: "Scanner failed to execute"
      retryable: true
    - code: "TARGET_NOT_FOUND"
      description: "Scan target does not exist"
      retryable: false
    - code: "SCANNER_UNAVAILABLE"
      description: "Requested scanner is not available"
      retryable: true
    - code: "TIMEOUT"
      description: "Scan exceeded time limit"
      retryable: true

  # Bindings to concrete implementations
  bindings:
    mcp:
      server: "security-scanner"
      tool: "scan"
      mapping:
        target: "path"
        severity_threshold: "min_severity"
    cli:
      command: "trivy fs {target} --severity {severity_threshold}"
      parser: "json"
    http:
      method: POST
      url: "https://api.scanner.example/v1/scan"
      headers:
        Content-Type: "application/json"
      body_template: |
        {
          "target": "{target}",
          "severity": "{severity_threshold}"
        }
```

### 3.2 TypeScript Interface

```typescript
interface CapabilityDefinition {
  // Identity
  uri: CapabilityURI;
  name: string;
  domain: CapabilityDomain;
  version: SemanticVersion;

  // Documentation
  description: string;
  documentation_url?: string;

  // Stability
  stability: 'experimental' | 'beta' | 'stable' | 'deprecated';
  deprecated_by?: CapabilityURI;
  sunset_date?: string; // ISO8601

  // Contract
  input: JSONSchema;
  output: JSONSchema;
  errors: ErrorDefinition[];

  // Bindings
  bindings: {
    mcp?: MCPBinding;
    cli?: CLIBinding;
    http?: HTTPBinding;
    grpc?: GRPCBinding;
    delegation?: DelegationBinding;
  };
}

interface ErrorDefinition {
  code: string;
  description: string;
  retryable: boolean;
}

interface MCPBinding {
  server: string;
  tool: string;
  mapping?: Record<string, string>;
}

interface CLIBinding {
  command: string;
  parser: 'json' | 'text' | 'yaml';
  env?: Record<string, string>;
}

interface HTTPBinding {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  body_template?: string;
}
```

## 4. Standard Capability Domains

### 4.1 Security Domain (`ossa:security/*`)

| Capability | Version | Description |
|------------|---------|-------------|
| `scan_vulnerabilities` | 1.0 | Scan for security vulnerabilities |
| `apply_patches` | 1.0 | Apply security patches |
| `generate_sbom` | 1.0 | Generate Software Bill of Materials |
| `block_merge` | 1.0 | Block merge requests for security issues |
| `rotate_secrets` | 1.0 | Rotate secrets and credentials |
| `audit_access` | 1.0 | Audit access logs |

### 4.2 Content Domain (`ossa:content/*`)

| Capability | Version | Description |
|------------|---------|-------------|
| `publish` | 1.0 | Publish content to destination |
| `draft` | 1.0 | Create draft content |
| `review` | 1.0 | Review content for quality |
| `translate` | 1.0 | Translate content to target language |
| `summarize` | 1.0 | Summarize content |
| `extract` | 1.0 | Extract structured data from content |

### 4.3 Code Domain (`ossa:code/*`)

| Capability | Version | Description |
|------------|---------|-------------|
| `lint` | 1.0 | Run linting checks |
| `format` | 1.0 | Format code |
| `test` | 1.0 | Run test suite |
| `build` | 1.0 | Build project |
| `deploy` | 1.0 | Deploy to environment |
| `refactor` | 1.0 | Refactor code |
| `generate` | 1.0 | Generate code |

### 4.4 A2A Domain (`ossa:a2a/*`)

| Capability | Version | Description |
|------------|---------|-------------|
| `send` | 1.0 | Send message to agent |
| `broadcast` | 1.0 | Broadcast to agent group |
| `discover` | 1.0 | Discover available agents |
| `negotiate` | 1.0 | Negotiate capability versions |
| `delegate` | 1.0 | Delegate task to another agent |
| `escalate` | 1.0 | Escalate to human or supervisor |

### 4.5 State Domain (`ossa:state/*`)

| Capability | Version | Description |
|------------|---------|-------------|
| `read` | 1.0 | Read state value |
| `write` | 1.0 | Write state value |
| `checkpoint` | 1.0 | Create state checkpoint |
| `rollback` | 1.0 | Rollback to checkpoint |
| `list` | 1.0 | List state keys |
| `delete` | 1.0 | Delete state value |

### 4.6 Observability Domain (`ossa:observability/*`)

| Capability | Version | Description |
|------------|---------|-------------|
| `trace` | 1.0 | Create trace span |
| `metric` | 1.0 | Record metric |
| `log` | 1.0 | Write log entry |
| `alert` | 1.0 | Send alert |
| `dashboard` | 1.0 | Update dashboard |

## 5. Capability Registry

### 5.1 Registry Format

```yaml
registry:
  version: "1.0"
  updated_at: "2025-01-15T00:00:00Z"

  domains:
    - name: security
      description: "Security scanning and remediation"
      maintainer: "security@ossa.dev"

    - name: code
      description: "Code quality and deployment"
      maintainer: "code@ossa.dev"

  capabilities:
    - uri: "ossa:security/scan_vulnerabilities@1.0"
      stability: stable
      added_in: "0.2.0"

    - uri: "ossa:security/scan_vulnerabilities@0.9"
      stability: deprecated
      deprecated_by: "ossa:security/scan_vulnerabilities@1.0"
      sunset_date: "2025-06-01"

    - uri: "ossa:code/lint@2.0"
      stability: stable
      added_in: "0.2.5"
      breaking_changes:
        - "Changed output format from flat to nested"
```

### 5.2 Registry API

```yaml
# GET /registry/capabilities
# Returns all registered capabilities

# GET /registry/capabilities/{domain}
# Returns capabilities in a domain

# GET /registry/capabilities/{domain}/{name}
# Returns specific capability (all versions)

# GET /registry/capabilities/{domain}/{name}@{version}
# Returns specific capability version
```

## 6. Versioning Rules

### 6.1 Semantic Versioning

Capabilities follow semantic versioning:

- **MAJOR**: Breaking changes to input/output schema
- **MINOR**: New optional fields, additive changes
- **PATCH**: Documentation, bug fixes (not in URI)

### 6.2 Breaking Changes

The following are considered breaking changes (require MAJOR bump):

- Removing required input field
- Adding new required input field
- Changing type of existing field
- Removing output field
- Changing error codes

### 6.3 Non-Breaking Changes

The following are non-breaking (MINOR bump):

- Adding optional input field with default
- Adding output field
- Adding new error code
- Changing description
- Adding new binding type

## 7. Version Negotiation

### 7.1 Negotiation Protocol

```yaml
# Agent A requests capability from Agent B
request:
  type: "capability_request"
  capability: "ossa:security/scan_vulnerabilities"
  preferred_versions: ["1.0", "0.9"]
  minimum_version: "0.9"

# Agent B responds with available version
response:
  type: "capability_response"
  capability: "ossa:security/scan_vulnerabilities@1.0"
  status: "available"

# Or if not available
response:
  type: "capability_response"
  capability: "ossa:security/scan_vulnerabilities"
  status: "unavailable"
  reason: "No compatible version available"
  available_versions: ["2.0"]
```

### 7.2 Compatibility Rules

```typescript
function isCompatible(
  requested: CapabilityURI,
  available: CapabilityURI
): boolean {
  // Same domain and name required
  if (requested.domain !== available.domain) return false;
  if (requested.name !== available.name) return false;

  // Major version must match
  if (requested.major !== available.major) return false;

  // Available minor must be >= requested
  return available.minor >= requested.minor;
}
```

## 8. Deprecation Policy

### 8.1 Deprecation Timeline

1. **Announcement**: Capability marked as `deprecated`
2. **Grace Period**: 2 minor versions or 6 months (whichever is longer)
3. **Sunset**: Capability removed from registry

### 8.2 Deprecation Notice

```yaml
capability:
  uri: "ossa:security/scan@0.9"
  stability: deprecated
  deprecated_by: "ossa:security/scan_vulnerabilities@1.0"
  sunset_date: "2025-06-01"
  migration_guide: |
    The `scan` capability has been renamed to `scan_vulnerabilities`.

    Changes:
    - Input field `path` renamed to `target`
    - Output now includes `scan_duration_ms`

    Migration:
    1. Update capability URI in manifest
    2. Update input field names
    3. Handle new output field
```

## 9. MCP Tool Bindings

### 9.1 Binding Specification

```yaml
bindings:
  mcp:
    # MCP server name
    server: "security-scanner"

    # Tool name within server
    tool: "scan"

    # Input mapping (OSSA field -> MCP field)
    mapping:
      target: "path"
      severity_threshold: "min_severity"
      scanners: "scanner_types"

    # Output mapping (MCP field -> OSSA field)
    output_mapping:
      findings: "vulnerabilities"
      elapsed: "scan_duration_ms"

    # Error mapping (MCP error -> OSSA error)
    error_mapping:
      "NOT_FOUND": "TARGET_NOT_FOUND"
      "TIMEOUT": "TIMEOUT"
```

### 9.2 Runtime Resolution

```typescript
async function invokeCapability(
  capability: CapabilityURI,
  input: Record<string, unknown>,
  bindings: CapabilityBindings
): Promise<CapabilityResult> {
  // Try bindings in order of preference
  const bindingOrder = ['mcp', 'http', 'grpc', 'cli'];

  for (const bindingType of bindingOrder) {
    const binding = bindings[bindingType];
    if (!binding) continue;

    try {
      return await executeBinding(bindingType, binding, input);
    } catch (error) {
      // Log and try next binding
      console.warn(`Binding ${bindingType} failed:`, error);
    }
  }

  throw new Error(`No available binding for ${capability}`);
}
```

## 10. Agent Manifest Integration

### 10.1 Declaring Capabilities

```yaml
apiVersion: ossa/v0.2.9
kind: Agent
metadata:
  name: security-scanner
  version: 1.0.0

spec:
  type: worker

  capabilities:
    # Using standard capabilities
    - ossa:security/scan_vulnerabilities@1.0
    - ossa:security/generate_sbom@1.0

    # Using MCP tools directly
    - mcp:filesystem/read_file@1.0
    - mcp:gitlab/create_issue@1.0

  # Capability bindings for this agent
  capability_bindings:
    "ossa:security/scan_vulnerabilities@1.0":
      mcp:
        server: "trivy"
        tool: "scan"
```

### 10.2 Requiring Capabilities

```yaml
spec:
  # Capabilities this agent requires from others
  required_capabilities:
    - uri: "ossa:a2a/delegate@1.0"
      reason: "Delegation to specialized workers"
    - uri: "ossa:state/checkpoint@1.0"
      reason: "State persistence for recovery"
```

## 11. CLI Commands

```bash
# List available capabilities
ossa capability list
ossa capability list --domain security

# Show capability details
ossa capability show ossa:security/scan_vulnerabilities@1.0

# Validate capability definition
ossa capability validate ./my-capability.yaml

# Register custom capability
ossa capability register ./my-capability.yaml

# Check capability compatibility
ossa capability compat ossa:security/scan@0.9 ossa:security/scan_vulnerabilities@1.0
```

## 12. Compliance Requirements

### 12.1 MUST Requirements

1. All capabilities MUST have a valid URI
2. All capabilities MUST define input and output schemas
3. All capabilities MUST define at least one binding
4. Breaking changes MUST increment MAJOR version

### 12.2 SHOULD Requirements

1. Capabilities SHOULD include documentation_url
2. Capabilities SHOULD define error codes
3. Deprecated capabilities SHOULD specify migration_guide
4. Bindings SHOULD include field mappings

### 12.3 MAY Requirements

1. Capabilities MAY define multiple bindings
2. Capabilities MAY include examples
3. Registries MAY implement caching

## 13. References

- [OSSA Agent Manifest Specification](./agent.md)
- [A2A Protocol Specification](./a2a-protocol.md)
- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [JSON Schema](https://json-schema.org/)
- [Semantic Versioning](https://semver.org/)
