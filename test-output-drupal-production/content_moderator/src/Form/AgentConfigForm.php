<?php

namespace Drupal\content_moderator\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Configure content_moderator settings.
 */
class AgentConfigForm extends ConfigFormBase {

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    return ['content_moderator.settings'];
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'content_moderator_settings';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config('content_moderator.settings');

    $form['enabled'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Enable agent'),
      '#default_value' => $config->get('enabled') ?? TRUE,
    ];

    $form['async_execution'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Enable async execution via Symfony Messenger'),
      '#default_value' => $config->get('async_execution') ?? TRUE,
    ];

    $form['timeout'] = [
      '#type' => 'number',
      '#title' => $this->t('Execution timeout (seconds)'),
      '#default_value' => $config->get('timeout') ?? 300,
      '#min' => 1,
      '#max' => 3600,
    ];

    $form['retry_attempts'] = [
      '#type' => 'number',
      '#title' => $this->t('Retry attempts on failure'),
      '#default_value' => $config->get('retry_attempts') ?? 3,
      '#min' => 0,
      '#max' => 10,
    ];

    return parent::buildForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $this->config('content_moderator.settings')
      ->set('enabled', $form_state->getValue('enabled'))
      ->set('async_execution', $form_state->getValue('async_execution'))
      ->set('timeout', $form_state->getValue('timeout'))
      ->set('retry_attempts', $form_state->getValue('retry_attempts'))
      ->save();

    parent::submitForm($form, $form_state);
  }

}
