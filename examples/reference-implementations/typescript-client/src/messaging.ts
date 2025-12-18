/**
 * OSSA Agent-to-Agent Messaging
 *
 * Client methods for A2A messaging, webhooks, and event streaming.
 */

import { OSSAClient } from './client.js';

export interface A2AMessage {
  id?: string;
  from: {
    publisher: string;
    name: string;
    version?: string;
    instance_id?: string;
  };
  to: {
    publisher: string;
    name: string;
    version?: string;
    instance_id?: string;
  };
  type: 'request' | 'response' | 'event' | 'broadcast';
  capability?: string;
  payload: Record<string, unknown>;
  metadata?: {
    correlation_id?: string;
    reply_to?: string;
    timestamp?: string;
    ttl?: number;
    priority?: 'low' | 'normal' | 'high' | 'critical';
  };
}

export interface SendMessageResponse {
  message_id: string;
  status: 'sent' | 'queued' | 'delivered' | 'failed';
  timestamp: string;
  delivery_info?: {
    delivered_at?: string;
    acknowledged_at?: string;
    retry_count?: number;
  };
}

export interface MessageStatus {
  message_id: string;
  status: 'sent' | 'queued' | 'delivered' | 'acknowledged' | 'failed' | 'expired';
  created_at: string;
  updated_at: string;
  delivery_attempts: number;
  error?: string;
}

export interface WebhookConfig {
  id?: string;
  url: string;
  events: string[];
  filters?: {
    publisher?: string;
    agent_name?: string;
    capability?: string;
  };
  headers?: Record<string, string>;
  retry_config?: {
    max_attempts?: number;
    backoff_strategy?: 'linear' | 'exponential';
  };
  active?: boolean;
}

export interface WebhookResponse {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  created_at: string;
  last_triggered_at?: string;
  delivery_stats: {
    total_deliveries: number;
    successful_deliveries: number;
    failed_deliveries: number;
  };
}

export interface EventSubscription {
  id?: string;
  agent: {
    publisher: string;
    name: string;
  };
  events: string[];
  filters?: Record<string, unknown>;
  delivery_mode: 'webhook' | 'polling' | 'streaming';
  config?: {
    webhook_url?: string;
    batch_size?: number;
    batch_timeout?: number;
  };
}

export interface EventStreamOptions {
  agent?: {
    publisher: string;
    name: string;
  };
  event_types?: string[];
  from_timestamp?: string;
  batch_size?: number;
}

export interface AgentEvent {
  id: string;
  event_type: string;
  agent: {
    publisher: string;
    name: string;
    version: string;
  };
  timestamp: string;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Messaging operations client
 */
export class MessagingClient {
  constructor(private client: OSSAClient) {}

  /**
   * Send an A2A message
   */
  async sendMessage(message: A2AMessage): Promise<SendMessageResponse> {
    return this.client.request<SendMessageResponse>({
      method: 'POST',
      path: '/messaging/send',
      body: message,
    });
  }

  /**
   * Send a request and wait for response (synchronous-style)
   */
  async sendRequest(
    message: Omit<A2AMessage, 'type'>,
    timeout: number = 30000
  ): Promise<{
    request_id: string;
    response?: A2AMessage;
    status: 'completed' | 'timeout' | 'failed';
    error?: string;
  }> {
    return this.client.request({
      method: 'POST',
      path: '/messaging/request',
      body: {
        ...message,
        timeout,
      },
    });
  }

  /**
   * Get message status
   */
  async getMessageStatus(messageId: string): Promise<MessageStatus> {
    return this.client.request<MessageStatus>({
      method: 'GET',
      path: `/messaging/messages/${messageId}`,
    });
  }

  /**
   * Broadcast message to multiple agents
   */
  async broadcast(
    message: Omit<A2AMessage, 'to' | 'type'>,
    filters: {
      domain?: string;
      capability?: string;
      tags?: string[];
    }
  ): Promise<{
    broadcast_id: string;
    recipients_count: number;
    status: 'broadcasting';
  }> {
    return this.client.request({
      method: 'POST',
      path: '/messaging/broadcast',
      body: {
        message,
        filters,
      },
    });
  }

  /**
   * Register a webhook
   */
  async registerWebhook(config: WebhookConfig): Promise<WebhookResponse> {
    return this.client.request<WebhookResponse>({
      method: 'POST',
      path: '/messaging/webhooks',
      body: config,
    });
  }

  /**
   * List webhooks
   */
  async listWebhooks(): Promise<{ webhooks: WebhookResponse[] }> {
    return this.client.request({
      method: 'GET',
      path: '/messaging/webhooks',
    });
  }

  /**
   * Get webhook details
   */
  async getWebhook(webhookId: string): Promise<WebhookResponse> {
    return this.client.request<WebhookResponse>({
      method: 'GET',
      path: `/messaging/webhooks/${webhookId}`,
    });
  }

  /**
   * Update webhook configuration
   */
  async updateWebhook(webhookId: string, config: Partial<WebhookConfig>): Promise<WebhookResponse> {
    return this.client.request<WebhookResponse>({
      method: 'PUT',
      path: `/messaging/webhooks/${webhookId}`,
      body: config,
    });
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    return this.client.request({
      method: 'DELETE',
      path: `/messaging/webhooks/${webhookId}`,
    });
  }

  /**
   * Subscribe to agent events
   */
  async subscribe(subscription: EventSubscription): Promise<{
    subscription_id: string;
    status: 'active';
    created_at: string;
  }> {
    return this.client.request({
      method: 'POST',
      path: '/messaging/subscriptions',
      body: subscription,
    });
  }

  /**
   * List event subscriptions
   */
  async listSubscriptions(): Promise<{
    subscriptions: Array<{
      id: string;
      agent: { publisher: string; name: string };
      events: string[];
      delivery_mode: string;
      active: boolean;
    }>;
  }> {
    return this.client.request({
      method: 'GET',
      path: '/messaging/subscriptions',
    });
  }

  /**
   * Poll for events (for polling-mode subscriptions)
   */
  async pollEvents(
    subscriptionId: string,
    options?: { limit?: number; since?: string }
  ): Promise<{
    events: AgentEvent[];
    has_more: boolean;
    next_cursor?: string;
  }> {
    return this.client.request({
      method: 'GET',
      path: `/messaging/subscriptions/${subscriptionId}/poll`,
      query: options,
    });
  }

  /**
   * Stream events using Server-Sent Events (SSE)
   * Returns an async iterator for processing events
   */
  async *streamEvents(options: EventStreamOptions): AsyncIterableIterator<AgentEvent> {
    const url = this.buildStreamUrl(options);
    const response = await fetch(url, {
      headers: this.buildHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Stream failed: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;

            try {
              const event = JSON.parse(data) as AgentEvent;
              yield event;
            } catch (e) {
              console.error('Failed to parse event:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Build stream URL with query parameters
   */
  private buildStreamUrl(options: EventStreamOptions): string {
    const params = new URLSearchParams();

    if (options.agent) {
      params.append('publisher', options.agent.publisher);
      params.append('name', options.agent.name);
    }

    if (options.event_types) {
      params.append('events', options.event_types.join(','));
    }

    if (options.from_timestamp) {
      params.append('from', options.from_timestamp);
    }

    if (options.batch_size) {
      params.append('batch_size', options.batch_size.toString());
    }

    const baseUrl = (this.client as any).baseUrl;
    return `${baseUrl}/messaging/stream?${params.toString()}`;
  }

  /**
   * Build headers for streaming
   */
  private buildHeaders(): Record<string, string> {
    return (this.client as any).buildHeaders();
  }
}
