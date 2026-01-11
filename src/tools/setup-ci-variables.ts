#!/usr/bin/env tsx
/**
 * Setup CI/CD Variables for OSSA Release
 * 
 * This script helps add required CI/CD variables to GitLab project.
 * 
 * Usage:
 *   GITLAB_TOKEN=<your-token> tsx src/tools/setup-ci-variables.ts
 * 
 * Or provide tokens interactively:
 *   tsx src/tools/setup-ci-variables.ts
 */

import { readFileSync } from 'fs';
import { createInterface } from 'readline';

const GITLAB_API = 'https://gitlab.com/api/v4';
const GROUP_PATH = 'blueflyio';
const PROJECT_PATH = 'blueflyio/ossa/openstandardagents';

interface Variable {
  key: string;
  value: string;
  protected: boolean;
  masked: boolean;
  description: string;
}

const REQUIRED_VARIABLES: Variable[] = [
  {
    key: 'NPM_TOKEN',
    value: '',
    protected: false,
    masked: true,
    description: 'npmjs.org automation token for publishing packages',
  },
  {
    key: 'GITLAB_PUSH_TOKEN',
    value: '',
    protected: false,
    masked: true,
    description: 'GitLab token with api and write_repository scopes',
  },
  {
    key: 'GITHUB_TOKEN',
    value: '',
    protected: false,
    masked: true,
    description: 'GitHub PAT with repo scope for creating releases',
  },
];

async function askQuestion(query: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function getVariableValue(key: string, description: string): Promise<string> {
  const envValue = process.env[key];
  if (envValue) {
    console.log(`✅ Using ${key} from environment variable`);
    return envValue;
  }

  console.log(`\n📝 ${key}: ${description}`);
  console.log(`   Get token at:`);
  if (key === 'NPM_TOKEN') {
    console.log(`   https://www.npmjs.com/settings/[username]/tokens`);
    console.log(`   → Generate "Automation" type token`);
  } else if (key === 'GITLAB_PUSH_TOKEN') {
    console.log(`   https://gitlab.com/-/user_settings/personal_access_tokens`);
    console.log(`   → Scopes: api, write_repository`);
  } else if (key === 'GITHUB_TOKEN') {
    console.log(`   https://github.com/settings/tokens`);
    console.log(`   → Generate "classic" token with "repo" scope`);
  }

  const value = await askQuestion(`   Enter ${key} (or press Enter to skip): `);
  return value.trim();
}

async function checkVariable(
  gitlabToken: string,
  projectPath: string,
  key: string
): Promise<{ exists: boolean; id?: number; location?: 'project' | 'group' }> {
  // Check project-level first
  const encodedPath = encodeURIComponent(projectPath);
  const encodedKey = encodeURIComponent(key);
  const projectUrl = `${GITLAB_API}/projects/${encodedPath}/variables/${encodedKey}`;

  try {
    const projectResponse = await fetch(projectUrl, {
      headers: {
        'PRIVATE-TOKEN': gitlabToken,
      },
    });

    if (projectResponse.ok) {
      const data = await projectResponse.json();
      return { exists: true, id: data.id, location: 'project' };
    }
  } catch {
    // Ignore project-level errors, check group-level
  }

  // Check group-level
  const groupPath = 'blueflyio';
  const encodedGroup = encodeURIComponent(groupPath);
  const groupUrl = `${GITLAB_API}/groups/${encodedGroup}/variables/${encodedKey}`;

  try {
    const groupResponse = await fetch(groupUrl, {
      headers: {
        'PRIVATE-TOKEN': gitlabToken,
      },
    });

    if (groupResponse.ok) {
      const data = await groupResponse.json();
      return { exists: true, id: data.id, location: 'group' };
    }
  } catch {
    // Ignore group-level errors
  }

  return { exists: false };
}

async function createVariable(
  gitlabToken: string,
  projectPath: string,
  variable: Variable
): Promise<void> {
  const encodedPath = encodeURIComponent(projectPath);
  const url = `${GITLAB_API}/projects/${encodedPath}/variables`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'PRIVATE-TOKEN': gitlabToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key: variable.key,
      value: variable.value,
      protected: variable.protected,
      masked: variable.masked,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create variable: ${response.status} - ${error}`);
  }
}

async function updateVariable(
  gitlabToken: string,
  projectPath: string,
  variableId: number,
  variable: Variable
): Promise<void> {
  const encodedPath = encodeURIComponent(projectPath);
  const encodedKey = encodeURIComponent(variable.key);
  const url = `${GITLAB_API}/projects/${encodedPath}/variables/${encodedKey}`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'PRIVATE-TOKEN': gitlabToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      value: variable.value,
      protected: variable.protected,
      masked: variable.masked,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update variable: ${response.status} - ${error}`);
  }
}

async function main() {
  console.log('🚀 OSSA CI/CD Variables Setup\n');
  console.log('This script will help you add required CI/CD variables to GitLab.\n');

  // Get GitLab token
  const gitlabToken =
    process.env.GITLAB_TOKEN ||
    process.env.GITLAB_PUSH_TOKEN ||
    (await askQuestion('Enter GitLab token (with api scope): '));

  if (!gitlabToken) {
    console.error('❌ GitLab token is required');
    process.exit(1);
  }

  console.log('\n📋 Checking existing variables...\n');

  const results: Array<{ variable: Variable; action: string; error?: string }> = [];

  for (const variable of REQUIRED_VARIABLES) {
    try {
      // Get value for this variable
      const value = await getVariableValue(variable.key, variable.description);
      if (!value) {
        console.log(`⏭️  Skipping ${variable.key} (no value provided)\n`);
        results.push({ variable, action: 'skipped' });
        continue;
      }

      variable.value = value;

      // Check if variable exists
      const check = await checkVariable(gitlabToken, PROJECT_PATH, variable.key);

      if (check.exists) {
        if (check.location === 'group') {
          console.log(`ℹ️  ${variable.key} exists at group level (skipping - add at project level if needed)\n`);
          results.push({ variable, action: 'exists-group' });
        } else {
          // Update existing project-level variable
          await updateVariable(gitlabToken, PROJECT_PATH, check.id!, variable);
          console.log(`✅ Updated: ${variable.key} (project-level)\n`);
          results.push({ variable, action: 'updated' });
        }
      } else {
        // Create new at project level
        await createVariable(gitlabToken, PROJECT_PATH, variable);
        console.log(`✅ Created: ${variable.key} (project-level)\n`);
        results.push({ variable, action: 'created' });
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to set ${variable.key}: ${errorMsg}\n`);
      results.push({ variable, action: 'failed', error: errorMsg });
    }
  }

  // Summary
  console.log('\n📊 Summary:\n');
  for (const result of results) {
    const icon =
      result.action === 'created' || result.action === 'updated'
        ? '✅'
        : result.action === 'exists-group'
          ? 'ℹ️'
          : result.action === 'skipped'
            ? '⏭️'
            : '❌';
    const actionText = result.action === 'exists-group' 
      ? 'exists at group level (not modified)'
      : result.action;
    console.log(`${icon} ${result.variable.key}: ${actionText}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }

  const successCount = results.filter(
    (r) => r.action === 'created' || r.action === 'updated'
  ).length;
  const failedCount = results.filter((r) => r.action === 'failed').length;

  console.log(`\n✅ ${successCount} variables configured`);
  if (failedCount > 0) {
    console.log(`❌ ${failedCount} variables failed`);
    process.exit(1);
  }

  console.log('\n🎉 Setup complete! You can now trigger releases.\n');
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
