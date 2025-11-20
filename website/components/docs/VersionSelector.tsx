'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { 
  STABLE_VERSION_TAG, 
  DEV_VERSION_TAG, 
  ALL_VERSIONS,
  STABLE_VERSIONS,
  DEV_VERSIONS,
  getVersionInfo
} from '@/lib/version';

export function VersionSelector() {
  const [selectedVersion, setSelectedVersion] = useState(STABLE_VERSION_TAG);
  const router = useRouter();
  const pathname = usePathname();

  const handleVersionChange = (version: string): void => {
    setSelectedVersion(version);
    // In the future, this could navigate to version-specific docs
    // For now, we just update the UI
  };

  // Build version options grouped by type
  const versionOptions: Array<{ value: string; label: string; disabled: boolean; group?: string }> = [];
  
  // Add stable versions
  if (STABLE_VERSIONS.length > 0) {
    STABLE_VERSIONS.forEach((v) => {
      const isLatest = v.version === STABLE_VERSION_TAG.replace('v', '');
      versionOptions.push({
        value: v.tag,
        label: `${v.tag}${isLatest ? ' (Latest Stable)' : ''}${v.published ? '' : ' (Unpublished)'}`,
        disabled: !v.available,
        group: 'stable'
      });
    });
  }
  
  // Add dev/pre-release versions
  if (DEV_VERSIONS.length > 0) {
    DEV_VERSIONS.forEach((v) => {
      const isLatestDev = v.version === (DEV_VERSION_TAG?.replace('v', '') || '');
      const typeLabel = v.type === 'dev' ? 'Dev' : 'Pre-release';
      versionOptions.push({
        value: v.tag,
        label: `${v.tag} (${typeLabel}${isLatestDev ? ' - Latest' : ''})${v.published ? '' : ' - Unpublished'}`,
        disabled: !v.available,
        group: v.type
      });
    });
  }
  
  // Fallback if no versions loaded
  if (versionOptions.length === 0) {
    versionOptions.push({
      value: STABLE_VERSION_TAG,
      label: `${STABLE_VERSION_TAG} (Current)`,
      disabled: false
    });
  }

  return (
    <div className="mb-4">
      <label htmlFor="version-select" className="block text-sm font-medium text-gray-700 mb-2">
        Version
      </label>
      <select
        id="version-select"
        value={selectedVersion}
        onChange={(e) => handleVersionChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
        aria-label="Select OSSA version"
        aria-describedby="version-description"
      >
        {versionOptions.map((version) => (
          <option
            key={version.value}
            value={version.value}
            disabled={version.disabled}
          >
            {version.label}
          </option>
        ))}
      </select>
      <p id="version-description" className="mt-1 text-sm text-gray-500">
        {(() => {
          const info = getVersionInfo(selectedVersion.replace('v', ''));
          if (info) {
            if (info.type === 'stable') {
              return 'Stable release - recommended for production';
            } else if (info.type === 'dev') {
              return 'Development version - may contain breaking changes';
            } else {
              return 'Pre-release version - use with caution';
            }
          }
          return 'Select a version to view documentation';
        })()}
      </p>
    </div>
  );
}

