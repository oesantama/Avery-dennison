'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useExportToExcel } from '@/hooks/useExportToExcel';
import { operacionesApi } from '@/lib/api';
import type { OperacionDiaria } from '@/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FiDownload, FiEye, FiPlus, FiSearch } from 'react-icons/fi';

export default function OperacionesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { exportToExcel } = useExportToExcel();
  const [operaciones, setOperaciones] = useState<OperacionDiaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Helper function to get local date without timezone conversion
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    fecha_operacion: getLocalDateString(),
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
        fecha_operacion: getLocalDateString(),
        cantidad_vehiculos_solicitados: 1,
        observacion: '',
      });
      loadOperaciones();
    } catch (error) {
      console.error('Error creating operacion:', error);
      alert('Error al crear la operación');
    }
  };

  // Filtrar operaciones por búsqueda
  const filteredOperaciones = operaciones.filter((op) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      new Date(op.fecha_operacion).toLocaleDateString().includes(searchLower) ||
      op.cantidad_vehiculos_solicitados.toString().includes(searchLower) ||
      (op.vehiculos?.length || 0).toString().includes(searchLower) ||
      (op.observacion && op.observacion.toLowerCase().includes(searchLower))
    );
  });

  const handleExportToExcel = () => {
    const dataToExport = filteredOperaciones.map((op) => ({
      Fecha: new Date(op.fecha_operacion).toLocaleDateString(),
      'Vehículos Solicitados': op.cantidad_vehiculos_solicitados,
      'Vehículos Iniciados': op.vehiculos?.length || 0,
      Observaciones: op.observacion || '-',
    }));
    exportToExcel(
      dataToExport,
      `operaciones-${new Date().toISOString().split('T')[0]}`,
      'Operaciones'
    );
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
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Operaciones Diarias
            </h1>
            <p className="mt-1 sm:mt-2 text-sm text-gray-700">
              Gestión de vehículos necesarios para operaciones diarias
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleExportToExcel}
              disabled={operaciones.length === 0}
              className="inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiDownload className="mr-2 h-5 w-5" />
              Exportar a Excel
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
            >
              <FiPlus className="mr-2 h-5 w-5" />
              Nueva Operación
            </button>
          </div>
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
                  key={`fecha-${formData.fecha_operacion}`}
                  type="date"
                  required
                  value={formData.fecha_operacion}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    console.log('Fecha seleccionada:', newDate);
                    setFormData({ ...formData, fecha_operacion: newDate });
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Fecha seleccionada:{' '}
                  {(() => {
                    // Parse fecha correctamente sin conversión UTC
                    const [year, month, day] = formData.fecha_operacion
                      .split('-')
                      .map(Number);
                    const localDate = new Date(year, month - 1, day);
                    return localDate.toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    });
                  })()}
                </p>
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900"
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
                  Crear Operación
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* Operaciones List */}
        <Card title="Lista de Operaciones">
          {/* Barra de búsqueda */}
          <div className="mb-4">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar operaciones..."
                className="block w-full rounded-md border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500 border text-gray-900 placeholder:text-gray-400"
              />
            </div>
            {searchTerm && (
              <p className="mt-2 text-sm text-gray-500">
                Mostrando {filteredOperaciones.length} de {operaciones.length}{' '}
                operaciones
              </p>
            )}
          </div>

          {filteredOperaciones.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm
                ? `No se encontraron operaciones para "${searchTerm}"`
                : 'No hay operaciones registradas'}
            </div>
          ) : (
            <>
              {/* Vista de tabla para pantallas grandes */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Fecha
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Veh. Solicitados
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Veh. Iniciados
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Observaciones
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredOperaciones.map((operacion) => (
                      <tr key={operacion.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-4 lg:px-6 py-4 text-sm font-medium text-gray-900">
                          {new Date(
                            operacion.fecha_operacion
                          ).toLocaleDateString()}
                        </td>
                        <td className="whitespace-nowrap px-4 lg:px-6 py-4 text-sm text-gray-500">
                          {operacion.cantidad_vehiculos_solicitados}
                        </td>
                        <td className="whitespace-nowrap px-4 lg:px-6 py-4 text-sm text-gray-500">
                          {operacion.vehiculos?.length || 0}
                        </td>
                        <td className="px-4 lg:px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {operacion.observacion || '-'}
                        </td>
                        <td className="whitespace-nowrap px-4 lg:px-6 py-4 text-sm font-medium">
                          <button
                            onClick={() =>
                              router.push(`/operaciones/${operacion.id}`)
                            }
                            className="text-primary-600 hover:text-primary-900 inline-flex items-center"
                          >
                            <FiEye className="mr-1 h-4 w-4" />
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vista de tarjetas para móviles */}
              <div className="md:hidden space-y-4">
                {filteredOperaciones.map((operacion) => (
                  <div
                    key={operacion.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(
                            operacion.fecha_operacion
                          ).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Solicitados:{' '}
                          {operacion.cantidad_vehiculos_solicitados} |
                          Iniciados: {operacion.vehiculos?.length || 0}
                        </p>
                      </div>
                    </div>
                    {operacion.observacion && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {operacion.observacion}
                      </p>
                    )}
                    <button
                      onClick={() =>
                        router.push(`/operaciones/${operacion.id}`)
                      }
                      className="w-full inline-flex items-center justify-center rounded-md bg-primary-50 px-3 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-100"
                    >
                      <FiEye className="mr-2 h-4 w-4" />
                      Ver Detalles
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
