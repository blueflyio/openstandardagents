# Drupal MCP Server - Quick Start Guide

Get up and running with Drupal MCP Server in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- Drupal 10+ site with REST/JSON:API enabled
- OAuth2, API Key, or JWT authentication configured on Drupal

## 1. Install

```bash
npm install -g @bluefly/drupal-mcp-server
```

## 2. Configure Drupal

### Enable Required Modules

```bash
drush en rest jsonapi serialization basic_auth simple_oauth -y
```

### Set Up OAuth2 (Recommended)

```bash
# Install simple_oauth
composer require drupal/simple_oauth
drush en simple_oauth -y

# Generate keys
mkdir -p keys
openssl genrsa -out keys/private.key 2048
openssl rsa -in keys/private.key -pubout > keys/public.key

# Configure at /admin/config/people/simple_oauth
# Create OAuth2 client at /admin/config/services/consumer
```

## 3. Configure Environment

Create `.env` file:

```bash
DRUPAL_BASE_URL=https://your-drupal-site.com
DRUPAL_AUTH_TYPE=oauth2
DRUPAL_CLIENT_ID=your-client-id
DRUPAL_CLIENT_SECRET=your-client-secret
```

## 4. Test Connection

```bash
drupal-mcp-server
```

Server should start without errors.

## 5. Integrate with Claude Desktop

### macOS

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "drupal": {
      "command": "drupal-mcp-server",
      "env": {
        "DRUPAL_BASE_URL": "https://your-site.com",
        "DRUPAL_AUTH_TYPE": "oauth2",
        "DRUPAL_CLIENT_ID": "your-client-id",
        "DRUPAL_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

### Windows

Edit `%APPDATA%\Claude\claude_desktop_config.json` with same config.

### Linux

Edit `~/.config/Claude/claude_desktop_config.json` with same config.

## 6. Restart Claude Desktop

Quit and reopen Claude Desktop to load the MCP server.

## 7. Test in Claude

Ask Claude:

```
"Create a new article titled 'Test Article' with body 'This is a test'"
```

Claude will use the `drupal_create_node` tool automatically.

## Common Issues

### Authentication Failed

Check:
- OAuth2 client credentials are correct
- Keys are generated and configured
- User has proper permissions

### Connection Refused

Check:
- `DRUPAL_BASE_URL` is correct
- Drupal site is accessible
- REST/JSON:API modules are enabled

### Module Not Found

- Restart Claude Desktop
- Check config file syntax
- Verify server starts: `drupal-mcp-server`

## Available Tools

### Content (5 tools)
- `drupal_create_node` - Create content
- `drupal_update_node` - Update content
- `drupal_delete_node` - Delete content
- `drupal_get_node` - Get content
- `drupal_search_content` - Search content

### Entities (4 tools)
- `drupal_create_entity` - Create entity
- `drupal_update_entity` - Update entity
- `drupal_delete_entity` - Delete entity
- `drupal_query_entities` - Query entities

### Views (2 tools)
- `drupal_execute_view` - Execute view
- `drupal_get_view_results` - Get view results

### Users (3 tools)
- `drupal_create_user` - Create user
- `drupal_update_user` - Update user
- `drupal_get_user` - Get user

### Config (2 tools)
- `drupal_get_config` - Get config
- `drupal_set_config` - Set config

### Modules (3 tools)
- `drupal_list_modules` - List modules
- `drupal_enable_module` - Enable modules
- `drupal_disable_module` - Disable modules

### Cache (2 tools)
- `drupal_clear_cache` - Clear cache
- `drupal_rebuild_cache` - Rebuild cache

## Next Steps

- Read [README.md](./README.md) for full documentation
- Check [examples/usage.ts](./examples/usage.ts) for code examples
- See [API.md](./API.md) for API reference (if available)

## Support

- Issues: https://gitlab.com/blueflyio/drupal-mcp-server/-/issues
- Documentation: https://docs.bluefly.io/drupal-mcp-server
- Discord: https://discord.gg/bluefly
