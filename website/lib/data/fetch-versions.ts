/**
 * Versions Repository - CRUD Operations
 *
 * SOLID:
 * - Single Responsibility: Only handles version data
 * - Open/Closed: Extensible via IVersionsRepository interface
 * - Dependency Inversion: Depends on abstractions (clients)
 *
 * DRY: Uses shared client and schemas
 */

import { getGitLabClient, getNpmClient, Result, ok, err, DataFetchError } from './client';
import { Versions, VersionInfo, VersionsSchema, VersionType } from './schemas';

// =============================================================================
// REPOSITORY INTERFACE (Open/Closed Principle)
// =============================================================================

export interface IVersionsRepository {
  findLatest(): Promise<Result<Versions, DataFetchError>>;
  findByTag(tag: string): Promise<Result<VersionInfo | null, DataFetchError>>;
}

// =============================================================================
// MULTI-SOURCE VERSIONS REPOSITORY
// =============================================================================

export class MultiSourceVersionsRepository implements IVersionsRepository {
  private readonly gitlabClient = getGitLabClient();
  private readonly npmClient = getNpmClient();

  /**
   * Parse version tag to determine type
   */
  private parseVersionType(tag: string): VersionType {
    if (tag.includes('-dev') || tag.includes('-alpha') || tag.includes('-beta')) {
      return 'dev';
    }
    if (tag.includes('-rc') || tag.includes('-RC')) {
      return 'rc';
    }
    return 'stable';
  }

  /**
   * Sort versions in descending order
   */
  private sortVersions(versions: VersionInfo[]): VersionInfo[] {
    return versions.sort((a, b) => {
      const [aMajor, aMinor, aPatch] = a.version.split(/[-.]/).map(Number);
      const [bMajor, bMinor, bPatch] = b.version.split(/[-.]/).map(Number);
      if (aMajor !== bMajor) return bMajor - aMajor;
      if (aMinor !== bMinor) return bMinor - aMinor;
      return (bPatch || 0) - (aPatch || 0);
    });
  }

  /**
   * READ: Fetch latest version information from all sources
   */
  async findLatest(): Promise<Result<Versions, DataFetchError>> {
    console.log('Fetching version information from multiple sources...');

    // Fetch from both sources in parallel
    const [gitlabResult, npmResult] = await Promise.all([
      this.gitlabClient.fetchTags(),
      this.npmClient.fetchPackage(),
    ]);

    // Collect tags from both sources
    const allVersionTags = new Set<string>();

    if (gitlabResult.ok) {
      gitlabResult.data.forEach((tag) => allVersionTags.add(tag));
      console.log(`Found ${gitlabResult.data.length} tags from GitLab`);
    } else {
      console.warn('Failed to fetch GitLab tags:', gitlabResult.error.message);
    }

    if (npmResult.ok) {
      npmResult.data.versions.forEach((v) => allVersionTags.add(`v${v}`));
      console.log(`Found ${npmResult.data.versions.length} versions from npm`);
    } else {
      console.warn('Failed to fetch npm versions:', npmResult.error.message);
    }

    // Parse all versions
    const versions: VersionInfo[] = Array.from(allVersionTags)
      .filter((tag) => tag.startsWith('v'))
      .map((tag) => {
        const version = tag.replace(/^v/, '');
        return {
          version,
          tag,
          apiVersion: `ossa/${tag}`,
          type: this.parseVersionType(tag),
          published: npmResult.ok ? npmResult.data.versions.includes(version) : false,
          available: true,
        };
      });

    const sortedVersions = this.sortVersions(versions);

    // Find stable and dev versions
    const stableVersions = sortedVersions.filter((v) => v.type === 'stable');
    const devVersions = sortedVersions.filter((v) => v.type === 'dev');

    const stable = stableVersions[0]?.version || '0.3.1';
    const dev = devVersions[0]?.version || `${stable}-dev`;

    console.log(`Found ${sortedVersions.length} versions (stable: ${stable}, dev: ${dev})`);

    const result: Versions = {
      stable,
      stableTag: `v${stable}`,
      latest: stable,
      dev,
      devTag: `v${dev}`,
      all: sortedVersions,
      githubTags: {
        latestStable: stableVersions[0]?.tag || null,
        latestDev: devVersions[0]?.tag || null,
        total: sortedVersions.length,
      },
      fallbackVersion: '0.2.3',
    };

    // Validate with Zod
    const parsed = VersionsSchema.safeParse(result);
    if (!parsed.success) {
      return err(new DataFetchError(`Version data validation failed: ${parsed.error.message}`, 'gitlab'));
    }

    return ok(parsed.data);
  }

  /**
   * READ: Find version by tag
   */
  async findByTag(tag: string): Promise<Result<VersionInfo | null, DataFetchError>> {
    const latestResult = await this.findLatest();
    if (!latestResult.ok) {
      return err(latestResult.error);
    }

    const version = latestResult.data.all.find((v) => v.tag === tag);
    return ok(version || null);
  }
}

// =============================================================================
// SERVICE LAYER (Business Logic)
// =============================================================================

export class VersionsService {
  constructor(private readonly repository: IVersionsRepository = new MultiSourceVersionsRepository()) {}

  /**
   * Fetch version information (main entry point)
   */
  async fetchVersions(): Promise<Versions> {
    const result = await this.repository.findLatest();
    if (!result.ok) {
      console.error('Failed to fetch versions:', result.error.message);
      // Return fallback versions
      return {
        stable: '0.3.1',
        stableTag: 'v0.3.1',
        latest: '0.3.1',
        dev: '0.3.1-dev',
        devTag: 'v0.3.1-dev',
        all: [],
        githubTags: { latestStable: null, latestDev: null, total: 0 },
        fallbackVersion: '0.2.3',
      };
    }
    return result.data;
  }

  /**
   * Save versions to JSON file
   */
  async saveVersions(versions: Versions, outputPath: string): Promise<void> {
    const parsed = VersionsSchema.safeParse(versions);
    if (!parsed.success) {
      throw new Error(`Invalid versions data: ${parsed.error.message}`);
    }

    const fs = await import('fs/promises');
    await fs.writeFile(outputPath, JSON.stringify(parsed.data, null, 2));
    console.log(`Saved versions to ${outputPath}`);
  }

  /**
   * Generate version.ts TypeScript file
   */
  async generateVersionTs(versions: Versions, outputPath: string): Promise<void> {
    const fs = await import('fs/promises');

    const content = `/**
 * Auto-generated version information
 * Generated at: ${new Date().toISOString()}
 * DO NOT EDIT - run \`npm run sync:versions\` to regenerate
 */

export const STABLE_VERSION = '${versions.stable}';
export const DEV_VERSION = '${versions.dev}';
export const LATEST_VERSION = '${versions.latest}';
export const FALLBACK_VERSION = '${versions.fallbackVersion}';

export const VERSIONS = ${JSON.stringify(versions.all.slice(0, 10), null, 2)} as const;

export type VersionType = 'stable' | 'dev' | 'rc';

export function getVersionType(version: string): VersionType {
  if (version.includes('-dev') || version.includes('-alpha') || version.includes('-beta')) {
    return 'dev';
  }
  if (version.includes('-rc') || version.includes('-RC')) {
    return 'rc';
  }
  return 'stable';
}
`;

    await fs.writeFile(outputPath, content);
    console.log(`Generated ${outputPath}`);
  }
}

// =============================================================================
// EXPORTS (Backward Compatibility)
// =============================================================================

const defaultService = new VersionsService();

export async function fetchVersions(): Promise<Versions> {
  return defaultService.fetchVersions();
}

export async function saveVersions(versions: Versions, outputPath: string): Promise<void> {
  return defaultService.saveVersions(versions, outputPath);
}

export async function generateVersionTs(versions: Versions, outputPath: string): Promise<void> {
  return defaultService.generateVersionTs(versions, outputPath);
}

export type { Versions, VersionInfo } from './schemas';

// =============================================================================
// CLI ENTRY POINT
// =============================================================================

if (require.main === module || process.argv[1]?.includes('fetch-versions')) {
  (async () => {
    const path = await import('path');
    const service = new VersionsService();
    const versions = await service.fetchVersions();
    const cwd = process.cwd();

    await service.saveVersions(versions, path.join(cwd, 'lib/versions.json'));
    await service.generateVersionTs(versions, path.join(cwd, 'lib/version.ts'));
  })().catch(console.error);
}
