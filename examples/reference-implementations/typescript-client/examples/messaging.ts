/**
 * Agent-to-Agent Messaging Example
 *
 * Demonstrates A2A messaging including:
 * - Sending messages
 * - Registering webhooks
 * - Event streaming
 */

import { OSSA } from '../src/index.js';

async function main() {
  const token = process.env.OSSA_TOKEN;
  if (!token) {
    console.error('❌ Error: OSSA_TOKEN environment variable is required');
    process.exit(1);
  }

  const client = new OSSA({ bearerToken: token });

  console.log('💬 OSSA TypeScript Client - Messaging Example\n');

  try {
    // 1. Send a simple A2A message
    console.log('1️⃣  Sending A2A message...');
    const messageResult = await client.messaging.sendMessage({
      from: {
        publisher: 'myorg',
        name: 'my-agent',
        version: '1.0.0',
      },
      to: {
        publisher: 'blueflyio',
        name: 'security-scanner',
        version: '2.0.0',
      },
      type: 'request',
      capability: 'vulnerability-scan',
      payload: {
        target: 'https://example.com',
        scan_type: 'full',
        options: {
          check_ssl: true,
          check_headers: true,
        },
      },
      metadata: {
        correlation_id: `scan-${Date.now()}`,
        priority: 'high',
        ttl: 300, // 5 minutes
      },
    });

    console.log(`   ✓ Message sent: ${messageResult.message_id}`);
    console.log(`   Status: ${messageResult.status}`);
    console.log(`   Timestamp: ${messageResult.timestamp}\n`);

    // 2. Send a synchronous request
    console.log('2️⃣  Sending synchronous request...');
    const requestResult = await client.messaging.sendRequest(
      {
        from: { publisher: 'myorg', name: 'my-agent' },
        to: { publisher: 'blueflyio', name: 'code-analyzer' },
        capability: 'analyze',
        payload: {
          code: 'function hello() { console.log("Hello"); }',
          language: 'javascript',
        },
      },
      30000 // 30 second timeout
    );

    console.log(`   Request: ${requestResult.request_id}`);
    console.log(`   Status: ${requestResult.status}`);

    if (requestResult.response) {
      console.log('   Response received:');
      console.log(`   ${JSON.stringify(requestResult.response.payload, null, 2)}\n`);
    }

    // 3. Broadcast a message
    console.log('3️⃣  Broadcasting message to all security agents...');
    const broadcastResult = await client.messaging.broadcast(
      {
        from: { publisher: 'myorg', name: 'my-agent' },
        capability: 'security-alert',
        payload: {
          alert_type: 'vulnerability_detected',
          severity: 'high',
          details: {
            cve: 'CVE-2024-1234',
            affected_systems: ['web-server-1', 'web-server-2'],
          },
        },
      },
      {
        domain: 'security',
        capability: 'incident-response',
      }
    );

    console.log(`   ✓ Broadcast sent: ${broadcastResult.broadcast_id}`);
    console.log(`   Recipients: ${broadcastResult.recipients_count} agents\n`);

    // 4. Register a webhook
    console.log('4️⃣  Registering webhook for agent events...');
    const webhook = await client.messaging.registerWebhook({
      url: 'https://example.com/webhooks/ossa',
      events: ['agent.deployed', 'agent.error', 'message.received'],
      filters: {
        publisher: 'blueflyio',
      },
      headers: {
        'X-Webhook-Secret': 'your-secret-key',
      },
      retry_config: {
        max_attempts: 3,
        backoff_strategy: 'exponential',
      },
    });

    console.log(`   ✓ Webhook registered: ${webhook.id}`);
    console.log(`   URL: ${webhook.url}`);
    console.log(`   Events: ${webhook.events.join(', ')}`);
    console.log(`   Active: ${webhook.active}\n`);

    // 5. Subscribe to events
    console.log('5️⃣  Subscribing to agent events...');
    const subscription = await client.messaging.subscribe({
      agent: {
        publisher: 'blueflyio',
        name: 'security-scanner',
      },
      events: ['scan.completed', 'scan.failed'],
      delivery_mode: 'polling',
    });

    console.log(`   ✓ Subscription created: ${subscription.subscription_id}`);
    console.log(`   Status: ${subscription.status}\n`);

    // 6. Stream events (demonstration)
    console.log('6️⃣  Streaming events (will run for 10 seconds)...');
    console.log('   Waiting for events...\n');

    const streamTimeout = setTimeout(() => {
      console.log('\n   ⏱️  Stream timeout - ending example');
    }, 10000);

    let eventCount = 0;
    try {
      for await (const event of client.messaging.streamEvents({
        agent: { publisher: 'blueflyio', name: 'security-scanner' },
        event_types: ['scan.completed'],
      })) {
        eventCount++;
        console.log(`   📨 Event ${eventCount}: ${event.event_type}`);
        console.log(`      Agent: ${event.agent.publisher}/${event.agent.name}`);
        console.log(`      Timestamp: ${event.timestamp}`);
        console.log(`      Payload: ${JSON.stringify(event.payload).substring(0, 100)}...\n`);

        if (eventCount >= 5) {
          clearTimeout(streamTimeout);
          break;
        }
      }
    } catch (error) {
      clearTimeout(streamTimeout);
      if (error instanceof Error && error.message.includes('timeout')) {
        console.log('   No events received during streaming period\n');
      } else {
        throw error;
      }
    }

    console.log('✅ Messaging example completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
    }
    process.exit(1);
  }
}

main();
