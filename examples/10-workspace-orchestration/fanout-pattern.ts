/**
 * Fanout/Fan-in Orchestration Pattern Example
 * One agent distributes work to multiple agents, then aggregates results
 */

import { OAASService } from '@bluefly/oaas';

const oaasService = new OAASService({
  projectRoot: process.cwd(),
  runtimeTranslation: true,
  cacheEnabled: true
});

/**
 * Fanout Pattern: Distributed Research
 * Coordinator distributes research topics to specialist agents
 */
export async function fanoutResearchPattern(researchTopic: string) {
  console.log('📢 Starting Fanout Research Pattern');
  console.log(`📚 Research Topic: "${researchTopic}"`);
  
  // Step 1: Coordinator breaks down the research topic
  console.log('\n🎯 Step 1: Topic Analysis by Coordinator');
  const coordinator = await oaasService.executeCapability(
    'research-coordinator',
    'analyze_topic',
    {
      topic: researchTopic,
      breakdown_strategy: 'comprehensive',
      max_subtopics: 6
    }
  );
  
  const subtopics = coordinator.subtopics;
  console.log(`✅ Topic broken into ${subtopics.length} subtopics:`);
  subtopics.forEach((st, i) => console.log(`  ${i + 1}. ${st.title}`));
  
  // Step 2: Fan out to specialist researchers
  console.log('\n📤 Step 2: Fanning out to specialists');
  const researchTasks = subtopics.map(async (subtopic) => {
    // Select appropriate specialist based on subtopic category
    const specialistMap = {
      'technical': 'technical-researcher',
      'business': 'business-analyst',
      'legal': 'legal-researcher',
      'scientific': 'science-researcher',
      'historical': 'history-researcher',
      'general': 'general-researcher'
    };
    
    const specialist = specialistMap[subtopic.category] || 'general-researcher';
    console.log(`  🔄 Assigning "${subtopic.title}" to ${specialist}`);
    
    try {
      const research = await oaasService.executeCapability(
        specialist,
        'deep_research',
        {
          topic: subtopic.title,
          context: subtopic.context,
          depth: 'comprehensive',
          sources_required: 5,
          include_citations: true
        }
      );
      
      return {
        subtopic: subtopic.title,
        specialist,
        status: 'success',
        findings: research.findings,
        citations: research.citations,
        confidence: research.confidence_score
      };
    } catch (error) {
      console.log(`  ⚠️ ${specialist} failed for "${subtopic.title}"`);
      return {
        subtopic: subtopic.title,
        specialist,
        status: 'failed',
        error: error.message
      };
    }
  });
  
  // Wait for all research to complete
  const researchResults = await Promise.all(researchTasks);
  
  // Step 3: Fan in - Aggregate results
  console.log('\n📥 Step 3: Aggregating research results');
  const successfulResearch = researchResults.filter(r => r.status === 'success');
  
  const aggregatedReport = await oaasService.executeCapability(
    'research-coordinator',
    'synthesize_research',
    {
      original_topic: researchTopic,
      research_results: successfulResearch,
      synthesis_strategy: 'comprehensive',
      output_format: 'structured_report',
      include_executive_summary: true,
      include_recommendations: true
    }
  );
  
  return {
    pattern: 'fanout_research',
    topic: researchTopic,
    subtopics_researched: researchResults.length,
    successful_researches: successfulResearch.length,
    failed_researches: researchResults.filter(r => r.status === 'failed').length,
    total_citations: successfulResearch.reduce((sum, r) => sum + r.citations.length, 0),
    average_confidence: (successfulResearch.reduce((sum, r) => sum + r.confidence, 0) / successfulResearch.length).toFixed(2),
    final_report: aggregatedReport,
    detailed_results: researchResults
  };
}

/**
 * Fanout Pattern: Map-Reduce Style Processing
 * Distribute data processing, then reduce results
 */
export async function fanoutMapReduce(data: any[], mapFunction: string, reduceFunction: string) {
  console.log('📢 Starting Fanout Map-Reduce Pattern');
  
  // Step 1: Partition data
  const partitionSize = Math.ceil(data.length / 4); // Use 4 workers
  const partitions = [];
  for (let i = 0; i < data.length; i += partitionSize) {
    partitions.push({
      id: Math.floor(i / partitionSize),
      data: data.slice(i, i + partitionSize)
    });
  }
  
  console.log(`📊 Data partitioned into ${partitions.length} chunks`);
  
  // Step 2: Fan out - Map phase
  console.log('\n🗺️ Map Phase: Processing partitions in parallel');
  const mapResults = await Promise.all(
    partitions.map(async (partition) => {
      const workerId = `mapper-${partition.id}`;
      console.log(`  🔄 ${workerId} processing ${partition.data.length} items`);
      
      return await oaasService.executeCapability(
        workerId,
        'map_operation',
        {
          data: partition.data,
          map_function: mapFunction,
          partition_id: partition.id
        }
      );
    })
  );
  
  // Step 3: Shuffle phase (group by key)
  console.log('\n🔀 Shuffle Phase: Grouping mapped results');
  const shuffled = {};
  mapResults.forEach(result => {
    result.mapped_data.forEach(item => {
      if (!shuffled[item.key]) {
        shuffled[item.key] = [];
      }
      shuffled[item.key].push(item.value);
    });
  });
  
  // Step 4: Fan in - Reduce phase
  console.log('\n📥 Reduce Phase: Aggregating results');
  const reducePromises = Object.entries(shuffled).map(async ([key, values]) => {
    return await oaasService.executeCapability(
      'reducer',
      'reduce_operation',
      {
        key,
        values,
        reduce_function: reduceFunction
      }
    );
  });
  
  const reducedResults = await Promise.all(reducePromises);
  
  // Final aggregation
  const finalResult = reducedResults.reduce((acc, result) => {
    acc[result.key] = result.reduced_value;
    return acc;
  }, {});
  
  return {
    pattern: 'fanout_mapreduce',
    input_size: data.length,
    partitions: partitions.length,
    unique_keys: Object.keys(finalResult).length,
    result: finalResult
  };
}

/**
 * Fanout Pattern: Broadcast with Consensus
 * Send same task to multiple agents, aggregate responses
 */
export async function fanoutConsensusPattern(question: string) {
  console.log('📢 Starting Fanout Consensus Pattern');
  console.log(`❓ Question: "${question}"`);
  
  // Define expert panel
  const experts = [
    { id: 'expert-1', specialty: 'technical', weight: 1.2 },
    { id: 'expert-2', specialty: 'practical', weight: 1.0 },
    { id: 'expert-3', specialty: 'theoretical', weight: 1.1 },
    { id: 'expert-4', specialty: 'historical', weight: 0.9 },
    { id: 'expert-5', specialty: 'innovative', weight: 1.3 }
  ];
  
  // Fan out to all experts
  console.log(`\n👥 Consulting ${experts.length} experts`);
  const expertOpinions = await Promise.all(
    experts.map(async (expert) => {
      console.log(`  🎤 Asking ${expert.id} (${expert.specialty})`);
      
      try {
        const opinion = await oaasService.executeCapability(
          expert.id,
          'provide_expert_opinion',
          {
            question,
            perspective: expert.specialty,
            detail_level: 'comprehensive',
            include_confidence: true,
            include_reasoning: true
          }
        );
        
        return {
          expert: expert.id,
          specialty: expert.specialty,
          weight: expert.weight,
          opinion: opinion.answer,
          confidence: opinion.confidence,
          reasoning: opinion.reasoning,
          status: 'success'
        };
      } catch (error) {
        return {
          expert: expert.id,
          specialty: expert.specialty,
          weight: expert.weight,
          status: 'failed',
          error: error.message
        };
      }
    })
  );
  
  // Filter successful opinions
  const validOpinions = expertOpinions.filter(o => o.status === 'success');
  
  // Calculate consensus
  console.log('\n🤝 Building Consensus');
  const consensus = await oaasService.executeCapability(
    'consensus-builder',
    'build_consensus',
    {
      opinions: validOpinions,
      consensus_strategy: 'weighted_confidence',
      include_dissent: true,
      include_synthesis: true
    }
  );
  
  return {
    pattern: 'fanout_consensus',
    question,
    experts_consulted: experts.length,
    valid_opinions: validOpinions.length,
    consensus: {
      answer: consensus.final_answer,
      confidence: consensus.consensus_confidence,
      agreement_level: consensus.agreement_score,
      dissenting_views: consensus.dissenting_points,
      synthesis: consensus.synthesized_explanation
    },
    expert_opinions: expertOpinions
  };
}

// Example usage
if (require.main === module) {
  (async () => {
    try {
      // Example 1: Research Fanout
      const research = await fanoutResearchPattern(
        'The impact of quantum computing on cybersecurity'
      );
      console.log('\n📋 Research Result:', JSON.stringify(research, null, 2));
      
      // Example 2: Map-Reduce
      const data = Array.from({ length: 100 }, (_, i) => ({
        category: ['A', 'B', 'C'][i % 3],
        value: Math.floor(Math.random() * 100)
      }));
      const mapReduce = await fanoutMapReduce(
        data,
        'item => ({ key: item.category, value: item.value })',
        '(key, values) => values.reduce((a, b) => a + b, 0)'
      );
      console.log('\n📋 Map-Reduce Result:', JSON.stringify(mapReduce, null, 2));
      
      // Example 3: Expert Consensus
      const consensus = await fanoutConsensusPattern(
        'What is the best programming paradigm for AI development?'
      );
      console.log('\n📋 Consensus Result:', JSON.stringify(consensus, null, 2));
      
    } catch (error) {
      console.error('Fanout pattern failed:', error);
    }
  })();
}