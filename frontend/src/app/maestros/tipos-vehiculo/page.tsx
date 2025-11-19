'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import DataTable, { Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { tiposVehiculoApi } from '@/lib/api';
import type { TipoVehiculo, TipoVehiculoCreate } from '@/types';
import { FiPlus, FiTool } from 'react-icons/fi';
import Toast from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import SimpleLoader from '@/components/ui/SimpleLoader';

export default function TiposVehiculoPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const [tipos, setTipos] = useState<TipoVehiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<TipoVehiculoCreate>({
    descripcion: '',
    estado: 'activo',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadTipos();
    }
  }, [user, authLoading, router]);

  const loadTipos = async () => {
    try {
      const data = await tiposVehiculoApi.list();
      setTipos(data);
    } catch (error) {
      console.error('Error loading tipos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await tiposVehiculoApi.update(editingId, formData);
        showToast({ message: 'Tipo de vehículo actualizado exitosamente', type: 'success' });
      } else {
        await tiposVehiculoApi.create(formData);
        showToast({ message: 'Tipo de vehículo creado exitosamente', type: 'success' });
      }
      setShowForm(false);
      setEditingId(null);
      resetForm();
      loadTipos();
    } catch (error: any) {
      console.error('Error saving tipo:', error);
      const message = error?.response?.data?.detail || 'Error al guardar el tipo de vehículo';
      showToast(message, 'error');
    }
  };

  const handleEdit = (tipo: TipoVehiculo) => {
    setFormData({
      descripcion: tipo.descripcion,
      estado: tipo.estado,
    });
    setEditingId(tipo.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      descripcion: '',
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
  const columns: Column<TipoVehiculo>[] = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
    },
    {
      key: 'descripcion',
      label: 'Descripción',
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
    return <SimpleLoader message="Cargando tipos de vehículo..." />;
  }

  return (
    <DashboardLayout>
      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tipos de Vehículo</h1>
            <p className="mt-2 text-sm text-gray-700">
              Administre los tipos de vehículos del sistema
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
            Nuevo Tipo
          </button>
        </div>

        {/* Create/Edit Modal */}
        <Modal
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            resetForm();
          }}
          title={editingId ? 'Editar Tipo de Vehículo' : 'Nuevo Tipo de Vehículo'}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Descripción *
              </label>
              <input
                type="text"
                required
                value={formData.descripcion}
                onChange={(e) =>
                  setFormData({ ...formData, descripcion: e.target.value })
                }
                placeholder="Ej: Camioneta, Camión, Furgón"
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
                  setFormData({ ...formData, estado: e.target.value as 'activo' | 'inactivo' })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900"
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
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
                {editingId ? 'Actualizar' : 'Crear'} Tipo
              </button>
            </div>
          </form>
        </Modal>

        {/* Tipos List */}
        <Card title="Lista de Tipos de Vehículo">
          <DataTable
            data={tipos}
            columns={columns}
            onEdit={handleEdit}
            emptyMessage="No hay tipos de vehículo registrados"
            emptyIcon={<FiTool className="mx-auto h-12 w-12 text-gray-400" />}
            searchPlaceholder="Buscar tipo de vehículo..."
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
