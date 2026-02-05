#!/usr/bin/env tsx
/**
 * Check Existing CI/CD Variables
 *
 * Checks both group-level and project-level CI/CD variables in GitLab.
 *
 * Usage:
 *   GITLAB_TOKEN=<your-token> tsx src/tools/check-ci-variables.ts
 */

const GITLAB_API = 'https://gitlab.com/api/v4';
const GROUP_PATH = 'blueflyio';
const PROJECT_PATH = 'blueflyio/ossa/openstandardagents';

interface GitLabVariable {
  key: string;
  value?: string;
  protected: boolean; // eslint-disable-line @typescript-eslint/no-inferrable-types
  masked: boolean;
  environment_scope?: string;
  variable_type?: string;
}

async function fetchGroupVariables(token: string): Promise<GitLabVariable[]> {
  const encodedGroup = encodeURIComponent(GROUP_PATH);
  const url = `${GITLAB_API}/groups/${encodedGroup}/variables`;

  try {
    const response = await fetch(url, {
      headers: {
        'PRIVATE-TOKEN': token,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log('⚠️  Group not found or no access');
        return [];
      }
      const error = await response.text();
      throw new Error(
        `Failed to fetch group variables: ${response.status} - ${error}`
      );
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Error fetching group variables: ${error}`);
  }
}

async function fetchProjectVariables(token: string): Promise<GitLabVariable[]> {
  const encodedProject = encodeURIComponent(PROJECT_PATH);
  const url = `${GITLAB_API}/projects/${encodedProject}/variables`;

  try {
    const response = await fetch(url, {
      headers: {
        'PRIVATE-TOKEN': token,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log('⚠️  Project not found or no access');
        return [];
      }
      const error = await response.text();
      throw new Error(
        `Failed to fetch project variables: ${response.status} - ${error}`
      );
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Error fetching project variables: ${error}`);
  }
}

function formatVariable(variable: GitLabVariable): string {
  const value = variable.masked ? '***MASKED***' : variable.value || '(empty)';
  const scope =
    variable.environment_scope && variable.environment_scope !== '*'
      ? ` [${variable.environment_scope}]`
      : '';
  const isProtected = variable.protected ? ' 🔒' : '';
  return `  ${variable.key}${scope}${isProtected}: ${value}`;
}

async function main() {
  const token = process.env.GITLAB_TOKEN || process.env.GITLAB_PUSH_TOKEN;

  if (!token) {
    console.error(
      '❌ GITLAB_TOKEN or GITLAB_PUSH_TOKEN environment variable is required'
    );
    console.error('\nUsage:');
    console.error(
      '  GITLAB_TOKEN=<your-token> tsx src/tools/check-ci-variables.ts'
    );
    process.exit(1);
  }

  console.log('🔍 Checking CI/CD Variables...\n');
  console.log(`Group: ${GROUP_PATH}`);
  console.log(`Project: ${PROJECT_PATH}\n`);

  const requiredVars = ['NPM_TOKEN', 'GITLAB_PUSH_TOKEN', 'GITHUB_TOKEN'];
  const foundVars = new Set<string>();

  try {
    // Check group-level variables
    console.log('📦 Group-Level Variables:');
    console.log('─'.repeat(60));
    const groupVars = await fetchGroupVariables(token);

    if (groupVars.length === 0) {
      console.log('  (none found)');
    } else {
      for (const variable of groupVars) {
        console.log(formatVariable(variable));
        if (requiredVars.includes(variable.key)) {
          foundVars.add(variable.key);
        }
      }
    }

    console.log('\n📁 Project-Level Variables:');
    console.log('─'.repeat(60));
    const projectVars = await fetchProjectVariables(token);

    if (projectVars.length === 0) {
      console.log('  (none found)');
    } else {
      for (const variable of projectVars) {
        console.log(formatVariable(variable));
        if (requiredVars.includes(variable.key)) {
          foundVars.add(variable.key);
        }
      }
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log('─'.repeat(60));
    for (const varName of requiredVars) {
      const icon = foundVars.has(varName) ? '✅' : '❌';
      const location = groupVars.find((v) => v.key === varName)
        ? 'group'
        : projectVars.find((v) => v.key === varName)
          ? 'project'
          : 'missing';
      console.log(
        `${icon} ${varName}: ${location === 'missing' ? 'NOT FOUND' : `found in ${location}`}`
      );
    }

    const missingCount = requiredVars.length - foundVars.size;
    if (missingCount > 0) {
      console.log(`\n⚠️  ${missingCount} required variable(s) missing`);
      console.log('\nTo add missing variables, run:');
      console.log('  npm run setup:ci-variables');
    } else {
      console.log('\n✅ All required variables are configured!');
    }
  } catch (error) {
    console.error(
      '\n❌ Error:',
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
