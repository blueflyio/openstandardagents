<?php

namespace Drupal\Tests\content_moderator\Functional;

use Drupal\Tests\BrowserTestBase;

/**
 * Tests admin UI.
 *
 * @group content_moderator
 */
class AdminUITest extends BrowserTestBase {

  /**
   * {@inheritdoc}
   */
  protected static $modules = ['content_moderator', 'ai_agents'];

  /**
   * {@inheritdoc}
   */
  protected $defaultTheme = 'stark';

  /**
   * Test settings form.
   */
  public function testSettingsForm() {
    $admin_user = $this->drupalCreateUser(['administer content_moderator']);
    $this->drupalLogin($admin_user);

    $this->drupalGet('admin/config/ossa/content_moderator');
    $this->assertSession()->statusCodeEquals(200);
    $this->assertSession()->pageTextContains('content_moderator settings');

    // Test form submission
    $edit = [
      'enabled' => TRUE,
      'timeout' => 600,
    ];
    $this->submitForm($edit, 'Save configuration');
    $this->assertSession()->pageTextContains('The configuration options have been saved.');
  }

  /**
   * Test execute form.
   */
  public function testExecuteForm() {
    $user = $this->drupalCreateUser(['execute content_moderator']);
    $this->drupalLogin($user);

    $this->drupalGet('admin/ossa/content_moderator/execute');
    $this->assertSession()->statusCodeEquals(200);
    $this->assertSession()->pageTextContains('Execute content_moderator agent');

    // Test form submission
    $edit = [
      'input' => '{"test": "data"}',
      'async' => FALSE,
    ];
    $this->submitForm($edit, 'Execute');
  }

}
