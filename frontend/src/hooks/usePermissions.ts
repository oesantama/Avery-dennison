import { authApi } from '@/lib/api';
import { useEffect, useState } from 'react';

interface PagePermissions {
  puede_ver: boolean;
  puede_crear: boolean;
  puede_editar: boolean;
  puede_borrar: boolean;
}

const PERMISSIONS_CACHE_KEY = 'cached_permissions';
const PERMISSIONS_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export function usePermissions() {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [detailedPermissions, setDetailedPermissions] = useState<Record<string, PagePermissions>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      // ✅ Intentar cargar del caché primero
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(PERMISSIONS_CACHE_KEY);
        if (cached) {
          try {
            const { data, timestamp } = JSON.parse(cached);
            const now = Date.now();

            // Si el caché es válido (menos de 5 minutos), usarlo
            if (now - timestamp < PERMISSIONS_CACHE_TTL) {
              setPermissions(data.pages || []);
              setDetailedPermissions(data.permissions || {});
              setLoading(false);
              return;
            }
          } catch (e) {
            // Si falla el parse, continuar con la carga normal
          }
        }
      }

      // Si no hay caché válido, cargar desde la API
      const data = await authApi.getMyPermissions();
      setPermissions(data.pages || []);
      setDetailedPermissions(data.permissions || {});

      // ✅ Guardar en caché
      if (typeof window !== 'undefined') {
        localStorage.setItem(PERMISSIONS_CACHE_KEY, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
      setPermissions([]);
      setDetailedPermissions({});
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (pageUrl: string): boolean => {
    return permissions.includes(pageUrl);
  };

  const canView = (pageUrl: string): boolean => {
    return detailedPermissions[pageUrl]?.puede_ver || false;
  };

  const canCreate = (pageUrl: string): boolean => {
    return detailedPermissions[pageUrl]?.puede_crear || false;
  };

  const canEdit = (pageUrl: string): boolean => {
    return detailedPermissions[pageUrl]?.puede_editar || false;
  };

  const canDelete = (pageUrl: string): boolean => {
    return detailedPermissions[pageUrl]?.puede_borrar || false;
  };

  const getPagePermissions = (pageUrl: string): PagePermissions => {
    return detailedPermissions[pageUrl] || {
      puede_ver: false,
      puede_crear: false,
      puede_editar: false,
      puede_borrar: false,
    };
  };

  return { 
    permissions, 
    detailedPermissions,
    loading, 
    hasPermission,
    canView,
    canCreate,
    canEdit,
    canDelete,
    getPagePermissions,
  };
}
