/**
 * MySeatMap API Client
 * Handles authentication and API requests to the backend service
 */

import config from './config';

// Types for API responses
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    errorCode?: string;
    timestamp?: string;
  };
}

export interface GuestTokenResponse {
  success: true;
  token: string;
  userId: string;
  authProvider: 'GUEST';
  expiresIn: number;
  guestLimits: {
    maxFlights: number;
    flightsViewed: number;
  };
}

export interface AuthTokens {
  jwt?: string;
  userId?: string;
  authProvider?: 'GUEST' | 'USER';
  expiresAt?: number;
}

class ApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = config.apiBaseUrl;
    this.apiKey = config.apiKey;
  }

  /**
   * Get stored authentication tokens from localStorage
   */
  private getStoredTokens(): AuthTokens {
    if (typeof window === 'undefined') return {};
    
    try {
      const jwt = localStorage.getItem('myseatmap_jwt_token');
      const userId = localStorage.getItem('myseatmap_user_id');
      const authProvider = localStorage.getItem('myseatmap_auth_provider') as 'GUEST' | 'USER';
      const expiresAt = localStorage.getItem('myseatmap_token_expires');

      return {
        jwt: jwt || undefined,
        userId: userId || undefined,
        authProvider: authProvider || undefined,
        expiresAt: expiresAt ? parseInt(expiresAt) : undefined,
      };
    } catch (error) {
      console.error('Error reading stored tokens:', error);
      return {};
    }
  }

  /**
   * Store authentication tokens in localStorage
   */
  private storeTokens(tokens: AuthTokens): void {
    if (typeof window === 'undefined') return;

    try {
      if (tokens.jwt) localStorage.setItem('myseatmap_jwt_token', tokens.jwt);
      if (tokens.userId) localStorage.setItem('myseatmap_user_id', tokens.userId);
      if (tokens.authProvider) localStorage.setItem('myseatmap_auth_provider', tokens.authProvider);
      if (tokens.expiresAt) localStorage.setItem('myseatmap_token_expires', tokens.expiresAt.toString());
    } catch (error) {
      console.error('Error storing tokens:', error);
    }
  }

  /**
   * Clear stored authentication tokens
   */
  private clearTokens(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem('myseatmap_jwt_token');
      localStorage.removeItem('myseatmap_user_id');
      localStorage.removeItem('myseatmap_auth_provider');
      localStorage.removeItem('myseatmap_token_expires');
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  /**
   * Check if current token is expired
   */
  private isTokenExpired(expiresAt?: number): boolean {
    if (!expiresAt) return true;
    return Date.now() >= expiresAt;
  }

  /**
   * Get valid authentication headers
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json',
    };

    const tokens = this.getStoredTokens();
    
    // Check if token exists and is not expired
    if (tokens.jwt && !this.isTokenExpired(tokens.expiresAt)) {
      headers['Authorization'] = `Bearer ${tokens.jwt}`;
    }

    return headers;
  }

  /**
   * Make an authenticated API request
   */
  private async request<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      ...this.getAuthHeaders(),
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data as ApiResponse<T>;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Obtain a guest token for trial access
   * Provides limited access (2 seat map views) without registration
   */
  async getGuestToken(): Promise<GuestTokenResponse> {
    const response = await this.request<GuestTokenResponse>('/auth/guest', {
      method: 'POST',
    });

    if (response.success && response.data) {
      // Store the guest token
      const expiresAt = Date.now() + (response.data.expiresIn * 1000);
      this.storeTokens({
        jwt: response.data.token,
        userId: response.data.userId,
        authProvider: response.data.authProvider,
        expiresAt,
      });
    }

    return response.data;
  }

  /**
   * Check if user has a valid token (guest or registered user)
   */
  isAuthenticated(): boolean {
    const tokens = this.getStoredTokens();
    return !!(tokens.jwt && !this.isTokenExpired(tokens.expiresAt));
  }

  /**
   * Get current user authentication status
   */
  getAuthStatus(): AuthTokens & { isAuthenticated: boolean; isGuest: boolean } {
    const tokens = this.getStoredTokens();
    const isAuthenticated = this.isAuthenticated();
    
    return {
      ...tokens,
      isAuthenticated,
      isGuest: tokens.authProvider === 'GUEST',
    };
  }

  /**
   * Ensure user has a valid token, obtaining guest token if needed
   */
  async ensureAuthenticated(): Promise<void> {
    if (!this.isAuthenticated()) {
      await this.getGuestToken();
    }
  }

  /**
   * Log out user and clear tokens
   */
  logout(): void {
    this.clearTokens();
  }

  /**
   * Generic method for making authenticated API calls
   * Ensures authentication before making the request
   */
  async authenticatedRequest<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    await this.ensureAuthenticated();
    return this.request<T>(endpoint, options);
  }
}

// Create and export a singleton instance
const apiClient = new ApiClient();
export default apiClient;