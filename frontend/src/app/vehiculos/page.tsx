'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import DataTable, { Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import SimpleLoader from '@/components/ui/SimpleLoader';
import Toast from '@/components/ui/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { tiposVehiculoApi, vehiculosApi } from '@/lib/api';
import type { TipoVehiculo, Vehiculo, VehiculoCreate } from '@/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FiPlus, FiTruck } from 'react-icons/fi';

export default function VehiculosPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [tiposVehiculo, setTiposVehiculo] = useState<TipoVehiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<VehiculoCreate>({
    placa: '',
    marca: '',
    modelo: '',
    anio: new Date().getFullYear(),
    tipo_vehiculo_id: undefined,
    estado: 'disponible',
    conductor_asignado: '',
    observaciones: '',
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
      const [vehiculosData, tiposData] = await Promise.all([
        vehiculosApi.list({ activo: true }),
        tiposVehiculoApi.list({ estado: 'activo' }),
      ]);
      setVehiculos(vehiculosData);
      setTiposVehiculo(tiposData);
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
        await vehiculosApi.update(editingId, formData);
        showToast('Vehículo actualizado exitosamente', 'success');
      } else {
        await vehiculosApi.create(formData);
        showToast('Vehículo creado exitosamente', 'success');
      }
      setShowForm(false);
      setEditingId(null);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Error saving vehiculo:', error);
      const message =
        error?.response?.data?.detail || 'Error al guardar el vehículo';
      showToast(message, 'error');
    }
  };

  const handleEdit = (vehiculo: Vehiculo) => {
    setFormData({
      placa: vehiculo.placa,
      marca: vehiculo.marca || '',
      modelo: vehiculo.modelo || '',
      anio: vehiculo.anio,
      tipo_vehiculo_id: vehiculo.tipo_vehiculo_id,
      estado: vehiculo.estado,
      conductor_asignado: vehiculo.conductor_asignado || '',
      observaciones: vehiculo.observaciones || '',
    });
    setEditingId(vehiculo.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      placa: '',
      marca: '',
      modelo: '',
      anio: new Date().getFullYear(),
      tipo_vehiculo_id: undefined,
      estado: 'disponible',
      conductor_asignado: '',
      observaciones: '',
    });
    setEditingId(null);
  };

  const getTipoNombre = (tipoId?: number) => {
    if (!tipoId) return '-';
    const tipo = tiposVehiculo.find((t) => t.id === tipoId);
    return tipo?.descripcion || '-';
  };

  const getEstadoBadge = (estado: string) => {
    return estado === 'disponible'
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800';
  };

  const getEstadoLabel = (estado: string) => {
    return estado === 'disponible' ? 'Disponible' : 'Inactivo';
  };

  // Definir columnas de la tabla
  const columns: Column<Vehiculo>[] = [
    {
      key: 'placa',
      label: 'Placa',
      sortable: true,
    },
    {
      key: 'marca',
      label: 'Marca',
      sortable: true,
      render: (value) => (value as string) || '-',
    },
    {
      key: 'modelo',
      label: 'Modelo',
      sortable: true,
      render: (value) => (value as string) || '-',
    },
    {
      key: 'tipo_vehiculo_id',
      label: 'Tipo',
      sortable: true,
      render: (value) => getTipoNombre(value as number),
    },
    {
      key: 'anio',
      label: 'Año',
      sortable: true,
      render: (value) => (value as number) || '-',
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
          {getEstadoLabel(value as string)}
        </span>
      ),
    },
    {
      key: 'conductor_asignado',
      label: 'Conductor',
      sortable: true,
      render: (value) => (value as string) || '-',
    },
  ];

  if (authLoading || loading) {
    return <SimpleLoader message="Cargando vehículos..." />;
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
              Gestión de Vehículos
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              Administre la flota de vehículos del sistema
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
            Nuevo Vehículo
          </button>
        </div>

        {/* Create/Edit Modal */}
        <Modal
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            resetForm();
          }}
          title={editingId ? 'Editar Vehículo' : 'Nuevo Vehículo'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Placa *
                </label>
                <input
                  type="text"
                  required
                  value={formData.placa}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      placa: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="ABC123"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tipo de Vehículo
                </label>
                <select
                  value={formData.tipo_vehiculo_id || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tipo_vehiculo_id: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900"
                >
                  <option value="">Seleccione un tipo</option>
                  {tiposVehiculo.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.descripcion}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Marca
                </label>
                <input
                  type="text"
                  value={formData.marca}
                  onChange={(e) =>
                    setFormData({ ...formData, marca: e.target.value })
                  }
                  placeholder="Toyota, Ford, etc."
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Modelo
                </label>
                <input
                  type="text"
                  value={formData.modelo}
                  onChange={(e) =>
                    setFormData({ ...formData, modelo: e.target.value })
                  }
                  placeholder="Hilux, F-150, etc."
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Año
                </label>
                <input
                  type="number"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  value={formData.anio}
                  onChange={(e) =>
                    setFormData({ ...formData, anio: parseInt(e.target.value) })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900"
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
                    setFormData({ ...formData, estado: e.target.value as any })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900"
                >
                  <option value="disponible">Disponible</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Conductor Asignado
                </label>
                <input
                  type="text"
                  value={formData.conductor_asignado}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      conductor_asignado: e.target.value,
                    })
                  }
                  placeholder="Nombre del conductor"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Observaciones
                </label>
                <textarea
                  rows={3}
                  value={formData.observaciones}
                  onChange={(e) =>
                    setFormData({ ...formData, observaciones: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900 placeholder:text-gray-400"
                />
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
                {editingId ? 'Actualizar' : 'Crear'} Vehículo
              </button>
            </div>
          </form>
        </Modal>

        {/* Vehiculos List */}
        <Card title="Lista de Vehículos">
          <DataTable
            data={vehiculos}
            columns={columns}
            onEdit={handleEdit}
            emptyMessage="No hay vehículos registrados"
            emptyIcon={<FiTruck className="mx-auto h-12 w-12 text-gray-400" />}
            searchPlaceholder="Buscar vehículo..."
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
