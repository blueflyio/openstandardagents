<?php

namespace Drupal\Tests\content_moderator\Kernel;

use Drupal\KernelTests\KernelTestBase;

/**
 * Tests agent plugin.
 *
 * @group content_moderator
 */
class AgentPluginTest extends KernelTestBase {

  /**
   * {@inheritdoc}
   */
  protected static $modules = ['content_moderator', 'ai_agents', 'user', 'system'];

  /**
   * Test plugin discovery.
   */
  public function testPluginDiscovery() {
    $plugin_manager = \Drupal::service('plugin.manager.ai_agent');
    $plugins = $plugin_manager->getDefinitions();

    $this->assertArrayHasKey('content_moderator', $plugins);
    $this->assertEquals('ContentModerator', $plugins['content_moderator']['class']);
  }

  /**
   * Test plugin execution.
   */
  public function testPluginExecution() {
    $plugin_manager = \Drupal::service('plugin.manager.ai_agent');
    $plugin = $plugin_manager->createInstance('content_moderator');

    $result = $plugin->execute(['test' => 'data']);

    $this->assertIsArray($result);
    $this->assertArrayHasKey('success', $result);
  }

}
