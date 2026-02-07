<?php

namespace Drupal\content_moderator\Plugin\QueueWorker;

use Drupal\Core\Queue\QueueWorkerBase;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\content_moderator\Service\AgentExecutor;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Queue worker for agent executions (fallback for non-Messenger queue).
 *
 * @QueueWorker(
 *   id = "content_moderator_execution",
 *   title = @Translation("ContentModerator agent execution"),
 *   cron = {"time" = 60}
 * )
 */
class AgentQueueWorker extends QueueWorkerBase implements ContainerFactoryPluginInterface {

  /**
   * The agent executor.
   *
   * @var \Drupal\content_moderator\Service\AgentExecutor
   */
  protected $agentExecutor;

  /**
   * {@inheritdoc}
   */
  public function __construct(array $configuration, $plugin_id, $plugin_definition, AgentExecutor $agent_executor) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
    $this->agentExecutor = $agent_executor;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->get('content_moderator.agent_executor')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function processItem($data) {
    if (empty($data['input'])) {
      throw new \Exception('Queue item missing input data');
    }

    $result = $this->agentExecutor->execute($data['input']);

    if (!$result['success']) {
      throw new \Exception($result['error']);
    }
  }

}
