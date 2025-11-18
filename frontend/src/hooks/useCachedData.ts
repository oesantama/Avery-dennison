import { useEffect, useState } from 'react';

interface CacheConfig {
  key: string;
  fetchFn: () => Promise<any>;
  ttl?: number; // Time to live en milisegundos (default: 5 minutos)
}

/**
 * Hook para cachear datos que no cambian frecuentemente
 * Previene llamadas API duplicadas en diferentes componentes
 *
 * @param config - Configuración del caché
 * @returns [data, loading, error, refetch]
 */
export function useCachedData<T>(config: CacheConfig) {
  const { key, fetchFn, ttl = 5 * 60 * 1000 } = config;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async (forceRefresh = false) => {
    if (typeof window === 'undefined') return;

    setLoading(true);
    setError(null);

    try {
      // Verificar caché
      if (!forceRefresh) {
        const cached = localStorage.getItem(`cache_${key}`);
        const cacheTime = localStorage.getItem(`cache_time_${key}`);

        if (cached && cacheTime) {
          const age = Date.now() - parseInt(cacheTime);
          if (age < ttl) {
            setData(JSON.parse(cached));
            setLoading(false);
            return;
          }
        }
      }

      // Fetch nuevos datos
      const result = await fetchFn();
      setData(result);

      // Guardar en caché
      localStorage.setItem(`cache_${key}`, JSON.stringify(result));
      localStorage.setItem(`cache_time_${key}`, Date.now().toString());
    } catch (err) {
      setError(err as Error);
      console.error(`Error fetching ${key}:`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [key]);

  const refetch = () => fetchData(true);

  return { data, loading, error, refetch };
}

/**
 * Limpia el caché de una key específica
 */
export function clearCache(key: string) {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`cache_${key}`);
  localStorage.removeItem(`cache_time_${key}`);
}

/**
 * Limpia todo el caché
 */
export function clearAllCache() {
  if (typeof window === 'undefined') return;
  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    if (key.startsWith('cache_')) {
      localStorage.removeItem(key);
    }
  });
}
