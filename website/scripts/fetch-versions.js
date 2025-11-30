const fs = require('fs');
const path = require('path');
const axios = require('axios');

const NPM_PACKAGE_NAME = '@bluefly/openstandardagents';
const NPM_REGISTRY_URL = `https://registry.npmjs.org/${NPM_PACKAGE_NAME}`;
const SPEC_DIR = path.join(__dirname, '../../spec');
const OUTPUT_FILE = path.join(__dirname, '../lib/versions.json');

async function fetchVersions() {
  console.log('Fetching version information...');

  let npmVersions = [];
  let distTags = {};

  try {
    console.log(`Querying npm registry: ${NPM_REGISTRY_URL}`);
    const response = await axios.get(NPM_REGISTRY_URL);
    const data = response.data;

    npmVersions = Object.keys(data.versions || {});
    distTags = data['dist-tags'] || {};
    console.log(`Found ${npmVersions.length} published versions on npm`);
    console.log('Dist tags:', distTags);
  } catch (error) {
    console.error('Error fetching npm versions:', error.message);
    // Fallback to local package.json if npm registry is unreachable
    const packageJsonPath = path.join(__dirname, '../../package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      npmVersions = [packageJson.version];
      distTags = { latest: packageJson.version };
      console.log('Falling back to local package.json version:', packageJson.version);
    }
  }

  // Scan local spec directory for available schema versions
  const localSpecVersions = [];
  if (fs.existsSync(SPEC_DIR)) {
    const specDirs = fs.readdirSync(SPEC_DIR)
      .filter(dir => {
        const dirPath = path.join(SPEC_DIR, dir);
        return fs.statSync(dirPath).isDirectory() && dir.startsWith('v');
      })
      .map(dir => dir.substring(1)) // Remove 'v' prefix
      .sort((a, b) => {
        const [aMajor, aMinor, aPatch] = a.split('.').map(Number);
        const [bMajor, bMinor, bPatch] = b.split('.').map(Number);
        if (aMajor !== bMajor) return bMajor - aMajor;
        if (aMinor !== bMinor) return bMinor - aMinor;
        return bPatch - aPatch;
      });
    
    localSpecVersions.push(...specDirs);
    console.log(`Scanning spec directory: ${SPEC_DIR}`);
    console.log(`Found ${localSpecVersions.length} schema versions in spec/`);
  }

  const allVersions = [];
  const processedVersions = new Set();

  // Add npm published versions
  npmVersions.forEach(version => {
    if (!processedVersions.has(version)) {
      const isStable = distTags.latest === version;
      const isDev = distTags.dev === version;
      // Pre-release versions: -dev, -pre, -rc, alpha, beta, or version like 0.2.4-dev
      const isPreRelease = version.includes('-dev') || version.includes('-pre') || version.includes('-rc') || version.includes('alpha') || version.includes('beta');
      // Dev versions are specifically tagged as 'dev' in npm or end with -dev
      const isDevVersion = isDev || (version.includes('-dev') && !version.includes('-pre'));
      
      allVersions.push({
        version,
        tag: `v${version}`,
        apiVersion: `ossa/v${version}`,
        type: isStable ? 'stable' : (isDevVersion ? 'dev' : (isPreRelease ? 'prerelease' : 'stable')),
        published: true,
        available: true,
      });
      processedVersions.add(version);
    }
  });

  // Add local spec versions that are not yet in allVersions
  localSpecVersions.forEach(version => {
    if (!processedVersions.has(version)) {
      const schemaPath = path.join(SPEC_DIR, `v${version}`, `ossa-${version}.schema.json`);
      const schemaExists = fs.existsSync(schemaPath);
      
      // Determine version type for local versions
      let versionType = 'local';
      if (version === '0.2.4-dev') {
        // v0.2.4-dev is a pre-release version
        versionType = 'prerelease';
      } else if (version.includes('-dev')) {
        // Other -dev versions (like 0.2.5-dev) are dev versions
        versionType = 'dev';
      } else if (version.includes('-pre') || version.includes('-rc') || version.includes('alpha') || version.includes('beta')) {
        versionType = 'prerelease';
      } else {
        // Stable versions (like 0.2.3)
        versionType = 'stable';
      }
      
      allVersions.push({
        version,
        tag: `v${version}`,
        apiVersion: `ossa/v${version}`,
        type: versionType,
        published: false,
        available: schemaExists,
        schemaPath: schemaExists ? schemaPath : undefined,
      });
      processedVersions.add(version);
    }
  });

  // Sort versions (latest stable first, then dev, then older stable, then local)
  allVersions.sort((a, b) => {
    // Prioritize stable, then dev, then prerelease, then local
    const typeOrder = { stable: 0, dev: 1, prerelease: 2, local: 3 };
    if (typeOrder[a.type] !== typeOrder[b.type]) {
      return typeOrder[a.type] - typeOrder[b.type];
    }

    // Then sort by version number (descending)
    const [aMajor, aMinor, aPatch] = a.version.split('.').map(Number);
    const [bMajor, bMinor, bPatch] = b.version.split('.').map(Number);
    if (aMajor !== bMajor) return bMajor - aMajor;
    if (aMinor !== bMinor) return bMinor - aMinor;
    return bPatch - aPatch;
  });

  // Prioritize npm's latest tag for stable version
  const npmStableVersion = distTags.latest || allVersions.find(v => v.type === 'stable' && v.published)?.version;
  const stableVersion = npmStableVersion || allVersions.find(v => v.type === 'stable')?.version || '0.2.3'; // Fallback
  
  // Prioritize npm's dev tag for dev version
  const npmDevVersion = distTags.dev || allVersions.find(v => (v.type === 'dev' || v.type === 'prerelease') && v.published)?.version;
  const devVersion = npmDevVersion || allVersions.find(v => v.type === 'dev')?.version || allVersions.find(v => v.type === 'prerelease')?.version || '0.2.5-dev'; // Fallback

  const versionsData = {
    stable: stableVersion,
    latest: stableVersion, // 'latest' dist-tag points to stable
    dev: devVersion, // 'dev' dist-tag points to dev
    all: allVersions,
    fallbackVersion: '0.2.3', // Fallback if all else fails
  };

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(versionsData, null, 2));
  console.log(`✅ Generated ${OUTPUT_FILE}`);
  console.log(`   Stable: ${versionsData.stable}`);
  console.log(`   Dev: ${versionsData.dev}`);
  console.log(`   Total versions: ${versionsData.all.length}`);
}

fetchVersions().catch(error => {
  console.error('Error in fetchVersions:', error);
  process.exit(1);
});
