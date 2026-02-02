// @ts-nocheck
/**
 * Wizard Engine
 *
 * Orchestrates the wizard flow with:
 * - Step execution and navigation
 * - Context management (shared state)
 * - Progress tracking
 * - Save/resume capability
 * - Undo/redo support
 *
 * SOLID: Single Responsibility - Wizard orchestration only
 * DRY: Reusable across different wizards
 */

import type {
  WizardStep,
  WizardContext,
  WizardResult,
  WizardOptions,
} from '../types.js';
import { WizardUI } from '../ui/wizard-ui.js';

export class WizardEngine {
  private steps: WizardStep[];
  private context: WizardContext;
  private currentStepIndex: number = 0;
  private ui: WizardUI;
  private history: WizardContext[] = [];

  constructor(steps: WizardStep[], options?: WizardOptions) {
    this.steps = steps;
    this.context = {
      data: {},
      metadata: {
        startedAt: new Date(),
        template: options?.template,
        mode: options?.mode || 'standard',
      },
    };
    this.ui = new WizardUI(options);
  }

  /**
   * Run the wizard from start to finish
   */
  async run(): Promise<WizardResult> {
    try {
      // Show welcome screen
      this.ui.showWelcome(this.steps.length);

      // Execute each step
      while (this.currentStepIndex < this.steps.length) {
        const step = this.steps[this.currentStepIndex];

        // Show progress
        this.ui.showProgress(this.currentStepIndex + 1, this.steps.length);

        // Execute step
        const stepResult = await this.executeStep(step);

        // Handle step result
        if (stepResult.action === 'next') {
          this.saveHistory();
          this.currentStepIndex++;
        } else if (stepResult.action === 'back') {
          this.currentStepIndex = Math.max(0, this.currentStepIndex - 1);
          this.restoreHistory();
        } else if (stepResult.action === 'skip') {
          this.currentStepIndex++;
        } else if (stepResult.action === 'save') {
          await this.saveProgress();
          this.ui.showInfo('Progress saved. Resume with: ossa wizard --resume');
          return {
            success: false,
            saved: true,
            context: this.context,
          };
        } else if (stepResult.action === 'exit') {
          this.ui.showWarning('Wizard cancelled');
          return {
            success: false,
            cancelled: true,
            context: this.context,
          };
        }
      }

      // Show completion
      this.ui.showCompletion();

      return {
        success: true,
        context: this.context,
        completedAt: new Date(),
      };
    } catch (error) {
      this.ui.showError(error instanceof Error ? error.message : String(error));
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        context: this.context,
      };
    }
  }

  /**
   * Execute a single wizard step
   */
  private async executeStep(step: WizardStep): Promise<StepResult> {
    // Show step header
    this.ui.showStepHeader(
      this.currentStepIndex + 1,
      this.steps.length,
      step.title,
      step.description
    );

    // Show examples if available
    if (step.examples && step.examples.length > 0) {
      this.ui.showExamples(step.examples);
    }

    // Show help if available
    if (step.help) {
      this.ui.showHelp(step.help);
    }

    // Get suggestions from step
    const suggestions = await step.suggest(this.context);
    if (suggestions && suggestions.length > 0) {
      this.ui.showSuggestions(suggestions);
    }

    // Execute step
    const result = await step.execute(this.context.state);

    // Validate result if validator exists
    if (step.validate) {
      const validation = await step.validate(result);
      if (!validation) {
        // Retry the step
        return this.executeStep(step);
      }
    }

    // Update context
    this.context.state = result;

    return {
      action: 'next' as const,
      value: result,
    };
  }

  /**
   * Save history for undo
   */
  private saveHistory(): void {
    this.history.push({
      ...this.context,
      data: { ...this.context.data },
    });

    // Keep last 10 states only
    if (this.history.length > 10) {
      this.history.shift();
    }
  }

  /**
   * Restore previous state
   */
  private restoreHistory(): void {
    const previous = this.history.pop();
    if (previous) {
      this.context = previous;
    }
  }

  /**
   * Save progress to disk
   */
  private async saveProgress(): Promise<void> {
    const fs = await import('fs');
    const path = await import('path');
    const os = await import('os');

    const saveDir = path.join(os.homedir(), '.ossa', 'wizard-progress');
    await fs.promises.mkdir(saveDir, { recursive: true });

    const saveFile = path.join(saveDir, `wizard-${Date.now()}.json`);
    await fs.promises.writeFile(
      saveFile,
      JSON.stringify(
        {
          currentStepIndex: this.currentStepIndex,
          context: this.context,
          savedAt: new Date().toISOString(),
        },
        null,
        2
      )
    );
  }

  /**
   * Resume from saved progress
   */
  static async resume(
    saveFile: string,
    steps: WizardStep[]
  ): Promise<WizardEngine> {
    const fs = await import('fs');
    const data = JSON.parse(await fs.promises.readFile(saveFile, 'utf-8'));

    const engine = new WizardEngine(steps);
    engine.currentStepIndex = data.currentStepIndex;
    engine.context = data.context;

    return engine;
  }
}

/**
 * Step execution result
 */
interface StepResult {
  action: 'next' | 'back' | 'skip' | 'save' | 'exit';
  value?: unknown;
}
