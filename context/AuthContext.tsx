
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Role } from '../types';

interface AuthUser {
  id: string;
  name: string;
  handle: string;
  role: Role;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, handle: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string, newPass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isGenesisMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenesisMode, setIsGenesisMode] = useState(false);

  const checkGenesisStatus = async () => {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (!error && count === 0) {
        setIsGenesisMode(true);
      } else {
        setIsGenesisMode(false);
      }
    } catch (err) {
      setIsGenesisMode(false);
    }
  };

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          
          if (profile) {
            setUser({
              id: profile.id,
              name: profile.name,
              handle: profile.handle,
              role: profile.role as Role
            });
          }
        } else {
          await checkGenesisStatus();
        }
      } catch (err) {
        console.error("[AXIS] Auth Init Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        if (profile) {
          setUser({
            id: profile.id,
            name: profile.name,
            handle: profile.handle,
            role: profile.role as Role
          });
        }
      } else {
        setUser(null);
        checkGenesisStatus();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (identifier: string, pass: string) => {
    let email = identifier;

    // Handle Lookup Logic: If identifier starts with @ or lacks @domain.com, assume handle
    if (!identifier.includes('@') || identifier.startsWith('@')) {
      const formattedHandle = identifier.startsWith('@') ? identifier : `@${identifier}`;
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('handle', formattedHandle)
        .maybeSingle();
      
      if (profile && profile.email) {
        email = profile.email;
      } else {
        return { success: false, error: "Handle not found in operational records." };
      }
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const register = async (name: string, email: string, handle: string, pass: string) => {
    const formattedHandle = handle.startsWith('@') ? handle : `@${handle}`;
    
    // Check for Genesis bootstrap
    let assignedRole = Role.JOBBER;
    const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    
    if (count === 0) {
      assignedRole = Role.SUPER_ADMIN;
      console.log("[AXIS] BOOTSTRAP: Elevating first user to SUPER_ADMIN.");
    }

    const { error } = await supabase.auth.signUp({ 
      email, 
      password: pass,
      options: { 
        data: { 
          name, 
          handle: formattedHandle, 
          role: assignedRole 
        } 
      }
    });
    
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const resetPassword = async (email: string, newPass: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return !error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, resetPassword, logout, isLoading, isGenesisMode }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
