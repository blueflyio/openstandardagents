const TokenEstimator = require('../../validators/token-estimator');

class TokenEstimatorService {
  constructor() {
    this.estimator = new TokenEstimator();
  }

  async estimateTokens(specification, options = {}) {
    try {
      // Reset estimator state
      this.estimator.estimates = [];

      // Default options
      const {
        model = 'gpt-4-turbo',
        requestsPerDay = 1000,
        compressionRatio = 0.7
      } = options;

      // Analyze the specification
      this.estimator.analyzeSpecification(specification);
      this.estimator.analyzeOperations(specification);
      this.estimator.analyzeAgentMetadata(specification);
      
      // Generate cost projections
      this.estimator.generateCostProjections({ model, requestsPerDay, compressionRatio });
      
      // Generate optimization recommendations
      this.estimator.generateOptimizationRecommendations();

      // Calculate totals
      const totalTokens = this.estimator.estimates.reduce((sum, est) => sum + est.tokens, 0);
      const compressedTokens = Math.floor(totalTokens * compressionRatio);

      // Group estimates by category for breakdown
      const tokenBreakdown = {};
      this.estimator.estimates.forEach(estimate => {
        if (!tokenBreakdown[estimate.category]) {
          tokenBreakdown[estimate.category] = {
            total_tokens: 0,
            operations: []
          };
        }
        
        tokenBreakdown[estimate.category].total_tokens += estimate.tokens;
        tokenBreakdown[estimate.category].operations.push({
          operation: estimate.operation,
          tokens: estimate.tokens,
          description: estimate.description,
          user_estimate: estimate.userEstimate || null
        });
      });

      // Format cost projections
      const costProjections = this.estimator.costProjections || {};

      // Format optimizations
      const optimizations = this.estimator.optimizations.map(opt => ({
        type: opt.type,
        recommendation: opt.recommendation,
        potential_savings: opt.potentialSavings,
        affected_operations: opt.operations?.length || opt.count || null,
        details: opt.operations ? opt.operations.slice(0, 3) : null
      }));

      return {
        totalTokens,
        compressedTokens,
        model: costProjections.model || model,
        dailyCost: costProjections.dailyTotal || 0,
        monthlyCost: costProjections.monthlyTotal || 0,
        annualCost: costProjections.annualTotal || 0,
        annualSavings: costProjections.annualSavings || 0,
        savingsPercentage: costProjections.savingsPercentage || 0,
        tokenBreakdown,
        optimizations
      };

    } catch (error) {
      throw new Error(`Token estimation failed: ${error.message}`);
    }
  }
}

module.exports = TokenEstimatorService;