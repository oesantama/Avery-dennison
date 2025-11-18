'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { operacionesApi, vehiculosApi } from '@/lib/api';
import type { OperacionDiaria, Vehiculo, VehiculoOperacion } from '@/types';
import { formatDateColombian } from '@/utils/dateFormat';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { FiPackage, FiPlus, FiSearch, FiTruck } from 'react-icons/fi';

export default function OperacionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const operacionId = parseInt(params.id as string);
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [operacion, setOperacion] = useState<OperacionDiaria | null>(null);
  const [vehiculos, setVehiculos] = useState<VehiculoOperacion[]>([]);
  const [vehiculosDisponibles, setVehiculosDisponibles] = useState<Vehiculo[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchPlaca, setSearchPlaca] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
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
      loadVehiculosDisponibles();
    }
  }, [user, authLoading, router, operacionId]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isOperacionToday = () => {
    if (!operacion) return false;

    // ✅ Parsear la fecha sin conversión de zona horaria
    // La fecha viene como "2025-11-18" del backend
    const [year, month, day] = operacion.fecha_operacion.split('-').map(Number);
    const operacionDateStr = `${year}-${String(month).padStart(
      2,
      '0'
    )}-${String(day).padStart(2, '0')}`;

    // Fecha actual local
    const today = getLocalDateString();

    console.log('Comparando fechas:', {
      fechaOperacion: operacion.fecha_operacion,
      operacionDateStr,
      today,
      match: operacionDateStr === today,
    });

    return operacionDateStr === today;
  };

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

  const loadVehiculosDisponibles = async () => {
    try {
      const vehiculosActivos = await vehiculosApi.list({ activo: true });
      setVehiculosDisponibles(vehiculosActivos);
    } catch (error) {
      console.error('Error loading vehículos disponibles:', error);
    }
  };

  const vehiculosFiltrados = vehiculosDisponibles.filter((vehiculo) =>
    vehiculo.placa.toLowerCase().includes(searchPlaca.toLowerCase())
  );

  const handleSelectPlaca = (placa: string) => {
    setFormData({ ...formData, placa });
    setSearchPlaca(placa);
    setShowDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await operacionesApi.addVehiculo({
        operacion_id: operacionId,
        ...formData,
      });

      showToast({
        message: `✅ Vehículo ${formData.placa} agregado a la operación`,
        type: 'success',
        duration: 5000,
      });

      setShowForm(false);
      setFormData({
        placa: '',
        hora_inicio: '',
        observacion: '',
      });
      setSearchPlaca('');
      loadData();
    } catch (error) {
      console.error('Error adding vehiculo:', error);
      showToast({
        message:
          '❌ Error al agregar vehículo. Verifique que la placa no esté duplicada en esta operación.',
        type: 'error',
        duration: 5000,
      });
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
            Operación del {formatDateColombian(operacion.fecha_operacion)}
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
                {Math.max(
                  0,
                  operacion.cantidad_vehiculos_solicitados - vehiculos.length
                )}
              </dd>
            </div>
          </Card>
        </div>

        {/* Add Vehicle Button - Solo mostrar si la operación es de hoy */}
        {isOperacionToday() && (
          <div className="flex justify-end">
            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
            >
              <FiPlus className="mr-2 h-5 w-5" />
              Agregar Vehículo
            </button>
          </div>
        )}

        {/* Add Vehicle Form */}
        {showForm && (
          <Card title="Agregar Vehículo a Operación">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative" ref={dropdownRef}>
                <label className="block text-sm font-medium text-gray-700">
                  Placa del Vehículo *
                </label>
                <div className="relative mt-1">
                  <div className="flex items-center">
                    <FiSearch className="absolute left-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={searchPlaca}
                      onChange={(e) => {
                        setSearchPlaca(e.target.value.toUpperCase());
                        setFormData({
                          ...formData,
                          placa: e.target.value.toUpperCase(),
                        });
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      placeholder="Buscar placa..."
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm pl-10 pr-3 py-2 border text-gray-900 placeholder:text-gray-400"
                      autoComplete="off"
                    />
                  </div>

                  {/* Dropdown con resultados */}
                  {showDropdown && vehiculosFiltrados.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-60 overflow-auto">
                      {vehiculosFiltrados.map((vehiculo) => (
                        <button
                          key={vehiculo.id}
                          type="button"
                          onClick={() => handleSelectPlaca(vehiculo.placa)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-0"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">
                                {vehiculo.placa}
                              </div>
                              <div className="text-sm text-gray-500">
                                {vehiculo.marca && vehiculo.modelo
                                  ? `${vehiculo.marca} ${vehiculo.modelo}`
                                  : 'Sin información'}
                                {vehiculo.tipo && ` - ${vehiculo.tipo}`}
                              </div>
                            </div>
                            {vehiculo.estado === 'disponible' && (
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                Disponible
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {showDropdown &&
                    searchPlaca &&
                    vehiculosFiltrados.length === 0 && (
                      <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 px-4 py-3 text-sm text-gray-500">
                        No se encontraron vehículos con esa placa
                      </div>
                    )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Busque y seleccione un vehículo activo
                </p>
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
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium space-x-3">
                        <button
                          onClick={() =>
                            router.push(
                              `/operaciones/${operacionId}/vehiculo/${vehiculo.id}/entregas`
                            )
                          }
                          className="inline-flex items-center text-primary-600 hover:text-primary-900"
                        >
                          <FiPackage className="mr-1 h-4 w-4" />
                          Gestionar Entregas
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
