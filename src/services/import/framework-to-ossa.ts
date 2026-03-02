/**
 * Framework-to-OSSA conversion (LangFlow, LangChain, CrewAI, AutoGen).
 * Uses official flow/config shapes; no custom runtime. Single source for import CLI.
 */

import type { OssaAgent } from '../../types/index.js';
import { getApiVersion } from '../../utils/version.js';

export type FrameworkImportPlatform =
  | 'langflow'
  | 'langchain'
  | 'crewai'
  | 'autogen';

export interface FrameworkImportResult {
  manifest: OssaAgent;
  warnings: string[];
}

function baseManifest(
  name: string,
  version: string,
  description: string,
  role: string
): Partial<OssaAgent> {
  return {
    apiVersion: getApiVersion(),
    kind: 'Agent',
    metadata: { name, version, description },
    spec: { role },
  };
}

function normalizeName(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 50) || 'imported-agent'
  );
}

/** LangFlow flow JSON (nodes + edges). Official: langflow package, flow export. */
export function convertLangFlowToOSSA(data: unknown): FrameworkImportResult {
  const warnings: string[] = [];
  const flow = data as Record<string, unknown>;
  const nodes = (flow.nodes as Array<Record<string, unknown>>) ?? [];

  const roleParts: string[] = [];
  let model = 'gpt-4';
  const tools: Array<{ name: string; description?: string }> = [];

  for (const node of nodes) {
    const dataNode = (node.data as Record<string, unknown>) ?? {};
    const template =
      (dataNode.template as Record<string, { value?: string }>) ?? {};
    const nodeType = (
      ((dataNode.type ?? node.type) as string) ?? ''
    ).toLowerCase();

    if (nodeType.includes('prompt') || nodeType.includes('message')) {
      const prompt =
        template.message?.value ??
        template.text?.value ??
        template.prompt?.value;
      if (typeof prompt === 'string') roleParts.push(prompt);
    }
    if (
      nodeType.includes('openai') ||
      nodeType.includes('chat') ||
      nodeType.includes('llm')
    ) {
      const m = template.model_name?.value ?? template.model?.value;
      if (typeof m === 'string') model = m;
    }
    if (nodeType.includes('tool') || nodeType.includes('function')) {
      const nodeInfo = dataNode.node as Record<string, unknown> | undefined;
      const name = (nodeInfo?.display_name ?? node.id ?? 'tool').toString();
      tools.push({
        name,
        description: (nodeInfo?.description as string) ?? '',
      });
    }
  }

  if (roleParts.length === 0)
    warnings.push('No prompt node found; role set to placeholder.');
  if (tools.length === 0) warnings.push('No tool nodes found.');

  const name = normalizeName(
    (flow.name as string) ?? 'langflow-imported-agent'
  );
  const manifest: OssaAgent = {
    ...baseManifest(
      name,
      '1.0.0',
      (flow.description as string) ?? 'Imported from LangFlow flow',
      roleParts.join('\n\n') || 'Agent imported from LangFlow.'
    ),
    spec: {
      role: roleParts.join('\n\n') || 'Agent imported from LangFlow.',
      llm: { provider: 'openai', model },
      tools: tools.length > 0 ? tools : undefined,
    },
  } as OssaAgent;

  return { manifest, warnings };
}

/** LangChain agent config (agent.llm, agent.tools, etc.). Official: langchain package. */
export function convertLangChainToOSSA(data: unknown): FrameworkImportResult {
  const warnings: string[] = [];
  const config = data as Record<string, unknown>;
  const agent = config.agent as Record<string, unknown> | undefined;
  const llm = (agent?.llm ?? config.llm) as Record<string, unknown> | undefined;
  const modelName = (llm?.model_name as string) ?? 'gpt-4';
  let provider = 'openai';
  if (modelName.includes('claude')) provider = 'anthropic';
  else if (modelName.includes('gemini')) provider = 'google';

  const rawTools = (agent?.tools ?? config.tools) as
    | Array<Record<string, unknown>>
    | undefined;
  const tools = Array.isArray(rawTools)
    ? rawTools.map((t) => ({
        name: (t.name as string) ?? 'unnamed-tool',
        description: (t.description as string) ?? '',
      }))
    : undefined;

  const name = normalizeName(
    (agent?.agent_type as string)?.replace(/-/g, '_') ??
      'langchain-imported-agent'
  );
  const manifest: OssaAgent = {
    ...baseManifest(
      name,
      '1.0.0',
      'Converted from LangChain agent configuration',
      ''
    ),
    spec: {
      role: 'Converted from LangChain; add spec.role in manifest.',
      llm: { provider, model: modelName },
      tools,
    },
  } as OssaAgent;

  return { manifest, warnings };
}

/** CrewAI agent/crew config. Official: crewai, crewai-tools. */
export function convertCrewAIToOSSA(data: unknown): FrameworkImportResult {
  const warnings: string[] = [];
  const config = data as Record<string, unknown>;
  const role = (config.role as string) ?? '';
  const goal = (config.goal as string) ?? '';
  const backstory = (config.backstory as string) ?? '';
  const llm = config.llm as Record<string, unknown> | undefined;
  const model = (llm?.model as string) ?? 'gpt-4';
  const rawTools = config.tools as Array<Record<string, unknown>> | undefined;
  const tools = Array.isArray(rawTools)
    ? rawTools.map((t) => ({
        name: (t.name as string) ?? (t as { name?: string }).name ?? 'tool',
        description: (t.description as string) ?? '',
      }))
    : undefined;

  const roleText =
    [role, goal, backstory].filter(Boolean).join('\n\n') ||
    'CrewAI agent; add spec.role.';
  const name = normalizeName(
    (config.name as string) ?? 'crewai-imported-agent'
  );
  const manifest: OssaAgent = {
    ...baseManifest(name, '1.0.0', 'Converted from CrewAI', roleText),
    spec: {
      role: roleText,
      llm: { provider: 'openai', model },
      tools,
    },
    extensions: {
      crewai: {
        enabled: true,
        role,
        goal,
        backstory,
        tools: rawTools ?? [],
      },
    },
  } as OssaAgent;

  return { manifest, warnings };
}

/** AutoGen config. Official: pyautogen / autogen. */
export function convertAutoGenToOSSA(data: unknown): FrameworkImportResult {
  const warnings: string[] = [];
  const config = data as Record<string, unknown>;
  const name = normalizeName(
    (config.name as string) ?? 'autogen-imported-agent'
  );
  const manifest: OssaAgent = {
    ...baseManifest(
      name,
      '1.0.0',
      'Converted from AutoGen',
      (config.system_message as string) ?? ''
    ),
    spec: {
      role:
        (config.system_message as string) ?? 'AutoGen agent; add spec.role.',
      llm: { provider: 'openai', model: (config.model as string) ?? 'gpt-4' },
    },
  } as OssaAgent;

  return { manifest, warnings };
}

export function convertFromFramework(
  platform: FrameworkImportPlatform,
  data: unknown
): FrameworkImportResult {
  switch (platform) {
    case 'langflow':
      return convertLangFlowToOSSA(data);
    case 'langchain':
      return convertLangChainToOSSA(data);
    case 'crewai':
      return convertCrewAIToOSSA(data);
    case 'autogen':
      return convertAutoGenToOSSA(data);
    default:
      throw new Error(`Unsupported framework for import: ${platform}`);
  }
}

export function isSupportedFrameworkImport(
  platform: string
): platform is FrameworkImportPlatform {
  return ['langflow', 'langchain', 'crewai', 'autogen'].includes(
    platform.toLowerCase()
  );
}
