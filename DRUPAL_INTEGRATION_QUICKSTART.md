# OSSA ↔ Drupal Integration Quick Start

**For developers who want to get started immediately**

---

## 5-Minute Setup

### Prerequisites Check

```bash
# Verify you have:
node --version      # v20+
php --version       # 8.3+
composer --version  # 2.0+
drush --version     # 12+
docker --version    # 20+
```

### Step 1: Install OSSA Buildkit

```bash
npm install -g @ossa/buildkit
ossa --version
```

### Step 2: Install Drupal Site

```bash
# Quick install
composer create-project drupal/recommended-project mysite
cd mysite
composer require drupal/ai_agents drupal/ai_agents_ui drupal/ai_agents_ossa
drush site:install --account-name=admin --account-pass=admin
drush pm:enable ai_agents ai_agents_ui ai_agents_ossa
```

### Step 3: Start Bridge Server

```bash
# Option A: Docker (recommended)
docker run -d -p 9090:9090 --name ossa-bridge ossa/runtime-bridge:latest

# Option B: NPM
npm install -g @ossa/runtime-bridge
ossa-runtime-bridge start
```

### Step 4: Configure Drupal

```bash
# Add bridge URL to settings
echo "\$settings['ossa_runtime_bridge_url'] = 'http://localhost:9090';" >> web/sites/default/settings.php
drush cache:rebuild
```

### Step 5: Create Your First Agent

```bash
# Create manifest
mkdir agents
cat > agents/hello-world.yaml <<'EOF'
apiVersion: ossa/v0.4.1
kind: Agent
metadata:
  name: hello-world
  version: 1.0.0
spec:
  type: autonomous
  runtime:
    environment: drupal
  capabilities:
    - greeting
EOF

# Generate Drupal module
ossa export --platform drupal \
  --manifest agents/hello-world.yaml \
  --output web/modules/custom/

# Install module
drush pm:enable hello_world

# Test it
drush ai-agents:execute hello-world --context='{"name":"World"}'
```

**Done!** You now have a working OSSA + Drupal integration.

---

## Common Commands

### OSSA Buildkit

```bash
# Export to Drupal module
ossa export --platform drupal --manifest agents/my-agent.yaml --output modules/custom/

# Export to Drupal config
ossa export --platform drupal-config --manifest agents/my-agent.yaml --output config/sync/

# Validate manifest
ossa validate agents/my-agent.yaml

# List available platforms
ossa export --help
```

### Drupal (Drush)

```bash
# List agents
drush ai-agents:list

# Execute agent
drush ai-agents:execute AGENT_ID --context='{"key":"value"}'

# Import config
drush config:import

# Export manifest back to OSSA format
drush ai-agents-ossa:export AGENT_ID --output agents/AGENT_ID.yaml

# Check sync status
drush ai-agents-ossa:validate-sync

# Enable debug mode
drush config:set ai_agents_ossa.settings debug true
```

### Bridge Server

```bash
# Check health
curl http://localhost:9090/health

# View logs (Docker)
docker logs -f ossa-bridge

# Restart bridge
docker restart ossa-bridge

# Stop bridge
docker stop ossa-bridge
```

---

## File Structure Overview

```
project/
├── agents/                          # OSSA manifests (source of truth)
│   └── my-agent.yaml
│
├── web/
│   ├── modules/custom/
│   │   └── my_agent/               # Generated Drupal module
│   │       ├── my_agent.info.yml
│   │       ├── my_agent.services.yml
│   │       └── src/
│   │           └── Plugin/
│   │               └── Agent/
│   │                   └── MyAgent.php
│   │
│   └── sites/default/
│       └── settings.php            # Configure bridge URL here
│
└── config/sync/                     # Drupal configuration
    ├── ossa_manifest.my_agent.yml
    └── ossa_agent.my_agent.yml
```

---

## Integration Workflow

```
1. Edit OSSA manifest (agents/*.yaml)
   ↓
2. Generate Drupal code
   ossa export --platform drupal
   ↓
3. Install module
   drush pm:enable my_agent
   ↓
4. Execute agent
   drush ai-agents:execute my_agent
   ↓
5. Agent calls bridge server (http://localhost:9090)
   ↓
6. Bridge executes OSSA runtime
   ↓
7. Results returned to Drupal
```

---

## Troubleshooting Quick Fixes

### Bridge server not responding

```bash
# Check if running
docker ps | grep ossa-bridge

# Restart
docker restart ossa-bridge

# Check logs
docker logs ossa-bridge
```

### Module not found after generation

```bash
# Clear Drupal cache
drush cache:rebuild

# Rebuild plugin cache
drush php:eval "\\Drupal::service('plugin.cache_clearer')->clearCachedDefinitions();"

# Verify module exists
ls -la web/modules/custom/my_agent/
```

### Agent execution fails

```bash
# Enable debug logging
drush config:set ai_agents_ossa.settings debug true

# Check Drupal logs
drush watchdog:tail

# Check bridge logs
docker logs ossa-bridge

# Test bridge directly
curl -X POST http://localhost:9090/api/execute \
  -H "Content-Type: application/json" \
  -d '{"manifest": {...}, "context": {...}}'
```

### Config import fails

```bash
# Validate manifest first
ossa validate agents/my-agent.yaml

# Check config schema
drush config:inspect ossa_manifest.my_agent

# Import with verbose output
drush config:import --partial -v
```

---

## Development Tips

### Local Development Workflow

1. **Edit manifest** in `agents/*.yaml`
2. **Regenerate module**: `ossa export --platform drupal ...`
3. **Clear cache**: `drush cache:rebuild`
4. **Test**: `drush ai-agents:execute ...`
5. **Iterate**: Repeat steps 1-4

### Testing Your Agent

```bash
# Unit test (PHP)
vendor/bin/phpunit web/modules/custom/my_agent/tests/

# Integration test (execute)
drush ai-agents:execute my_agent --test

# Debug execution
drush ai-agents:execute my_agent --context='{"debug":true}' --debug
```

### Debugging

```bash
# Enable all debugging
drush config:set ai_agents_ossa.settings debug true
drush config:set system.logging error_level verbose
docker exec ossa-bridge sh -c 'export LOG_LEVEL=debug && pm2 restart all'

# Tail all logs
drush watchdog:tail &
docker logs -f ossa-bridge &

# Execute with full output
drush ai-agents:execute my_agent --context='{}' -vvv
```

---

## Next Steps

1. Read full architecture: `DRUPAL_INTEGRATION_ARCHITECTURE.md`
2. Explore example agents: `examples/agents/`
3. Write custom plugins: See Drupal Plugin API docs
4. Setup CI/CD: See deployment section in architecture doc
5. Join community: https://ossa.dev/community

---

## Quick Reference Links

- **OSSA Spec**: https://ossa.dev/spec/v0.4.1
- **Drupal AI Agents**: https://drupal.org/project/ai_agents
- **Bridge Server Repo**: https://github.com/ossa/runtime-bridge
- **API Docs**: https://ossa.dev/api/drupal
- **Community Chat**: https://discord.gg/ossa

---

**Need Help?**

- File issues: https://github.com/ossa/buildkit/issues
- Ask questions: https://stackoverflow.com/questions/tagged/ossa
- Read docs: https://ossa.dev/docs
