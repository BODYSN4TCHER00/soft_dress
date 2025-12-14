import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, UserRole, LoginCredentials } from '../types/user';
import { supabase } from '../../utils/supabase/client';

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = async (userId: string): Promise<boolean> => {
    try {
      const { data: profile, error } = await supabase
        .from('Profiles')
        .select('id, name, last_name, email, phone, role_user, status')
        .eq('id', userId)
        .single();

      if (error) {
        return false;
      }

      if (profile) {
        // Verificar que el usuario esté activo
        if (profile.status && profile.status !== 'active') {
          // Usuario inactivo, cerrar sesión
          await supabase.auth.signOut();
          return false;
        }

        const userRole: UserRole = profile.role_user === 'admin' ? 'admin' : 'staff';
        const fullName = profile.name 
          ? `${profile.name}${profile.last_name ? ` ${profile.last_name}` : ''}`
          : profile.email || 'Usuario';

        setUser({
          id: profile.id,
          email: profile.email || '',
          name: fullName,
          role: userRole,
        });
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  // Verificar sesión existente al cargar
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          if (session?.user) {
            const profileLoaded = await loadUserProfile(session.user.id);
            // Si el usuario está inactivo, cerrar sesión
            if (!profileLoaded) {
              await supabase.auth.signOut();
            }
          }
          setLoading(false);
        }
      } catch (error) {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;

        if (session?.user) {
          const profileLoaded = await loadUserProfile(session.user.id);
          // Si el usuario está inactivo, cerrar sesión
          if (!profileLoaded) {
            await supabase.auth.signOut();
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        return false;
      }

      if (data.user) {
        const profileLoaded = await loadUserProfile(data.user.id);
        if (!profileLoaded) {
          // Si no se pudo cargar el perfil o el usuario está inactivo
          await supabase.auth.signOut();
          return false;
        }
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      // Error silencioso
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

