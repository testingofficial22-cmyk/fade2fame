import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { authService } from '../lib/auth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  getValidToken: () => Promise<string | null>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<any>;
  signUp: (email: string, password: string, firstName: string, lastName: string, role: 'student' | 'alumni', additionalData: any) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string, role: 'student' | 'alumni', additionalData: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

      if (error) throw error;
      
      if (data.user) {
      // Create initial profile
      const profileData: any = {
        id: data.user.id,
        first_name: firstName,
        last_name: lastName,
        email: email,
        role: role,
        phone: additionalData.phone || null,
        date_of_birth: additionalData.dateOfBirth || null,
        gender: additionalData.gender || null,
        degree: additionalData.degree || '',
        department: additionalData.department || '',
        phone_visibility: 'alumni',
        email_visibility: 'alumni',
        location_visibility: 'alumni',
        hidden_from_search: false,
      };

      // Add role-specific fields
      if (role === 'student') {
        profileData.roll_number = additionalData.rollNumber || null;
      } else if (role === 'alumni') {
        profileData.graduation_year = additionalData.graduationYear ? parseInt(additionalData.graduationYear) : null;
        profileData.job_title = additionalData.jobTitle || null;
        profileData.company = additionalData.company || null;
        profileData.location = additionalData.location || null;
      }

      const { error: profileError } = await supabase.from('profiles').insert(profileData);

      if (profileError) {
          throw profileError;
      }
    }

    return { data, error };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    }
  };

  const signIn = (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = () => {
    return supabase.auth.signOut();
  };

  const resetPassword = (email: string) => {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
  };

  const getValidToken = async () => {
    return await authService.getValidToken();
  };
  const value = {
    user,
    session,
    loading,
    getValidToken,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};