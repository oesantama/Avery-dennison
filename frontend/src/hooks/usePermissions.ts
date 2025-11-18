import { authApi } from '@/lib/api';
import { useEffect, useState } from 'react';

export function usePermissions() {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      const data = await authApi.getMyPermissions();
      setPermissions(data.pages);
    } catch (error) {
      console.error('Error loading permissions:', error);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (pageUrl: string): boolean => {
    // Admin siempre tiene todos los permisos
    if (permissions.includes('/maestros/usuarios')) {
      return true;
    }
    return permissions.includes(pageUrl);
  };

  return { permissions, loading, hasPermission };
}
