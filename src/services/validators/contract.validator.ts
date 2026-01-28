import { injectable } from 'inversify';
import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import * as semver from 'semver';
import type { OssaAgent } from '../../types/index.js';

export interface EventContract {
  channel: string;
  description?: string;
  schema: Record<string, unknown>;
  examples?: Record<string, unknown>[];
  contentType?: string;
  tags?: string[];
}

export interface CommandContract {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  timeoutSeconds?: number;
  idempotent?: boolean;
  async?: boolean;
}

export interface AgentContract {
  name: string;
  version: string;
  publishes: EventContract[];
  subscribes: Array<{
    channel: string;
    description?: string;
    schema?: Record<string, unknown>;
  }>;
  commands: CommandContract[];
}

export interface ContractValidationResult {
  valid: boolean;
  errors: Array<{
    agent: string;
    type:
      | 'missing_event'
      | 'missing_command'
      | 'schema_mismatch'
      | 'signature_mismatch';
    message: string;
    details?: unknown;
  }>;
  warnings: string[];
}

export interface BreakingChange {
  type:
    | 'removed_event'
    | 'removed_command'
    | 'schema_incompatible'
    | 'signature_changed';
  resource: string;
  oldVersion: string;
  newVersion: string;
  description: string;
  severity: 'major' | 'minor';
}

export interface BreakingChangesResult {
  hasBreakingChanges: boolean;
  changes: BreakingChange[];
  summary: {
    major: number;
    minor: number;
    total: number;
  };
}

@injectable()
export class ContractValidator {
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      strict: false,
      validateFormats: true,
    });
    addFormats(this.ajv);
  }

  /**
   * Validate that an agent fulfills its declared contract
   */
  validateAgentContract(
    agentManifest: OssaAgent,
    runtimeEvents?: string[],
    runtimeCommands?: string[]
  ): ContractValidationResult {
    const result: ContractValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    const agentName = agentManifest.metadata?.name || 'unknown';
    const messaging = agentManifest.spec?.messaging;

    if (!messaging) {
      result.warnings.push(`Agent ${agentName} has no messaging configuration`);
      return result;
    }

    // Validate published events
    const declaredPublishes = messaging.publishes || [];
    const declaredChannels = new Set(
      declaredPublishes.map((p: EventContract) => p.channel)
    );

    if (runtimeEvents) {
      // Check that agent publishes what it claims to publish
      for (const channel of declaredChannels) {
        if (!runtimeEvents.includes(channel)) {
          result.valid = false;
          result.errors.push({
            agent: agentName,
            type: 'missing_event',
            message: `Agent declares publishing to channel "${channel}" but does not publish it at runtime`,
          });
        }
      }

      // Check for undeclared events being published
      for (const channel of runtimeEvents) {
        if (!declaredChannels.has(channel)) {
          result.warnings.push(
            `Agent publishes to undeclared channel "${channel}"`
          );
        }
      }
    }

    // Validate event schemas
    for (const event of declaredPublishes) {
      if (!event.schema) {
        result.warnings.push(`Event "${event.channel}" has no schema defined`);
      } else {
        // Validate schema is valid JSON Schema
        try {
          this.ajv.compile(event.schema);
        } catch (error: unknown) {
          result.valid = false;
          result.errors.push({
            agent: agentName,
            type: 'schema_mismatch',
            message: `Invalid schema for event "${event.channel}": ${error instanceof Error ? error.message : String(error)}`,
            details:
              error instanceof Error
                ? { message: error.message, name: error.name }
                : { error: String(error) },
          });
        }
      }

      // Validate examples against schema
      if (event.examples && event.schema) {
        const validate = this.ajv.compile(event.schema);
        for (let i = 0; i < event.examples.length; i++) {
          const example = event.examples[i];
          if (!validate(example)) {
            result.valid = false;
            result.errors.push({
              agent: agentName,
              type: 'schema_mismatch',
              message: `Example ${i} for event "${event.channel}" does not match schema`,
              details: validate.errors,
            });
          }
        }
      }
    }

    // Validate commands
    const declaredCommands = messaging.commands || [];
    const declaredCommandNames = new Set(
      declaredCommands.map((c: CommandContract) => c.name)
    );

    if (runtimeCommands) {
      // Check that agent exposes what it claims to expose
      for (const commandName of declaredCommandNames) {
        if (!runtimeCommands.includes(commandName)) {
          result.valid = false;
          result.errors.push({
            agent: agentName,
            type: 'missing_command',
            message: `Agent declares command "${commandName}" but does not expose it at runtime`,
          });
        }
      }

      // Check for undeclared commands being exposed
      for (const commandName of runtimeCommands) {
        if (!declaredCommandNames.has(commandName)) {
          result.warnings.push(
            `Agent exposes undeclared command "${commandName}"`
          );
        }
      }
    }

    // Validate command schemas
    for (const command of declaredCommands) {
      if (!command.inputSchema) {
        result.warnings.push(
          `Command "${command.name}" has no input schema defined`
        );
      } else {
        // Validate input schema
        try {
          this.ajv.compile(command.inputSchema);
        } catch (error: unknown) {
          result.valid = false;
          result.errors.push({
            agent: agentName,
            type: 'schema_mismatch',
            message: `Invalid input schema for command "${command.name}": ${error instanceof Error ? error.message : String(error)}`,
            details:
              error instanceof Error
                ? { message: error.message, name: error.name }
                : { error: String(error) },
          });
        }
      }

      if (command.outputSchema) {
        // Validate output schema
        try {
          this.ajv.compile(command.outputSchema);
        } catch (error: unknown) {
          result.valid = false;
          result.errors.push({
            agent: agentName,
            type: 'schema_mismatch',
            message: `Invalid output schema for command "${command.name}": ${error instanceof Error ? error.message : String(error)}`,
            details:
              error instanceof Error
                ? { message: error.message, name: error.name }
                : { error: String(error) },
          });
        }
      }
    }

    return result;
  }

  /**
   * Test contract compatibility between two agents
   */
  testContractBetweenAgents(
    consumerManifest: OssaAgent,
    providerManifest: OssaAgent
  ): ContractValidationResult {
    const result: ContractValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    const consumerName = consumerManifest.metadata?.name || 'unknown';
    const providerName = providerManifest.metadata?.name || 'unknown';

    const consumerMessaging = consumerManifest.spec?.messaging;
    const providerMessaging = providerManifest.spec?.messaging;

    if (!consumerMessaging || !providerMessaging) {
      result.warnings.push(
        `One or both agents have no messaging configuration`
      );
      return result;
    }

    // Check if consumer's subscriptions match provider's publications
    const consumerSubscribes = consumerMessaging.subscribes || [];
    const providerPublishes = providerMessaging.publishes || [];
    const providerChannels = new Set(
      providerPublishes.map((p: EventContract) => p.channel)
    );

    for (const subscription of consumerSubscribes) {
      const channel = subscription.channel;

      // Find matching published event
      const publishedEvent = providerPublishes.find(
        (p: EventContract) => p.channel === channel
      );

      if (!publishedEvent) {
        // Provider doesn't publish this channel
        result.warnings.push(
          `${consumerName} subscribes to "${channel}" but ${providerName} doesn't publish it`
        );
        continue;
      }

      // Validate schema compatibility if both defined
      // For contract validation: provider schema must be compatible with consumer expectations
      // Provider can have MORE fields, but must have all fields consumer requires
      if (subscription.schema && publishedEvent.schema) {
        const compatible = this.validateContractSchemaCompatibility(
          subscription.schema,
          publishedEvent.schema
        );

        if (!compatible.compatible) {
          result.valid = false;
          result.errors.push({
            agent: consumerName,
            type: 'schema_mismatch',
            message: `Schema mismatch for channel "${channel}": ${compatible.reason}`,
            details: compatible.details,
          });
        }
      }
    }

    // Check command compatibility
    // If consumer has dependency on provider and expects certain commands
    const consumerDeps = consumerManifest.spec?.dependencies?.agents || [];
    const providerDep = consumerDeps.find(
      (d: { name: string }) => d.name === providerName
    );

    if (providerDep && providerDep.contract?.commands) {
      const providerCommands = providerMessaging.commands || [];
      const providerCommandNames = new Set(
        providerCommands.map((c: CommandContract) => c.name)
      );

      for (const expectedCommand of providerDep.contract.commands) {
        if (!providerCommandNames.has(expectedCommand)) {
          result.valid = false;
          result.errors.push({
            agent: consumerName,
            type: 'missing_command',
            message: `${consumerName} expects command "${expectedCommand}" from ${providerName} but it's not exposed`,
          });
        }
      }
    }

    return result;
  }

  /**
   * Detect breaking changes between two versions of an agent
   */
  detectBreakingChanges(
    oldManifest: OssaAgent,
    newManifest: OssaAgent
  ): BreakingChangesResult {
    const changes: BreakingChange[] = [];

    const oldName = oldManifest.metadata?.name || 'unknown';
    const newName = newManifest.metadata?.name || 'unknown';
    const oldVersion = oldManifest.metadata?.version || '0.0.0';
    const newVersion = newManifest.metadata?.version || '0.0.0';

    if (oldName !== newName) {
      throw new Error('Cannot compare different agents');
    }

    const oldMessaging = oldManifest.spec?.messaging || {};
    const newMessaging = newManifest.spec?.messaging || {};

    // Check for removed events
    const oldPublishes = oldMessaging.publishes || [];
    const newPublishes = newMessaging.publishes || [];
    const oldChannels = new Set(
      oldPublishes.map((p: EventContract) => p.channel)
    );
    const newChannels = new Set(
      newPublishes.map((p: EventContract) => p.channel)
    );

    for (const channel of oldChannels) {
      if (!newChannels.has(channel)) {
        changes.push({
          type: 'removed_event',
          resource: channel,
          oldVersion,
          newVersion,
          description: `Event channel "${channel}" was removed`,
          severity: 'major',
        });
      }
    }

    // Check for event schema changes
    for (const oldEvent of oldPublishes) {
      const newEvent = newPublishes.find(
        (p: EventContract) => p.channel === oldEvent.channel
      );
      if (newEvent && oldEvent.schema && newEvent.schema) {
        const compatible = this.validateSchemaCompatibility(
          oldEvent.schema,
          newEvent.schema
        );
        if (!compatible.compatible) {
          changes.push({
            type: 'schema_incompatible',
            resource: `event:${oldEvent.channel}`,
            oldVersion,
            newVersion,
            description: `Schema for event "${oldEvent.channel}" is incompatible: ${compatible.reason}`,
            severity: 'major',
          });
        }
      }
    }

    // Check for removed commands
    const oldCommands = oldMessaging.commands || [];
    const newCommands = newMessaging.commands || [];
    const oldCommandNames = new Set(
      oldCommands.map((c: CommandContract) => c.name)
    );
    const newCommandNames = new Set(
      newCommands.map((c: CommandContract) => c.name)
    );

    for (const commandName of oldCommandNames) {
      if (!newCommandNames.has(commandName)) {
        changes.push({
          type: 'removed_command',
          resource: commandName,
          oldVersion,
          newVersion,
          description: `Command "${commandName}" was removed`,
          severity: 'major',
        });
      }
    }

    // Check for command signature changes
    for (const oldCommand of oldCommands) {
      const newCommand = newCommands.find(
        (c: CommandContract) => c.name === oldCommand.name
      );
      if (newCommand) {
        // Check input schema changes
        if (oldCommand.inputSchema && newCommand.inputSchema) {
          const compatible = this.validateSchemaCompatibility(
            oldCommand.inputSchema,
            newCommand.inputSchema
          );
          if (!compatible.compatible) {
            changes.push({
              type: 'signature_changed',
              resource: `command:${oldCommand.name}:input`,
              oldVersion,
              newVersion,
              description: `Input schema for command "${oldCommand.name}" is incompatible: ${compatible.reason}`,
              severity: 'major',
            });
          }
        }

        // Check output schema changes
        if (oldCommand.outputSchema && newCommand.outputSchema) {
          const compatible = this.validateSchemaCompatibility(
            newCommand.outputSchema,
            oldCommand.outputSchema
          );
          if (!compatible.compatible) {
            changes.push({
              type: 'signature_changed',
              resource: `command:${oldCommand.name}:output`,
              oldVersion,
              newVersion,
              description: `Output schema for command "${oldCommand.name}" is incompatible: ${compatible.reason}`,
              severity: 'minor',
            });
          }
        }
      }
    }

    // Count by severity
    const summary = {
      major: changes.filter((c) => c.severity === 'major').length,
      minor: changes.filter((c) => c.severity === 'minor').length,
      total: changes.length,
    };

    return {
      hasBreakingChanges: summary.major > 0,
      changes,
      summary,
    };
  }

  /**
   * Validate schema compatibility (structural check)
   * Returns true if newSchema is compatible with oldSchema
   */
  private validateSchemaCompatibility(
    oldSchema: Record<string, unknown>,
    newSchema: Record<string, unknown>
  ): {
    compatible: boolean;
    reason?: string;
    details?: Record<string, unknown>;
  } {
    // Basic structural checks
    // This is a simplified check - a full implementation would need more sophisticated comparison

    // Check type changes
    if (oldSchema.type !== newSchema.type) {
      return {
        compatible: false,
        reason: `Type changed from ${oldSchema.type} to ${newSchema.type}`,
      };
    }

    // For objects, check required fields
    if (
      oldSchema.type === 'object' &&
      Array.isArray(oldSchema.required) &&
      Array.isArray(newSchema.required)
    ) {
      const oldRequired = new Set(oldSchema.required as string[]);
      const newRequired = new Set(newSchema.required as string[]);

      // New required fields are breaking changes
      for (const field of newRequired) {
        if (!oldRequired.has(field)) {
          return {
            compatible: false,
            reason: `New required field added: ${field}`,
          };
        }
      }
    }

    // For arrays, check item schema compatibility
    if (oldSchema.type === 'array' && oldSchema.items && newSchema.items) {
      if (
        typeof oldSchema.items === 'object' &&
        typeof newSchema.items === 'object'
      ) {
        return this.validateSchemaCompatibility(
          oldSchema.items as Record<string, unknown>,
          newSchema.items as Record<string, unknown>
        );
      }
    }

    // Check properties for objects
    if (
      oldSchema.type === 'object' &&
      oldSchema.properties &&
      newSchema.properties
    ) {
      const oldProps = oldSchema.properties as Record<string, unknown>;
      const newProps = newSchema.properties as Record<string, unknown>;

      // Check that old properties still exist
      for (const propName of Object.keys(oldProps)) {
        if (!newProps[propName]) {
          return {
            compatible: false,
            reason: `Property "${propName}" was removed`,
          };
        }

        // Recursively check property compatibility
        if (
          typeof oldProps[propName] === 'object' &&
          typeof newProps[propName] === 'object'
        ) {
          const propCompat = this.validateSchemaCompatibility(
            oldProps[propName] as Record<string, unknown>,
            newProps[propName] as Record<string, unknown>
          );
          if (!propCompat.compatible) {
            return {
              compatible: false,
              reason: `Property "${propName}": ${propCompat.reason}`,
            };
          }
        }
      }
    }

    return { compatible: true };
  }

  /**
   * Validate contract schema compatibility (consumer expectations vs provider schema)
   * Provider schema must satisfy consumer expectations (can have more, but must have all required)
   */
  private validateContractSchemaCompatibility(
    consumerSchema: Record<string, unknown>,
    providerSchema: Record<string, unknown>
  ): {
    compatible: boolean;
    reason?: string;
    details?: Record<string, unknown>;
  } {
    // Check type compatibility
    if (
      consumerSchema.type &&
      providerSchema.type &&
      consumerSchema.type !== providerSchema.type
    ) {
      return {
        compatible: false,
        reason: `Type mismatch: consumer expects ${consumerSchema.type}, provider has ${providerSchema.type}`,
      };
    }

    // For objects, check that provider has all required fields consumer expects
    if (consumerSchema.type === 'object' && providerSchema.type === 'object') {
      const consumerRequired = Array.isArray(consumerSchema.required)
        ? new Set(consumerSchema.required as string[])
        : new Set<string>();
      const providerRequired = Array.isArray(providerSchema.required)
        ? new Set(providerSchema.required as string[])
        : new Set<string>();

      // Provider must have all fields consumer requires
      for (const field of consumerRequired) {
        if (!providerRequired.has(field)) {
          // Check if field exists in provider properties (even if not required)
          const providerProps = providerSchema.properties as
            | Record<string, unknown>
            | undefined;
          if (!providerProps || !providerProps[field]) {
            return {
              compatible: false,
              reason: `Provider missing required field: ${field}`,
            };
          }
        }
      }

      // Check that provider has all properties consumer expects
      const consumerProps = consumerSchema.properties as
        | Record<string, unknown>
        | undefined;
      const providerProps = providerSchema.properties as
        | Record<string, unknown>
        | undefined;

      if (consumerProps && providerProps) {
        for (const propName of Object.keys(consumerProps)) {
          if (!providerProps[propName]) {
            return {
              compatible: false,
              reason: `Provider missing property: ${propName}`,
            };
          }

          // Recursively check property compatibility
          if (
            typeof consumerProps[propName] === 'object' &&
            typeof providerProps[propName] === 'object' &&
            consumerProps[propName] !== null &&
            providerProps[propName] !== null
          ) {
            const propCompat = this.validateContractSchemaCompatibility(
              consumerProps[propName] as Record<string, unknown>,
              providerProps[propName] as Record<string, unknown>
            );
            if (!propCompat.compatible) {
              return {
                compatible: false,
                reason: `Property "${propName}": ${propCompat.reason}`,
              };
            }
          }
        }
      }
    }

    // For arrays, check item schema compatibility
    if (
      consumerSchema.type === 'array' &&
      providerSchema.type === 'array' &&
      consumerSchema.items &&
      providerSchema.items
    ) {
      if (
        typeof consumerSchema.items === 'object' &&
        typeof providerSchema.items === 'object' &&
        consumerSchema.items !== null &&
        providerSchema.items !== null
      ) {
        return this.validateContractSchemaCompatibility(
          consumerSchema.items as Record<string, unknown>,
          providerSchema.items as Record<string, unknown>
        );
      }
    }

    return { compatible: true };
  }

  /**
   * Extract contract from manifest
   */
  extractContract(manifest: OssaAgent): AgentContract {
    const messaging = manifest.spec?.messaging || {};

    return {
      name: manifest.metadata?.name || 'unknown',
      version: manifest.metadata?.version || '0.0.0',
      publishes: messaging.publishes || [],
      subscribes: messaging.subscribes || [],
      commands: messaging.commands || [],
    };
  }

  /**
   * Validate all contracts in a set of manifests
   */
  validateAllContracts(manifests: OssaAgent[]): ContractValidationResult {
    const result: ContractValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    for (const manifest of manifests) {
      const agentResult = this.validateAgentContract(manifest);
      result.errors.push(...agentResult.errors);
      result.warnings.push(...agentResult.warnings);
      if (!agentResult.valid) {
        result.valid = false;
      }
    }

    return result;
  }
}
