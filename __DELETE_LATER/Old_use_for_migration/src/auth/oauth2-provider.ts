/**
 * OAuth2 Provider with PKCE Support
 * OSSA v0.1.8 compliant OAuth2 authorization code flow implementation
 */

import { randomBytes, createHash } from 'crypto';
import { URLSearchParams } from 'url';
import {
  OAuth2Config,
  OAuth2TokenResponse,
  OAuth2AuthorizeParams,
  OAuth2TokenParams,
  AuthenticatedRequest,
  AuthenticatedUser,
  AuthenticationError,
  AuthorizationError,
  AuthMiddleware
} from './types.js';
import { Response, NextFunction } from 'express';

export interface OAuth2State {
  state: string;
  codeVerifier: string;
  codeChallenge: string;
  redirectUri: string;
  scopes: string[];
  nonce?: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface OAuth2AuthorizationCode {
  code: string;
  clientId: string;
  userId: string;
  scopes: string[];
  redirectUri: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  nonce?: string;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
}

export interface OAuth2AccessToken {
  accessToken: string;
  refreshToken?: string;
  tokenType: 'Bearer';
  expiresIn: number;
  scopes: string[];
  clientId: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  revoked: boolean;
}

export class OAuth2Provider {
  private states: Map<string, OAuth2State> = new Map();
  private authorizationCodes: Map<string, OAuth2AuthorizationCode> = new Map();
  private accessTokens: Map<string, OAuth2AccessToken> = new Map();
  private refreshTokens: Map<string, OAuth2AccessToken> = new Map();

  constructor(private config: OAuth2Config) {
    this.validateConfig();
    this.startCleanupTimer();
  }

  /**
   * Generate authorization URL with PKCE
   */
  generateAuthorizationUrl(
    scopes?: string[],
    redirectUri?: string,
    additionalParams?: Record<string, string>
  ): { url: string; state: string; codeVerifier: string } {
    const state = this.generateState();
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(codeVerifier);
    const nonce = this.config.nonce ? this.generateNonce() : undefined;

    const params: OAuth2AuthorizeParams = {
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: redirectUri || this.config.redirectUri,
      scope: (scopes || this.config.scopes).join(' '),
      state: this.config.state ? state : undefined,
      code_challenge: this.config.pkce ? codeChallenge : undefined,
      code_challenge_method: this.config.pkce ? 'S256' : undefined,
      nonce
    } as any;

    // Remove undefined values
    Object.keys(params).forEach(key => {
      if (params[key as keyof OAuth2AuthorizeParams] === undefined) {
        delete params[key as keyof OAuth2AuthorizeParams];
      }
    });

    // Add additional parameters
    if (additionalParams) {
      Object.assign(params, additionalParams);
    }

    const searchParams = new URLSearchParams(params as any);
    const url = `${this.config.authorizationUrl}?${searchParams.toString()}`;

    // Store state for validation
    if (this.config.state || this.config.pkce) {
      const stateData: OAuth2State = {
        state,
        codeVerifier,
        codeChallenge,
        redirectUri: redirectUri || this.config.redirectUri,
        scopes: scopes || this.config.scopes,
        nonce,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      };
      this.states.set(state, stateData);
    }

    return { url, state, codeVerifier };
  }

  /**
   * Handle authorization callback and exchange code for tokens
   */
  async handleCallback(
    code: string,
    state?: string,
    redirectUri?: string
  ): Promise<OAuth2TokenResponse> {
    let stateData: OAuth2State | undefined;

    // Validate state parameter
    if (this.config.state && state) {
      stateData = this.states.get(state);
      if (!stateData) {
        throw new AuthorizationError('Invalid state parameter', 'INVALID_STATE');
      }
      
      if (stateData.expiresAt < new Date()) {
        this.states.delete(state);
        throw new AuthorizationError('State parameter expired', 'STATE_EXPIRED');
      }
    }

    // Prepare token exchange parameters
    const tokenParams: OAuth2TokenParams = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri || stateData?.redirectUri || this.config.redirectUri,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret
    };

    // Add PKCE code verifier if enabled
    if (this.config.pkce && stateData) {
      tokenParams.code_verifier = stateData.codeVerifier;
    }

    try {
      const response = await this.exchangeCodeForTokens(tokenParams);
      
      // Clean up used state
      if (state && stateData) {
        this.states.delete(state);
      }

      return response;
    } catch (error) {
      throw new AuthenticationError(
        'Failed to exchange authorization code for tokens',
        'TOKEN_EXCHANGE_FAILED',
        400,
        { originalError: error }
      );
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<OAuth2TokenResponse> {
    const tokenData = this.refreshTokens.get(refreshToken);
    if (!tokenData || tokenData.revoked || tokenData.expiresAt < new Date()) {
      throw new AuthenticationError('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }

    const tokenParams: OAuth2TokenParams = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      scope: tokenData.scopes.join(' ')
    };

    try {
      const response = await this.exchangeCodeForTokens(tokenParams);
      
      // Revoke old tokens
      tokenData.revoked = true;
      if (tokenData.accessToken) {
        const accessToken = this.accessTokens.get(tokenData.accessToken);
        if (accessToken) {
          accessToken.revoked = true;
        }
      }

      return response;
    } catch (error) {
      throw new AuthenticationError(
        'Failed to refresh access token',
        'TOKEN_REFRESH_FAILED',
        400,
        { originalError: error }
      );
    }
  }

  /**
   * Revoke access or refresh token
   */
  async revokeToken(token: string, tokenTypeHint?: 'access_token' | 'refresh_token'): Promise<void> {
    if (!this.config.revokeUrl) {
      // Local revocation
      const accessToken = this.accessTokens.get(token);
      const refreshToken = this.refreshTokens.get(token);
      
      if (accessToken) {
        accessToken.revoked = true;
      }
      
      if (refreshToken) {
        refreshToken.revoked = true;
      }
      
      if (!accessToken && !refreshToken) {
        throw new AuthenticationError('Token not found', 'TOKEN_NOT_FOUND');
      }
      
      return;
    }

    const params = new URLSearchParams({
      token,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      token_type_hint: tokenTypeHint || 'access_token'
    });

    try {
      const response = await fetch(this.config.revokeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: params.toString()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      throw new AuthenticationError(
        'Failed to revoke token',
        'TOKEN_REVOCATION_FAILED',
        400,
        { originalError: error }
      );
    }
  }

  /**
   * Introspect token to get metadata
   */
  async introspectToken(token: string): Promise<any> {
    if (!this.config.introspectUrl) {
      // Local introspection
      const accessToken = this.accessTokens.get(token);
      if (!accessToken || accessToken.revoked) {
        return { active: false };
      }

      if (accessToken.expiresAt < new Date()) {
        accessToken.revoked = true;
        return { active: false };
      }

      return {
        active: true,
        client_id: accessToken.clientId,
        username: accessToken.userId,
        scope: accessToken.scopes.join(' '),
        exp: Math.floor(accessToken.expiresAt.getTime() / 1000),
        iat: Math.floor(accessToken.createdAt.getTime() / 1000),
        token_type: 'Bearer'
      };
    }

    const params = new URLSearchParams({
      token,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret
    });

    try {
      const response = await fetch(this.config.introspectUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: params.toString()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new AuthenticationError(
        'Failed to introspect token',
        'TOKEN_INTROSPECTION_FAILED',
        400,
        { originalError: error }
      );
    }
  }

  /**
   * Get user info using access token
   */
  async getUserInfo(accessToken: string): Promise<any> {
    if (!this.config.userinfoUrl) {
      throw new Error('Userinfo endpoint not configured');
    }

    try {
      const response = await fetch(this.config.userinfoUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new AuthenticationError(
        'Failed to get user info',
        'USERINFO_FAILED',
        400,
        { originalError: error }
      );
    }
  }

  /**
   * Create OAuth2 authentication middleware
   */
  createMiddleware(options?: {
    scope?: string[];
    optional?: boolean;
    introspect?: boolean;
  }): AuthMiddleware {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const token = this.extractToken(req);
        
        if (!token) {
          if (options?.optional) {
            return next();
          }
          throw new AuthenticationError('No access token provided', 'NO_TOKEN');
        }

        // Introspect token if enabled
        let tokenInfo: any;
        if (options?.introspect) {
          tokenInfo = await this.introspectToken(token);
          if (!tokenInfo.active) {
            throw new AuthenticationError('Invalid or expired token', 'INVALID_TOKEN');
          }
        } else {
          // Local validation
          const accessToken = this.accessTokens.get(token);
          if (!accessToken || accessToken.revoked || accessToken.expiresAt < new Date()) {
            throw new AuthenticationError('Invalid or expired token', 'INVALID_TOKEN');
          }
          
          tokenInfo = {
            active: true,
            client_id: accessToken.clientId,
            username: accessToken.userId,
            scope: accessToken.scopes.join(' ')
          };
        }

        // Validate required scopes
        if (options?.scope && options.scope.length > 0) {
          const tokenScopes = tokenInfo.scope?.split(' ') || [];
          const hasRequiredScope = options.scope.every(scope => 
            tokenScopes.includes(scope)
          );
          
          if (!hasRequiredScope) {
            throw new AuthorizationError('Insufficient scope', 'INSUFFICIENT_SCOPE');
          }
        }

        // Create authenticated user
        const user: AuthenticatedUser = {
          id: tokenInfo.username || tokenInfo.sub,
          roles: [],
          permissions: tokenScopes || [],
          metadata: {
            clientId: tokenInfo.client_id,
            scopes: tokenScopes,
            tokenType: 'Bearer'
          }
        };

        // Attach auth info to request
        req.auth = {
          type: 'oauth2',
          user,
          token,
          scopes: tokenScopes || [],
          metadata: {
            clientId: tokenInfo.client_id,
            introspected: options?.introspect || false
          }
        };

        next();
      } catch (error) {
        if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
          res.status(error.statusCode).json({
            error: error.code,
            message: error.message,
            details: error.details
          });
        } else {
          res.status(401).json({
            error: 'AUTHENTICATION_FAILED',
            message: 'OAuth2 authentication failed'
          });
        }
      }
    };
  }

  /**
   * Exchange authorization code for tokens
   */
  private async exchangeCodeForTokens(params: OAuth2TokenParams): Promise<OAuth2TokenResponse> {
    const body = new URLSearchParams(params as any).toString();

    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'OSSA-OAuth2-Client/1.0'
      },
      body
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Token exchange failed: ${response.status} ${errorBody}`);
    }

    const tokenResponse: OAuth2TokenResponse = await response.json();
    
    // Store tokens locally if managing them
    if (params.grant_type === 'authorization_code') {
      this.storeAccessToken(tokenResponse, params.client_id);
    }

    return tokenResponse;
  }

  /**
   * Store access token locally
   */
  private storeAccessToken(tokenResponse: OAuth2TokenResponse, clientId: string): void {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (tokenResponse.expires_in * 1000));

    const accessToken: OAuth2AccessToken = {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      tokenType: tokenResponse.token_type,
      expiresIn: tokenResponse.expires_in,
      scopes: tokenResponse.scope?.split(' ') || [],
      clientId,
      userId: 'unknown', // Would be set from authorization code
      createdAt: now,
      expiresAt,
      revoked: false
    };

    this.accessTokens.set(tokenResponse.access_token, accessToken);
    
    if (tokenResponse.refresh_token) {
      this.refreshTokens.set(tokenResponse.refresh_token, accessToken);
    }
  }

  /**
   * Extract access token from request
   */
  private extractToken(req: AuthenticatedRequest): string | null {
    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check query parameter
    const queryToken = req.query.access_token;
    if (typeof queryToken === 'string') {
      return queryToken;
    }

    return null;
  }

  /**
   * Generate cryptographically secure state parameter
   */
  private generateState(): string {
    return randomBytes(32).toString('base64url');
  }

  /**
   * Generate PKCE code verifier
   */
  private generateCodeVerifier(): string {
    return randomBytes(32).toString('base64url');
  }

  /**
   * Generate PKCE code challenge from verifier
   */
  private generateCodeChallenge(codeVerifier: string): string {
    return createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
  }

  /**
   * Generate nonce for OpenID Connect
   */
  private generateNonce(): string {
    return randomBytes(16).toString('base64url');
  }

  /**
   * Validate OAuth2 configuration
   */
  private validateConfig(): void {
    if (!this.config.clientId) {
      throw new Error('OAuth2 client ID is required');
    }
    
    if (!this.config.clientSecret) {
      throw new Error('OAuth2 client secret is required');
    }
    
    if (!this.config.authorizationUrl) {
      throw new Error('OAuth2 authorization URL is required');
    }
    
    if (!this.config.tokenUrl) {
      throw new Error('OAuth2 token URL is required');
    }
    
    if (!this.config.redirectUri) {
      throw new Error('OAuth2 redirect URI is required');
    }
  }

  /**
   * Start cleanup timer for expired states and tokens
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Clean up expired states and tokens
   */
  private cleanup(): void {
    const now = new Date();

    // Clean expired states
    for (const [key, state] of this.states.entries()) {
      if (state.expiresAt < now) {
        this.states.delete(key);
      }
    }

    // Clean expired access tokens
    for (const [key, token] of this.accessTokens.entries()) {
      if (token.expiresAt < now) {
        token.revoked = true;
        // Keep revoked tokens for a while for audit purposes
        if (token.expiresAt < new Date(now.getTime() - 24 * 60 * 60 * 1000)) {
          this.accessTokens.delete(key);
        }
      }
    }

    // Clean expired refresh tokens
    for (const [key, token] of this.refreshTokens.entries()) {
      if (token.revoked && token.expiresAt < new Date(now.getTime() - 24 * 60 * 60 * 1000)) {
        this.refreshTokens.delete(key);
      }
    }
  }
}