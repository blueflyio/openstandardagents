#!/usr/bin/env tsx
/**
 * Validate Dependencies
 * Ensures all imports have corresponding package.json dependencies
 */

import { readFileSync } from 'fs';
import { glob } from 'glob';
import { join } from 'path';

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const BUILT_IN_MODULES = new Set([
  'fs', 'path', 'url', 'util', 'os', 'crypto', 'http', 'https',
  'stream', 'events', 'child_process', 'readline', 'zlib', 'buffer',
  'process', 'assert', 'querystring', 'net', 'tls', 'dgram', 'dns',
]);

const NODE_PREFIX = 'node:';

async function main() {
  console.log('🔍 Validating dependencies...\n');

  // Load package.json
  const pkgPath = join(process.cwd(), 'package.json');
  const pkg: PackageJson = JSON.parse(readFileSync(pkgPath, 'utf-8'));

  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  // Find all TypeScript files
  const files = await glob('src/**/*.ts', {
    ignore: ['**/*.d.ts', '**/node_modules/**'],
  });

  const errors: string[] = [];
  const imports = new Set<string>();

  // Parse imports from each file
  for (const file of files) {
    const content = readFileSync(file, 'utf-8');

    // Match: import ... from 'package'
    // Match: require('package')
    const importRegex = /(?:import|require)\s*(?:.*?\s+from\s+)?['"]([^'"]+)['"]/g;

    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];

      // Skip relative imports
      if (importPath.startsWith('.') || importPath.startsWith('/')) {
        continue;
      }

      // Skip node: prefixed imports
      if (importPath.startsWith(NODE_PREFIX)) {
        continue;
      }

      // Extract package name (handle scoped packages and subpaths)
      let packageName = importPath;
      if (importPath.startsWith('@')) {
        // Scoped package: @scope/package or @scope/package/subpath
        const parts = importPath.split('/');
        packageName = `${parts[0]}/${parts[1]}`;
      } else {
        // Regular package: package or package/subpath
        packageName = importPath.split('/')[0];
      }

      // Skip built-in modules
      if (BUILT_IN_MODULES.has(packageName)) {
        continue;
      }

      imports.add(packageName);

      // Check if package is in dependencies
      if (!allDeps[packageName]) {
        errors.push(`❌ ${file}: imports '${packageName}' but it's not in dependencies`);
      }
    }
  }

  // Report results
  if (errors.length > 0) {
    console.error('❌ Missing dependencies found:\n');
    errors.forEach(err => console.error(err));
    console.error(`\n💡 Add missing packages to package.json dependencies`);
    process.exit(1);
  }

  console.log(`✅ All ${imports.size} imported packages are declared in dependencies`);
  console.log(`✅ Validated ${files.length} source files`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
