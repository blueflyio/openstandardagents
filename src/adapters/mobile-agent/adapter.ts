/**
 * MobileAgent Platform Adapter
 * Exports OSSA agent manifests to X-PLUG MobileAgent format (Python)
 *
 * MobileAgent is a multi-agent GUI automation framework for mobile devices.
 * V3 architecture: Manager → Executor/Reflector/Notetaker with InfoPool.
 * Uses ADB-based GUI actions: tap, swipe, type, long_press, back, home, stop.
 *
 * @see https://github.com/X-PLUG/MobileAgent
 *
 * SOLID: Single Responsibility - MobileAgent export only
 * DRY: Reuses BaseAdapter validation
 */

import * as yaml from 'yaml';
import { BaseAdapter } from '../base/adapter.interface.js';
import type {
  OssaAgent,
  ExportOptions,
  ExportResult,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from '../base/adapter.interface.js';

/**
 * MobileAgent GUI action types (ADB-based)
 */
const GUI_ACTIONS = [
  'tap',
  'swipe',
  'type',
  'long_press',
  'back',
  'home',
  'stop',
] as const;

export class MobileAgentAdapter extends BaseAdapter {
  readonly platform = 'mobile-agent';
  readonly displayName = 'MobileAgent (X-PLUG)';
  readonly description =
    'Multi-agent GUI automation for mobile devices (Python/ADB)';
  readonly status = 'alpha' as const;
  readonly supportedVersions = ['v0.3.6', 'v{{VERSION}}'];

  /**
   * Export OSSA manifest to MobileAgent format
   */
  async export(
    manifest: OssaAgent,
    options?: ExportOptions
  ): Promise<ExportResult> {
    const startTime = Date.now();

    try {
      if (options?.validate !== false) {
        const validation = await this.validate(manifest);
        if (!validation.valid) {
          return this.createResult(
            false,
            [],
            `Validation failed: ${validation.errors?.map((e) => e.message).join(', ')}`,
            {
              duration: Date.now() - startTime,
              warnings: validation.warnings?.map((w) => w.message),
            }
          );
        }
      }

      const files = [];

      // 1. Main config (YAML)
      const config = this.generateConfig(manifest);
      files.push(this.createFile('config.yaml', config, 'config', 'yaml'));

      // 2. Agent runner (Python entry point)
      const runner = this.generateRunner(manifest);
      files.push(this.createFile('run_agent.py', runner, 'code', 'python'));

      // 3. Agent roles module
      const roles = this.generateRolesModule(manifest);
      files.push(this.createFile('agents/__init__.py', '', 'code', 'python'));
      files.push(this.createFile('agents/roles.py', roles, 'code', 'python'));

      // 4. Custom actions module
      const actions = this.generateActionsModule(manifest);
      files.push(this.createFile('actions/__init__.py', '', 'code', 'python'));
      files.push(
        this.createFile('actions/custom_actions.py', actions, 'code', 'python')
      );

      // 5. Requirements
      const requirements = this.generateRequirements();
      files.push(this.createFile('requirements.txt', requirements, 'config'));

      // 6. Environment template
      const envExample = this.generateEnvExample(manifest);
      files.push(this.createFile('.env.example', envExample, 'config'));

      // 7. Source OSSA manifest for provenance
      files.push(
        this.createFile(
          'agent.ossa.yaml',
          yaml.stringify(manifest),
          'config',
          'yaml'
        )
      );

      // 8. Tests (if requested)
      if (options?.includeTests) {
        const tests = this.generateTests(manifest);
        files.push(
          this.createFile('tests/test_agent.py', tests, 'test', 'python')
        );
      }

      return this.createResult(true, files, undefined, {
        duration: Date.now() - startTime,
        version: '3.0',
        architecture: 'v3-multi-agent',
      });
    } catch (error) {
      return this.createResult(
        false,
        [],
        error instanceof Error ? error.message : String(error),
        { duration: Date.now() - startTime }
      );
    }
  }

  /**
   * Validate manifest for MobileAgent compatibility
   */
  async validate(manifest: OssaAgent): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const baseValidation = await super.validate(manifest);
    if (baseValidation.errors) errors.push(...baseValidation.errors);
    if (baseValidation.warnings) warnings.push(...baseValidation.warnings);

    // MobileAgent requires a role for agent behavior
    if (!manifest.spec?.role) {
      errors.push({
        message:
          'spec.role is required for MobileAgent (defines manager instruction)',
        path: 'spec.role',
        code: 'MISSING_REQUIRED_FIELD',
      });
    }

    // Check LLM — MobileAgent needs multimodal capabilities
    const llm = manifest.spec?.llm as any;
    if (
      llm?.provider &&
      llm.provider !== 'openai' &&
      llm.provider !== 'anthropic'
    ) {
      warnings.push({
        message: `MobileAgent works best with multimodal LLMs (openai/anthropic). Provider '${llm.provider}' may not support screenshot analysis.`,
        path: 'spec.llm.provider',
        suggestion:
          'Use openai with gpt-4o or anthropic with claude-3.5-sonnet for GUI automation',
      });
    }

    // Warn if no tools defined — MobileAgent is tool-heavy
    const tools = manifest.spec?.tools as any[];
    if (!tools || tools.length === 0) {
      warnings.push({
        message:
          'No tools defined. MobileAgent will use default GUI actions (tap, swipe, type, etc.)',
        path: 'spec.tools',
        suggestion: 'Add app-specific tools for richer automation',
      });
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Get example MobileAgent-optimized manifest
   */
  getExample(): OssaAgent {
    return {
      apiVersion: 'ossa/v{{VERSION}}',
      kind: 'Agent',
      metadata: {
        name: 'mobile-gui-automator',
        version: '1.0.0',
        description: 'Multi-agent mobile GUI automation with MobileAgent v3',
      },
      spec: {
        role: 'You are an intelligent mobile automation agent. Analyze screenshots, plan GUI actions, and execute tasks on Android devices via ADB.',
        llm: {
          provider: 'openai',
          model: 'gpt-4o',
        },
        tools: [
          {
            type: 'function',
            name: 'tap',
            description: 'Tap on screen coordinates',
          },
          {
            type: 'function',
            name: 'swipe',
            description: 'Swipe from one point to another',
          },
          {
            type: 'function',
            name: 'type_text',
            description: 'Type text into the focused input field',
          },
          {
            type: 'function',
            name: 'take_screenshot',
            description: 'Capture current screen state',
          },
        ],
        workflow: {
          steps: [
            {
              agent: 'manager',
              task: 'plan',
              description: 'Analyze task and plan GUI action sequence',
            },
            {
              agent: 'executor',
              task: 'execute',
              description: 'Execute planned GUI actions via ADB',
            },
            {
              agent: 'reflector',
              task: 'verify',
              description: 'Verify action results from screenshots',
            },
            {
              agent: 'notetaker',
              task: 'log',
              description: 'Record observations in InfoPool',
            },
          ],
        },
      },
      extensions: {
        mobile_agent: {
          enabled: true,
          version: 'v3',
          adb_device: 'emulator-5554',
          screenshot_interval: 2,
        },
      },
    };
  }

  /**
   * Generate config.yaml for MobileAgent
   */
  private generateConfig(manifest: OssaAgent): string {
    const llm = manifest.spec?.llm as any;
    const ext = (manifest.extensions as any)?.mobile_agent || {};
    const tools = (manifest.spec?.tools || []) as any[];

    const config = {
      agent: {
        name: manifest.metadata?.name || 'mobile-agent',
        version: manifest.metadata?.version || '1.0.0',
        description: manifest.metadata?.description || '',
        architecture: 'v3',
      },
      llm: {
        provider: llm?.provider || 'openai',
        model: llm?.model || 'gpt-4o',
        temperature: llm?.temperature ?? 0.1,
        max_tokens: llm?.maxTokens ?? 4096,
      },
      device: {
        platform: 'android',
        adb_device: ext.adb_device || 'emulator-5554',
        screenshot_dir: './screenshots',
        screenshot_interval: ext.screenshot_interval ?? 2,
      },
      roles: {
        manager: {
          instruction:
            manifest.spec?.role ||
            'Plan and coordinate mobile GUI automation tasks.',
          capabilities: [
            'task_decomposition',
            'action_planning',
            'progress_tracking',
          ],
        },
        executor: {
          instruction:
            'Execute GUI actions on the mobile device via ADB commands.',
          capabilities: GUI_ACTIONS.slice(),
        },
        reflector: {
          instruction:
            'Analyze screenshots to verify action outcomes and detect errors.',
          capabilities: [
            'screenshot_analysis',
            'error_detection',
            'state_verification',
          ],
        },
        notetaker: {
          instruction:
            'Record observations, action history, and task progress in InfoPool.',
          capabilities: [
            'note_taking',
            'history_tracking',
            'context_summarization',
          ],
        },
      },
      gui_actions: GUI_ACTIONS.slice(),
      custom_tools: tools.map((t) => ({
        name: t.name || 'tool',
        description: t.description || '',
        type: t.type || 'function',
      })),
      info_pool: {
        enabled: true,
        persistence: ext.info_pool_persistence || 'memory',
      },
    };

    return yaml.stringify(config);
  }

  /**
   * Generate run_agent.py entry point
   */
  private generateRunner(manifest: OssaAgent): string {
    const llm = manifest.spec?.llm as any;
    const provider = llm?.provider || 'openai';
    const apiKeyEnv =
      provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY';

    return `#!/usr/bin/env python3
"""
${manifest.metadata?.name || 'MobileAgent'} - Entry Point
Generated from OSSA manifest

Multi-agent GUI automation using MobileAgent v3 architecture:
  Manager  -> Plans action sequences
  Executor -> Executes GUI actions via ADB
  Reflector -> Verifies outcomes from screenshots
  Notetaker -> Records observations in InfoPool

@see https://github.com/X-PLUG/MobileAgent
"""

import os
import sys
import yaml
from pathlib import Path
from dotenv import load_dotenv

# Load environment
load_dotenv()


def validate_environment():
    """Check required environment variables and ADB connectivity."""
    required = ["${apiKeyEnv}"]
    missing = [v for v in required if not os.getenv(v)]
    if missing:
        print(f"Error: Missing environment variables: {', '.join(missing)}")
        print("Copy .env.example to .env and configure.")
        sys.exit(1)


def load_config(config_path: str = "config.yaml") -> dict:
    """Load agent configuration."""
    path = Path(config_path)
    if not path.exists():
        print(f"Error: Config not found: {config_path}")
        sys.exit(1)
    with open(path) as f:
        return yaml.safe_load(f)


def main():
    """Run the MobileAgent."""
    validate_environment()
    config = load_config()

    print(f"Initializing {config['agent']['name']} (v{config['agent']['version']})")
    print(f"Architecture: MobileAgent {config['agent']['architecture']}")
    print(f"LLM: {config['llm']['provider']}/{config['llm']['model']}")
    print(f"Device: {config['device']['adb_device']}")
    print()

    # Import MobileAgent components
    try:
        from MobileAgent.run import run_agent  # noqa: F401
    except ImportError:
        print("MobileAgent not installed. Install with:")
        print("  pip install -r requirements.txt")
        print("  # or clone: git clone https://github.com/X-PLUG/MobileAgent")
        sys.exit(1)

    from agents.roles import create_agent_team
    from actions.custom_actions import get_custom_actions

    # Build agent team
    team = create_agent_team(config)
    custom_actions = get_custom_actions()

    print(f"Agent team: {', '.join(team.keys())}")
    print(f"Custom actions: {len(custom_actions)}")
    print()

    # Execute task
    task = sys.argv[1] if len(sys.argv) > 1 else config["agent"].get(
        "default_task", "Open Settings and navigate to Wi-Fi"
    )

    print(f"Task: {task}")
    print("=" * 60)

    try:
        # MobileAgent v3 execution flow:
        # 1. Manager decomposes task into sub-goals
        # 2. For each sub-goal:
        #    a. Executor performs GUI action
        #    b. Reflector analyzes screenshot
        #    c. Notetaker updates InfoPool
        # 3. Manager checks progress and adjusts plan

        result = run_agent(
            task=task,
            config=config,
            agents=team,
            custom_actions=custom_actions,
        )

        print("=" * 60)
        print("Result:", result.get("status", "unknown"))
        if result.get("actions_taken"):
            print(f"Actions: {len(result['actions_taken'])}")
        if result.get("notes"):
            print(f"Notes: {len(result['notes'])}")

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
`;
  }

  /**
   * Generate agents/roles.py
   */
  private generateRolesModule(manifest: OssaAgent): string {
    const workflow = manifest.spec?.workflow as any;
    const steps = workflow?.steps || [];

    return `"""
Agent Role Definitions for ${manifest.metadata?.name || 'MobileAgent'}
Generated from OSSA manifest

MobileAgent v3 uses four specialized agent roles that collaborate
through an InfoPool shared memory structure.
"""

from typing import Any


class AgentRole:
    """Base agent role in MobileAgent v3 architecture."""

    def __init__(self, name: str, instruction: str, capabilities: list[str]):
        self.name = name
        self.instruction = instruction
        self.capabilities = capabilities

    def __repr__(self) -> str:
        return f"AgentRole({self.name}, caps={len(self.capabilities)})"


def create_agent_team(config: dict) -> dict[str, AgentRole]:
    """
    Create the MobileAgent v3 agent team from config.

    Returns:
        Dictionary mapping role name to AgentRole instance.
    """
    roles_config = config.get("roles", {})
    team = {}

    for role_name in ["manager", "executor", "reflector", "notetaker"]:
        role_cfg = roles_config.get(role_name, {})
        team[role_name] = AgentRole(
            name=role_name,
            instruction=role_cfg.get("instruction", f"Default {role_name} instruction"),
            capabilities=role_cfg.get("capabilities", []),
        )

    return team


${
  steps.length > 0
    ? `# Workflow steps from OSSA manifest
WORKFLOW_STEPS = [
${steps.map((s: any) => `    {"agent": "${s.agent || 'manager'}", "task": "${s.task || 'execute'}", "description": "${s.description || ''}"},`).join('\n')}
]`
    : `# Default workflow: Manager -> Executor -> Reflector -> Notetaker
WORKFLOW_STEPS = [
    {"agent": "manager", "task": "plan", "description": "Decompose task into GUI action sequence"},
    {"agent": "executor", "task": "execute", "description": "Perform GUI actions via ADB"},
    {"agent": "reflector", "task": "verify", "description": "Check action outcomes from screenshots"},
    {"agent": "notetaker", "task": "record", "description": "Log observations to InfoPool"},
]`
}
`;
  }

  /**
   * Generate actions/custom_actions.py
   */
  private generateActionsModule(manifest: OssaAgent): string {
    const tools = (manifest.spec?.tools || []) as any[];

    const toolDefs = tools.map(
      (t) => `
def ${t.name || 'custom_action'}(device, **kwargs) -> dict[str, Any]:
    """
    ${t.description || 'Custom action implementation'}

    Args:
        device: ADB device connection
        **kwargs: Action parameters

    Returns:
        Action result with status and optional screenshot path
    """
    return {"status": "ok", "action": "${t.name || 'action'}", **kwargs}
`
    );

    return `"""
Custom Actions for ${manifest.metadata?.name || 'MobileAgent'}
Generated from OSSA manifest

These actions extend MobileAgent's built-in GUI actions
(tap, swipe, type, long_press, back, home, stop) with
app-specific automation logic.
"""

from typing import Any


# Built-in GUI actions (provided by MobileAgent)
BUILTIN_ACTIONS = ["tap", "swipe", "type", "long_press", "back", "home", "stop"]

${
  toolDefs.length > 0
    ? toolDefs.join('\n')
    : `
def example_action(device, **kwargs) -> dict[str, Any]:
    """
    Example custom action.

    Args:
        device: ADB device connection
        **kwargs: Action parameters

    Returns:
        Action result
    """
    return {"status": "ok", "action": "example_action", **kwargs}
`
}

def get_custom_actions() -> dict[str, callable]:
    """Return all custom actions as a name -> function mapping."""
    actions = {}
${
  tools.length > 0
    ? tools
        .map(
          (t) =>
            `    actions["${t.name || 'action'}"] = ${t.name || 'custom_action'}`
        )
        .join('\n')
    : '    # Add custom actions here\n    # actions["my_action"] = my_action_function'
}
    return actions
`;
  }

  /**
   * Generate requirements.txt
   */
  private generateRequirements(): string {
    return `# MobileAgent Framework
# Clone from: https://github.com/X-PLUG/MobileAgent
# Or install via pip when available

# LLM Providers
openai>=1.12.0
anthropic>=0.18.0

# Configuration
pyyaml>=6.0
python-dotenv>=1.0.0

# Image Processing (for screenshot analysis)
Pillow>=10.0.0

# ADB Interface
pure-python-adb>=0.3.0

# Utilities
pydantic>=2.6.0
requests>=2.31.0
`;
  }

  /**
   * Generate .env.example
   */
  private generateEnvExample(manifest: OssaAgent): string {
    const llm = manifest.spec?.llm as any;
    const provider = llm?.provider || 'openai';
    const primaryKey =
      provider === 'anthropic'
        ? 'ANTHROPIC_API_KEY=sk-ant-...'
        : 'OPENAI_API_KEY=sk-...';

    return `# ${manifest.metadata?.name || 'MobileAgent'} Environment Configuration

# LLM Provider (required)
${primaryKey}

# ADB Device
ADB_DEVICE=emulator-5554
# ADB_HOST=127.0.0.1
# ADB_PORT=5037

# Screenshot Settings
SCREENSHOT_DIR=./screenshots
SCREENSHOT_INTERVAL=2

# Logging
LOG_LEVEL=INFO
VERBOSE=true
`;
  }

  /**
   * Generate tests/test_agent.py
   */
  private generateTests(manifest: OssaAgent): string {
    return `"""
Tests for ${manifest.metadata?.name || 'MobileAgent'} Configuration
"""

import pytest
import yaml
from pathlib import Path


class TestConfig:
    """Test agent configuration."""

    @pytest.fixture
    def config(self):
        with open("config.yaml") as f:
            return yaml.safe_load(f)

    def test_config_has_agent_section(self, config):
        assert "agent" in config
        assert "name" in config["agent"]
        assert "version" in config["agent"]

    def test_config_has_llm_section(self, config):
        assert "llm" in config
        assert "provider" in config["llm"]
        assert "model" in config["llm"]

    def test_config_has_device_section(self, config):
        assert "device" in config
        assert "adb_device" in config["device"]

    def test_config_has_all_roles(self, config):
        assert "roles" in config
        for role in ["manager", "executor", "reflector", "notetaker"]:
            assert role in config["roles"], f"Missing role: {role}"
            assert "instruction" in config["roles"][role]
            assert "capabilities" in config["roles"][role]

    def test_config_has_gui_actions(self, config):
        assert "gui_actions" in config
        required = {"tap", "swipe", "type", "long_press", "back", "home", "stop"}
        assert required.issubset(set(config["gui_actions"]))


class TestRoles:
    """Test agent role definitions."""

    def test_create_agent_team(self):
        from agents.roles import create_agent_team

        config = {
            "roles": {
                "manager": {"instruction": "test", "capabilities": ["plan"]},
                "executor": {"instruction": "test", "capabilities": ["tap"]},
                "reflector": {"instruction": "test", "capabilities": ["analyze"]},
                "notetaker": {"instruction": "test", "capabilities": ["note"]},
            }
        }
        team = create_agent_team(config)
        assert len(team) == 4
        assert "manager" in team
        assert "executor" in team

    def test_workflow_steps_defined(self):
        from agents.roles import WORKFLOW_STEPS

        assert len(WORKFLOW_STEPS) > 0
        for step in WORKFLOW_STEPS:
            assert "agent" in step
            assert "task" in step


class TestActions:
    """Test custom actions."""

    def test_get_custom_actions(self):
        from actions.custom_actions import get_custom_actions

        actions = get_custom_actions()
        assert isinstance(actions, dict)

    def test_builtin_actions_listed(self):
        from actions.custom_actions import BUILTIN_ACTIONS

        assert "tap" in BUILTIN_ACTIONS
        assert "swipe" in BUILTIN_ACTIONS
        assert "type" in BUILTIN_ACTIONS


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
`;
  }
}
