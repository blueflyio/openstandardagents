---
name: terminal-setup
description: "Configure iTerm2 and terminal settings for optimal Claude Code usage. Sets up Option key as Meta, notifications, scrollback, and keyboard shortcuts."
license: "Apache-2.0"
compatibility: "macOS with iTerm2"
allowed-tools: "Bash Read"
metadata:
  domain: terminal
  tier: utility
  autonomy: guided
---

# Terminal Setup Skill

Configure your terminal environment for optimal Claude Code usage.

## iTerm2 Configuration (Manual Steps)

Open iTerm2 Preferences (Cmd+,):

### 1. Option Key as Meta (REQUIRED for shortcuts)
- Go to **Profiles** > **Keys** > **General**
- Set **Left Option Key** to `Esc+`
- Set **Right Option Key** to `Esc+`

### 2. Notifications for Task Completion
- Go to **Profiles** > **Terminal**
- Enable **"Silence bell"**
- Enable **"Send Growl/Notification Center alerts"**

### 3. Scrollback Buffer
- Go to **Profiles** > **Terminal**
- Set **Scrollback lines** to `10000` (or check "Unlimited")

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Shift+Enter` | Add newline (native in iTerm2) |
| `Ctrl+C` | Cancel current operation |
| `Ctrl+B` | Background long-running command |
| `Escape` | Interrupt Claude's response |

## Claude Code Features

- **Shift+Enter**: Natively supported in iTerm2 for multi-line input
- **Tab completion**: Works for file paths and commands
- **/commands**: Type `/` to see available slash commands

## Verification

Run this to verify your setup:

```bash
# Check iTerm2 version
osascript -e 'tell application "iTerm2" to version'

# Check shell
echo $SHELL

# Check Claude Code
claude --version
```
