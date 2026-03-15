/**
 * Browser Test Runner — Run agent acceptance tests in headless Chrome.
 *
 * Uses agent-browser CLI for CDP-based browser automation.
 * Replaces custom Playwright bootstrapping for agent testing.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface BrowserTestResult {
  passed: boolean;
  output: string;
  error?: string;
  duration: number;
}

export class BrowserTestRunner {
  /**
   * Run a browser-based test using agent-browser.
   */
  async run(url: string, options: {
    timeout?: number;
    headless?: boolean;
    screenshotOnError?: boolean;
  } = {}): Promise<BrowserTestResult> {
    const startTime = Date.now();
    const args = [
      'agent-browser',
      `--url=${url}`,
      `--headless=${options.headless !== false}`,
      `--timeout=${options.timeout || 30000}`,
    ];
    if (options.screenshotOnError) {
      args.push('--screenshot-on-error');
    }

    try {
      const result = await execFileAsync('npx', args, {
        timeout: (options.timeout || 30000) + 5000,
      });
      return {
        passed: true,
        output: result.stdout,
        duration: Date.now() - startTime,
      };
    } catch (error: unknown) {
      const err = error as { stdout?: string; stderr?: string; message?: string };
      return {
        passed: false,
        output: err.stdout || '',
        error: err.stderr || err.message || 'Unknown error',
        duration: Date.now() - startTime,
      };
    }
  }
}
