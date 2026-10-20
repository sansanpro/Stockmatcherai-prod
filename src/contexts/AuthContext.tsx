
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { signInWithApple as appleSignIn } from '@/services/appleAuthService';
import { toast } from 'sonner';
import { track } from '@/lib/analytics';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  deleteAccount: () => Promise<{ error: any }>;
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
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName || email
        }
      }
    });

    if (error) {
      toast.error(error.message);
    } else if (data.session) {
      // Email confirmation is off for this project, so the account is ready right away
      toast.success('Account created!');
      track('sign_up', { method: 'email' });
    } else {
      toast.success('Check your email to confirm your account!');
      track('sign_up', { method: 'email', needs_confirmation: true });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Welcome back!');
      track('sign_in', { method: 'email' });
    }

    return { error };
  };

  const signInWithApple = async () => {
    try {
      await appleSignIn();
      toast.success('Welcome!');
      track('sign_in', { method: 'apple' });
    } catch (error: any) {
      // User cancelled — no toast. Any other error is shown.
      const isCancelled =
        error?.code === '1001' ||
        error?.code === 1001 ||
        error?.message?.includes('AuthorizationError error 1001') ||
        error?.message?.includes('cancelled') ||
        error?.message?.includes('canceled');
      if (!isCancelled) {
        const msg = error?.message || error?.localizedDescription || JSON.stringify(error);
        toast.error(msg || 'Apple Sign-In failed. Please try again.');
      }
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Signed out successfully!');
      }
    } catch (error) {
      toast.error('An error occurred while signing out');
    }
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/reset-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password reset email sent!');
    }

    return { error };
  };

  const deleteAccount = async () => {
    try {
      const { error } = await supabase.functions.invoke('delete-account');
      if (error) {
        toast.error('Failed to delete account. Please try again.');
        return { error };
      }
      // Clear all local data
      localStorage.clear();
      setUser(null);
      setSession(null);
      toast.success('Your account has been deleted.');
      return { error: null };
    } catch (error) {
      toast.error('An error occurred while deleting your account.');
      return { error };
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithApple,
    signOut,
    resetPassword,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
