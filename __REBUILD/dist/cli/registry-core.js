#!/usr/bin/env node
/**
 * REGISTRY-CORE Agent CLI
 * Production agent registry and discovery service
 */
import { Command } from 'commander';
import { createRegistryCommand } from './commands/registry.js';
const program = new Command();
// CLI Configuration
program
    .name('registry-core')
    .description('OSSA REGISTRY-CORE Agent - Production Agent Registry & Discovery')
    .version('0.1.9-alpha.1');
// Add the registry command group
program.addCommand(createRegistryCommand());
// Global help and error handling
program.on('command:*', () => {
    console.error('❌ Invalid command: %s\n', program.args.join(' '));
    console.log('💡 Use "registry-core --help" to see available commands');
    process.exit(1);
});
// Parse arguments
if (require.main === module) {
    program.parse(process.argv);
    // Show help if no command provided
    if (program.args.length === 0) {
        console.log('🏛️  OSSA REGISTRY-CORE v0.1.9-alpha.1');
        console.log('🎯 Production Agent Registry & Discovery Service');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
        program.help();
    }
}
export { program as registryCoreCLI };
//# sourceMappingURL=registry-core.js.map