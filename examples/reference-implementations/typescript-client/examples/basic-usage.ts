/**
 * Basic Usage Example
 *
 * Demonstrates basic OSSA SDK usage including:
 * - Initializing the client
 * - Searching for agents
 * - Getting agent details
 * - Listing agent versions
 */

import { OSSA } from '../src/index.js';

async function main() {
  // Initialize the OSSA client
  const client = new OSSA({
    // bearerToken: process.env.OSSA_TOKEN, // Uncomment for authenticated requests
  });

  console.log('🚀 OSSA TypeScript Client - Basic Usage Example\n');

  try {
    // 1. Search for security agents
    console.log('1️⃣  Searching for security agents...');
    const searchResults = await client.agents.search({
      domain: 'security',
      limit: 5,
      sort: 'downloads',
    });

    console.log(`   Found ${searchResults.total} security agents\n`);
    searchResults.agents.forEach((agent, i) => {
      console.log(`   ${i + 1}. ${agent.publisher}/${agent.name} v${agent.version}`);
      console.log(`      ${agent.description}`);
      console.log(`      ⭐ ${agent.rating}/5 | 📥 ${agent.downloads} downloads\n`);
    });

    if (searchResults.agents.length === 0) {
      console.log('   No agents found. Try different search criteria.\n');
      return;
    }

    // 2. Get details for the first agent
    const firstAgent = searchResults.agents[0];
    console.log(`2️⃣  Getting details for ${firstAgent.publisher}/${firstAgent.name}...`);

    const agentDetails = await client.agents.get(
      firstAgent.publisher,
      firstAgent.name
    );

    console.log(`   Agent: ${agentDetails.name}`);
    console.log(`   Version: ${agentDetails.version}`);
    console.log(`   Publisher: ${agentDetails.publisher} ${agentDetails.verified ? '✓' : ''}`);
    console.log(`   License: ${agentDetails.license}`);
    console.log(`   Taxonomy: ${agentDetails.taxonomy.domain} > ${agentDetails.taxonomy.subdomain || 'N/A'}`);
    console.log(`   Capabilities: ${agentDetails.capabilities.join(', ')}`);
    console.log(`   Downloads: ${agentDetails.download_stats.total} total, ${agentDetails.download_stats.last_month} this month`);
    console.log(`   Rating: ${agentDetails.rating_info.average}/5 (${agentDetails.rating_info.count} reviews)\n`);

    // 3. List available versions
    console.log(`3️⃣  Listing versions for ${firstAgent.publisher}/${firstAgent.name}...`);
    const versions = await client.agents.listVersions(
      firstAgent.publisher,
      firstAgent.name
    );

    console.log(`   Available versions (${versions.versions.length}):\n`);
    versions.versions.slice(0, 5).forEach((version) => {
      console.log(`   - v${version.version} (${new Date(version.published_at).toLocaleDateString()})`);
      console.log(`     📥 ${version.downloads} downloads`);
      if (version.deprecated) {
        console.log(`     ⚠️  DEPRECATED: ${version.deprecation_reason}`);
      }
    });

    console.log('\n✅ Basic usage example completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
    }
    process.exit(1);
  }
}

main();
