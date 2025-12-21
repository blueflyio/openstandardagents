/**
 * OSSA v0.3.1 Messaging Extension - Channel Management
 * Manages message channels and their configuration
 */

import { Channel, ChannelManager as IChannelManager } from './types.js';

/**
 * In-memory channel manager implementation
 */
export class ChannelManager implements IChannelManager {
  private channels: Map<string, Channel>;

  constructor() {
    this.channels = new Map();
  }

  /**
   * Create a new channel
   */
  async create(channel: Channel): Promise<void> {
    this.validateChannel(channel);

    if (this.channels.has(channel.name)) {
      throw new Error(`Channel already exists: ${channel.name}`);
    }

    this.channels.set(channel.name, { ...channel });
  }

  /**
   * Get a channel by name
   */
  async get(channelName: string): Promise<Channel | undefined> {
    return this.channels.get(channelName);
  }

  /**
   * Delete a channel
   */
  async delete(channelName: string): Promise<void> {
    if (!this.channels.has(channelName)) {
      throw new Error(`Channel not found: ${channelName}`);
    }

    this.channels.delete(channelName);
  }

  /**
   * List all channels
   */
  async list(): Promise<Channel[]> {
    return Array.from(this.channels.values());
  }

  /**
   * Check if a channel exists
   */
  async exists(channelName: string): Promise<boolean> {
    return this.channels.has(channelName);
  }

  /**
   * Update channel configuration
   */
  async update(channelName: string, updates: Partial<Channel>): Promise<void> {
    const channel = this.channels.get(channelName);
    if (!channel) {
      throw new Error(`Channel not found: ${channelName}`);
    }

    const updatedChannel = { ...channel, ...updates };
    this.validateChannel(updatedChannel);
    this.channels.set(channelName, updatedChannel);
  }

  /**
   * Get channels by type
   */
  async getByType(type: 'direct' | 'topic' | 'broadcast'): Promise<Channel[]> {
    return Array.from(this.channels.values()).filter((channel) => channel.type === type);
  }

  /**
   * Find channels matching a pattern
   */
  async findByPattern(pattern: string): Promise<Channel[]> {
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '[^.]+')
      .replace(/#/g, '.*');

    const regex = new RegExp(`^${regexPattern}$`);

    return Array.from(this.channels.values()).filter((channel) => regex.test(channel.name));
  }

  /**
   * Validate channel configuration
   */
  private validateChannel(channel: Channel): void {
    if (!channel.name) {
      throw new Error('Channel name is required');
    }

    if (!channel.type) {
      throw new Error('Channel type is required');
    }

    // Validate channel name format
    const channelPattern = /^agents\.([a-z0-9-]+\.)+[a-z0-9-]+$/;
    if (!channelPattern.test(channel.name)) {
      throw new Error(`Invalid channel name format: ${channel.name}`);
    }

    // Validate type-specific naming conventions
    switch (channel.type) {
      case 'direct':
        // Direct channels should follow: agents.{agent-id}.{message-type}
        if (!channel.name.match(/^agents\.[a-z0-9-]+\.[a-z0-9-]+$/)) {
          throw new Error(`Direct channel must follow format agents.{agent-id}.{message-type}: ${channel.name}`);
        }
        break;
      case 'topic':
        // Topic channels should follow: agents.{topic}.{event-type}
        if (!channel.name.match(/^agents\.[a-z0-9-]+\.[a-z0-9-]+$/)) {
          throw new Error(`Topic channel must follow format agents.{topic}.{event-type}: ${channel.name}`);
        }
        break;
      case 'broadcast':
        // Broadcast channels should follow: agents.broadcast.{event-type}
        if (!channel.name.startsWith('agents.broadcast.')) {
          throw new Error(`Broadcast channel must start with agents.broadcast.: ${channel.name}`);
        }
        break;
    }

    // Validate QoS settings
    if (channel.qos) {
      if (channel.qos.maxRetries && (channel.qos.maxRetries < 0 || channel.qos.maxRetries > 100)) {
        throw new Error('maxRetries must be between 0 and 100');
      }
    }

    // Validate config settings
    if (channel.config) {
      if (channel.config.maxMessageSize) {
        if (channel.config.maxMessageSize < 1024 || channel.config.maxMessageSize > 10485760) {
          throw new Error('maxMessageSize must be between 1KB and 10MB');
        }
      }

      if (channel.config.maxSubscribers) {
        if (channel.config.maxSubscribers < 1 || channel.config.maxSubscribers > 10000) {
          throw new Error('maxSubscribers must be between 1 and 10000');
        }
      }

      if (channel.config.messageRetention !== undefined) {
        if (channel.config.messageRetention < 0 || channel.config.messageRetention > 2592000) {
          throw new Error('messageRetention must be between 0 and 2592000 seconds (30 days)');
        }
      }
    }
  }

  /**
   * Clear all channels (for testing)
   */
  async clear(): Promise<void> {
    this.channels.clear();
  }
}

/**
 * Channel factory helpers
 */
export class ChannelFactory {
  /**
   * Create a direct channel
   */
  static createDirect(agentId: string, messageType: string, config?: Partial<Channel>): Channel {
    return {
      name: `agents.${agentId}.${messageType}`,
      type: 'direct',
      ...config,
    };
  }

  /**
   * Create a topic channel
   */
  static createTopic(topic: string, eventType: string, config?: Partial<Channel>): Channel {
    return {
      name: `agents.${topic}.${eventType}`,
      type: 'topic',
      ...config,
    };
  }

  /**
   * Create a broadcast channel
   */
  static createBroadcast(eventType: string, config?: Partial<Channel>): Channel {
    return {
      name: `agents.broadcast.${eventType}`,
      type: 'broadcast',
      ...config,
    };
  }
}
