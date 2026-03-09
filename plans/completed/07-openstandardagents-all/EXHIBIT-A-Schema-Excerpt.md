# Exhibit A — OSSA Schema Excerpt (Identity, Agent Card, Token Efficiency)
## NIST CAISI RFI Response — BlueFly.io / OSSA

Source: Open Standard for Software Agents (OSSA) v0.4 — https://openstandardagents.org/spec/v0.4  
Repository: openstandardagents (spec/v0.4/)

---

## 1. Agent Card (Core Contract)

**File:** `spec/v0.4/agent-card.schema.json`  
**Purpose:** Universal agent contract for discovery, identity, and security attributes.

```json
{
  "$id": "https://openstandardagents.org/schemas/v0.4/agent-card.schema.json",
  "title": "OSSA Agent Card",
  "required": ["uri", "name", "version", "ossaVersion", "capabilities", "endpoints", "transport", "authentication", "encryption"],
  "properties": {
    "uri": {
      "type": "string",
      "pattern": "^agent://",
      "description": "Agent URI in the format agent://{namespace}/{name}"
    },
    "name": { "type": "string", "minLength": 1 },
    "version": { "type": "string" },
    "ossaVersion": { "type": "string" },
    "capabilities": { "type": "array", "items": { "type": "string" } },
    "tools": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "description", "inputSchema"],
        "properties": {
          "name": { "type": "string" },
          "description": { "type": "string" },
          "inputSchema": { "type": "object" },
          "outputSchema": { "type": "object" }
        }
      }
    },
    "mcpServers": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name"],
        "properties": {
          "name": { "type": "string" },
          "transport": {
            "properties": {
              "type": { "enum": ["stdio", "sse", "streamable-http"] },
              "url": { "type": "string" }
            }
          }
        }
      }
    }
  }
}
```

---

## 2. Identity Extension (W3C DID)

**File:** `spec/v0.4/extensions/identity/identity.schema.json`  
**Purpose:** Decentralized identity binding; GAID resolution.

```json
{
  "$id": "https://openstandardagents.org/schemas/v0.4/extensions/identity.json",
  "title": "OSSA Identity Extension Schema (DID Document)",
  "required": ["@context", "id"],
  "properties": {
    "@context": {
      "oneOf": [
        { "type": "string", "const": "https://www.w3.org/ns/did/v1" },
        { "type": "array", "contains": { "const": "https://www.w3.org/ns/did/v1" } }
      ]
    },
    "id": {
      "type": "string",
      "pattern": "^did:web:.+$",
      "description": "DID identifier; did:web method for OSSA agents"
    },
    "controller": { "description": "DID(s) authorized to make changes" },
    "verificationMethod": {
      "type": "array",
      "description": "Cryptographic verification methods (public keys)"
    },
    "authentication": {
      "type": "array",
      "description": "Verification methods used for authentication"
    },
    "service": {
      "type": "array",
      "description": "Service endpoints (e.g. agent card URL, A2A endpoint)"
    }
  }
}
```

---

## 3. Token Efficiency Extension (Resource Governance)

**File:** `spec/v0.4/extensions/token-efficiency/token-efficiency.schema.json`  
**Purpose:** Budgets and optimization techniques for token/resource governance.

```json
{
  "$id": "https://openstandardagents.org/schemas/v0.5/extensions/token-efficiency.schema.json",
  "title": "OSSA Token Efficiency Extension",
  "properties": {
    "optimization": {
      "type": "object",
      "properties": {
        "enabled": { "type": "boolean", "default": true },
        "baseline_tokens": { "type": "integer" },
        "target_tokens": { "type": "integer" },
        "techniques": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": [
              "knowledge_graph_refs",
              "template_compression",
              "semantic_compression",
              "dynamic_budgets",
              "checkpoint_retry",
              "cascade_composition",
              "circuit_breaker",
              "observation_masking",
              "lazy_loading",
              "hierarchical_context",
              "intelligent_routing",
              "prefiltering",
              "manifest_fingerprint"
            ]
          }
        }
      }
    }
  }
}
```

---

*Exhibit A — End*
