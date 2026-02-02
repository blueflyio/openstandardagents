import Ajv from 'ajv';
import addFormats from 'ajv-formats';
// ErrorObject type available from ajv if needed for future error handling

interface ValidationError {
  path: string;
  message: string;
}

// @ts-expect-error - Ajv v8 API compatibility
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

interface MessagingExtension {
  publishes?: PublishedChannel[];
  subscribes?: Subscription[];
  commands?: Command[];
  reliability?: ReliabilityConfig;
}

interface PublishedChannel {
  channel: string;
  description?: string;
  schema: object;
  examples?: object[];
  contentType?: string;
  tags?: string[];
}

interface Subscription {
  channel: string;
  description?: string;
  schema?: object;
  handler?: string;
  filter?: {
    expression?: string;
    fields?: Record<string, unknown>;
  };
  priority?: 'low' | 'normal' | 'high' | 'critical';
  maxConcurrency?: number;
}

interface Command {
  name: string;
  description?: string;
  inputSchema: object;
  outputSchema?: object;
  timeoutSeconds?: number;
  idempotent?: boolean;
  async?: boolean;
}

interface ReliabilityConfig {
  deliveryGuarantee?: 'at-least-once' | 'at-most-once' | 'exactly-once';
  retry?: {
    maxAttempts?: number;
    backoff?: {
      strategy?: 'exponential' | 'linear' | 'constant';
      initialDelayMs?: number;
      maxDelayMs?: number;
      multiplier?: number;
    };
  };
  dlq?: {
    enabled?: boolean;
    channel?: string;
    retentionDays?: number;
  };
  ordering?: {
    guarantee?: 'per-source' | 'global';
    timeoutSeconds?: number;
  };
  acknowledgment?: {
    mode?: 'manual' | 'automatic';
    timeoutSeconds?: number;
  };
}

const CHANNEL_PATTERN = /^[a-z0-9]+(?:\.[a-z0-9]+)*$/;
const CHANNEL_WILDCARD_PATTERN = /^[a-z0-9]+(?:\.[a-z0-9*]+)*$/;
const COMMAND_NAME_PATTERN = /^[a-z][a-z0-9_]*$/;

export class MessagingValidator {
  /**
   * Validate messaging extension in OSSA manifest
   */
  validateMessagingExtension(
    messaging: MessagingExtension,
    apiVersion: string
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Only validate if apiVersion supports messaging (v0.3.0+)
    if (!apiVersion.match(/^ossa\/v0\.3\.[0-9]|^ossa\/v[1-9]/)) {
      return errors; // Messaging is optional for older versions
    }

    if (!messaging) {
      return errors; // Messaging is optional
    }

    // Validate publishes
    if (messaging.publishes) {
      errors.push(...this.validatePublishes(messaging.publishes));
    }

    // Validate subscribes
    if (messaging.subscribes) {
      errors.push(...this.validateSubscribes(messaging.subscribes));
    }

    // Validate commands
    if (messaging.commands) {
      errors.push(...this.validateCommands(messaging.commands));
    }

    // Validate reliability config
    if (messaging.reliability) {
      errors.push(...this.validateReliability(messaging.reliability));
    }

    return errors;
  }

  private validatePublishes(publishes: PublishedChannel[]): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!Array.isArray(publishes)) {
      return [
        {
          path: 'messaging.publishes',
          message: 'publishes must be an array',
        },
      ];
    }

    publishes.forEach((channel, index) => {
      const path = `messaging.publishes[${index}]`;

      // Validate channel name
      if (!channel.channel) {
        errors.push({
          path: `${path}.channel`,
          message: 'channel is required',
        });
      } else if (!CHANNEL_PATTERN.test(channel.channel)) {
        errors.push({
          path: `${path}.channel`,
          message: `channel must match pattern: ${CHANNEL_PATTERN.source}`,
        });
      } else if (channel.channel.length > 255) {
        errors.push({
          path: `${path}.channel`,
          message: 'channel name must be 255 characters or less',
        });
      } else if (
        channel.channel.startsWith('ossa.') ||
        channel.channel.startsWith('system.') ||
        channel.channel.startsWith('internal.')
      ) {
        errors.push({
          path: `${path}.channel`,
          message:
            'channel name cannot start with reserved prefixes: ossa., system., internal.',
        });
      }

      // Validate schema
      if (!channel.schema) {
        errors.push({
          path: `${path}.schema`,
          message: 'schema is required',
        });
      } else {
        // Validate JSON Schema structure
        const schemaErrors = this.validateJSONSchema(channel.schema);
        schemaErrors.forEach((err) => {
          errors.push({
            path: `${path}.schema.${err.path}`,
            message: err.message,
          });
        });
      }

      // Validate contentType
      if (
        channel.contentType &&
        !channel.contentType.match(/^[a-z]+\/[a-z0-9+-]+$/)
      ) {
        errors.push({
          path: `${path}.contentType`,
          message: 'contentType must be a valid MIME type',
        });
      }
    });

    return errors;
  }

  private validateSubscribes(subscribes: Subscription[]): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!Array.isArray(subscribes)) {
      return [
        {
          path: 'messaging.subscribes',
          message: 'subscribes must be an array',
        },
      ];
    }

    subscribes.forEach((subscription, index) => {
      const path = `messaging.subscribes[${index}]`;

      // Validate channel name (supports wildcards)
      if (!subscription.channel) {
        errors.push({
          path: `${path}.channel`,
          message: 'channel is required',
        });
      } else if (!CHANNEL_WILDCARD_PATTERN.test(subscription.channel)) {
        errors.push({
          path: `${path}.channel`,
          message: `channel must match pattern: ${CHANNEL_WILDCARD_PATTERN.source}`,
        });
      }

      // Validate priority
      if (
        subscription.priority &&
        !['low', 'normal', 'high', 'critical'].includes(subscription.priority)
      ) {
        errors.push({
          path: `${path}.priority`,
          message: 'priority must be one of: low, normal, high, critical',
        });
      }

      // Validate maxConcurrency
      if (
        subscription.maxConcurrency !== undefined &&
        (subscription.maxConcurrency < 1 ||
          !Number.isInteger(subscription.maxConcurrency))
      ) {
        errors.push({
          path: `${path}.maxConcurrency`,
          message: 'maxConcurrency must be an integer >= 1',
        });
      }

      // Validate schema if provided
      if (subscription.schema) {
        const schemaErrors = this.validateJSONSchema(subscription.schema);
        schemaErrors.forEach((err) => {
          errors.push({
            path: `${path}.schema.${err.path}`,
            message: err.message,
          });
        });
      }
    });

    return errors;
  }

  private validateCommands(commands: Command[]): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!Array.isArray(commands)) {
      return [
        {
          path: 'messaging.commands',
          message: 'commands must be an array',
        },
      ];
    }

    commands.forEach((command, index) => {
      const path = `messaging.commands[${index}]`;

      // Validate name
      if (!command.name) {
        errors.push({
          path: `${path}.name`,
          message: 'name is required',
        });
      } else if (!COMMAND_NAME_PATTERN.test(command.name)) {
        errors.push({
          path: `${path}.name`,
          message: `name must match pattern: ${COMMAND_NAME_PATTERN.source}`,
        });
      }

      // Validate inputSchema (accept both camelCase and snake_case)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inputSchema = command.inputSchema || (command as any).input_schema;
      if (inputSchema) {
        const schemaErrors = this.validateJSONSchema(inputSchema);
        schemaErrors.forEach((err) => {
          errors.push({
            path: `${path}.inputSchema.${err.path}`,
            message: err.message,
          });
        });
      }
      // Note: inputSchema is optional per v0.3.0 spec - no error if missing

      // Validate outputSchema if provided
      if (command.outputSchema) {
        const schemaErrors = this.validateJSONSchema(command.outputSchema);
        schemaErrors.forEach((err) => {
          errors.push({
            path: `${path}.outputSchema.${err.path}`,
            message: err.message,
          });
        });
      }

      // Validate timeoutSeconds
      if (
        command.timeoutSeconds !== undefined &&
        (command.timeoutSeconds < 1 ||
          command.timeoutSeconds > 3600 ||
          !Number.isInteger(command.timeoutSeconds))
      ) {
        errors.push({
          path: `${path}.timeoutSeconds`,
          message: 'timeoutSeconds must be an integer between 1 and 3600',
        });
      }
    });

    return errors;
  }

  private validateReliability(
    reliability: ReliabilityConfig
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate deliveryGuarantee
    if (
      reliability.deliveryGuarantee &&
      !['at-least-once', 'at-most-once', 'exactly-once'].includes(
        reliability.deliveryGuarantee
      )
    ) {
      errors.push({
        path: 'messaging.reliability.deliveryGuarantee',
        message:
          'deliveryGuarantee must be one of: at-least-once, at-most-once, exactly-once',
      });
    }

    // Validate retry config
    if (reliability.retry) {
      if (
        reliability.retry.maxAttempts !== undefined &&
        (reliability.retry.maxAttempts < 1 ||
          reliability.retry.maxAttempts > 10 ||
          !Number.isInteger(reliability.retry.maxAttempts))
      ) {
        errors.push({
          path: 'messaging.reliability.retry.maxAttempts',
          message: 'maxAttempts must be an integer between 1 and 10',
        });
      }

      if (reliability.retry.backoff) {
        if (
          reliability.retry.backoff.strategy &&
          !['exponential', 'linear', 'constant'].includes(
            reliability.retry.backoff.strategy
          )
        ) {
          errors.push({
            path: 'messaging.reliability.retry.backoff.strategy',
            message: 'strategy must be one of: exponential, linear, constant',
          });
        }
      }
    }

    // Validate ordering
    if (reliability.ordering) {
      if (
        reliability.ordering.guarantee &&
        !['per-source', 'global'].includes(reliability.ordering.guarantee)
      ) {
        errors.push({
          path: 'messaging.reliability.ordering.guarantee',
          message: 'guarantee must be one of: per-source, global',
        });
      }
    }

    return errors;
  }

  private validateJSONSchema(schema: unknown): ValidationError[] {
    const errors: ValidationError[] = [];

    if (typeof schema !== 'object' || schema === null) {
      return [
        {
          path: '',
          message: 'schema must be an object',
        },
      ];
    }

    const schemaObj = schema as Record<string, unknown>;

    // Basic JSON Schema validation
    if (
      schemaObj.type &&
      typeof schemaObj.type === 'string' &&
      ![
        'object',
        'array',
        'string',
        'number',
        'integer',
        'boolean',
        'null',
      ].includes(schemaObj.type)
    ) {
      errors.push({
        path: 'type',
        message: `invalid schema type: ${schemaObj.type}`,
      });
    }

    return errors;
  }
}
