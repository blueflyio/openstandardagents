<?php

namespace Drupal\ai_agents_ossa\Service;

use Drupal\Core\Logger\LoggerChannelFactoryInterface;

/**
 * Service for managing and accessing discovered OSSA agents.
 */
class AgentManagerService {

  /**
   * The agent discovery service.
   *
   * @var \Drupal\ai_agents_ossa\Service\AgentDiscoveryService
   */
  protected $discoveryService;

  /**
   * The logger factory.
   *
   * @var \Drupal\Core\Logger\LoggerChannelFactoryInterface
   */
  protected $loggerFactory;

  /**
   * Cache of loaded agents.
   *
   * @var array
   */
  protected $agentCache = [];

  /**
   * Constructs an AgentManagerService object.
   *
   * @param \Drupal\ai_agents_ossa\Service\AgentDiscoveryService $discovery_service
   *   The agent discovery service.
   * @param \Drupal\Core\Logger\LoggerChannelFactoryInterface $logger_factory
   *   The logger factory.
   */
  public function __construct(AgentDiscoveryService $discovery_service, LoggerChannelFactoryInterface $logger_factory) {
    $this->discoveryService = $discovery_service;
    $this->loggerFactory = $logger_factory;
  }

  /**
   * Get an agent by name and module.
   *
   * @param string $agent_name
   *   The agent name.
   * @param string $module_name
   *   The module name.
   *
   * @return array|null
   *   The agent data, or NULL if not found.
   */
  public function getAgent(string $agent_name, string $module_name): ?array {
    $cache_key = "{$module_name}:{$agent_name}";
    
    if (isset($this->agentCache[$cache_key])) {
      return $this->agentCache[$cache_key];
    }

    $module_agents = $this->discoveryService->discoverModuleAgents($module_name);
    if (isset($module_agents[$agent_name])) {
      $this->agentCache[$cache_key] = $module_agents[$agent_name];
      return $this->agentCache[$cache_key];
    }

    return NULL;
  }

  /**
   * Get all agents.
   *
   * @return array
   *   Array of all discovered agents.
   */
  public function getAllAgents(): array {
    return $this->discoveryService->discoverAllAgents();
  }

  /**
   * Find agents by capability.
   *
   * @param string $capability
   *   The capability to search for.
   *
   * @return array
   *   Array of agents with the specified capability.
   */
  public function findAgentsByCapability(string $capability): array {
    return $this->discoveryService->findAgentsByCapability($capability);
  }

  /**
   * Find agents by domain.
   *
   * @param string $domain
   *   The domain to search for.
   *
   * @return array
   *   Array of agents in the specified domain.
   */
  public function findAgentsByDomain(string $domain): array {
    return $this->discoveryService->findAgentsByDomain($domain);
  }

  /**
   * Clear the agent cache.
   */
  public function clearCache(): void {
    $this->agentCache = [];
  }

}

