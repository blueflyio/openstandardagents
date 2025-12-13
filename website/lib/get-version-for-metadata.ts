import fs from 'fs';
import { STABLE_VERSION } from './version';
import path from 'path';

/**
 * Get version for Next.js metadata (static at build time)
 * Reads from versions.json or version.ts
 */
export function getVersionForMetadata(): { version: string; tag: string; displayVersion: string } {
  try {
    // Try to read from versions.json first
    const versionsPath = path.join(process.cwd(), 'lib', 'versions.json');
    if (fs.existsSync(versionsPath)) {
      const versions = JSON.parse(fs.readFileSync(versionsPath, 'utf8'));
      const stable = versions.stable || STABLE_VERSION;
      const [major, minor] = stable.split('.').map(Number);
      return {
        version: stable,
        tag: `v${stable}`,
        displayVersion: `${major}.${minor}.x`,
      };
    }
  } catch (error) {
    console.error('Error reading versions.json:', error);
  }

  // Fallback: try to read from version.ts (extract from export)
  try {
    const versionTsPath = path.join(process.cwd(), 'lib', 'version.ts');
    if (fs.existsSync(versionTsPath)) {
      const content = fs.readFileSync(versionTsPath, 'utf8');
      const versionMatch = content.match(/export const OSSA_VERSION = "([^"]+)"/);
      if (versionMatch) {
        const version = versionMatch[1];
        const [major, minor] = version.split('.').map(Number);
        return {
          version,
          tag: `v${version}`,
          displayVersion: `${major}.${minor}.x`,
        };
      }
    }
  } catch (error) {
    console.error('Error reading version.ts:', error);
  }

  // Final fallback
  return {
    version: STABLE_VERSION,
    tag: `v${STABLE_VERSION}`,
    displayVersion: '0.2.x',
  };
}
