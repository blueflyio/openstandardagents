/**
 * Twig Renderer — Render Drupal templates with proper Twig filters.
 *
 * Uses twig-drupal-filters to provide Drupal's custom Twig filters:
 * |t, |trans, |clean_class, |safe_join, |render, |without, |placeholder, etc.
 *
 * This replaces string concatenation for generating .html.twig files,
 * producing templates that Drupal developers will recognize as correct.
 */

import Twig from 'twig';

// Register Drupal filters
let filtersRegistered = false;

function ensureFiltersRegistered(): void {
  if (filtersRegistered) return;

  try {
    // twig-drupal-filters registers itself onto the Twig instance
    require('twig-drupal-filters')(Twig);
    filtersRegistered = true;
  } catch {
    // Fallback: register minimal filters if twig-drupal-filters fails
    const twigInstance = Twig as unknown as { extendFilter?: (name: string, fn: (val: string) => string) => void };
    if (twigInstance.extendFilter) {
      twigInstance.extendFilter('t', (val: string) => val);
      twigInstance.extendFilter('trans', (val: string) => val);
      twigInstance.extendFilter('clean_class', (val: string) => val.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase());
      twigInstance.extendFilter('render', (val: string) => val);
      filtersRegistered = true;
    }
  }
}

/**
 * Render a Twig template string with Drupal filters available.
 */
export function renderTwigTemplate(
  template: string,
  context: Record<string, unknown> = {},
): string {
  ensureFiltersRegistered();

  const twigTemplate = Twig.twig({ data: template });
  return twigTemplate.render(context);
}

/**
 * Generate a Drupal module's default template file.
 * Uses real Twig syntax with Drupal filters.
 */
export function generateAgentTemplate(agentName: string, machineName: string): string {
  return `{#
/**
 * @file
 * Default theme implementation for ${agentName} agent display.
 *
 * Available variables:
 * - agent: The OSSA agent entity.
 * - content: The rendered content fields.
 * - attributes: HTML attributes for the containing element.
 *
 * @see template_preprocess_${machineName}()
 *
 * @ingroup themeable
 */
#}
<article{{ attributes.addClass('${machineName}') }}>
  {% if label %}
    <h2{{ title_attributes }}>
      <a href="{{ url }}" rel="bookmark">{{ label }}</a>
    </h2>
  {% endif %}

  <div{{ content_attributes.addClass('${machineName}__content') }}>
    {% if content.field_trust_tier %}
      <div class="{{ '${machineName}__trust-tier'|clean_class }}">
        {{ content.field_trust_tier }}
      </div>
    {% endif %}

    {{ content|without('field_trust_tier') }}
  </div>
</article>
`;
}

/**
 * Generate a Drupal config schema YAML for an agent settings form.
 */
export function generateConfigSchema(machineName: string): string {
  return `${machineName}.settings:
  type: config_object
  label: '${machineName} settings'
  mapping:
    enabled:
      type: boolean
      label: 'Enable agent'
    trust_tier:
      type: string
      label: 'Trust tier'
    api_endpoint:
      type: string
      label: 'API endpoint URL'
`;
}
