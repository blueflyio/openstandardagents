/**
 * OSSA v0.1.8 Compliance Scoring Engine
 * Advanced algorithms for weighted compliance assessment and risk scoring
 */

import {
  ComplianceValidationResult,
  ControlValidationResult,
  ComplianceSummary,
  RiskAssessment,
  SupportedFramework,
  ComplianceFrameworks
} from '../types';

export interface ScoringWeights {
  controlFamily: Record<string, number>;
  controlCriticality: Record<string, number>;
  implementationStatus: {
    compliant: number;
    partiallyCompliant: number;
    nonCompliant: number;
    notApplicable: number;
  };
  evidenceTypes: Record<string, number>;
  riskFactors: {
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
  };
}

export interface ComplianceMetrics {
  overallScore: number;
  weightedScore: number;
  riskScore: number;
  maturityScore: number;
  trendAnalysis: TrendAnalysis;
  benchmarkComparison: BenchmarkComparison;
  controlFamilyScores: Record<string, number>;
  criticalityBasedScore: number;
  implementationMaturity: number;
}

export interface TrendAnalysis {
  trend: 'improving' | 'stable' | 'declining';
  changePercentage: number;
  projectedCompliance: number;
  timeToFullCompliance?: number;
}

export interface BenchmarkComparison {
  industryAverage: number;
  percentile: number;
  peerComparison: 'above_average' | 'average' | 'below_average';
  recommendedTargets: {
    shortTerm: number;
    longTerm: number;
  };
}

export class ComplianceScorer {
  private readonly scoringWeights: Map<SupportedFramework, ScoringWeights>;
  private readonly benchmarkData: Map<SupportedFramework, BenchmarkComparison>;

  constructor() {
    this.scoringWeights = this.initializeScoringWeights();
    this.benchmarkData = this.initializeBenchmarkData();
  }

  /**
   * Calculate comprehensive compliance score with multiple algorithms
   */
  async calculateComplianceScore(
    validationResult: ComplianceValidationResult,
    framework: SupportedFramework,
    previousResults?: ComplianceValidationResult[]
  ): Promise<ComplianceMetrics> {
    const weights = this.scoringWeights.get(framework);
    if (!weights) {
      throw new Error(`Scoring weights not configured for framework: ${framework}`);
    }

    // Core scoring calculations
    const overallScore = this.calculateOverallScore(validationResult.controlResults);
    const weightedScore = this.calculateWeightedScore(validationResult.controlResults, weights);
    const riskScore = this.calculateRiskScore(validationResult.controlResults, weights);
    const maturityScore = this.calculateMaturityScore(validationResult.controlResults);
    
    // Control family analysis
    const controlFamilyScores = this.calculateControlFamilyScores(validationResult.controlResults);
    
    // Criticality-based scoring
    const criticalityBasedScore = this.calculateCriticalityBasedScore(
      validationResult.controlResults, 
      weights
    );
    
    // Implementation maturity assessment
    const implementationMaturity = this.calculateImplementationMaturity(validationResult.controlResults);
    
    // Trend analysis (if historical data available)
    const trendAnalysis = previousResults 
      ? this.calculateTrendAnalysis(validationResult, previousResults)
      : this.getDefaultTrendAnalysis();
    
    // Benchmark comparison
    const benchmarkComparison = this.getBenchmarkComparison(framework, weightedScore);

    return {
      overallScore,
      weightedScore,
      riskScore,
      maturityScore,
      trendAnalysis,
      benchmarkComparison,
      controlFamilyScores,
      criticalityBasedScore,
      implementationMaturity
    };
  }

  /**
   * Calculate basic overall compliance score
   */
  private calculateOverallScore(controlResults: ControlValidationResult[]): number {
    const totalControls = controlResults.length;
    if (totalControls === 0) return 0;

    const scoreSum = controlResults.reduce((sum, control) => sum + control.score, 0);
    return Math.round((scoreSum / totalControls) * 100) / 100;
  }

  /**
   * Calculate weighted compliance score based on control importance
   */
  private calculateWeightedScore(
    controlResults: ControlValidationResult[],
    weights: ScoringWeights
  ): number {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const control of controlResults) {
      const familyWeight = this.getControlFamilyWeight(control.controlId, weights);
      const criticalityWeight = this.getControlCriticalityWeight(control.controlId, weights);
      const statusWeight = this.getStatusWeight(control.status, weights);
      const evidenceWeight = this.getEvidenceWeight(control.evidence, weights);

      const combinedWeight = familyWeight * criticalityWeight * statusWeight * evidenceWeight;
      const weightedScore = control.score * combinedWeight;

      totalWeightedScore += weightedScore;
      totalWeight += combinedWeight;
    }

    return totalWeight > 0 ? Math.round((totalWeightedScore / totalWeight) * 100) / 100 : 0;
  }

  /**
   * Calculate risk score based on non-compliance and control criticality
   */
  private calculateRiskScore(
    controlResults: ControlValidationResult[],
    weights: ScoringWeights
  ): number {
    let riskScore = 0;

    for (const control of controlResults) {
      const criticalityWeight = this.getControlCriticalityWeight(control.controlId, weights);
      const nonComplianceRisk = this.calculateControlRisk(control, criticalityWeight);
      
      riskScore += nonComplianceRisk;
    }

    // Normalize to 0-100 scale
    const maxPossibleRisk = controlResults.length * 100;
    return maxPossibleRisk > 0 ? Math.round((riskScore / maxPossibleRisk) * 100 * 100) / 100 : 0;
  }

  /**
   * Calculate control-specific risk contribution
   */
  private calculateControlRisk(
    control: ControlValidationResult,
    criticalityWeight: number
  ): number {
    let riskContribution = 0;

    // Base risk from non-compliance
    if (control.status === 'non_compliant') {
      riskContribution = 100;
    } else if (control.status === 'partially_compliant') {
      riskContribution = 50 - (control.score / 2); // Adjusted by actual score
    }

    // Amplify risk for critical controls
    riskContribution *= criticalityWeight;

    // Factor in number of findings
    const findingsMultiplier = Math.min(2.0, 1 + (control.findings.length * 0.1));
    riskContribution *= findingsMultiplier;

    return riskContribution;
  }

  /**
   * Calculate implementation maturity score
   */
  private calculateMaturityScore(controlResults: ControlValidationResult[]): number {
    const maturityFactors = {
      documentation: 0,
      automation: 0,
      monitoring: 0,
      testing: 0,
      improvement: 0
    };

    for (const control of controlResults) {
      // Analyze evidence for maturity indicators
      for (const evidence of control.evidence) {
        if (evidence.type === 'documentation') {
          maturityFactors.documentation += 1;
        } else if (evidence.type === 'test_result') {
          maturityFactors.testing += 1;
        } else if (evidence.type === 'audit_trail') {
          maturityFactors.monitoring += 1;
        }
      }

      // Check for automation indicators in recommendations
      if (control.recommendations.some(rec => 
        rec.toLowerCase().includes('automat') || rec.toLowerCase().includes('continuous')
      )) {
        maturityFactors.automation += 1;
      }
    }

    // Calculate weighted maturity score
    const totalControls = controlResults.length;
    const maturityScore = (
      (maturityFactors.documentation / totalControls) * 0.2 +
      (maturityFactors.automation / totalControls) * 0.3 +
      (maturityFactors.monitoring / totalControls) * 0.2 +
      (maturityFactors.testing / totalControls) * 0.2 +
      (maturityFactors.improvement / totalControls) * 0.1
    ) * 100;

    return Math.round(maturityScore * 100) / 100;
  }

  /**
   * Calculate scores by control family
   */
  private calculateControlFamilyScores(
    controlResults: ControlValidationResult[]
  ): Record<string, number> {
    const familyScores: Record<string, { total: number; count: number }> = {};

    for (const control of controlResults) {
      const family = control.controlId.split('-')[0];
      
      if (!familyScores[family]) {
        familyScores[family] = { total: 0, count: 0 };
      }
      
      familyScores[family].total += control.score;
      familyScores[family].count += 1;
    }

    const result: Record<string, number> = {};
    for (const [family, data] of Object.entries(familyScores)) {
      result[family] = Math.round((data.total / data.count) * 100) / 100;
    }

    return result;
  }

  /**
   * Calculate criticality-based score
   */
  private calculateCriticalityBasedScore(
    controlResults: ControlValidationResult[],
    weights: ScoringWeights
  ): number {
    let criticalScore = 0;
    let criticalWeight = 0;

    for (const control of controlResults) {
      const criticality = this.getControlCriticalityWeight(control.controlId, weights);
      if (criticality > 1.5) { // Only consider high-criticality controls
        criticalScore += control.score * criticality;
        criticalWeight += criticality;
      }
    }

    return criticalWeight > 0 ? Math.round((criticalScore / criticalWeight) * 100) / 100 : 0;
  }

  /**
   * Calculate implementation maturity level
   */
  private calculateImplementationMaturity(controlResults: ControlValidationResult[]): number {
    let maturitySum = 0;

    for (const control of controlResults) {
      let controlMaturity = 0;

      // Evidence quality contributes to maturity
      const evidenceTypes = new Set(control.evidence.map(e => e.type));
      controlMaturity += evidenceTypes.size * 10; // Diversity of evidence types

      // Fewer findings indicate better maturity
      controlMaturity += Math.max(0, 30 - (control.findings.length * 5));

      // Higher scores indicate better implementation
      controlMaturity += control.score * 0.6;

      maturitySum += Math.min(100, controlMaturity);
    }

    return controlResults.length > 0 ? 
      Math.round((maturitySum / controlResults.length) * 100) / 100 : 0;
  }

  /**
   * Calculate trend analysis from historical data
   */
  private calculateTrendAnalysis(
    currentResult: ComplianceValidationResult,
    previousResults: ComplianceValidationResult[]
  ): TrendAnalysis {
    if (previousResults.length === 0) {
      return this.getDefaultTrendAnalysis();
    }

    const currentScore = currentResult.overallScore;
    const previousScore = previousResults[previousResults.length - 1].overallScore;
    const changePercentage = ((currentScore - previousScore) / previousScore) * 100;

    let trend: TrendAnalysis['trend'];
    if (Math.abs(changePercentage) < 2) {
      trend = 'stable';
    } else if (changePercentage > 0) {
      trend = 'improving';
    } else {
      trend = 'declining';
    }

    // Project future compliance based on trend
    const projectedCompliance = this.projectFutureCompliance(currentResult, previousResults);
    
    // Estimate time to full compliance
    const timeToFullCompliance = this.estimateTimeToFullCompliance(
      currentScore, 
      changePercentage,
      trend
    );

    return {
      trend,
      changePercentage: Math.round(changePercentage * 100) / 100,
      projectedCompliance,
      timeToFullCompliance
    };
  }

  /**
   * Project future compliance based on historical trends
   */
  private projectFutureCompliance(
    currentResult: ComplianceValidationResult,
    previousResults: ComplianceValidationResult[]
  ): number {
    if (previousResults.length < 2) {
      return currentResult.overallScore;
    }

    // Simple linear projection based on last 3 results
    const recentResults = [...previousResults.slice(-2), currentResult];
    const scores = recentResults.map(r => r.overallScore);
    
    // Calculate average improvement rate
    let totalChange = 0;
    for (let i = 1; i < scores.length; i++) {
      totalChange += scores[i] - scores[i - 1];
    }
    const avgChange = totalChange / (scores.length - 1);
    
    // Project 6 months ahead (assuming monthly assessments)
    const projected = Math.min(100, Math.max(0, currentResult.overallScore + (avgChange * 6)));
    return Math.round(projected * 100) / 100;
  }

  /**
   * Estimate time to achieve full compliance
   */
  private estimateTimeToFullCompliance(
    currentScore: number,
    changePercentage: number,
    trend: TrendAnalysis['trend']
  ): number | undefined {
    if (currentScore >= 95 || trend === 'declining') {
      return undefined;
    }

    if (Math.abs(changePercentage) < 0.1) {
      return undefined; // No meaningful progress
    }

    const remainingPoints = 100 - currentScore;
    const monthlyImprovement = Math.abs(changePercentage);
    
    if (monthlyImprovement > 0) {
      const months = Math.ceil(remainingPoints / monthlyImprovement);
      return Math.min(60, months); // Cap at 5 years
    }

    return undefined;
  }

  /**
   * Get benchmark comparison for framework
   */
  private getBenchmarkComparison(
    framework: SupportedFramework,
    score: number
  ): BenchmarkComparison {
    const benchmark = this.benchmarkData.get(framework);
    if (!benchmark) {
      return this.getDefaultBenchmarkComparison(score);
    }

    // Calculate percentile based on score
    const percentile = this.calculatePercentile(score, benchmark.industryAverage);
    
    let peerComparison: BenchmarkComparison['peerComparison'];
    if (score > benchmark.industryAverage + 10) {
      peerComparison = 'above_average';
    } else if (score < benchmark.industryAverage - 10) {
      peerComparison = 'below_average';
    } else {
      peerComparison = 'average';
    }

    return {
      ...benchmark,
      percentile,
      peerComparison
    };
  }

  /**
   * Calculate percentile ranking
   */
  private calculatePercentile(score: number, industryAverage: number): number {
    // Simplified percentile calculation
    // In reality, this would use actual distribution data
    const normalizedScore = (score / 100) * 100;
    const normalizedAverage = (industryAverage / 100) * 100;
    
    if (normalizedScore >= normalizedAverage) {
      return Math.min(99, 50 + ((normalizedScore - normalizedAverage) / (100 - normalizedAverage)) * 49);
    } else {
      return Math.max(1, 50 - ((normalizedAverage - normalizedScore) / normalizedAverage) * 49);
    }
  }

  /**
   * Helper methods for weight calculations
   */
  private getControlFamilyWeight(controlId: string, weights: ScoringWeights): number {
    const family = controlId.split('-')[0];
    return weights.controlFamily[family] || 1.0;
  }

  private getControlCriticalityWeight(controlId: string, weights: ScoringWeights): number {
    return weights.controlCriticality[controlId] || 1.0;
  }

  private getStatusWeight(
    status: ControlValidationResult['status'],
    weights: ScoringWeights
  ): number {
    switch (status) {
      case 'compliant':
        return weights.implementationStatus.compliant;
      case 'partially_compliant':
        return weights.implementationStatus.partiallyCompliant;
      case 'non_compliant':
        return weights.implementationStatus.nonCompliant;
      case 'not_applicable':
        return weights.implementationStatus.notApplicable;
      default:
        return 1.0;
    }
  }

  private getEvidenceWeight(evidence: any[], weights: ScoringWeights): number {
    if (evidence.length === 0) return 0.5;

    let totalWeight = 0;
    for (const item of evidence) {
      totalWeight += weights.evidenceTypes[item.type] || 1.0;
    }

    return Math.min(1.5, totalWeight / evidence.length);
  }

  /**
   * Initialize scoring weights for different frameworks
   */
  private initializeScoringWeights(): Map<SupportedFramework, ScoringWeights> {
    const weights = new Map<SupportedFramework, ScoringWeights>();

    // FedRAMP scoring weights
    weights.set('FEDRAMP', {
      controlFamily: {
        'AC': 1.5, // Access Control - High importance
        'AU': 1.4, // Audit and Accountability
        'SC': 1.6, // System and Communications Protection - Critical
        'IA': 1.5, // Identification and Authentication
        'CM': 1.2, // Configuration Management
        'SI': 1.4  // System and Information Integrity
      },
      controlCriticality: {
        'AC-3': 2.0, // Access Enforcement - Critical
        'AC-6': 1.8, // Least Privilege
        'AU-2': 1.6, // Audit Events
        'SC-7': 2.0, // Boundary Protection - Critical
        'SC-8': 1.9, // Transmission Confidentiality
        'IA-2': 1.8, // Identification and Authentication
        'SI-4': 1.7  // System Monitoring
      },
      implementationStatus: {
        compliant: 1.0,
        partiallyCompliant: 0.6,
        nonCompliant: 0.1,
        notApplicable: 0.0
      },
      evidenceTypes: {
        'documentation': 1.0,
        'configuration': 1.2,
        'test_result': 1.4,
        'audit_trail': 1.3,
        'log': 1.1
      },
      riskFactors: {
        highRisk: 2.0,
        mediumRisk: 1.5,
        lowRisk: 1.0
      }
    });

    // NIST 800-53 scoring weights (more comprehensive)
    weights.set('NIST_800_53', {
      controlFamily: {
        'AC': 1.6, // Access Control
        'AU': 1.5, // Audit and Accountability  
        'SC': 1.7, // System and Communications Protection
        'IA': 1.6, // Identification and Authentication
        'CM': 1.3, // Configuration Management
        'SI': 1.5, // System and Information Integrity
        'RA': 1.4  // Risk Assessment
      },
      controlCriticality: {
        'AC-3': 2.2, // Access Enforcement - Highest criticality
        'AC-6': 2.0, // Least Privilege
        'AU-2': 1.8, // Audit Events
        'AU-3': 1.6, // Content of Audit Records
        'SC-7': 2.1, // Boundary Protection
        'SC-8': 2.0, // Transmission Confidentiality
        'IA-2': 1.9, // Identification and Authentication
        'SI-4': 1.8, // System Monitoring
        'RA-3': 1.5, // Risk Assessment
        'CM-2': 1.4  // Baseline Configuration
      },
      implementationStatus: {
        compliant: 1.0,
        partiallyCompliant: 0.7,
        nonCompliant: 0.2,
        notApplicable: 0.0
      },
      evidenceTypes: {
        'documentation': 1.0,
        'configuration': 1.3,
        'test_result': 1.5,
        'audit_trail': 1.4,
        'log': 1.2
      },
      riskFactors: {
        highRisk: 2.2,
        mediumRisk: 1.6,
        lowRisk: 1.0
      }
    });

    return weights;
  }

  /**
   * Initialize benchmark data for comparison
   */
  private initializeBenchmarkData(): Map<SupportedFramework, BenchmarkComparison> {
    const benchmarks = new Map<SupportedFramework, BenchmarkComparison>();

    benchmarks.set('FEDRAMP', {
      industryAverage: 78,
      percentile: 50,
      peerComparison: 'average',
      recommendedTargets: {
        shortTerm: 85,
        longTerm: 95
      }
    });

    benchmarks.set('NIST_800_53', {
      industryAverage: 72,
      percentile: 50,
      peerComparison: 'average',
      recommendedTargets: {
        shortTerm: 82,
        longTerm: 92
      }
    });

    return benchmarks;
  }

  /**
   * Default trend analysis when no historical data is available
   */
  private getDefaultTrendAnalysis(): TrendAnalysis {
    return {
      trend: 'stable',
      changePercentage: 0,
      projectedCompliance: 0
    };
  }

  /**
   * Default benchmark comparison
   */
  private getDefaultBenchmarkComparison(score: number): BenchmarkComparison {
    return {
      industryAverage: 75,
      percentile: this.calculatePercentile(score, 75),
      peerComparison: score > 75 ? 'above_average' : 'below_average',
      recommendedTargets: {
        shortTerm: Math.min(100, score + 10),
        longTerm: Math.min(100, score + 25)
      }
    };
  }
}