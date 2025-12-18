#!/usr/bin/env python3
"""
Basic Usage Example

Demonstrates basic OSSA SDK usage including:
- Initializing the client
- Searching for agents
- Getting agent details
- Listing agent versions
"""

import os
from ossa_client import OSSA


def main():
    # Initialize the OSSA client
    client = OSSA(
        # bearer_token=os.getenv('OSSA_TOKEN'),  # Uncomment for authenticated requests
    )

    print('🚀 OSSA Python Client - Basic Usage Example\n')

    try:
        # 1. Search for security agents
        print('1️⃣  Searching for security agents...')
        results = client.agents.search(
            domain='security',
            limit=5,
            sort='downloads',
        )

        print(f"   Found {results['total']} security agents\n")

        for i, agent in enumerate(results['agents'], 1):
            print(f"   {i}. {agent['publisher']}/{agent['name']} v{agent['version']}")
            print(f"      {agent['description']}")
            print(f"      ⭐ {agent['rating']}/5 | 📥 {agent['downloads']} downloads\n")

        if not results['agents']:
            print('   No agents found. Try different search criteria.\n')
            return

        # 2. Get details for the first agent
        first_agent = results['agents'][0]
        print(f"2️⃣  Getting details for {first_agent['publisher']}/{first_agent['name']}...")

        agent = client.agents.get(first_agent['publisher'], first_agent['name'])

        print(f"   Agent: {agent['name']}")
        print(f"   Version: {agent['version']}")
        print(f"   Publisher: {agent['publisher']} {'✓' if agent.get('verified') else ''}")
        print(f"   License: {agent['license']}")
        print(f"   Taxonomy: {agent['taxonomy']['domain']} > {agent['taxonomy'].get('subdomain', 'N/A')}")
        print(f"   Capabilities: {', '.join(agent['capabilities'])}")
        print(f"   Downloads: {agent['download_stats']['total']} total, "
              f"{agent['download_stats']['last_month']} this month")
        print(f"   Rating: {agent['rating_info']['average']}/5 "
              f"({agent['rating_info']['count']} reviews)\n")

        # 3. List available versions
        print(f"3️⃣  Listing versions for {first_agent['publisher']}/{first_agent['name']}...")
        versions = client.agents.list_versions(first_agent['publisher'], first_agent['name'])

        print(f"   Available versions ({len(versions['versions'])}):\n")

        for version in versions['versions'][:5]:
            from datetime import datetime
            pub_date = datetime.fromisoformat(version['published_at'].replace('Z', '+00:00'))
            print(f"   - v{version['version']} ({pub_date.strftime('%Y-%m-%d')})")
            print(f"     📥 {version['downloads']} downloads")
            if version.get('deprecated'):
                print(f"     ⚠️  DEPRECATED: {version.get('deprecation_reason')}")

        print('\n✅ Basic usage example completed successfully!')

    except Exception as error:
        print(f'❌ Error: {error}')
        import sys
        sys.exit(1)


if __name__ == '__main__':
    main()
