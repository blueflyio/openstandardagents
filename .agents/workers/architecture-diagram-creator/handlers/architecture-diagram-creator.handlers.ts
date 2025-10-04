import { Request, Response } from 'express';
import { VisualizationService, type VisualizationRequest } from '../../../../src/services/visualization/index.js';
import * as path from 'path';

/**
 * ArchitectureDiagramCreator Agent Handler
 * OSSA v0.1.9 compliant worker implementation
 *
 * Production-ready architecture visualization handler that leverages
 * comprehensive visualization services for Mermaid, Graphviz, and D3.js.
 */
export class ArchitectureDiagramCreatorHandler {
  private vizService: VisualizationService;

  constructor(vizService?: VisualizationService) {
    this.vizService = vizService || new VisualizationService();
  }

  async health(req: Request, res: Response): Promise<void> {
    res.json({
      status: 'healthy',
      agent: 'architecture-diagram-creator',
      type: 'worker',
      version: '1.0.0',
      capabilities: [
        'mermaid-diagrams',
        'graphviz-graphs',
        'd3-data-preparation',
        'suite-generation'
      ],
      supportedTypes: [
        'mermaid-flowchart',
        'mermaid-class',
        'mermaid-sequence',
        'mermaid-state',
        'mermaid-erd',
        'mermaid-architecture',
        'graphviz-digraph',
        'graphviz-cluster',
        'graphviz-dependency',
        'graphviz-execution',
        'd3-force',
        'd3-hierarchy',
        'd3-network',
        'd3-matrix'
      ],
      timestamp: new Date().toISOString()
    });
  }

  async execute(req: Request, res: Response): Promise<void> {
    const { task, parameters } = req.body;

    try {
      const result = await this.processTask(task, parameters);
      res.json({
        status: 'success',
        result,
        execution_id: this.generateExecutionId(),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Process visualization tasks with full production capabilities
   */
  private async processTask(task: string, parameters: any): Promise<any> {
    console.log(`Processing task: ${task}`, parameters);

    switch (task) {
      case 'generate':
        return this.handleGenerate(parameters);

      case 'generate-suite':
        return this.handleGenerateSuite(parameters);

      case 'export':
        return this.handleExport(parameters);

      case 'batch':
        return this.handleBatch(parameters);

      default:
        throw new Error(`Unknown task: ${task}`);
    }
  }

  /**
   * Generate single visualization
   */
  private async handleGenerate(params: any): Promise<any> {
    const request: VisualizationRequest = {
      type: params.type || 'mermaid-flowchart',
      specPath: params.specPath,
      spec: params.spec,
      options: params.options,
      workflow: params.workflow,
      agents: params.agents,
      relationships: params.relationships,
      outputFormat: params.outputFormat
    };

    const result = await this.vizService.generate(request);

    return {
      task: 'generate',
      visualizationType: result.type,
      format: result.format,
      content: result.content,
      metadata: result.metadata,
      agent: 'architecture-diagram-creator',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate complete visualization suite
   */
  private async handleGenerateSuite(params: any): Promise<any> {
    if (!params.specPath) {
      throw new Error('specPath required for suite generation');
    }

    const suite = await this.vizService.generateSuite(params.specPath);

    // Convert Map to object for JSON serialization
    const suiteObject = Object.fromEntries(
      Array.from(suite.entries()).map(([type, result]) => [
        type,
        {
          format: result.format,
          hasContent: !!result.content,
          contentLength: typeof result.content === 'string'
            ? result.content.length
            : JSON.stringify(result.content).length,
          metadata: result.metadata
        }
      ])
    );

    return {
      task: 'generate-suite',
      specPath: params.specPath,
      visualizations: Array.from(suite.keys()),
      count: suite.size,
      suite: suiteObject,
      agent: 'architecture-diagram-creator',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Export visualization to file
   */
  private async handleExport(params: any): Promise<any> {
    if (params.suite && params.outputDir) {
      // Export suite
      const suiteMap = new Map(Object.entries(params.suite));
      await this.vizService.exportSuite(suiteMap, params.outputDir);

      return {
        task: 'export',
        type: 'suite',
        outputDir: params.outputDir,
        visualizationCount: suiteMap.size,
        agent: 'architecture-diagram-creator',
        timestamp: new Date().toISOString()
      };
    } else if (params.visualization && params.outputPath) {
      // Export single visualization
      await this.vizService.exportToFile(params.visualization, params.outputPath);

      return {
        task: 'export',
        type: 'single',
        outputPath: params.outputPath,
        agent: 'architecture-diagram-creator',
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error('Invalid export parameters');
    }
  }

  /**
   * Process batch of visualization requests
   */
  private async handleBatch(params: any): Promise<any> {
    if (!Array.isArray(params.requests)) {
      throw new Error('requests array required for batch processing');
    }

    const results = await this.vizService.generateBatch(params.requests);

    return {
      task: 'batch',
      count: results.length,
      results: results.map(r => ({
        type: r.type,
        format: r.format,
        success: !!r.content,
        metadata: r.metadata
      })),
      agent: 'architecture-diagram-creator',
      timestamp: new Date().toISOString()
    };
  }

  private generateExecutionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
