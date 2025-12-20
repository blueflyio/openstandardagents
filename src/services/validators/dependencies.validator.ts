import * as semver from 'semver';
import { injectable, inject, optional } from 'inversify';
import { ContractValidator } from './contract.validator.js';

export interface AgentDependency {
  name: string;
  version: string;
  required: boolean;
  reason?: string;
  contract?: {
    publishes?: string[];
    commands?: string[];
  };
}

export interface AgentManifest {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    version?: string;
  };
  spec: {
    dependencies?: {
      agents?: AgentDependency[];
      services?: any[];
      mcp?: any[];
    };
    messaging?: {
      publishes?: Array<{ channel: string }>;
      subscribes?: Array<{ channel: string }>;
    };
  };
}

export interface DependencyConflict {
  agent: string;
  dependency: string;
  conflictingVersions: Array<{
    requiredBy: string;
    version: string;
  }>;
}

export interface CircularDependency {
  cycle: string[];
}

export interface ValidationResult {
  valid: boolean;
  conflicts: DependencyConflict[];
  circularDependencies: CircularDependency[];
  missingDependencies: Array<{
    agent: string;
    dependency: string;
  }>;
  contractViolations: Array<{
    agent: string;
    dependency: string;
    violation: string;
  }>;
}

@injectable()
export class DependenciesValidator {
  constructor(
    @inject(ContractValidator) @optional() private contractValidator?: ContractValidator
  ) {}

  /**
   * Validate all agent dependencies across multiple manifests
   */
  validateDependencies(manifests: AgentManifest[]): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      conflicts: [],
      circularDependencies: [],
      missingDependencies: [],
      contractViolations: [],
    };

    // Build agent registry
    const agentRegistry = new Map<string, AgentManifest>();
    for (const manifest of manifests) {
      agentRegistry.set(manifest.metadata.name, manifest);
    }

    // Check for version conflicts
    const conflicts = this.detectVersionConflicts(manifests);
    if (conflicts.length > 0) {
      result.valid = false;
      result.conflicts = conflicts;
    }

    // Check for circular dependencies
    const circular = this.detectCircularDependencies(manifests);
    if (circular.length > 0) {
      result.valid = false;
      result.circularDependencies = circular;
    }

    // Check for missing dependencies
    const missing = this.detectMissingDependencies(manifests, agentRegistry);
    if (missing.length > 0) {
      result.valid = false;
      result.missingDependencies = missing;
    }

    // Check contract violations
    const violations = this.detectContractViolations(manifests, agentRegistry);
    if (violations.length > 0) {
      result.valid = false;
      result.contractViolations = violations;
    }

    return result;
  }

  /**
   * Detect version conflicts between agents
   */
  private detectVersionConflicts(manifests: AgentManifest[]): DependencyConflict[] {
    const conflicts: DependencyConflict[] = [];
    const dependencyVersions = new Map<
      string,
      Array<{ requiredBy: string; version: string }>
    >();

    // Collect all dependency versions
    for (const manifest of manifests) {
      const deps = manifest.spec.dependencies?.agents || [];
      for (const dep of deps) {
        if (!dependencyVersions.has(dep.name)) {
          dependencyVersions.set(dep.name, []);
        }
        dependencyVersions.get(dep.name)!.push({
          requiredBy: manifest.metadata.name,
          version: dep.version,
        });
      }
    }

    // Check for incompatible versions
    for (const [depName, versions] of dependencyVersions.entries()) {
      if (versions.length > 1) {
        // Check if any versions are incompatible
        const hasConflict = this.hasVersionConflict(
          versions.map((v) => v.version)
        );
        if (hasConflict) {
          conflicts.push({
            agent: depName,
            dependency: depName,
            conflictingVersions: versions,
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Check if version constraints are incompatible
   */
  private hasVersionConflict(versions: string[]): boolean {
    // Find the intersection of all version ranges
    try {
      let intersection: semver.Range | null = null;

      for (const versionConstraint of versions) {
        const range = new semver.Range(versionConstraint);

        if (!intersection) {
          intersection = range;
        } else {
          // Check if ranges have any overlap
          const hasOverlap = this.rangesOverlap(intersection, range);
          if (!hasOverlap) {
            return true; // Conflict detected
          }
        }
      }

      return false; // No conflict
    } catch (error) {
      // Invalid semver format
      return true;
    }
  }

  /**
   * Check if two semver ranges overlap
   */
  private rangesOverlap(range1: semver.Range, range2: semver.Range): boolean {
    // Use semver.intersects if available, otherwise test with sample versions
    // For tilde ranges like ~1.2.0 and ~1.2.3, both match 1.2.x versions
    try {
      // Try to find a version that satisfies both ranges
      // Generate comprehensive test versions
      const testVersions: string[] = [];
      
      // Extract base versions from ranges
      const range1Str = range1.raw || range1.toString();
      const range2Str = range2.raw || range2.toString();
      
      // Extract version numbers from range strings (e.g., "~1.2.0" -> "1.2.0")
      const extractVersion = (rangeStr: string): string | null => {
        const match = rangeStr.match(/(\d+\.\d+\.\d+)/);
        return match ? match[1] : null;
      };
      
      const v1 = extractVersion(range1Str);
      const v2 = extractVersion(range2Str);
      
      if (v1) {
        const [major, minor, patch] = v1.split('.').map(Number);
        // Generate versions around v1
        for (let p = Math.max(0, patch - 2); p <= patch + 10; p++) {
          testVersions.push(`${major}.${minor}.${p}`);
        }
        testVersions.push(`${major}.${minor + 1}.0`);
      }
      
      if (v2) {
        const [major, minor, patch] = v2.split('.').map(Number);
        // Generate versions around v2
        for (let p = Math.max(0, patch - 2); p <= patch + 10; p++) {
          testVersions.push(`${major}.${minor}.${p}`);
        }
        testVersions.push(`${major}.${minor + 1}.0`);
      }
      
      // Add common test versions
      testVersions.push('0.0.1', '0.1.0', '1.0.0', '1.2.0', '1.2.3', '1.2.9', '1.3.0', '2.0.0');
      
      // Remove duplicates
      const uniqueVersions = Array.from(new Set(testVersions));
      
      // Check if any version satisfies both ranges
      for (const version of uniqueVersions) {
        if (semver.satisfies(version, range1) && semver.satisfies(version, range2)) {
          return true; // Found overlapping version
        }
      }
      
      return false; // No overlap found
    } catch (error) {
      // Fallback: if we can't determine overlap, assume no conflict
      return true; // Conservative: assume compatible to avoid false positives
    }
  }

  /**
   * Detect circular dependencies using DFS
   */
  private detectCircularDependencies(
    manifests: AgentManifest[]
  ): CircularDependency[] {
    const cycles: CircularDependency[] = [];
    const adjacencyList = this.buildDependencyGraph(manifests);
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (node: string, path: string[]): void => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const neighbors = adjacencyList.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, [...path]);
        } else if (recursionStack.has(neighbor)) {
          // Cycle detected
          const cycleStart = path.indexOf(neighbor);
          const cycle = [...path.slice(cycleStart), neighbor];
          cycles.push({ cycle });
        }
      }

      recursionStack.delete(node);
    };

    for (const manifest of manifests) {
      const agentName = manifest.metadata.name;
      if (!visited.has(agentName)) {
        dfs(agentName, []);
      }
    }

    return cycles;
  }

  /**
   * Build dependency graph as adjacency list
   */
  private buildDependencyGraph(
    manifests: AgentManifest[]
  ): Map<string, string[]> {
    // Build reverse graph: dependency -> dependents
    // For topological sort, we need edges FROM dependencies TO dependents
    const graph = new Map<string, string[]>();
    const manifestMap = new Map<string, AgentManifest>();

    // Initialize graph with all agents
    for (const manifest of manifests) {
      const agentName = manifest.metadata.name;
      manifestMap.set(agentName, manifest);
      if (!graph.has(agentName)) {
        graph.set(agentName, []);
      }
    }

    // Build edges: for each dependency, add edge FROM dependency TO dependent
    for (const manifest of manifests) {
      const agentName = manifest.metadata.name;
      const deps = manifest.spec.dependencies?.agents || [];
      
      for (const dep of deps) {
        if (manifestMap.has(dep.name)) {
          // Add edge: dependency -> dependent
          const dependents = graph.get(dep.name) || [];
          if (!dependents.includes(agentName)) {
            dependents.push(agentName);
            graph.set(dep.name, dependents);
          }
        }
      }
    }

    return graph;
  }

  /**
   * Detect missing dependencies
   */
  private detectMissingDependencies(
    manifests: AgentManifest[],
    agentRegistry: Map<string, AgentManifest>
  ): Array<{ agent: string; dependency: string }> {
    const missing: Array<{ agent: string; dependency: string }> = [];

    for (const manifest of manifests) {
      const deps = manifest.spec.dependencies?.agents || [];
      for (const dep of deps) {
        if (dep.required && !agentRegistry.has(dep.name)) {
          missing.push({
            agent: manifest.metadata.name,
            dependency: dep.name,
          });
        }
      }
    }

    return missing;
  }

  /**
   * Detect contract violations
   */
  private detectContractViolations(
    manifests: AgentManifest[],
    agentRegistry: Map<string, AgentManifest>
  ): Array<{ agent: string; dependency: string; violation: string }> {
    const violations: Array<{ agent: string; dependency: string; violation: string }> =
      [];

    for (const manifest of manifests) {
      const deps = manifest.spec.dependencies?.agents || [];
      for (const dep of deps) {
        if (!dep.contract) continue;

        const targetAgent = agentRegistry.get(dep.name);
        if (!targetAgent) continue;

        // Check if target agent publishes expected events
        if (dep.contract.publishes) {
          const targetPublishes = new Set(
            (targetAgent.spec.messaging?.publishes || []).map((p) => p.channel)
          );
          for (const expectedChannel of dep.contract.publishes) {
            if (!targetPublishes.has(expectedChannel)) {
              violations.push({
                agent: manifest.metadata.name,
                dependency: dep.name,
                violation: `Expected event channel "${expectedChannel}" not published by ${dep.name}`,
              });
            }
          }
        }

        // Check if target agent exposes expected commands
        if (dep.contract.commands) {
          const targetCommands = new Set(
            ((targetAgent.spec.messaging as { commands?: Array<{ name: string }> })?.commands || []).map((c) => c.name)
          );
          for (const expectedCommand of dep.contract.commands) {
            if (!targetCommands.has(expectedCommand)) {
              violations.push({
                agent: manifest.metadata.name,
                dependency: dep.name,
                violation: `Expected command "${expectedCommand}" not exposed by ${dep.name}`,
              });
            }
          }

          // Use ContractValidator for detailed schema validation if available
          if (this.contractValidator) {
            const contractResult = this.contractValidator.testContractBetweenAgents(
              manifest,
              targetAgent
            );
            for (const error of contractResult.errors) {
              violations.push({
                agent: manifest.metadata.name,
                dependency: dep.name,
                violation: error.message,
              });
            }
          }
        }
      }
    }

    return violations;
  }

  /**
   * Generate dependency graph in DOT format for visualization
   */
  generateDependencyGraph(manifests: AgentManifest[]): string {
    let dot = 'digraph AgentDependencies {\n';
    dot += '  rankdir=LR;\n';
    dot += '  node [shape=box, style=rounded];\n\n';

    for (const manifest of manifests) {
      const agentName = manifest.metadata.name;
      const deps = manifest.spec.dependencies?.agents || [];

      for (const dep of deps) {
        const style = dep.required ? 'solid' : 'dashed';
        const color = dep.required ? 'black' : 'gray';
        dot += `  "${agentName}" -> "${dep.name}" [style=${style}, color=${color}, label="${dep.version}"];\n`;
      }
    }

    dot += '}\n';
    return dot;
  }

  /**
   * Calculate deployment order based on dependencies
   */
  calculateDeploymentOrder(manifests: AgentManifest[]): string[][] {
    const graph = this.buildDependencyGraph(manifests);
    const inDegree = new Map<string, number>();
    const batches: string[][] = [];

    // Initialize in-degree count
    for (const manifest of manifests) {
      inDegree.set(manifest.metadata.name, 0);
    }

    // Calculate in-degrees
    for (const [, neighbors] of graph.entries()) {
      for (const neighbor of neighbors) {
        inDegree.set(neighbor, (inDegree.get(neighbor) || 0) + 1);
      }
    }

    // Topological sort with Kahn's algorithm (parallel batches)
    const remaining = new Set(manifests.map((m) => m.metadata.name));

    while (remaining.size > 0) {
      const batch: string[] = [];

      // Find all nodes with in-degree 0
      for (const agent of remaining) {
        if (inDegree.get(agent) === 0) {
          batch.push(agent);
        }
      }

      if (batch.length === 0) {
        throw new Error('Circular dependency detected - cannot calculate deployment order');
      }

      batches.push(batch);

      // Remove batch from remaining and update in-degrees
      for (const agent of batch) {
        remaining.delete(agent);
        const neighbors = graph.get(agent) || [];
        for (const neighbor of neighbors) {
          inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1);
        }
      }
    }

    return batches;
  }
}
