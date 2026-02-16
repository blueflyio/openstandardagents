/**
 * Drupal MCP Server Usage Examples
 * Demonstrates how to use the server with different clients
 */

import { DrupalMCPServer } from '../src/server.js';
import { AuthConfig } from '../src/types/drupal.js';

// Example 1: OAuth2 Authentication
async function exampleOAuth2() {
  const authConfig: AuthConfig = {
    type: 'oauth2',
    baseUrl: 'https://your-drupal-site.com',
    credentials: {
      clientId: 'your-client-id',
      clientSecret: 'your-client-secret',
    },
  };

  const server = new DrupalMCPServer(authConfig);
  await server.start();
}

// Example 2: API Key Authentication
async function exampleApiKey() {
  const authConfig: AuthConfig = {
    type: 'api-key',
    baseUrl: 'https://your-drupal-site.com',
    credentials: {
      apiKey: 'your-api-key',
    },
  };

  const server = new DrupalMCPServer(authConfig);
  await server.start();
}

// Example 3: JWT Authentication
async function exampleJWT() {
  const authConfig: AuthConfig = {
    type: 'jwt',
    baseUrl: 'https://your-drupal-site.com',
    credentials: {
      token: 'your-jwt-token',
    },
  };

  const server = new DrupalMCPServer(authConfig);
  await server.start();
}

// Example 4: Using with Environment Variables
async function exampleEnvConfig() {
  const authConfig: AuthConfig = {
    type: (process.env.DRUPAL_AUTH_TYPE || 'oauth2') as any,
    baseUrl: process.env.DRUPAL_BASE_URL!,
    credentials: {
      clientId: process.env.DRUPAL_CLIENT_ID,
      clientSecret: process.env.DRUPAL_CLIENT_SECRET,
      apiKey: process.env.DRUPAL_API_KEY,
      token: process.env.DRUPAL_JWT_TOKEN,
    },
  };

  const server = new DrupalMCPServer(authConfig);
  await server.start();
}

// Example 5: Content Operations via Client
import { DrupalClient } from '../src/client/drupal-client.js';
import { ContentTools } from '../src/tools/content.js';

async function exampleContentOperations() {
  const authConfig: AuthConfig = {
    type: 'oauth2',
    baseUrl: 'https://your-drupal-site.com',
    credentials: {
      clientId: 'your-client-id',
      clientSecret: 'your-client-secret',
    },
  };

  const client = new DrupalClient(authConfig);
  const contentTools = new ContentTools(client);

  // Create a node
  const newNode = await contentTools.createNode({
    type: 'article',
    title: 'My First Article',
    body: 'This is the content of my article',
    status: true,
  });

  console.log('Created node:', newNode);

  // Update the node
  const updatedNode = await contentTools.updateNode({
    nid: newNode.nid!,
    title: 'Updated Article Title',
    body: 'Updated content',
  });

  console.log('Updated node:', updatedNode);

  // Search content
  const searchResults = await contentTools.searchContent({
    type: 'article',
    status: true,
    limit: 10,
  });

  console.log('Search results:', searchResults);

  // Get specific node
  const node = await contentTools.getNode(newNode.nid!);
  console.log('Retrieved node:', node);

  // Delete node
  const deleteResult = await contentTools.deleteNode(newNode.nid!);
  console.log('Delete result:', deleteResult);
}

// Example 6: Entity Operations
import { EntityTools } from '../src/tools/entities.js';

async function exampleEntityOperations() {
  const authConfig: AuthConfig = {
    type: 'oauth2',
    baseUrl: 'https://your-drupal-site.com',
    credentials: {
      clientId: 'your-client-id',
      clientSecret: 'your-client-secret',
    },
  };

  const client = new DrupalClient(authConfig);
  const entityTools = new EntityTools(client);

  // Create a taxonomy term
  const newTerm = await entityTools.createEntity({
    entity_type: 'taxonomy_term',
    bundle: 'tags',
    attributes: {
      name: 'New Tag',
      description: 'Tag description',
    },
  });

  console.log('Created term:', newTerm);

  // Query entities
  const entities = await entityTools.queryEntities({
    entity_type: 'node',
    bundle: 'article',
    filters: {
      status: true,
    },
    sort: {
      created: 'DESC',
    },
    limit: 20,
  });

  console.log('Found entities:', entities);
}

// Example 7: Views Integration
import { ViewsTools } from '../src/tools/views.js';

async function exampleViewsOperations() {
  const authConfig: AuthConfig = {
    type: 'oauth2',
    baseUrl: 'https://your-drupal-site.com',
    credentials: {
      clientId: 'your-client-id',
      clientSecret: 'your-client-secret',
    },
  };

  const client = new DrupalClient(authConfig);
  const viewsTools = new ViewsTools(client);

  // Execute a view
  const results = await viewsTools.executeView({
    view_id: 'content',
    display_id: 'rest_export_1',
    filters: {
      type: 'article',
    },
    page: 0,
    items_per_page: 10,
  });

  console.log('View results:', results);

  // Get view results with metadata
  const viewData = await viewsTools.getViewResults({
    view_id: 'content',
    display_id: 'rest_export_1',
    page: 0,
    items_per_page: 10,
  });

  console.log('View data:', viewData);
}

// Example 8: User Management
import { UserTools } from '../src/tools/users.js';

async function exampleUserOperations() {
  const authConfig: AuthConfig = {
    type: 'oauth2',
    baseUrl: 'https://your-drupal-site.com',
    credentials: {
      clientId: 'your-client-id',
      clientSecret: 'your-client-secret',
    },
  };

  const client = new DrupalClient(authConfig);
  const userTools = new UserTools(client);

  // Create a user
  const newUser = await userTools.createUser({
    name: 'newuser',
    mail: 'newuser@example.com',
    pass: 'secure-password',
    roles: ['editor'],
    status: true,
  });

  console.log('Created user:', newUser);

  // Update user
  const updatedUser = await userTools.updateUser({
    uid: newUser.uid!,
    mail: 'updated@example.com',
    roles: ['editor', 'moderator'],
  });

  console.log('Updated user:', updatedUser);

  // Get user
  const user = await userTools.getUser(newUser.uid!);
  console.log('Retrieved user:', user);
}

// Example 9: Configuration Management
import { ConfigTools } from '../src/tools/config.js';

async function exampleConfigOperations() {
  const authConfig: AuthConfig = {
    type: 'oauth2',
    baseUrl: 'https://your-drupal-site.com',
    credentials: {
      clientId: 'your-client-id',
      clientSecret: 'your-client-secret',
    },
  };

  const client = new DrupalClient(authConfig);
  const configTools = new ConfigTools(client);

  // Get configuration
  const siteConfig = await configTools.getConfig({
    name: 'system.site',
  });

  console.log('Site config:', siteConfig);

  // Set configuration
  const updatedConfig = await configTools.setConfig({
    name: 'system.site',
    data: {
      name: 'My Drupal Site',
      slogan: 'Powered by AI',
    },
  });

  console.log('Updated config:', updatedConfig);
}

// Example 10: Module Management
import { ModuleTools } from '../src/tools/modules.js';

async function exampleModuleOperations() {
  const authConfig: AuthConfig = {
    type: 'oauth2',
    baseUrl: 'https://your-drupal-site.com',
    credentials: {
      clientId: 'your-client-id',
      clientSecret: 'your-client-secret',
    },
  };

  const client = new DrupalClient(authConfig);
  const moduleTools = new ModuleTools(client);

  // List modules
  const modules = await moduleTools.listModules({
    type: 'module',
    status: true,
  });

  console.log('Enabled modules:', modules);

  // Enable modules
  const enableResult = await moduleTools.enableModule({
    modules: ['views', 'media'],
  });

  console.log('Enable result:', enableResult);

  // Disable modules
  const disableResult = await moduleTools.disableModule({
    modules: ['toolbar'],
  });

  console.log('Disable result:', disableResult);
}

// Example 11: Cache Operations
import { CacheTools } from '../src/tools/cache.js';

async function exampleCacheOperations() {
  const authConfig: AuthConfig = {
    type: 'oauth2',
    baseUrl: 'https://your-drupal-site.com',
    credentials: {
      clientId: 'your-client-id',
      clientSecret: 'your-client-secret',
    },
  };

  const client = new DrupalClient(authConfig);
  const cacheTools = new CacheTools(client);

  // Clear cache by bin
  const clearResult = await cacheTools.clearCache({
    bin: 'render',
  });

  console.log('Clear cache result:', clearResult);

  // Clear cache by tags
  const clearTagsResult = await cacheTools.clearCache({
    tags: ['node:123', 'taxonomy_term:456'],
  });

  console.log('Clear tags result:', clearTagsResult);

  // Rebuild cache
  const rebuildResult = await cacheTools.rebuildCache({
    rebuild_theme_registry: true,
    rebuild_menu: true,
    rebuild_node_access: false,
  });

  console.log('Rebuild cache result:', rebuildResult);
}

// Run examples (uncomment to test)
// exampleOAuth2();
// exampleApiKey();
// exampleJWT();
// exampleEnvConfig();
// exampleContentOperations();
// exampleEntityOperations();
// exampleViewsOperations();
// exampleUserOperations();
// exampleConfigOperations();
// exampleModuleOperations();
// exampleCacheOperations();
