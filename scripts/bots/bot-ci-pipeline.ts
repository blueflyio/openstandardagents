#!/usr/bin/env node
/**
 * Bot: CI Pipeline Agent
 * Analyzes and optimizes CI/CD pipeline configuration
 */

const GITLAB_TOKEN = process.env.GITLAB_TOKEN || '';
const GITLAB_URL = process.env.GITLAB_URL || 'https://gitlab.com/api/v4';
const PROJECT_ID = process.env.CI_PROJECT_ID || process.env.GITLAB_PROJECT_ID || '';
const PIPELINE_ID = process.env.CI_PIPELINE_ID || '';

interface PipelineAnalysis {
  totalJobs: number;
  parallelizableJobs: number;
  cacheOpportunities: number;
  optimizationSuggestions: string[];
}

async function getPipelineJobs(): Promise<any[]> {
  const response = await fetch(`${GITLAB_URL}/projects/${PROJECT_ID}/pipelines/${PIPELINE_ID}/jobs`, {
    headers: {
      'Authorization': `Bearer ${GITLAB_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch pipeline jobs: ${response.statusText}`);
  }

  return await response.json();
}

function analyzePipeline(jobs: any[]): PipelineAnalysis {
  const analysis: PipelineAnalysis = {
    totalJobs: jobs.length,
    parallelizableJobs: 0,
    cacheOpportunities: 0,
    optimizationSuggestions: []
  };

  const stages = new Set(jobs.map(j => j.stage));
  const jobsByStage = new Map<string, any[]>();

  jobs.forEach(job => {
    const stage = job.stage || 'unknown';
    if (!jobsByStage.has(stage)) {
      jobsByStage.set(stage, []);
    }
    jobsByStage.get(stage)?.push(job);
  });

  jobsByStage.forEach((stageJobs, stage) => {
    if (stageJobs.length > 1) {
      analysis.parallelizableJobs += stageJobs.length;
      analysis.optimizationSuggestions.push(
        `${stage} stage has ${stageJobs.length} jobs that could run in parallel`
      );
    }
  });

  jobs.forEach(job => {
    if (!job.cache && (job.name.includes('build') || job.name.includes('test'))) {
      analysis.cacheOpportunities++;
      analysis.optimizationSuggestions.push(
        `Job ${job.name} could benefit from caching`
      );
    }
  });

  return analysis;
}

async function postAnalysis(analysis: PipelineAnalysis): Promise<void> {
  let comment = '## 🔧 CI Pipeline Analysis\n\n';
  comment += `**Total Jobs**: ${analysis.totalJobs}\n`;
  comment += `**Parallelizable**: ${analysis.parallelizableJobs}\n`;
  comment += `**Cache Opportunities**: ${analysis.cacheOpportunities}\n\n`;

  if (analysis.optimizationSuggestions.length > 0) {
    comment += '### 💡 Optimization Suggestions\n\n';
    analysis.optimizationSuggestions.forEach(suggestion => {
      comment += `- ${suggestion}\n`;
    });
  } else {
    comment += '✅ Pipeline is well optimized';
  }

  await fetch(`${GITLAB_URL}/projects/${PROJECT_ID}/merge_requests/${MR_IID}/notes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GITLAB_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ body: comment })
  });
}

async function analyzePipeline(): Promise<void> {
  if (!GITLAB_TOKEN || !PROJECT_ID || !PIPELINE_ID) {
    throw new Error('GITLAB_TOKEN, PROJECT_ID, and PIPELINE_ID are required');
  }

  console.log(`Analyzing pipeline ${PIPELINE_ID}...`);

  const jobs = await getPipelineJobs();
  const analysis = analyzePipeline(jobs);

  await postAnalysis(analysis);

  console.log(`\n✅ Pipeline analysis complete:`);
  console.log(`  Total jobs: ${analysis.totalJobs}`);
  console.log(`  Parallelizable: ${analysis.parallelizableJobs}`);
  console.log(`  Cache opportunities: ${analysis.cacheOpportunities}`);
}

if (require.main === module) {
  analyzePipeline().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { analyzePipeline };
