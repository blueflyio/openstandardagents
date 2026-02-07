<?php

namespace Drupal\content_moderator\Service;

use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\ai_agents\AiAgentsManagerInterface;

/**
 * Agent executor service.
 *
 * Handles OSSA agent execution via ai_agents module.
 */
class AgentExecutor {

  /**
   * The logger factory.
   *
   * @var \Drupal\Core\Logger\LoggerChannelFactoryInterface
   */
  protected $loggerFactory;

  /**
   * The config factory.
   *
   * @var \Drupal\Core\Config\ConfigFactoryInterface
   */
  protected $configFactory;

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * The ai_agents manager.
   *
   * @var \Drupal\ai_agents\AiAgentsManagerInterface
   */
  protected $aiAgentsManager;

  /**
   * Constructs a new AgentExecutor.
   */
  public function __construct(
    LoggerChannelFactoryInterface $logger_factory,
    ConfigFactoryInterface $config_factory,
    EntityTypeManagerInterface $entity_type_manager,
    AiAgentsManagerInterface $ai_agents_manager
  ) {
    $this->loggerFactory = $logger_factory;
    $this->configFactory = $config_factory;
    $this->entityTypeManager = $entity_type_manager;
    $this->aiAgentsManager = $ai_agents_manager;
  }

  /**
   * Execute the agent.
   *
   * @param array $input
   *   Input data.
   *
   * @return array
   *   Execution result with keys:
   *   - success: bool
   *   - data: mixed
   *   - error: string|null
   */
  public function execute(array $input): array {
    $logger = $this->loggerFactory->get('content_moderator');
    $logger->info('Agent execution started');

    try {
      // Validate input
      if (empty($input)) {
        throw new \InvalidArgumentException('Input cannot be empty');
      }

      // Get agent configuration
      $config = $this->configFactory->get('content_moderator.settings');

      // Process via ai_agents
      $result = $this->processViaAiAgents($input, $config);

      // Store execution record
      $this->storeExecution($input, $result, TRUE);

      $logger->info('Agent execution completed successfully');

      return [
        'success' => TRUE,
        'data' => $result,
        'error' => NULL,
      ];
    }
    catch (\Exception $e) {
      $logger->error('Agent execution failed: @message', [
        '@message' => $e->getMessage(),
      ]);

      // Store failed execution
      $this->storeExecution($input, NULL, FALSE, $e->getMessage());

      return [
        'success' => FALSE,
        'data' => NULL,
        'error' => $e->getMessage(),
      ];
    }
  }

  /**
   * Process input via ai_agents module.
   */
  protected function processViaAiAgents(array $input, $config): mixed {
    // TODO: Implement ai_agents integration
    // Use $this->aiAgentsManager to execute via ai_agents

    // Role: Review and moderate user-generated content for quality, spam, and compliance

    return $input;
  }

  /**
   * Store execution record.
   */
  protected function storeExecution(
    array $input,
    $result,
    bool $success,
    ?string $error = NULL
  ): void {
    $storage = $this->entityTypeManager->getStorage('content_moderator_execution');

    $execution = $storage->create([
      'input' => json_encode($input),
      'output' => json_encode($result),
      'success' => $success,
      'error' => $error,
      'created' => \Drupal::time()->getRequestTime(),
    ]);

    $execution->save();
  }

}
