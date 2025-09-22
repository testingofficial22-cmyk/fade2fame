import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to get authenticated user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

// Helper function to get user profile
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          // Personal
          first_name: string;
          last_name: string;
          email: string;
          phone: string | null;
          photo_url: string | null;
          date_of_birth: string | null;
          gender: string | null;
          role: 'student' | 'alumni';
          // Academic
          graduation_year: number | null;
          degree: string;
          department: string;
          roll_number: string | null;
          cgpa: number | null;
          // Professional
          job_title: string | null;
          company: string | null;
          industry: string | null;
          location: string | null;
          experience_years: number | null;
          linkedin_url: string | null;
          // Extra
          bio: string | null;
          achievements: string[] | null;
          skills: string[] | null;
          hobbies: string[] | null;
          // Privacy
          phone_visibility: 'public' | 'alumni' | 'private';
          email_visibility: 'public' | 'alumni' | 'private';
          location_visibility: 'public' | 'alumni' | 'private';
          hidden_from_search: boolean;
        };
        Insert: {
          id: string;
          first_name: string;
          last_name: string;
          email: string;
          role: 'student' | 'alumni';
          graduation_year?: number | null;
          degree: string;
          department: string;
          phone?: string | null;
          photo_url?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          roll_number?: string | null;
          cgpa?: number | null;
          job_title?: string | null;
          company?: string | null;
          industry?: string | null;
          location?: string | null;
          experience_years?: number | null;
          linkedin_url?: string | null;
          bio?: string | null;
          achievements?: string[] | null;
          skills?: string[] | null;
          hobbies?: string[] | null;
          phone_visibility?: 'public' | 'alumni' | 'private';
          email_visibility?: 'public' | 'alumni' | 'private';
          location_visibility?: 'public' | 'alumni' | 'private';
          hidden_from_search?: boolean;
        };
        Update: {
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string | null;
          photo_url?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          role?: 'student' | 'alumni';
          graduation_year?: number | null;
          degree?: string;
          department?: string;
          roll_number?: string | null;
          cgpa?: number | null;
          job_title?: string | null;
          company?: string | null;
          industry?: string | null;
          location?: string | null;
          experience_years?: number | null;
          linkedin_url?: string | null;
          bio?: string | null;
          achievements?: string[] | null;
          skills?: string[] | null;
          hobbies?: string[] | null;
          phone_visibility?: 'public' | 'alumni' | 'private';
          email_visibility?: 'public' | 'alumni' | 'private';
          location_visibility?: 'public' | 'alumni' | 'private';
          hidden_from_search?: boolean;
          updated_at?: string;
        };
      };
      jobs: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          posted_by: string;
          title: string;
          description: string;
          company: string;
          location: string | null;
          job_type: 'full-time' | 'part-time' | 'internship' | 'contract';
          application_url: string | null;
          is_active: boolean;
        };
        Insert: {
          posted_by: string;
          title: string;
          description: string;
          company: string;
          location?: string | null;
          job_type: 'full-time' | 'part-time' | 'internship' | 'contract';
          application_url?: string | null;
          is_active?: boolean;
        };
        Update: {
          title?: string;
          description?: string;
          company?: string;
          location?: string | null;
          job_type?: 'full-time' | 'part-time' | 'internship' | 'contract';
          application_url?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      connections: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: 'pending' | 'accepted' | 'rejected';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          requester_id: string;
          addressee_id: string;
          status?: 'pending' | 'accepted' | 'rejected';
        };
        Update: {
          status?: 'pending' | 'accepted' | 'rejected';
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          connection_id: string;
          sender_id: string;
          content: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          connection_id: string;
          sender_id: string;
          content: string;
          is_read?: boolean;
        };
        Update: {
          is_read?: boolean;
        };
      };
    };
  };
};