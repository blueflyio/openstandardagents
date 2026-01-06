/**
 * OSSA Agent Communication API - Zod Schemas
 *
 * AUTO-GENERATED - DO NOT EDIT
 * Generated from: /Users/flux423/Sites/LLM/OssA/openstandardagents/openapi/agent-communication.yaml
 * OSSA Version: 0.3.3
 * API Version: ossa/v0.3.3
 * Generated on: 2026-01-06T18:04:52.264Z
 */

import { z } from 'zod';
import * as CommonSchemas from './common-schemas.zod';

// ============================================================================
// Component Schemas
// ============================================================================

export const sendMessageRequestSchema = z.object({
  to: z.string().url().regex(/^agent:\/\/[a-z0-9]([-a-z0-9]*[a-z0-9])?$/),
  from: z.string().url().regex(/^agent:\/\/[a-z0-9]([-a-z0-9]*[a-z0-9])?$/),
  type: messageTypeSchema,
  payload: messagePayloadSchema,
  correlationId: z.string().optional(),
  timeout: z.number().int().min(1000).max(300000).optional(),
  priority: z.enum(["low", "normal", "high", "critical"]).optional(),
  webhookUrl: z.string().url().optional()
});

export type SendMessageRequest = z.infer<typeof sendMessageRequestSchema>;

/**
 * Standard message types for A2A communication:
 * - TaskAssigned: Assign a task to an agent
 * - TaskCompleted: Notify task completion
 * - TaskFailed: Notify task failure
 * - QueryRequest: Request information from an agent
 * - QueryResponse: Response to a query request
 * - AgentStarted: Agent lifecycle event (started)
 * - AgentStopped: Agent lifecycle event (stopped)
 * - AgentError: Agent error notification
 * - Custom: Custom application-specific message type
 * 
 */
export const messageTypeSchema = z.enum(["TaskAssigned", "TaskCompleted", "TaskFailed", "QueryRequest", "QueryResponse", "AgentStarted", "AgentStopped", "AgentError", "Custom"]);

export type MessageType = z.infer<typeof messageTypeSchema>;

/**
 * Message payload structure varies by message type. See schemas for each type.
 * 
 */
export const messagePayloadSchema = z.record(z.string(), z.unknown());

export type MessagePayload = z.infer<typeof messagePayloadSchema>;

export const messageSchema = z.object({
  id: z.string().uuid(),
  to: z.string().url(),
  from: z.string().url(),
  type: messageTypeSchema,
  payload: messagePayloadSchema,
  correlationId: z.string().optional(),
  status: z.enum(["pending", "delivered", "acknowledged", "failed"]),
  priority: z.enum(["low", "normal", "high", "critical"]).optional(),
  createdAt: z.string().datetime(),
  deliveredAt: z.string().datetime().optional(),
  acknowledgedAt: z.string().datetime().optional(),
  error: z.string().optional()
});

export type Message = z.infer<typeof messageSchema>;

export const messageResponseSchema = z.object({
  messageId: z.string().uuid(),
  status: z.enum(["accepted", "queued"]),
  estimatedDelivery: z.string().datetime().optional()
});

export type MessageResponse = z.infer<typeof messageResponseSchema>;

export const createChannelRequestSchema = z.object({
  name: z.string().regex(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/),
  topic: z.string(),
  description: z.string().optional(),
  retentionPolicy: retentionPolicySchema.optional(),
  accessControl: accessControlSchema.optional()
});

export type CreateChannelRequest = z.infer<typeof createChannelRequestSchema>;

export const channelSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  topic: z.string(),
  description: z.string().optional(),
  subscriberCount: z.number().int().min(0).optional(),
  messageCount: z.number().int().min(0).optional(),
  retentionPolicy: retentionPolicySchema.optional(),
  accessControl: accessControlSchema.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional()
});

export type Channel = z.infer<typeof channelSchema>;

export const channelsListSchema = z.object({
  channels: z.array(channelSchema).optional(),
  total: z.number().int().optional(),
  limit: z.number().int().optional(),
  offset: z.number().int().optional()
});

export type ChannelsList = z.infer<typeof channelsListSchema>;

export const retentionPolicySchema = z.object({
  retentionDays: z.number().int().min(1).max(365).optional(),
  maxMessages: z.number().int().min(100).optional()
});

export type RetentionPolicy = z.infer<typeof retentionPolicySchema>;

export const accessControlSchema = z.object({
  public: z.boolean().optional(),
  allowedAgents: z.array(z.string()).optional()
});

export type AccessControl = z.infer<typeof accessControlSchema>;

export const subscribeRequestSchema = z.object({
  agentId: z.string().url().regex(/^agent:\/\/[a-z0-9]([-a-z0-9]*[a-z0-9])?$/),
  deliveryMode: z.enum(["push", "pull"]),
  webhookUrl: z.string().url().optional(),
  filter: subscriptionFilterSchema.optional()
});

export type SubscribeRequest = z.infer<typeof subscribeRequestSchema>;

export const subscriptionFilterSchema = z.object({
  messageTypes: z.array(messageTypeSchema).optional(),
  agentFilter: z.string().optional()
});

export type SubscriptionFilter = z.infer<typeof subscriptionFilterSchema>;

export const subscriptionSchema = z.object({
  id: z.string().uuid(),
  channelId: z.string().uuid(),
  agentId: z.string().url(),
  deliveryMode: z.enum(["push", "pull"]),
  webhookUrl: z.string().url().optional(),
  filter: subscriptionFilterSchema.optional(),
  status: z.enum(["active", "paused", "failed"]).optional(),
  createdAt: z.string().datetime(),
  lastDeliveryAt: z.string().datetime().optional()
});

export type Subscription = z.infer<typeof subscriptionSchema>;

export const publishMessageRequestSchema = z.object({
  type: messageTypeSchema,
  payload: messagePayloadSchema,
  attributes: z.record(z.string(), z.unknown()).optional()
});

export type PublishMessageRequest = z.infer<typeof publishMessageRequestSchema>;

export const publishResponseSchema = z.object({
  messageId: z.string().uuid().optional(),
  publishedAt: z.string().datetime().optional(),
  subscriberCount: z.number().int().optional()
});

export type PublishResponse = z.infer<typeof publishResponseSchema>;

export const webhookRegistrationSchema = z.object({
  url: z.string().url(),
  agentId: z.string().url().regex(/^agent:\/\/[a-z0-9]([-a-z0-9]*[a-z0-9])?$/),
  description: z.string().optional(),
  events: z.array(messageTypeSchema).optional()
});

export type WebhookRegistration = z.infer<typeof webhookRegistrationSchema>;

export const healthStatusSchema = z.object({
  status: z.enum(["healthy", "degraded", "unhealthy"]).optional(),
  version: z.string().optional(),
  uptime: z.number().int().optional(),
  timestamp: z.string().datetime().optional(),
  checks: z.record(z.string(), z.unknown()).optional()
});

export type HealthStatus = z.infer<typeof healthStatusSchema>;

export const problemSchema = CommonSchemas.problemSchema;

export type Problem = z.infer<typeof problemSchema>;
