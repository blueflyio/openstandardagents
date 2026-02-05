/**
 * Enhanced Interactive Wizard for OSSA Agent Creation
 * Provides guided agent creation with use-case detection and template selection
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import { logger } from '../../utils/logger.js';
import type { OssaAgent } from '../../types/index.js';
import { getApiVersion } from '../../utils/version.js';
import { USE_CASES, getRecommendedConfig } from './use-cases.js';
import { TEMPLATE_CATALOG } from './template-catalog.js';

export interface WizardOptions {
  skipUseCase?: boolean;
  skipTemplate?: boolean;
  useDefaults?: boolean;
}

export interface WizardResult {
  manifest: OssaAgent;
  template?: string;
  useCase?: string;
}

export class InteractiveWizard {
  async run(options: WizardOptions = {}): Promise<WizardResult> {
    logger.info({ action: 'wizard-start' }, 'OSSA Interactive Wizard - Create a production-ready agent manifest');

    // Step 1: Use case detection
    let useCase: string | undefined;
    let template: string | undefined;

    if (!options.skipUseCase && !options.useDefaults) {
      useCase = await this.selectUseCase();
    }

    // Step 2: Template selection (if use case has templates)
    if (useCase && !options.skipTemplate && !options.useDefaults) {
      const useCaseTemplates = USE_CASES.find((uc) => uc.id === useCase)?.templates || [];
      if (useCaseTemplates.length > 0) {
        template = await this.selectTemplate(useCaseTemplates);
      }
    }

    // Step 3: Basic information
    const basics = await this.collectBasicInfo(options.useDefaults);

    // Step 4: LLM configuration
    const llmConfig = await this.configureLLM(useCase, options.useDefaults);

    // Step 5: Platform selection
    const platforms = await this.selectPlatforms(options.useDefaults);

    // Build manifest
    const manifest = this.buildManifest(basics, llmConfig, platforms);

    return {
      manifest,
      template,
      useCase,
    };
  }

  private async selectUseCase(): Promise<string> {
    const { category } = await inquirer.prompt([
      {
        type: 'list',
        name: 'category',
        message: 'What type of agent are you building?',
        choices: [
          { name: '🤖 Development - Code review, IDE assistance', value: 'development' },
          { name: '💬 Assistant - Customer support, chat', value: 'assistant' },
          { name: '⚙️  Automation - Workflows, task orchestration', value: 'automation' },
          { name: '🔌 Integration - CMS, external systems', value: 'integration' },
          { name: '📊 Analysis - Research, data processing', value: 'analysis' },
        ],
      },
    ]);

    const categoryUseCases = USE_CASES.filter((uc) => uc.category === category);
    const { useCaseId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'useCaseId',
        message: 'Select your specific use case:',
        choices: categoryUseCases.map((uc) => ({
          name: `${uc.name} - ${uc.description}`,
          value: uc.id,
        })),
      },
    ]);

    const useCase = USE_CASES.find((uc) => uc.id === useCaseId)!;
    logger.info({ useCase: useCase.name }, 'Use case selected');

    return useCaseId;
  }

  private async selectTemplate(templateIds: string[]): Promise<string | undefined> {
    if (templateIds.length === 0) return undefined;

    const templates = TEMPLATE_CATALOG.filter((t) => templateIds.includes(t.id));

    const { useTemplate } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'useTemplate',
        message: 'Would you like to start from a template?',
        default: true,
      },
    ]);

    if (!useTemplate) return undefined;

    const { templateId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'templateId',
        message: 'Select a template:',
        choices: templates.map((t) => ({
          name: `${t.name} (${t.platform}) - ${t.description}`,
          value: t.id,
        })),
      },
    ]);

    const templatePath = templates.find((t) => t.id === templateId)?.path;
    logger.info(
      { template: templateId, path: templatePath },
      'Template selected'
    );

    return templateId;
  }

  private async collectBasicInfo(useDefaults?: boolean): Promise<{
    name: string;
    displayName: string;
    description: string;
    version: string;
  }> {
    if (useDefaults) {
      return {
        name: 'my-agent',
        displayName: 'My Agent',
        description: 'OSSA-compliant agent',
        version: '1.0.0',
      };
    }

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Agent ID (DNS-1123 format):',
        default: 'my-agent',
        validate: (input) => {
          if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(input)) {
            return 'Must be lowercase alphanumeric with hyphens (DNS-1123)';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'displayName',
        message: 'Display name:',
        default: (answers: { name: string }) => answers.name,
      },
      {
        type: 'input',
        name: 'description',
        message: 'Description:',
        default: 'OSSA-compliant agent',
      },
      {
        type: 'input',
        name: 'version',
        message: 'Version:',
        default: '1.0.0',
      },
    ]);

    return answers;
  }

  private async configureLLM(useCase?: string, useDefaults?: boolean): Promise<{
    provider: string;
    model: string;
    temperature: number;
  }> {
    const recommended = useCase ? getRecommendedConfig(useCase) : null;

    if (useDefaults) {
      return {
        provider: recommended?.provider || 'openai',
        model: recommended?.model || 'gpt-4o',
        temperature: 0.7,
      };
    }

    const { provider } = await inquirer.prompt([
      {
        type: 'list',
        name: 'provider',
        message: 'Select LLM provider:',
        default: recommended?.provider || 'openai',
        choices: [
          { name: 'OpenAI (GPT-4, GPT-4o)', value: 'openai' },
          { name: 'Anthropic (Claude)', value: 'anthropic' },
          { name: 'Google (Gemini)', value: 'google' },
          { name: 'AWS Bedrock', value: 'aws-bedrock' },
          { name: 'Azure OpenAI', value: 'azure' },
        ],
      },
    ]);

    const modelChoices = this.getModelChoices(provider);
    const defaultModel =
      recommended?.provider === provider ? recommended?.model : modelChoices[0].value;

    const { model, temperature } = await inquirer.prompt([
      {
        type: 'list',
        name: 'model',
        message: `Select ${provider} model:`,
        default: defaultModel,
        choices: modelChoices,
      },
      {
        type: 'number',
        name: 'temperature',
        message: 'Temperature (0.0 - 1.0):',
        default: 0.7,
        validate: (input) => {
          if (input < 0 || input > 1) return 'Must be between 0 and 1';
          return true;
        },
      },
    ]);

    return { provider, model, temperature };
  }

  private getModelChoices(provider: string): Array<{ name: string; value: string }> {
    const models: Record<string, Array<{ name: string; value: string }>> = {
      openai: [
        { name: 'GPT-4o (Recommended)', value: 'gpt-4o' },
        { name: 'GPT-4o Mini (Cost-optimized)', value: 'gpt-4o-mini' },
        { name: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
        { name: 'GPT-4', value: 'gpt-4' },
        { name: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
      ],
      anthropic: [
        { name: 'Claude Sonnet 4 (Recommended)', value: 'claude-sonnet-4' },
        { name: 'Claude Opus 4 (Most capable)', value: 'claude-opus-4' },
        { name: 'Claude Haiku 4 (Fast)', value: 'claude-haiku-4' },
      ],
      google: [
        { name: 'Gemini 1.5 Flash (Recommended)', value: 'gemini-1.5-flash' },
        { name: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
        { name: 'Gemini Pro', value: 'gemini-pro' },
      ],
      'aws-bedrock': [
        { name: 'Claude 3 Sonnet (Bedrock)', value: 'bedrock-claude-3-sonnet' },
        { name: 'Claude 3 Opus (Bedrock)', value: 'bedrock-claude-3-opus' },
      ],
      azure: [
        { name: 'GPT-4 Turbo (Azure)', value: 'azure-gpt-4-turbo' },
        { name: 'GPT-4 (Azure)', value: 'azure-gpt-4' },
      ],
    };

    return models[provider] || [];
  }

  private async selectPlatforms(useDefaults?: boolean): Promise<string[]> {
    if (useDefaults) return ['openai'];

    const { platforms } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'platforms',
        message: 'Select target platforms (optional):',
        choices: [
          { name: 'Cursor (IDE integration)', value: 'cursor' },
          { name: 'OpenAI Assistants', value: 'openai' },
          { name: 'CrewAI (Multi-agent)', value: 'crewai' },
          { name: 'LangChain', value: 'langchain' },
          { name: 'LangFlow', value: 'langflow' },
          { name: 'Anthropic Claude', value: 'anthropic' },
        ],
      },
    ]);

    return platforms;
  }

  private buildManifest(
    basics: { name: string; displayName: string; description: string; version: string },
    llm: { provider: string; model: string; temperature: number },
    platforms: string[]
  ): OssaAgent {
    const manifest: OssaAgent = {
      apiVersion: getApiVersion(),
      kind: 'Agent',
      metadata: {
        name: basics.name,
        version: basics.version,
        description: basics.description,
      },
      spec: {
        role: `You are ${basics.displayName}. ${basics.description}`,
        llm: {
          provider: llm.provider,
          model: llm.model,
          temperature: llm.temperature,
        },
        tools: [],
      },
    };

    // Add platform extensions
    if (platforms.length > 0) {
      manifest.extensions = {};
      for (const platform of platforms) {
        switch (platform) {
          case 'cursor':
            manifest.extensions.cursor = {
              enabled: true,
              agent_type: 'composer',
            };
            break;
          case 'openai':
            manifest.extensions.openai_agents = { enabled: true };
            break;
          case 'crewai':
            manifest.extensions.crewai = {
              enabled: true,
              agent_type: 'worker',
            };
            break;
          case 'langchain':
            manifest.extensions.langchain = { enabled: true };
            break;
          case 'langflow':
            manifest.extensions.langflow = { enabled: true };
            break;
          case 'anthropic':
            manifest.extensions.anthropic = { enabled: true };
            break;
        }
      }
    }

    return manifest;
  }
}
