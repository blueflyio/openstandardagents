/**
 * Tests for OSSA v0.3.1 Channel Management
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ChannelManager, ChannelFactory } from '../../src/messaging/channels.js';
import { Channel } from '../../src/messaging/types.js';

describe('Channel Manager', () => {
  let channelManager: ChannelManager;

  beforeEach(() => {
    channelManager = new ChannelManager();
  });

  describe('Channel Creation', () => {
    it('should create a valid direct channel', async () => {
      const channel: Channel = {
        name: 'agents.test-agent.tasks',
        type: 'direct',
        description: 'Direct task channel',
      };

      await expect(channelManager.create(channel)).resolves.not.toThrow();

      const created = await channelManager.get('agents.test-agent.tasks');
      expect(created).toBeDefined();
      expect(created?.type).toBe('direct');
    });

    it('should create a valid topic channel', async () => {
      const channel: Channel = {
        name: 'agents.tasks.completed',
        type: 'topic',
        description: 'Task completion events',
      };

      await expect(channelManager.create(channel)).resolves.not.toThrow();

      const created = await channelManager.get('agents.tasks.completed');
      expect(created).toBeDefined();
      expect(created?.type).toBe('topic');
    });

    it('should create a valid broadcast channel', async () => {
      const channel: Channel = {
        name: 'agents.broadcast.shutdown',
        type: 'broadcast',
        description: 'System shutdown notification',
      };

      await expect(channelManager.create(channel)).resolves.not.toThrow();

      const created = await channelManager.get('agents.broadcast.shutdown');
      expect(created).toBeDefined();
      expect(created?.type).toBe('broadcast');
    });

    it('should reject invalid channel name format', async () => {
      const channel: Channel = {
        name: 'invalid-channel',
        type: 'direct',
      };

      await expect(channelManager.create(channel)).rejects.toThrow('Invalid channel name format');
    });

    it('should reject direct channel with wrong naming convention', async () => {
      const channel: Channel = {
        name: 'agents.wrong.format.name',
        type: 'direct',
      };

      await expect(channelManager.create(channel)).rejects.toThrow('Direct channel must follow format');
    });

    it('should reject broadcast channel without broadcast prefix', async () => {
      const channel: Channel = {
        name: 'agents.wrong.shutdown',
        type: 'broadcast',
      };

      await expect(channelManager.create(channel)).rejects.toThrow('Broadcast channel must start with');
    });

    it('should reject duplicate channel creation', async () => {
      const channel: Channel = {
        name: 'agents.test.channel',
        type: 'topic',
      };

      await channelManager.create(channel);
      await expect(channelManager.create(channel)).rejects.toThrow('Channel already exists');
    });

    it('should validate QoS settings', async () => {
      const channel: Channel = {
        name: 'agents.test.channel',
        type: 'topic',
        qos: {
          maxRetries: 150, // Invalid: exceeds max of 100
        },
      };

      await expect(channelManager.create(channel)).rejects.toThrow('maxRetries must be between 0 and 100');
    });

    it('should validate config settings', async () => {
      const channel: Channel = {
        name: 'agents.test.channel',
        type: 'topic',
        config: {
          maxMessageSize: 500, // Invalid: below min of 1KB
        },
      };

      await expect(channelManager.create(channel)).rejects.toThrow('maxMessageSize must be between');
    });
  });

  describe('Channel Retrieval', () => {
    it('should get an existing channel', async () => {
      const channel: Channel = {
        name: 'agents.test.channel',
        type: 'topic',
      };

      await channelManager.create(channel);

      const retrieved = await channelManager.get('agents.test.channel');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('agents.test.channel');
    });

    it('should return undefined for non-existent channel', async () => {
      const retrieved = await channelManager.get('agents.nonexistent.channel');
      expect(retrieved).toBeUndefined();
    });

    it('should list all channels', async () => {
      const channel1: Channel = {
        name: 'agents.test1.channel',
        type: 'topic',
      };

      const channel2: Channel = {
        name: 'agents.test2.channel',
        type: 'direct',
      };

      await channelManager.create(channel1);
      await channelManager.create(channel2);

      const channels = await channelManager.list();
      expect(channels).toHaveLength(2);
    });

    it('should check if channel exists', async () => {
      const channel: Channel = {
        name: 'agents.test.channel',
        type: 'topic',
      };

      await channelManager.create(channel);

      expect(await channelManager.exists('agents.test.channel')).toBe(true);
      expect(await channelManager.exists('agents.nonexistent.channel')).toBe(false);
    });
  });

  describe('Channel Deletion', () => {
    it('should delete an existing channel', async () => {
      const channel: Channel = {
        name: 'agents.test.channel',
        type: 'topic',
      };

      await channelManager.create(channel);
      await expect(channelManager.delete('agents.test.channel')).resolves.not.toThrow();

      const retrieved = await channelManager.get('agents.test.channel');
      expect(retrieved).toBeUndefined();
    });

    it('should reject deleting non-existent channel', async () => {
      await expect(channelManager.delete('agents.nonexistent.channel')).rejects.toThrow('Channel not found');
    });
  });

  describe('Channel Updates', () => {
    it('should update channel configuration', async () => {
      const channel: Channel = {
        name: 'agents.test.channel',
        type: 'topic',
        description: 'Original description',
      };

      await channelManager.create(channel);
      await channelManager.update('agents.test.channel', {
        description: 'Updated description',
      });

      const updated = await channelManager.get('agents.test.channel');
      expect(updated?.description).toBe('Updated description');
    });

    it('should reject updating non-existent channel', async () => {
      await expect(
        channelManager.update('agents.nonexistent.channel', { description: 'test' })
      ).rejects.toThrow('Channel not found');
    });
  });

  describe('Channel Filtering', () => {
    beforeEach(async () => {
      await channelManager.create({ name: 'agents.test1.channel', type: 'topic' });
      await channelManager.create({ name: 'agents.test2.channel', type: 'direct' });
      await channelManager.create({ name: 'agents.broadcast.shutdown', type: 'broadcast' });
    });

    it('should get channels by type', async () => {
      const topicChannels = await channelManager.getByType('topic');
      expect(topicChannels).toHaveLength(1);
      expect(topicChannels[0].type).toBe('topic');

      const directChannels = await channelManager.getByType('direct');
      expect(directChannels).toHaveLength(1);
      expect(directChannels[0].type).toBe('direct');

      const broadcastChannels = await channelManager.getByType('broadcast');
      expect(broadcastChannels).toHaveLength(1);
      expect(broadcastChannels[0].type).toBe('broadcast');
    });

    it('should find channels by pattern', async () => {
      const testChannels = await channelManager.findByPattern('agents.test*.channel');
      expect(testChannels.length).toBeGreaterThanOrEqual(2);

      const allChannels = await channelManager.findByPattern('agents.#');
      expect(allChannels.length).toBeGreaterThanOrEqual(3);
    });
  });
});

describe('Channel Factory', () => {
  it('should create direct channel', () => {
    const channel = ChannelFactory.createDirect('test-agent', 'tasks', {
      description: 'Test channel',
    });

    expect(channel.name).toBe('agents.test-agent.tasks');
    expect(channel.type).toBe('direct');
    expect(channel.description).toBe('Test channel');
  });

  it('should create topic channel', () => {
    const channel = ChannelFactory.createTopic('tasks', 'completed', {
      description: 'Task completion events',
    });

    expect(channel.name).toBe('agents.tasks.completed');
    expect(channel.type).toBe('topic');
  });

  it('should create broadcast channel', () => {
    const channel = ChannelFactory.createBroadcast('shutdown', {
      description: 'System shutdown',
    });

    expect(channel.name).toBe('agents.broadcast.shutdown');
    expect(channel.type).toBe('broadcast');
  });
});
