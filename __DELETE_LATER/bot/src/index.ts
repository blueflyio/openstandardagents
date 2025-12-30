import { Client, GatewayIntentBits, Events } from 'discord.js';
import { config } from 'dotenv';
import { registerCommands } from './commands';
import { setupEventHandlers } from './events';

config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`✅ Bot ready! Logged in as ${readyClient.user.tag}`);
});

async function main() {
  try {
    // Register slash commands
    await registerCommands(client);
    
    // Setup event handlers
    setupEventHandlers(client);
    
    // Login
    await client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

main();
