'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import { operacionesApi } from '@/lib/api';
import type { OperacionDiaria, VehiculoOperacion } from '@/types';
import { FiPlus, FiEye } from 'react-icons/fi';

export default function OperacionesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [operaciones, setOperaciones] = useState<OperacionDiaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    fecha_operacion: new Date().toISOString().split('T')[0],
    cantidad_vehiculos_solicitados: 1,
    observacion: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadOperaciones();
    }
  }, [user, authLoading, router]);

  const loadOperaciones = async () => {
    try {
      const data = await operacionesApi.list({ limit: 50 });
      setOperaciones(data);
    } catch (error) {
      console.error('Error loading operaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await operacionesApi.create(formData);
      setShowForm(false);
      setFormData({
        fecha_operacion: new Date().toISOString().split('T')[0],
        cantidad_vehiculos_solicitados: 1,
        observacion: '',
      });
      loadOperaciones();
    } catch (error) {
      console.error('Error creating operacion:', error);
      alert('Error al crear la operación');
    }
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
            <h1 className="text-3xl font-bold text-gray-900">Operaciones Diarias</h1>
            <p className="mt-2 text-sm text-gray-700">
              Gestión de vehículos necesarios para operaciones diarias
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
          >
            <FiPlus className="mr-2 h-5 w-5" />
            Nueva Operación
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <Card title="Nueva Operación Diaria">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fecha de Operación
                </label>
                <input
                  type="date"
                  required
                  value={formData.fecha_operacion}
                  onChange={(e) =>
                    setFormData({ ...formData, fecha_operacion: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Cantidad de Vehículos Solicitados
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.cantidad_vehiculos_solicitados}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cantidad_vehiculos_solicitados: parseInt(e.target.value),
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Observaciones
                </label>
                <textarea
                  rows={3}
                  value={formData.observacion}
                  onChange={(e) =>
                    setFormData({ ...formData, observacion: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
                >
                  Crear Operación
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* Operaciones List */}
        <Card title="Lista de Operaciones">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Vehículos Solicitados
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Vehículos Iniciados
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Observaciones
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {operaciones.map((operacion) => (
                  <tr key={operacion.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {new Date(operacion.fecha_operacion).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {operacion.cantidad_vehiculos_solicitados}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {operacion.vehiculos?.length || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {operacion.observacion || '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                      <button
                        onClick={() => router.push(`/operaciones/${operacion.id}`)}
                        className="text-primary-600 hover:text-primary-900 inline-flex items-center"
                      >
                        <FiEye className="mr-1 h-4 w-4" />
                        Ver Detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
