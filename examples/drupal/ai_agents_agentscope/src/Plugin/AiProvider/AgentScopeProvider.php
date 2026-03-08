<?php

declare(strict_types=1);

namespace Drupal\ai_agents_agentscope\Plugin\AiProvider;

use Drupal\ai\Attribute\AiProvider;
use Drupal\ai\Base\AiProviderClientBase;
use Drupal\ai\Exception\AiResponseErrorException;
use Drupal\ai\OperationType\Chat\ChatInput;
use Drupal\ai\OperationType\Chat\ChatInterface;
use Drupal\ai\OperationType\Chat\ChatMessage;
use Drupal\ai\OperationType\Chat\ChatOutput;
use Drupal\Core\Config\ImmutableConfig;
use Drupal\Core\StringTranslation\TranslatableMarkup;
use GuzzleHttp\Exception\GuzzleException;

/**
 * AiProvider plugin that bridges to AgentScope's Python HTTP API.
 *
 * This is a thin bridge. All agent plugin derivation, manifest reading,
 * and OSSA integration is handled by ai_agents_ossa. This provider ONLY
 * provides the HTTP transport layer to speak AgentScope's REST API.
 *
 * AgentScope runtime exposes:
 * - POST /api/v1/agent/message — send a message, get a response
 * - GET  /api/v1/health        — health check
 * - GET  /api/v1/agents        — list registered agents
 */
#[AiProvider(
  id: 'agentscope',
  label: new TranslatableMarkup('AgentScope'),
)]
class AgentScopeProvider extends AiProviderClientBase implements ChatInterface {

  /**
   * {@inheritdoc}
   */
  public function getConfiguredModels(?string $operation_type = NULL, array $capabilities = []): array {
    // AgentScope doesn't expose a model list — agents are the unit of work.
    // Return a single virtual model representing the AgentScope runtime.
    return [
      'agentscope-runtime' => [
        'label' => 'AgentScope Runtime',
        'model_id' => 'agentscope-runtime',
        'operation_types' => ['chat'],
      ],
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function isUsable(?string $operation_type = NULL, array $capabilities = []): bool {
    $config = $this->getConfig();
    $endpoint = $config->get('endpoint');

    if (empty($endpoint)) {
      return FALSE;
    }

    if ($operation_type) {
      return in_array($operation_type, $this->getSupportedOperationTypes());
    }

    return TRUE;
  }

  /**
   * {@inheritdoc}
   */
  public function getSupportedOperationTypes(): array {
    return ['chat'];
  }

  /**
   * {@inheritdoc}
   */
  public function getConfig(): ImmutableConfig {
    return $this->configFactory->get('ai_agents_agentscope.settings');
  }

  /**
   * {@inheritdoc}
   */
  public function getApiDefinition(): array {
    return [
      'chat' => [
        'temperature' => [
          'type' => 'float',
          'default' => 0.7,
          'description' => 'Sampling temperature for the agent response.',
        ],
        'max_tokens' => [
          'type' => 'integer',
          'default' => 2048,
          'description' => 'Maximum tokens in the response.',
        ],
      ],
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function getModelSettings(string $model_id, array $generalConfig = []): array {
    return $generalConfig;
  }

  /**
   * {@inheritdoc}
   */
  public function setAuthentication(mixed $authentication): void {
    // AgentScope runtime may not require auth, but store it if provided.
  }

  /**
   * {@inheritdoc}
   */
  public function chat(array|string|ChatInput $input, string $model_id, array $tags = []): ChatOutput {
    $config = $this->getConfig();
    $endpoint = rtrim($config->get('endpoint') ?? 'http://127.0.0.1:12310', '/');
    $timeout = (int) ($config->get('timeout') ?? 60);

    // Build the message payload from ChatInput.
    $messages = [];
    if ($input instanceof ChatInput) {
      foreach ($input->getMessages() as $message) {
        $messages[] = [
          'role' => $message->getRole(),
          'content' => $message->getText(),
        ];
      }
    }
    elseif (is_string($input)) {
      $messages[] = [
        'role' => 'user',
        'content' => $input,
      ];
    }
    elseif (is_array($input)) {
      $messages = $input;
    }

    // Extract the last user message as the prompt for AgentScope.
    $prompt = '';
    foreach (array_reverse($messages) as $msg) {
      if (($msg['role'] ?? '') === 'user') {
        $prompt = $msg['content'] ?? '';
        break;
      }
    }

    if (empty($prompt)) {
      $prompt = end($messages)['content'] ?? '';
    }

    // Determine agent_id from tags or model_id.
    $agentId = $tags['agent_id'] ?? $model_id;

    $payload = [
      'agent_id' => $agentId,
      'message' => $prompt,
    ];

    // Pass model configuration if available from tags.
    if (!empty($tags['model_config'])) {
      $payload['config'] = $tags['model_config'];
    }

    try {
      $response = $this->httpClient->request('POST', $endpoint . '/api/v1/agent/message', [
        'json' => $payload,
        'timeout' => $timeout,
        'headers' => array_filter([
          'Accept' => 'application/json',
          'Content-Type' => 'application/json',
          'Authorization' => $config->get('api_key') ? 'Bearer ' . $config->get('api_key') : NULL,
        ]),
      ]);

      $body = json_decode((string) $response->getBody(), TRUE);
      $content = $body['content'] ?? $body['response'] ?? '';

      $message = new ChatMessage('model', $content);
      return new ChatOutput($message, $body, $body['metadata'] ?? []);
    }
    catch (GuzzleException $e) {
      throw new AiResponseErrorException(
        sprintf('AgentScope runtime request failed: %s', $e->getMessage())
      );
    }
  }

  /**
   * Checks if the AgentScope runtime is reachable.
   *
   * @return bool
   *   TRUE if the runtime health check passes.
   */
  public function isHealthy(): bool {
    $config = $this->getConfig();
    $endpoint = rtrim($config->get('endpoint') ?? 'http://127.0.0.1:12310', '/');

    try {
      $response = $this->httpClient->request('GET', $endpoint . '/api/v1/health', [
        'timeout' => 5,
      ]);

      return $response->getStatusCode() === 200;
    }
    catch (GuzzleException) {
      return FALSE;
    }
  }

}
