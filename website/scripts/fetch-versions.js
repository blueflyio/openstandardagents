const fs = require('fs');
const path = require('path');
const https = require('https');

const NPM_PACKAGE_NAME = '@bluefly/openstandardagents';
const NPM_REGISTRY_URL = `https://registry.npmjs.org/${NPM_PACKAGE_NAME}`;
const GITHUB_REPO = 'blueflyio/openstandardagents';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/tags`;
const SPEC_DIR = path.join(__dirname, '../../spec');
const OUTPUT_FILE = path.join(__dirname, '../lib/versions.json');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'OSSA-Website-Build'
    };
    
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }
    
    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

async function fetchGitHubTags() {
  console.log('Fetching tags from GitHub...');
  const tags = [];
  
  try {
    let page = 1;
    let hasMore = true;
    
    while (hasMore && page <= 5) {
      const url = `${GITHUB_API_URL}?per_page=100&page=${page}`;
      const data = await fetchJson(url);
      
      if (data.length === 0) {
        hasMore = false;
      } else {
        tags.push(...data.map(tag => tag.name));
        page++;
      }
    }
    
    console.log(`Found ${tags.length} tags from GitHub`);
    return tags;
  } catch (error) {
    console.error('Error fetching GitHub tags:', error.message);
    return [];
  }
}

async function fetchVersions() {
  console.log('Fetching version information...');

  let npmVersions = [];
  let distTags = {};
  let githubTags = [];

  try {
    console.log(`Querying npm registry: ${NPM_REGISTRY_URL}`);
    const data = await fetchJson(NPM_REGISTRY_URL);

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

  // Fetch tags from GitHub
  githubTags = await fetchGitHubTags();

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
      // Use relative path for schemaPath (relative to project root)
      const relativeSchemaPath = `spec/v${version}/ossa-${version}.schema.json`;

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
        // Only store relative path, never absolute paths
        schemaPath: schemaExists ? relativeSchemaPath : undefined,
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

  // Parse GitHub tags to find latest stable and dev
  const parseGitHubTag = (tag) => {
    // Remove 'v' prefix if present
    const version = tag.startsWith('v') ? tag.substring(1) : tag;
    return { tag, version };
  };

  // Find latest stable tag from GitHub (e.g., v0.3.0, v0.2.8)
  const stableGitHubTags = githubTags
    .map(parseGitHubTag)
    .filter(({ version }) => {
      // Stable tags: v0.3.0, v0.2.8 (no -dev suffix)
      const parts = version.split('.');
      return parts.length === 3 && 
             !version.includes('-dev') && 
             !version.includes('-pre') && 
             !version.includes('-rc') &&
             !version.includes('alpha') &&
             !version.includes('beta');
    })
    .sort((a, b) => {
      // Sort by version number (descending)
      const [aMajor, aMinor, aPatch] = a.version.split('.').map(Number);
      const [bMajor, bMinor, bPatch] = b.version.split('.').map(Number);
      if (aMajor !== bMajor) return bMajor - aMajor;
      if (aMinor !== bMinor) return bMinor - aMinor;
      return bPatch - aPatch;
    });

  // Find latest dev tag from GitHub (e.g., v0.3.x-dev.1, v0.3.x-dev.2)
  const devGitHubTags = githubTags
    .map(parseGitHubTag)
    .filter(({ version }) => {
      // Dev tags: v0.3.x-dev.1, v0.3.x-dev.2, etc.
      return version.includes('-dev.');
    })
    .sort((a, b) => {
      // Extract version and dev number for sorting
      const aMatch = a.version.match(/^(\d+)\.(\d+)\.x-dev\.(\d+)$/);
      const bMatch = b.version.match(/^(\d+)\.(\d+)\.x-dev\.(\d+)$/);
      if (!aMatch || !bMatch) return 0;
      
      const [, aMajor, aMinor, aDev] = aMatch.map(Number);
      const [, bMajor, bMinor, bDev] = bMatch.map(Number);
      
      if (aMajor !== bMajor) return bMajor - aMajor;
      if (aMinor !== bMinor) return bMinor - aMinor;
      return bDev - aDev;
    });

  // Get latest stable and dev tags from GitHub
  const latestStableTag = stableGitHubTags[0];
  const latestDevTag = devGitHubTags[0];

  // Prioritize npm's latest tag for stable version
  const npmStableVersion = distTags.latest || allVersions.find(v => v.type === 'stable' && v.published)?.version;
  const stableVersion = latestStableTag?.version || npmStableVersion || allVersions.find(v => v.type === 'stable')?.version || '0.2.3';
  const stableTag = latestStableTag?.tag || `v${stableVersion}`;
  
  // Prioritize npm's dev tag for dev version
  const npmDevVersion = distTags.dev || allVersions.find(v => (v.type === 'dev' || v.type === 'prerelease') && v.published)?.version;
  const devVersion = latestDevTag?.version || npmDevVersion || allVersions.find(v => v.type === 'dev')?.version || allVersions.find(v => v.type === 'prerelease')?.version || '0.2.5-dev';
  const devTag = latestDevTag?.tag || `v${devVersion}`;

  const versionsData = {
    stable: stableVersion,
    stableTag: stableTag,
    latest: stableVersion, // 'latest' dist-tag points to stable
    dev: devVersion,
    devTag: devTag,
    all: allVersions,
    githubTags: {
      latestStable: latestStableTag?.tag || null,
      latestDev: latestDevTag?.tag || null,
      total: githubTags.length
    },
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
