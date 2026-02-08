<?php

namespace Drupal\content_moderator\Form;

use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\content_moderator\Service\AgentExecutor;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Form to execute the agent.
 */
class AgentExecuteForm extends FormBase {

  /**
   * The agent executor.
   *
   * @var \Drupal\content_moderator\Service\AgentExecutor
   */
  protected $agentExecutor;

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('content_moderator.agent_executor')
    );
  }

  /**
   * Constructs a new AgentExecuteForm.
   */
  public function __construct(AgentExecutor $agent_executor) {
    $this->agentExecutor = $agent_executor;
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'content_moderator_execute';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $form['input'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Input'),
      '#description' => $this->t('Enter the input for the agent. Use JSON format for structured data.'),
      '#required' => TRUE,
      '#rows' => 10,
    ];

    $form['async'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Execute asynchronously'),
      '#description' => $this->t('Queue the execution for background processing.'),
      '#default_value' => TRUE,
    ];

    $form['actions'] = [
      '#type' => 'actions',
    ];

    $form['actions']['submit'] = [
      '#type' => 'submit',
      '#value' => $this->t('Execute'),
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state) {
    $input = $form_state->getValue('input');

    // Try to decode as JSON
    $decoded = json_decode($input, TRUE);
    if (json_last_error() !== JSON_ERROR_NONE) {
      $form_state->setErrorByName('input', $this->t('Invalid JSON input'));
    }
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $input = json_decode($form_state->getValue('input'), TRUE);
    $async = $form_state->getValue('async');

    if ($async) {
      // Queue for async execution
      $queue = \Drupal::queue('content_moderator_execution');
      $queue->createItem(['input' => $input]);

      $this->messenger()->addStatus($this->t('Agent execution queued for background processing.'));
    }
    else {
      // Execute synchronously
      $result = $this->agentExecutor->execute($input);

      if ($result['success']) {
        $this->messenger()->addStatus($this->t('Agent executed successfully.'));
        // Display result
        $this->messenger()->addStatus('<pre>' . json_encode($result['data'], JSON_PRETTY_PRINT) . '</pre>');
      }
      else {
        $this->messenger()->addError($this->t('Agent execution failed: @error', [
          '@error' => $result['error'],
        ]));
      }
    }

    $form_state->setRedirect('content_moderator.dashboard');
  }

}
