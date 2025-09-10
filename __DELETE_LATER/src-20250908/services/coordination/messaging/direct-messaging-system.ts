/**
 * Direct Messaging System for Agent-to-Agent Communication
 * Provides real-time messaging capabilities between agents
 */

import { EventEmitter } from 'events';
import { AgentCommunicationBridge, AgentMessage, AgentPeer } from '../communication/AgentCommunicationBridge.js';
import { ProtocolAdapterFactory } from '../communication/ProtocolAdapters.js';

export interface MessageQueue {
  id: string;
  agent_id: string;
  messages: AgentMessage[];
  max_size: number;
  created_at: string;
  last_activity: string;
}

export interface ConversationContext {
  id: string;
  participants: string[];
  topic?: string;
  created_at: string;
  last_message: string;
  message_count: number;
  metadata?: any;
}

export interface MessageDeliveryReceipt {
  message_id: string;
  delivered_at: string;
  status: 'delivered' | 'failed' | 'pending' | 'read';
  recipient: string;
  error?: string;
}

export class DirectMessagingSystem extends EventEmitter {
  private messageQueues: Map<string, MessageQueue> = new Map();
  private conversations: Map<string, ConversationContext> = new Map();
  private deliveryReceipts: Map<string, MessageDeliveryReceipt> = new Map();
  private subscriptions: Map<string, Set<string>> = new Map(); // agent_id -> topic subscriptions
  
  constructor(
    private communicationBridge: AgentCommunicationBridge,
    private protocolFactory: ProtocolAdapterFactory,
    private config: {
      maxQueueSize?: number;
      messageRetentionDays?: number;
      enableDeliveryReceipts?: boolean;
      enableEncryption?: boolean;
    } = {}
  ) {
    super();
    this.setupDefaults();
    this.startCleanupTimer();
  }

  private setupDefaults(): void {
    this.config = {
      maxQueueSize: 1000,
      messageRetentionDays: 7,
      enableDeliveryReceipts: true,
      enableEncryption: false,
      ...this.config
    };
  }

  /**
   * Send direct message between agents
   */
  async sendDirectMessage(
    from: string,
    to: string,
    content: any,
    options: {
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      timeout_ms?: number;
      conversation_id?: string;
      require_receipt?: boolean;
    } = {}
  ): Promise<AgentMessage> {
    const message: AgentMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      from,
      to,
      type: 'request',
      payload: content,
      timestamp: new Date().toISOString(),
      conversation_id: options.conversation_id || await this.getOrCreateConversation([from, to]),
      metadata: {
        framework: 'oaas',
        priority: options.priority || 'normal',
        timeout_ms: options.timeout_ms || 30000,
        require_receipt: options.require_receipt || this.config.enableDeliveryReceipts
      } as any
    };

    // Add to sender's outbox and recipient's inbox
    await this.addToQueue(from, message, 'outbox');
    await this.addToQueue(to, message, 'inbox');

    // Send via communication bridge
    try {
      await this.communicationBridge.sendMessage(to, content, 'request');
      
      if (message.metadata?.require_receipt) {
        this.createDeliveryReceipt(message.id, to, 'delivered');
      }

      this.emit('message_sent', message);
    } catch (error) {
      if (message.metadata?.require_receipt) {
        this.createDeliveryReceipt(message.id, to, 'failed', (error as Error).message);
      }
      this.emit('message_failed', { message, error: (error as Error).message });
      throw error;
    }

    return message;
  }

  /**
   * Broadcast message to multiple agents
   */
  async broadcastMessage(
    from: string,
    recipients: string[],
    content: any,
    options: {
      topic?: string;
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      exclude_offline?: boolean;
    } = {}
  ): Promise<AgentMessage[]> {
    const messages: AgentMessage[] = [];
    
    // Filter recipients if excluding offline agents
    let validRecipients = recipients;
    if (options.exclude_offline) {
      const peers = await this.communicationBridge.discoverPeers();
      const onlinePeers = new Set(peers.filter(p => p.status === 'online').map(p => p.id));
      validRecipients = recipients.filter(id => onlinePeers.has(id));
    }

    // Create conversation for broadcast
    const conversationId = await this.getOrCreateConversation([from, ...validRecipients], options.topic);

    // Send to each recipient
    const sendPromises = validRecipients.map(async (recipient) => {
      return this.sendDirectMessage(from, recipient, content, {
        priority: options.priority,
        conversation_id: conversationId
      });
    });

    try {
      const results = await Promise.allSettled(sendPromises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          messages.push(result.value);
        } else {
          console.error(`Failed to send message to ${validRecipients[index]}:`, result.reason);
        }
      });

      this.emit('broadcast_sent', { from, recipients: validRecipients, messages });
    } catch (error) {
      this.emit('broadcast_failed', { from, recipients: validRecipients, error: (error as Error).message });
    }

    return messages;
  }

  /**
   * Subscribe to topic-based messaging
   */
  async subscribeToTopic(agentId: string, topic: string): Promise<void> {
    if (!this.subscriptions.has(agentId)) {
      this.subscriptions.set(agentId, new Set());
    }
    
    this.subscriptions.get(agentId)!.add(topic);
    this.emit('topic_subscribed', { agent_id: agentId, topic });
  }

  /**
   * Publish message to topic subscribers
   */
  async publishToTopic(
    from: string,
    topic: string,
    content: any,
    options: {
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      exclude_self?: boolean;
    } = {}
  ): Promise<AgentMessage[]> {
    // Find all subscribers to this topic
    const subscribers: string[] = [];
    
    for (const [agentId, topics] of this.subscriptions.entries()) {
      if (topics.has(topic) && (!options.exclude_self || agentId !== from)) {
        subscribers.push(agentId);
      }
    }

    if (subscribers.length === 0) {
      console.warn(`No subscribers found for topic: ${topic}`);
      return [];
    }

    // Broadcast to all subscribers
    return this.broadcastMessage(from, subscribers, content, {
      topic,
      priority: options.priority
    });
  }

  /**
   * Get message queue for agent
   */
  getMessageQueue(agentId: string, queueType: 'inbox' | 'outbox' = 'inbox'): MessageQueue | undefined {
    return this.messageQueues.get(`${agentId}-${queueType}`);
  }

  /**
   * Get unread messages for agent
   */
  getUnreadMessages(agentId: string): AgentMessage[] {
    const queue = this.getMessageQueue(agentId, 'inbox');
    if (!queue) return [];

    return queue.messages.filter(msg => !this.isMessageRead(agentId, msg.id));
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(agentId: string, messageId: string): Promise<void> {
    const receipt = this.deliveryReceipts.get(messageId);
    if (receipt && receipt.recipient === agentId) {
      receipt.status = 'read';
      this.emit('message_read', { agent_id: agentId, message_id: messageId });
    }
  }

  /**
   * Get conversation history
   */
  getConversationHistory(conversationId: string, limit: number = 50): AgentMessage[] {
    const messages: AgentMessage[] = [];
    
    for (const queue of this.messageQueues.values()) {
      const conversationMessages = queue.messages
        .filter(msg => msg.conversation_id === conversationId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      messages.push(...conversationMessages);
    }

    return messages.slice(-limit);
  }

  /**
   * Create or get existing conversation
   */
  private async getOrCreateConversation(participants: string[], topic?: string): Promise<string> {
    const sortedParticipants = participants.sort();
    const conversationKey = sortedParticipants.join('-');
    
    let conversation = Array.from(this.conversations.values())
      .find(c => c.participants.sort().join('-') === conversationKey);

    if (!conversation) {
      const conversationId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      conversation = {
        id: conversationId,
        participants: sortedParticipants,
        topic,
        created_at: new Date().toISOString(),
        last_message: new Date().toISOString(),
        message_count: 0
      };

      this.conversations.set(conversationId, conversation);
    }

    return conversation.id;
  }

  /**
   * Add message to queue
   */
  private async addToQueue(agentId: string, message: AgentMessage, queueType: 'inbox' | 'outbox'): Promise<void> {
    const queueId = `${agentId}-${queueType}`;
    let queue = this.messageQueues.get(queueId);

    if (!queue) {
      queue = {
        id: queueId,
        agent_id: agentId,
        messages: [],
        max_size: this.config.maxQueueSize!,
        created_at: new Date().toISOString(),
        last_activity: new Date().toISOString()
      };
      this.messageQueues.set(queueId, queue);
    }

    // Add message to queue
    queue.messages.push(message);
    queue.last_activity = new Date().toISOString();

    // Trim queue if it exceeds max size
    if (queue.messages.length > queue.max_size) {
      queue.messages = queue.messages.slice(-queue.max_size);
    }

    // Update conversation
    if (message.conversation_id) {
      const conversation = this.conversations.get(message.conversation_id);
      if (conversation) {
        conversation.last_message = message.timestamp;
        conversation.message_count += 1;
      }
    }
  }

  /**
   * Create delivery receipt
   */
  private createDeliveryReceipt(
    messageId: string,
    recipient: string,
    status: MessageDeliveryReceipt['status'],
    error?: string
  ): void {
    const receipt: MessageDeliveryReceipt = {
      message_id: messageId,
      delivered_at: new Date().toISOString(),
      status,
      recipient,
      error
    };

    this.deliveryReceipts.set(messageId, receipt);
  }

  /**
   * Check if message is read
   */
  private isMessageRead(agentId: string, messageId: string): boolean {
    const receipt = this.deliveryReceipts.get(messageId);
    return receipt?.recipient === agentId && receipt.status === 'read';
  }

  /**
   * Cleanup old messages and conversations
   */
  private startCleanupTimer(): void {
    const cleanupInterval = 1000 * 60 * 60; // 1 hour
    
    setInterval(() => {
      this.cleanupOldMessages();
    }, cleanupInterval);
  }

  private cleanupOldMessages(): void {
    const retentionMs = (this.config.messageRetentionDays! * 24 * 60 * 60 * 1000);
    const cutoffTime = Date.now() - retentionMs;

    // Clean message queues
    for (const queue of this.messageQueues.values()) {
      queue.messages = queue.messages.filter(
        msg => new Date(msg.timestamp).getTime() > cutoffTime
      );
    }

    // Clean delivery receipts
    for (const [messageId, receipt] of this.deliveryReceipts.entries()) {
      if (new Date(receipt.delivered_at).getTime() < cutoffTime) {
        this.deliveryReceipts.delete(messageId);
      }
    }

    // Clean empty conversations
    for (const [conversationId, conversation] of this.conversations.entries()) {
      if (new Date(conversation.last_message).getTime() < cutoffTime) {
        this.conversations.delete(conversationId);
      }
    }
  }

  /**
   * Get messaging statistics
   */
  getMessagingStats(): {
    total_messages: number;
    active_conversations: number;
    active_subscriptions: number;
    queue_sizes: Record<string, number>;
    delivery_success_rate: number;
  } {
    const totalMessages = Array.from(this.messageQueues.values())
      .reduce((sum, queue) => sum + queue.messages.length, 0);

    const queueSizes = Object.fromEntries(
      Array.from(this.messageQueues.entries())
        .map(([id, queue]) => [id, queue.messages.length])
    );

    const totalReceipts = this.deliveryReceipts.size;
    const successfulDeliveries = Array.from(this.deliveryReceipts.values())
      .filter(receipt => receipt.status === 'delivered' || receipt.status === 'read').length;

    const deliverySuccessRate = totalReceipts > 0 ? successfulDeliveries / totalReceipts : 1;

    return {
      total_messages: totalMessages,
      active_conversations: this.conversations.size,
      active_subscriptions: Array.from(this.subscriptions.values())
        .reduce((sum, topics) => sum + topics.size, 0),
      queue_sizes: queueSizes,
      delivery_success_rate: deliverySuccessRate
    };
  }
}