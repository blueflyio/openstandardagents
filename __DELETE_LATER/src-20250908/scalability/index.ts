/**
 * OSSA Scalability and Performance Architecture
 * 
 * Complete scalability solution for 1000+ agent environments including:
 * - Vector-based capability matching optimization
 * - Health-aware load balancing with circuit breakers  
 * - Geographic distribution with regional partitioning
 * - Cross-region registry federation
 * - Performance monitoring and predictive auto-scaling
 * - Multi-layer caching with TTL management
 * - Connection pooling and resource management
 */

export { CapabilityMatcher } from './capability-matcher';
export { LoadBalancer } from './load-balancer';
export { GeoDistributionManager } from './geo-distribution';
export { RegistryFederation } from './registry-federation';
export { PerformanceMonitor } from './performance-monitor';
export { CacheManager } from './cache-manager';
export { ConnectionPool, ResourceManager } from './connection-pool';

// Re-export types for external usage
export type {
  CapabilityVector,
  MatchingIndex,
  MatchingConfig
} from './capability-matcher';

export type {
  LoadBalancerConfig,
  AgentHealth,
  CircuitBreaker,
  LoadBalancingDecision
} from './load-balancer';

export type {
  Region,
  GeographicConfig,
  RegionPartition,
  CrossRegionQuery
} from './geo-distribution';

export type {
  FederatedRegistry,
  FederationConfig,
  SyncOperation,
  AgentVersion
} from './registry-federation';

export type {
  PerformanceMetrics,
  AutoScalingConfig,
  ScalingDecision,
  Alert
} from './performance-monitor';

export type {
  CacheConfig,
  L1CacheConfig,
  L2CacheConfig,
  L3CacheConfig,
  CacheEntry,
  CacheMetrics
} from './cache-manager';

export type {
  ConnectionPoolConfig,
  ResourceManagerConfig,
  Connection,
  PoolStatistics,
  ResourceMetrics
} from './connection-pool';

/**
 * Factory function to create a complete scalability infrastructure
 */
export function createScalabilityInfrastructure(config?: {
  capabilityMatcher?: any;
  loadBalancer?: any;
  geoDistribution?: any;
  registryFederation?: any;
  performanceMonitor?: any;
  cacheManager?: any;
  resourceManager?: any;
}) {
  const infrastructure = {
    capabilityMatcher: new CapabilityMatcher(config?.capabilityMatcher),
    loadBalancer: new LoadBalancer(config?.loadBalancer),
    geoDistribution: new GeoDistributionManager({
      localRegion: 'default',
      ...config?.geoDistribution
    }),
    registryFederation: new RegistryFederation({
      localRegistryId: 'default',
      ...config?.registryFederation
    }),
    performanceMonitor: new PerformanceMonitor(config?.performanceMonitor),
    cacheManager: new CacheManager(config?.cacheManager),
    resourceManager: new ResourceManager(config?.resourceManager)
  };

  return {
    ...infrastructure,
    
    /**
     * Initialize all components
     */
    async initialize() {
      // Setup cross-component integrations
      infrastructure.performanceMonitor.on('scaling_completed', (event) => {
        infrastructure.loadBalancer.emit('infrastructure_scaled', event);
      });

      infrastructure.cacheManager.on('cache_write', (event) => {
        infrastructure.performanceMonitor.emit('cache_activity', event);
      });

      infrastructure.geoDistribution.on('discovery_completed', (event) => {
        infrastructure.performanceMonitor.emit('discovery_performance', event);
      });

      return infrastructure;
    },

    /**
     * Stop all components
     */
    async stop() {
      await Promise.allSettled([
        infrastructure.performanceMonitor.stop(),
        infrastructure.cacheManager.stop(),
        infrastructure.resourceManager.stop(),
        infrastructure.geoDistribution.stop(),
        infrastructure.registryFederation.stop(),
        infrastructure.loadBalancer.stop()
      ]);
    },

    /**
     * Get comprehensive health status
     */
    getHealthStatus() {
      return {
        timestamp: new Date(),
        infrastructure: {
          capabilityMatcher: infrastructure.capabilityMatcher.getStatistics(),
          loadBalancer: infrastructure.loadBalancer.getStatistics(),
          geoDistribution: infrastructure.geoDistribution.getRegionalStatistics(),
          registryFederation: infrastructure.registryFederation.getFederationStatistics(),
          performanceMonitor: infrastructure.performanceMonitor.getCurrentMetrics(),
          cacheManager: infrastructure.cacheManager.getStatistics(),
          resourceManager: infrastructure.resourceManager.getGlobalMetrics()
        }
      };
    }
  };
}