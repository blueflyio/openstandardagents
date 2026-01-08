#!/usr/bin/env tsx

/**
 * GitLab Issue Creation Helper (Zod Edition)
 * 
 * Creates GitLab issues via API with proper validation and error handling.
 * Uses Zod for runtime validation and type safety.
 * 
 * Usage:
 *   npx tsx src/tools/gitlab/create-issue-helper.ts <title> <milestone-id> <labels> [description-file]
 * 
 * Example:
 *   npx tsx scripts/create-issue-helper.ts "Enhance bin" 3 "enhancement,cli,bin" .gitlab/ISSUE-BIN-ENHANCEMENT.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Zod Schemas
// ============================================================================

const ConfigSchema = z.object({
  gitlabApiUrl: z.string().url(),
  gitlabToken: z.string().min(1, 'GitLab token is required'),
  projectId: z.string().min(1, 'Project ID is required'),
  title: z.string().min(1, 'Title is required'),
  milestoneId: z.number().int().positive('Milestone ID must be a positive integer'),
  labels: z.array(z.string().min(1)).min(1, 'At least one label is required'),
  description: z.string().optional(),
});

const GitLabIssueResponseSchema = z.object({
  iid: z.number(),
  web_url: z.string().url(),
  title: z.string(),
  state: z.string(),
});

const GitLabErrorResponseSchema = z.object({
  message: z.string().optional(),
  error: z.string().optional(),
});

type Config = z.infer<typeof ConfigSchema>;
type GitLabIssueResponse = z.infer<typeof GitLabIssueResponseSchema>;
type GitLabErrorResponse = z.infer<typeof GitLabErrorResponseSchema>;

// ============================================================================
// Configuration
// ============================================================================

function getConfig(): Config {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error('[FAIL] Usage: tsx src/tools/gitlab/create-issue-helper.ts <title> <milestone-id> <labels> [description-file]');
    console.error('   Example: tsx src/tools/gitlab/create-issue-helper.ts "Enhance bin" 3 "enhancement,cli,bin" .gitlab/ISSUE-BIN-ENHANCEMENT.md');
    process.exit(1);
  }

  const [title, milestoneIdStr, labelsStr, descFile] = args;
  
  // Parse milestone ID
  const milestoneId = parseInt(milestoneIdStr, 10);
  if (isNaN(milestoneId) || milestoneId <= 0) {
    console.error(`[FAIL] Invalid milestone ID: ${milestoneIdStr}`);
    process.exit(1);
  }

  // Parse labels
  const labels = labelsStr.split(',').map(l => l.trim()).filter(l => l.length > 0);
  if (labels.length === 0) {
    console.error(`[FAIL] No valid labels provided: ${labelsStr}`);
    process.exit(1);
  }

  // Read description file if provided
  let description: string | undefined;
  if (descFile) {
    const descPath = path.isAbsolute(descFile) ? descFile : path.join(process.cwd(), descFile);
    if (!fs.existsSync(descPath)) {
      console.error(`[FAIL] Description file not found: ${descPath}`);
      process.exit(1);
    }
    description = fs.readFileSync(descPath, 'utf-8');
  }

  // Get GitLab token (try multiple sources)
  const gitlabToken = process.env.SERVICE_ACCOUNT_OSSA_TOKEN ||
                      process.env.SERVICE_ACCOUNT_VERSION_MANAGER_TOKEN ||
                      process.env.GITLAB_TOKEN ||
                      process.env.GITLAB_PUSH_TOKEN ||
                      '';

  if (!gitlabToken) {
    console.error('[FAIL] No GitLab token found. Please set one of:');
    console.error('   - SERVICE_ACCOUNT_OSSA_TOKEN');
    console.error('   - SERVICE_ACCOUNT_VERSION_MANAGER_TOKEN');
    console.error('   - GITLAB_TOKEN');
    console.error('   - GITLAB_PUSH_TOKEN');
    process.exit(1);
  }

  // Get project ID
  const projectId = process.env.CI_PROJECT_ID || 
                    process.env.GITLAB_PROJECT_ID ||
                    'blueflyio/openstandardagents';

  // Get API URL
  const gitlabApiUrl = process.env.CI_API_V4_URL ||
                       process.env.GITLAB_API_URL ||
                       'https://gitlab.com/api/v4';

  try {
    return ConfigSchema.parse({
      gitlabApiUrl,
      gitlabToken,
      projectId,
      title,
      milestoneId,
      labels,
      description,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[FAIL] Configuration validation failed:');
      error.issues.forEach((issue) => {
        console.error(`   • ${issue.path.join('.')}: ${issue.message}`);
      });
    } else {
      console.error('[FAIL] Configuration error:', error instanceof Error ? error.message : String(error));
    }
    process.exit(1);
  }
}

// ============================================================================
// GitLab API
// ============================================================================

async function createIssue(config: Config): Promise<GitLabIssueResponse> {
  const projectPath = encodeURIComponent(config.projectId);
  const url = `${config.gitlabApiUrl}/projects/${projectPath}/issues`;

  const payload = {
    title: config.title,
    description: config.description || '',
    milestone_id: config.milestoneId,
    labels: config.labels.join(','),
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'PRIVATE-TOKEN': config.gitlabToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let responseData: unknown;

    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    if (!response.ok) {
      // Try to parse as error response
      const errorData = GitLabErrorResponseSchema.safeParse(responseData);
      if (errorData.success) {
        const error = errorData.data;
        throw new Error(`GitLab API error: ${error.message || error.error || responseText}`);
      }
      throw new Error(`GitLab API error (HTTP ${response.status}): ${responseText}`);
    }

    // Validate response
    const issue = GitLabIssueResponseSchema.parse(responseData);
    return issue;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[FAIL] Invalid response from GitLab API:');
      error.issues.forEach((issue) => {
        console.error(`   • ${issue.path.join('.')}: ${issue.message}`);
      });
      throw new Error('Failed to parse GitLab API response');
    }
    throw error;
  }
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  console.log('[FIX] GitLab Issue Creation Helper (Zod Edition)');
  console.log('==============================================\n');

  const config = getConfig();
  
  console.log(`[LIST] Configuration:`);
  console.log(`   Project: ${config.projectId}`);
  console.log(`   Title: ${config.title}`);
  console.log(`   Milestone: #${config.milestoneId}`);
  console.log(`   Labels: ${config.labels.join(', ')}`);
  console.log(`   Description: ${config.description ? `${config.description.length} chars` : 'none'}`);
  console.log('');

  try {
    const issue = await createIssue(config);
    
    console.log('[PASS] Issue created successfully!');
    console.log(`   Issue: !${issue.iid}`);
    console.log(`   URL: ${issue.web_url}`);
    console.log(`   State: ${issue.state}`);
  } catch (error) {
    console.error('[FAIL] Failed to create issue:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run
main().catch((error) => {
  console.error('[FAIL] Fatal error:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});

