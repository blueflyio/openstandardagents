<?php

namespace Drupal\Tests\content_moderator\Unit;

use Drupal\Tests\UnitTestCase;
use Drupal\content_moderator\Service\AgentExecutor;

/**
 * @coversDefaultClass \Drupal\content_moderator\Service\AgentExecutor
 * @group content_moderator
 */
class AgentExecutorTest extends UnitTestCase {

  /**
   * Test execute method.
   *
   * @covers ::execute
   */
  public function testExecute() {
    // Mock dependencies
    $logger_factory = $this->createMock('Drupal\Core\Logger\LoggerChannelFactoryInterface');
    $config_factory = $this->createMock('Drupal\Core\Config\ConfigFactoryInterface');
    $entity_type_manager = $this->createMock('Drupal\Core\Entity\EntityTypeManagerInterface');
    $ai_agents_manager = $this->createMock('Drupal\ai_agents\AiAgentsManagerInterface');

    $executor = new AgentExecutor(
      $logger_factory,
      $config_factory,
      $entity_type_manager,
      $ai_agents_manager
    );

    // Test execution
    $input = ['test' => 'data'];
    $result = $executor->execute($input);

    $this->assertIsArray($result);
    $this->assertArrayHasKey('success', $result);
    $this->assertArrayHasKey('data', $result);
  }

}
