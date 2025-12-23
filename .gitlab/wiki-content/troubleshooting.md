<!--
OSSA Troubleshooting Guide
Purpose: Help users solve common problems
Audience: All OSSA users
Educational Focus: Solutions to frequent issues
-->

# Troubleshooting

## Validation Errors

### Error: Missing required field

**Problem:**
```
ValidationError: Missing required field 'version'
```

**Solution:**
Add the missing field:
```json
{
  "agent": {
    "version": "1.0.0"
  }
}
```

### Error: Invalid name format

**Problem:**
```
ValidationError: Invalid name format 'MyAgent'
```

**Solution:**
Use lowercase with hyphens:
```json
{
  "agent": {
    "name": "my-agent"
  }
}
```

### Error: Schema reference not found

**Problem:**
```
ValidationError: Schema reference '#/components/schemas/Input' not found
```

**Solution:**
Define the schema:
```json
{
  "components": {
    "schemas": {
      "Input": {
        "type": "object"
      }
    }
  }
}
```

## CLI Issues

### Command not found

**Problem:**
```bash
ossa: command not found
```

**Solution:**
```bash
npm install -g @bluefly/openstandardagents
```

### Permission denied

**Problem:**
```bash
EACCES: permission denied
```

**Solution:**
```bash
sudo npm install -g @bluefly/openstandardagents
# or use nvm
```

## Type Generation Issues

### Types not generated

**Problem:**
No output from `ossa generate types`

**Solution:**
```bash
# Check validation first
ossa validate agent.json

# Generate with verbose output
ossa generate types agent.json --verbose
```

## Common Mistakes

### Using `any` type
❌ Don't use permissive types
✅ Define explicit schemas

### Skipping validation
❌ Don't skip `ossa validate`
✅ Always validate before deploy

### Hardcoding values
❌ Don't hardcode secrets
✅ Use environment variables

## Getting Help

1. **Check Documentation** - Read relevant guides
2. **Search Issues** - Look for similar problems
3. **Ask Community** - Open a discussion
4. **Report Bug** - Create an issue with details

## Debug Mode

```bash
# Enable debug output
DEBUG=ossa:* ossa validate agent.json

# Verbose logging
ossa validate agent.json --verbose
```

---

**Need more help?** [Open an issue](https://gitlab.com/blueflyio/openstandardagents/-/issues)
