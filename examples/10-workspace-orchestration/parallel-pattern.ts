/**
 * Parallel Orchestration Pattern Example
 * Demonstrates multiple agents working simultaneously on different aspects
 */

import { OAASService } from '@bluefly/oaas';

const oaasService = new OAASService({
  projectRoot: process.cwd(),
  runtimeTranslation: true,
  cacheEnabled: true
});

/**
 * Parallel Pattern: Multi-Aspect Code Analysis
 * Multiple agents analyze different aspects of code simultaneously
 */
export async function parallelCodeAnalysis(codebasePath: string) {
  console.log('🚀 Starting Parallel Code Analysis');
  
  // Define parallel analysis tasks
  const analysisTasks = [
    {
      agent: 'security-analyzer',
      capability: 'scan_vulnerabilities',
      input: { path: codebasePath, deep_scan: true }
    },
    {
      agent: 'performance-analyzer',
      capability: 'analyze_performance',
      input: { path: codebasePath, metrics: ['complexity', 'memory', 'runtime'] }
    },
    {
      agent: 'code-quality-analyzer',
      capability: 'assess_quality',
      input: { path: codebasePath, standards: ['eslint', 'prettier', 'sonar'] }
    },
    {
      agent: 'dependency-analyzer',
      capability: 'check_dependencies',
      input: { path: codebasePath, check_vulnerabilities: true, check_licenses: true }
    },
    {
      agent: 'documentation-analyzer',
      capability: 'analyze_docs',
      input: { path: codebasePath, check_coverage: true, check_quality: true }
    }
  ];
  
  console.log(`📊 Launching ${analysisTasks.length} parallel analyses`);
  const startTime = Date.now();
  
  // Execute all analyses in parallel
  const analysisPromises = analysisTasks.map(async (task) => {
    const taskStart = Date.now();
    console.log(`  🔄 Starting ${task.agent}`);
    
    try {
      const result = await oaasService.executeCapability(
        task.agent,
        task.capability,
        task.input
      );
      
      const duration = Date.now() - taskStart;
      console.log(`  ✅ ${task.agent} completed in ${duration}ms`);
      
      return {
        agent: task.agent,
        capability: task.capability,
        status: 'success',
        duration,
        result
      };
    } catch (error) {
      console.log(`  ❌ ${task.agent} failed: ${error.message}`);
      return {
        agent: task.agent,
        capability: task.capability,
        status: 'failed',
        error: error.message
      };
    }
  });
  
  // Wait for all parallel tasks to complete
  const results = await Promise.allSettled(analysisPromises);
  const totalDuration = Date.now() - startTime;
  
  // Process and aggregate results
  const successfulResults = results
    .filter(r => r.status === 'fulfilled' && r.value.status === 'success')
    .map(r => r.value);
    
  const failedResults = results
    .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.status === 'failed'))
    .map(r => r.status === 'rejected' ? { error: r.reason } : r.value);
  
  // Aggregate findings
  const aggregatedFindings = {
    security: successfulResults.find(r => r.agent === 'security-analyzer')?.result || null,
    performance: successfulResults.find(r => r.agent === 'performance-analyzer')?.result || null,
    quality: successfulResults.find(r => r.agent === 'code-quality-analyzer')?.result || null,
    dependencies: successfulResults.find(r => r.agent === 'dependency-analyzer')?.result || null,
    documentation: successfulResults.find(r => r.agent === 'documentation-analyzer')?.result || null
  };
  
  return {
    pattern: 'parallel_code_analysis',
    total_duration_ms: totalDuration,
    parallel_speedup: calculateSpeedup(results, totalDuration),
    successful_analyses: successfulResults.length,
    failed_analyses: failedResults.length,
    findings: aggregatedFindings,
    detailed_results: results
  };
}

/**
 * Parallel Pattern with Aggregation
 * Multiple agents work on subsets of data, results are merged
 */
export async function parallelDataProcessing(dataset: any[], chunkSize: number = 100) {
  console.log('🚀 Starting Parallel Data Processing');
  
  // Split dataset into chunks
  const chunks = [];
  for (let i = 0; i < dataset.length; i += chunkSize) {
    chunks.push(dataset.slice(i, i + chunkSize));
  }
  
  console.log(`📊 Processing ${chunks.length} chunks in parallel`);
  
  // Process each chunk with a different agent instance
  const processingTasks = chunks.map(async (chunk, index) => {
    const agentId = `data-processor-${index % 3}`; // Round-robin across 3 agents
    
    return await oaasService.executeCapability(
      agentId,
      'process_data',
      {
        data: chunk,
        chunk_index: index,
        processing_options: {
          normalize: true,
          validate: true,
          enrich: true
        }
      }
    );
  });
  
  // Wait for all chunks to be processed
  const processedChunks = await Promise.all(processingTasks);
  
  // Aggregate results
  const aggregatedResult = {
    total_records: processedChunks.reduce((sum, chunk) => sum + chunk.processed_count, 0),
    total_errors: processedChunks.reduce((sum, chunk) => sum + chunk.error_count, 0),
    processing_time_ms: Math.max(...processedChunks.map(c => c.duration_ms)),
    chunks_processed: processedChunks.length,
    data: processedChunks.flatMap(c => c.processed_data)
  };
  
  return aggregatedResult;
}

/**
 * Parallel Pattern with Race Condition
 * First successful result wins
 */
export async function parallelRacePattern(query: string) {
  console.log('🏁 Starting Parallel Race Pattern');
  
  // Multiple agents race to provide the best answer
  const competingAgents = [
    { id: 'fast-responder', capability: 'quick_answer', timeout: 1000 },
    { id: 'accurate-responder', capability: 'detailed_answer', timeout: 3000 },
    { id: 'comprehensive-responder', capability: 'full_analysis', timeout: 5000 }
  ];
  
  const racePromises = competingAgents.map(agent => 
    Promise.race([
      oaasService.executeCapability(agent.id, agent.capability, { query }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`${agent.id} timeout`)), agent.timeout)
      )
    ]).then(result => ({ agent: agent.id, result }))
    .catch(error => ({ agent: agent.id, error: error.message }))
  );
  
  // First valid response wins
  const firstResponse = await Promise.race(
    racePromises.filter(p => p.then(r => !r.error))
  );
  
  // But still wait for all to complete for comparison
  const allResponses = await Promise.allSettled(racePromises);
  
  return {
    pattern: 'parallel_race',
    winner: firstResponse.agent,
    winning_response: firstResponse.result,
    all_responses: allResponses.map(r => r.status === 'fulfilled' ? r.value : r.reason)
  };
}

// Helper function to calculate parallel speedup
function calculateSpeedup(results: any[], totalDuration: number): number {
  const sequentialTime = results
    .filter(r => r.status === 'fulfilled')
    .reduce((sum, r) => sum + (r.value.duration || 0), 0);
  
  return sequentialTime > 0 ? (sequentialTime / totalDuration).toFixed(2) : 1;
}

// Example usage
if (require.main === module) {
  (async () => {
    try {
      // Example 1: Parallel Code Analysis
      const codeAnalysis = await parallelCodeAnalysis('./src');
      console.log('\n📋 Code Analysis Result:', JSON.stringify(codeAnalysis, null, 2));
      
      // Example 2: Parallel Data Processing
      const sampleData = Array.from({ length: 1000 }, (_, i) => ({ id: i, value: Math.random() }));
      const dataResult = await parallelDataProcessing(sampleData, 250);
      console.log('\n📋 Data Processing Result:', JSON.stringify(dataResult, null, 2));
      
      // Example 3: Race Pattern
      const raceResult = await parallelRacePattern('What is the weather today?');
      console.log('\n📋 Race Result:', JSON.stringify(raceResult, null, 2));
      
    } catch (error) {
      console.error('Parallel execution failed:', error);
    }
  })();
}