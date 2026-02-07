<?php

namespace Drupal\Tests\content_moderator\Kernel;

use Drupal\KernelTests\KernelTestBase;

/**
 * Tests agent execution entity.
 *
 * @group content_moderator
 */
class EntityStorageTest extends KernelTestBase {

  /**
   * {@inheritdoc}
   */
  protected static $modules = ['content_moderator', 'user', 'system'];

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();
    $this->installEntitySchema('content_moderator_execution');
    $this->installEntitySchema('user');
  }

  /**
   * Test entity creation.
   */
  public function testEntityCreation() {
    $storage = \Drupal::entityTypeManager()->getStorage('content_moderator_execution');

    $execution = $storage->create([
      'input' => json_encode(['test' => 'data']),
      'output' => json_encode(['result' => 'success']),
      'success' => TRUE,
    ]);

    $execution->save();

    $this->assertNotNull($execution->id());
    $this->assertTrue($execution->get('success')->value);
  }

  /**
   * Test entity loading.
   */
  public function testEntityLoading() {
    $storage = \Drupal::entityTypeManager()->getStorage('content_moderator_execution');

    $execution = $storage->create([
      'input' => json_encode(['test' => 'data']),
      'success' => FALSE,
      'error' => 'Test error',
    ]);
    $execution->save();

    $loaded = $storage->load($execution->id());

    $this->assertEquals($execution->id(), $loaded->id());
    $this->assertFalse($loaded->get('success')->value);
    $this->assertEquals('Test error', $loaded->get('error')->value);
  }

}
