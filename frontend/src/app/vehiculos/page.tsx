'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import { vehiculosApi, tiposVehiculoApi } from '@/lib/api';
import type { Vehiculo, VehiculoCreate, TipoVehiculo } from '@/types';
import { FiPlus, FiEdit2, FiTrash2, FiTruck } from 'react-icons/fi';

export default function VehiculosPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
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
    tipo: '',
    tipo_vehiculo_id: 0,
    estado: 'disponible',
    conductor_asignado: '',
    observaciones: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadVehiculos();
      loadTiposVehiculo();
    }
  }, [user, authLoading, router]);

  const loadVehiculos = async () => {
    try {
      const data = await vehiculosApi.list({ activo: true });
      setVehiculos(data);
    } catch (error) {
      console.error('Error loading vehiculos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTiposVehiculo = async () => {
    try {
      const data = await tiposVehiculoApi.listActivos();
      setTiposVehiculo(data);
    } catch (error) {
      console.error('Error loading tipos de vehiculo:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await vehiculosApi.update(editingId, formData);
      } else {
        await vehiculosApi.create(formData);
      }
      setShowForm(false);
      setEditingId(null);
      resetForm();
      loadVehiculos();
    } catch (error: any) {
      console.error('Error saving vehiculo:', error);
      const message = error?.response?.data?.detail || 'Error al guardar el vehículo';
      alert(message);
    }
  };

  const handleEdit = (vehiculo: Vehiculo) => {
    setFormData({
      placa: vehiculo.placa,
      marca: vehiculo.marca || '',
      modelo: vehiculo.modelo || '',
      anio: vehiculo.anio || new Date().getFullYear(),
      tipo: vehiculo.tipo || '',
      tipo_vehiculo_id: vehiculo.tipo_vehiculo_id || 0,
      estado: vehiculo.estado,
      conductor_asignado: vehiculo.conductor_asignado || '',
      observaciones: vehiculo.observaciones || '',
    });
    setEditingId(vehiculo.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de que desea eliminar este vehículo?')) {
      return;
    }
    try {
      await vehiculosApi.delete(id);
      loadVehiculos();
    } catch (error) {
      console.error('Error deleting vehiculo:', error);
      alert('Error al eliminar el vehículo');
    }
  };

  const resetForm = () => {
    setFormData({
      placa: '',
      marca: '',
      modelo: '',
      anio: new Date().getFullYear(),
      tipo: '',
      tipo_vehiculo_id: 0,
      estado: 'disponible',
      conductor_asignado: '',
      observaciones: '',
    });
    setEditingId(null);
  };

  const getEstadoBadge = (estado: string) => {
    const badges = {
      disponible: 'bg-green-100 text-green-800',
      en_operacion: 'bg-blue-100 text-blue-800',
      mantenimiento: 'bg-yellow-100 text-yellow-800',
      inactivo: 'bg-gray-100 text-gray-800',
    };
    return badges[estado as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getEstadoLabel = (estado: string) => {
    const labels = {
      disponible: 'Disponible',
      en_operacion: 'En Operación',
      mantenimiento: 'Mantenimiento',
      inactivo: 'Inactivo',
    };
    return labels[estado as keyof typeof labels] || estado;
  };

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
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Vehículos</h1>
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

        {/* Create/Edit Form */}
        {showForm && (
          <Card title={editingId ? 'Editar Vehículo' : 'Nuevo Vehículo'}>
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
                      setFormData({ ...formData, placa: e.target.value.toUpperCase() })
                    }
                    placeholder="ABC123"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900 placeholder:text-gray-400"
                  />
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
                    Tipo *
                  </label>
                  <select
                    required
                    value={formData.tipo_vehiculo_id || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, tipo_vehiculo_id: parseInt(e.target.value) })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900"
                  >
                    <option value="">Seleccione un tipo de vehículo</option>
                    {tiposVehiculo.map((tipo) => (
                      <option key={tipo.id} value={tipo.id}>
                        {tipo.descripcion}
                      </option>
                    ))}
                  </select>
                  {tiposVehiculo.length === 0 && (
                    <p className="mt-1 text-sm text-yellow-600">
                      No hay tipos de vehículo disponibles. Contacte al administrador.
                    </p>
                  )}
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
                    <option value="en_operacion">En Operación</option>
                    <option value="mantenimiento">Mantenimiento</option>
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
                      setFormData({ ...formData, conductor_asignado: e.target.value })
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
                  {editingId ? 'Actualizar' : 'Crear'} Vehículo
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* Vehiculos List */}
        <Card title="Lista de Vehículos">
          {vehiculos.length === 0 ? (
            <div className="text-center py-12">
              <FiTruck className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No hay vehículos registrados
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Comience agregando vehículos a la flota.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Placa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Marca/Modelo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Año
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Conductor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {vehiculos.map((vehiculo) => (
                    <tr key={vehiculo.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        {vehiculo.placa}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {vehiculo.marca && vehiculo.modelo
                          ? `${vehiculo.marca} ${vehiculo.modelo}`
                          : vehiculo.marca || vehiculo.modelo || '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {vehiculo.anio || '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {vehiculo.tipo_descripcion || vehiculo.tipo || 'Sin tipo'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getEstadoBadge(
                            vehiculo.estado
                          )}`}
                        >
                          {getEstadoLabel(vehiculo.estado)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {vehiculo.conductor_asignado || '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium space-x-3">
                        <button
                          onClick={() => handleEdit(vehiculo)}
                          className="text-primary-600 hover:text-primary-900 inline-flex items-center"
                        >
                          <FiEdit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(vehiculo.id)}
                          className="text-red-600 hover:text-red-900 inline-flex items-center"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
