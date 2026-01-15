/**
 * Extension Team Kickoff Service
 *
 * SOLID Principles:
 * - Single Responsibility: Spawn extension development teams
 * - Open/Closed: Extensible via dependency injection
 * - Liskov Substitution: Implements IExtensionTeamService interface
 * - Interface Segregation: Focused interface
 * - Dependency Inversion: Depends on abstractions (repositories, services)
 *
 * CRUD Operations:
 * - Create: Spawn agent teams for platforms
 * - Read: List platforms and their status
 * - Update: Update workflow inputs
 * - Delete: N/A (teams are ephemeral)
 *
 * DRY: Reusable platform definitions and workflow generation
 * Zod: Runtime validation of inputs/outputs
 * OpenAPI: Service contract defined in openapi/
 */

import { z } from 'zod';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { injectable } from 'inversify';

// ============================================================================
// Zod Schemas (Runtime Validation)
// ============================================================================

const PlatformPrioritySchema = z.enum(['critical', 'high', 'medium', 'low']);

const PlatformSchema = z.object({
  name: z.string().min(1).max(100),
  priority: PlatformPrioritySchema,
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  requirements: z.record(z.string(), z.unknown()).optional().default({}),
});

const WorkflowInputSchema = z.object({
  platform: z.string(),
  priority: PlatformPrioritySchema,
  deadline: z.string(),
  requirements: z.record(z.string(), z.unknown()).optional().default({}),
});

type Platform = z.infer<typeof PlatformSchema>;
type WorkflowInput = z.infer<typeof WorkflowInputSchema>;

// ============================================================================
// Service Interface (Interface Segregation)
// ============================================================================

export interface IExtensionTeamKickoffService {
  spawnCriticalPlatforms(): Promise<Platform[]>;
  spawnPlatform(platform: Platform): Promise<void>;
  listPlatforms(): { critical: Platform[]; high: Platform[] };
  createWorkflowInput(platform: Platform): WorkflowInput;
}

// ============================================================================
// Service Implementation (Single Responsibility)
// ============================================================================

@injectable()
export class ExtensionTeamKickoffService implements IExtensionTeamKickoffService {
  private readonly CRITICAL_PLATFORMS: Platform[] = [
    {
      name: 'vertex-ai',
      priority: 'critical',
      deadline: '2026-02-01',
      requirements: {},
    },
    {
      name: 'dialogflow',
      priority: 'critical',
      deadline: '2026-02-01',
      requirements: {},
    },
    {
      name: 'autogpt',
      priority: 'critical',
      deadline: '2026-02-15',
      requirements: {},
    },
    {
      name: 'n8n',
      priority: 'critical',
      deadline: '2026-02-15',
      requirements: {},
    },
  ];

  private readonly HIGH_PRIORITY_PLATFORMS: Platform[] = [
    {
      name: 'dspy',
      priority: 'high',
      deadline: '2026-03-01',
      requirements: {},
    },
    {
      name: 'babyagi',
      priority: 'high',
      deadline: '2026-03-01',
      requirements: {},
    },
    {
      name: 'zapier',
      priority: 'high',
      deadline: '2026-03-15',
      requirements: {},
    },
    {
      name: 'salesforce-einstein',
      priority: 'high',
      deadline: '2026-03-15',
      requirements: {},
    },
  ];

  private readonly WORKFLOWS_DIR = '.gitlab/agents/workflows';

  /**
   * List all platforms by priority
   * CRUD: Read operation
   */
  listPlatforms(): { critical: Platform[]; high: Platform[] } {
    return {
      critical: this.CRITICAL_PLATFORMS,
      high: this.HIGH_PRIORITY_PLATFORMS,
    };
  }

  /**
   * Create workflow input from platform
   * CRUD: Create operation (workflow input)
   * DRY: Reusable input generation
   */
  createWorkflowInput(platform: Platform): WorkflowInput {
    // Validate input with Zod
    const validatedPlatform = PlatformSchema.parse(platform);

    return WorkflowInputSchema.parse({
      platform: validatedPlatform.name,
      priority: validatedPlatform.priority,
      deadline: validatedPlatform.deadline,
      requirements: validatedPlatform.requirements || {},
    });
  }

  /**
   * Spawn agent team for a single platform
   * CRUD: Create operation (workflow input file)
   */
  async spawnPlatform(platform: Platform): Promise<void> {
    // Validate platform with Zod
    const validatedPlatform = PlatformSchema.parse(platform);

    // Create workflow input
    const workflowInput = this.createWorkflowInput(validatedPlatform);

    // Ensure workflows directory exists
    mkdirSync(this.WORKFLOWS_DIR, { recursive: true });

    // Write workflow input file
    const inputFile = join(
      this.WORKFLOWS_DIR,
      `${validatedPlatform.name}-input.json`
    );
    writeFileSync(inputFile, JSON.stringify(workflowInput, null, 2), 'utf-8');
  }

  /**
   * Spawn agent teams for all critical platforms
   * CRUD: Create operation (multiple workflow inputs)
   */
  async spawnCriticalPlatforms(): Promise<Platform[]> {
    const spawned: Platform[] = [];

    for (const platform of this.CRITICAL_PLATFORMS) {
      await this.spawnPlatform(platform);
      spawned.push(platform);
    }

    return spawned;
  }
}
