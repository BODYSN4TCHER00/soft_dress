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

  // Función para limpiar completamente la sesión
  const clearSession = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      // Limpiar localStorage relacionado con Supabase (buscar todas las keys que empiecen con 'sb-')
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      // Limpiar sessionStorage también
      sessionStorage.clear();
    } catch (error) {
      // Forzar limpieza incluso si hay error
      setUser(null);
      // Limpiar todas las keys de Supabase del localStorage
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      sessionStorage.clear();
    }
  };

  const loadUserProfile = async (userId: string): Promise<boolean> => {
    try {
      const { data: profile, error } = await supabase
        .from('Profiles')
        .select('id, name, last_name, email, phone, role_user, status')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        await clearSession();
        return false;
      }

      if (profile) {
        // Verificar que el usuario esté activo
        if (profile.status && profile.status !== 'active') {
          // Usuario inactivo, cerrar sesión
          await clearSession();
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
      console.error('Error in loadUserProfile:', error);
      await clearSession();
      return false;
    }
  };

  // Verificar sesión existente al cargar
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        // Timeout de seguridad para evitar que loading se quede bloqueado
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn('Auth initialization timeout, clearing session');
            clearSession();
            setLoading(false);
          }
        }, 10000); // 10 segundos máximo

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            await clearSession();
            setLoading(false);
          }
          return;
        }
        
        if (mounted) {
          clearTimeout(timeoutId);
          if (session?.user) {
            const profileLoaded = await loadUserProfile(session.user.id);
            // Si el usuario está inactivo o no se pudo cargar, cerrar sesión
            if (!profileLoaded) {
              await clearSession();
            }
          } else {
            // No hay sesión, asegurar que el estado esté limpio
            setUser(null);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in initializeAuth:', error);
        if (mounted) {
          clearTimeout(timeoutId);
          await clearSession();
          setLoading(false);
        }
      }
    };

    initializeAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        try {
          // Limpiar sesión en caso de errores de token
          if (event === 'TOKEN_REFRESHED' && !session) {
            await clearSession();
            setLoading(false);
            return;
          }

          if (event === 'SIGNED_OUT') {
            setUser(null);
            setLoading(false);
            return;
          }

          if (session?.user) {
            const profileLoaded = await loadUserProfile(session.user.id);
            // Si el usuario está inactivo o no se pudo cargar, cerrar sesión
            if (!profileLoaded) {
              await clearSession();
            }
          } else {
            setUser(null);
          }
          setLoading(false);
        } catch (error) {
          console.error('Error in auth state change:', error);
          await clearSession();
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      // Limpiar cualquier sesión previa corrupta antes de intentar login
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (existingSession) {
        // Verificar si la sesión es válida
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            // Sesión inválida, limpiar
            await clearSession();
          }
        } catch {
          // Error al verificar, limpiar sesión
          await clearSession();
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        console.error('Login error:', error);
        // Limpiar cualquier estado corrupto
        await clearSession();
        return false;
      }

      if (data.user) {
        const profileLoaded = await loadUserProfile(data.user.id);
        if (!profileLoaded) {
          // Si no se pudo cargar el perfil o el usuario está inactivo
          await clearSession();
          return false;
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login exception:', error);
      // Limpiar sesión en caso de excepción
      await clearSession();
      return false;
    }
  };

  const logout = async () => {
    try {
      await clearSession();
    } catch (error) {
      // Forzar limpieza incluso si hay error
      setUser(null);
      localStorage.clear();
      sessionStorage.clear();
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

