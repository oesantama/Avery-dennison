import { authApi } from '@/lib/api';
import { useEffect, useState } from 'react';

interface PagePermissions {
  puede_ver: boolean;
  puede_crear: boolean;
  puede_editar: boolean;
  puede_borrar: boolean;
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [detailedPermissions, setDetailedPermissions] = useState<Record<string, PagePermissions>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      const data = await authApi.getMyPermissions();
      setPermissions(data.pages || []);
      setDetailedPermissions(data.permissions || {});
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
