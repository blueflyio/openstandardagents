import { Command } from 'commander';
import * as fs from 'fs/promises';
import * as path from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../../'); // Path to the project root

// Helper function to load manifest (supports JSON and YAML)
async function loadManifest(filePath: string): Promise<any> {
  const fullPath = path.resolve(process.cwd(), filePath);
  const content = await fs.readFile(fullPath, 'utf-8');
  if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
    try {
      // Use dynamic import for YAML parsing if available, or fallback
      const YAML = await import('yaml');
      return YAML.parse(content);
    } catch (e) {
      console.error(
        "YAML parsing library 'yaml' not found. Please install it: npm install yaml"
      );
      throw e;
    }
  } else {
    return JSON.parse(content);
  }
}

export const planIdentityCommand = new Command('identity')
  .description(
    'Generates an identity plan for an agent based on its manifest and configuration.'
  )
  .argument(
    '<agent-manifest>',
    'Path to the agent manifest file (e.g., agent.yaml, ossa.yaml, or package.json).'
  )
  .option(
    '-o, --output <file>',
    'Path to save the identity plan JSON file.',
    'identity.plan.json'
  )
  .action(async (agentManifestPath: string, options) => {
    console.log(`Planning identity for agent manifest: ${agentManifestPath}`);

    // --- 1. Load Agent Manifest ---
    let agentManifest: any;
    try {
      agentManifest = await loadManifest(agentManifestPath);
      console.log('Agent manifest loaded.');
    } catch (error: any) {
      console.error(
        `Error loading agent manifest ${agentManifestPath}: ${error.message}`
      );
      process.exit(1);
    }

    // --- 2. Deterministically Derive Requirements ---
    // This is the core logic: derive requirements from explicit declarations in the manifest,
    // adapter configurations, and runtime profiles. It should NOT use LLM inference for core permissions.
    const derivedPlan = {
      agentName:
        agentManifest.metadata?.name ||
        agentManifest.agent?.name ||
        path.basename(agentManifestPath, path.extname(agentManifestPath)),
      identityConfig: {
        principal: {
          category: 'service', // Default or derived from manifest/adapters
          mode: 'service_account', // Default or derived
          provider: 'unknown', // To be determined from adapters
          region: 'us-east-1', // Default or derived
          roleName: `${agentManifest.metadata?.name || agentManifest.agent?.name}-role`, // Example derivation
          scopes: [] as string[], // To be derived
          oidc: undefined, // To be derived if applicable
        },
        requiredPermissions: [] as string[], // Abstract permissions derived from tools/capabilities
        credentialSource: {
          type: 'env', // Default or derived from runtime profile/adapter config
          ref: `${agentManifest.metadata?.name?.toUpperCase() || agentManifest.agent?.name?.toUpperCase()}_API_KEY`, // Example derivation
        },
      },
      provisioningDetails: {}, // Provider-specific details for creation
      rotationPolicy: {
        maxAge: '90d', // Default or derived from policy
        frequency: '30d', // Default or derived from policy
      },
    };

    const provisioningDetails = derivedPlan.provisioningDetails as Record<
      string,
      any
    >;

    // --- Example Derivation Logic ---
    // This logic is simplified. A full implementation would involve:
    // 1. Reading adapter configurations to understand provider capabilities and permission mappings.
    // 2. Parsing OpenAPI specs linked to capabilities for security schemes and scopes.
    // 3. Consulting runtime profiles for constraints on identity primitives.
    // 4. Mapping abstract permissions to provider-specific scopes/roles.

    // Infer principal provider and details from the first adapter declared in spec.adapters
    if (
      agentManifest.spec?.adapters &&
      agentManifest.spec.adapters.length > 0
    ) {
      const firstAdapter = agentManifest.spec.adapters[0];
      const providerType = firstAdapter.type; // e.g., "scm.gitlab", "runtime.k8s"
      const providerName = providerType.split('.')[0]; // e.g., "gitlab"

      derivedPlan.identityConfig.principal.provider = providerName;
      derivedPlan.identityConfig.principal.region =
        firstAdapter.config?.region || 'us-east-1';
      derivedPlan.identityConfig.principal.roleName =
        firstAdapter.config?.roleName ||
        `${derivedPlan.agentName}-${providerName}-role`;
      derivedPlan.identityConfig.principal.scopes = firstAdapter.config
        ?.scopes || ['default:read']; // Default scopes
      derivedPlan.identityConfig.credentialSource.ref =
        firstAdapter.config?.credentialRef ||
        `${derivedPlan.agentName.toUpperCase()}_${providerName.toUpperCase()}_SECRET`;

      if (firstAdapter.config?.oidc) {
        derivedPlan.identityConfig.principal.oidc = firstAdapter.config.oidc;
      }

      // Populate provider-specific provisioning details
      if (providerName === 'gitlab') {
        provisioningDetails.gitlab = {
          serviceAccount: {
            name:
              firstAdapter.config?.serviceAccountName ||
              `${derivedPlan.agentName}-gitlab-sa`,
            scopes: firstAdapter.config?.scopes || ['api', 'read_repository'],
          },
        };
      } else if (providerName === 'github') {
        provisioningDetails.github = {
          appPermissions: firstAdapter.config?.appPermissions || {
            metadata: 'read-only',
            contents: 'read-only',
            pull_requests: 'write',
          },
        };
      }
      // Add other providers like 'aws', 'azure', etc.
    } else if (agentManifest.agent?.runtime?.type) {
      // Fallback for legacy agent format if no adapters specified
      const runtimeProvider = agentManifest.agent.runtime.type.split('.')[0]; // e.g. 'docker'
      derivedPlan.identityConfig.principal.provider = runtimeProvider;
      derivedPlan.identityConfig.principal.roleName = `${derivedPlan.agentName}-${runtimeProvider}-runtime-role`;
      // Add more fallback logic as needed for legacy formats
    }

    // Infer abstract permissions from declared tools and capabilities
    const declaredPermissions = new Set<string>();
    if (agentManifest.spec?.tools) {
      agentManifest.spec.tools.forEach((tool: any) => {
        // Example: Map tool types/names to abstract permissions
        if (tool.type === 'mcp') declaredPermissions.add('tool:mcp');
        if (tool.name === 'search') declaredPermissions.add('read:search-data');
        if (tool.capabilityId)
          declaredPermissions.add(`capability:${tool.capabilityId}`);
        // Add more mappings based on tool names/types
      });
    }
    // Also consider capabilities directly declared if not linked via tools
    if (agentManifest.spec?.capabilities) {
      agentManifest.spec.capabilities.forEach((cap: any) => {
        if (cap.id) declaredPermissions.add(`capability:${cap.id}`);
        // Add mappings for other capability fields if needed
      });
    }

    derivedPlan.identityConfig.requiredPermissions =
      Array.from(declaredPermissions);
    // Ensure requiredPermissions has at least a default if empty
    if (derivedPlan.identityConfig.requiredPermissions.length === 0) {
      derivedPlan.identityConfig.requiredPermissions.push('default:execute');
    }

    // --- 3. Validate the generated plan against its schema ---
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv); // Add common formats like date-time, uri, email

    let planSchema: any;
    try {
      const schemaPath = path.join(
        PROJECT_ROOT,
        'schemas',
        'identity.plan.schema.json'
      );
      const schemaContent = await fs.readFile(schemaPath, 'utf-8');
      planSchema = JSON.parse(schemaContent);
      console.log('Identity plan schema loaded successfully.');
    } catch (error: any) {
      console.error(
        `Error loading identity plan schema from ${PROJECT_ROOT}/schemas/identity.plan.schema.json: ${error.message}`
      );
      process.exit(1);
    }

    const validate = ajv.compile(planSchema);
    const isValid = validate(derivedPlan);

    if (!isValid) {
      console.error('Generated identity plan is invalid against its schema.');
      logAjvErrors(validate.errors as any);
      process.exit(1);
    }
    console.log('Generated identity plan is valid.');

    // --- 4. Output the plan ---
    try {
      const outputPath = path.resolve(process.cwd(), options.output);
      await fs.writeFile(outputPath, JSON.stringify(derivedPlan, null, 2));
      console.log(`Identity plan saved to: ${outputPath}`);
    } catch (error: any) {
      console.error(
        `Error saving identity plan to ${options.output}: ${error.message}`
      );
      process.exit(1);
    }
  });

// Helper function to log Ajv errors more readably
function logAjvErrors(errors: any[] | undefined) {
  if (!errors) return;
  errors.forEach((err) => {
    console.error(
      `- ${err.instancePath || 'Root'}: ${err.message} (${err.keyword})`
    );
  });
}
