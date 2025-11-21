<?php

namespace Drupal\ai_agents_ossa\Service;

use Drupal\Core\File\FileSystemInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Symfony\Component\Yaml\Yaml;

/**
 * Service for discovering OSSA agents in Drupal modules.
 *
 * Scans modules for .agents/ folders and discovers agent.ossa.yaml files
 * following the OSSA agent folder structure standard.
 */
class AgentDiscoveryService {

  /**
   * The file system service.
   *
   * @var \Drupal\Core\File\FileSystemInterface
   */
  protected $fileSystem;

  /**
   * The logger factory.
   *
   * @var \Drupal\Core\Logger\LoggerChannelFactoryInterface
   */
  protected $loggerFactory;

  /**
   * Constructs an AgentDiscoveryService object.
   *
   * @param \Drupal\Core\File\FileSystemInterface $file_system
   *   The file system service.
   * @param \Drupal\Core\Logger\LoggerChannelFactoryInterface $logger_factory
   *   The logger factory.
   */
  public function __construct(FileSystemInterface $file_system, LoggerChannelFactoryInterface $logger_factory) {
    $this->fileSystem = $file_system;
    $this->loggerFactory = $logger_factory;
  }

  /**
   * Discover agents in a specific module.
   *
   * @param string $module_name
   *   The machine name of the module.
   *
   * @return array
   *   Array of discovered agents, keyed by agent name.
   */
  public function discoverModuleAgents(string $module_name): array {
    $module_path = drupal_get_path('module', $module_name);
    if (!$module_path) {
      $this->loggerFactory->get('ai_agents_ossa')->warning('Module @module not found', ['@module' => $module_name]);
      return [];
    }

    $full_path = DRUPAL_ROOT . '/' . $module_path;
    $agents_dir = $full_path . '/.agents';
    return $this->discoverAgentsInDirectory($agents_dir, $module_name);
  }

  /**
   * Discover all agents across all modules.
   *
   * @return array
   *   Array of discovered agents, keyed by 'module_name:agent_name'.
   */
  public function discoverAllAgents(): array {
    $all_agents = [];
    $module_handler = \Drupal::moduleHandler();
    $modules = $module_handler->getModuleList();

    foreach ($modules as $module_name => $module) {
      $module_agents = $this->discoverModuleAgents($module_name);
      foreach ($module_agents as $agent_name => $agent) {
        $all_agents["{$module_name}:{$agent_name}"] = $agent;
      }
    }

    return $all_agents;
  }

  /**
   * Discover agents in a specific directory.
   *
   * @param string $agents_dir
   *   Path to .agents/ directory.
   * @param string $module_name
   *   The module name for context.
   *
   * @return array
   *   Array of discovered agents.
   */
  protected function discoverAgentsInDirectory(string $agents_dir, string $module_name): array {
    $agents = [];

    if (!is_dir($agents_dir)) {
      return $agents;
    }

    $entries = scandir($agents_dir);
    if ($entries === FALSE) {
      return $agents;
    }

    foreach ($entries as $entry) {
      if ($entry === '.' || $entry === '..') {
        continue;
      }

      $agent_dir = $agents_dir . '/' . $entry;
      if (!is_dir($agent_dir)) {
        continue;
      }

      // Look for agent.ossa.yaml or agent.yml
      $manifest_path = $agent_dir . '/agent.ossa.yaml';
      if (!file_exists($manifest_path)) {
        $manifest_path = $agent_dir . '/agent.yml';
      }

      if (!file_exists($manifest_path)) {
        continue;
      }

      try {
        $manifest_content = file_get_contents($manifest_path);
        if ($manifest_content === FALSE) {
          continue;
        }

        $manifest = Yaml::parse($manifest_content);

        // Extract agent metadata
        $agent_name = $manifest['metadata']['name'] ?? $entry;
        $agents[$agent_name] = [
          'name' => $agent_name,
          'path' => $manifest_path,
          'manifest' => $manifest,
          'module' => $module_name,
          'directory' => $agent_dir,
          'metadata' => [
            'version' => $manifest['metadata']['version'] ?? NULL,
            'description' => $manifest['metadata']['description'] ?? NULL,
            'labels' => $manifest['metadata']['labels'] ?? [],
            'taxonomy' => $manifest['spec']['taxonomy'] ?? [],
          ],
        ];
      }
      catch (\Exception $e) {
        $this->loggerFactory->get('ai_agents_ossa')->error('Failed to parse agent manifest @path: @error', [
          '@path' => $manifest_path,
          '@error' => $e->getMessage(),
        ]);
      }
    }

    return $agents;
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
    $all_agents = $this->discoverAllAgents();
    $matching_agents = [];

    foreach ($all_agents as $key => $agent) {
      $capabilities = $agent['metadata']['taxonomy']['capabilities'] ?? [];
      if (in_array($capability, $capabilities)) {
        $matching_agents[$key] = $agent;
      }
    }

    return $matching_agents;
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
    $all_agents = $this->discoverAllAgents();
    $matching_agents = [];

    foreach ($all_agents as $key => $agent) {
      $agent_domain = $agent['metadata']['taxonomy']['domain'] ?? NULL;
      if ($agent_domain === $domain) {
        $matching_agents[$key] = $agent;
      }
    }

    return $matching_agents;
  }

}

