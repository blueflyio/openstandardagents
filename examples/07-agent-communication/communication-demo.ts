#!/usr/bin/env ts-node

/**
 * OAAS Agent Communication Demo
 * Demonstrates agent-to-agent communication across different frameworks
 */

import { 
  AgentCommunicationBridge, 
  DirectMessagingSystem,
  ProtocolAdapterFactory,
  OAASService 
} from '@bluefly/oaas-services';

class CommunicationDemo {
  private bridge!: AgentCommunicationBridge;
  private messaging!: DirectMessagingSystem;
  private oaasService!: OAASService;

  async initialize(): Promise<void> {
    console.log('🚀 Initializing OAAS Communication Demo\n');

    // Initialize communication bridge
    this.bridge = new AgentCommunicationBridge({
      agentId: 'demo-coordinator',
      endpoint: 'http://localhost:3000',
      framework: 'oaas',
      enableEncryption: false
    });

    // Initialize messaging system
    const protocolFactory = new ProtocolAdapterFactory();
    this.messaging = new DirectMessagingSystem(this.bridge, protocolFactory, {
      maxQueueSize: 500,
      messageRetentionDays: 1,
      enableDeliveryReceipts: true
    });

    // Initialize OAAS service for discovery
    this.oaasService = new OAASService({
      projectRoot: '/Users/flux423/Sites/LLM/.agents-workspace',
      runtimeTranslation: true,
      cacheEnabled: true
    });

    console.log('✅ Communication system initialized\n');
  }

  async discoverAndRegisterAgents(): Promise<void> {
    console.log('🔍 Discovering agents in workspace...');

    const discoveredAgents = await this.oaasService.discoverAgents();
    console.log(`Found ${discoveredAgents.length} agents\n`);

    // Register discovered agents as communication peers
    for (const agent of discoveredAgents) {
      if (agent.id !== 'demo-coordinator') {
        const peer = {
          id: agent.id,
          name: agent.name,
          endpoint: `http://localhost:${3000 + Math.floor(Math.random() * 1000)}`,
          framework: agent.format,
          capabilities: agent.capabilities?.map(c => c.name) || [],
          status: 'online' as const,
          last_seen: new Date().toISOString()
        };

        await this.bridge.registerPeer(peer);
        console.log(`📋 Registered: ${peer.name} (${peer.framework})`);
      }
    }

    console.log('\n✅ Agent registration complete\n');
  }

  async demonstrateDirectMessaging(): Promise<void> {
    console.log('💬 Demonstrating Direct Messaging\n');

    const peers = await this.bridge.discoverPeers();
    if (peers.length < 2) {
      console.log('⚠️  Need at least 2 peers for direct messaging demo\n');
      return;
    }

    const sender = 'demo-coordinator';
    const recipient = peers[0].id;

    console.log(`Sending message from ${sender} to ${recipient}...`);

    try {
      const message = await this.messaging.sendDirectMessage(
        sender,
        recipient,
        {
          task: 'code_analysis',
          file: 'src/example.ts',
          requirements: ['security', 'performance', 'maintainability']
        },
        {
          priority: 'high',
          timeout_ms: 15000,
          require_receipt: true
        }
      );

      console.log(`✅ Message sent: ${message.id}`);
      console.log(`   Conversation: ${message.conversation_id}`);
      console.log(`   Timestamp: ${message.timestamp}\n`);

    } catch (error) {
      console.error('❌ Message failed:', (error as Error).message, '\n');
    }
  }

  async demonstrateTopicMessaging(): Promise<void> {
    console.log('📢 Demonstrating Topic-Based Messaging\n');

    const peers = await this.bridge.discoverPeers();
    const topic = 'code-review-requests';

    // Subscribe multiple agents to the topic
    console.log(`Subscribing agents to topic: ${topic}`);
    
    const subscribers = peers.slice(0, 3);
    for (const peer of subscribers) {
      await this.messaging.subscribeToTopic(peer.id, topic);
      console.log(`📧 ${peer.name} subscribed to ${topic}`);
    }

    console.log('\nPublishing to topic...');

    try {
      const messages = await this.messaging.publishToTopic(
        'demo-coordinator',
        topic,
        {
          pull_request: 'PR-456',
          files: ['src/auth.ts', 'src/utils.ts', 'tests/auth.test.ts'],
          deadline: '2024-08-27T10:00:00Z',
          priority: 'high'
        },
        {
          priority: 'normal',
          exclude_self: true
        }
      );

      console.log(`✅ Published to ${messages.length} subscribers\n`);

    } catch (error) {
      console.error('❌ Topic publish failed:', (error as Error).message, '\n');
    }
  }

  async demonstrateBroadcastMessaging(): Promise<void> {
    console.log('📡 Demonstrating Broadcast Messaging\n');

    const peers = await this.bridge.discoverPeers();
    const recipients = peers.slice(0, 3).map(p => p.id);

    console.log(`Broadcasting to ${recipients.length} agents...`);

    try {
      const messages = await this.messaging.broadcastMessage(
        'demo-coordinator',
        recipients,
        {
          announcement: 'System maintenance scheduled',
          scheduled_time: '2024-08-27T02:00:00Z',
          duration_minutes: 30,
          affected_services: ['authentication', 'file-processing']
        },
        {
          priority: 'urgent',
          exclude_offline: true
        }
      );

      console.log(`✅ Broadcast sent to ${messages.length} agents`);
      
      messages.forEach((msg, i) => {
        console.log(`   ${i + 1}. ${msg.to} (${msg.id})`);
      });
      
      console.log('');

    } catch (error) {
      console.error('❌ Broadcast failed:', (error as Error).message, '\n');
    }
  }

  async demonstrateFrameworkInterop(): Promise<void> {
    console.log('🔄 Demonstrating Framework Interoperability\n');

    // Simulate messages from different frameworks
    const frameworkMessages = [
      {
        framework: 'mcp',
        message: {
          jsonrpc: '2.0',
          id: 'mcp-123',
          method: 'agent/request',
          params: {
            from: 'mcp-analyzer',
            payload: { task: 'syntax_check', file: 'main.py' }
          }
        }
      },
      {
        framework: 'langchain',
        message: {
          agent_id: 'langchain-processor',
          content: { task: 'document_summarization', document: 'requirements.md' },
          message_type: 'human',
          metadata: { chain_type: 'sequential' }
        }
      },
      {
        framework: 'crewai',
        message: {
          agent: 'crew-validator',
          description: 'Validate API responses for compliance',
          type: 'task',
          priority: 'high'
        }
      }
    ];

    const protocolFactory = new ProtocolAdapterFactory();

    for (const { framework, message } of frameworkMessages) {
      console.log(`Processing ${framework.toUpperCase()} message...`);

      try {
        const adapter = protocolFactory.getAdapter(framework);
        if (adapter) {
          const standardMessage = adapter.translateIncoming(message);
          console.log(`✅ Translated to standard format:`);
          console.log(`   From: ${standardMessage.from}`);
          console.log(`   Type: ${standardMessage.type}`);
          console.log(`   Payload:`, JSON.stringify(standardMessage.payload, null, 2));
          console.log('');
        }
      } catch (error) {
        console.error(`❌ Failed to process ${framework} message:`, (error as Error).message, '\n');
      }
    }
  }

  async demonstrateMessageQueues(): Promise<void> {
    console.log('📬 Demonstrating Message Queues\n');

    // Send several messages to create queue history
    const testMessages = [
      { content: 'First message', priority: 'normal' },
      { content: 'Second message', priority: 'high' },
      { content: 'Third message', priority: 'low' }
    ];

    const recipient = (await this.bridge.discoverPeers())[0]?.id;
    if (!recipient) {
      console.log('⚠️  No recipient available for queue demo\n');
      return;
    }

    for (const { content, priority } of testMessages) {
      await this.messaging.sendDirectMessage(
        'demo-coordinator',
        recipient,
        { message: content },
        { priority: priority as any }
      );
    }

    // Show queue contents
    const inboxQueue = this.messaging.getMessageQueue(recipient, 'inbox');
    const outboxQueue = this.messaging.getMessageQueue('demo-coordinator', 'outbox');

    console.log(`📥 ${recipient} inbox: ${inboxQueue?.messages.length || 0} messages`);
    console.log(`📤 demo-coordinator outbox: ${outboxQueue?.messages.length || 0} messages`);

    // Show unread messages
    const unreadMessages = this.messaging.getUnreadMessages(recipient);
    console.log(`📬 Unread messages for ${recipient}: ${unreadMessages.length}`);

    console.log('');
  }

  async showMessagingStatistics(): Promise<void> {
    console.log('📊 Communication Statistics\n');

    const stats = this.messaging.getMessagingStats();
    const healthCheck = await this.bridge.healthCheck();

    console.log(`Total Messages: ${stats.total_messages}`);
    console.log(`Active Conversations: ${stats.active_conversations}`);
    console.log(`Topic Subscriptions: ${stats.active_subscriptions}`);
    console.log(`Delivery Success Rate: ${(stats.delivery_success_rate * 100).toFixed(1)}%`);
    console.log(`Peers Online: ${healthCheck.peers_online}`);
    console.log(`Active Channels: ${healthCheck.channels_active}`);
    console.log(`System Status: ${healthCheck.status}`);

    console.log('\nQueue Sizes:');
    Object.entries(stats.queue_sizes).forEach(([queue, size]) => {
      console.log(`  ${queue}: ${size} messages`);
    });

    console.log('');
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up demo resources...');
    console.log('✅ Demo completed successfully!\n');
  }

  async runFullDemo(): Promise<void> {
    try {
      await this.initialize();
      await this.discoverAndRegisterAgents();
      await this.demonstrateDirectMessaging();
      await this.demonstrateTopicMessaging();
      await this.demonstrateBroadcastMessaging();
      await this.demonstrateFrameworkInterop();
      await this.demonstrateMessageQueues();
      await this.showMessagingStatistics();
    } catch (error) {
      console.error('❌ Demo failed:', (error as Error).message);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the demo
if (require.main === module) {
  const demo = new CommunicationDemo();
  demo.runFullDemo().catch(console.error);
}

export { CommunicationDemo };