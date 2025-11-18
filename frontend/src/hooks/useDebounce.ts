import { useEffect, useState } from 'react';

/**
 * Hook para debounce de valores
 * Previene llamadas excesivas a APIs en campos de búsqueda
 *
 * @param value - Valor a debounce
 * @param delay - Delay en milisegundos (default: 500ms)
 * @returns valor debounced
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
