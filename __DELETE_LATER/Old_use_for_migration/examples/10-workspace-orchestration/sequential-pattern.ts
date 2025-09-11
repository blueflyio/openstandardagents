/**
 * Sequential Orchestration Pattern Example
 * Demonstrates agents working in sequence, passing results from one to the next
 */

import { OAASService } from '@bluefly/oaas';

// Initialize OAAS with project configuration
const oaasService = new OAASService({
  projectRoot: process.cwd(),
  runtimeTranslation: true,
  cacheEnabled: true,
  validationStrict: false
});

/**
 * Sequential Pattern: Document Processing Pipeline
 * 1. Analyzer Agent - Analyzes document structure
 * 2. Extractor Agent - Extracts key information
 * 3. Validator Agent - Validates extracted data
 * 4. Reporter Agent - Generates final report
 */
export async function sequentialDocumentProcessing(documentPath: string) {
  console.log('🔄 Starting Sequential Document Processing Pipeline');
  
  // Step 1: Discover available agents
  const agents = await oaasService.discoverAgents();
  console.log(`📦 Discovered ${agents.length} agents`);
  
  // Step 2: Document Analysis
  console.log('\n📄 Step 1: Document Analysis');
  const analysisResult = await oaasService.executeCapability(
    'document-analyzer',
    'analyze_structure',
    { document: documentPath }
  );
  console.log('✅ Document structure analyzed:', analysisResult.structure);
  
  // Step 3: Information Extraction (uses analysis result)
  console.log('\n🔍 Step 2: Information Extraction');
  const extractionResult = await oaasService.executeCapability(
    'info-extractor',
    'extract_entities',
    { 
      document: documentPath,
      structure: analysisResult.structure,
      focus_areas: ['names', 'dates', 'amounts', 'organizations']
    }
  );
  console.log('✅ Entities extracted:', extractionResult.entities.length);
  
  // Step 4: Data Validation (uses extraction result)
  console.log('\n✓ Step 3: Data Validation');
  const validationResult = await oaasService.executeCapability(
    'data-validator',
    'validate_entities',
    {
      entities: extractionResult.entities,
      rules: {
        dates: 'ISO8601',
        amounts: 'currency',
        names: 'proper_noun'
      }
    }
  );
  console.log('✅ Validation complete:', validationResult.valid_count, 'of', validationResult.total_count, 'valid');
  
  // Step 5: Report Generation (uses all previous results)
  console.log('\n📊 Step 4: Report Generation');
  const reportResult = await oaasService.executeCapability(
    'report-generator',
    'generate_report',
    {
      analysis: analysisResult,
      extraction: extractionResult,
      validation: validationResult,
      format: 'markdown',
      include_summary: true
    }
  );
  console.log('✅ Report generated:', reportResult.report_path);
  
  return {
    pipeline: 'sequential_document_processing',
    stages_completed: 4,
    final_report: reportResult.report_path,
    metrics: {
      total_time_ms: reportResult.timestamp - analysisResult.timestamp,
      entities_found: extractionResult.entities.length,
      validation_rate: validationResult.valid_count / validationResult.total_count
    }
  };
}

/**
 * Sequential Pattern with Error Handling
 * Shows how to handle failures in the pipeline
 */
export async function sequentialWithErrorHandling(input: any) {
  const pipeline = [
    { agent: 'preprocessor', capability: 'clean_data' },
    { agent: 'analyzer', capability: 'analyze' },
    { agent: 'transformer', capability: 'transform' },
    { agent: 'validator', capability: 'validate' }
  ];
  
  let currentData = input;
  const results = [];
  
  for (const stage of pipeline) {
    try {
      console.log(`🔄 Executing ${stage.agent}.${stage.capability}`);
      currentData = await oaasService.executeCapability(
        stage.agent,
        stage.capability,
        currentData
      );
      results.push({
        stage: `${stage.agent}.${stage.capability}`,
        status: 'success',
        output: currentData
      });
    } catch (error) {
      console.error(`❌ Failed at ${stage.agent}.${stage.capability}:`, error);
      
      // Try fallback agent if available
      const fallbackAgent = `${stage.agent}-fallback`;
      try {
        console.log(`🔄 Trying fallback: ${fallbackAgent}`);
        currentData = await oaasService.executeCapability(
          fallbackAgent,
          stage.capability,
          currentData
        );
        results.push({
          stage: `${fallbackAgent}.${stage.capability}`,
          status: 'fallback_success',
          output: currentData
        });
      } catch (fallbackError) {
        results.push({
          stage: `${stage.agent}.${stage.capability}`,
          status: 'failed',
          error: error.message
        });
        break; // Stop pipeline on unrecoverable error
      }
    }
  }
  
  return {
    pipeline: 'sequential_with_error_handling',
    completed_stages: results.filter(r => r.status !== 'failed').length,
    total_stages: pipeline.length,
    results
  };
}

// Example usage
if (require.main === module) {
  (async () => {
    try {
      // Example 1: Document Processing
      const docResult = await sequentialDocumentProcessing('./sample-document.pdf');
      console.log('\n📋 Pipeline Result:', JSON.stringify(docResult, null, 2));
      
      // Example 2: With Error Handling
      const errorHandlingResult = await sequentialWithErrorHandling({
        data: 'sample input',
        options: { strict: true }
      });
      console.log('\n📋 Error Handling Result:', JSON.stringify(errorHandlingResult, null, 2));
      
    } catch (error) {
      console.error('Pipeline failed:', error);
    }
  })();
}