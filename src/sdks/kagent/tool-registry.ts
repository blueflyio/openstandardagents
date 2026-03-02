/**
 * kagent.dev built-in tool registry
 * Canonical mapping of kagent tool categories and toolNames for validation and docs.
 * @see https://kagent.dev/tools
 */

export const KAGENT_TOOL_CATEGORIES = [
  'kubernetes',
  'prometheus',
  'istio',
  'helm',
  'argo',
  'grafana',
  'cilium',
  'documentation',
  'other',
] as const;

export type KAgentToolCategory = (typeof KAGENT_TOOL_CATEGORIES)[number];

/** Built-in kagent tool names by category (snake_case as in kagent MCP) */
export const KAGENT_BUILTIN_TOOL_NAMES: Record<KAgentToolCategory, string[]> = {
  kubernetes: [
    'k8s_annotate_resource',
    'k8s_apply_manifest',
    'k8s_check_service_connectivity',
    'k8s_create_resource',
    'k8s_create_resource_from_url',
    'k8s_delete_resource',
    'k8s_describe_resource',
    'k8s_execute_command',
    'k8s_get_available_api_resources',
    'k8s_get_cluster_configuration',
    'k8s_get_events',
    'k8s_get_pod_logs',
    'k8s_get_resources',
    'k8s_get_resource_yaml',
    'k8s_label_resource',
    'k8s_patch_resource',
    'k8s_remove_annotation',
    'k8s_remove_label',
    'k8s_rollout',
    'k8s_scale',
    'k8s_generate_resource_tool',
  ],
  prometheus: [
    'alertmanagers_tool',
    'alerts_tool',
    'build_info_tool',
    'clean_tombstones_tool',
    'create_snapshot_tool',
    'delete_series_tool',
    'label_names_tool',
    'label_values_tool',
    'metadata_tool',
    'query_range_tool',
    'query_tool',
    'rules_tool',
    'runtime_info_tool',
    'series_query_tool',
    'status_config_tool',
    'status_flags_tool',
    'target_metadata_tool',
    'targets_tool',
    'tsdb_status_tool',
    'wal_replay_tool',
    'generate_promql_tool',
  ],
  istio: [
    'istio_get_workloads',
    'istio_get_workload_detail',
    'istio_get_services',
    'istio_get_virtual_services',
    'istio_get_destination_rules',
    'istio_get_gateways',
    'istio_get_peer_authentication',
    'istio_get_authorization_policies',
    'istio_get_sidecars',
    'istio_analyze',
    'istio_inject',
    'istio_remove',
    'istio_dashboard',
  ],
  helm: [
    'helm_list_releases',
    'helm_get_release',
    'helm_get_manifest',
    'helm_get_values',
    'helm_get_history',
    'helm_rollback',
  ],
  argo: [
    'argo_list_workflows',
    'argo_get_workflow',
    'argo_submit_workflow',
    'argo_list_applications',
    'argo_get_application',
    'argo_sync_application',
    'argo_list_projects',
  ],
  grafana: [
    'grafana_list_dashboards',
    'grafana_get_dashboard',
    'grafana_list_data_sources',
    'grafana_query',
  ],
  cilium: [
    'cilium_status',
    'cilium_get_identity',
    'cilium_get_endpoints',
    'cilium_get_services',
    'cilium_get_policy',
    'cilium_get_cluster_mesh',
    // ... many more; subset for reference
  ],
  documentation: ['documentation_search', 'documentation_manage'],
  other: [],
};

/** All known built-in tool names (flat set for validation) */
export const KAGENT_ALL_BUILTIN_TOOL_NAMES: Set<string> = new Set(
  (Object.values(KAGENT_BUILTIN_TOOL_NAMES) as string[][]).flat()
);

/**
 * Optional: map OSSA capability-style names to kagent toolNames for convenience.
 * When manifest uses capabilities: [get_pods, get_logs] we can suggest or map to k8s_* names.
 */
export const OSSA_CAPABILITY_TO_KAGENT_TOOL: Record<string, string> = {
  get_pods: 'k8s_get_resources',
  get_logs: 'k8s_get_pod_logs',
  get_events: 'k8s_get_events',
  describe_resource: 'k8s_describe_resource',
  get_metrics: 'prometheus_query_tool',
  apply_manifest: 'k8s_apply_manifest',
  delete_resource: 'k8s_delete_resource',
  get_available_api_resources: 'k8s_get_available_api_resources',
  get_resources: 'k8s_get_resources',
  get_pod_logs: 'k8s_get_pod_logs',
  execute_command: 'k8s_execute_command',
  rollout: 'k8s_rollout',
  scale: 'k8s_scale',
};

/**
 * Check if a tool name is a known kagent built-in (may be from custom MCP)
 */
export function isKnownKagentBuiltinTool(name: string): boolean {
  return KAGENT_ALL_BUILTIN_TOOL_NAMES.has(name);
}

/**
 * Resolve OSSA capability to kagent tool name if mapped
 */
export function resolveCapabilityToKagentTool(
  capability: string
): string | undefined {
  return OSSA_CAPABILITY_TO_KAGENT_TOOL[capability];
}
