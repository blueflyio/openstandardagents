/**
 * Symfony Messenger Integration for OSSA
 *
 * Production-ready async agent execution using Symfony Messenger.
 *
 * @package @bluefly/openstandardagents
 * @since 0.5.0
 *
 * @example
 * ```typescript
 * import { AgentExecutionMessage, AgentBatchMessage } from '@bluefly/openstandardagents/messenger';
 *
 * // Single agent execution
 * await messageBus.dispatch(
 *   new AgentExecutionMessage(
 *     'agent-id',
 *     { input: 'data' },
 *     { userId: 'user-123', priority: 8 }
 *   )
 * );
 *
 * // Batch execution
 * await messageBus.dispatch(
 *   new AgentBatchMessage(
 *     ['agent-1', 'agent-2'],
 *     { 'agent-1': { input: 'data' } },
 *     { mode: 'parallel', maxParallel: 5 }
 *   )
 * );
 * ```
 */

// Message classes
export {
  AgentExecutionMessage,
  AgentBatchMessage,
  type AgentExecutionMessageData,
  type AgentBatchMessageData,
} from './Message/index.js';

// Message handlers
export {
  AgentExecutionHandler,
  AgentBatchHandler,
  type AgentExecutionHandlerDependencies,
  type AgentBatchHandlerDependencies,
  type AgentExecutionResult,
  type BatchExecutionResult,
} from './Handler/index.js';

// Middleware
export {
  ValidationMiddleware,
  LoggingMiddleware,
  AuthenticationMiddleware,
  RateLimitMiddleware,
  type MessageEnvelope,
  type MiddlewareStack,
  type LoggingMiddlewareDependencies,
  type AuthenticationMiddlewareDependencies,
  type RateLimitMiddlewareDependencies,
  type RateLimitConfig,
  type RateLimiterService,
} from './Middleware/index.js';

// Event subscribers
export {
  FailedMessageSubscriber,
  type WorkerMessageFailedEvent,
  type FailedMessageSubscriberDependencies,
} from './EventSubscriber/FailedMessageSubscriber.js';

// Commands
export {
  MessengerConsumeCommand,
  MessengerFailedCommand,
  MessengerStatsCommand,
  type MessengerConsumeCommandOptions,
  type MessengerWorkerService,
  type FailedMessage,
  type FailedMessageService,
  type TransportStats,
  type MessengerStatsService,
} from './Commands/index.js';

// Monitoring
export {
  MetricsCollector,
  QueueMonitor,
  type MetricsData,
  type MetricUpdate,
  type MetricsStorage,
  type QueueStatus,
  type QueueThresholds,
  type QueueStatusService,
} from './Monitoring/index.js';
