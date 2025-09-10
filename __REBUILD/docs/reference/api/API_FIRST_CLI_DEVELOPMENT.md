# API-First CLI Development: The Test-Driven Path

## The Complete Development Flow

```
OpenAPI Spec → API Tests → API Implementation → CLI Tests → CLI Implementation
     ↑              ↓            ↓                 ↓            ↓
     └──────── Validation ←──────┴─────────────────┴────────────┘
```

## Step 1: Design the OpenAPI Specification

Start with the contract that defines everything:

```yaml
# api/openapi.yaml
openapi: 3.1.0
info:
  title: Project API
  version: 0.1.0

paths:
  /users:
    get:
      operationId: listUsers
      summary: List all users
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            default: 10
      responses:
        '200':
          description: User list
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
                  
    post:
      operationId: createUser
      summary: Create a new user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserInput'
      responses:
        '201':
          description: User created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'

components:
  schemas:
    User:
      type: object
      required: [id, name, email]
      properties:
        id: { type: string }
        name: { type: string }
        email: { type: string, format: email }
        
    UserInput:
      type: object
      required: [name, email]
      properties:
        name: { type: string }
        email: { type: string, format: email }
```

## Step 2: Write API Tests First

Before implementing, define expected behavior:

```typescript
// server/tests/api/users.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';

describe('GET /users', () => {
  it('should return empty array initially', async () => {
    const response = await request(app)
      .get('/users')
      .expect(200);
      
    expect(response.body).toEqual([]);
  });
  
  it('should respect limit parameter', async () => {
    // Seed with test data
    await seedUsers(15);
    
    const response = await request(app)
      .get('/users?limit=5')
      .expect(200);
      
    expect(response.body).toHaveLength(5);
  });
});

describe('POST /users', () => {
  it('should create a user', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com'
    };
    
    const response = await request(app)
      .post('/users')
      .send(userData)
      .expect(201);
      
    expect(response.body).toMatchObject({
      id: expect.any(String),
      name: userData.name,
      email: userData.email
    });
  });
  
  it('should reject invalid email', async () => {
    const response = await request(app)
      .post('/users')
      .send({ name: 'John', email: 'invalid' })
      .expect(400);
      
    expect(response.body.error).toContain('email');
  });
});
```

## Step 3: Implement API Endpoints

Implement to pass the tests:

```typescript
// server/src/routes/users.ts
import { Router } from 'express';
import { validateRequest } from '../middleware/validation';
import { userSchema } from '../schemas/user';

const router = Router();
const users: User[] = [];

router.get('/users', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 10;
  res.json(users.slice(0, limit));
});

router.post('/users', 
  validateRequest(userSchema), // Auto-validate against OpenAPI
  (req, res) => {
    const user = {
      id: generateId(),
      ...req.body
    };
    users.push(user);
    res.status(201).json(user);
  }
);

export default router;
```

## Step 4: Generate API Client

Generate TypeScript client from OpenAPI:

```bash
# Generate typed client
npx openapi-typescript api/openapi.yaml -o cli/src/api/types.ts
npx openapi-typescript-codegen --input api/openapi.yaml --output cli/src/api
```

## Step 5: Write CLI Tests

Test CLI commands before implementing:

```typescript
// cli/tests/commands/users.test.ts
import { describe, it, expect, vi } from 'vitest';
import { listCommand, createCommand } from '../../src/commands/users';
import * as apiClient from '../../src/api/client';

// Mock API client
vi.mock('../../src/api/client');

describe('users list command', () => {
  it('should call API and display users', async () => {
    const mockUsers = [
      { id: '1', name: 'John', email: 'john@example.com' }
    ];
    
    vi.mocked(apiClient.listUsers).mockResolvedValue({ 
      data: mockUsers 
    });
    
    const output = await listCommand.parseAsync(['node', 'cli', '--limit', '5']);
    
    expect(apiClient.listUsers).toHaveBeenCalledWith({ limit: 5 });
    expect(output).toContain('John');
  });
});

describe('users create command', () => {
  it('should create user via API', async () => {
    const newUser = { 
      id: '1', 
      name: 'Jane', 
      email: 'jane@example.com' 
    };
    
    vi.mocked(apiClient.createUser).mockResolvedValue({ 
      data: newUser 
    });
    
    await createCommand.parseAsync([
      'node', 'cli', 
      '--name', 'Jane',
      '--email', 'jane@example.com'
    ]);
    
    expect(apiClient.createUser).toHaveBeenCalledWith({
      name: 'Jane',
      email: 'jane@example.com'
    });
  });
});
```

## Step 6: Implement CLI Commands

Finally, implement CLI using the tested API client:

```typescript
// cli/src/commands/users.ts
import { Command } from 'commander';
import { apiClient } from '../api/client';
import { formatTable } from '../utils/format';

export const usersCommand = new Command('users')
  .description('Manage users');

usersCommand
  .command('list')
  .description('List all users')
  .option('-l, --limit <number>', 'Limit results', '10')
  .action(async (options) => {
    try {
      const { data } = await apiClient.listUsers({ 
        limit: parseInt(options.limit) 
      });
      
      console.log(formatTable(data, ['id', 'name', 'email']));
    } catch (error) {
      console.error('Failed to fetch users:', error.message);
      process.exit(1);
    }
  });

usersCommand
  .command('create')
  .description('Create a new user')
  .requiredOption('-n, --name <name>', 'User name')
  .requiredOption('-e, --email <email>', 'User email')
  .action(async (options) => {
    try {
      const { data } = await apiClient.createUser({
        name: options.name,
        email: options.email
      });
      
      console.log('User created:', data.id);
    } catch (error) {
      console.error('Failed to create user:', error.message);
      process.exit(1);
    }
  });
```

## Step 7: Integration Testing

Test the full flow:

```typescript
// tests/integration/users-flow.test.ts
describe('Users flow integration', () => {
  let server: Server;
  
  beforeAll(async () => {
    server = await startServer();
  });
  
  it('should create and list users via CLI', async () => {
    // Create user via CLI
    const createResult = execSync(
      'node cli/bin/cli users create -n "Test" -e "test@example.com"'
    );
    expect(createResult).toContain('User created');
    
    // List users via CLI
    const listResult = execSync('node cli/bin/cli users list');
    expect(listResult).toContain('Test');
    expect(listResult).toContain('test@example.com');
  });
});
```

## The Complete Package Structure

```
project/
├── api/
│   └── openapi.yaml           # 1. Start here
├── server/
│   ├── tests/
│   │   └── api/              # 2. API tests
│   └── src/
│       └── routes/           # 3. API implementation
├── cli/
│   ├── tests/
│   │   └── commands/         # 4. CLI tests
│   └── src/
│       ├── api/              # Generated client
│       └── commands/         # 5. CLI implementation
└── tests/
    └── integration/          # 6. Full flow tests
```

## Key Principles

1. **Spec drives everything** - OpenAPI is the contract
2. **Test before implement** - TDD at every layer
3. **Generate don't write** - API clients are generated
4. **Thin CLI** - CLI just calls API, no business logic
5. **Integration validates** - End-to-end tests confirm it works

## OSSA-Specific Implementation

The OSSA platform follows this pattern exactly:

### Our API-First Flow
```
/api/openapi.yaml → CLI Commands → Microservices → Infrastructure
```

### Current Implementation
- **API Spec**: `/api/openapi.yaml` (single source of truth)
- **CLI Commands**: `/cli/src/commands/services.ts`, `/cli/src/commands/agents.ts`
- **Services**: Individual microservices in `/services/`
- **Infrastructure**: Docker compose and K8s configs in `/infrastructure/`

### OSSA Best Practices
1. All operations are API-driven
2. CLI is thin wrapper around API calls
3. Services implement OpenAPI contracts
4. Everything is testable and mockable
5. Infrastructure as code supports the API

This approach ensures your CLI and API stay in sync, tests are meaningful, and changes to the API spec cascade through the entire system predictably.