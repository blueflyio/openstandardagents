<?php

namespace Drupal\content_moderator\Message;

/**
 * Agent execution message for Symfony Messenger.
 */
class AgentExecutionMessage {

  /**
   * The execution input.
   *
   * @var array
   */
  private $input;

  /**
   * The execution ID.
   *
   * @var string
   */
  private $executionId;

  /**
   * The user ID who triggered execution.
   *
   * @var int
   */
  private $userId;

  /**
   * Constructs a new AgentExecutionMessage.
   */
  public function __construct(array $input, string $execution_id, int $user_id) {
    $this->input = $input;
    $this->executionId = $execution_id;
    $this->userId = $user_id;
  }

  /**
   * Get the input.
   */
  public function getInput(): array {
    return $this->input;
  }

  /**
   * Get the execution ID.
   */
  public function getExecutionId(): string {
    return $this->executionId;
  }

  /**
   * Get the user ID.
   */
  public function getUserId(): int {
    return $this->userId;
  }

}
