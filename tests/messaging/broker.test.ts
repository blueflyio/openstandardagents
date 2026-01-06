/**
 * Tests for OSSA v0.3.1 Message Broker
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { randomUUID } from 'crypto';
import { BrokerFactory } from '../../src/messaging/broker.js';
import { MemoryMessageBroker } from '../../src/messaging/protocols/memory.js';
import { Message, Subscription } from '../../src/messaging/types.js';

describe('Message Broker', () => {
  let broker: MemoryMessageBroker;

  beforeEach(async () => {
    broker = await BrokerFactory.create('memory', {}) as MemoryMessageBroker;
  });

  afterEach(async () => {
    await broker.close();
  });

  describe('Message Publishing', () => {
    it('should publish a valid message', async () => {
      const message: Message = {
        id: randomUUID(),
        channel: 'agents.test.message',
        sender: 'ossa://agents/test-agent',
        timestamp: new Date().toISOString(),
        type: 'TestMessage',
        payload: { data: 'test' },
      };

      await expect(broker.publish('agents.test.message', message)).resolves.not.toThrow();
    });

    it('should reject message with invalid channel format', async () => {
      const message: Message = {
        id: randomUUID(),
        channel: 'invalid-channel',
        sender: 'ossa://agents/test-agent',
        timestamp: new Date().toISOString(),
        type: 'TestMessage',
        payload: { data: 'test' },
      };

      await expect(broker.publish('invalid-channel', message)).rejects.toThrow('Invalid channel name');
    });

    it('should reject message with invalid sender format', async () => {
      const message: Message = {
        id: randomUUID(),
        channel: 'agents.test.message',
        sender: 'invalid-sender',
        timestamp: new Date().toISOString(),
        type: 'TestMessage',
        payload: { data: 'test' },
      };

      await expect(broker.publish('agents.test.message', message)).rejects.toThrow('Invalid sender format');
    });

    it('should reject message without required fields', async () => {
      const message = {
        id: randomUUID(),
        channel: 'agents.test.message',
        // Missing sender, timestamp, type, payload
      } as Message;

      await expect(broker.publish('agents.test.message', message)).rejects.toThrow();
    });
  });

  describe('Message Subscription', () => {
    it('should subscribe to a channel', async () => {
      const subscription: Subscription = {
        channel: 'agents.test.message',
        handler: 'handleMessage',
      };

      const handle = await broker.subscribe(subscription, async (msg) => {
        console.log('Received:', msg);
      });

      expect(handle).toBeDefined();
      expect(handle.id).toBeDefined();
      expect(handle.channel).toBe('agents.test.message');
    });

    it('should receive published messages', async () => {
      let receivedMessage: Message | undefined;

      const subscription: Subscription = {
        channel: 'agents.test.message',
        handler: 'handleMessage',
      };

      await broker.subscribe(subscription, async (msg) => {
        receivedMessage = msg;
      });

      const message: Message = {
        id: randomUUID(),
        channel: 'agents.test.message',
        sender: 'ossa://agents/test-agent',
        timestamp: new Date().toISOString(),
        type: 'TestMessage',
        payload: { data: 'test' },
      };

      await broker.publish('agents.test.message', message);

      // Wait for async delivery
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(receivedMessage).toBeDefined();
      expect(receivedMessage?.id).toBe(message.id);
      expect(receivedMessage?.payload).toEqual(message.payload);
    });

    it('should support wildcard subscriptions (*)', async () => {
      const receivedMessages: Message[] = [];

      const subscription: Subscription = {
        channel: 'agents.*.message',
        handler: 'handleMessage',
      };

      await broker.subscribe(subscription, async (msg) => {
        receivedMessages.push(msg);
      });

      const message1: Message = {
        id: randomUUID(),
        channel: 'agents.test1.message',
        sender: 'ossa://agents/test-agent',
        timestamp: new Date().toISOString(),
        type: 'TestMessage',
        payload: { data: 'test1' },
      };

      const message2: Message = {
        id: randomUUID(),
        channel: 'agents.test2.message',
        sender: 'ossa://agents/test-agent',
        timestamp: new Date().toISOString(),
        type: 'TestMessage',
        payload: { data: 'test2' },
      };

      await broker.publish('agents.test1.message', message1);
      await broker.publish('agents.test2.message', message2);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(receivedMessages).toHaveLength(2);
    });

    it('should support multi-level wildcard subscriptions (#)', async () => {
      const receivedMessages: Message[] = [];

      const subscription: Subscription = {
        channel: 'agents.#',
        handler: 'handleMessage',
      };

      await broker.subscribe(subscription, async (msg) => {
        receivedMessages.push(msg);
      });

      const message1: Message = {
        id: randomUUID(),
        channel: 'agents.test.message',
        sender: 'ossa://agents/test-agent',
        timestamp: new Date().toISOString(),
        type: 'TestMessage',
        payload: { data: 'test1' },
      };

      const message2: Message = {
        id: randomUUID(),
        channel: 'agents.deep.nested.message',
        sender: 'ossa://agents/test-agent',
        timestamp: new Date().toISOString(),
        type: 'TestMessage',
        payload: { data: 'test2' },
      };

      await broker.publish('agents.test.message', message1);
      await broker.publish('agents.deep.nested.message', message2);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(receivedMessages.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter messages based on subscription filter', async () => {
      let receivedMessage: Message | undefined;

      const subscription: Subscription = {
        channel: 'agents.test.message',
        handler: 'handleMessage',
        filter: {
          'payload.priority': 'high',
        },
      };

      await broker.subscribe(subscription, async (msg) => {
        receivedMessage = msg;
      });

      // This should NOT be received (wrong priority)
      const message1: Message = {
        id: randomUUID(),
        channel: 'agents.test.message',
        sender: 'ossa://agents/test-agent',
        timestamp: new Date().toISOString(),
        type: 'TestMessage',
        payload: { priority: 'low', data: 'test1' },
      };

      await broker.publish('agents.test.message', message1);
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(receivedMessage).toBeUndefined();

      // This SHOULD be received (matching priority)
      const message2: Message = {
        id: randomUUID(),
        channel: 'agents.test.message',
        sender: 'ossa://agents/test-agent',
        timestamp: new Date().toISOString(),
        type: 'TestMessage',
        payload: { priority: 'high', data: 'test2' },
      };

      await broker.publish('agents.test.message', message2);
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(receivedMessage).toBeDefined();
      expect(receivedMessage?.id).toBe(message2.id);
    });

    it('should unsubscribe from a channel', async () => {
      let receivedCount = 0;

      const subscription: Subscription = {
        channel: 'agents.test.message',
        handler: 'handleMessage',
      };

      const handle = await broker.subscribe(subscription, async () => {
        receivedCount++;
      });

      const message: Message = {
        id: randomUUID(),
        channel: 'agents.test.message',
        sender: 'ossa://agents/test-agent',
        timestamp: new Date().toISOString(),
        type: 'TestMessage',
        payload: { data: 'test' },
      };

      await broker.publish('agents.test.message', message);
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(receivedCount).toBe(1);

      await handle.unsubscribe();

      await broker.publish('agents.test.message', message);
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(receivedCount).toBe(1); // Should still be 1
    });
  });

  describe('Message Acknowledgment', () => {
    it('should acknowledge a message', async () => {
      const messageId = randomUUID();
      await expect(broker.acknowledge(messageId)).resolves.not.toThrow();
    });

    it('should nack a message with requeue', async () => {
      const messageId = randomUUID();
      await expect(broker.nack(messageId, true)).resolves.not.toThrow();
    });

    it('should nack a message without requeue (send to DLQ)', async () => {
      const messageId = randomUUID();
      await expect(broker.nack(messageId, false)).resolves.not.toThrow();
    });
  });

  describe('Broker Statistics', () => {
    it('should return broker statistics', () => {
      const stats = broker.getStats();
      expect(stats).toBeDefined();
      expect(stats.channels).toBeGreaterThanOrEqual(0);
      expect(stats.totalMessages).toBeGreaterThanOrEqual(0);
      expect(stats.activeSubscriptions).toBeGreaterThanOrEqual(0);
    });
  });
});
