#!/usr/bin/env ts-node
/**
 * GitLab Project Migration Script
 * 
 * Migrates project from gitlab.bluefly.io to GitLab.com using direct transfer API
 * 
 * Usage:
 *   export SOURCE_GITLAB_TOKEN="your-source-token"
 *   export DEST_GITLAB_TOKEN="your-dest-token"
 *   export SOURCE_PROJECT_ID="123"
 *   export DEST_NAMESPACE_ID="119122912"
 *   ts-node .gitlab/scripts/migrate-to-gitlab-com.ts
 */

import axios, { AxiosInstance } from 'axios';

interface MigrationConfig {
  sourceUrl: string;
  sourceToken: string;
  sourceProjectId: string;
  destUrl: string;
  destToken: string;
  destNamespaceId: string;
  projectName?: string;
}

interface BulkImportEntity {
  source_type: 'project_entity';
  source_full_path: string;
  destination_name: string;
  destination_namespace: string;
}

interface BulkImportResponse {
  id: number;
  status: 'created' | 'started' | 'finished' | 'failed';
  created_at: string;
  updated_at: string;
}

class GitLabMigration {
  private sourceClient: AxiosInstance;
  private destClient: AxiosInstance;
  private config: MigrationConfig;

  constructor(config: MigrationConfig) {
    this.config = config;
    
    this.sourceClient = axios.create({
      baseURL: `${config.sourceUrl}/api/v4`,
      headers: {
        'PRIVATE-TOKEN': config.sourceToken,
        'Content-Type': 'application/json',
      },
    });

    this.destClient = axios.create({
      baseURL: `${config.destUrl}/api/v4`,
      headers: {
        'PRIVATE-TOKEN': config.destToken,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get project information from source
   */
  async getSourceProject(): Promise<any> {
    try {
      const response = await this.sourceClient.get(`/projects/${this.config.sourceProjectId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get source project: ${error.message}`);
    }
  }

  /**
   * Verify destination namespace exists
   */
  async verifyDestinationNamespace(): Promise<boolean> {
    try {
      const response = await this.destClient.get(`/namespaces/${this.config.destNamespaceId}`);
      return response.status === 200;
    } catch (error: any) {
      throw new Error(`Failed to verify destination namespace: ${error.message}`);
    }
  }

  /**
   * Start bulk import migration
   */
  async startMigration(projectPath: string, projectName: string): Promise<BulkImportResponse> {
    const entity: BulkImportEntity = {
      source_type: 'project_entity',
      source_full_path: projectPath,
      destination_name: projectName,
      destination_namespace: this.config.destNamespaceId.toString(),
    };

    try {
      const response = await this.destClient.post('/bulk_imports', {
        configuration: {
          url: this.config.sourceUrl,
          access_token: this.config.sourceToken,
        },
        entities: [entity],
      });

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `Failed to start migration: ${error.response.status} ${error.response.statusText}\n${JSON.stringify(error.response.data, null, 2)}`
        );
      }
      throw new Error(`Failed to start migration: ${error.message}`);
    }
  }

  /**
   * Check migration status
   */
  async checkMigrationStatus(importId: number): Promise<BulkImportResponse> {
    try {
      const response = await this.destClient.get(`/bulk_imports/${importId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to check migration status: ${error.message}`);
    }
  }

  /**
   * Get migration entities status
   */
  async getMigrationEntities(importId: number): Promise<any[]> {
    try {
      const response = await this.destClient.get(`/bulk_imports/${importId}/entities`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get migration entities: ${error.message}`);
    }
  }

  /**
   * Monitor migration progress
   */
  async monitorMigration(importId: number, intervalMs: number = 5000): Promise<void> {
    console.log(`\n📊 Monitoring migration (ID: ${importId})...\n`);

    let lastStatus = '';
    while (true) {
      const importData = await this.checkMigrationStatus(importId);
      const entities = await this.getMigrationEntities(importId);

      if (importData.status !== lastStatus) {
        console.log(`\n🔄 Status: ${importData.status.toUpperCase()}`);
        lastStatus = importData.status;
      }

      if (entities.length > 0) {
        const entity = entities[0];
        const status = entity.status || 'unknown';
        const progress = this.formatProgress(entity);

        if (progress) {
          process.stdout.write(`\r${progress}`);
        }

        if (status === 'finished') {
          console.log(`\n\n✅ Migration completed successfully!`);
          console.log(`\n📦 Project URL: ${this.config.destUrl}/${entity.destination_namespace}/${entity.destination_name}`);
          break;
        } else if (status === 'failed') {
          console.log(`\n\n❌ Migration failed!`);
          console.log(`Error: ${entity.failures?.[0]?.exception_class || 'Unknown error'}`);
          if (entity.failures) {
            entity.failures.forEach((failure: any, index: number) => {
              console.log(`\nFailure ${index + 1}:`);
              console.log(`  Exception: ${failure.exception_class}`);
              console.log(`  Message: ${failure.exception_message}`);
            });
          }
          throw new Error('Migration failed');
        }
      }

      if (importData.status === 'finished') {
        break;
      } else if (importData.status === 'failed') {
        throw new Error('Migration failed');
      }

      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  /**
   * Format progress information
   */
  private formatProgress(entity: any): string {
    if (!entity) return '';

    const status = entity.status || 'unknown';
    const progress = entity.progress || {};

    if (status === 'started' && progress.message) {
      return `  ⏳ ${progress.message}`;
    }

    return '';
  }

  /**
   * Run complete migration process
   */
  async migrate(): Promise<void> {
    console.log('🚀 Starting GitLab Project Migration\n');
    console.log(`Source: ${this.config.sourceUrl}`);
    console.log(`Destination: ${this.config.destUrl}`);
    console.log(`Namespace ID: ${this.config.destNamespaceId}\n`);

    // Step 1: Get source project info
    console.log('📋 Step 1: Fetching source project information...');
    const sourceProject = await this.getSourceProject();
    const projectPath = sourceProject.path_with_namespace;
    const projectName = this.config.projectName || sourceProject.name;

    console.log(`   Project: ${projectPath}`);
    console.log(`   Name: ${projectName}`);
    console.log(`   Visibility: ${sourceProject.visibility}\n`);

    // Step 2: Verify destination namespace
    console.log('✅ Step 2: Verifying destination namespace...');
    await this.verifyDestinationNamespace();
    console.log(`   Namespace verified\n`);

    // Step 3: Start migration
    console.log('🔄 Step 3: Starting migration...');
    const migration = await this.startMigration(projectPath, projectName);
    console.log(`   Migration ID: ${migration.id}`);
    console.log(`   Status: ${migration.status}\n`);

    // Step 4: Monitor progress
    await this.monitorMigration(migration.id);

    console.log('\n✨ Migration process completed!');
  }
}

// Main execution
async function main() {
  const requiredEnvVars = [
    'SOURCE_GITLAB_TOKEN',
    'DEST_GITLAB_TOKEN',
    'SOURCE_PROJECT_ID',
    'DEST_NAMESPACE_ID',
  ];

  const missing = requiredEnvVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    console.error('\nUsage:');
    console.error('  export SOURCE_GITLAB_TOKEN="your-source-token"');
    console.error('  export DEST_GITLAB_TOKEN="your-dest-token"');
    console.error('  export SOURCE_PROJECT_ID="123"');
    console.error('  export DEST_NAMESPACE_ID="119122912"');
    console.error('  ts-node .gitlab/scripts/migrate-to-gitlab-com.ts');
    process.exit(1);
  }

  const config: MigrationConfig = {
    sourceUrl: process.env.SOURCE_GITLAB_URL || 'https://gitlab.bluefly.io',
    sourceToken: process.env.SOURCE_GITLAB_TOKEN!,
    sourceProjectId: process.env.SOURCE_PROJECT_ID!,
    destUrl: process.env.DEST_GITLAB_URL || 'https://gitlab.com',
    destToken: process.env.DEST_GITLAB_TOKEN!,
    destNamespaceId: process.env.DEST_NAMESPACE_ID!,
    projectName: process.env.PROJECT_NAME,
  };

  const migration = new GitLabMigration(config);

  try {
    await migration.migrate();
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

