'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const { login } = useAuth();

  const MAX_ATTEMPTS = 5;
  const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutos en milisegundos

  // Cargar intentos del localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const attempts = parseInt(localStorage.getItem('loginAttempts') || '0');
      const blocked = parseInt(localStorage.getItem('blockedUntil') || '0');
      setLoginAttempts(attempts);
      if (blocked > Date.now()) {
        setBlockedUntil(blocked);
      } else {
        localStorage.removeItem('blockedUntil');
      }
    }
  }, []);

  // Actualizar contador de tiempo restante
  useEffect(() => {
    if (blockedUntil) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((blockedUntil - Date.now()) / 1000));
        setRemainingTime(remaining);
        if (remaining === 0) {
          setBlockedUntil(null);
          setLoginAttempts(0);
          localStorage.removeItem('blockedUntil');
          localStorage.removeItem('loginAttempts');
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [blockedUntil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verificar si está bloqueado
    if (blockedUntil && blockedUntil > Date.now()) {
      const minutes = Math.ceil((blockedUntil - Date.now()) / 60000);
      setError(`Demasiados intentos fallidos. Intente nuevamente en ${minutes} minutos.`);
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login({ username, password });
      // Login exitoso - limpiar intentos
      setLoginAttempts(0);
      localStorage.removeItem('loginAttempts');
      localStorage.removeItem('blockedUntil');
    } catch (err) {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      localStorage.setItem('loginAttempts', newAttempts.toString());

      if (newAttempts >= MAX_ATTEMPTS) {
        const blockTime = Date.now() + BLOCK_DURATION;
        setBlockedUntil(blockTime);
        localStorage.setItem('blockedUntil', blockTime.toString());
        setError(`Demasiados intentos fallidos. Cuenta bloqueada por 15 minutos.`);
      } else {
        setError(`Usuario o contraseña incorrectos. Intentos restantes: ${MAX_ATTEMPTS - newAttempts}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const isBlocked = blockedUntil && blockedUntil > Date.now();
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="rounded-full bg-primary-600 p-3">
              <svg className="h-12 w-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Sistema de Gestión de Vehículos
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ingrese sus credenciales para acceder
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Usuario
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  disabled={isBlocked}
                  className="block w-full rounded-md border-0 py-3 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                  placeholder="Ingrese su usuario"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error && !isBlocked) setError('');
                  }}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  disabled={isBlocked}
                  className="block w-full rounded-md border-0 py-3 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                  placeholder="Ingrese su contraseña"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error && !isBlocked) setError('');
                  }}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 p-4 animate-shake">
                <div className="flex">
                  <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-red-800">{error}</div>
                </div>
              </div>
            )}

            {isBlocked && remainingTime > 0 && (
              <div className="rounded-md bg-orange-50 border border-orange-200 p-4">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-orange-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-orange-800 font-medium">
                    Tiempo restante: {formatTime(remainingTime)}
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading || isBlocked}
                className="group relative flex w-full justify-center items-center rounded-md bg-primary-600 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {loading && (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {loading ? 'Ingresando...' : isBlocked ? 'Cuenta Bloqueada' : 'Ingresar'}
              </button>
            </div>

            {loginAttempts > 0 && loginAttempts < MAX_ATTEMPTS && !isBlocked && (
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  {loginAttempts} de {MAX_ATTEMPTS} intentos utilizados
                </p>
              </div>
            )}
          </form>

          <div className="mt-6 text-center text-xs text-gray-500">
            <p>Credenciales por defecto: admin / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
