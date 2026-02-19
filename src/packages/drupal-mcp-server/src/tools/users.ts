/**
 * User Management Tools (3 tools)
 * User CRUD operations
 */

import { DrupalClient } from '../client/drupal-client.js';
import { UserCreateInput, UserUpdateInput, DrupalUser, DrupalResponse } from '../types/drupal.js';

export class UserTools {
  constructor(private client: DrupalClient) {}

  /**
   * Create a new Drupal user
   */
  async createUser(input: UserCreateInput): Promise<DrupalUser> {
    const userData: any = {
      name: [{ value: input.name }],
      mail: [{ value: input.mail }],
      pass: [{ value: input.pass }],
      status: [{ value: input.status ?? true }],
    };

    if (input.roles && input.roles.length > 0) {
      userData.roles = input.roles.map((role) => ({ target_id: role }));
    }

    const response = await this.client.post<DrupalResponse<DrupalUser>>('/user/register', userData);
    return response.data;
  }

  /**
   * Update a Drupal user
   */
  async updateUser(input: UserUpdateInput): Promise<DrupalUser> {
    const userData: any = {};

    if (input.name) {
      userData.name = [{ value: input.name }];
    }

    if (input.mail) {
      userData.mail = [{ value: input.mail }];
    }

    if (input.pass) {
      userData.pass = [{ value: input.pass }];
    }

    if (input.status !== undefined) {
      userData.status = [{ value: input.status }];
    }

    if (input.roles) {
      userData.roles = input.roles.map((role) => ({ target_id: role }));
    }

    const response = await this.client.patch<DrupalResponse<DrupalUser>>(
      `/user/${input.uid}`,
      userData
    );

    return response.data;
  }

  /**
   * Get a Drupal user by ID
   */
  async getUser(uid: string): Promise<DrupalUser> {
    const response = await this.client.get<DrupalResponse<DrupalUser>>(`/user/${uid}`);
    return response.data;
  }
}

// Tool definitions for MCP
export const userToolDefinitions = [
  {
    name: 'drupal_create_user',
    description: 'Create a new Drupal user account',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Username',
        },
        mail: {
          type: 'string',
          description: 'Email address',
        },
        pass: {
          type: 'string',
          description: 'Password',
        },
        status: {
          type: 'boolean',
          description: 'Active status (true = active, false = blocked)',
          default: true,
        },
        roles: {
          type: 'array',
          items: { type: 'string' },
          description: 'Role machine names to assign',
        },
      },
      required: ['name', 'mail', 'pass'],
    },
  },
  {
    name: 'drupal_update_user',
    description: 'Update an existing Drupal user account',
    inputSchema: {
      type: 'object',
      properties: {
        uid: {
          type: 'string',
          description: 'User ID to update',
        },
        name: {
          type: 'string',
          description: 'New username',
        },
        mail: {
          type: 'string',
          description: 'New email address',
        },
        pass: {
          type: 'string',
          description: 'New password',
        },
        status: {
          type: 'boolean',
          description: 'Active status',
        },
        roles: {
          type: 'array',
          items: { type: 'string' },
          description: 'Role machine names',
        },
      },
      required: ['uid'],
    },
  },
  {
    name: 'drupal_get_user',
    description: 'Get Drupal user details by ID',
    inputSchema: {
      type: 'object',
      properties: {
        uid: {
          type: 'string',
          description: 'User ID to retrieve',
        },
      },
      required: ['uid'],
    },
  },
];
