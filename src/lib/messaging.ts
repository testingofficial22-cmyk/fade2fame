import { supabase, Database } from './supabase';
import { authService } from './auth';

type Connection = Database['public']['Tables']['connections']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];

export class MessagingService {
  private static instance: MessagingService;

  private constructor() {}

  public static getInstance(): MessagingService {
    if (!MessagingService.instance) {
      MessagingService.instance = new MessagingService();
    }
    return MessagingService.instance;
  }

  private async validateAuth(): Promise<{ isValid: boolean; userId?: string; error?: string }> {
    try {
      const token = await authService.getValidToken();
      
      if (!token) {
        return { isValid: false, error: 'No valid authentication token found' };
      }

      const isValidToken = await authService.verifyToken(token);
      if (!isValidToken) {
        return { isValid: false, error: 'Invalid or expired authentication token' };
      }

      const user = await authService.getCurrentUser();
      if (!user) {
        return { isValid: false, error: 'User not authenticated' };
      }

      return { isValid: true, userId: user.id };
    } catch (error) {
      console.error('Auth validation error:', error);
      return { isValid: false, error: 'Authentication validation failed' };
    }
  }

  async sendMessage(connectionId: string, content: string): Promise<{ success: boolean; error?: string; data?: Message }> {
    try {
      // Validate authentication
      const authResult = await this.validateAuth();
      if (!authResult.isValid) {
        return { success: false, error: authResult.error };
      }

      const userId = authResult.userId!;

      // Verify user is part of this connection
      const { data: connection, error: connectionError } = await supabase
        .from('connections')
        .select('*')
        .eq('id', connectionId)
        .eq('status', 'accepted')
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .single();

      if (connectionError || !connection) {
        return { success: false, error: 'Unauthorized: You are not part of this connection' };
      }

      // Send the message
      const { data, error } = await supabase
        .from('messages')
        .insert({
          connection_id: connectionId,
          sender_id: userId,
          content: content.trim(),
          is_read: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return { success: false, error: 'Failed to send message' };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Send message error:', error);
      return { success: false, error: 'An unexpected error occurred while sending message' };
    }
  }

  async fetchMessages(connectionId: string): Promise<{ success: boolean; error?: string; data?: Message[] }> {
    try {
      // Validate authentication
      const authResult = await this.validateAuth();
      if (!authResult.isValid) {
        return { success: false, error: authResult.error };
      }

      const userId = authResult.userId!;

      // Verify user is part of this connection
      const { data: connection, error: connectionError } = await supabase
        .from('connections')
        .select('*')
        .eq('id', connectionId)
        .eq('status', 'accepted')
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .single();

      if (connectionError || !connection) {
        return { success: false, error: 'Unauthorized: You are not part of this connection' };
      }

      // Fetch messages
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('connection_id', connectionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return { success: false, error: 'Failed to fetch messages' };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Fetch messages error:', error);
      return { success: false, error: 'An unexpected error occurred while fetching messages' };
    }
  }

  async markMessagesAsRead(connectionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate authentication
      const authResult = await this.validateAuth();
      if (!authResult.isValid) {
        return { success: false, error: authResult.error };
      }

      const userId = authResult.userId!;

      // Verify user is part of this connection
      const { data: connection, error: connectionError } = await supabase
        .from('connections')
        .select('*')
        .eq('id', connectionId)
        .eq('status', 'accepted')
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .single();

      if (connectionError || !connection) {
        return { success: false, error: 'Unauthorized: You are not part of this connection' };
      }

      // Mark messages as read (only messages not sent by current user)
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('connection_id', connectionId)
        .neq('sender_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking messages as read:', error);
        return { success: false, error: 'Failed to mark messages as read' };
      }

      return { success: true };
    } catch (error) {
      console.error('Mark messages as read error:', error);
      return { success: false, error: 'An unexpected error occurred while marking messages as read' };
    }
  }

  async fetchConnections(): Promise<{ success: boolean; error?: string; data?: any[] }> {
    try {
      // Validate authentication
      const authResult = await this.validateAuth();
      if (!authResult.isValid) {
        return { success: false, error: authResult.error };
      }

      const userId = authResult.userId!;

      // Fetch user's connections
      const { data, error } = await supabase
        .from('connections')
        .select(`
          *,
          requester:requester_id (first_name, last_name, photo_url),
          addressee:addressee_id (first_name, last_name, photo_url)
        `)
        .eq('status', 'accepted')
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching connections:', error);
        return { success: false, error: 'Failed to fetch connections' };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Fetch connections error:', error);
      return { success: false, error: 'An unexpected error occurred while fetching connections' };
    }
  }
}

export const messagingService = MessagingService.getInstance();