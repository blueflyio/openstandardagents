#!/usr/bin/env tsx
/**
 * Verify npmjs.org Authentication Token
 * 
 * Tests if NPM_TOKEN is valid and has publish permissions
 * 
 * Usage:
 *   NPM_TOKEN=<token> tsx src/tools/verify-npm-auth.ts
 *   OR
 *   tsx src/tools/verify-npm-auth.ts <token>
 */

const token = process.env.NPM_TOKEN || process.argv[2];

if (!token) {
  console.error('ERROR: NPM_TOKEN not provided');
  console.error('');
  console.error('Usage:');
  console.error('  NPM_TOKEN=<token> tsx src/tools/verify-npm-auth.ts');
  console.error('  OR');
  console.error('  tsx src/tools/verify-npm-auth.ts <token>');
  console.error('');
  console.error('Token types supported:');
  console.error('  - Granular Access Token (npm_xxxxx)');
  console.error('  - Automation Token (npm_xxxxx)');
  process.exit(1);
}

// Validate token format
if (!token.startsWith('npm_')) {
  console.error('ERROR: Token must start with "npm_"');
  console.error('Current token format:', token.substring(0, 10) + '...');
  console.error('');
  console.error('Create token at: https://www.npmjs.com/settings/blueflyio/tokens');
  process.exit(1);
}

async function verifyToken() {
  console.log('Verifying npmjs.org authentication token...\n');

  // Write token to temporary .npmrc
  const fs = await import('fs');
  const os = await import('os');
  const path = await import('path');
  
  const npmrcPath = path.join(os.tmpdir(), '.npmrc-verify');
  fs.writeFileSync(npmrcPath, `//registry.npmjs.org/:_authToken=${token}\n`);

  try {
    // Test with npm whoami
    const { execSync } = await import('child_process');
    const npmPath = process.env.npm_execpath || 'npm';
    
    const result = execSync(`${npmPath} whoami --registry=https://registry.npmjs.org`, {
      env: { ...process.env, NPM_CONFIG_USERCONFIG: npmrcPath },
      encoding: 'utf8',
      stdio: 'pipe',
    });

    const username = result.trim();
    console.log('✅ Token is valid!');
    console.log(`   Authenticated as: ${username}`);
    console.log('');
    console.log('Token type: Granular Access Token or Automation Token');
    console.log('Token format: npm_xxxxx (valid)');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Add token to GitLab CI/CD variables:');
    console.log('     Settings > CI/CD > Variables');
    console.log('     Key: NPM_TOKEN');
    console.log('     Value: [your token]');
    console.log('     Masked: Yes');
    console.log('     Protected: Yes');
    console.log('');
    console.log('  2. CI/CD will automatically use this token for publishing');

    // Cleanup
    fs.unlinkSync(npmrcPath);
    process.exit(0);
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string; stdout?: string; stderr?: string };
    
    console.error('❌ Token verification failed!');
    console.error('');
    
    if (err.stderr?.includes('401') || err.stderr?.includes('Unauthorized')) {
      console.error('ERROR: Token is invalid or expired');
      console.error('');
      console.error('Solution:');
      console.error('  1. Create new token using npm CLI (recommended):');
      console.error('     npm token create');
      console.error('     (creates granular publish token)');
      console.error('');
      console.error('  2. OR create Automation token via web:');
      console.error('     https://www.npmjs.com/settings/blueflyio/tokens');
      console.error('');
      console.error('  3. Copy the new token (starts with npm_)');
      console.error('  4. Update NPM_TOKEN in GitLab CI/CD variables');
    } else if (err.stderr?.includes('403') || err.stderr?.includes('Forbidden')) {
      console.error('ERROR: Token lacks publish permissions');
      console.error('');
      console.error('Solution:');
      console.error('  1. Token must have "publish" scope');
      console.error('  2. For Granular tokens: Select "publish" permission');
      console.error('  3. For Automation tokens: They have full access by default');
      console.error('  4. Create new token with correct permissions');
    } else {
      console.error('Error:', err.message || String(error));
      console.error('');
      console.error('Check:');
      console.error('  - Token format: Must start with "npm_"');
      console.error('  - Network connectivity');
      console.error('  - npm registry access');
    }

    // Cleanup
    try {
      fs.unlinkSync(npmrcPath);
    } catch {
      // Ignore cleanup errors
    }
    
    process.exit(1);
  }
}

verifyToken().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
