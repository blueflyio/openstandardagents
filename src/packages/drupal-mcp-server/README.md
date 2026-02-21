# Drupal MCP Server

Production-grade Model Context Protocol (MCP) server for Drupal operations. Provides 20+ tools for comprehensive Drupal management via AI agents.

## Features

- **20+ Production Tools** across 7 categories
- **Multiple Auth Methods**: OAuth2, API Key, JWT
- **Full CRUD Operations**: Content, entities, users, configuration
- **REST & JSON:API Support**
- **Claude Desktop Integration**
- **OSSA Agent Compatible**
- **TypeScript Native**

## Tool Categories

### Content Management (5 tools)
- `drupal_create_node` - Create content
- `drupal_update_node` - Update content
- `drupal_delete_node` - Delete content
- `drupal_get_node` - Retrieve content
- `drupal_search_content` - Search content

### Entity Operations (4 tools)
- `drupal_create_entity` - Create any entity
- `drupal_update_entity` - Update any entity
- `drupal_delete_entity` - Delete entity
- `drupal_query_entities` - Query entities

### Views Integration (2 tools)
- `drupal_execute_view` - Execute view
- `drupal_get_view_results` - Get view results with pagination

### User Management (3 tools)
- `drupal_create_user` - Create user account
- `drupal_update_user` - Update user account
- `drupal_get_user` - Get user details

### Configuration (2 tools)
- `drupal_get_config` - Get configuration
- `drupal_set_config` - Set configuration

### Module Management (3 tools)
- `drupal_list_modules` - List modules/themes
- `drupal_enable_module` - Enable modules
- `drupal_disable_module` - Disable modules

### Cache Operations (2 tools)
- `drupal_clear_cache` - Clear cache
- `drupal_rebuild_cache` - Rebuild cache

## Installation

### npm

```bash
npm install @bluefly/drupal-mcp-server
```

### Global Installation

```bash
npm install -g @bluefly/drupal-mcp-server
```

### From Source

```bash
git clone https://gitlab.com/blueflyio/drupal-mcp-server.git
cd drupal-mcp-server
npm install
npm run build
```

## Quick Start

### 1. Configure Environment

Create a `.env` file:

```bash
# Required
DRUPAL_BASE_URL=https://your-drupal-site.com
DRUPAL_AUTH_TYPE=oauth2

# OAuth2 (recommended)
DRUPAL_CLIENT_ID=your-client-id
DRUPAL_CLIENT_SECRET=your-client-secret
```

### 2. Run the Server

```bash
# Using npm
npx drupal-mcp-server

# Using global install
drupal-mcp-server

# Development mode
npm run dev
```

## Authentication

### OAuth2 (Recommended)

**Drupal Setup:**

1. Install `simple_oauth` module:
   ```bash
   composer require drupal/simple_oauth
   drush en simple_oauth
   ```

2. Generate keys:
   ```bash
   mkdir -p keys
   openssl genrsa -out keys/private.key 2048
   openssl rsa -in keys/private.key -pubout > keys/public.key
   ```

3. Configure at `/admin/config/people/simple_oauth`

4. Create OAuth2 client at `/admin/config/services/consumer`

**Environment:**
```bash
DRUPAL_AUTH_TYPE=oauth2
DRUPAL_CLIENT_ID=your-client-id
DRUPAL_CLIENT_SECRET=your-client-secret

# Optional: Password grant
DRUPAL_USERNAME=admin
DRUPAL_PASSWORD=password
```

### API Key

**Drupal Setup:**

Install custom API key module or use `key_auth` contrib module.

**Environment:**
```bash
DRUPAL_AUTH_TYPE=api-key
DRUPAL_API_KEY=your-api-key
```

### JWT

**Drupal Setup:**

1. Install `jwt` module:
   ```bash
   composer require drupal/jwt
   drush en jwt
   ```

2. Configure JWT settings

**Environment:**
```bash
DRUPAL_AUTH_TYPE=jwt
DRUPAL_JWT_TOKEN=your-jwt-token
```

## Claude Desktop Integration

### macOS

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "drupal": {
      "command": "node",
      "args": ["/path/to/drupal-mcp-server/dist/index.js"],
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

Edit `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "drupal": {
      "command": "node",
      "args": ["C:\\path\\to\\drupal-mcp-server\\dist\\index.js"],
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

### Linux

Edit `~/.config/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "drupal": {
      "command": "node",
      "args": ["/path/to/drupal-mcp-server/dist/index.js"],
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

## Usage Examples

### Content Management

**Create a Node:**
```typescript
// In Claude Desktop or MCP client
"Create a new article titled 'Hello World' with body 'This is a test'"

// Tool call
{
  "tool": "drupal_create_node",
  "arguments": {
    "type": "article",
    "title": "Hello World",
    "body": "This is a test",
    "status": true
  }
}
```

**Update a Node:**
```typescript
{
  "tool": "drupal_update_node",
  "arguments": {
    "nid": "123",
    "title": "Updated Title",
    "body": "Updated content"
  }
}
```

**Search Content:**
```typescript
{
  "tool": "drupal_search_content",
  "arguments": {
    "type": "article",
    "status": true,
    "limit": 10
  }
}
```

### Entity Operations

**Create a Taxonomy Term:**
```typescript
{
  "tool": "drupal_create_entity",
  "arguments": {
    "entity_type": "taxonomy_term",
    "bundle": "tags",
    "attributes": {
      "name": "New Tag"
    }
  }
}
```

**Query Entities:**
```typescript
{
  "tool": "drupal_query_entities",
  "arguments": {
    "entity_type": "node",
    "bundle": "article",
    "filters": {
      "status": true
    },
    "sort": {
      "created": "DESC"
    },
    "limit": 20
  }
}
```

### Views Integration

**Execute a View:**
```typescript
{
  "tool": "drupal_execute_view",
  "arguments": {
    "view_id": "content",
    "display_id": "rest_export_1",
    "filters": {
      "type": "article"
    },
    "page": 0,
    "items_per_page": 10
  }
}
```

### User Management

**Create a User:**
```typescript
{
  "tool": "drupal_create_user",
  "arguments": {
    "name": "newuser",
    "mail": "user@example.com",
    "pass": "secure-password",
    "roles": ["editor"]
  }
}
```

### Configuration

**Get Configuration:**
```typescript
{
  "tool": "drupal_get_config",
  "arguments": {
    "name": "system.site"
  }
}
```

**Set Configuration:**
```typescript
{
  "tool": "drupal_set_config",
  "arguments": {
    "name": "system.site",
    "data": {
      "name": "My Drupal Site",
      "slogan": "Welcome to our site"
    }
  }
}
```

### Module Management

**List Modules:**
```typescript
{
  "tool": "drupal_list_modules",
  "arguments": {
    "type": "module",
    "status": true
  }
}
```

**Enable Modules:**
```typescript
{
  "tool": "drupal_enable_module",
  "arguments": {
    "modules": ["views", "media"]
  }
}
```

### Cache Operations

**Clear Cache:**
```typescript
{
  "tool": "drupal_clear_cache",
  "arguments": {
    "bin": "render",
    "tags": ["node:123"]
  }
}
```

**Rebuild Cache:**
```typescript
{
  "tool": "drupal_rebuild_cache",
  "arguments": {
    "rebuild_theme_registry": true,
    "rebuild_menu": true
  }
}
```

## OSSA Integration

### Agent Manifest

```yaml
name: drupal-agent
version: 1.0.0
type: tool-agent

capabilities:
  mcp:
    - drupal-mcp-server

tools:
  - drupal_create_node
  - drupal_update_node
  - drupal_search_content
  - drupal_query_entities
  - drupal_execute_view

config:
  drupal:
    base_url: ${DRUPAL_BASE_URL}
    auth_type: oauth2
    client_id: ${DRUPAL_CLIENT_ID}
    client_secret: ${DRUPAL_CLIENT_SECRET}
```

### Optional: Using with BuildKit

OSSA does not depend on BuildKit. For teams that use it:

```bash
# Start agent with Drupal MCP
buildkit agent start drupal-agent --mcp drupal-mcp-server

# Execute Drupal operations
buildkit agent run drupal-agent "Create a new article about AI"
```

## Development

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run watch
```

### Development Server

```bash
npm run dev
```

### Testing

```bash
npm test
npm run test:watch
```

### Linting

```bash
npm run lint
npm run format
```

## Troubleshooting

### Authentication Errors

**OAuth2 Token Issues:**
- Verify `simple_oauth` module is enabled
- Check keys are generated and configured
- Ensure client credentials are correct
- Verify user permissions

**API Key Issues:**
- Confirm API key module is installed
- Check key is valid and active
- Verify permissions

### Connection Errors

**Cannot Connect to Drupal:**
- Verify `DRUPAL_BASE_URL` is correct
- Check Drupal REST/JSON:API is enabled
- Confirm CORS settings if needed
- Test connectivity: `curl $DRUPAL_BASE_URL/jsonapi`

### Permission Errors

**403 Forbidden:**
- Check user permissions in Drupal
- Verify OAuth2 scope
- Ensure authenticated user has proper roles

### Module Not Found

**MCP Server Not Listed:**
- Verify Claude Desktop config is correct
- Restart Claude Desktop
- Check server starts without errors: `npm start`

## Architecture

### Directory Structure

```
drupal-mcp-server/
├── src/
│   ├── index.ts           # Entry point
│   ├── server.ts          # MCP server implementation
│   ├── client/
│   │   └── drupal-client.ts  # Drupal API client
│   ├── auth/
│   │   ├── oauth2.ts      # OAuth2 authentication
│   │   ├── api-key.ts     # API key authentication
│   │   └── jwt.ts         # JWT authentication
│   ├── tools/
│   │   ├── content.ts     # Content tools
│   │   ├── entities.ts    # Entity tools
│   │   ├── views.ts       # Views tools
│   │   ├── users.ts       # User tools
│   │   ├── config.ts      # Config tools
│   │   ├── modules.ts     # Module tools
│   │   └── cache.ts       # Cache tools
│   └── types/
│       └── drupal.ts      # Type definitions
├── tests/                 # Test files
├── examples/              # Usage examples
└── dist/                  # Compiled output
```

### Design Principles

- **Modular Architecture**: Each tool category in separate file
- **Type Safety**: Full TypeScript coverage
- **Error Handling**: Comprehensive error messages
- **Authentication**: Multiple auth strategies
- **Extensibility**: Easy to add new tools
- **Performance**: Efficient API client with token caching

## API Reference

See [API.md](./API.md) for complete API documentation.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Support

- **Issues**: https://gitlab.com/blueflyio/drupal-mcp-server/-/issues
- **Documentation**: https://docs.bluefly.io/drupal-mcp-server
- **Community**: https://discord.gg/bluefly

## Related Projects

- [OSSA](https://gitlab.com/blueflyio/openstandardagents) - Agent orchestration
- [Agent BuildKit](https://gitlab.com/blueflyio/agent-buildkit) - Agent development toolkit
- [MCP SDK](https://github.com/anthropics/model-context-protocol) - Model Context Protocol

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history.
