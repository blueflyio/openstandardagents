<?php

namespace Drupal\Tests\content_moderator\Functional;

use Drupal\Tests\BrowserTestBase;

/**
 * Tests agent execution.
 *
 * @group content_moderator
 */
class AgentExecutionTest extends BrowserTestBase {

  /**
   * {@inheritdoc}
   */
  protected static $modules = ['content_moderator', 'ai_agents'];

  /**
   * {@inheritdoc}
   */
  protected $defaultTheme = 'stark';

  /**
   * Test dashboard.
   */
  public function testDashboard() {
    $user = $this->drupalCreateUser(['view content_moderator executions']);
    $this->drupalLogin($user);

    $this->drupalGet('admin/ossa/content_moderator/dashboard');
    $this->assertSession()->statusCodeEquals(200);
    $this->assertSession()->pageTextContains('Agent Dashboard');
    $this->assertSession()->pageTextContains('Total Executions');
  }

}
