#!/usr/bin/env python3
"""
Agent Publishing Example

Demonstrates how to publish an agent to the OSSA registry.
"""

import os
from ossa_client import OSSA


def main():
    # Initialize with authentication
    token = os.getenv('OSSA_TOKEN')
    if not token:
        print('❌ Error: OSSA_TOKEN environment variable is required')
        print('   Run: export OSSA_TOKEN=ossa_tok_xxx')
        import sys
        sys.exit(1)

    client = OSSA(bearer_token=token)

    print('📦 OSSA Python Client - Agent Publishing Example\n')

    # Define the agent manifest
    manifest = {
        'apiVersion': 'ossa/v0.3.0',
        'kind': 'Agent',
        'metadata': {
            'name': 'example-python-agent',
            'version': '1.0.0',
            'description': 'Example agent published from Python SDK',
            'labels': {
                'environment': 'production',
                'team': 'engineering',
            },
        },
        'spec': {
            'taxonomy': {
                'domain': 'development',
                'subdomain': 'testing',
                'capability': 'unit-testing',
            },
            'role': 'Automated testing agent that generates and executes unit tests',
            'llm': {
                'provider': 'anthropic',
                'model': 'claude-sonnet-4',
                'temperature': 0.2,
                'maxTokens': 4000,
            },
            'capabilities': [
                {
                    'name': 'generate_tests',
                    'description': 'Generate unit tests for code',
                    'input_schema': {
                        'type': 'object',
                        'required': ['code', 'language'],
                        'properties': {
                            'code': {'type': 'string'},
                            'language': {'type': 'string'},
                            'framework': {'type': 'string'},
                        },
                    },
                    'output_schema': {
                        'type': 'object',
                        'properties': {
                            'tests': {
                                'type': 'array',
                                'items': {
                                    'type': 'object',
                                    'properties': {
                                        'name': {'type': 'string'},
                                        'code': {'type': 'string'},
                                        'description': {'type': 'string'},
                                    },
                                },
                            },
                        },
                    },
                },
            ],
            'runtime': {
                'type': 'serverless',
                'config': {
                    'timeout': 300,
                    'memory': '1Gi',
                },
            },
        },
    }

    try:
        print('1️⃣  Publishing agent...')
        print(f"   Name: {manifest['metadata']['name']}")
        print(f"   Version: {manifest['metadata']['version']}")
        print(f"   Description: {manifest['metadata']['description']}\n")

        result = client.agents.publish(
            manifest=manifest,
            package={
                'tarball_url': 'https://example.com/agents/example-python-agent-1.0.0.tgz',
                'shasum': 'a' * 64,  # SHA-256 checksum
                'size_bytes': 1024 * 150,  # 150KB
            },
            documentation={
                'readme': 'https://github.com/example/example-python-agent#readme',
                'repository': 'https://github.com/example/example-python-agent',
            },
            license='Apache-2.0',
            keywords=['testing', 'unit-tests', 'python'],
        )

        print('✅ Agent published successfully!\n')
        print(f"   Status: {result['status']}")
        print(f"   Agent: {result['agent']['publisher']}/{result['agent']['name']}")
        print(f"   Version: {result['agent']['version']}")
        print(f"   Published at: {result['agent']['published_at']}")
        print(f"   Registry URL: {result['agent']['registry_url']}")
        print(f"   Package URL: {result['agent']['package_url']}\n")

        print('   Verification:')
        print(f"   - Schema valid: {'✓' if result['verification']['schema_valid'] else '✗'}")
        print(f"   - Security scan: {result['verification']['security_scan']}")
        print(f"   - Verified publisher: {'✓' if result['verification']['verified_publisher'] else '✗'}\n")

        if result['verification']['security_scan'] == 'pending':
            print('⏳ Security scan is pending. Check back later for results.')
            print(f"   Monitor at: {result['agent']['registry_url']}\n")

    except Exception as error:
        print(f'❌ Publishing failed: {error}')
        import sys
        sys.exit(1)


if __name__ == '__main__':
    main()
