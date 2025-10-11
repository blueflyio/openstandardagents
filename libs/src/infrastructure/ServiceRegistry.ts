import { PortManager, ServiceDefinition, PortAllocation } from './PortManager.js';

export class LLMServiceRegistry {
  private services = new Map<string, ServiceDefinition>();
  private portManager: PortManager;

  constructor() {
    this.portManager = new PortManager();
    this.loadServices();
  }

  private loadServices(): void {
    const registry = this.portManager.getServiceRegistry();

    for (const [name, allocation] of registry) {
      const service: ServiceDefinition = {
        name: allocation.service,
        version: '1.0.0',
        ports: Object.entries(allocation.ports).map(([key, port]) => ({
          internal: port,
          external: port
        })),
        healthCheck: '/health',
        dependencies: allocation.dependencies,
        profiles: allocation.profiles
      };

      this.services.set(name, service);
    }
  }

  register(service: ServiceDefinition): void {
    this.validatePorts(service);
    this.services.set(service.name, service);
  }

  private validatePorts(service: ServiceDefinition): void {
    const validation = this.portManager.validateNoConflicts();
    if (!validation.valid) {
      throw new Error(
        `Port conflicts detected: ${validation.conflicts
          .map((c) => `Port ${c.port} used by: ${c.services.join(', ')}`)
          .join('; ')}`
      );
    }
  }

  getProfile(profile: 'core' | 'dev' | 'full'): ServiceDefinition[] {
    return Array.from(this.services.values()).filter((s) => s.profiles.includes(profile));
  }

  generateComposeFile(profile: string): string {
    const services = this.getProfile(profile as 'core' | 'dev' | 'full');

    const composeServices = services
      .map((service) => {
        const ports = service.ports.map((p) => `"${p.external}:${p.internal}"`).join(', ');

        return `  ${service.name.toLowerCase()}:
    image: ${service.name.toLowerCase()}:latest
    container_name: ${service.name.toLowerCase()}
    ports: [${ports}]
    environment:
      - NODE_ENV=development
    networks:
      - llm-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:${service.ports[0]?.internal}${service.healthCheck}"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
    restart: unless-stopped`;
      })
      .join('\n\n');

    return `version: '3.8'

services:
${composeServices}

networks:
  llm-network:
    external: true
    name: llm-network
`;
  }

  getService(name: string): ServiceDefinition | undefined {
    return this.services.get(name);
  }

  getAllServices(): ServiceDefinition[] {
    return Array.from(this.services.values());
  }

  getServicesByType(type: string): ServiceDefinition[] {
    return this.getAllServices().filter((service) => {
      if (type === 'core' && ['OSSA', 'agent-buildkit', 'llm-platform'].includes(service.name)) {
        return true;
      }
      if (type === 'agent' && service.name.startsWith('agent-')) {
        return true;
      }
      if (type === 'model' && service.name.endsWith('_model')) {
        return true;
      }
      return false;
    });
  }

  validateRegistry(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for port conflicts
    const portValidation = this.portManager.validateNoConflicts();
    if (!portValidation.valid) {
      errors.push(...portValidation.conflicts.map((c) => `Port conflict: ${c.port} used by ${c.services.join(', ')}`));
    }

    // Check for dependency cycles
    const dependencyErrors = this.checkDependencyCycles();
    errors.push(...dependencyErrors);

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private checkDependencyCycles(): string[] {
    const errors: string[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (serviceName: string): boolean => {
      if (recursionStack.has(serviceName)) {
        return true;
      }
      if (visited.has(serviceName)) {
        return false;
      }

      visited.add(serviceName);
      recursionStack.add(serviceName);

      const service = this.services.get(serviceName);
      if (service) {
        for (const dep of service.dependencies) {
          if (hasCycle(dep)) {
            return true;
          }
        }
      }

      recursionStack.delete(serviceName);
      return false;
    };

    for (const serviceName of this.services.keys()) {
      if (hasCycle(serviceName)) {
        errors.push(`Dependency cycle detected involving service: ${serviceName}`);
      }
    }

    return errors;
  }
}
