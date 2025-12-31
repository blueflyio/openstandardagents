#!/usr/bin/env node
/**
 * Release Button Handlers
 * Manual triggers for controlled releases
 */

import { Gitlab } from '@gitbeaker/rest';
import { execSync } from 'child_process';

const gitlab = new Gitlab({
  token: process.env.CI_JOB_TOKEN!,
});

async function releaseToNpm() {
  console.log('🚀 Starting npm release...');

  const packageJson = JSON.parse(execSync('cat package.json').toString());
  const packageName = packageJson.name;
  const version = packageJson.version;

  // Determine version type and appropriate tag
  const isRC = version.includes('-rc');
  const isDev = version.includes('-dev');
  const isPrerelease = isRC || isDev || version.includes('-alpha') || version.includes('-beta');

  // Determine npm tag based on version type
  let npmTag = 'latest';
  if (isRC) {
    npmTag = 'rc';
  } else if (isDev) {
    npmTag = 'dev';
  } else if (isPrerelease) {
    npmTag = 'next';
  }

  console.log(`📦 Package: ${packageName}@${version}`);
  console.log(`🏷️  Publishing with tag: ${npmTag}`);

  // 1. Dry run first
  console.log('Running dry-run...');
  execSync(`npm publish --dry-run --tag ${npmTag}`, { stdio: 'inherit' });

  // 2. Get current latest version before publishing (for legacy tag update)
  let previousLatest: string | null = null;
  if (!isPrerelease) {
    try {
      previousLatest = execSync(`npm view ${packageName} dist-tags.latest 2>/dev/null`).toString().trim();
      console.log(`📌 Current latest version: ${previousLatest}`);
    } catch {
      console.log('No previous latest version found');
    }
  }

  // 3. Actual publish with appropriate tag
  console.log(`Publishing to npm with --tag ${npmTag}...`);
  execSync(`npm publish --access public --tag ${npmTag}`, { stdio: 'inherit' });

  // 4. For stable releases, update legacy tag to previous stable
  if (!isPrerelease && previousLatest && previousLatest !== version) {
    console.log(`📌 Updating legacy tag to point to ${previousLatest}...`);
    try {
      execSync(`npm dist-tag add ${packageName}@${previousLatest} legacy`, { stdio: 'inherit' });
      console.log(`✅ Legacy tag updated to ${previousLatest}`);
    } catch (error) {
      console.warn(`⚠️ Failed to update legacy tag: ${error}`);
    }
  }

  // 5. Verify package is downloadable
  console.log('Verifying package...');
  execSync(`npm view ${packageName}@${version}`, { stdio: 'inherit' });

  // 6. Verify dist-tags are correct
  console.log('Verifying dist-tags...');
  execSync(`npm view ${packageName} dist-tags`, { stdio: 'inherit' });

  // 7. Run smoke tests on published package
  console.log('Running smoke tests...');
  const tempDir = execSync('mktemp -d').toString().trim();
  execSync(`cd ${tempDir} && npm install ${packageName}@${version}`, { stdio: 'inherit' });
  execSync(`cd ${tempDir} && npx ${packageName} --version`, { stdio: 'inherit' });

  console.log('✅ npm release successful');
}

async function releaseToGitHub() {
  console.log('🐙 Starting GitHub release...');
  
  const packageJson = JSON.parse(execSync('cat package.json').toString());
  const version = packageJson.version;
  const tag = `v${version}`;
  
  // 1. Create GitHub release
  const releaseNotes = execSync(`git tag -l --format='%(contents)' ${tag}`).toString();
  
  execSync(`gh release create ${tag} \
    --title "Release ${version}" \
    --notes "${releaseNotes}" \
    --repo blueflyio/openstandardagents`, 
    { stdio: 'inherit' }
  );
  
  // 2. Upload artifacts
  execSync(`gh release upload ${tag} dist/*.tgz \
    --repo blueflyio/openstandardagents`,
    { stdio: 'inherit' }
  );
  
  console.log('✅ GitHub release successful');
}

async function deployWebsite() {
  console.log('🌐 Starting website deployment...');
  
  // Note: We're already in website/ directory from CI before_script
  // Check if we're in website directory, if not, cd into it
  const cwd = process.cwd();
  const isInWebsite = cwd.endsWith('website');
  const websiteDir = isInWebsite ? '.' : 'website';
  
  // 1. Build website
  execSync(`cd ${websiteDir} && npm run build`, { stdio: 'inherit' });
  
  // 2. Run pre-deploy checks
  execSync(`cd ${websiteDir} && npm run lighthouse`, { stdio: 'inherit' });
  
  // 3. Deploy to production
  execSync(`cd ${websiteDir} && npm run deploy`, { stdio: 'inherit' });
  
  // 4. Verify deployment
  const response = execSync('curl -s -o /dev/null -w "%{http_code}" https://openstandardagents.org').toString();
  if (response !== '200') {
    throw new Error(`Website deployment failed: HTTP ${response}`);
  }
  
  console.log('✅ Website deployment successful');
}

async function announceRelease() {
  console.log('📢 Announcing release...');
  
  const packageJson = JSON.parse(execSync('cat package.json').toString());
  const version = packageJson.version;
  
  // 1. Create announcement issue
  const projectId = process.env.CI_PROJECT_ID!;
  await gitlab.Issues.create(projectId, {
    title: `🎉 Release ${version} Announcement`,
    description: `
## Release ${version} is now available!

### 📦 Installation
\`\`\`bash
npm install openstandardagents@${version}
\`\`\`

### 🔗 Links
- [npm Package](https://www.npmjs.com/package/openstandardagents/v/${version})
- [GitHub Release](https://github.com/blueflyio/openstandardagents/releases/tag/v${version})
- [Documentation](https://openstandardagents.org/docs)
- [Changelog](https://openstandardagents.org/docs/changelog)

### 📣 Share
Please help spread the word about this release!
    `,
    labels: 'announcement,release',
  });
  
  // 2. Send notifications (Slack, email, etc.)
  // TODO: Implement notification system
  
  console.log('✅ Release announced');
}

// Main handler
async function main() {
  const action = process.env.RELEASE_ACTION;
  
  switch (action) {
    case 'npm':
      await releaseToNpm();
      break;
    case 'github':
      await releaseToGitHub();
      break;
    case 'website':
      await deployWebsite();
      break;
    case 'announce':
      await announceRelease();
      break;
    default:
      console.error(`Unknown action: ${action}`);
      process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Release failed:', error);
  process.exit(1);
});
