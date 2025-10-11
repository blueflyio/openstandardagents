/**
 * Visualization Services Module
 *
 * Comprehensive visualization suite for OSSA agent architectures.
 * Provides 18 different visualization types across 3 rendering engines.
 *
 * Architecture:
 * - MermaidService: 6 diagram types (flowchart, class, sequence, state, ERD, architecture)
 * - GraphvizService: 7 graph types (digraph, cluster, dependency, execution, capability, communication)
 * - D3DataService: 9 data formats (force, hierarchy, sankey, chord, network, matrix, etc.)
 * - VisualizationService: Unified orchestrator (facade pattern)
 *
 * SOLID Principles:
 * - Single Responsibility: Each service handles one rendering engine
 * - Open/Closed: Extensible for new diagram/graph types
 * - Liskov Substitution: Services implement consistent interfaces
 * - Interface Segregation: Type-specific methods
 * - Dependency Inversion: Orchestrator depends on abstractions
 *
 * Usage:
 * ```typescript
 * import { VisualizationService } from './services/visualization';
 *
 * const vizService = new VisualizationService();
 * const result = await vizService.generate({
 *   type: 'mermaid-flowchart',
 *   specPath: './ossa-complete.openapi.yml'
 * });
 * ```
 *
 * @module services/visualization
 */

// Core Services
export { MermaidService } from './MermaidService.js';
export { GraphvizService } from './GraphvizService.js';
export { D3DataService } from './D3DataService.js';
export { VisualizationService } from './VisualizationService.js';

// Import for default export
import { VisualizationService } from './VisualizationService.js';

// Mermaid Types
export type { DiagramOptions, AgentNode, AgentRelationship } from './MermaidService.js';

// Graphviz Types
export type { GraphvizOptions, GraphNode, GraphEdge } from './GraphvizService.js';

// D3 Types
export type { D3Node, D3Link, D3ForceGraphData, D3HierarchyNode, D3SankeyData, D3ChordData } from './D3DataService.js';

// Unified Types
export type { VisualizationType, VisualizationRequest, VisualizationResult } from './VisualizationService.js';

/**
 * Default export: Unified service
 */
export default VisualizationService;
