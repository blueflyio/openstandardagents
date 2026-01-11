/**
 * Framework CLI Commands
 * 
 * Framework detection and setup commands.
 * SOLID: Single Responsibility - Framework integration only
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { existsSync, readFileSync } from 'fs';
import { glob } from 'glob';

export const frameworkCommand = new Command('framework')
  .alias('fw')
  .description('Framework detection and setup commands');

// framework:detect - Auto-detect frameworks in project
frameworkCommand
  .command('detect')
  .description('Auto-detect frameworks in current project')
  .action(async () => {
    console.log(chalk.blue('🔍 Detecting Frameworks'));
    console.log(chalk.gray('=======================\n'));

    const detected: string[] = [];

    // Check for Langflow
    const langflowFiles = await glob('**/langflow*.{json,yaml,yml}', { ignore: ['node_modules/**'] });
    if (langflowFiles.length > 0) {
      detected.push('langflow');
      console.log(chalk.green('✅ Langflow detected:'));
      langflowFiles.slice(0, 5).forEach(file => console.log(chalk.gray(`   ${file}`)));
    }

    // Check for LangChain
    const langchainFiles = await glob('**/*langchain*.{py,json,yaml,yml}', { ignore: ['node_modules/**'] });
    const hasLangchainImport = langchainFiles.some(file => {
      try {
        const content = readFileSync(file, 'utf-8');
        return content.includes('from langchain') || content.includes('import langchain');
      } catch {
        return false;
      }
    });
    if (hasLangchainImport || langchainFiles.length > 0) {
      detected.push('langchain');
      console.log(chalk.green('\n✅ LangChain detected:'));
      langchainFiles.slice(0, 5).forEach(file => console.log(chalk.gray(`   ${file}`)));
    }

    // Check for CrewAI
    const crewaiFiles = await glob('**/*crewai*.{py,json,yaml,yml}', { ignore: ['node_modules/**'] });
    const hasCrewaiImport = crewaiFiles.some(file => {
      try {
        const content = readFileSync(file, 'utf-8');
        return content.includes('from crewai') || content.includes('import crewai');
      } catch {
        return false;
      }
    });
    if (hasCrewaiImport || crewaiFiles.length > 0) {
      detected.push('crewai');
      console.log(chalk.green('\n✅ CrewAI detected:'));
      crewaiFiles.slice(0, 5).forEach(file => console.log(chalk.gray(`   ${file}`)));
    }

    // Check for requirements.txt / pyproject.toml
    if (existsSync('requirements.txt')) {
      const requirements = readFileSync('requirements.txt', 'utf-8');
      if (requirements.includes('langchain') && !detected.includes('langchain')) {
        detected.push('langchain');
        console.log(chalk.green('\n✅ LangChain detected (in requirements.txt)'));
      }
      if (requirements.includes('crewai') && !detected.includes('crewai')) {
        detected.push('crewai');
        console.log(chalk.green('\n✅ CrewAI detected (in requirements.txt)'));
      }
    }

    if (detected.length === 0) {
      console.log(chalk.yellow('\n⚠️  No frameworks detected'));
      console.log(chalk.gray('Run "ossa framework:setup <framework>" to set up OSSA integration'));
    } else {
      console.log(chalk.cyan(`\n📋 Detected frameworks: ${detected.join(', ')}`));
      console.log(chalk.gray('\nNext steps:'));
      detected.forEach(fw => {
        console.log(chalk.gray(`   ossa ${fw}:convert <file> - Convert to OSSA`));
        console.log(chalk.gray(`   ossa framework:setup ${fw} - Set up integration`));
      });
    }
  });

// framework:setup - One-command integration setup
frameworkCommand
  .command('setup')
  .description('Set up OSSA integration for a framework')
  .argument('<framework>', 'Framework name (langflow, langchain, crewai)')
  .option('--example', 'Create example OSSA agent', false)
  .action(async (framework: string, options: { example: boolean }) => {
    console.log(chalk.blue(`🔧 Setting up OSSA integration for ${framework}`));
    console.log(chalk.gray('==============================================\n'));

    const validFrameworks = ['langflow', 'langchain', 'crewai'];
    if (!validFrameworks.includes(framework.toLowerCase())) {
      console.error(chalk.red(`❌ Invalid framework: ${framework}`));
      console.error(chalk.gray(`Valid frameworks: ${validFrameworks.join(', ')}`));
      process.exit(1);
    }

    try {
      // Create example OSSA agent
      if (options.example) {
        const exampleManifest = await generateExampleManifest(framework);
        const { dump } = await import('yaml');
        const outputPath = `examples/${framework}-example.ossa.yaml`;
        const { writeFileSync, mkdirSync } = await import('fs');
        mkdirSync('examples', { recursive: true });
        writeFileSync(outputPath, dump(exampleManifest));

        console.log(chalk.green(`\n✅ Created example: ${outputPath}`));
      }

      // Create integration guide
      console.log(chalk.cyan(`\n📚 Integration Guide for ${framework}:`));
      console.log(chalk.gray(`\n1. Convert existing ${framework} agent:`));
      console.log(chalk.gray(`   ossa ${framework}:convert <file>`));
      console.log(chalk.gray(`\n2. Execute OSSA agent via ${framework}:`));
      console.log(chalk.gray(`   ossa ${framework}:execute agent.ossa.yaml`));
      console.log(chalk.gray(`\n3. Export OSSA to ${framework} format:`));
      console.log(chalk.gray(`   ossa ${framework}:export agent.ossa.yaml`));

      console.log(chalk.green('\n✅ Setup complete!'));
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

async function generateExampleManifest(framework: string) {
  const baseManifest = {
    apiVersion: 'ossa/v0.3.3',
    kind: 'Agent',
    metadata: {
      name: `${framework}-example-agent`,
      version: '1.0.0',
      description: `Example OSSA agent for ${framework} integration`,
      labels: {
        framework: framework,
        example: 'true',
      },
    },
    spec: {
      role: 'You are a helpful AI assistant.',
      llm: {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
      },
    },
  };

  // Add framework-specific extensions
  if (framework === 'langflow') {
    (baseManifest as any).extensions = {
      langflow: {
        flow_id: 'example-flow-id',
        api_endpoint: {
          base_url: 'http://localhost:7860',
          auth_method: 'api_key',
        },
      },
    };
  } else if (framework === 'langchain') {
    (baseManifest as any).extensions = {
      langchain: {
        agent_type: 'zero-shot-react-description',
      },
    };
  } else if (framework === 'crewai') {
    (baseManifest as any).extensions = {
      crewai: {
        agent_type: 'custom',
      },
    };
  }

  return baseManifest;
}
