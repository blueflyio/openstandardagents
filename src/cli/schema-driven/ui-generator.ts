/**
 * UI Generator - Schema-Driven Inquirer Prompt Generation
 * Automatically generates inquirer prompts from JSON Schema definitions
 * TRUE API-FIRST APPROACH
 */

import inquirer, {
  QuestionCollection,
  Question,
  ListQuestion,
  CheckboxQuestion,
} from 'inquirer';
import chalk from 'chalk';
import { SchemaLoader, SchemaDefinition, EnumOption } from './schema-loader.js';

export interface UIGeneratorOptions {
  includeOptional?: boolean;
  showDescriptions?: boolean;
  groupByCategory?: boolean;
  allowSkip?: boolean;
}

export class UIGenerator {
  private schema: SchemaLoader;
  private options: UIGeneratorOptions;

  constructor(schemaLoader: SchemaLoader, options: UIGeneratorOptions = {}) {
    this.schema = schemaLoader;
    this.options = {
      includeOptional: true,
      showDescriptions: true,
      groupByCategory: false,
      allowSkip: true,
      ...options,
    };
  }

  /**
   * Generate inquirer prompt from schema path
   * Example: generatePrompt('spec.llm.provider')
   */
  generatePrompt(path: string, name?: string): Question | null {
    const definition = this.schema.getDefinition(path);
    if (!definition) {
      return null;
    }

    const fieldName = name || path.split('.').pop() || path;
    const isRequired = this.schema.isRequired(path);
    const description = this.schema.getDescription(path);
    const defaultValue = this.schema.getDefault(path);
    const examples = this.schema.getExamples(path);

    // Generate appropriate prompt based on type
    if (definition.enum) {
      return this.generateEnumPrompt(
        fieldName,
        path,
        definition,
        isRequired,
        description,
        defaultValue
      );
    }

    switch (definition.type) {
      case 'string':
        return this.generateStringPrompt(
          fieldName,
          path,
          definition,
          isRequired,
          description,
          defaultValue,
          examples
        );

      case 'number':
      case 'integer':
        return this.generateNumberPrompt(
          fieldName,
          path,
          definition,
          isRequired,
          description,
          defaultValue
        );

      case 'boolean':
        return this.generateBooleanPrompt(
          fieldName,
          definition,
          isRequired,
          description,
          defaultValue
        );

      case 'array':
        return this.generateArrayPrompt(
          fieldName,
          definition,
          isRequired,
          description
        );

      case 'object':
        // For objects, we typically handle them recursively
        return null;

      default:
        return null;
    }
  }

  /**
   * Generate enum selection prompt (list or checkbox)
   */
  private generateEnumPrompt(
    name: string,
    path: string,
    definition: SchemaDefinition,
    isRequired: boolean,
    description?: string,
    defaultValue?: any
  ): ListQuestion {
    const enumOptions = this.schema.getEnumOptions(path);

    const message = this.formatMessage(name, description, isRequired);

    const choices = enumOptions.map((option) => ({
      name: option.description
        ? `${option.value} ${chalk.gray(`- ${option.description}`)}`
        : option.value,
      value: option.value,
      short: option.value,
    }));

    return {
      type: 'list',
      name,
      message,
      choices,
      default: defaultValue,
      validate: isRequired ? this.requiredValidator : undefined,
    };
  }

  /**
   * Generate string input prompt
   */
  private generateStringPrompt(
    name: string,
    path: string,
    definition: SchemaDefinition,
    isRequired: boolean,
    description?: string,
    defaultValue?: any,
    examples?: any[]
  ): Question {
    const message = this.formatMessage(name, description, isRequired, examples);
    const pattern = this.schema.getPattern(path);

    return {
      type: 'input',
      name,
      message,
      default: defaultValue,
      validate: (input: string) => {
        // Required check
        if (isRequired && !input.trim()) {
          return 'This field is required';
        }

        // Pattern validation
        if (pattern && input && !pattern.test(input)) {
          return `Must match pattern: ${pattern.source}`;
        }

        return true;
      },
    };
  }

  /**
   * Generate number input prompt
   */
  private generateNumberPrompt(
    name: string,
    path: string,
    definition: SchemaDefinition,
    isRequired: boolean,
    description?: string,
    defaultValue?: any
  ): Question {
    const message = this.formatMessage(name, description, isRequired);
    const { minimum, maximum } = this.schema.getNumericConstraints(path);

    return {
      type: 'number',
      name,
      message,
      default: defaultValue,
      validate: (input: number) => {
        // Required check
        if (isRequired && (input === null || input === undefined)) {
          return 'This field is required';
        }

        // Range validation
        if (minimum !== undefined && input < minimum) {
          return `Must be at least ${minimum}`;
        }

        if (maximum !== undefined && input > maximum) {
          return `Must be at most ${maximum}`;
        }

        return true;
      },
    };
  }

  /**
   * Generate boolean confirmation prompt
   */
  private generateBooleanPrompt(
    name: string,
    definition: SchemaDefinition,
    isRequired: boolean,
    description?: string,
    defaultValue?: any
  ): Question {
    const message = this.formatMessage(name, description, isRequired);

    return {
      type: 'confirm',
      name,
      message,
      default: defaultValue !== undefined ? defaultValue : false,
    };
  }

  /**
   * Generate array/multi-select prompt
   */
  private generateArrayPrompt(
    name: string,
    definition: SchemaDefinition,
    isRequired: boolean,
    description?: string
  ): Question | CheckboxQuestion {
    const message = this.formatMessage(name, description, isRequired);

    // If array items have enum, use checkbox
    if (definition.items?.enum) {
      const choices = definition.items.enum.map((value: string) => ({
        name: value,
        value,
        checked: false,
      }));

      return {
        type: 'checkbox',
        name,
        message,
        choices,
        validate: isRequired
          ? (input: any[]) => {
              return input.length > 0 || 'Select at least one option';
            }
          : undefined,
      } as CheckboxQuestion;
    }

    // Otherwise, use input for comma-separated values
    return {
      type: 'input',
      name,
      message: `${message} (comma-separated)`,
      filter: (input: string) => {
        return input
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      },
      validate: isRequired
        ? (input: string) => {
            return input.trim().length > 0 || 'This field is required';
          }
        : undefined,
    };
  }

  /**
   * Format message with description and requirements
   */
  private formatMessage(
    name: string,
    description?: string,
    isRequired?: boolean,
    examples?: any[]
  ): string {
    let message = chalk.blue(this.formatFieldName(name));

    if (isRequired) {
      message += chalk.red(' *');
    }

    if (this.options.showDescriptions && description) {
      message += `\n  ${chalk.gray(description)}`;
    }

    if (examples && examples.length > 0) {
      message += `\n  ${chalk.gray('Example:')} ${chalk.white(examples[0])}`;
    }

    return message;
  }

  /**
   * Format field name to human-readable
   */
  private formatFieldName(name: string): string {
    return name
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Required field validator
   */
  private requiredValidator(input: any): boolean | string {
    if (input === null || input === undefined || input === '') {
      return 'This field is required';
    }
    return true;
  }

  /**
   * Generate prompts for all fields in a schema path
   * Example: generateForObject('spec.llm')
   */
  async generateForObject(
    path: string,
    values: Record<string, any> = {}
  ): Promise<Record<string, any>> {
    const definition = this.schema.getDefinition(path);
    if (!definition?.properties) {
      return {};
    }

    const prompts: Question[] = [];
    const requiredFields = this.schema.getRequiredFields(path);

    // Generate prompts for each property
    for (const [propName, propDef] of Object.entries(definition.properties)) {
      const propPath = `${path}.${propName}`;
      const isRequired = requiredFields.includes(propName);

      // Skip optional fields if configured
      if (!isRequired && !this.options.includeOptional) {
        continue;
      }

      const prompt = this.generatePrompt(propPath, propName);
      if (prompt) {
        prompts.push(prompt);
      }
    }

    // Run prompts
    if (prompts.length === 0) {
      return {};
    }

    return inquirer.prompt(prompts);
  }

  /**
   * Generate LLM configuration prompts (common use case)
   */
  async generateLLMConfig(): Promise<any> {
    // Provider selection
    const providers = this.schema.getLLMProviders();
    const { provider } = await inquirer.prompt([
      {
        type: 'list',
        name: 'provider',
        message: chalk.blue('Select LLM Provider:'),
        choices: providers.map((p) => ({
          name: p.description
            ? `${p.value} ${chalk.gray(`- ${p.description}`)}`
            : p.value,
          value: p.value,
        })),
      },
    ]);

    // Model and temperature
    const llmConfig = await this.generateForObject('spec.llm', { provider });

    return { provider, ...llmConfig };
  }

  /**
   * Generate tool configuration prompts
   */
  async generateToolConfig(): Promise<any[]> {
    const tools: any[] = [];
    let addingTools = true;

    while (addingTools) {
      const toolTypes = this.schema.getToolTypes();

      const { toolType } = await inquirer.prompt([
        {
          type: 'list',
          name: 'toolType',
          message: 'Select tool type:',
          choices: [
            ...toolTypes.map((t) => ({
              name: t.description
                ? `${t.value} ${chalk.gray(`- ${t.description}`)}`
                : t.value,
              value: t.value,
            })),
            { name: chalk.gray('Done adding tools'), value: 'done' },
          ],
        },
      ]);

      if (toolType === 'done') {
        addingTools = false;
        continue;
      }

      // Generate tool-specific prompts based on type
      const toolConfig = await this.generateForObject(`spec.tools`, {
        type: toolType,
      });
      tools.push({ type: toolType, ...toolConfig });

      console.log(chalk.green('✓'), `Added ${toolType} tool`);
    }

    return tools;
  }

  /**
   * Generate extension configuration prompts
   */
  async generateExtensionConfig(extensionType: string): Promise<any> {
    const extensionPath = `extensions.${extensionType}`;
    return this.generateForObject(extensionPath);
  }

  /**
   * Validate generated config against schema
   */
  validate(manifest: any): { valid: boolean; errors?: any[] } {
    return this.schema.validate(manifest);
  }

  /**
   * Get all available extension types
   */
  getAvailableExtensions(): string[] {
    return this.schema.getExtensionTypes();
  }
}

/**
 * Create UIGenerator with schema loader
 */
export function createUIGenerator(
  schemaPath?: string,
  options?: UIGeneratorOptions
): UIGenerator {
  const schemaLoader = new SchemaLoader(schemaPath);
  return new UIGenerator(schemaLoader, options);
}
