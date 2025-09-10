# 🔧 OAAS Troubleshooting Guide

> **When things go wrong, this guide helps you fix them quickly.**

## 🚨 Emergency Quick Fixes

### Agent Not Working At All?
```bash
# 1. Check file exists and is valid YAML
cat .agents/my-agent/agent.yml
yamllint .agents/my-agent/agent.yml

# 2. Validate against schema
oaas validate .agents/my-agent/agent.yml

# 3. Check required fields
grep -E "^(name|version|capabilities):" agent.yml

# 4. Test with minimal config
echo "name: test
version: 1.0.0
capabilities:
  - test: 'Test capability'" > test.yml
oaas validate test.yml
```

---

## 📝 Common Issues & Solutions

### 1. Discovery Issues

#### Problem: "Agent not found by scanner"
```bash
# Symptom
oaas scan
# Returns: No agents found
```

**Solution A: Check file location**
```bash
# ✅ Correct locations
.agents/my-agent/agent.yml
agents/my-agent/agent.yml
services/agents/my-agent/agent.yml

# ❌ Wrong locations
.agents/agent.yml           # Missing agent directory
.agents/my-agent/agent.yaml # Wrong extension
agents/my-agent.yml         # Not in subdirectory
```

**Solution B: Check file name**
```bash
# ✅ Correct
agent.yml

# ❌ Wrong
agent.yaml
agents.yml
config.yml
```

**Solution C: Check YAML syntax**
```yaml
# ✅ Correct indentation (2 spaces)
name: my-agent
capabilities:
  - analyze: "Description"

# ❌ Wrong indentation (tabs or wrong spaces)
name: my-agent
capabilities:
    - analyze: "Description"  # 4 spaces
```

---

### 2. Validation Errors

#### Problem: "Invalid agent configuration"
```bash
# Symptom
oaas validate agent.yml
# Error: Invalid configuration
```

**Solution: Check required fields by level**

**Level 1 Requirements:**
```yaml
# Minimum required fields
name: agent-name        # Required
version: "1.0.0"       # Required
capabilities:          # Required
  - name: "description"
```

**Level 2+ Requirements:**
```yaml
# Additional required fields
openapi: "./openapi.yaml"  # Required for Level 2+
frameworks:                # Required for Level 2+
  langchain:
    enabled: true
```

---

### 3. Framework Bridge Issues

#### Problem: "LangChain tool creation fails"
```python
# Symptom
tool = agent.to_langchain_tool()
# Error: Tool creation failed
```

**Solution:**
```yaml
# Check framework is enabled
frameworks:
  langchain:
    enabled: true  # Must be true
    tool_type: "structured"  # Must be valid type
```

#### Problem: "MCP server not recognized by Claude"
```bash
# Symptom: Claude Desktop doesn't show your agent
```

**Solution:**
```bash
# 1. Generate proper MCP config
oaas export --format=mcp > mcp-server.json

# 2. Check server is running
curl http://localhost:3100/health

# 3. Check Claude config directory
ls ~/Library/Application\ Support/Claude/servers/

# 4. Restart Claude Desktop
killall Claude && open -a Claude
```

#### Problem: "CrewAI agent not delegating"
```python
# Symptom
crew.kickoff()
# Agent doesn't delegate tasks
```

**Solution:**
```yaml
frameworks:
  crewai:
    enabled: true
    allow_delegation: true  # Must be true
    delegation_preferences:
      - "agent-that-exists"  # Must reference real agents
```

---

### 4. OpenAPI Specification Issues

#### Problem: "OpenAPI spec not found"
```bash
# Symptom
Error: Cannot find OpenAPI specification
```

**Solution:**
```yaml
# In agent.yml, check path
openapi: "./openapi.yaml"  # Relative to agent.yml

# Check file exists
ls -la .agents/my-agent/
# Should show: agent.yml and openapi.yaml
```

#### Problem: "OpenAPI validation fails"
```bash
# Symptom
Error: Invalid OpenAPI specification
```

**Solution:**
```yaml
# Check OpenAPI version
openapi: 3.1.0  # Use 3.1.0 or 3.0.0

# Validate separately
swagger-cli validate openapi.yaml
# or
oaas validate-openapi openapi.yaml
```

---

### 5. Capability Matching Issues

#### Problem: "Capabilities not matched during routing"
```bash
# Symptom
oaas ask "analyze code"
# Returns: No suitable agent found
```

**Solution:**
```yaml
# Use clear, descriptive capability names
capabilities:
  # ✅ Good
  - analyze_code: "Analyzes source code for quality"
  - generate_tests: "Creates unit tests"
  
  # ❌ Bad
  - ac: "Analyze"  # Too abbreviated
  - stuff: "Does stuff"  # Too vague
```

---

### 6. Performance Issues

#### Problem: "Agent discovery is slow"
```bash
# Symptom
oaas scan  # Takes >10 seconds
```

**Solution:**
```yaml
# In workspace.yml, optimize scan paths
discovery:
  scan_paths:
    - .agents  # Specific paths
  exclude_paths:
    - "**/node_modules/**"  # Exclude large dirs
    - "**/.git/**"
    - "**/dist/**"
```

#### Problem: "High memory usage"
```bash
# Symptom: Process uses >1GB RAM
```

**Solution:**
```yaml
# Level 3+ agents: Set resource limits
deployment:
  resources:
    limits:
      memory: "512Mi"
    requests:
      memory: "256Mi"
```

---

### 7. Security & Authentication Issues

#### Problem: "Authentication fails"
```bash
# Symptom
Error: 401 Unauthorized
```

**Solution for API Key:**
```yaml
integration:
  authentication:
    type: api_key
    config:
      header: "X-API-Key"  # Check header name
```

**Solution for JWT:**
```yaml
integration:
  authentication:
    type: jwt
    config:
      issuer: "https://correct-issuer.com"
      audience: "correct-audience"
```

---

### 8. Deployment Issues

#### Problem: "Docker build fails"
```bash
# Symptom
docker build -t my-agent .
# Error: Build failed
```

**Solution:**
```dockerfile
# Check Dockerfile exists
FROM node:18-alpine
WORKDIR /app
COPY agent.yml ./
COPY openapi.yaml ./
# Copy all required files
```

#### Problem: "Health check failing"
```bash
# Symptom: Container keeps restarting
```

**Solution:**
```yaml
# In agent.yml
deployment:
  health_check:
    endpoint: /health  # Ensure this endpoint exists
    interval: 30
    timeout: 5000
    success_threshold: 2  # Allow time to start
```

---

## 🔍 Debugging Techniques

### 1. Verbose Mode
```bash
# Enable verbose output
oaas validate agent.yml --verbose
oaas scan --verbose
oaas ask "test" --debug
```

### 2. Check Logs
```bash
# OAAS logs
tail -f ~/.oaas/logs/debug.log

# Framework-specific logs
tail -f ~/.langchain/logs/
tail -f ~/Library/Logs/Claude/
```

### 3. Test Incrementally
```bash
# Start with minimal config
echo "name: test
version: 1.0.0
capabilities:
  - test: 'Test'" > minimal.yml

# Validate
oaas validate minimal.yml

# Gradually add features
# Add frameworks, then OpenAPI, then security...
```

### 4. Use Validation API
```bash
# Start validation server
cd services/validation-api
npm start

# Test your agent
curl -X POST http://localhost:3003/api/v1/validate/openapi \
  -H "Content-Type: application/json" \
  -d @agent.yml
```

---

## 📊 Error Code Reference

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `OAAS-001` | Missing required field | Add missing field to agent.yml |
| `OAAS-002` | Invalid YAML syntax | Fix indentation/syntax |
| `OAAS-003` | OpenAPI spec not found | Check file path |
| `OAAS-004` | Framework not configured | Enable framework in config |
| `OAAS-005` | Capability format error | Use proper naming format |
| `OAAS-006` | Version format error | Use semantic versioning |
| `OAAS-007` | Discovery timeout | Optimize scan paths |
| `OAAS-008` | Bridge creation failed | Check framework config |
| `OAAS-009` | Authentication failed | Verify credentials |
| `OAAS-010` | Resource limit exceeded | Increase limits |

---

## 🏥 Health Check Checklist

### Daily Checks
```bash
# 1. All agents discoverable
oaas scan | grep -c "✓"

# 2. No validation errors
for agent in .agents/*/agent.yml; do
  oaas validate $agent
done

# 3. Framework bridges working
oaas test bridges --all
```

### Weekly Checks
```bash
# 1. Performance metrics
oaas metrics --period=7d

# 2. Error rates
oaas errors --period=7d

# 3. Update check
oaas version --check-updates
```

---

## 🆘 Still Stuck?

### 1. Enable Maximum Debugging
```bash
export OAAS_DEBUG=true
export OAAS_LOG_LEVEL=debug
export OAAS_TRACE=true
```

### 2. Create Minimal Reproduction
```bash
# Create smallest example that shows the problem
mkdir debug-test
cd debug-test
echo "name: debug
version: 1.0.0
capabilities:
  - test: 'Test'" > agent.yml

# Test
oaas validate agent.yml
```

### 3. Check System Requirements
```bash
# Node.js version (need 16+)
node --version

# YAML tools
yamllint --version

# Disk space
df -h

# Memory
free -h  # Linux
vm_stat  # macOS
```

### 4. Get Help
```bash
# Generate debug report
oaas debug --output=debug-report.json

# Post to:
# - GitHub Issues: with debug-report.json
# - Discord: #help channel
# - Stack Overflow: tag with 'oaas'
```

---

## 🔄 Recovery Procedures

### Reset Everything
```bash
# 1. Backup current state
cp -r .agents .agents.backup

# 2. Clean cache
rm -rf ~/.oaas/cache

# 3. Reset to defaults
oaas reset --confirm

# 4. Re-validate all agents
oaas validate --all --fix
```

### Rollback Changes
```bash
# If using git
git stash  # Save current changes
git checkout HEAD~1 .agents/  # Rollback agents
oaas validate --all  # Re-validate
```

---

**Remember**: Most issues are caused by:
1. Wrong file location or name (30% of issues)
2. YAML syntax errors (25% of issues)
3. Missing required fields (20% of issues)
4. Framework misconfiguration (15% of issues)
5. Other issues (10%)

Start with the basics before diving into complex debugging!