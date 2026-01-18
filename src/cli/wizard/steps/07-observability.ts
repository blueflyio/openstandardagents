/**
 * Step 7: Observability & Monitoring
 * Configure tracing, metrics, and logging
 */

import inquirer from 'inquirer';
import { WizardState } from '../types.js';
import { console_ui } from '../ui/console.js';

export async function configureObservabilityStep(
  state: WizardState
): Promise<WizardState> {
  console_ui.step(7, state.totalSteps, 'Observability & Monitoring');

  const { enableObservability } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'enableObservability',
      message: 'Enable observability (tracing, metrics, logging)?',
      default: true,
    },
  ]);

  if (!enableObservability) return state;

  const observability: any = {};

  // Tracing
  const { enableTracing } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'enableTracing',
      message: 'Enable distributed tracing (OpenTelemetry)?',
      default: true,
    },
  ]);

  if (enableTracing) {
    const tracingAnswers = await inquirer.prompt([
      {
        type: 'list',
        name: 'exporter',
        message: 'Tracing exporter:',
        choices: [
          { name: 'OTLP (OpenTelemetry Protocol)', value: 'otlp' },
          { name: 'Jaeger', value: 'jaeger' },
          { name: 'Zipkin', value: 'zipkin' },
        ],
        default: 'otlp',
      },
      {
        type: 'input',
        name: 'endpoint',
        message: 'Tracing endpoint:',
        default: '${OTEL_ENDPOINT:-http://localhost:4317}',
      },
      {
        type: 'number',
        name: 'sampleRate',
        message: 'Sample rate (0.0-1.0):',
        default: 1.0,
        validate: (input: number) =>
          (input >= 0 && input <= 1) || 'Must be between 0.0 and 1.0',
      },
    ]);

    observability.tracing = {
      enabled: true,
      exporter: tracingAnswers.exporter,
      endpoint: tracingAnswers.endpoint,
      sample_rate: tracingAnswers.sampleRate,
    };
  }

  // Metrics
  const { enableMetrics } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'enableMetrics',
      message: 'Enable metrics collection?',
      default: true,
    },
  ]);

  if (enableMetrics) {
    const metricsAnswers = await inquirer.prompt([
      {
        type: 'list',
        name: 'exporter',
        message: 'Metrics exporter:',
        choices: [
          { name: 'Prometheus', value: 'prometheus' },
          { name: 'OTLP', value: 'otlp' },
        ],
        default: 'prometheus',
      },
      {
        type: 'input',
        name: 'endpoint',
        message: 'Metrics endpoint:',
        default: '${METRICS_ENDPOINT:-http://localhost:9090}',
      },
    ]);

    observability.metrics = {
      enabled: true,
      exporter: metricsAnswers.exporter,
      endpoint: metricsAnswers.endpoint,
      custom_labels: {
        service: state.agent.metadata?.name || 'agent',
        environment: '${ENVIRONMENT:-production}',
      },
    };
  }

  // Logging
  const { enableLogging } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'enableLogging',
      message: 'Enable structured logging?',
      default: true,
    },
  ]);

  if (enableLogging) {
    const loggingAnswers = await inquirer.prompt([
      {
        type: 'list',
        name: 'level',
        message: 'Log level:',
        choices: ['debug', 'info', 'warn', 'error'],
        default: 'info',
      },
      {
        type: 'confirm',
        name: 'includePrompts',
        message: 'Include prompts in logs?',
        default: false,
      },
      {
        type: 'confirm',
        name: 'includeResponses',
        message: 'Include responses in logs?',
        default: false,
      },
    ]);

    observability.logging = {
      level: loggingAnswers.level,
      include_prompts: loggingAnswers.includePrompts,
      include_responses: loggingAnswers.includeResponses,
    };
  }

  if (Object.keys(observability).length > 0) {
    if (!state.agent.spec) state.agent.spec = { role: '' };
    state.agent.spec = {
      ...state.agent.spec,
      observability,
    };
    console_ui.success('Observability configured');
  }

  return state;
}
