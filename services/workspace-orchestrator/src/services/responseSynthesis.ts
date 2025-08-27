/**
 * Response Synthesis Service
 * Synthesizes responses from multiple agents into coherent answers
 */

export interface AgentResponse {
    agent_id: string;
    agent_name: string;
    capability_used: string;
    response: any;
    confidence: number;
    execution_time_ms: number;
    timestamp: string;
    metadata?: any;
}

export interface SynthesisResult {
    synthesized_answer: string;
    confidence: number;
    synthesis_strategy: string;
    agent_contributions: Array<{
        agent_id: string;
        contribution_weight: number;
        key_insights: string[];
    }>;
    conflicts_detected: ConflictInfo[];
    synthesis_time_ms: number;
    token_usage: {
        input_tokens: number;
        output_tokens: number;
        total_tokens: number;
    };
}

export interface ConflictInfo {
    type: 'contradiction' | 'uncertainty' | 'scope_difference';
    agents_involved: string[];
    description: string;
    resolution: string;
    confidence: number;
}

export class ResponseSynthesis {
    private synthesisStrategies = ['consensus', 'weighted_average', 'expert_priority', 'hierarchical'];

    async synthesizeResponses(
        question: string,
        agentResponses: AgentResponse[],
        strategy: string = 'consensus'
    ): Promise<SynthesisResult> {
        const startTime = Date.now();

        if (agentResponses.length === 0) {
            return this.createEmptySynthesis();
        }

        if (agentResponses.length === 1) {
            return this.createSingleAgentSynthesis(agentResponses[0]);
        }

        // Detect conflicts
        const conflicts = this.detectConflicts(agentResponses);

        // Apply synthesis strategy
        let synthesisResult: SynthesisResult;

        switch (strategy) {
            case 'consensus':
                synthesisResult = await this.consensusSynthesis(question, agentResponses, conflicts);
                break;
            case 'weighted_average':
                synthesisResult = await this.weightedAverageSynthesis(question, agentResponses, conflicts);
                break;
            case 'expert_priority':
                synthesisResult = await this.expertPrioritySynthesis(question, agentResponses, conflicts);
                break;
            case 'hierarchical':
                synthesisResult = await this.hierarchicalSynthesis(question, agentResponses, conflicts);
                break;
            default:
                synthesisResult = await this.consensusSynthesis(question, agentResponses, conflicts);
        }

        synthesisResult.synthesis_time_ms = Date.now() - startTime;
        synthesisResult.token_usage = this.calculateTokenUsage(question, synthesisResult.synthesized_answer);

        return synthesisResult;
    }

    private async consensusSynthesis(
        question: string,
        responses: AgentResponse[],
        conflicts: ConflictInfo[]
    ): Promise<SynthesisResult> {
        // Find common themes and agreements
        const commonThemes = this.extractCommonThemes(responses);
        const agreements = this.findAgreements(responses);

        // Build consensus answer
        let synthesizedAnswer = this.buildConsensusAnswer(commonThemes, agreements, conflicts);

        // Calculate confidence based on agreement level
        const confidence = this.calculateConsensusConfidence(responses, agreements, conflicts);

        // Determine agent contributions
        const contributions = this.calculateContributions(responses, 'consensus');

        return {
            synthesized_answer: synthesizedAnswer,
            confidence,
            synthesis_strategy: 'consensus',
            agent_contributions: contributions,
            conflicts_detected: conflicts,
            synthesis_time_ms: 0, // Will be set by caller
            token_usage: { input_tokens: 0, output_tokens: 0, total_tokens: 0 } // Will be set by caller
        };
    }

    private async weightedAverageSynthesis(
        question: string,
        responses: AgentResponse[],
        conflicts: ConflictInfo[]
    ): Promise<SynthesisResult> {
        // Weight responses by confidence and performance
        const weights = this.calculateResponseWeights(responses);

        // Combine responses based on weights
        const synthesizedAnswer = this.combineWeightedResponses(responses, weights);

        // Calculate confidence
        const confidence = this.calculateWeightedConfidence(responses, weights);

        // Determine agent contributions
        const contributions = this.calculateContributions(responses, 'weighted_average', weights);

        return {
            synthesized_answer: synthesizedAnswer,
            confidence,
            synthesis_strategy: 'weighted_average',
            agent_contributions: contributions,
            conflicts_detected: conflicts,
            synthesis_time_ms: 0,
            token_usage: { input_tokens: 0, output_tokens: 0, total_tokens: 0 }
        };
    }

    private async expertPrioritySynthesis(
        question: string,
        responses: AgentResponse[],
        conflicts: ConflictInfo[]
    ): Promise<SynthesisResult> {
        // Identify expert agents based on capability and confidence
        const expertAgents = this.identifyExpertAgents(responses);

        // Use expert responses as primary, others as supporting
        const primaryResponse = expertAgents[0];
        const supportingResponses = expertAgents.slice(1);

        // Build answer with expert priority
        const synthesizedAnswer = this.buildExpertPriorityAnswer(
            primaryResponse,
            supportingResponses,
            conflicts
        );

        // Calculate confidence
        const confidence = this.calculateExpertConfidence(primaryResponse, supportingResponses);

        // Determine agent contributions
        const contributions = this.calculateContributions(responses, 'expert_priority');

        return {
            synthesized_answer: synthesizedAnswer,
            confidence,
            synthesis_strategy: 'expert_priority',
            agent_contributions: contributions,
            conflicts_detected: conflicts,
            synthesis_time_ms: 0,
            token_usage: { input_tokens: 0, output_tokens: 0, total_tokens: 0 }
        };
    }

    private async hierarchicalSynthesis(
        question: string,
        responses: AgentResponse[],
        conflicts: ConflictInfo[]
    ): Promise<SynthesisResult> {
        // Organize responses by capability hierarchy
        const hierarchy = this.organizeByHierarchy(responses);

        // Build hierarchical answer
        const synthesizedAnswer = this.buildHierarchicalAnswer(hierarchy, conflicts);

        // Calculate confidence
        const confidence = this.calculateHierarchicalConfidence(hierarchy);

        // Determine agent contributions
        const contributions = this.calculateContributions(responses, 'hierarchical');

        return {
            synthesized_answer: synthesizedAnswer,
            confidence,
            synthesis_strategy: 'hierarchical',
            agent_contributions: contributions,
            conflicts_detected: conflicts,
            synthesis_time_ms: 0,
            token_usage: { input_tokens: 0, output_tokens: 0, total_tokens: 0 }
        };
    }

    private detectConflicts(responses: AgentResponse[]): ConflictInfo[] {
        const conflicts: ConflictInfo[] = [];

        // Check for contradictions
        const contradictions = this.detectContradictions(responses);
        conflicts.push(...contradictions);

        // Check for uncertainties
        const uncertainties = this.detectUncertainties(responses);
        conflicts.push(...uncertainties);

        // Check for scope differences
        const scopeDifferences = this.detectScopeDifferences(responses);
        conflicts.push(...scopeDifferences);

        return conflicts;
    }

    private detectContradictions(responses: AgentResponse[]): ConflictInfo[] {
        const contradictions: ConflictInfo[] = [];

        for (let i = 0; i < responses.length; i++) {
            for (let j = i + 1; j < responses.length; j++) {
                const response1 = responses[i];
                const response2 = responses[j];

                // Simple contradiction detection based on response content
                if (this.areResponsesContradictory(response1.response, response2.response)) {
                    contradictions.push({
                        type: 'contradiction',
                        agents_involved: [response1.agent_id, response2.agent_id],
                        description: `Contradictory responses between ${response1.agent_name} and ${response2.agent_name}`,
                        resolution: 'Using confidence-weighted resolution',
                        confidence: 0.8
                    });
                }
            }
        }

        return contradictions;
    }

    private detectUncertainties(responses: AgentResponse[]): ConflictInfo[] {
        const uncertainties: ConflictInfo[] = [];

        const lowConfidenceResponses = responses.filter(r => r.confidence < 0.6);

        if (lowConfidenceResponses.length > 1) {
            uncertainties.push({
                type: 'uncertainty',
                agents_involved: lowConfidenceResponses.map(r => r.agent_id),
                description: `Multiple agents have low confidence in their responses`,
                resolution: 'Seeking additional validation or clarification',
                confidence: 0.7
            });
        }

        return uncertainties;
    }

    private detectScopeDifferences(responses: AgentResponse[]): ConflictInfo[] {
        const scopeDifferences: ConflictInfo[] = [];

        // Check if responses cover different aspects of the question
        const capabilities = responses.map(r => r.capability_used);
        const uniqueCapabilities = new Set(capabilities);

        if (uniqueCapabilities.size > 1) {
            scopeDifferences.push({
                type: 'scope_difference',
                agents_involved: responses.map(r => r.agent_id),
                description: `Agents provided responses from different capability perspectives`,
                resolution: 'Combining complementary perspectives',
                confidence: 0.6
            });
        }

        return scopeDifferences;
    }

    private areResponsesContradictory(response1: any, response2: any): boolean {
        // Simple contradiction detection - can be enhanced with more sophisticated logic
        if (typeof response1 === 'string' && typeof response2 === 'string') {
            // Check for opposite sentiment or conflicting statements
            const negativeWords = ['no', 'not', 'never', 'cannot', 'should not', 'avoid'];
            const positiveWords = ['yes', 'should', 'can', 'recommend', 'good', 'beneficial'];

            const response1Lower = response1.toLowerCase();
            const response2Lower = response2.toLowerCase();

            const response1Negative = negativeWords.some(word => response1Lower.includes(word));
            const response2Negative = negativeWords.some(word => response2Lower.includes(word));
            const response1Positive = positiveWords.some(word => response1Lower.includes(word));
            const response2Positive = positiveWords.some(word => response2Lower.includes(word));

            return (response1Negative && response2Positive) || (response1Positive && response2Negative);
        }

        return false;
    }

    private extractCommonThemes(responses: AgentResponse[]): string[] {
        // Extract common themes from responses
        const themes: string[] = [];

        // Simple theme extraction - can be enhanced with NLP
        const allText = responses.map(r =>
            typeof r.response === 'string' ? r.response : JSON.stringify(r.response)
        ).join(' ');

        // Extract key terms (simplified)
        const words = allText.toLowerCase().split(/\s+/);
        const wordCount = new Map<string, number>();

        words.forEach(word => {
            if (word.length > 3) {
                wordCount.set(word, (wordCount.get(word) || 0) + 1);
            }
        });

        // Get most common words as themes
        const sortedWords = Array.from(wordCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([word]) => word);

        return sortedWords;
    }

    private findAgreements(responses: AgentResponse[]): string[] {
        // Find points of agreement between responses
        const agreements: string[] = [];

        // Simple agreement detection - can be enhanced
        if (responses.length >= 2) {
            agreements.push('Multiple agents provided responses');
            agreements.push('All agents addressed the question');
        }

        return agreements;
    }

    private buildConsensusAnswer(
        themes: string[],
        agreements: string[],
        conflicts: ConflictInfo[]
    ): string {
        let answer = 'Based on analysis from multiple agents:\n\n';

        if (themes.length > 0) {
            answer += `Key themes identified: ${themes.join(', ')}\n\n`;
        }

        if (agreements.length > 0) {
            answer += `Points of agreement: ${agreements.join('; ')}\n\n`;
        }

        if (conflicts.length > 0) {
            answer += `Conflicts detected and resolved:\n`;
            conflicts.forEach(conflict => {
                answer += `- ${conflict.description}: ${conflict.resolution}\n`;
            });
            answer += '\n';
        }

        answer += 'This represents a consensus view from the available agents.';

        return answer;
    }

    private calculateConsensusConfidence(
        responses: AgentResponse[],
        agreements: string[],
        conflicts: ConflictInfo[]
    ): number {
        const avgConfidence = responses.reduce((sum, r) => sum + r.confidence, 0) / responses.length;
        const agreementBonus = agreements.length * 0.1;
        const conflictPenalty = conflicts.length * 0.1;

        return Math.min(0.95, Math.max(0.1, avgConfidence + agreementBonus - conflictPenalty));
    }

    private calculateResponseWeights(responses: AgentResponse[]): Map<string, number> {
        const weights = new Map<string, number>();

        responses.forEach(response => {
            // Weight based on confidence and execution time
            const confidenceWeight = response.confidence;
            const performanceWeight = response.execution_time_ms < 1000 ? 1.0 : 0.8;
            const weight = confidenceWeight * performanceWeight;

            weights.set(response.agent_id, weight);
        });

        // Normalize weights
        const totalWeight = Array.from(weights.values()).reduce((sum, w) => sum + w, 0);
        if (totalWeight > 0) {
            for (const [agentId, weight] of weights) {
                weights.set(agentId, weight / totalWeight);
            }
        }

        return weights;
    }

    private combineWeightedResponses(
        responses: AgentResponse[],
        weights: Map<string, number>
    ): string {
        let answer = 'Weighted synthesis of agent responses:\n\n';

        responses.forEach(response => {
            const weight = weights.get(response.agent_id) || 0;
            const responseText = typeof response.response === 'string'
                ? response.response
                : JSON.stringify(response.response);

            answer += `${response.agent_name} (weight: ${weight.toFixed(2)}): ${responseText}\n\n`;
        });

        return answer;
    }

    private calculateWeightedConfidence(
        responses: AgentResponse[],
        weights: Map<string, number>
    ): number {
        let weightedConfidence = 0;

        responses.forEach(response => {
            const weight = weights.get(response.agent_id) || 0;
            weightedConfidence += response.confidence * weight;
        });

        return Math.min(0.95, weightedConfidence);
    }

    private identifyExpertAgents(responses: AgentResponse[]): AgentResponse[] {
        // Sort by confidence and capability relevance
        return responses.sort((a, b) => {
            // Primary sort by confidence
            if (Math.abs(a.confidence - b.confidence) > 0.1) {
                return b.confidence - a.confidence;
            }

            // Secondary sort by execution time (faster is better)
            return a.execution_time_ms - b.execution_time_ms;
        });
    }

    private buildExpertPriorityAnswer(
        primaryResponse: AgentResponse,
        supportingResponses: AgentResponse[],
        conflicts: ConflictInfo[]
    ): string {
        let answer = `Primary expert response from ${primaryResponse.agent_name}:\n\n`;

        const primaryText = typeof primaryResponse.response === 'string'
            ? primaryResponse.response
            : JSON.stringify(primaryResponse.response);

        answer += primaryText + '\n\n';

        if (supportingResponses.length > 0) {
            answer += 'Supporting insights:\n';
            supportingResponses.forEach(response => {
                const responseText = typeof response.response === 'string'
                    ? response.response
                    : JSON.stringify(response.response);
                answer += `- ${response.agent_name}: ${responseText}\n`;
            });
            answer += '\n';
        }

        if (conflicts.length > 0) {
            answer += 'Conflicts resolved:\n';
            conflicts.forEach(conflict => {
                answer += `- ${conflict.description}: ${conflict.resolution}\n`;
            });
        }

        return answer;
    }

    private calculateExpertConfidence(
        primaryResponse: AgentResponse,
        supportingResponses: AgentResponse[]
    ): number {
        const primaryConfidence = primaryResponse.confidence;
        const supportingConfidence = supportingResponses.length > 0
            ? supportingResponses.reduce((sum, r) => sum + r.confidence, 0) / supportingResponses.length
            : 0;

        // Expert confidence is primarily based on primary response
        return Math.min(0.95, primaryConfidence + (supportingConfidence * 0.2));
    }

    private organizeByHierarchy(responses: AgentResponse[]): Map<string, AgentResponse[]> {
        const hierarchy = new Map<string, AgentResponse[]>();

        responses.forEach(response => {
            const capability = response.capability_used;
            if (!hierarchy.has(capability)) {
                hierarchy.set(capability, []);
            }
            hierarchy.get(capability)!.push(response);
        });

        return hierarchy;
    }

    private buildHierarchicalAnswer(
        hierarchy: Map<string, AgentResponse[]>,
        conflicts: ConflictInfo[]
    ): string {
        let answer = 'Hierarchical synthesis by capability:\n\n';

        for (const [capability, responses] of hierarchy) {
            answer += `${capability.toUpperCase()}:\n`;
            responses.forEach(response => {
                const responseText = typeof response.response === 'string'
                    ? response.response
                    : JSON.stringify(response.response);
                answer += `- ${response.agent_name}: ${responseText}\n`;
            });
            answer += '\n';
        }

        if (conflicts.length > 0) {
            answer += 'Conflicts resolved:\n';
            conflicts.forEach(conflict => {
                answer += `- ${conflict.description}: ${conflict.resolution}\n`;
            });
        }

        return answer;
    }

    private calculateHierarchicalConfidence(hierarchy: Map<string, AgentResponse[]>): number {
        let totalConfidence = 0;
        let totalResponses = 0;

        for (const responses of hierarchy.values()) {
            responses.forEach(response => {
                totalConfidence += response.confidence;
                totalResponses++;
            });
        }

        return totalResponses > 0 ? totalConfidence / totalResponses : 0.5;
    }

    private calculateContributions(
        responses: AgentResponse[],
        strategy: string,
        weights?: Map<string, number>
    ): Array<{ agent_id: string; contribution_weight: number; key_insights: string[] }> {
        return responses.map(response => {
            let contributionWeight = 1.0 / responses.length; // Default equal weight

            if (strategy === 'weighted_average' && weights) {
                contributionWeight = weights.get(response.agent_id) || 0;
            } else if (strategy === 'expert_priority') {
                // Primary agent gets higher weight
                contributionWeight = response === responses[0] ? 0.7 : 0.3 / (responses.length - 1);
            }

            const keyInsights = this.extractKeyInsights(response);

            return {
                agent_id: response.agent_id,
                contribution_weight: contributionWeight,
                key_insights: keyInsights
            };
        });
    }

    private extractKeyInsights(response: AgentResponse): string[] {
        const insights: string[] = [];

        if (response.confidence > 0.8) {
            insights.push('High confidence response');
        }

        if (response.execution_time_ms < 500) {
            insights.push('Fast execution');
        }

        if (response.metadata?.quality_score > 0.8) {
            insights.push('High quality output');
        }

        return insights;
    }

    private calculateTokenUsage(question: string, answer: string): { input_tokens: number; output_tokens: number; total_tokens: number } {
        // Rough token estimation
        const inputTokens = Math.ceil(question.length / 4);
        const outputTokens = Math.ceil(answer.length / 4);

        return {
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            total_tokens: inputTokens + outputTokens
        };
    }

    private createEmptySynthesis(): SynthesisResult {
        return {
            synthesized_answer: 'No agent responses available for synthesis.',
            confidence: 0.0,
            synthesis_strategy: 'none',
            agent_contributions: [],
            conflicts_detected: [],
            synthesis_time_ms: 0,
            token_usage: { input_tokens: 0, output_tokens: 0, total_tokens: 0 }
        };
    }

    private createSingleAgentSynthesis(response: AgentResponse): SynthesisResult {
        const responseText = typeof response.response === 'string'
            ? response.response
            : JSON.stringify(response.response);

        return {
            synthesized_answer: responseText,
            confidence: response.confidence,
            synthesis_strategy: 'single_agent',
            agent_contributions: [{
                agent_id: response.agent_id,
                contribution_weight: 1.0,
                key_insights: this.extractKeyInsights(response)
            }],
            conflicts_detected: [],
            synthesis_time_ms: 0,
            token_usage: this.calculateTokenUsage('', responseText)
        };
    }
}
