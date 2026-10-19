import { AuthUser, SaveData } from '../../types/game';

const AUTH_TOKEN_KEY = 'je3d_auth_token_v1';

class AuthServiceClient {
  private token: string | null = null;

  constructor() {
    try {
      this.token = localStorage.getItem(AUTH_TOKEN_KEY);
    } catch {
      this.token = null;
    }
  }

  public setToken(token: string | null) {
    this.token = token;
    try {
      if (token) {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
      } else {
        localStorage.removeItem(AUTH_TOKEN_KEY);
      }
    } catch {
      // ignore storage errors
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  public async fetchCurrentUser(): Promise<AuthUser | null> {
    try {
      const res = await fetch('/api/auth/me', {
        method: 'GET',
        headers: this.getHeaders(),
        credentials: 'include',
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.user || null;
    } catch {
      return null;
    }
  }

  public async registerWithEmail(
    name: string,
    email: string,
    password: string,
    saveData: SaveData
  ): Promise<{ user: AuthUser; token: string }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ name, email, password, saveData }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed.');
    }
    this.setToken(data.token);
    return data;
  }

  public async loginWithEmail(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed.');
    }
    this.setToken(data.token);
    return data;
  }

  public async getOAuthUrl(provider: 'github' = 'github'): Promise<{
    configured: boolean;
    url?: string;
    redirectUri: string;
    message?: string;
  }> {
    const origin = encodeURIComponent(window.location.origin);
    const res = await fetch(`/api/auth/${provider}/url?origin=${origin}`, {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error(`Failed to get ${provider} OAuth URL.`);
    }
    return res.json();
  }

  public async instantOAuthSignIn(
    provider: 'github',
    email: string,
    name: string,
    saveData: SaveData
  ): Promise<{ user: AuthUser; token: string }> {
    const res = await fetch('/api/auth/oauth-instant', {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ provider, email, name, saveData }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `${provider} sign-in failed.`);
    }
    this.setToken(data.token);
    return data;
  }

  public async syncSaveData(saveData: SaveData): Promise<void> {
    if (!this.token) return;
    try {
      await fetch('/api/auth/sync', {
        method: 'POST',
        headers: this.getHeaders(),
        credentials: 'include',
        body: JSON.stringify({ saveData }),
      });
    } catch {
      // background sync failure is non-blocking
    }
  }

  public async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: this.getHeaders(),
        credentials: 'include',
      });
    } finally {
      this.setToken(null);
    }
  }
}

export const AuthService = new AuthServiceClient();
