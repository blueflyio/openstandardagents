# OSSA-100: Invalid DID Format

**Severity**: Error
**Category**: Identity & DID
**Tags**: identity, did, format

## Description

The Decentralized Identifier (DID) does not follow the required OSSA DID format. OSSA uses DIDs for agent identity, lineage tracking, marketplace transactions, and reputation systems.

## Error Message

```
Invalid DID format
```

## DID Format Specification

OSSA DIDs must follow this pattern:

```
did:ossa:[a-z0-9]{32,64}
```

**Components**:
- **Scheme**: `did` (constant)
- **Method**: `ossa` (OSSA-specific method)
- **Identifier**: 32-64 lowercase alphanumeric characters

**Valid characters**: `a-z`, `0-9` (lowercase only)
**Length**: 32-64 characters (after `did:ossa:`)

## Common Causes

1. **Wrong DID method**: Using `did:key:`, `did:web:`, etc. instead of `did:ossa:`
2. **Uppercase characters**: DIDs are case-sensitive, must be lowercase
3. **Too short**: Identifier must be at least 32 characters
4. **Too long**: Identifier must be at most 64 characters
5. **Invalid characters**: Contains hyphens, underscores, or special characters
6. **Missing prefix**: Missing `did:ossa:` prefix

## Remediation

Use the correct OSSA DID format: `did:ossa:[32-64 lowercase alphanumeric characters]`

### Generating Valid DIDs

**Using OSSA CLI**:
```bash
ossa generate-did
# Output: did:ossa:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**Using Node.js**:
```typescript
import { generateOSSADID } from '@openstandardagents/core';

const did = generateOSSADID();
// did:ossa:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**Manual generation** (SHA-256 hash):
```bash
# Generate from agent name + timestamp
echo "my-agent-$(date +%s)" | sha256sum | cut -c1-48
# Use output: did:ossa:<hash>
```

## Examples

### Example 1: Wrong DID method

**❌ Invalid**
```json
{
  "metadata": {
    "decentralized_identity": {
      "did": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK"
    }
  }
}
```

**✅ Valid**
```json
{
  "metadata": {
    "decentralized_identity": {
      "did": "did:ossa:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"
    }
  }
}
```

### Example 2: Uppercase characters

**❌ Invalid**
```json
{
  "metadata": {
    "decentralized_identity": {
      "did": "did:ossa:A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6"
    }
  }
}
```

**✅ Valid**
```json
{
  "metadata": {
    "decentralized_identity": {
      "did": "did:ossa:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
    }
  }
}
```

### Example 3: Too short

**❌ Invalid**
```json
{
  "metadata": {
    "decentralized_identity": {
      "did": "did:ossa:abc123"
    }
  }
}
```

**✅ Valid**
```json
{
  "metadata": {
    "decentralized_identity": {
      "did": "did:ossa:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
    }
  }
}
```

### Example 4: Invalid characters (hyphens)

**❌ Invalid**
```json
{
  "metadata": {
    "decentralized_identity": {
      "did": "did:ossa:my-agent-2024-01-27-abc123"
    }
  }
}
```

**✅ Valid**
```json
{
  "metadata": {
    "decentralized_identity": {
      "did": "did:ossa:myagent2024012abc123def456ghi789jkl012mno345"
    }
  }
}
```

### Example 5: Missing prefix

**❌ Invalid**
```json
{
  "metadata": {
    "decentralized_identity": {
      "did": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
    }
  }
}
```

**✅ Valid**
```json
{
  "metadata": {
    "decentralized_identity": {
      "did": "did:ossa:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
    }
  }
}
```

## Use Cases for DIDs

DIDs are used in OSSA for:

1. **Genetics & Breeding**: Track agent lineage via `parent_dids`
2. **Economics**: Identify agents in marketplace transactions
3. **Reputation**: Build verifiable reputation history
4. **Team Collaboration**: Reference team members via DIDs
5. **Credentials**: Bind verifiable credentials to agent identity

## Revolutionary Features Requiring DIDs

| Feature | Required DID Field | Purpose |
|---------|-------------------|---------|
| Genetics | `metadata.decentralized_identity.did` | Lineage tracking |
| Economics | `metadata.decentralized_identity.did` | Transaction identity |
| Breeding | `metadata.genetics.parent_dids` | Parent references |
| Team | `metadata.team_membership.reports_to` | Hierarchy |

## Pattern Validation

**Regex**: `^did:ossa:[a-z0-9]{32,64}$`

```typescript
const DID_PATTERN = /^did:ossa:[a-z0-9]{32,64}$/;

function isValidOSSADID(did: string): boolean {
  return DID_PATTERN.test(did);
}

// Valid
isValidOSSADID('did:ossa:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'); // true

// Invalid
isValidOSSADID('did:key:abc');  // false (wrong method)
isValidOSSADID('did:ossa:ABC'); // false (uppercase)
isValidOSSADID('did:ossa:abc-123'); // false (hyphen)
isValidOSSADID('did:ossa:a1b2c3'); // false (too short)
```

## Related Errors

- [OSSA-101](./ossa-101.md) - DID pattern mismatch (similar, more specific)
- [OSSA-102](./ossa-102.md) - Missing DID for genetics
- [OSSA-103](./ossa-103.md) - Missing DID for economics
- [OSSA-104](./ossa-104.md) - DID without credentials

## Debugging Tips

1. **Check prefix**: Ensure DID starts with `did:ossa:`
2. **Verify length**: Count characters after `did:ossa:` (should be 32-64)
3. **Lowercase only**: Convert to lowercase if needed
4. **Remove special chars**: Strip hyphens, underscores, etc.
5. **Use generator**: Use official DID generator to ensure compliance

## DID Resolution (Future)

OSSA DIDs are designed for future resolution via:
- **Registry lookup**: Resolve DID to agent metadata
- **Blockchain anchoring**: Verify DID ownership
- **Credential verification**: Validate credentials against DID

## Schema Reference

```json
{
  "decentralized_identity": {
    "type": "object",
    "properties": {
      "did": {
        "type": "string",
        "pattern": "^did:ossa:[a-z0-9]{32,64}$",
        "description": "OSSA Decentralized Identifier for this agent"
      }
    }
  }
}
```

## Documentation

- [DID Specification](../guides/did-specification.md)
- [Revolutionary Features Guide](../guides/revolutionary-features.md)
- [Genetics & Breeding](../guides/genetics.md)
- [Error Catalog](./catalog.md)

## Support

If you need help with DIDs:
1. Use the OSSA DID generator: `ossa generate-did`
2. Check [DID examples](../../examples/did-examples/)
3. Join our [Discord community](https://discord.gg/openstandardagents)
4. Open an issue on [GitHub](https://github.com/bluefly-ai/openstandardagents/issues)
