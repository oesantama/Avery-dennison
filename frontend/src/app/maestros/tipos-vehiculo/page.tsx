'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import { tiposVehiculoApi } from '@/lib/api';
import type { TipoVehiculo, TipoVehiculoCreate } from '@/types';
import { FiPlus, FiEdit2, FiTrash2, FiTool } from 'react-icons/fi';

export default function TiposVehiculoPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
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
      } else {
        await tiposVehiculoApi.create(formData);
      }
      setShowForm(false);
      setEditingId(null);
      resetForm();
      loadTipos();
    } catch (error: any) {
      console.error('Error saving tipo:', error);
      const message = error?.response?.data?.detail || 'Error al guardar el tipo de vehículo';
      alert(message);
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

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de que desea inactivar este tipo de vehículo?')) {
      return;
    }
    try {
      await tiposVehiculoApi.delete(id);
      loadTipos();
    } catch (error) {
      console.error('Error deleting tipo:', error);
      alert('Error al eliminar el tipo de vehículo');
    }
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

        {/* Create/Edit Form */}
        {showForm && (
          <Card title={editingId ? 'Editar Tipo de Vehículo' : 'Nuevo Tipo de Vehículo'}>
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
                  {editingId ? 'Actualizar' : 'Crear'} Tipo
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* Tipos List */}
        <Card title="Lista de Tipos de Vehículo">
          {tipos.length === 0 ? (
            <div className="text-center py-12">
              <FiTool className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No hay tipos de vehículo registrados
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Comience agregando tipos de vehículos.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Fecha Control
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {tipos.map((tipo) => (
                    <tr key={tipo.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        {tipo.id}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {tipo.descripcion}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getEstadoBadge(
                            tipo.estado
                          )}`}
                        >
                          {tipo.estado === 'activo' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {new Date(tipo.fecha_control).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium space-x-3">
                        <button
                          onClick={() => handleEdit(tipo)}
                          className="text-primary-600 hover:text-primary-900 inline-flex items-center"
                        >
                          <FiEdit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(tipo.id)}
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
