/**
 * Conformance Profile Loader Service
 * Loads and manages conformance profiles
 */

import { injectable } from 'inversify';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ConformanceProfile } from './types.js';

@injectable()
export class ConformanceProfileLoader {
  private profiles: Map<string, ConformanceProfile> = new Map();
  private profilesDir: string;

  constructor() {
    // Find profiles directory using multiple strategies
    this.profilesDir = this.findProfilesDirectory();
    this.loadAllProfiles();
  }

  /**
   * Find profiles directory using multiple strategies
   */
  private findProfilesDirectory(): string {
    const strategies = [
      // Strategy 1: Relative to project root (most common)
      join(process.cwd(), 'spec/v0.3/conformance/profiles'),
      // Strategy 2: Relative to dist (production)
      join(process.cwd(), 'dist/spec/v0.3/conformance/profiles'),
      // Strategy 3: One level up (when cwd is in subdirectory)
      join(process.cwd(), '../spec/v0.3/conformance/profiles'),
      // Strategy 4: From openstandardagents directory
      join(process.cwd(), 'openstandardagents/spec/v0.3/conformance/profiles'),
      // Strategy 5: Absolute path from repo root (CI environments)
      '/builds/blueflyio/ossa/openstandardagents/spec/v0.3/conformance/profiles',
    ];

    for (const path of strategies) {
      if (existsSync(path)) {
        console.log(`Found profiles directory: ${path}`);
        return path;
      }
    }

    // If not found, log all attempted paths
    console.warn(
      `Profiles directory not found. Tried:\n${strategies.map((s) => `  - ${s}`).join('\n')}`
    );
    // Return first strategy and let it fail later with clear error
    return strategies[0];
  }

  /**
   * Load all available profiles from the profiles directory
   */
  private loadAllProfiles(): void {
    if (!existsSync(this.profilesDir)) {
      console.warn(`Profiles directory not found: ${this.profilesDir}`);
      return;
    }

    try {
      const files = readdirSync(this.profilesDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const profileId = file.replace('.json', '');
          try {
            const profile = this.loadProfileFromFile(
              join(this.profilesDir, file)
            );
            this.profiles.set(profileId, profile);
          } catch (error) {
            console.warn(`Failed to load profile ${file}:`, error);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to read profiles directory:', error);
    }
  }

  /**
   * Load profile from file
   */
  private loadProfileFromFile(filePath: string): ConformanceProfile {
    const content = readFileSync(filePath, 'utf-8');
    const profile = JSON.parse(content) as ConformanceProfile;

    // Validate profile structure
    this.validateProfile(profile);

    return profile;
  }

  /**
   * Validate profile structure
   */
  private validateProfile(profile: ConformanceProfile): void {
    if (!profile.id) {
      throw new Error('Profile missing required field: id');
    }
    if (!profile.name) {
      throw new Error('Profile missing required field: name');
    }
    if (!profile.version) {
      throw new Error('Profile missing required field: version');
    }
    if (!profile.required || !Array.isArray(profile.required.features)) {
      throw new Error('Profile missing required.features array');
    }
    if (!profile.optional || !Array.isArray(profile.optional.features)) {
      throw new Error('Profile missing optional.features array');
    }
    if (
      !profile.scoring ||
      typeof profile.scoring.pass_threshold !== 'number'
    ) {
      throw new Error('Profile missing scoring.pass_threshold');
    }
  }

  /**
   * Get profile by ID
   */
  getProfile(profileId: string): ConformanceProfile {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      throw new Error(`Profile not found: ${profileId}`);
    }
    return this.resolveProfileInheritance(profile);
  }

  /**
   * Resolve profile inheritance (extends)
   */
  private resolveProfileInheritance(
    profile: ConformanceProfile
  ): ConformanceProfile {
    if (!profile.extends) {
      return profile;
    }

    const baseProfile = this.profiles.get(profile.extends);
    if (!baseProfile) {
      throw new Error(`Base profile not found: ${profile.extends}`);
    }

    // Recursively resolve base profile
    const resolvedBase = this.resolveProfileInheritance(baseProfile);

    // Merge profiles (child overrides parent)
    return {
      ...resolvedBase,
      ...profile,
      required: {
        features: [
          ...new Set([
            ...resolvedBase.required.features,
            ...profile.required.features,
          ]),
        ],
        weight: profile.required.weight,
      },
      optional: {
        features: [
          ...new Set([
            ...resolvedBase.optional.features,
            ...profile.optional.features,
          ]),
        ],
        weight: profile.optional.weight,
      },
      constraints: {
        ...resolvedBase.constraints,
        ...profile.constraints,
      },
    };
  }

  /**
   * List all available profiles
   */
  listProfiles(): Array<{ id: string; name: string; description: string }> {
    return Array.from(this.profiles.values()).map((profile) => ({
      id: profile.id,
      name: profile.name,
      description: profile.description,
    }));
  }

  /**
   * Check if profile exists
   */
  hasProfile(profileId: string): boolean {
    return this.profiles.has(profileId);
  }

  /**
   * Get profile details (without resolving inheritance)
   */
  getProfileRaw(profileId: string): ConformanceProfile | undefined {
    return this.profiles.get(profileId);
  }
}
