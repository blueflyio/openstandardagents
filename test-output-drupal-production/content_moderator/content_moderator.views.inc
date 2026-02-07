<?php

/**
 * Implements hook_views_data().
 */
function content_moderator_views_data() {
  $data = [];

  $data['content_moderator_execution']['table']['group'] = t('content_moderator execution');
  $data['content_moderator_execution']['table']['base'] = [
    'field' => 'id',
    'title' => t('content_moderator execution'),
    'help' => t('Agent execution records'),
  ];

  return $data;
}
