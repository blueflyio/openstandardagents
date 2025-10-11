import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

export interface ServiceDefinition {
  name: string;
  version: string;
  ports: { internal: number; external: number }[];
  healthCheck: string;
  dependencies: string[];
  profiles: string[];
}

export interface PortAllocation {
  service: string;
  ports: Record<string, number>;
  range: string;
  type: string;
  dependencies: string[];
  profiles: string[];
}

export class PortManager {
  private allocations = new Map<string, number[]>();
  private registry = new Map<string, PortAllocation>();

  constructor(private registryPath: string = '/Users/flux423/Sites/LLM') {
    this.loadPortRegistry();
  }

  private loadPortRegistry(): void {
    try {
      const projects = [
        'OSSA',
        'agent-buildkit',
        'llm-platform',
        'agent-brain',
        'agent-chat',
        'agent-docker',
        'agent-mesh',
        'agent-ops',
        'agent-protocol',
        'agent-router',
        'agent-studio',
        'agent-tracer',
        'agentic-flows',
        'compliance-engine',
        'doc-engine',
        'foundation-bridge',
        'rfp-automation',
        'studio-ui',
        'workflow-engine'
      ];

      for (const project of projects) {
        const portsFile = path.join(this.registryPath, project, 'infrastructure', '.ports.yml');
        if (fs.existsSync(portsFile)) {
          const content = fs.readFileSync(portsFile, 'utf8');
          const allocation = yaml.load(content) as PortAllocation;
          this.registry.set(project, allocation);

          // Track allocated ports
          const ports = Object.values(allocation.ports);
          this.allocations.set(project, ports);
        }
      }
    } catch (error) {
      console.warn('Port registry loading failed:', error);
    }
  }

  allocatePort(service: string, preferred?: number): number {
    const serviceRange = this.getServiceRange(service);

    if (preferred && this.isPortAvailable(preferred)) {
      return preferred;
    }

    return this.findNextAvailablePort(serviceRange);
  }

  private getServiceRange(service: string): [number, number] {
    // Core Infrastructure (Reserved)
    if (service === 'OSSA') return [3000, 3099];
    if (service === 'agent-buildkit') return [3100, 3199];
    if (service === 'llm-platform') return [3200, 3299];

    // Common NPM Services
    if (service.startsWith('agent-')) return [4000, 4999];
    if (service.includes('compliance')) return [4100, 4109];
    if (service.includes('doc')) return [4110, 4119];
    if (service.includes('foundation')) return [4120, 4129];
    if (service.includes('rfp')) return [4130, 4139];
    if (service.includes('studio')) return [4140, 4149];
    if (service.includes('workflow')) return [4150, 4159];

    // Models
    if (service.endsWith('_model')) return [5000, 5999];

    // Infrastructure services
    return [6000, 6999];
  }

  private isPortAvailable(port: number): boolean {
    for (const [, ports] of this.allocations) {
      if (ports.includes(port)) {
        return false;
      }
    }
    return true;
  }

  private findNextAvailablePort([start, end]: [number, number]): number {
    for (let port = start; port <= end; port++) {
      if (this.isPortAvailable(port)) {
        return port;
      }
    }
    throw new Error(`No available ports in range ${start}-${end}`);
  }

  validateNoConflicts(): { valid: boolean; conflicts: Array<{ port: number; services: string[] }> } {
    const portMap = new Map<number, string[]>();
    const conflicts: Array<{ port: number; services: string[] }> = [];

    // Build port usage map
    for (const [service, ports] of this.allocations) {
      for (const port of ports) {
        if (!portMap.has(port)) {
          portMap.set(port, []);
        }
        portMap.get(port)!.push(service);
      }
    }

    // Find conflicts
    for (const [port, services] of portMap) {
      if (services.length > 1) {
        conflicts.push({ port, services });
      }
    }

    return {
      valid: conflicts.length === 0,
      conflicts
    };
  }

  generatePortsFile(service: string, ports: Record<string, number>): string {
    const allocation: PortAllocation = {
      service,
      ports,
      range: `${Math.min(...Object.values(ports))}-${Math.max(...Object.values(ports))}`,
      type: this.getServiceType(service),
      dependencies: [],
      profiles: ['core', 'development', 'full']
    };

    return yaml.dump(allocation);
  }

  private getServiceType(service: string): string {
    if (['OSSA', 'agent-buildkit', 'llm-platform'].includes(service)) {
      return 'core-orchestrator';
    }
    if (service.startsWith('agent-')) {
      return 'agent-service';
    }
    if (service.endsWith('_model')) {
      return 'model-service';
    }
    return 'infrastructure-service';
  }

  getServiceRegistry(): Map<string, PortAllocation> {
    return this.registry;
  }

  getAllocatedPorts(): Map<string, number[]> {
    return this.allocations;
  }
}
