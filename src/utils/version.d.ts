/**
 * OSSA Version Utilities
 *
 * Provides dynamic version detection from package.json
 *
 * CRITICAL: NO HARDCODED VERSION STRINGS ANYWHERE
 * All versions MUST be derived from package.json or environment variables.
 *
 * NOTE: This module is designed to work with both ESM and CommonJS (Jest).
 */
export interface VersionInfo {
    /** Full version string (e.g., "0.3.0") - dynamically derived */
    version: string;
    /** Major version */
    major: number;
    /** Minor version */
    minor: number;
    /** Patch version */
    patch: number;
    /** Prerelease tag if any (e.g., "RC", "beta") */
    prerelease?: string;
    /** Schema directory name (e.g., "v0.3.0") */
    schemaDir: string;
    /** Schema filename (e.g., "ossa-0.3.0.schema.json") */
    schemaFile: string;
    /** Full schema path relative to project root */
    schemaPath: string;
    /** API version string for manifests */
    apiVersion: string;
}
/**
 * Get OSSA version information dynamically from package.json
 *
 * @param forceRefresh - If true, bypasses cache and re-reads package.json
 * @returns VersionInfo object with all version details
 * @throws Error if version cannot be determined dynamically
 *
 * @example
 * const { version, schemaPath, apiVersion } = getVersionInfo();
 * console.log(`Using OSSA ${version}`);
 * console.log(`Schema at: ${schemaPath}`);
 */
export declare function getVersionInfo(forceRefresh?: boolean): VersionInfo;
/**
 * Get just the version string (convenience function)
 */
export declare function getVersion(): string;
/**
 * Get the schema path (convenience function)
 */
export declare function getSchemaPath(): string;
/**
 * Get the API version for manifests (convenience function)
 */
export declare function getApiVersion(): string;
/**
 * Get the schema directory (e.g., "v0.3.0")
 */
export declare function getSchemaDir(): string;
/**
 * Check if version is a prerelease
 */
export declare function isPrerelease(): boolean;
/**
 * Get supported schema versions (for migration, validation)
 * Returns versions in descending order (newest first)
 */
export declare function getSupportedVersions(): string[];
/**
 * Resolve absolute path to schema file
 */
export declare function resolveSchemaPath(projectRoot?: string): string;
/**
 * Clear the cached version info (useful for testing)
 */
export declare function clearVersionCache(): void;
