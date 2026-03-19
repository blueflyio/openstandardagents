# OSSA cURL Scripts

Shell script examples demonstrating OSSA API usage with cURL and jq.

## Features

- **Simple Shell Scripts**: Easy-to-understand bash scripts
- **Complete Coverage**: Examples for all major API operations
- **Production Ready**: Error handling and environment variable support
- **jq Integration**: JSON parsing and formatting with jq

## Prerequisites

- bash
- curl
- jq (for JSON parsing)

Install jq:

```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# RHEL/CentOS
sudo yum install jq
```

## Configuration

Set environment variables:

```bash
# Required for authenticated operations
export OSSA_TOKEN=ossa_tok_xxx

# Optional: Override base URL
export OSSA_BASE_URL=https://registry.openstandardagents.org/api/v1
```

## Examples

### 1. Search Agents

Search and filter agents using various criteria:

```bash
./01-search-agents.sh
```

Features:
- Search by domain (security, infrastructure, etc.)
- Full-text search
- Filter by capability
- Filter by verified publishers
- Filter by compliance profile
- Pagination
- Combined filters

### 2. Get Agent Details

Retrieve detailed information about agents:

```bash
# Use default agent
./02-get-agent-details.sh

# Specify publisher and agent name
./02-get-agent-details.sh blueflyio security-scanner
```

Features:
- Get latest version details
- List all versions
- Get specific version
- Get dependencies
- Get download statistics

### 3. Publish Agent

Publish an agent to the registry (requires authentication):

```bash
export OSSA_TOKEN=ossa_tok_xxx
./03-publish-agent.sh
```

Features:
- Complete manifest submission
- Package information
- Documentation URLs
- License and keywords
- Verification status

### 4. A2A Messaging

Agent-to-agent messaging operations:

```bash
export OSSA_TOKEN=ossa_tok_xxx
./04-a2a-messaging.sh
```

Features:
- Send A2A messages
- Check message status
- Broadcast messages
- Register webhooks
- List webhooks
- Subscribe to events

### 5. Discovery

Discover agents by taxonomy, capabilities, and compliance:

```bash
./05-discovery.sh
```

Features:
- List taxonomies
- List capabilities
- Get capability details
- List compliance profiles
- Discover by taxonomy
- Discover by compliance
- Get recommendations

## API Endpoints

All scripts use the OSSA Registry API:

```
Base URL: https://registry.openstandardagents.org/api/v1
```

### Public Endpoints (No Auth)

- `GET /agents` - Search agents
- `GET /agents/{publisher}/{name}` - Get agent details
- `GET /agents/{publisher}/{name}/versions` - List versions
- `GET /specification/taxonomies` - List taxonomies
- `GET /specification/capabilities` - List capabilities
- `GET /specification/compliance` - List compliance profiles

### Authenticated Endpoints

- `POST /agents` - Publish agent
- `DELETE /agents/{publisher}/{name}/{version}` - Unpublish
- `POST /agents/{publisher}/{name}/{version}/deprecate` - Deprecate
- `POST /messaging/send` - Send A2A message
- `POST /messaging/broadcast` - Broadcast message
- `POST /messaging/webhooks` - Register webhook
- `POST /messaging/subscriptions` - Subscribe to events

## Authentication

OSSA API supports Bearer token authentication:

```bash
curl -H "Authorization: Bearer ${OSSA_TOKEN}" \
  https://registry.openstandardagents.org/api/v1/agents
```

Get a token:
1. Visit https://registry.openstandardagents.org
2. Sign in with your account
3. Navigate to Settings > API Tokens
4. Generate a new token

## Response Format

All responses are JSON. Use jq for parsing:

```bash
# Get agent names only
curl -s "${BASE_URL}/agents?domain=security" | jq '.agents[].name'

# Pretty print
curl -s "${BASE_URL}/agents" | jq '.'

# Extract specific fields
curl -s "${BASE_URL}/agents" | jq '.agents[] | {name, version, rating}'
```

## Error Handling

Scripts include error handling:

```bash
RESPONSE=$(curl -s -w "\n%{http_code}" "${URL}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "Success!"
  echo "$BODY" | jq '.'
else
  echo "Error: HTTP $HTTP_CODE"
  echo "$BODY" | jq '.'
  exit 1
fi
```

## Rate Limiting

The API includes rate limits:
- Authenticated: 1000 requests/hour
- Unauthenticated: 100 requests/hour

Check rate limit headers:

```bash
curl -I "${BASE_URL}/agents" | grep -i ratelimit
# X-RateLimit-Limit: 1000
# X-RateLimit-Remaining: 999
# X-RateLimit-Reset: 1234567890
```

## Common Parameters

### Search Parameters

- `q` - Full-text search query
- `domain` - Filter by domain
- `capability` - Filter by capability
- `publisher` - Filter by publisher
- `verified` - Only verified publishers (true/false)
- `min_rating` - Minimum rating (1-5)
- `sort` - Sort order (downloads, rating, updated, created, relevance)
- `limit` - Results per page (max 100)
- `offset` - Pagination offset

### Message Parameters

- `from` - Sender information
- `to` - Recipient information
- `type` - Message type (request, response, event, broadcast)
- `capability` - Target capability
- `payload` - Message payload (JSON object)
- `metadata` - Message metadata (correlation_id, priority, ttl)

## Troubleshooting

**jq: command not found**
```bash
# Install jq (see Prerequisites section)
brew install jq  # macOS
```

**401 Unauthorized**
```bash
# Check token is set
echo $OSSA_TOKEN

# Ensure token is valid
export OSSA_TOKEN=ossa_tok_xxx
```

**429 Rate Limited**
```bash
# Wait for rate limit reset
# Check X-RateLimit-Reset header for reset time
```

## Resources

- [OSSA Documentation](https://docs.openstandardagents.org)
- [API Reference](https://registry.openstandardagents.org/docs)
- [cURL Documentation](https://curl.se/docs/)
- [jq Manual](https://stedolan.github.io/jq/manual/)

## License

Apache-2.0
