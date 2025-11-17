'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import DataTable, { Column } from '@/components/ui/DataTable';
import { rolesApi } from '@/lib/api';
import type { Rol, RolCreate } from '@/types';
import { FiPlus, FiShield } from 'react-icons/fi';

export default function RolesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<RolCreate>({
    nombre: '',
    descripcion: '',
    activo: true,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadRoles();
    }
  }, [user, authLoading, router]);

  const loadRoles = async () => {
    try {
      const data = await rolesApi.list();
      setRoles(data);
    } catch (error) {
      console.error('Error loading roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await rolesApi.update(editingId, formData);
      } else {
        await rolesApi.create(formData);
      }
      setShowForm(false);
      setEditingId(null);
      resetForm();
      loadRoles();
    } catch (error: any) {
      console.error('Error saving rol:', error);
      const message = error?.response?.data?.detail || 'Error al guardar el rol';
      alert(message);
    }
  };

  const handleEdit = (rol: Rol) => {
    setFormData({
      nombre: rol.nombre,
      descripcion: rol.descripcion || '',
      activo: rol.activo,
    });
    setEditingId(rol.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de que desea desactivar este rol?')) {
      return;
    }
    try {
      await rolesApi.delete(id);
      loadRoles();
    } catch (error: any) {
      console.error('Error deleting rol:', error);
      const message = error?.response?.data?.detail || 'Error al desactivar el rol';
      alert(message);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      activo: true,
    });
    setEditingId(null);
  };

  const getActivoBadge = (activo: boolean) => {
    return activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const getActivoLabel = (activo: boolean) => {
    return activo ? 'Activo' : 'Inactivo';
  };

  // Definir columnas de la tabla
  const columns: Column<Rol>[] = [
    {
      key: 'nombre',
      label: 'Nombre',
      sortable: true,
    },
    {
      key: 'descripcion',
      label: 'Descripción',
      sortable: true,
      render: (rol) => rol.descripcion || '-',
    },
    {
      key: 'activo',
      label: 'Estado',
      sortable: true,
      render: (rol) => (
        <span
          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getActivoBadge(
            rol.activo
          )}`}
        >
          {getActivoLabel(rol.activo)}
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
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Roles</h1>
            <p className="mt-2 text-sm text-gray-700">
              Administre los roles del sistema
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
            Nuevo Rol
          </button>
        </div>

        {/* Create/Edit Form */}
        {showForm && (
          <Card title={editingId ? 'Editar Rol' : 'Nuevo Rol'}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
                    placeholder="Administrador, Operador, etc."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900 placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Estado *
                  </label>
                  <select
                    required
                    value={formData.activo ? 'true' : 'false'}
                    onChange={(e) =>
                      setFormData({ ...formData, activo: e.target.value === 'true' })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900"
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Descripción
                  </label>
                  <textarea
                    rows={3}
                    value={formData.descripcion}
                    onChange={(e) =>
                      setFormData({ ...formData, descripcion: e.target.value })
                    }
                    placeholder="Descripción del rol..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900 placeholder:text-gray-400"
                  />
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
                  {editingId ? 'Actualizar' : 'Crear'} Rol
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* Roles List */}
        <Card title="Lista de Roles">
          <DataTable
            data={roles}
            columns={columns}
            onEdit={handleEdit}
            onDelete={(rol) => handleDelete(rol.id)}
            emptyMessage="No hay roles registrados"
            emptyIcon={<FiShield className="mx-auto h-12 w-12 text-gray-400" />}
            searchPlaceholder="Buscar rol..."
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
