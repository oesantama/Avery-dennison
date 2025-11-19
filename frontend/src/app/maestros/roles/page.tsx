'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import DataTable, { Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import SimpleLoader from '@/components/ui/SimpleLoader';
import Toast from '@/components/ui/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { rolesApi } from '@/lib/api';
import type { Rol, RolCreate } from '@/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FiPlus, FiShield } from 'react-icons/fi';

export default function RolesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<RolCreate>({
    nombre: '',
    estado: 'activo',
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
        showToast('Rol actualizado exitosamente', 'success');
      } else {
        await rolesApi.create(formData);
        showToast('Rol creado exitosamente', 'success');
      }
      setShowForm(false);
      setEditingId(null);
      resetForm();
      loadRoles();
    } catch (error: any) {
      console.error('Error saving rol:', error);
      const message =
        error?.response?.data?.detail || 'Error al guardar el rol';
      showToast(message, 'error');
    }
  };

  const handleEdit = (rol: Rol) => {
    setFormData({
      nombre: rol.nombre,
      estado: rol.estado,
    });
    setEditingId(rol.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      estado: 'activo',
    });
    setEditingId(null);
  };

  const getEstadoBadge = (estado: string) => {
    return estado === 'activo'
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800';
  };

  // Definir columnas de la tabla
  const columns: Column<Rol>[] = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
    },
    {
      key: 'nombre',
      label: 'Nombre',
      sortable: true,
    },
    {
      key: 'estado',
      label: 'Estado',
      sortable: true,
      render: (value) => (
        <span
          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getEstadoBadge(
            value as string
          )}`}
        >
          {(value as string) === 'activo' ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      key: 'fecha_control',
      label: 'Fecha Control',
      sortable: true,
      render: (value) => new Date(value as string).toLocaleDateString('es-CO'),
    },
  ];

  if (authLoading || loading) {
    return <SimpleLoader message="Cargando roles..." />;
  }

  return (
    <DashboardLayout>
      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Gestión de Roles
            </h1>
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

        {/* Create/Edit Modal */}
        <Modal
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            resetForm();
          }}
          title={editingId ? 'Editar Rol' : 'Nuevo Rol'}
          size="md"
        >
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
                  value={formData.estado}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estado: e.target.value as 'activo' | 'inactivo',
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900"
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
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
        </Modal>

        {/* Roles List */}
        <Card title="Lista de Roles">
          <DataTable
            data={roles}
            columns={columns}
            onEdit={handleEdit}
            emptyMessage="No hay roles registrados"
            emptyIcon={<FiShield className="mx-auto h-12 w-12 text-gray-400" />}
            searchPlaceholder="Buscar rol..."
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
