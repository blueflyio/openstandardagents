# OSSA-210: Invalid Trait

**Severity**: Warning
**Category**: Genetics & Breeding
**Tags**: genetics, traits

## Description

Agent genetic traits should follow the recommended naming convention for consistency and discoverability. Traits represent inherited characteristics that affect agent behavior, performance, and capabilities.

## Error Message

```
Invalid trait
```

## Trait Naming Convention

Traits should follow the pattern: `category.trait_name`

**Format**: `{category}.{trait_name}`

**Categories**:
- `capability` - Functional capabilities (e.g., `capability.code_generation`)
- `performance` - Performance characteristics (e.g., `performance.speed`)
- `behavior` - Behavioral traits (e.g., `behavior.verbosity`)
- `knowledge` - Domain knowledge (e.g., `knowledge.python`)
- `style` - Communication style (e.g., `style.formal`)

**Trait names**:
- Use lowercase
- Use underscores for spaces
- Be descriptive and specific
- Avoid abbreviations

## Common Causes

1. **Missing category**: Trait name without category prefix
2. **Invalid category**: Using non-standard category
3. **Poor naming**: Vague or abbreviated trait names
4. **Mixed case**: Using camelCase or PascalCase
5. **Special characters**: Using hyphens or other special chars

## Remediation

Use the format `category.trait_name` with a standard category and descriptive trait name.

## Examples

### Example 1: Missing category

**⚠️ Suboptimal**
```json
{
  "metadata": {
    "genetics": {
      "traits": [
        "fast_execution",
        "good_documentation"
      ]
    }
  }
}
```

**✅ Recommended**
```json
{
  "metadata": {
    "genetics": {
      "traits": [
        "performance.fast_execution",
        "capability.good_documentation"
      ]
    }
  }
}
```

### Example 2: Invalid category

**⚠️ Suboptimal**
```json
{
  "metadata": {
    "genetics": {
      "traits": [
        "misc.something",
        "other.stuff"
      ]
    }
  }
}
```

**✅ Recommended**
```json
{
  "metadata": {
    "genetics": {
      "traits": [
        "capability.code_analysis",
        "behavior.detailed_responses"
      ]
    }
  }
}
```

### Example 3: Poor naming

**⚠️ Suboptimal**
```json
{
  "metadata": {
    "genetics": {
      "traits": [
        "capability.fast",
        "behavior.good"
      ]
    }
  }
}
```

**✅ Recommended**
```json
{
  "metadata": {
    "genetics": {
      "traits": [
        "performance.low_latency_responses",
        "behavior.concise_explanations"
      ]
    }
  }
}
```

### Example 4: Mixed case

**⚠️ Suboptimal**
```json
{
  "metadata": {
    "genetics": {
      "traits": [
        "capability.codeGeneration",
        "knowledge.TypeScript"
      ]
    }
  }
}
```

**✅ Recommended**
```json
{
  "metadata": {
    "genetics": {
      "traits": [
        "capability.code_generation",
        "knowledge.typescript"
      ]
    }
  }
}
```

## Standard Trait Catalog

### Capability Traits

| Trait | Description |
|-------|-------------|
| `capability.code_generation` | Generates code efficiently |
| `capability.code_review` | Reviews code for quality |
| `capability.debugging` | Identifies and fixes bugs |
| `capability.testing` | Writes comprehensive tests |
| `capability.documentation` | Creates clear documentation |
| `capability.refactoring` | Improves code structure |

### Performance Traits

| Trait | Description |
|-------|-------------|
| `performance.low_latency` | Fast response times |
| `performance.high_throughput` | Handles many requests |
| `performance.cost_efficient` | Minimizes token usage |
| `performance.accurate` | High accuracy in outputs |
| `performance.reliable` | Consistent performance |

### Behavior Traits

| Trait | Description |
|-------|-------------|
| `behavior.verbose` | Detailed explanations |
| `behavior.concise` | Brief, to-the-point responses |
| `behavior.creative` | Innovative solutions |
| `behavior.conservative` | Cautious, safe approaches |
| `behavior.collaborative` | Works well with other agents |

### Knowledge Traits

| Trait | Description |
|-------|-------------|
| `knowledge.python` | Expert in Python |
| `knowledge.typescript` | Expert in TypeScript |
| `knowledge.kubernetes` | Expert in Kubernetes |
| `knowledge.security` | Security expertise |
| `knowledge.machine_learning` | ML expertise |

### Style Traits

| Trait | Description |
|-------|-------------|
| `style.formal` | Professional communication |
| `style.casual` | Friendly communication |
| `style.technical` | Deep technical detail |
| `style.beginner_friendly` | Simple explanations |

## Trait Inheritance in Breeding

Traits are inherited during breeding:

```json
{
  "metadata": {
    "genetics": {
      "generation": 1,
      "parent_dids": [
        "did:ossa:parent1",
        "did:ossa:parent2"
      ],
      "traits": [
        "capability.code_generation",      // From parent1
        "performance.cost_efficient",       // From parent2
        "behavior.creative"                 // Mutation
      ],
      "mutations": [
        {
          "trait": "behavior.creative",
          "source": "mutation",
          "generation": 1
        }
      ]
    }
  }
}
```

## Trait Validation

**Pattern**: `^[a-z_]+\\.[a-z_]+$`

```typescript
const TRAIT_PATTERN = /^[a-z_]+\.[a-z_]+$/;
const VALID_CATEGORIES = [
  'capability',
  'performance',
  'behavior',
  'knowledge',
  'style'
];

function isValidTrait(trait: string): boolean {
  if (!TRAIT_PATTERN.test(trait)) {
    return false;
  }

  const [category] = trait.split('.');
  return VALID_CATEGORIES.includes(category);
}

// Valid
isValidTrait('capability.code_generation'); // true
isValidTrait('performance.low_latency');    // true

// Invalid
isValidTrait('fast');                       // false (no category)
isValidTrait('misc.something');             // false (invalid category)
isValidTrait('capability.codeGen');         // false (camelCase)
```

## Trait Discovery

Traits enable:
- **Agent breeding**: Select parents with desirable traits
- **Agent discovery**: Find agents with specific capabilities
- **Performance optimization**: Breed for specific traits
- **Team composition**: Build teams with complementary traits

Example search:
```typescript
// Find agents with code generation capability
const agents = await registry.findByTrait('capability.code_generation');

// Find fast, cost-efficient agents
const efficientAgents = await registry.findByTraits([
  'performance.low_latency',
  'performance.cost_efficient'
]);
```

## Best Practices

1. **Use standard categories**: Stick to the 5 core categories
2. **Be specific**: `capability.python_code_generation` > `capability.coding`
3. **Document traits**: Explain what each trait means in your system
4. **Track inheritance**: Document trait sources (parent vs mutation)
5. **Measure impact**: Track how traits affect fitness scores

## Related Errors

- [OSSA-200](./ossa-200.md) - Invalid generation number
- [OSSA-201](./ossa-201.md) - Missing parent DIDs
- [OSSA-203](./ossa-203.md) - Invalid fitness score
- [OSSA-211](./ossa-211.md) - Generation mismatch with parents

## Debugging Tips

1. **Check format**: Ensure `category.trait_name` format
2. **Verify category**: Use one of the 5 standard categories
3. **Use lowercase**: Convert to lowercase if needed
4. **Be descriptive**: Replace vague names with specific ones
5. **Reference catalog**: Use standard traits when possible

## Schema Reference

```json
{
  "genetics": {
    "type": "object",
    "properties": {
      "traits": {
        "type": "array",
        "items": {
          "type": "string",
          "pattern": "^[a-z_]+\\.[a-z_]+$"
        },
        "description": "Inherited traits (format: category.trait_name)"
      }
    }
  }
}
```

## Documentation

- [Genetics & Breeding Guide](../guides/genetics.md)
- [Trait Catalog](../guides/trait-catalog.md)
- [Revolutionary Features](../guides/revolutionary-features.md)
- [Error Catalog](./catalog.md)

## Support

If you need help with traits:
1. Review the [standard trait catalog](../guides/trait-catalog.md)
2. Check [breeding examples](../../examples/genetics/)
3. Join our [Discord community](https://discord.gg/openstandardagents)
4. Open an issue on [GitHub](https://github.com/bluefly-ai/openstandardagents/issues)
