<?php

namespace Drupal\ossa_mcp_bridge\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\DependencyInjection\ContainerInjectionInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\ossa_mcp_bridge\Service\McpClientService;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;

/**
 * OSSA MCP Bridge Controller.
 * 
 * Provides endpoints for Drupal-OSSA agent communication via MCP protocol.
 */
class McpController extends ControllerBase implements ContainerInjectionInterface {

  /**
   * The MCP client service.
   *
   * @var \Drupal\ossa_mcp_bridge\Service\McpClientService
   */
  protected $mcpClient;

  /**
   * The logger factory.
   *
   * @var \Drupal\Core\Logger\LoggerChannelFactoryInterface
   */
  protected $loggerFactory;

  /**
   * Constructs a McpController object.
   *
   * @param \Drupal\ossa_mcp_bridge\Service\McpClientService $mcp_client
   *   The MCP client service.
   * @param \Drupal\Core\Logger\LoggerChannelFactoryInterface $logger_factory
   *   The logger factory.
   */
  public function __construct(McpClientService $mcp_client, LoggerChannelFactoryInterface $logger_factory) {
    $this->mcpClient = $mcp_client;
    $this->loggerFactory = $logger_factory;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('ossa_mcp_bridge.mcp_client'),
      $container->get('logger.factory')
    );
  }

  /**
   * Execute an agent task via MCP.
   *
   * @param string $agent_id
   *   The agent ID to execute.
   * @param \Symfony\Component\HttpFoundation\Request $request
   *   The HTTP request object.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   The JSON response.
   */
  public function executeAgent($agent_id, Request $request) {
    $logger = $this->loggerFactory->get('ossa_mcp_bridge');
    
    try {
      // Get task parameters from request
      $content = $request->getContent();
      $task_data = $content ? json_decode($content, TRUE) : [];
      
      // Validate agent ID
      if (empty($agent_id) || !$this->isValidAgentId($agent_id)) {
        return new JsonResponse([
          'error' => 'Invalid agent ID',
          'agent_id' => $agent_id
        ], 400);
      }

      // Prepare MCP request
      $mcp_request = [
        'jsonrpc' => '2.0',
        'method' => 'tools/call',
        'params' => [
          'name' => 'agent_execute',
          'arguments' => [
            'agent_id' => $agent_id,
            'task' => $task_data['task'] ?? 'default_task',
            'parameters' => $task_data['parameters'] ?? [],
            'context' => [
              'drupal_user_id' => $this->currentUser()->id(),
              'drupal_session_id' => session_id(),
              'timestamp' => time()
            ]
          ]
        ],
        'id' => uniqid('drupal_mcp_', TRUE)
      ];

      $logger->info('Executing agent @agent_id via MCP', ['@agent_id' => $agent_id]);

      // Send request to OSSA agent
      $response = $this->mcpClient->sendRequest($mcp_request);

      // Log the execution
      $logger->info('Agent execution completed: @agent_id', [
        '@agent_id' => $agent_id,
        'response_id' => $response['id'] ?? 'unknown'
      ]);

      return new JsonResponse([
        'success' => TRUE,
        'agent_id' => $agent_id,
        'execution_id' => $response['id'] ?? uniqid(),
        'result' => $response['result'] ?? null,
        'timestamp' => date('c')
      ]);

    } catch (\Exception $e) {
      $logger->error('Agent execution failed: @message', [
        '@message' => $e->getMessage(),
        'agent_id' => $agent_id
      ]);

      return new JsonResponse([
        'error' => 'Agent execution failed',
        'message' => $e->getMessage(),
        'agent_id' => $agent_id
      ], 500);
    }
  }

  /**
   * Discover available agents.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   The JSON response with discovered agents.
   */
  public function discoverAgents() {
    try {
      $mcp_request = [
        'jsonrpc' => '2.0',
        'method' => 'tools/list',
        'params' => [
          'filter' => [
            'type' => 'agent',
            'status' => 'active'
          ]
        ],
        'id' => uniqid('drupal_discover_', TRUE)
      ];

      $response = $this->mcpClient->sendRequest($mcp_request);
      
      $agents = [];
      if (isset($response['result']['tools'])) {
        foreach ($response['result']['tools'] as $tool) {
          if ($tool['name'] === 'agent_execute') {
            $agents[] = [
              'id' => $tool['agent_id'] ?? 'unknown',
              'name' => $tool['description'] ?? 'Unknown Agent',
              'capabilities' => $tool['capabilities'] ?? [],
              'status' => 'available'
            ];
          }
        }
      }

      return new JsonResponse([
        'success' => TRUE,
        'agents' => $agents,
        'total' => count($agents),
        'discovered_at' => date('c')
      ]);

    } catch (\Exception $e) {
      return new JsonResponse([
        'error' => 'Agent discovery failed',
        'message' => $e->getMessage()
      ], 500);
    }
  }

  /**
   * Get agent status and health.
   *
   * @param string $agent_id
   *   The agent ID to check.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   The JSON response with agent status.
   */
  public function getAgentStatus($agent_id) {
    try {
      $mcp_request = [
        'jsonrpc' => '2.0',
        'method' => 'tools/call',
        'params' => [
          'name' => 'agent_health',
          'arguments' => [
            'agent_id' => $agent_id
          ]
        ],
        'id' => uniqid('drupal_health_', TRUE)
      ];

      $response = $this->mcpClient->sendRequest($mcp_request);

      return new JsonResponse([
        'success' => TRUE,
        'agent_id' => $agent_id,
        'status' => $response['result']['status'] ?? 'unknown',
        'health' => $response['result']['health'] ?? [],
        'last_seen' => $response['result']['last_seen'] ?? null,
        'checked_at' => date('c')
      ]);

    } catch (\Exception $e) {
      return new JsonResponse([
        'error' => 'Status check failed',
        'message' => $e->getMessage(),
        'agent_id' => $agent_id
      ], 500);
    }
  }

  /**
   * Validates agent ID format.
   *
   * @param string $agent_id
   *   The agent ID to validate.
   *
   * @return bool
   *   TRUE if valid, FALSE otherwise.
   */
  private function isValidAgentId($agent_id) {
    // OSSA agent ID format: project-type-name-version
    return preg_match('/^[a-zA-Z0-9_-]+-[a-zA-Z0-9_-]+-[a-zA-Z0-9_-]+-v\d+(\.\d+)*$/', $agent_id);
  }

}
