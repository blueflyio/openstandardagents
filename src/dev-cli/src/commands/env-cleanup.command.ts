/**
 * Environment Cleanup Command
 * Manages GitLab environments - lists, stops, and cleans up stuck environments
 * TODO: Move to buildkit infrastructure tools
 */

import { Command } from 'commander';
import { execSync } from 'child_process';

interface Environment {
  id: number;
  name: string;
  state: string;
  tier: string;
  created_at: string;
  auto_stop_at: string | null;
}

function getEnvironments(): Environment[] {
  const output = execSync(
    'glab api projects/blueflyio%2Fossa%2Fopenstandardagents/environments --paginate',
    { encoding: 'utf-8' }
  );
  return JSON.parse(output);
}

function stopEnvironment(id: number): void {
  execSync(
    `glab api -X POST projects/blueflyio%2Fossa%2Fopenstandardagents/environments/${id}/stop`,
    { stdio: 'inherit' }
  );
}

export function createEnvCleanupCommand(): Command {
  const command = new Command('env-cleanup');

  command
    .description('Manage GitLab environments - list and stop stuck environments')
    .option('-l, --list', 'List all environments with status')
    .option('--stop-stuck', 'Stop all stuck "stopping" environments')
    .action((options) => {
      try {
        const envs = getEnvironments();

        if (options.list) {
          console.log('\n=== GitLab Environments Summary ===\n');

          const byState = envs.reduce((acc, e) => {
            acc[e.state] = (acc[e.state] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          console.log('State breakdown:');
          Object.entries(byState).forEach(([state, count]) => {
            console.log(`  ${state}: ${count}`);
          });

          const stuck = envs.filter((e) => e.state === 'stopping');
          if (stuck.length > 0) {
            console.log('\n⚠️  Stuck Environments (state: stopping):');
            stuck.forEach((env) => {
              const created = new Date(env.created_at).toISOString().split('T')[0];
              console.log(`  ID ${env.id}: ${env.name}`);
              console.log(`    Created: ${created}`);
              console.log(`    Tier: ${env.tier}`);
            });
            console.log('\nTo stop stuck environments: npm run dev-cli env-cleanup -- --stop-stuck');
          }

          const production = envs.filter((e) =>
            ['production', 'npm-registry', 'staging'].includes(e.name)
          );
          if (production.length > 0) {
            console.log('\n✅ Production Environments:');
            production.forEach((env) => {
              console.log(`  ${env.name} - ${env.state} (${env.tier})`);
            });
          }

          console.log(`\nTotal: ${envs.length} environments`);
          return;
        }

        if (options.stopStuck) {
          const stuck = envs.filter((e) => e.state === 'stopping');
          if (stuck.length === 0) {
            console.log('✅ No stuck environments found');
            return;
          }

          console.log(`Found ${stuck.length} stuck environments. Stopping them...`);
          stuck.forEach((env) => {
            console.log(`Stopping: ${env.name} (ID: ${env.id})`);
            try {
              stopEnvironment(env.id);
              console.log('  ✅ Stop command sent');
            } catch (error) {
              console.log(`  ❌ Failed: ${error}`);
            }
          });

          console.log('\n⚠️  Note: These are stuck because they reference non-existent on_stop CI jobs.');
          console.log('They may remain in "stopping" state. Manual deletion via GitLab UI may be needed:');
          console.log('https://gitlab.com/blueflyio/ossa/openstandardagents/-/environments');
          return;
        }

        // Default: show summary
        console.log('\n=== Environment Summary ===\n');
        console.log(`Total environments: ${envs.length}`);
        const stopped = envs.filter((e) => e.state === 'stopped').length;
        const stopping = envs.filter((e) => e.state === 'stopping').length;
        const available = envs.filter((e) => e.state === 'available').length;

        console.log(`  Stopped: ${stopped}`);
        console.log(`  Stopping: ${stopping}`);
        console.log(`  Available: ${available}`);

        if (stopping > 0) {
          console.log('\n⚠️  Warning: Some environments are stuck in "stopping" state');
          console.log('Run with --list for more details');
        }

        console.log('\nOptions:');
        console.log('  --list        List all environments with details');
        console.log('  --stop-stuck  Stop all stuck environments');
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  return command;
}
