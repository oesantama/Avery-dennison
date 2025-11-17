'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import { operacionesApi, entregasApi } from '@/lib/api';
import type { OperacionDiaria, VehiculoOperacion } from '@/types';
import { FiPlus, FiTruck } from 'react-icons/fi';

export default function OperacionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const operacionId = parseInt(params.id as string);
  const { user, loading: authLoading } = useAuth();
  const [operacion, setOperacion] = useState<OperacionDiaria | null>(null);
  const [vehiculos, setVehiculos] = useState<VehiculoOperacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    placa: '',
    hora_inicio: '',
    observacion: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadData();
    }
  }, [user, authLoading, router, operacionId]);

  const loadData = async () => {
    try {
      const [operacionData, vehiculosData] = await Promise.all([
        operacionesApi.get(operacionId),
        operacionesApi.listVehiculos(operacionId),
      ]);
      setOperacion(operacionData);
      setVehiculos(vehiculosData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await operacionesApi.addVehiculo({
        operacion_id: operacionId,
        ...formData,
      });
      setShowForm(false);
      setFormData({
        placa: '',
        hora_inicio: '',
        observacion: '',
      });
      loadData();
    } catch (error) {
      console.error('Error adding vehiculo:', error);
      alert('Error al agregar vehículo. Verifique que la placa no esté duplicada.');
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

  if (!operacion) {
    return (
      <DashboardLayout>
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Operación no encontrada</h2>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Operación del {new Date(operacion.fecha_operacion).toLocaleDateString()}
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            {operacion.cantidad_vehiculos_solicitados} vehículos solicitados -{' '}
            {vehiculos.length} iniciados
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <div className="text-center">
              <dt className="text-sm font-medium text-gray-500">Solicitados</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {operacion.cantidad_vehiculos_solicitados}
              </dd>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <dt className="text-sm font-medium text-gray-500">Iniciados</dt>
              <dd className="mt-1 text-3xl font-semibold text-primary-600">
                {vehiculos.length}
              </dd>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <dt className="text-sm font-medium text-gray-500">Faltantes</dt>
              <dd className="mt-1 text-3xl font-semibold text-yellow-600">
                {Math.max(0, operacion.cantidad_vehiculos_solicitados - vehiculos.length)}
              </dd>
            </div>
          </Card>
        </div>

        {/* Add Vehicle Button */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
          >
            <FiPlus className="mr-2 h-5 w-5" />
            Agregar Vehículo
          </button>
        </div>

        {/* Add Vehicle Form */}
        {showForm && (
          <Card title="Agregar Vehículo a Operación">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Placa del Vehículo *
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
                  Hora de Inicio (opcional)
                </label>
                <input
                  type="time"
                  value={formData.hora_inicio}
                  onChange={(e) =>
                    setFormData({ ...formData, hora_inicio: e.target.value })
                  }
                  placeholder="HH:MM"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Deje vacío para usar la hora actual
                </p>
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900 placeholder:text-gray-400"
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
                  Agregar Vehículo
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* Vehicles List */}
        <Card title="Vehículos en Operación">
          {vehiculos.length === 0 ? (
            <div className="text-center py-12">
              <FiTruck className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No hay vehículos registrados
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Comience agregando vehículos a esta operación.
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
                      Hora Inicio
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
                  {vehiculos.map((vehiculo) => (
                    <tr key={vehiculo.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        {vehiculo.placa}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {vehiculo.hora_inicio || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {vehiculo.observacion || '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                        <button
                          onClick={() => router.push(`/entregas?vehiculo=${vehiculo.id}`)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Ver Entregas
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
