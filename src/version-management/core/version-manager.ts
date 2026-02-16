import * as fs from 'fs/promises';
import * as path from 'path';
import * as semver from 'semver';
import fg from 'fast-glob';
import { execSync } from 'child_process';

export interface SubstituteOptions {
  version: string;
  paths?: string[];
  exclude?: string[];
  dryRun?: boolean;
  placeholder?: string;
  cwd?: string;
}

export interface RestoreOptions {
  version?: string;
  restoreAll?: boolean;
  paths?: string[];
  exclude?: string[];
  placeholder?: string;
  cwd?: string;
}

export interface DetectOptions {
  directory?: string;
  sources?: VersionSource[];
}

export interface FileResult {
  path: string;
  replacements: number;
  preview?: {
    line: number;
    before: string;
    after: string;
  }[];
}

export interface SubstituteResult {
  success: boolean;
  versionUsed: string;
  filesProcessed: number;
  replacementsMade: number;
  dryRun?: boolean;
  message: string;
  files: FileResult[];
}

export interface RestoreResult {
  success: boolean;
  versionRestored?: string;
  filesProcessed: number;
  replacementsMade: number;
  message: string;
  files: FileResult[];
}

export interface DetectResult {
  success: boolean;
  version: string;
  source: VersionSource;
  allSources: Record<string, string>;
}

export interface ValidateResult {
  success: boolean;
  valid: boolean;
  version: string;
  parsed?: {
    major: number;
    minor: number;
    patch: number;
    prerelease?: string;
    build?: string;
  };
  errors?: string[];
}

export interface BumpResult {
  success: boolean;
  oldVersion: string;
  newVersion: string;
  bumpType: BumpType;
}

export type VersionSource =
  | 'git_tag'
  | 'package_json'
  | 'composer_json'
  | 'VERSION_file'
  | 'pyproject_toml'
  | 'cargo_toml';

export type BumpType = 'major' | 'minor' | 'patch' | 'prerelease';

const DEFAULT_PATHS = ['**/*.md', '**/*.json', '**/*.yaml', '**/*.yml'];
const DEFAULT_EXCLUDE = [
  'node_modules/**',
  '.git/**',
  'vendor/**',
  'dist/**',
  'build/**',
  '**/package-lock.json',
  '**/yarn.lock',
  '**/pnpm-lock.yaml',
];
const DEFAULT_PLACEHOLDER = '{{VERSION}}';

export class VersionManager {
  /**
   * Substitute version placeholders with real version
   */
  async substitute(options: SubstituteOptions): Promise<SubstituteResult> {
    const {
      version,
      paths = DEFAULT_PATHS,
      exclude = DEFAULT_EXCLUDE,
      dryRun = false,
      placeholder = DEFAULT_PLACEHOLDER,
      cwd = process.cwd(),
    } = options;

    // Validate version
    const validation = this.validate(version);
    if (!validation.valid) {
      throw new Error(
        `Invalid version format: ${validation.errors?.join(', ')}`
      );
    }

    // Normalize version (add 'v' prefix if not present and original had it)
    const normalizedVersion = this.normalizeVersion(version);

    // Find files
    const files = await fg(paths, {
      cwd,
      ignore: exclude,
      absolute: false,
    });

    const results: FileResult[] = [];
    let totalReplacements = 0;

    for (const file of files) {
      const filePath = path.join(cwd, file);
      const content = await fs.readFile(filePath, 'utf-8');

      // Count and replace placeholders
      const regex = new RegExp(this.escapeRegex(placeholder), 'g');
      const matches = content.match(regex);
      const replacements = matches ? matches.length : 0;

      if (replacements > 0) {
        const newContent = content.replace(regex, normalizedVersion);

        if (!dryRun) {
          await fs.writeFile(filePath, newContent, 'utf-8');
        }

        results.push({
          path: file,
          replacements,
        });

        totalReplacements += replacements;
      }
    }

    return {
      success: true,
      versionUsed: normalizedVersion,
      filesProcessed: files.length,
      replacementsMade: totalReplacements,
      dryRun,
      message: dryRun
        ? `Dry run: Would replace ${totalReplacements} occurrences in ${results.length} files`
        : `Successfully replaced ${totalReplacements} occurrences in ${results.length} files`,
      files: results,
    };
  }

  /**
   * Restore version placeholders (reverse of substitute)
   */
  async restore(options: RestoreOptions): Promise<RestoreResult> {
    const {
      version,
      restoreAll = false,
      paths = DEFAULT_PATHS,
      exclude = DEFAULT_EXCLUDE,
      placeholder = DEFAULT_PLACEHOLDER,
      cwd = process.cwd(),
    } = options;

    if (!version && !restoreAll) {
      throw new Error('Either version or restoreAll must be specified');
    }

    // Find files
    const files = await fg(paths, {
      cwd,
      ignore: exclude,
      absolute: false,
    });

    const results: FileResult[] = [];
    let totalReplacements = 0;

    for (const file of files) {
      const filePath = path.join(cwd, file);
      const content = await fs.readFile(filePath, 'utf-8');

      let newContent = content;
      let replacements = 0;

      if (restoreAll) {
        // Replace all semver patterns with placeholder
        const semverRegex =
          /v?\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?(\+[a-zA-Z0-9.]+)?/g;
        const matches = content.match(semverRegex);
        replacements = matches ? matches.length : 0;
        newContent = content.replace(semverRegex, placeholder);
      } else if (version) {
        // Replace specific version with placeholder
        const normalizedVersion = this.normalizeVersion(version);
        const regex = new RegExp(this.escapeRegex(normalizedVersion), 'g');
        const matches = content.match(regex);
        replacements = matches ? matches.length : 0;
        newContent = content.replace(regex, placeholder);
      }

      if (replacements > 0) {
        await fs.writeFile(filePath, newContent, 'utf-8');

        results.push({
          path: file,
          replacements,
        });

        totalReplacements += replacements;
      }
    }

    return {
      success: true,
      versionRestored: version,
      filesProcessed: files.length,
      replacementsMade: totalReplacements,
      message: `Successfully restored ${totalReplacements} occurrences to ${placeholder} in ${results.length} files`,
      files: results,
    };
  }

  /**
   * Detect version from various sources
   */
  async detect(options: DetectOptions = {}): Promise<DetectResult> {
    const { directory = process.cwd(), sources } = options;

    const allSources: Record<string, string> = {};
    const checkSources: VersionSource[] = sources || [
      'git_tag',
      'package_json',
      'composer_json',
      'VERSION_file',
      'pyproject_toml',
      'cargo_toml',
    ];

    // Check each source
    for (const source of checkSources) {
      try {
        const version = await this.detectFromSource(source, directory);
        if (version) {
          allSources[source] = version;
        }
      } catch (error) {
        // Source not available, continue
      }
    }

    // Priority order
    const priorityOrder: VersionSource[] = [
      'git_tag',
      'package_json',
      'composer_json',
      'VERSION_file',
      'pyproject_toml',
      'cargo_toml',
    ];

    for (const source of priorityOrder) {
      if (allSources[source]) {
        return {
          success: true,
          version: allSources[source],
          source,
          allSources,
        };
      }
    }

    throw new Error('Could not detect version from any source');
  }

  /**
   * Validate semantic version format
   */
  validate(version: string): ValidateResult {
    const cleaned = semver.clean(version);

    if (!cleaned) {
      return {
        success: true,
        valid: false,
        version,
        errors: ['Invalid semantic version format'],
      };
    }

    const parsed = semver.parse(cleaned);
    if (!parsed) {
      return {
        success: true,
        valid: false,
        version,
        errors: ['Could not parse version'],
      };
    }

    return {
      success: true,
      valid: true,
      version,
      parsed: {
        major: parsed.major,
        minor: parsed.minor,
        patch: parsed.patch,
        prerelease:
          parsed.prerelease.length > 0
            ? parsed.prerelease.join('.')
            : undefined,
        build: parsed.build.length > 0 ? parsed.build.join('.') : undefined,
      },
    };
  }

  /**
   * Bump version according to semver rules
   */
  bump(
    version: string,
    bumpType: BumpType,
    prereleaseIdentifier?: string
  ): BumpResult {
    const cleaned = semver.clean(version);
    if (!cleaned) {
      throw new Error('Invalid version format');
    }

    let newVersion: string;

    if (bumpType === 'prerelease' && prereleaseIdentifier) {
      newVersion =
        semver.inc(cleaned, 'prerelease', prereleaseIdentifier) || '';
    } else {
      newVersion = semver.inc(cleaned, bumpType) || '';
    }

    if (!newVersion) {
      throw new Error(`Failed to bump version: ${version} (${bumpType})`);
    }

    return {
      success: true,
      oldVersion: cleaned,
      newVersion,
      bumpType,
    };
  }

  /**
   * Detect version from specific source
   */
  private async detectFromSource(
    source: VersionSource,
    directory: string
  ): Promise<string | null> {
    switch (source) {
      case 'git_tag':
        try {
          const tag = execSync('git describe --tags --abbrev=0', {
            cwd: directory,
            encoding: 'utf-8',
          }).trim();
          return tag;
        } catch {
          return null;
        }

      case 'package_json': {
        const pkgPath = path.join(directory, 'package.json');
        try {
          const content = await fs.readFile(pkgPath, 'utf-8');
          const pkg = JSON.parse(content);
          return pkg.version || null;
        } catch {
          return null;
        }
      }

      case 'composer_json': {
        const composerPath = path.join(directory, 'composer.json');
        try {
          const content = await fs.readFile(composerPath, 'utf-8');
          const composer = JSON.parse(content);
          return composer.version || null;
        } catch {
          return null;
        }
      }

      case 'VERSION_file': {
        const versionPath = path.join(directory, 'VERSION');
        try {
          const content = await fs.readFile(versionPath, 'utf-8');
          return content.trim();
        } catch {
          return null;
        }
      }

      case 'pyproject_toml': {
        const pyprojectPath = path.join(directory, 'pyproject.toml');
        try {
          const content = await fs.readFile(pyprojectPath, 'utf-8');
          const match = content.match(/version\s*=\s*"([^"]+)"/);
          return match ? match[1] : null;
        } catch {
          return null;
        }
      }

      case 'cargo_toml': {
        const cargoPath = path.join(directory, 'Cargo.toml');
        try {
          const content = await fs.readFile(cargoPath, 'utf-8');
          const match = content.match(/version\s*=\s*"([^"]+)"/);
          return match ? match[1] : null;
        } catch {
          return null;
        }
      }

      default:
        return null;
    }
  }

  /**
   * Normalize version (ensure consistent format)
   */
  private normalizeVersion(version: string): string {
    // If version starts with 'v', keep it. Otherwise add it.
    return version.startsWith('v') ? version : `v${version}`;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
