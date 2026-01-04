# Discord Server Setup

## Server Structure

### Channels

#### Information
- **#announcements** (Read-only)
  - Bot updates and releases
  - OSSA specification updates
  - Permissions: @everyone read, @OSSA-Maintainer write

#### Community
- **#general** - General discussion
- **#ossa-help** - Questions about OSSA

#### Content
- **#examples** - OSSA manifest examples (Bot auto-synced)

#### Development
- **#devops-notifications** - CI/CD notifications (Bot only)
- **#bot-commands** - Bot command testing

### Roles

- **@OSSA-Maintainer** - Core team, full permissions
- **@OSSA-Contributor** - Active community members
- **@Bot** - Automation (Permission integer: 277025508416)

## Bot Permissions

- View Channels
- Send Messages
- Embed Links
- Attach Files
- Read Message History
- Use Slash Commands

## Setup Steps

1. Create Discord server: "Open Standard Agents"
2. Create channels as listed above
3. Create roles with appropriate permissions
4. Create bot at https://discord.com/developers/applications
5. Enable "Message Content Intent"
6. Invite bot with permission integer: 277025508416

Closes #2
