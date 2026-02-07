<?php

namespace Drupal\content_moderator\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Controller for agent dashboard and execution views.
 */
class AgentController extends ControllerBase {

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('entity_type.manager')
    );
  }

  /**
   * Constructs a new AgentController.
   */
  public function __construct(EntityTypeManagerInterface $entity_type_manager) {
    $this->entityTypeManager = $entity_type_manager;
  }

  /**
   * Agent dashboard page.
   */
  public function dashboard() {
    $storage = $this->entityTypeManager->getStorage('content_moderator_execution');

    // Get execution statistics
    $query = $storage->getQuery()
      ->accessCheck(FALSE);
    $total = $query->count()->execute();

    $query = $storage->getQuery()
      ->condition('success', TRUE)
      ->accessCheck(FALSE);
    $successful = $query->count()->execute();

    // Get recent executions
    $query = $storage->getQuery()
      ->sort('created', 'DESC')
      ->range(0, 10)
      ->accessCheck(FALSE);
    $execution_ids = $query->execute();
    $executions = $storage->loadMultiple($execution_ids);

    return [
      '#theme' => 'agent_status_dashboard',
      '#stats' => [
        'total' => $total,
        'successful' => $successful,
        'failed' => $total - $successful,
        'success_rate' => $total > 0 ? round(($successful / $total) * 100, 2) : 0,
      ],
      '#recent_executions' => $executions,
    ];
  }

  /**
   * View execution page.
   */
  public function viewExecution($content_moderator_execution) {
    return [
      '#theme' => 'agent_execution_result',
      '#execution' => $content_moderator_execution,
      '#result' => json_decode($content_moderator_execution->get('output')->value ?? '{}', TRUE),
    ];
  }

}
