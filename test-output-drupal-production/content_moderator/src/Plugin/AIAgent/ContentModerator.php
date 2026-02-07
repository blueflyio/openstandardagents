<?php

namespace Drupal\content_moderator\Plugin\AIAgent;

use Drupal\ai_agents\Plugin\AIAgentPluginBase;
use Drupal\content_moderator\Service\AgentExecutor;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * AI-powered content moderation agent for Drupal with ai_agents integration
 *
 * Integrates with ai_agents 1.3.x-dev module.
 *
 * @AIAgent(
 *   id = "content_moderator",
 *   label = @Translation("content_moderator"),
 *   description = @Translation("AI-powered content moderation agent for Drupal with ai_agents integration"),
 *   ossa_version = "1.0.0",
 *   capabilities = {"content-analysis", "spam-detection", "sentiment-analysis", "auto-moderation", "toxicity-detection"}
 * )
 */
class ContentModerator extends AIAgentPluginBase implements ContainerFactoryPluginInterface {

  /**
   * The agent executor service.
   *
   * @var \Drupal\content_moderator\Service\AgentExecutor
   */
  protected $agentExecutor;

  /**
   * {@inheritdoc}
   */
  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    AgentExecutor $agent_executor
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
    $this->agentExecutor = $agent_executor;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(
    ContainerInterface $container,
    array $configuration,
    $plugin_id,
    $plugin_definition
  ) {
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
  public function execute(array $input): array {
    return $this->agentExecutor->execute($input);
  }

  /**
   * {@inheritdoc}
   */
  public function getCapabilities(): array {
    return $this->pluginDefinition['capabilities'] ?? [];
  }

  /**
   * {@inheritdoc}
   */
  public function validateInput(array $input): array {
    $errors = [];

    // Add input validation logic here
    if (empty($input)) {
      $errors[] = $this->t('Input cannot be empty');
    }

    return $errors;
  }

}
