<?php

namespace Drupal\content_moderator\MessageHandler;

use Drupal\content_moderator\Message\AgentExecutionMessage;
use Drupal\content_moderator\Service\AgentExecutor;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Symfony\Component\Messenger\Handler\MessageHandlerInterface;

/**
 * Handles agent execution messages via Symfony Messenger.
 */
class AgentExecutionHandler implements MessageHandlerInterface {

  /**
   * The agent executor.
   *
   * @var \Drupal\content_moderator\Service\AgentExecutor
   */
  protected $agentExecutor;

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * The logger factory.
   *
   * @var \Drupal\Core\Logger\LoggerChannelFactoryInterface
   */
  protected $loggerFactory;

  /**
   * Constructs a new AgentExecutionHandler.
   */
  public function __construct(
    AgentExecutor $agent_executor,
    EntityTypeManagerInterface $entity_type_manager,
    LoggerChannelFactoryInterface $logger_factory
  ) {
    $this->agentExecutor = $agent_executor;
    $this->entityTypeManager = $entity_type_manager;
    $this->loggerFactory = $logger_factory;
  }

  /**
   * {@inheritdoc}
   */
  public function __invoke(AgentExecutionMessage $message) {
    $logger = $this->loggerFactory->get('content_moderator');

    try {
      $logger->info('Processing agent execution message: @id', [
        '@id' => $message->getExecutionId(),
      ]);

      // Execute agent
      $result = $this->agentExecutor->execute($message->getInput());

      // Update execution entity
      $storage = $this->entityTypeManager->getStorage('content_moderator_execution');
      $execution = $storage->load($message->getExecutionId());

      if ($execution) {
        $execution->set('output', json_encode($result['data']));
        $execution->set('success', $result['success']);
        $execution->set('error', $result['error']);
        $execution->set('completed', \Drupal::time()->getRequestTime());
        $execution->save();
      }

      $logger->info('Agent execution message processed successfully');
    }
    catch (\Exception $e) {
      $logger->error('Failed to process agent execution message: @error', [
        '@error' => $e->getMessage(),
      ]);

      // Re-throw to trigger retry
      throw $e;
    }
  }

}
