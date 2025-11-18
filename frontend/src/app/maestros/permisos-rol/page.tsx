'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import DataTable, { Column } from '@/components/ui/DataTable';
import { permisosRolApi, rolesApi, pagesApi } from '@/lib/api';
import type { PermisoRol, PermisoRolCreate, Rol, Page } from '@/types';
import { FiPlus, FiShield } from 'react-icons/fi';

export default function PermisosRolPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [permisos, setPermisos] = useState<PermisoRol[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<PermisoRolCreate>({
    rol_id: 0,
    page_id: 0,
    estado: 'activo',
    puede_ver: false,
    puede_crear: false,
    puede_editar: false,
    puede_borrar: false,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadData();
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    try {
      const [permisosData, rolesData, pagesData] = await Promise.all([
        permisosRolApi.list(),
        rolesApi.list({ activo: true }),
        pagesApi.list({ activo: true }),
      ]);
      setPermisos(permisosData);
      setRoles(rolesData);
      setPages(pagesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await permisosRolApi.update(editingId, {
          estado: formData.estado,
          puede_ver: formData.puede_ver,
          puede_crear: formData.puede_crear,
          puede_editar: formData.puede_editar,
          puede_borrar: formData.puede_borrar,
        });
      } else {
        await permisosRolApi.create(formData);
      }
      setShowForm(false);
      setEditingId(null);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Error saving permiso:', error);
      const message = error?.response?.data?.detail || 'Error al guardar el permiso';
      alert(message);
    }
  };

  const handleEdit = (permiso: PermisoRol) => {
    setFormData({
      rol_id: permiso.rol_id,
      page_id: permiso.page_id,
      estado: permiso.estado,
      puede_ver: permiso.puede_ver,
      puede_crear: permiso.puede_crear,
      puede_editar: permiso.puede_editar,
      puede_borrar: permiso.puede_borrar,
    });
    setEditingId(permiso.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de que desea desactivar este permiso?')) {
      return;
    }
    try {
      await permisosRolApi.delete(id);
      loadData();
    } catch (error: any) {
      console.error('Error deleting permiso:', error);
      const message = error?.response?.data?.detail || 'Error al desactivar el permiso';
      alert(message);
    }
  };

  const resetForm = () => {
    setFormData({
      rol_id: 0,
      page_id: 0,
      estado: 'activo',
      puede_ver: false,
      puede_crear: false,
      puede_editar: false,
      puede_borrar: false,
    });
    setEditingId(null);
  };

  const getRolNombre = (rolId: number) => {
    const rol = roles.find((r) => r.id === rolId);
    return rol?.nombre || `Rol ${rolId}`;
  };

  const getPageNombre = (pageId: number) => {
    const page = pages.find((p) => p.id === pageId);
    return page?.nombre_display || `Página ${pageId}`;
  };

  const getEstadoBadge = (estado: string) => {
    return estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const getEstadoLabel = (estado: string) => {
    return estado === 'activo' ? 'Activo' : 'Inactivo';
  };

  // Definir columnas de la tabla
  const columns: Column<PermisoRol>[] = [
    {
      key: 'rol_id',
      label: 'Rol',
      sortable: true,
      render: (permiso) => getRolNombre(permiso.rol_id),
    },
    {
      key: 'page_id',
      label: 'Página',
      sortable: true,
      render: (permiso) => getPageNombre(permiso.page_id),
    },
    {
      key: 'puede_ver',
      label: 'Ver',
      sortable: true,
      render: (permiso) =>
        permiso.puede_ver ? (
          <span className="text-green-600">✓</span>
        ) : (
          <span className="text-gray-300">-</span>
        ),
    },
    {
      key: 'puede_crear',
      label: 'Crear',
      sortable: true,
      render: (permiso) =>
        permiso.puede_crear ? (
          <span className="text-green-600">✓</span>
        ) : (
          <span className="text-gray-300">-</span>
        ),
    },
    {
      key: 'puede_editar',
      label: 'Editar',
      sortable: true,
      render: (permiso) =>
        permiso.puede_editar ? (
          <span className="text-green-600">✓</span>
        ) : (
          <span className="text-gray-300">-</span>
        ),
    },
    {
      key: 'puede_borrar',
      label: 'Borrar',
      sortable: true,
      render: (permiso) =>
        permiso.puede_borrar ? (
          <span className="text-green-600">✓</span>
        ) : (
          <span className="text-gray-300">-</span>
        ),
    },
    {
      key: 'estado',
      label: 'Estado',
      sortable: true,
      render: (permiso) => (
        <span
          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getEstadoBadge(
            permiso.estado
          )}`}
        >
          {getEstadoLabel(permiso.estado)}
        </span>
      ),
    },
  ];

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Cargando...</h2>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Permisos por Rol</h1>
            <p className="mt-2 text-sm text-gray-700">
              Administre los permisos de cada rol en las páginas del sistema
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
            className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
          >
            <FiPlus className="mr-2 h-5 w-5" />
            Nuevo Permiso
          </button>
        </div>

        {/* Create/Edit Form */}
        {showForm && (
          <Card title={editingId ? 'Editar Permiso' : 'Nuevo Permiso'}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Rol *
                  </label>
                  <select
                    required
                    disabled={!!editingId}
                    value={formData.rol_id || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rol_id: parseInt(e.target.value),
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900 disabled:bg-gray-100"
                  >
                    <option value="">Seleccione un rol</option>
                    {roles.map((rol) => (
                      <option key={rol.id} value={rol.id}>
                        {rol.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Página *
                  </label>
                  <select
                    required
                    disabled={!!editingId}
                    value={formData.page_id || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        page_id: parseInt(e.target.value),
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900 disabled:bg-gray-100"
                  >
                    <option value="">Seleccione una página</option>
                    {pages.map((page) => (
                      <option key={page.id} value={page.id}>
                        {page.nombre_display}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Estado *
                  </label>
                  <select
                    required
                    value={formData.estado}
                    onChange={(e) =>
                      setFormData({ ...formData, estado: e.target.value as 'activo' | 'inactivo' })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900"
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Permisos
                  </label>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="puede_ver"
                        checked={formData.puede_ver}
                        onChange={(e) =>
                          setFormData({ ...formData, puede_ver: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor="puede_ver" className="ml-2 block text-sm text-gray-900">
                        Puede Ver
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="puede_crear"
                        checked={formData.puede_crear}
                        onChange={(e) =>
                          setFormData({ ...formData, puede_crear: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor="puede_crear" className="ml-2 block text-sm text-gray-900">
                        Puede Crear
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="puede_editar"
                        checked={formData.puede_editar}
                        onChange={(e) =>
                          setFormData({ ...formData, puede_editar: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor="puede_editar" className="ml-2 block text-sm text-gray-900">
                        Puede Editar
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="puede_borrar"
                        checked={formData.puede_borrar}
                        onChange={(e) =>
                          setFormData({ ...formData, puede_borrar: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor="puede_borrar" className="ml-2 block text-sm text-gray-900">
                        Puede Borrar
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
                >
                  {editingId ? 'Actualizar' : 'Crear'} Permiso
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* Permisos List */}
        <Card title="Lista de Permisos por Rol">
          <DataTable
            data={permisos}
            columns={columns}
            onEdit={handleEdit}
            emptyMessage="No hay permisos configurados"
            emptyIcon={<FiShield className="mx-auto h-12 w-12 text-gray-400" />}
            searchPlaceholder="Buscar permiso..."
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
