#!/usr/bin/env node

/**
 * Professionalize Content - AI-Powered Emoji Removal and Content Rewriting
 * 
 * This script uses AI to:
 * 1. Detect emojis in commit messages, MR descriptions, issue descriptions
 * 2. Remove emojis and replace with professional language
 * 3. Ensure content maintains professional tone
 * 
 * Usage:
 *   npm run professionalize-content -- <file> [--dry-run]
 *   CI: Runs automatically on commits/MRs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import Anthropic from '@anthropic-ai/sdk';

interface ProfessionalizeOptions {
  retryCount?: number;
  maxRetries?: number;
  dryRun?: boolean;
  inputFile?: string;
  outputFile?: string;
  apiKey?: string;
}

const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FAFF}]/gu;

async function professionalizeContent(
  content: string,
  options: ProfessionalizeOptions = {}
): Promise<string> {
  // Check if content has emojis
  const hasEmojis = EMOJI_REGEX.test(content);
  
  if (!hasEmojis) {
    console.log(' No emojis detected, content is already professional');
    return content;
  }

  const apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY or CLAUDE_API_KEY environment variable is required');
  }

  const anthropic = new Anthropic({ apiKey });

  const prompt = `You are a professional technical writer. Your task is to remove all emojis from the following content and replace them with professional, clear language that maintains the same meaning and tone (but professional).

Rules:
1. Remove ALL emojis completely
2. Replace emoji meaning with professional text (e.g., "🎉" → "Successfully", "✅" → "Completed", "❌" → "Failed", "🚀" → "Deployed")
3. Maintain the technical accuracy and meaning
4. Keep the tone professional but not overly formal
5. Do NOT add new emojis
6. Do NOT use casual language like "cool", "awesome", "nice"
7. Use professional alternatives: "effective", "successful", "implemented", "resolved"
8. Preserve code blocks, technical terms, and structure
9. Keep it concise and clear

Content to professionalize:
${content}

Return ONLY the professionalized content, no explanations or markdown formatting.`;

  try {
    const message = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      temperature: 0.2,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const professionalized = message.content[0].type === 'text' 
      ? message.content[0].text.trim()
      : content;

    // Double-check: ensure no emojis remain with retry limit
    const maxRetries = options.maxRetries || 3;
    const retryCount = (options.retryCount || 0) + 1;
    
    if (EMOJI_REGEX.test(professionalized)) {
      if (retryCount < maxRetries) {
        console.warn(`Warning: Some emojis may still remain. Running retry ${retryCount}/${maxRetries}...`);
        return await professionalizeContent(professionalized, { ...options, retryCount });
      } else {
        console.warn('Max retries reached, some emojis may remain. Using fallback removal.');
        return professionalized.replace(EMOJI_REGEX, '').trim();
      }
    }

    return professionalized;
  } catch (error) {
    console.error('Error professionalizing content:', error);
    // Fallback: simple emoji removal without AI
    return content.replace(EMOJI_REGEX, '').trim();
  }
}

async function processFile(filePath: string, options: ProfessionalizeOptions): Promise<void> {
  if (!existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const originalContent = readFileSync(filePath, 'utf-8');
  const hasEmojis = EMOJI_REGEX.test(originalContent);

  if (!hasEmojis) {
    console.log(` ${filePath}: No emojis detected`);
    return;
  }

  console.log(`Processing ${filePath}...`);
  const emojiCount = (originalContent.match(EMOJI_REGEX) || []).length;
  console.log(`  Found ${emojiCount} emoji(s)`);

  const professionalized = await professionalizeContent(originalContent, options);

  if (options.dryRun) {
    console.log('\n--- Original ---');
    console.log(originalContent);
    console.log('\n--- Professionalized ---');
    console.log(professionalized);
    console.log('\n[DRY RUN] File not modified');
  } else {
    const outputPath = options.outputFile || filePath;
    writeFileSync(outputPath, professionalized, 'utf-8');
    console.log(` Professionalized content written to ${outputPath}`);
  }
}

async function processCommitMessage(): Promise<void> {
  const commitMsgFile = process.env.GITLAB_CI_COMMIT_MESSAGE_FILE || 
                        process.env.GITLAB_COMMIT_MESSAGE_FILE ||
                        join(process.cwd(), '.git', 'COMMIT_EDITMSG');

  if (!existsSync(commitMsgFile)) {
    console.log('No commit message file found, skipping');
    return;
  }

  await processFile(commitMsgFile, { dryRun: false });
}

async function processMRDescription(mrIid: string): Promise<void> {
  const gitlabToken = process.env.GITLAB_TOKEN || process.env.CI_JOB_TOKEN;
  const projectId = process.env.CI_PROJECT_ID;
  const apiUrl = process.env.CI_API_V4_URL || 'https://gitlab.com/api/v4';

  if (!gitlabToken || !projectId) {
    console.log('GitLab credentials not available, skipping MR description processing');
    return;
  }

  try {
    const response = await fetch(
      `${apiUrl}/projects/${projectId}/merge_requests/${mrIid}`,
      {
        headers: {
          'PRIVATE-TOKEN': gitlabToken,
        },
      }
    );

    if (!response.ok) {
      console.log(`Could not fetch MR ${mrIid}: ${response.statusText}`);
      return;
    }

    const mr = await response.json();
    const originalDescription = mr.description || '';

    if (!EMOJI_REGEX.test(originalDescription)) {
      console.log('MR description has no emojis');
      return;
    }

    console.log('Processing MR description...');
    const professionalized = await professionalizeContent(originalDescription, {
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Update MR description
    const updateResponse = await fetch(
      `${apiUrl}/projects/${projectId}/merge_requests/${mrIid}`,
      {
        method: 'PUT',
        headers: {
          'PRIVATE-TOKEN': gitlabToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: professionalized,
        }),
      }
    );

    if (!updateResponse.ok) {
      console.error(`Failed to update MR description: ${updateResponse.statusText}`);
      return;
    }

    console.log(' MR description professionalized');
  } catch (error) {
    console.error('Error processing MR description:', error);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const inputFileIndex = args.findIndex(arg => !arg.startsWith('--'));
  const inputFile = inputFileIndex >= 0 ? args[inputFileIndex] : undefined;

  const options: ProfessionalizeOptions = {
    dryRun,
    apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY,
  };

  // CI Mode: Process commit message or MR description
  if (process.env.CI) {
    if (process.env.CI_MERGE_REQUEST_IID) {
      await processMRDescription(process.env.CI_MERGE_REQUEST_IID);
    } else {
      await processCommitMessage();
    }
    return;
  }

  // File Mode: Process specific file
  if (inputFile) {
    await processFile(inputFile, options);
  } else {
    console.error('Usage: professionalize-content.ts <file> [--dry-run]');
    console.error('   or set CI=true to process commit messages/MR descriptions');
    process.exit(1);
  }
}

// ES module entry point check
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('professionalize-content.ts')) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { professionalizeContent, processFile };
