<?php

namespace Drupal\ossa_mcp_bridge\Service;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use GuzzleHttp\ClientInterface;
use GuzzleHttp\Exception\RequestException;

/**
 * MCP Client Service for OSSA communication.
 */
class McpClientService {

  /**
   * The HTTP client.
   *
   * @var \GuzzleHttp\ClientInterface
   */
  protected $httpClient;

  /**
   * The config factory.
   *
   * @var \Drupal\Core\Config\ConfigFactoryInterface
   */
  protected $configFactory;

  /**
   * The logger factory.
   *
   * @var \Drupal\Core\Logger\LoggerChannelFactoryInterface
   */
  protected $loggerFactory;

  /**
   * Constructs a McpClientService object.
   *
   * @param \GuzzleHttp\ClientInterface $http_client
   *   The HTTP client.
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The config factory.
   * @param \Drupal\Core\Logger\LoggerChannelFactoryInterface $logger_factory
   *   The logger factory.
   */
  public function __construct(ClientInterface $http_client, ConfigFactoryInterface $config_factory, LoggerChannelFactoryInterface $logger_factory) {
    $this->httpClient = $http_client;
    $this->configFactory = $config_factory;
    $this->loggerFactory = $logger_factory;
  }

  /**
   * Send MCP request to OSSA workspace.
   *
   * @param array $request
   *   The MCP request data.
   *
   * @return array
   *   The MCP response data.
   *
   * @throws \Exception
   *   When the request fails.
   */
  public function sendRequest(array $request) {
    $config = $this->configFactory->get('ossa_mcp_bridge.settings');
    $logger = $this->loggerFactory->get('ossa_mcp_bridge');
    
    $mcp_endpoint = $config->get('mcp_endpoint') ?? 'http://localhost:3000/mcp';
    $timeout = $config->get('timeout') ?? 30;
    
    try {
      $logger->debug('Sending MCP request to @endpoint', ['@endpoint' => $mcp_endpoint]);
      
      $response = $this->httpClient->post($mcp_endpoint, [
        'json' => $request,
        'timeout' => $timeout,
        'headers' => [
          'Content-Type' => 'application/json',
          'User-Agent' => 'Drupal-OSSA-Bridge/1.0',
          'X-OSSA-Version' => '0.1.9-alpha.1'
        ]
      ]);

      $body = $response->getBody()->getContents();
      $data = json_decode($body, TRUE);

      if (json_last_error() !== JSON_ERROR_NONE) {
        throw new \Exception('Invalid JSON response: ' . json_last_error_msg());
      }

      if (isset($data['error'])) {
        throw new \Exception('MCP Error: ' . $data['error']['message']);
      }

      $logger->debug('MCP request successful');
      return $data;

    } catch (RequestException $e) {
      $logger->error('MCP request failed: @message', ['@message' => $e->getMessage()]);
      throw new \Exception('MCP communication failed: ' . $e->getMessage());
    }
  }

  /**
   * Test MCP connection.
   *
   * @return bool
   *   TRUE if connection is successful, FALSE otherwise.
   */
  public function testConnection() {
    try {
      $ping_request = [
        'jsonrpc' => '2.0',
        'method' => 'ping',
        'params' => [],
        'id' => uniqid('drupal_ping_', TRUE)
      ];

      $response = $this->sendRequest($ping_request);
      return isset($response['result']) && $response['result'] === 'pong';

    } catch (\Exception $e) {
      return FALSE;
    }
  }

}
