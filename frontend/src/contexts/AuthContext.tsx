'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import type { Usuario, LoginCredentials } from '@/types';

interface AuthContextType {
  user: Usuario | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(false);
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
    if (token) {
      try {
        const userData = await authApi.me();
        setUser(userData);
      } catch (error: any) {
        // Solo eliminar el token si es un error de autenticación (401)
        // No eliminar por errores de red u otros problemas temporales
        if (error?.response?.status === 401) {
          console.log('Token inválido o expirado, cerrando sesión');
          localStorage.removeItem('token');
          setUser(null);
        } else {
          // Para otros errores, mantener el token y reintentar más tarde
          console.warn('Error verificando autenticación (se mantendrá la sesión):', error?.message);
        }
      }
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
      router.push('/dashboard');
    } catch (error) {
      throw new Error('Credenciales inválidas');
    }
  };

  const logout = async () => {
    try {
      // Llamar al endpoint de logout del backend
      await authApi.logout();
    } catch (error) {
      // Continuar con logout local aunque falle el backend
      console.warn('Error en logout:', error);
    } finally {
      // Siempre limpiar el estado local
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      setUser(null);
      router.push('/login');
    }
  };

  // Evitar errores de hidratación renderizando el mismo contenido en servidor y cliente
  if (!mounted) {
    return (
      <AuthContext.Provider value={{ user: null, loading: false, login, logout }}>
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
