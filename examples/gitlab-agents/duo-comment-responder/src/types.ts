export interface WebhookEvent {
  object_kind: string;
  project?: {
    id: string | number;
    name: string;
  };
  project_id?: string | number;
  merge_request?: {
    iid: number;
    source_branch: string;
    target_branch: string;
  };
  object_attributes?: any;
  commit?: any;
  ref?: string;
}

export interface WorkflowContext {
  event: WebhookEvent;
  variables: Record<string, any>;
  outputs: Record<string, any>;
}
