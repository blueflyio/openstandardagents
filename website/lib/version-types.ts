// Type definitions for version data
export interface VersionInfo {
  version: string;
  type: string;
  releaseDate?: string;
  tag?: string;
  apiVersion?: string;
  published?: boolean;
  available?: boolean;
}

export interface VersionsData {
  stable: string;
  stableTag?: string;
  latest?: string;
  dev?: string;
  devTag?: string;
  all: VersionInfo[];
}

