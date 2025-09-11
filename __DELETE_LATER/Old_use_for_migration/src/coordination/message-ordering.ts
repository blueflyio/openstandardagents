/**
 * OSSA Message Ordering Protocol
 * Implements vector clocks, causal ordering, and delivery guarantees
 * for distributed agent coordination
 */

export interface VectorClock {
  agentId: string;
  clock: Map<string, number>;
  lastUpdate: Date;
}

export interface CausalMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: any;
  vectorClock: VectorClock;
  timestamp: Date;
  sequenceNumber: number;
  messageType: MessageType;
  priority: MessagePriority;
  deliveryGuarantee: DeliveryGuarantee;
  dependencies: string[]; // IDs of messages this depends on
  metadata: MessageMetadata;
}

export enum MessageType {
  HANDOFF_REQUEST = 'handoff_request',
  HANDOFF_PROPOSAL = 'handoff_proposal',
  CONSENSUS_VOTE = 'consensus_vote',
  TASK_UPDATE = 'task_update',
  HEARTBEAT = 'heartbeat',
  CONFLICT_RESOLUTION = 'conflict_resolution',
  JUDGMENT_REQUEST = 'judgment_request',
  COORDINATION_EVENT = 'coordination_event'
}

export enum MessagePriority {
  CRITICAL = 0,    // System critical messages
  HIGH = 1,        // Task coordination 
  MEDIUM = 2,      // Status updates
  LOW = 3          // Informational
}

export enum DeliveryGuarantee {
  AT_MOST_ONCE = 'at_most_once',      // Fire and forget
  AT_LEAST_ONCE = 'at_least_once',    // With retries
  EXACTLY_ONCE = 'exactly_once',      // Idempotent delivery
  CAUSAL_ORDER = 'causal_order',      // Respects causality
  TOTAL_ORDER = 'total_order'         // Global ordering
}

export interface MessageMetadata {
  correlationId: string;
  parentMessageId?: string;
  ttl: number; // Time to live in ms
  retryCount: number;
  maxRetries: number;
  acknowledgmentRequired: boolean;
  traceContext: string;
}

export interface MessageAcknowledgment {
  messageId: string;
  receiverId: string;
  senderId: string;
  acknowledged: boolean;
  timestamp: Date;
  processingTime: number;
  error?: string;
}

export interface DeliveryReceipt {
  messageId: string;
  status: 'delivered' | 'failed' | 'timeout' | 'duplicate';
  attempts: number;
  lastAttempt: Date;
  error?: string;
}

export class MessageOrderingService {
  private vectorClocks: Map<string, VectorClock> = new Map();
  private pendingMessages: Map<string, CausalMessage[]> = new Map();
  private deliveredMessages: Set<string> = new Set();
  private messageBuffer: Map<string, CausalMessage> = new Map();
  private sequenceCounters: Map<string, number> = new Map();
  private causalityGraph: Map<string, string[]> = new Map();
  private deliveryCallbacks: Map<string, (message: CausalMessage) => Promise<void>> = new Map();

  constructor(private agentId: string) {
    this.initializeVectorClock();
  }

  /**
   * Initialize vector clock for this agent
   */
  private initializeVectorClock(): void {
    this.vectorClocks.set(this.agentId, {
      agentId: this.agentId,
      clock: new Map([[this.agentId, 0]]),
      lastUpdate: new Date()
    });
  }

  /**
   * Create a new message with proper vector clock and ordering
   */
  createMessage(
    receiverId: string,
    content: any,
    messageType: MessageType,
    priority: MessagePriority = MessagePriority.MEDIUM,
    deliveryGuarantee: DeliveryGuarantee = DeliveryGuarantee.AT_LEAST_ONCE,
    dependencies: string[] = []
  ): CausalMessage {
    // Update vector clock
    const clock = this.vectorClocks.get(this.agentId)!;
    clock.clock.set(this.agentId, (clock.clock.get(this.agentId) || 0) + 1);
    clock.lastUpdate = new Date();

    // Generate sequence number
    const sequenceKey = `${this.agentId}-${receiverId}`;
    const sequenceNumber = (this.sequenceCounters.get(sequenceKey) || 0) + 1;
    this.sequenceCounters.set(sequenceKey, sequenceNumber);

    const messageId = `msg-${this.agentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const message: CausalMessage = {
      id: messageId,
      senderId: this.agentId,
      receiverId,
      content,
      vectorClock: {
        agentId: this.agentId,
        clock: new Map(clock.clock),
        lastUpdate: new Date(clock.lastUpdate)
      },
      timestamp: new Date(),
      sequenceNumber,
      messageType,
      priority,
      deliveryGuarantee,
      dependencies,
      metadata: {
        correlationId: `corr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ttl: this.getTTLForMessageType(messageType),
        retryCount: 0,
        maxRetries: this.getMaxRetriesForGuarantee(deliveryGuarantee),
        acknowledgmentRequired: this.requiresAcknowledgment(deliveryGuarantee),
        traceContext: `trace-${this.agentId}-${Date.now()}`
      }
    };

    // Update causality graph
    if (dependencies.length > 0) {
      this.causalityGraph.set(messageId, dependencies);
    }

    return message;
  }

  /**
   * Process incoming message with causal ordering
   */
  async receiveMessage(message: CausalMessage): Promise<void> {
    // Check for duplicate delivery
    if (this.deliveredMessages.has(message.id)) {
      console.warn(`Duplicate message received: ${message.id}`);
      return;
    }

    // Update vector clock with sender's clock
    await this.updateVectorClock(message.vectorClock);

    // Buffer message for ordering
    this.messageBuffer.set(message.id, message);

    // Check if message can be delivered now
    if (await this.canDeliver(message)) {
      await this.deliverMessage(message);
    } else {
      // Add to pending messages
      const pendingList = this.pendingMessages.get(message.receiverId) || [];
      pendingList.push(message);
      this.pendingMessages.set(message.receiverId, pendingList);
    }

    // Try to deliver any pending messages that are now ready
    await this.processPendingMessages();
  }

  /**
   * Check if message satisfies causal delivery conditions
   */
  private async canDeliver(message: CausalMessage): Promise<boolean> {
    // Check dependency satisfaction
    if (message.dependencies.length > 0) {
      for (const depId of message.dependencies) {
        if (!this.deliveredMessages.has(depId)) {
          return false;
        }
      }
    }

    // Check causal ordering for vector clocks
    if (message.deliveryGuarantee === DeliveryGuarantee.CAUSAL_ORDER || 
        message.deliveryGuarantee === DeliveryGuarantee.TOTAL_ORDER) {
      return await this.checkCausalOrdering(message);
    }

    return true;
  }

  /**
   * Check causal ordering using vector clocks
   */
  private async checkCausalOrdering(message: CausalMessage): Promise<boolean> {
    const myClocks = this.vectorClocks.get(this.agentId)!.clock;
    const senderClock = message.vectorClock.clock;

    // Check if sender's clock is causally ready
    for (const [agentId, senderTime] of senderClock) {
      if (agentId === message.senderId) {
        // Sender's own clock should be exactly one more than what we've seen
        const myTime = myClocks.get(agentId) || 0;
        if (senderTime !== myTime + 1) {
          return false;
        }
      } else {
        // For other agents, sender's clock should not be ahead of ours
        const myTime = myClocks.get(agentId) || 0;
        if (senderTime > myTime) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Deliver message to application
   */
  private async deliverMessage(message: CausalMessage): Promise<void> {
    try {
      // Mark as delivered
      this.deliveredMessages.add(message.id);

      // Update vector clock
      const myClocks = this.vectorClocks.get(this.agentId)!;
      myClocks.clock.set(message.senderId, 
        Math.max(
          myClocks.clock.get(message.senderId) || 0,
          message.vectorClock.clock.get(message.senderId) || 0
        )
      );

      // Call delivery callback if registered
      const callback = this.deliveryCallbacks.get(message.messageType);
      if (callback) {
        await callback(message);
      }

      // Send acknowledgment if required
      if (message.metadata.acknowledgmentRequired) {
        await this.sendAcknowledgment(message, true);
      }

      console.log(`Message delivered: ${message.id} from ${message.senderId}`);
    } catch (error) {
      console.error(`Failed to deliver message ${message.id}:`, error);
      if (message.metadata.acknowledgmentRequired) {
        await this.sendAcknowledgment(message, false, error.message);
      }
    }
  }

  /**
   * Process pending messages that may now be deliverable
   */
  private async processPendingMessages(): Promise<void> {
    const pendingList = this.pendingMessages.get(this.agentId) || [];
    const stillPending: CausalMessage[] = [];

    // Sort by priority and timestamp
    pendingList.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority; // Lower number = higher priority
      }
      return a.timestamp.getTime() - b.timestamp.getTime();
    });

    for (const message of pendingList) {
      if (await this.canDeliver(message)) {
        await this.deliverMessage(message);
      } else {
        stillPending.push(message);
      }
    }

    if (stillPending.length > 0) {
      this.pendingMessages.set(this.agentId, stillPending);
    } else {
      this.pendingMessages.delete(this.agentId);
    }
  }

  /**
   * Update vector clock from received message
   */
  private async updateVectorClock(receivedClock: VectorClock): Promise<void> {
    const myClocks = this.vectorClocks.get(this.agentId)!;

    // Update with max of received and local clocks
    for (const [agentId, time] of receivedClock.clock) {
      const currentTime = myClocks.clock.get(agentId) || 0;
      myClocks.clock.set(agentId, Math.max(currentTime, time));
    }

    myClocks.lastUpdate = new Date();
  }

  /**
   * Send acknowledgment for delivered message
   */
  private async sendAcknowledgment(
    message: CausalMessage,
    success: boolean,
    error?: string
  ): Promise<void> {
    const ack: MessageAcknowledgment = {
      messageId: message.id,
      receiverId: this.agentId,
      senderId: message.senderId,
      acknowledged: success,
      timestamp: new Date(),
      processingTime: Date.now() - message.timestamp.getTime(),
      error
    };

    // In real implementation, this would be sent through transport layer
    console.log(`Acknowledgment sent for message ${message.id}: ${success ? 'success' : 'failure'}`);
  }

  /**
   * Register callback for message type delivery
   */
  registerDeliveryCallback(
    messageType: MessageType,
    callback: (message: CausalMessage) => Promise<void>
  ): void {
    this.deliveryCallbacks.set(messageType, callback);
  }

  /**
   * Get causally ordered message history
   */
  getCausalHistory(messageId: string): string[] {
    const history: string[] = [];
    const visited = new Set<string>();

    const traverse = (msgId: string) => {
      if (visited.has(msgId)) return;
      visited.add(msgId);

      const dependencies = this.causalityGraph.get(msgId) || [];
      for (const depId of dependencies) {
        traverse(depId);
      }
      
      history.push(msgId);
    };

    traverse(messageId);
    return history;
  }

  /**
   * Check if two messages are causally concurrent
   */
  areConcurrent(message1: CausalMessage, message2: CausalMessage): boolean {
    const clock1 = message1.vectorClock.clock;
    const clock2 = message2.vectorClock.clock;

    let message1First = false;
    let message2First = false;

    // Compare vector clocks
    const allAgents = new Set([...clock1.keys(), ...clock2.keys()]);
    
    for (const agentId of allAgents) {
      const time1 = clock1.get(agentId) || 0;
      const time2 = clock2.get(agentId) || 0;

      if (time1 > time2) message1First = true;
      if (time2 > time1) message2First = true;
    }

    // If both flags are true or both are false, messages are concurrent
    return (message1First && message2First) || (!message1First && !message2First);
  }

  /**
   * Get TTL based on message type
   */
  private getTTLForMessageType(messageType: MessageType): number {
    const ttlMap = {
      [MessageType.HANDOFF_REQUEST]: 300000,      // 5 minutes
      [MessageType.HANDOFF_PROPOSAL]: 300000,     // 5 minutes
      [MessageType.CONSENSUS_VOTE]: 180000,       // 3 minutes
      [MessageType.TASK_UPDATE]: 600000,          // 10 minutes
      [MessageType.HEARTBEAT]: 30000,             // 30 seconds
      [MessageType.CONFLICT_RESOLUTION]: 600000,  // 10 minutes
      [MessageType.JUDGMENT_REQUEST]: 900000,     // 15 minutes
      [MessageType.COORDINATION_EVENT]: 300000    // 5 minutes
    };

    return ttlMap[messageType] || 300000;
  }

  /**
   * Get max retries based on delivery guarantee
   */
  private getMaxRetriesForGuarantee(guarantee: DeliveryGuarantee): number {
    const retryMap = {
      [DeliveryGuarantee.AT_MOST_ONCE]: 0,
      [DeliveryGuarantee.AT_LEAST_ONCE]: 3,
      [DeliveryGuarantee.EXACTLY_ONCE]: 5,
      [DeliveryGuarantee.CAUSAL_ORDER]: 5,
      [DeliveryGuarantee.TOTAL_ORDER]: 10
    };

    return retryMap[guarantee] || 3;
  }

  /**
   * Check if delivery guarantee requires acknowledgment
   */
  private requiresAcknowledgment(guarantee: DeliveryGuarantee): boolean {
    return guarantee === DeliveryGuarantee.AT_LEAST_ONCE ||
           guarantee === DeliveryGuarantee.EXACTLY_ONCE ||
           guarantee === DeliveryGuarantee.CAUSAL_ORDER ||
           guarantee === DeliveryGuarantee.TOTAL_ORDER;
  }

  /**
   * Clean up expired messages and state
   */
  async cleanup(): Promise<void> {
    const now = Date.now();
    
    // Clean expired messages from buffer
    for (const [id, message] of this.messageBuffer) {
      if (now - message.timestamp.getTime() > message.metadata.ttl) {
        this.messageBuffer.delete(id);
        console.log(`Expired message removed: ${id}`);
      }
    }

    // Clean old delivered message IDs (keep last 10000)
    if (this.deliveredMessages.size > 10000) {
      const sortedMessages = Array.from(this.deliveredMessages).sort();
      const toRemove = sortedMessages.slice(0, sortedMessages.length - 10000);
      toRemove.forEach(id => this.deliveredMessages.delete(id));
    }

    // Clean old causality graph entries
    for (const [msgId, deps] of this.causalityGraph) {
      if (!this.messageBuffer.has(msgId) && !this.deliveredMessages.has(msgId)) {
        this.causalityGraph.delete(msgId);
      }
    }
  }
}

/**
 * Total ordering service using logical timestamps
 */
export class TotalOrderingService extends MessageOrderingService {
  private globalSequenceNumber: number = 0;
  private coordinatorId: string;

  constructor(agentId: string, coordinatorId: string) {
    super(agentId);
    this.coordinatorId = coordinatorId;
  }

  /**
   * Assign total ordering using coordinator
   */
  async assignTotalOrder(message: CausalMessage): Promise<number> {
    // In real implementation, this would communicate with coordinator
    return ++this.globalSequenceNumber;
  }

  /**
   * Deliver messages in total order
   */
  async deliverInTotalOrder(messages: CausalMessage[]): Promise<void> {
    // Sort by global sequence number
    const sortedMessages = messages
      .filter(msg => msg.deliveryGuarantee === DeliveryGuarantee.TOTAL_ORDER)
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber);

    // Deliver in order
    for (const message of sortedMessages) {
      await this.receiveMessage(message);
    }
  }
}