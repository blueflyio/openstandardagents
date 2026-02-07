<?php

namespace Drupal\Tests\content_moderator\Unit;

use Drupal\Tests\UnitTestCase;
use Drupal\content_moderator\MessageHandler\AgentExecutionHandler;
use Drupal\content_moderator\Message\AgentExecutionMessage;

/**
 * @coversDefaultClass \Drupal\content_moderator\MessageHandler\AgentExecutionHandler
 * @group content_moderator
 */
class MessageHandlerTest extends UnitTestCase {

  /**
   * Test message handling.
   *
   * @covers ::__invoke
   */
  public function testInvoke() {
    $agent_executor = $this->createMock('Drupal\content_moderator\Service\AgentExecutor');
    $entity_type_manager = $this->createMock('Drupal\Core\Entity\EntityTypeManagerInterface');
    $logger_factory = $this->createMock('Drupal\Core\Logger\LoggerChannelFactoryInterface');

    $handler = new AgentExecutionHandler(
      $agent_executor,
      $entity_type_manager,
      $logger_factory
    );

    $message = new AgentExecutionMessage(['test' => 'data'], 'exec-123', 1);

    // Should not throw exception
    $handler($message);

    $this->assertTrue(TRUE);
  }

}
