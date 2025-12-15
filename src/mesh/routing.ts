/**
 * Agent Mesh - Message Routing
 * Implements direct, broadcast, topic-based, and request/response routing patterns
 */

import {
  MessageEnvelope,
  MessageHandler,
  RoutingRule,
  MessagePriority,
  Subscription,
} from './types.js';
import { TopicUriParser, AgentUriParser } from './discovery.js';

/**
 * Message Router Interface
 */
export interface MessageRouter {
  /**
   * Route a message to its destination(s)
   */
  route(message: MessageEnvelope): Promise<string[]>;

  /**
   * Add a routing rule
   */
  addRule(rule: RoutingRule): void;

  /**
   * Remove a routing rule
   */
  removeRule(ruleId: string): void;

  /**
   * Get all routing rules
   */
  getRules(): RoutingRule[];
}

/**
 * Subscription Manager Interface
 */
export interface SubscriptionManager {
  /**
   * Subscribe to a channel
   */
  subscribe(subscription: Subscription, handler: MessageHandler): void;

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channel: string, handler: MessageHandler): void;

  /**
   * Get handlers for a channel
   */
  getHandlers(channel: string): MessageHandler[];

  /**
   * Check if there are any subscribers for a channel
   */
  hasSubscribers(channel: string): boolean;
}

/**
 * Message Filter
 * Evaluates whether a message matches filter criteria
 */
export class MessageFilter {
  /**
   * Check if message matches filter
   */
  static matches(message: MessageEnvelope, filter?: {
    expression?: string;
    fields?: Record<string, unknown>;
  }): boolean {
    if (!filter) {
      return true;
    }

    // Field-based filtering
    if (filter.fields) {
      for (const [key, value] of Object.entries(filter.fields)) {
        const messageValue = this.getNestedValue(message.payload, key);

        if (Array.isArray(value)) {
          // Check if messageValue is in array
          if (!value.includes(messageValue)) {
            return false;
          }
        } else if (messageValue !== value) {
          return false;
        }
      }
    }

    // Expression-based filtering (simplified - could use jmespath or similar)
    if (filter.expression) {
      // For now, just evaluate simple equality expressions
      // In production, use a proper expression evaluator
      return this.evaluateExpression(message, filter.expression);
    }

    return true;
  }

  private static getNestedValue(obj: unknown, path: string): unknown {
    if (typeof obj !== 'object' || obj === null) {
      return undefined;
    }

    const keys = path.split('.');
    let current: unknown = obj;

    for (const key of keys) {
      if (typeof current !== 'object' || current === null) {
        return undefined;
      }
      current = (current as Record<string, unknown>)[key];
    }

    return current;
  }

  private static evaluateExpression(message: MessageEnvelope, expression: string): boolean {
    // Simplified expression evaluation
    // In production, use a proper expression evaluator like jmespath
    try {
      // Example: "severity == 'high'"
      const match = expression.match(/^(\w+)\s*(==|!=|>|<|>=|<=)\s*'([^']+)'$/);
      if (match) {
        const [, field, operator, value] = match;
        const actualValue = this.getNestedValue(message.payload, field);

        switch (operator) {
          case '==':
            return actualValue === value;
          case '!=':
            return actualValue !== value;
          case '>':
            return (actualValue as number) > parseFloat(value);
          case '<':
            return (actualValue as number) < parseFloat(value);
          case '>=':
            return (actualValue as number) >= parseFloat(value);
          case '<=':
            return (actualValue as number) <= parseFloat(value);
          default:
            return false;
        }
      }
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Default Message Router Implementation
 */
export class DefaultMessageRouter implements MessageRouter {
  private rules: Map<string, RoutingRule> = new Map();

  async route(message: MessageEnvelope): Promise<string[]> {
    const destinations: Set<string> = new Set();

    // Direct routing
    if (AgentUriParser.isValid(message.to)) {
      destinations.add(message.to);
      return Array.from(destinations);
    }

    // Topic-based routing
    if (TopicUriParser.isTopic(message.to)) {
      const topic = TopicUriParser.parseTopic(message.to);
      if (topic) {
        // Find all rules that match this topic
        for (const rule of this.rules.values()) {
          if (rule.enabled !== false && rule.channel === topic) {
            // Check if message source matches
            if (rule.source === '*' || rule.source === message.from) {
              // Apply filter
              if (MessageFilter.matches(message, rule.filter)) {
                rule.targets.forEach((target) => destinations.add(target));
              }
            }
          }
        }
      }
    }

    // Broadcast routing
    if (TopicUriParser.isBroadcast(message.to)) {
      const namespace = TopicUriParser.parseBroadcast(message.to);
      if (namespace) {
        // Find all rules for this namespace
        for (const rule of this.rules.values()) {
          if (rule.enabled !== false) {
            // Check if targets are in the broadcast namespace
            rule.targets.forEach((target) => {
              const targetNamespace = AgentUriParser.getNamespace(target);
              if (targetNamespace === namespace) {
                destinations.add(target);
              }
            });
          }
        }
      }
    }

    return Array.from(destinations);
  }

  addRule(rule: RoutingRule): void {
    const ruleId = rule.id || this.generateRuleId(rule);
    this.rules.set(ruleId, { ...rule, id: ruleId });
  }

  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  getRules(): RoutingRule[] {
    return Array.from(this.rules.values());
  }

  private generateRuleId(rule: RoutingRule): string {
    return `${rule.source}-${rule.channel}-${Date.now()}`;
  }
}

/**
 * Default Subscription Manager Implementation
 */
export class DefaultSubscriptionManager implements SubscriptionManager {
  private subscriptions: Map<string, { subscription: Subscription; handlers: Set<MessageHandler> }> =
    new Map();

  subscribe(subscription: Subscription, handler: MessageHandler): void {
    const existing = this.subscriptions.get(subscription.channel);
    if (existing) {
      existing.handlers.add(handler);
    } else {
      this.subscriptions.set(subscription.channel, {
        subscription,
        handlers: new Set([handler]),
      });
    }
  }

  unsubscribe(channel: string, handler: MessageHandler): void {
    const subscription = this.subscriptions.get(channel);
    if (subscription) {
      subscription.handlers.delete(handler);
      if (subscription.handlers.size === 0) {
        this.subscriptions.delete(channel);
      }
    }
  }

  getHandlers(channel: string): MessageHandler[] {
    const handlers: MessageHandler[] = [];

    // Find exact matches
    const exactMatch = this.subscriptions.get(channel);
    if (exactMatch) {
      handlers.push(...Array.from(exactMatch.handlers));
    }

    // Find wildcard matches
    for (const [pattern, entry] of this.subscriptions.entries()) {
      if (pattern !== channel && TopicUriParser.matchesPattern(channel, pattern)) {
        handlers.push(...Array.from(entry.handlers));
      }
    }

    return handlers;
  }

  hasSubscribers(channel: string): boolean {
    return this.getHandlers(channel).length > 0;
  }

  /**
   * Get all subscriptions
   */
  getAllSubscriptions(): Subscription[] {
    return Array.from(this.subscriptions.values()).map((entry) => entry.subscription);
  }

  /**
   * Clear all subscriptions
   */
  clear(): void {
    this.subscriptions.clear();
  }
}

/**
 * Priority Queue for Message Processing
 */
export class MessagePriorityQueue {
  private queues: Map<MessagePriority, MessageEnvelope[]> = new Map([
    ['urgent', []],
    ['critical', []],
    ['high', []],
    ['normal', []],
    ['low', []],
  ]);

  private readonly priorityOrder: MessagePriority[] = ['urgent', 'critical', 'high', 'normal', 'low'];

  /**
   * Enqueue a message based on its priority
   */
  enqueue(message: MessageEnvelope): void {
    const priority = message.priority || 'normal';
    const queue = this.queues.get(priority);
    if (queue) {
      queue.push(message);
    }
  }

  /**
   * Dequeue the highest priority message
   */
  dequeue(): MessageEnvelope | undefined {
    for (const priority of this.priorityOrder) {
      const queue = this.queues.get(priority);
      if (queue && queue.length > 0) {
        return queue.shift();
      }
    }
    return undefined;
  }

  /**
   * Peek at the next message without removing it
   */
  peek(): MessageEnvelope | undefined {
    for (const priority of this.priorityOrder) {
      const queue = this.queues.get(priority);
      if (queue && queue.length > 0) {
        return queue[0];
      }
    }
    return undefined;
  }

  /**
   * Get the total number of messages in all queues
   */
  size(): number {
    let total = 0;
    for (const queue of this.queues.values()) {
      total += queue.length;
    }
    return total;
  }

  /**
   * Check if the queue is empty
   */
  isEmpty(): boolean {
    return this.size() === 0;
  }

  /**
   * Clear all messages from all queues
   */
  clear(): void {
    for (const queue of this.queues.values()) {
      queue.length = 0;
    }
  }

  /**
   * Get the number of messages for a specific priority
   */
  sizeForPriority(priority: MessagePriority): number {
    const queue = this.queues.get(priority);
    return queue ? queue.length : 0;
  }
}

/**
 * Message Transform
 * Applies transformations to messages based on routing rules
 */
export class MessageTransform {
  /**
   * Apply a transformation to a message
   */
  static transform(message: MessageEnvelope, transformExpression?: string): MessageEnvelope {
    if (!transformExpression) {
      return message;
    }

    // In production, use a proper transformation library like jmespath
    // For now, return the original message
    return message;
  }
}

/**
 * Routing Statistics
 */
export interface RoutingStats {
  totalMessages: number;
  messagesByPriority: Record<MessagePriority, number>;
  messagesByType: Record<string, number>;
  routingErrors: number;
  averageRoutingTimeMs: number;
}

/**
 * Routing Statistics Collector
 */
export class RoutingStatsCollector {
  private stats: RoutingStats = {
    totalMessages: 0,
    messagesByPriority: {
      low: 0,
      normal: 0,
      high: 0,
      urgent: 0,
      critical: 0,
    },
    messagesByType: {},
    routingErrors: 0,
    averageRoutingTimeMs: 0,
  };

  private routingTimes: number[] = [];

  recordMessage(message: MessageEnvelope, routingTimeMs: number): void {
    this.stats.totalMessages++;

    const priority = message.priority || 'normal';
    this.stats.messagesByPriority[priority]++;

    this.stats.messagesByType[message.type] =
      (this.stats.messagesByType[message.type] || 0) + 1;

    this.routingTimes.push(routingTimeMs);
    this.stats.averageRoutingTimeMs =
      this.routingTimes.reduce((sum, time) => sum + time, 0) / this.routingTimes.length;
  }

  recordError(): void {
    this.stats.routingErrors++;
  }

  getStats(): RoutingStats {
    return { ...this.stats };
  }

  reset(): void {
    this.stats = {
      totalMessages: 0,
      messagesByPriority: {
        low: 0,
        normal: 0,
        high: 0,
        urgent: 0,
        critical: 0,
      },
      messagesByType: {},
      routingErrors: 0,
      averageRoutingTimeMs: 0,
    };
    this.routingTimes = [];
  }
}
