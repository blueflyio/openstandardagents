import { OssaAgent } from '@bluefly/openstandardagents';

interface Tool {
  name?: string;
  type?: string;
  description?: string;
  capabilities?: string[];
  auth?: { type: string };
  [key: string]: unknown;
}

interface Command {
  name?: string;
  description?: string;
  [key: string]: unknown;
}

interface PublishEvent {
  channel: string;
  description?: string;
  [key: string]: unknown;
}

interface Subscription {
  channel: string;
  description?: string;
  [key: string]: unknown;
}

interface MessagingSpec {
  commands?: Command[];
  publishes?: PublishEvent[];
  subscribes?: Subscription[];
}

/**
 * Documentation Generator
 *
 * Automatically generates standard Markdown documentation from an OSSA Agent Manifest.
 *
 * This ensures that documentation is always up-to-date with the actual capabilities
 * defined in the manifest, enforcing the "Single Source of Truth" principle.
 */
export class DocsGenerator {
  /**
   * Generate Markdown documentation for an OSSA Agent Manifest
   * @param manifest The valid OSSA Agent Manifest
   * @returns Markdown string
   */
  public generate(manifest: OssaAgent): string {
    const meta = manifest.metadata || { name: 'Unknown' };
    const spec = manifest.spec || { role: 'None' };

    const header = `# ${meta.name}
> ${meta.description || 'No description provided.'}

- **Version**: ${meta.version || '0.0.0'}
- **Role**: ${spec.role}
`;

    const toolsSection = this.generateToolsSection(spec.tools);
    const messagingSection = this.generateMessagingSection(
      spec.messaging as MessagingSpec
    );

    return [header, toolsSection, messagingSection].join('\n\n');
  }

  /**
   * Generates the Tools section, listing all executable capabilities.
   */
  private generateToolsSection(tools?: Tool[]): string {
    if (!tools || tools.length === 0) return '## Tools\n\n*No tools exposed.*';

    const items = tools
      .map((t) => {
        const auth = t.auth ? ` (Auth: ${t.auth.type})` : '';
        return (
          `### 🛠️ ${t.name || 'Unnamed Tool'}${auth}\n\n` +
          'Type: `'
          + (t.type || 'unknown') +
          '`\n\n' +
          (t.description ? `${t.description}\n` : '') +
          (t.capabilities
            ? `\n**Capabilities**: ${t.capabilities.join(', ')}`
            : '')
        );
      })
      .join('\n\n');

    return `## Tools\n\n${items}`;
  }

  /**
   * Generates the Messaging section, documenting async inputs/outputs.
   */
  private generateMessagingSection(messaging?: MessagingSpec): string {
    if (!messaging) return '## Messaging\n\n*No messaging configured.*';

    let content = '## Messaging\n\n';

    if (messaging.commands && messaging.commands.length > 0) {
      content += '### Commands\n\n';
      content +=
        messaging.commands
          .map((c) => `- **${c.name}**: ${c.description || 'No description'}`)
          .join('\n') + '\n\n';
    }

    if (messaging.publishes && messaging.publishes.length > 0) {
      content += '### Publishes Events\n\n';
      content +=
        messaging.publishes
          .map(
            (p) => `- **${p.channel}**: ${p.description || 'No description'}`
          )
          .join('\n') + '\n\n';
    }

    if (messaging.subscribes && messaging.subscribes.length > 0) {
      content += '### Subscribes to Events\n\n';
      content +=
        messaging.subscribes
          .map(
            (s) => `- **${s.channel}**: ${s.description || 'No description'}`
          )
          .join('\n') + '\n';
    }

    return content;
  }
}