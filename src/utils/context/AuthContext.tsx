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
    let timeoutId: ReturnType<typeof setTimeout>;
    let isInitializing = true;

    const initializeAuth = async () => {
      try {
        // Timeout de seguridad de 10 segundos
        timeoutId = setTimeout(() => {
          if (mounted && isInitializing) {
            setUser(null);
            setLoading(false);
            isInitializing = false;
          }
        }, 10000);

        // Limpiar COMPLETAMENTE el localStorage de Supabase para empezar limpio
        try {
          const storageKeys = Object.keys(localStorage);
          const supabaseKeys = storageKeys.filter(key => key.startsWith('sb-'));

          if (supabaseKeys.length > 0) {
            supabaseKeys.forEach(key => {
              try {
                localStorage.removeItem(key);
              } catch (e) {
                console.error('[Auth] Error removing key:', key, e);
              }
            });
          }
        } catch (err) {
          console.error('[Auth] Error cleaning localStorage:', err);
        }

        // Ahora intentar getSession con la limpieza hecha
        let session = null;
        let sessionError = null;

        try {
          // Timeout de 5 segundos para getSession
          const getSessionPromise = supabase.auth.getSession();
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('getSession timeout')), 5000)
          );

          const result = await Promise.race([getSessionPromise, timeoutPromise]) as any;
          session = result?.data?.session || null;
          sessionError = result?.error || null;
        } catch (err: any) {
          sessionError = err;
        }

        if (sessionError) {
          if (mounted) {
            setUser(null);
            setLoading(false);
            isInitializing = false;
          }
          return;
        }

        if (mounted) {
          clearTimeout(timeoutId);
          if (session?.user) {
            const profileLoaded = await loadUserProfile(session.user.id);
            if (!profileLoaded) {
              await clearSession();
            }
          } else {
            setUser(null);
          }
          setLoading(false);
          isInitializing = false;
        }
      } catch (error) {
        console.error('[Auth] Error in initializeAuth:', error);
        if (mounted) {
          clearTimeout(timeoutId);
          setUser(null);
          setLoading(false);
          isInitializing = false;
        }
      }
    };

    initializeAuth();

    // Setup auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Ignorar eventos durante la inicialización para evitar race conditions
        if (isInitializing) {
          return;
        }

        if (!mounted) return;

        try {
          if (event === 'TOKEN_REFRESHED') {
            if (!session) {
              await clearSession();
            }
            setLoading(false);
            return;
          }

          if (event === 'SIGNED_OUT') {
            setUser(null);
            setLoading(false);
            return;
          }

          if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            if (session?.user) {
              const profileLoaded = await loadUserProfile(session.user.id);
              if (!profileLoaded) {
                await clearSession();
              }
            }
            setLoading(false);
            return;
          }

          // Otros eventos
          if (session?.user) {
            const profileLoaded = await loadUserProfile(session.user.id);
            if (!profileLoaded) {
              await clearSession();
            }
          } else {
            setUser(null);
          }
          setLoading(false);
        } catch (error) {
          console.error('[Auth] Error in auth state change:', error);
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      isInitializing = false;
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

