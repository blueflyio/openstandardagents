/**
 * OSSA CLI ASCII Art Logo
 * Modern, professional logo display with color support
 */

import chalk from 'chalk';

/**
 * Display the OSSA CLI logo with version information
 * @param version - The current version of OSSA CLI
 */
export function displayLogo(version: string): void {
  // Modern ASCII art logo with box-drawing characters
  const logo = `
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     ██████╗ ███████╗███████╗ █████╗                          ║
║    ██╔═══██╗██╔════╝██╔════╝██╔══██╗                         ║
║    ██║   ██║███████╗███████╗███████║                         ║
║    ██║   ██║╚════██║╚════██║██╔══██║                         ║
║    ╚██████╔╝███████║███████║██║  ██║                         ║
║     ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝                         ║
║                                                               ║
║             The OpenAPI for Software Agents                  ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`;

  // Color scheme: cyan for logo, dim for tagline
  const coloredLogo = logo
    .split('\n')
    .map((line, index) => {
      // Top and bottom borders
      if (index <= 1 || index >= 12) {
        return chalk.cyan(line);
      }
      // OSSA ASCII art (lines 2-8)
      if (index >= 2 && index <= 8) {
        return chalk.cyan.bold(line);
      }
      // Tagline
      if (index === 10) {
        return line.replace(
          'The OpenAPI for Software Agents',
          chalk.cyan('The OpenAPI for Software Agents')
        );
      }
      // Empty lines
      return chalk.cyan(line);
    })
    .join('\n');

  console.log(coloredLogo);
  console.log(chalk.dim(`    Version ${version}\n`));
}
