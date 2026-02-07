<?php

namespace Drupal\content_moderator\Entity;

use Drupal\Core\Entity\ContentEntityBase;
use Drupal\Core\Entity\EntityTypeInterface;
use Drupal\Core\Field\BaseFieldDefinition;
use Drupal\content_moderator\Entity\AgentExecutionInterface;

/**
 * Defines the agent execution entity.
 *
 * @ContentEntityType(
 *   id = "content_moderator_execution",
 *   label = @Translation("ContentModerator execution"),
 *   handlers = {
 *     "view_builder" = "Drupal\content_moderator\Entity\Handler\AgentExecutionViewBuilder",
 *     "list_builder" = "Drupal\Core\Entity\EntityListBuilder",
 *     "views_data" = "Drupal\views\EntityViewsData",
 *   },
 *   base_table = "content_moderator_execution",
 *   admin_permission = "administer content_moderator",
 *   entity_keys = {
 *     "id" = "id",
 *     "uuid" = "uuid",
 *     "uid" = "uid",
 *     "created" = "created",
 *   },
 * )
 */
class AgentExecution extends ContentEntityBase implements AgentExecutionInterface {

  /**
   * {@inheritdoc}
   */
  public static function baseFieldDefinitions(EntityTypeInterface $entity_type) {
    $fields = parent::baseFieldDefinitions($entity_type);

    $fields['uid'] = BaseFieldDefinition::create('entity_reference')
      ->setLabel(t('User'))
      ->setDescription(t('The user who triggered the execution.'))
      ->setSetting('target_type', 'user')
      ->setDefaultValueCallback('Drupal\content_moderator\Entity\AgentExecution::getCurrentUserId');

    $fields['input'] = BaseFieldDefinition::create('string_long')
      ->setLabel(t('Input'))
      ->setDescription(t('The input data for the execution.'));

    $fields['output'] = BaseFieldDefinition::create('string_long')
      ->setLabel(t('Output'))
      ->setDescription(t('The output result from the execution.'));

    $fields['success'] = BaseFieldDefinition::create('boolean')
      ->setLabel(t('Success'))
      ->setDescription(t('Whether the execution was successful.'))
      ->setDefaultValue(FALSE);

    $fields['error'] = BaseFieldDefinition::create('string_long')
      ->setLabel(t('Error'))
      ->setDescription(t('Error message if execution failed.'));

    $fields['created'] = BaseFieldDefinition::create('created')
      ->setLabel(t('Created'))
      ->setDescription(t('The time the execution was created.'));

    $fields['completed'] = BaseFieldDefinition::create('timestamp')
      ->setLabel(t('Completed'))
      ->setDescription(t('The time the execution completed.'));

    return $fields;
  }

  /**
   * Default value callback for 'uid' base field definition.
   */
  public static function getCurrentUserId() {
    return [\Drupal::currentUser()->id()];
  }

}
