# OSSA Go SDK

Go SDK for Open Standard for Scalable AI Agents (OSSA).

## Installation

```bash
go get github.com/blueflyio/ossa-go
```

## Quick Start

```go
package main

import (
    "fmt"
    "github.com/blueflyio/ossa-go/ossa"
)

func main() {
    // Load a manifest
    manifest, err := ossa.LoadManifest("my-agent.ossa.yaml")
    if err != nil {
        panic(err)
    }

    fmt.Printf("Agent: %s\n", manifest.Metadata.Name)
    fmt.Printf("Kind: %s\n", manifest.Kind)

    // Validate against schema
    result, err := ossa.ValidateManifest(manifest, "")
    if err != nil {
        panic(err)
    }

    if result.Valid {
        fmt.Println("✅ Manifest is valid")
    } else {
        fmt.Printf("❌ %d validation errors\n", len(result.Errors))
    }
}
```

## CLI Usage

```bash
# Install CLI
go install github.com/blueflyio/ossa-go/cmd/ossa@latest

# Validate a manifest
ossa validate my-agent.ossa.yaml

# Get manifest info
ossa info my-agent.ossa.yaml

# JSON output
ossa validate my-agent.ossa.yaml --json
```

## API Reference

### Loading Manifests

```go
// Load from file
manifest, err := ossa.LoadManifest("agent.ossa.yaml")

// Parse from bytes
manifest, err := ossa.ParseManifest(data, "agent.ossa.yaml")

// Save to file
err := ossa.SaveManifest(manifest, "output.ossa.yaml")
```

### Validation

```go
// Create validator with embedded schema
v, err := ossa.NewValidator()

// Create validator with custom schema
v, err := ossa.NewValidatorFromPath("/path/to/schema.json")

// Validate manifest
result, err := v.Validate(manifest)

// Convenience functions
result, err := ossa.ValidateManifest(manifest, "")
result, err := ossa.ValidateFile("agent.ossa.yaml", "")
```

### Types

```go
// Kind constants
ossa.KindAgent    // "Agent"
ossa.KindTask     // "Task"
ossa.KindWorkflow // "Workflow"

// Access tiers
ossa.TierRead          // "tier_1_read"
ossa.TierWriteLimited  // "tier_2_write_limited"
ossa.TierWriteElevated // "tier_3_write_elevated"
ossa.TierPolicy        // "tier_4_policy"
```

## License

Apache-2.0
