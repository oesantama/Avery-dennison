'use client';

import { pagesApi, permisosRolApi } from '@/lib/api';
import type { Page, PermisoRol, PermisoUsuarioCreate } from '@/types';
import { useEffect, useState } from 'react';
import { FiCheck } from 'react-icons/fi';

interface PermisosUsuarioSelectorProps {
  rolId: number;
  permisosUsuario: PermisoUsuarioCreate[];
  onChange: (permisos: PermisoUsuarioCreate[]) => void;
}

export default function PermisosUsuarioSelector({
  rolId,
  permisosUsuario,
  onChange,
}: PermisosUsuarioSelectorProps) {
  const [pages, setPages] = useState<Page[]>([]);
  const [permisosRol, setPermisosRol] = useState<PermisoRol[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [lastRolId, setLastRolId] = useState(0);

  useEffect(() => {
    // Reiniciar cuando cambia el rol
    if (rolId !== lastRolId) {
      setInitialized(false);
      setLastRolId(rolId);
    }

    if (rolId > 0) {
      loadData();
    }
  }, [rolId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pagesData, permisosRolData] = await Promise.all([
        pagesApi.list({ activo: true }),
        permisosRolApi.list({ rol_id: rolId }),
      ]);
      setPages(pagesData);
      setPermisosRol(permisosRolData);

      // ✅ Solo inicializar una vez y si no hay permisos del usuario
      if (
        !initialized &&
        permisosUsuario.length === 0 &&
        permisosRolData.length > 0
      ) {
        const permisosIniciales = permisosRolData.map((pr: PermisoRol) => ({
          page_id: pr.page_id,
          usuario_id: 0, // Se asignará al crear el usuario
          puede_ver: pr.puede_ver,
          puede_crear: pr.puede_crear,
          puede_editar: pr.puede_editar,
          puede_borrar: pr.puede_borrar,
          estado: 'activo' as const,
        }));
        onChange(permisosIniciales);
        setInitialized(true);
      }
    } catch (error) {
      console.error('Error loading permisos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePermisoChange = (
    pageId: number,
    field: 'puede_ver' | 'puede_crear' | 'puede_editar' | 'puede_borrar',
    value: boolean
  ) => {
    const existingIndex = permisosUsuario.findIndex(
      (p) => p.page_id === pageId
    );

    if (existingIndex >= 0) {
      // Actualizar permiso existente
      const updated = [...permisosUsuario];
      updated[existingIndex] = {
        ...updated[existingIndex],
        [field]: value,
      };
      onChange(updated);
    } else {
      // Crear nuevo permiso
      const permisoRol = permisosRol.find((pr) => pr.page_id === pageId);
      const nuevoPermiso: PermisoUsuarioCreate = {
        page_id: pageId,
        usuario_id: 0,
        puede_ver: permisoRol?.puede_ver || false,
        puede_crear: permisoRol?.puede_crear || false,
        puede_editar: permisoRol?.puede_editar || false,
        puede_borrar: permisoRol?.puede_borrar || false,
        estado: 'activo',
        [field]: value,
      };
      onChange([...permisosUsuario, nuevoPermiso]);
    }
  };

  const getPermisoValue = (
    pageId: number,
    field: 'puede_ver' | 'puede_crear' | 'puede_editar' | 'puede_borrar'
  ): boolean => {
    const permiso = permisosUsuario.find((p) => p.page_id === pageId);
    if (permiso) {
      return permiso[field] || false;
    }
    // Si no hay permiso del usuario, usar el del rol
    const permisoRol = permisosRol.find((pr) => pr.page_id === pageId);
    return permisoRol?.[field] || false;
  };

  const getPermisoRolValue = (
    pageId: number,
    field: 'puede_ver' | 'puede_crear' | 'puede_editar' | 'puede_borrar'
  ): boolean => {
    const permisoRol = permisosRol.find((pr) => pr.page_id === pageId);
    return permisoRol?.[field] || false;
  };

  if (loading) {
    return (
      <div className="text-center text-gray-500">Cargando permisos...</div>
    );
  }

  if (!rolId) {
    return (
      <div className="text-center text-gray-500 py-4">
        Seleccione un rol para ver los permisos disponibles
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
        <p className="text-sm text-blue-800 mb-2">
          <strong>📋 Permisos personalizados por usuario</strong>
        </p>
        <p className="text-xs text-blue-700">
          • Los permisos marcados con{' '}
          <span className="text-green-600 font-semibold">✓ Rol</span> son
          heredados del rol seleccionado
          <br />
          • Puede activar/desactivar cualquier permiso para personalizar este
          usuario
          <br />• Las páginas sin marca no están permitidas en el rol, pero
          puede habilitarlas aquí
        </p>
      </div>

      <div className="overflow-x-auto">
        {/* tabla continúa... */}
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Página
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Ver
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Crear
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Editar
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Eliminar
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pages.map((page) => {
              const permisoRolVer = getPermisoRolValue(page.id, 'puede_ver');
              const permisoRolCrear = getPermisoRolValue(
                page.id,
                'puede_crear'
              );
              const permisoRolEditar = getPermisoRolValue(
                page.id,
                'puede_editar'
              );
              const permisoRolBorrar = getPermisoRolValue(
                page.id,
                'puede_borrar'
              );

              return (
                <tr key={page.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {page.nombre_display}
                    <div className="text-xs text-gray-500">{page.ruta}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <input
                      type="checkbox"
                      checked={getPermisoValue(page.id, 'puede_ver')}
                      onChange={(e) =>
                        handlePermisoChange(
                          page.id,
                          'puede_ver',
                          e.target.checked
                        )
                      }
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    {permisoRolVer && (
                      <div className="text-xs text-green-600 mt-1">
                        <FiCheck className="inline h-3 w-3" /> Rol
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <input
                      type="checkbox"
                      checked={getPermisoValue(page.id, 'puede_crear')}
                      onChange={(e) =>
                        handlePermisoChange(
                          page.id,
                          'puede_crear',
                          e.target.checked
                        )
                      }
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    {permisoRolCrear && (
                      <div className="text-xs text-green-600 mt-1">
                        <FiCheck className="inline h-3 w-3" /> Rol
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <input
                      type="checkbox"
                      checked={getPermisoValue(page.id, 'puede_editar')}
                      onChange={(e) =>
                        handlePermisoChange(
                          page.id,
                          'puede_editar',
                          e.target.checked
                        )
                      }
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    {permisoRolEditar && (
                      <div className="text-xs text-green-600 mt-1">
                        <FiCheck className="inline h-3 w-3" /> Rol
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <input
                      type="checkbox"
                      checked={getPermisoValue(page.id, 'puede_borrar')}
                      onChange={(e) =>
                        handlePermisoChange(
                          page.id,
                          'puede_borrar',
                          e.target.checked
                        )
                      }
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    {permisoRolBorrar && (
                      <div className="text-xs text-green-600 mt-1">
                        <FiCheck className="inline h-3 w-3" /> Rol
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
