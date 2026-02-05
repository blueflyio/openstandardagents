// @ts-nocheck
/**
 * Kagent Extension Validator
 * Validates GitLab Kagent (Kubernetes Agents) extension configuration
 * CRITICAL for GitLab adoption
 */

import { injectable } from 'inversify';
import type { ErrorObject } from 'ajv';
import type { OssaAgent, ValidationResult } from '../../types/index.js';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import { join } from 'path';

@injectable()
export class KagentValidator {
  private ajv: Ajv;
  private validateKagent: ReturnType<Ajv['compile']>;

  constructor() {
    // @ts-expect-error - Ajv v8 API compatibility
    this.ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(this.ajv);

    // Load Kagent schema from spec/ directory (relative to project root)
    // Works in both Jest (source tree) and production (project root with dist/)
    const kagentSchemaPath = join(
      process.cwd(),
      'spec/v0.3/extensions/kagent/kagent.schema.json'
    );
    const kagentSchema = JSON.parse(readFileSync(kagentSchemaPath, 'utf-8'));
    this.validateKagent = this.ajv.compile(kagentSchema);
  }

  validate(manifest: OssaAgent): ValidationResult {
    const errors: ErrorObject[] = [];
    const warnings: string[] = [];

    const kagentExt = manifest.extensions?.kagent as
      | Record<string, unknown>
      | undefined;

    if (!kagentExt) {
      return { valid: true, errors: [], warnings: [] };
    }

    // Validate against Kagent extension schema
    const valid = this.validateKagent(kagentExt);
    if (!valid) {
      const schemaErrors = this.validateKagent.errors || [];
      errors.push(
        ...schemaErrors.map((err: ErrorObject) => ({
          ...err,
          instancePath: `/extensions/kagent${err.instancePath}`,
        }))
      );
    }

    // Additional business logic validations

    // Validate Kubernetes namespace format
    const kubernetes = kagentExt.kubernetes as
      | Record<string, unknown>
      | undefined;
    if (kubernetes) {
      const namespace = kubernetes.namespace as string | undefined;
      if (namespace) {
        const namespacePattern = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;
        if (!namespacePattern.test(namespace)) {
          errors.push({
            instancePath: '/extensions/kagent/kubernetes/namespace',
            schemaPath: '',
            keyword: 'pattern',
            params: { pattern: namespacePattern.toString() },
            message:
              'namespace must be a valid Kubernetes DNS-1123 subdomain (lowercase alphanumeric and hyphens)',
          });
        }
      }

      // Validate resource limits format
      const resourceLimits = kubernetes.resourceLimits as
        | Record<string, unknown>
        | undefined;
      if (resourceLimits) {
        const cpu = resourceLimits.cpu as string | undefined;
        if (cpu) {
          const cpuPattern = /^[0-9]+(\.[0-9]+)?(m|)$/;
          if (!cpuPattern.test(cpu)) {
            errors.push({
              instancePath: '/extensions/kagent/kubernetes/resourceLimits/cpu',
              schemaPath: '',
              keyword: 'pattern',
              params: { pattern: cpuPattern.toString() },
              message: 'cpu must be in format: "100m", "500m", "1000m", or "2"',
            });
          }
        }

        const memory = resourceLimits.memory as string | undefined;
        if (memory) {
          const memoryPattern =
            /^[0-9]+(\.[0-9]+)?(Ki|Mi|Gi|Ti|Pi|Ei|k|M|G|T|P|E)?$/;
          if (!memoryPattern.test(memory)) {
            errors.push({
              instancePath:
                '/extensions/kagent/kubernetes/resourceLimits/memory',
              schemaPath: '',
              keyword: 'pattern',
              params: { pattern: memoryPattern.toString() },
              message:
                'memory must be in format: "128Mi", "512Mi", "1Gi", "2Gi"',
            });
          }
        }
      }
    }

    // Validate guardrails configuration
    const guardrails = kagentExt.guardrails as
      | Record<string, unknown>
      | undefined;
    if (guardrails) {
      const costLimits = guardrails.costLimits as
        | Record<string, unknown>
        | undefined;
      if (costLimits) {
        const maxTokensPerDay = costLimits.maxTokensPerDay as
          | number
          | undefined;
        const maxCostPerDay = costLimits.maxCostPerDay as number | undefined;

        if (maxTokensPerDay !== undefined && maxTokensPerDay < 0) {
          errors.push({
            instancePath:
              '/extensions/kagent/guardrails/costLimits/maxTokensPerDay',
            schemaPath: '',
            keyword: 'minimum',
            params: { limit: 0 },
            message: 'maxTokensPerDay must be >= 0',
          });
        }

        if (maxCostPerDay !== undefined && maxCostPerDay < 0) {
          errors.push({
            instancePath:
              '/extensions/kagent/guardrails/costLimits/maxCostPerDay',
            schemaPath: '',
            keyword: 'minimum',
            params: { limit: 0 },
            message: 'maxCostPerDay must be >= 0',
          });
        }

        // Warn if no cost limits set
        if (maxTokensPerDay === undefined && maxCostPerDay === undefined) {
          warnings.push(
            'No cost limits set in guardrails. Consider setting maxTokensPerDay or maxCostPerDay for production deployments.'
          );
        }
      }

      // Validate audit log retention format
      const auditLog = guardrails.auditLog as
        | Record<string, unknown>
        | undefined;
      if (auditLog) {
        const retention = auditLog.retention as string | undefined;
        if (retention) {
          const retentionPattern = /^[0-9]+(days|weeks|months|years)$/;
          if (!retentionPattern.test(retention)) {
            errors.push({
              instancePath: '/extensions/kagent/guardrails/auditLog/retention',
              schemaPath: '',
              keyword: 'pattern',
              params: { pattern: retentionPattern.toString() },
              message:
                'retention must be in format: "7days", "30days", "1year", "7years"',
            });
          }
        }
      }
    }

    // Validate A2A configuration
    const a2aConfig = kagentExt.a2aConfig as
      | Record<string, unknown>
      | undefined;
    if (a2aConfig) {
      const enabled = a2aConfig.enabled as boolean | undefined;
      if (enabled === true) {
        const endpoints = a2aConfig.endpoints as string[] | undefined;
        if (!endpoints || endpoints.length === 0) {
          warnings.push(
            'A2A is enabled but no endpoints specified. Agent-to-agent communication will not work.'
          );
        }

        // Validate endpoint URLs
        if (endpoints) {
          endpoints.forEach((endpoint, index) => {
            try {
              new URL(endpoint);
            } catch {
              errors.push({
                instancePath: `/extensions/kagent/a2aConfig/endpoints/${index}`,
                schemaPath: '',
                keyword: 'format',
                params: { format: 'uri' },
                message: `endpoint must be a valid URI: ${endpoint}`,
              });
            }
          });
        }
      }
    }

    // Validate GitLab integration
    const gitlabIntegration = kagentExt.gitlabIntegration as
      | Record<string, unknown>
      | undefined;
    if (gitlabIntegration) {
      const agentId = gitlabIntegration.agentId as string | undefined;
      const projectId = gitlabIntegration.projectId as number | undefined;

      if (agentId && projectId === undefined) {
        warnings.push(
          'agentId specified but projectId missing. GitLab integration may not work correctly.'
        );
      }

      if (projectId !== undefined && projectId < 0) {
        errors.push({
          instancePath: '/extensions/kagent/gitlabIntegration/projectId',
          schemaPath: '',
          keyword: 'minimum',
          params: { limit: 0 },
          message: 'projectId must be >= 0',
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
