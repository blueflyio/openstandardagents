import os
import json
from pathlib import Path

def main():
    # Base directory to scan (dynamically resolved)
    user_home = Path.home()
    base_dir = user_home / "Sites" / "blueflyio"
    
    # Define primary workspace root
    agents_workspace_root = base_dir / ".agents-workspace"
    
    if not agents_workspace_root.exists():
        print(f"Warning: Primary workspace root not found at {agents_workspace_root}")

    # Prepare folders array
    folders = []
    
    # 1. Add the central agents-workspace root first
    folders.append({
        "name": "⚙️ Agents Workspace Root",
        "path": str(agents_workspace_root)
    })
    
    # 2. Add the agent-platform source
    agent_platform = base_dir / "agent-platform"
    if agent_platform.exists():
        folders.append({
            "name": "🏗️ Agent Platform",
            "path": str(agent_platform)
        })

    # 3. Scan for any project within blueflyio containing an `.agents` directory
    print(f"Scanning {base_dir} for projects with .agents directories...")
    
    try:
        # Keep it one level deep to avoid scanning node_modules or deep vendor dirs
        for project_dir in base_dir.iterdir():
            if project_dir.is_dir() and not project_dir.name.startswith('.'):
                agents_dir = project_dir / ".agents"
                if agents_dir.exists() and agents_dir.is_dir():
                    folders.append({
                        "name": f"🤖 {project_dir.name}",
                        "path": str(project_dir)
                    })
                    print(f"Found agent project: {project_dir.name}")
    except OSError as e:
        print(f"Error scanning directory: {e}")
        return

    # Add recommended settings standard to Cursor/VSCode for agent development
    settings = {
        "files.exclude": {
            "**/node_modules": True,
            "**/.git": True,
            "**/dist": True
        },
        "search.exclude": {
            "**/node_modules": True,
            "**/dist": True
        },
        "kiroAgent.configureMCP": "Enabled",
        "cursor.ai.enableCodeActions": True
    }

    workspace_data = {
        "folders": folders,
        "settings": settings
    }

    output_file = "agents-playground.code-workspace"
    
    try:
        with open(output_file, 'w') as f:
            json.dump(workspace_data, f, indent=4)
        print(f"\nSuccessfully generated workspace file: {output_file}")
        print("You can now open this file in VS Code or Cursor to load the unified agent environment.")
    except OSError as e:
        print(f"Error writing workspace file: {e}")

if __name__ == "__main__":
    main()
