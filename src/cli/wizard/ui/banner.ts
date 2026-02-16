/**
 * OSSA Wizard Banner Components
 * ASCII art banners with gradient colors for the interactive wizard
 *
 * SOLID: Single Responsibility - Banner display only
 * DRY: Reusable banner components
 */

import gradient from 'gradient-string';
import chalk from 'chalk';

/**
 * Display OSSA welcome banner with gradient colors
 * Shows ASCII art logo and taglines at wizard start
 */
export function showBanner(): void {
  // OSSA ASCII art - clean and professional
  const ossaArt = `
   ██████╗ ███████╗███████╗ █████╗
  ██╔═══██╗██╔════╝██╔════╝██╔══██╗
  ██║   ██║███████╗███████╗███████║
  ██║   ██║╚════██║╚════██║██╔══██║
  ╚██████╔╝███████║███████║██║  ██║
   ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝
`;

  // Apply rainbow gradient to ASCII art
  const gradientArt = gradient.pastel.multiline(ossaArt);

  console.log('');
  console.log(gradientArt);

  // Taglines with gradient
  const tagline1 = gradient.cristal('  Open Standard for Software Agents');
  const tagline2 = gradient.teen('  Making agents feel like real team members');

  console.log(tagline1);
  console.log(tagline2);
  console.log('');
  console.log(chalk.gray('  ─'.repeat(35)));
  console.log('');
}

/**
 * Display success banner after agent creation
 * Shows celebration message with agent name
 *
 * @param agentName - Name of the created agent
 */
export function showSuccessBanner(agentName: string): void {
  // Success ASCII art - compact and celebratory
  const successArt = `
  ╔═══════════════════════════════════════╗
  ║                                       ║
  ║         ✓  SUCCESS!  ✓               ║
  ║                                       ║
  ╚═══════════════════════════════════════╝
`;

  // Apply gradient to success box
  const gradientSuccess = gradient.morning.multiline(successArt);

  console.log('');
  console.log(gradientSuccess);

  // Agent name with gradient
  const agentMessage = `  Agent "${agentName}" created successfully!`;
  const gradientMessage = gradient.summer(agentMessage);

  console.log(gradientMessage);
  console.log('');
  console.log(chalk.gray('  Your agent is ready to join the team.'));
  console.log('');
  console.log(chalk.gray('  ─'.repeat(35)));
  console.log('');
}
