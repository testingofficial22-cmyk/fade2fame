import { supabase } from './supabase';

export interface AuthToken {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export class AuthService {
  private static instance: AuthService;
  private currentToken: AuthToken | null = null;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async getValidToken(): Promise<string | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.error('No valid session found:', error);
        return null;
      }

      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at <= now) {
        // Try to refresh the token
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshData.session) {
          console.error('Failed to refresh token:', refreshError);
          return null;
        }
        
        return refreshData.session.access_token;
      }

      return session.access_token;
    } catch (error) {
      console.error('Error getting valid token:', error);
      return null;
    }
  }

  async verifyToken(token: string): Promise<boolean> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      return !error && !!user;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  }

  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error getting current user:', error);
        return null;
      }
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
}

export const authService = AuthService.getInstance();