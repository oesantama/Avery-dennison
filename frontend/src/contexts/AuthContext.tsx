'use client';

import { authApi } from '@/lib/api';
import type { LoginCredentials, Usuario } from '@/types';
import { useRouter } from 'next/navigation';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

interface AuthContextType {
  user: Usuario | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true); // ✅ Iniciar en true para evitar redirecciones prematuras
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') {
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('token');
    const lastCheck = localStorage.getItem('lastAuthCheck');
    const now = Date.now();

    // ✅ OPTIMIZACIÓN: Cachear validación por 5 minutos
    if (token && lastCheck && now - parseInt(lastCheck) < 5 * 60 * 1000) {
      const cachedUser = localStorage.getItem('cachedUser');
      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
          setLoading(false);
          return;
        } catch (e) {
          // Si falla el parse, continuar con la validación normal
        }
      }
    }

    if (token) {
      try {
        const userData = await authApi.me();
        setUser(userData);
        // ✅ Guardar en caché
        localStorage.setItem('cachedUser', JSON.stringify(userData));
        localStorage.setItem('lastAuthCheck', now.toString());
      } catch (error: any) {
        // Solo eliminar el token si es un error de autenticación (401)
        if (error?.response?.status === 401) {
          console.log('Token inválido o expirado, cerrando sesión');
          localStorage.removeItem('token');
          localStorage.removeItem('cachedUser');
          localStorage.removeItem('lastAuthCheck');
          setUser(null);
        } else {
          // Para otros errores (red, servidor caído, etc), mantener el token
          console.warn(
            'Error verificando autenticación (se mantendrá la sesión):',
            error?.message
          );
        }
      }
    } else {
      setUser(null);
      localStorage.removeItem('cachedUser');
      localStorage.removeItem('lastAuthCheck');
    }
    setLoading(false);
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      const authToken = await authApi.login(credentials);
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', authToken.access_token);
      }
      const userData = await authApi.me();
      setUser(userData);
      
      // ✅ CORREGIDO: Obtener permisos y redirigir a la primera página permitida
      try {
        const permissionsData = await authApi.getMyPermissions();
        const allowedPages = permissionsData.pages || [];

        // ✅ Guardar en caché (usuario Y permisos)
        if (typeof window !== 'undefined') {
          localStorage.setItem('cachedUser', JSON.stringify(userData));
          localStorage.setItem('lastAuthCheck', Date.now().toString());
          // ✅ Guardar permisos en caché para usePermissions
          localStorage.setItem('cached_permissions', JSON.stringify({
            data: permissionsData,
            timestamp: Date.now()
          }));
        }

        // ✅ Orden de prioridad para redirección
        const priorityPages = ['/dashboard', '/operaciones', '/consultas/entregas', '/vehiculos'];
        const redirectPage = priorityPages.find(page => allowedPages.includes(page)) || allowedPages[0] || '/dashboard';

        router.push(redirectPage);
      } catch (permError) {
        console.error('Error obteniendo permisos:', permError);
        // Si falla obtener permisos, intentar dashboard por defecto
        router.push('/dashboard');
      }
    } catch (error) {
      throw new Error('Credenciales inválidas');
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.warn('Error en logout:', error);
    } finally {
      // ✅ OPTIMIZACIÓN: Limpiar TODO el caché al cerrar sesión
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('cachedUser');
        localStorage.removeItem('lastAuthCheck');
        // Limpiar caché de datos
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
          if (key.startsWith('cache_')) {
            localStorage.removeItem(key);
          }
        });
      }
      setUser(null);
      router.push('/login');
    }
  };

  // Evitar errores de hidratación renderizando el mismo contenido en servidor y cliente
  if (!mounted) {
    return (
      <AuthContext.Provider
        value={{ user: null, loading: true, login, logout }}
      >
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
