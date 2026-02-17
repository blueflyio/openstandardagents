/**
 * Perfect Agent Utilities
 *
 * Shared helpers for generating Perfect Agent artifacts.
 * Extracted from ClaudeSkillsService and other services
 * to provide a lightweight, synchronous API for BaseAdapter.
 */

import * as yaml from 'yaml';
import type { OssaAgent } from '../../types/index.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

/**
 * Generate SKILL.md content from an OSSA manifest.
 *
 * This is a standalone version of ClaudeSkillsService.generateSkillContent
 * that returns a string instead of writing to disk, suitable for export files.
 */
export function generateSkillContent(manifest: OssaAgent): string {
  const name = manifest.metadata?.name || 'agent';
  const description =
    manifest.metadata?.description || (manifest.spec?.role as string) || 'OSSA agent';
  const version = manifest.metadata?.version || '0.1.0';

  // Extract trigger keywords from taxonomy, labels, capabilities
  const keywords = new Set<string>();
  keywords.add('ossa');
  keywords.add(name);

  const metadata = manifest.metadata as AnyRecord | undefined;
  if (metadata?.agentType) keywords.add(metadata.agentType);
  if (metadata?.agentKind) keywords.add(metadata.agentKind);

  const labels = metadata?.labels as AnyRecord | undefined;
  if (labels?.capability) {
    String(labels.capability)
      .split(',')
      .forEach((c: string) => keywords.add(c.trim()));
  }

  const tags = metadata?.tags as string[] | undefined;
  if (Array.isArray(tags)) {
    tags.forEach((t: string) => keywords.add(t));
  }

  const arch = metadata?.agentArchitecture as AnyRecord | undefined;
  if (arch?.pattern) keywords.add(arch.pattern);
  if (Array.isArray(arch?.capabilities)) {
    (arch.capabilities as string[]).forEach((c: string) => keywords.add(c));
  }

  // Build frontmatter
  const frontmatter: AnyRecord = {
    name,
    description: description.substring(0, 200),
    trigger_keywords: [...keywords].filter(Boolean).slice(0, 15),
  };

  let content = `---\n${yaml.stringify(frontmatter)}---\n\n`;
  content += `# ${name}\n\n`;
  content += `${description}\n\n`;
  content += `## Manifest\n\n`;
  content += `- **Version**: ${version}\n`;
  content += `- **OSSA Spec**: ${manifest.apiVersion || 'ossa/v0.4'}\n`;

  if (metadata?.agentType) {
    content += `- **Runtime**: ${metadata.agentType}\n`;
  }
  if (metadata?.agentKind) {
    content += `- **Role**: ${metadata.agentKind}\n`;
  }
  if (arch?.pattern && arch.pattern !== 'single') {
    content += `- **Architecture**: ${arch.pattern}\n`;
  }
  content += `\n`;

  // Tools
  const tools = (manifest.spec?.tools || []) as AnyRecord[];
  if (tools.length > 0) {
    content += `## Tools\n\n`;
    for (const tool of tools) {
      content += `- **${tool.name || 'unnamed'}**: ${tool.description || 'No description'}\n`;
    }
    content += `\n`;
  }

  // When to use
  content += `## When to Use\n\n`;
  content += `Use this skill when you need to:\n`;
  if (metadata?.agentKind === 'orchestrator' || metadata?.agentKind === 'coordinator') {
    content += `- Coordinate multiple agents or complex workflows\n`;
  }
  if (metadata?.agentKind === 'reviewer') {
    content += `- Review and validate code, content, or artifacts\n`;
  }
  if (metadata?.agentKind === 'worker') {
    content += `- Execute specific, focused tasks autonomously\n`;
  }
  content += `- Leverage ${name} capabilities for ${description.split('.')[0]}\n`;
  if (tools.length > 0) {
    content += `- Use any of the ${tools.length} available tool(s)\n`;
  }
  content += `\n`;

  // Autonomy
  const spec = manifest.spec as AnyRecord | undefined;
  const autonomy = spec?.autonomy as AnyRecord | undefined;
  if (autonomy) {
    content += `## Autonomy\n\n`;
    content += `- **Level**: ${autonomy.level || 'supervised'}\n`;
    if (autonomy.approvalRequired) {
      content += `- **Approval Required**: Yes\n`;
    }
    if (Array.isArray(autonomy.allowedActions)) {
      content += `- **Allowed Actions**: ${(autonomy.allowedActions as string[]).join(', ')}\n`;
    }
    if (Array.isArray(autonomy.blockedActions)) {
      content += `- **Blocked Actions**: ${(autonomy.blockedActions as string[]).join(', ')}\n`;
    }
    content += `\n`;
  }

  return content;
}
