/**
 * Drupal Type Definitions
 * Complete types for Drupal REST and JSON:API operations
 */

export interface AuthConfig {
  type: 'oauth2' | 'api-key' | 'jwt';
  baseUrl: string;
  credentials: {
    clientId?: string;
    clientSecret?: string;
    apiKey?: string;
    token?: string;
    username?: string;
    password?: string;
  };
}

export interface DrupalNode {
  nid?: string;
  type: string;
  title: string;
  body?: {
    value: string;
    format?: string;
  };
  status?: boolean;
  uid?: string;
  created?: number;
  changed?: number;
  [key: string]: any;
}

export interface DrupalEntity {
  id?: string;
  type: string;
  bundle?: string;
  attributes?: Record<string, any>;
  relationships?: Record<string, any>;
}

export interface DrupalUser {
  uid?: string;
  name: string;
  mail: string;
  pass?: string;
  status?: boolean;
  roles?: string[];
  created?: number;
  [key: string]: any;
}

export interface DrupalView {
  view_id: string;
  display_id?: string;
  args?: string[];
  filters?: Record<string, any>;
  page?: number;
  items_per_page?: number;
}

export interface DrupalConfig {
  name: string;
  data?: Record<string, any>;
}

export interface DrupalModule {
  name: string;
  type: string;
  status: boolean;
  version?: string;
  description?: string;
}

export interface DrupalCacheTag {
  tags: string[];
}

export interface DrupalResponse<T = any> {
  data: T;
  meta?: Record<string, any>;
  links?: Record<string, string>;
  included?: any[];
}

export interface DrupalError {
  status: number;
  title: string;
  detail: string;
  source?: {
    pointer?: string;
    parameter?: string;
  };
}

export interface NodeCreateInput {
  type: string;
  title: string;
  body?: string;
  status?: boolean;
  uid?: string;
  [key: string]: any;
}

export interface NodeUpdateInput {
  nid: string;
  title?: string;
  body?: string;
  status?: boolean;
  [key: string]: any;
}

export interface EntityQueryInput {
  entity_type: string;
  bundle?: string;
  filters?: Record<string, any>;
  sort?: Record<string, 'ASC' | 'DESC'>;
  limit?: number;
  offset?: number;
}

export interface UserCreateInput {
  name: string;
  mail: string;
  pass: string;
  status?: boolean;
  roles?: string[];
}

export interface UserUpdateInput {
  uid: string;
  name?: string;
  mail?: string;
  pass?: string;
  status?: boolean;
  roles?: string[];
}

export interface ViewExecuteInput {
  view_id: string;
  display_id?: string;
  args?: string[];
  filters?: Record<string, any>;
  page?: number;
  items_per_page?: number;
}

export interface ConfigGetInput {
  name: string;
}

export interface ConfigSetInput {
  name: string;
  data: Record<string, any>;
}

export interface ModuleListInput {
  type?: 'module' | 'theme';
  status?: boolean;
}

export interface ModuleEnableInput {
  modules: string[];
}

export interface ModuleDisableInput {
  modules: string[];
}

export interface CacheClearInput {
  cid?: string;
  bin?: string;
  tags?: string[];
}

export interface CacheRebuildInput {
  rebuild_theme_registry?: boolean;
  rebuild_menu?: boolean;
  rebuild_node_access?: boolean;
}
