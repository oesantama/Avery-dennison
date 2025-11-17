'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import { entregasApi, operacionesApi } from '@/lib/api';
import type { Entrega, VehiculoOperacion, OperacionDiaria } from '@/types';
import { FiPlus, FiCheckCircle, FiUpload, FiImage, FiDownload } from 'react-icons/fi';
import { useExportToExcel } from '@/hooks/useExportToExcel';

export default function EntregasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vehiculoIdParam = searchParams?.get('vehiculo');
  const { user, loading: authLoading } = useAuth();
  const { exportToExcel } = useExportToExcel();
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [vehiculos, setVehiculos] = useState<VehiculoOperacion[]>([]);
  const [operaciones, setOperaciones] = useState<OperacionDiaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedVehiculoId, setSelectedVehiculoId] = useState<number | null>(
    vehiculoIdParam ? parseInt(vehiculoIdParam) : null
  );
  const [formData, setFormData] = useState({
    numero_factura: '',
    cliente: '',
    observacion: '',
    fecha_operacion: new Date().toISOString().split('T')[0],
  });
  const [selectedEntrega, setSelectedEntrega] = useState<Entrega | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadData();
    }
  }, [user, authLoading, router]);

  // Auto-load vehicles when form is shown
  useEffect(() => {
    if (showForm && selectedDate) {
      loadOperacionesPorFecha(selectedDate);
    }
  }, [showForm, selectedDate]);

  const loadData = async () => {
    try {
      const params = selectedVehiculoId
        ? { vehiculo_operacion_id: selectedVehiculoId }
        : {};
      const data = await entregasApi.list(params);
      setEntregas(data);
    } catch (error) {
      console.error('Error loading entregas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOperacionesPorFecha = async (fecha: string) => {
    try {
      // Cargar operaciones del día seleccionado
      const ops = await operacionesApi.list({
        fecha_inicio: fecha,
        fecha_fin: fecha
      });
      setOperaciones(ops);

      // Cargar vehículos de todas las operaciones del día
      const todosVehiculos: VehiculoOperacion[] = [];
      for (const op of ops) {
        const vehs = await operacionesApi.listVehiculos(op.id);
        todosVehiculos.push(...vehs);
      }
      setVehiculos(todosVehiculos);
    } catch (error) {
      console.error('Error loading operaciones:', error);
      setOperaciones([]);
      setVehiculos([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehiculoId) {
      alert('Seleccione un vehículo');
      return;
    }
    try {
      await entregasApi.create({
        ...formData,
        vehiculo_operacion_id: selectedVehiculoId,
      });
      setShowForm(false);
      setFormData({
        numero_factura: '',
        cliente: '',
        observacion: '',
        fecha_operacion: new Date().toISOString().split('T')[0],
      });
      loadData();
    } catch (error) {
      console.error('Error creating entrega:', error);
      alert('Error al crear la entrega');
    }
  };

  const handleCompleteEntrega = async (entregaId: number) => {
    if (!confirm('¿Marcar esta entrega como cumplida?')) return;
    try {
      await entregasApi.update(entregaId, { estado: 'cumplido' });
      loadData();
    } catch (error) {
      console.error('Error updating entrega:', error);
      alert('Error al actualizar la entrega');
    }
  };

  const handleUploadFoto = async () => {
    if (!selectedEntrega || !uploadFile) return;
    try {
      await entregasApi.uploadFoto(selectedEntrega.id, uploadFile);
      setSelectedEntrega(null);
      setUploadFile(null);
      loadData();
      alert('Foto subida exitosamente');
    } catch (error) {
      console.error('Error uploading foto:', error);
      alert('Error al subir la foto');
    }
  };

  const handleExportToExcel = () => {
    const dataToExport = entregas.map((entrega) => ({
      'N° Factura': entrega.numero_factura,
      'Cliente': entrega.cliente || '-',
      'Fecha Operación': new Date(entrega.fecha_operacion).toLocaleDateString(),
      'Estado': entrega.estado,
      'Fotos': entrega.fotos?.length || 0,
      'Fecha Cumplido': entrega.fecha_cumplido ? new Date(entrega.fecha_cumplido).toLocaleDateString() : '-',
    }));
    exportToExcel(dataToExport, `entregas-${new Date().toISOString().split('T')[0]}`, 'Entregas');
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Entregas</h1>
            <p className="mt-1 sm:mt-2 text-sm text-gray-700">
              Gestión de facturas y entregas por vehículo
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleExportToExcel}
              disabled={entregas.length === 0}
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
              Nueva Entrega
            </button>
          </div>
        </div>

        {/* Create Form */}
        {showForm && (
          <Card title="Nueva Entrega">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fecha de Operación *
                </label>
                <input
                  type="date"
                  required
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setFormData({ ...formData, fecha_operacion: e.target.value });
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Se cargarán los vehículos de las operaciones de esta fecha
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Vehículo (Placa) *
                </label>
                <select
                  required
                  value={selectedVehiculoId || ''}
                  onChange={(e) => setSelectedVehiculoId(parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900"
                >
                  <option value="">
                    {vehiculos.length === 0
                      ? 'No hay vehículos en operación para esta fecha'
                      : 'Seleccione un vehículo'}
                  </option>
                  {vehiculos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.placa} - Operación #{v.operacion_id} - Inicio: {v.hora_inicio || 'Sin hora'}
                    </option>
                  ))}
                </select>
                {vehiculos.length === 0 && (
                  <p className="mt-1 text-sm text-yellow-600">
                    ⚠️ No hay vehículos en operación para {selectedDate}.
                    <a href="/operaciones" className="text-primary-600 hover:underline ml-1">
                      Crear operación primero
                    </a>
                  </p>
                )}
                {vehiculos.length > 0 && (
                  <p className="mt-1 text-xs text-green-600">
                    ✓ {vehiculos.length} vehículo(s) disponible(s)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Número de Factura *
                </label>
                <input
                  type="text"
                  required
                  value={formData.numero_factura}
                  onChange={(e) =>
                    setFormData({ ...formData, numero_factura: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Cliente
                </label>
                <input
                  type="text"
                  value={formData.cliente}
                  onChange={(e) =>
                    setFormData({ ...formData, cliente: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900 placeholder:text-gray-400"
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
                  Crear Entrega
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* Upload Photo Modal */}
        {selectedEntrega && (
          <Card title="Subir Foto de Evidencia">
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                Entrega: <strong>{selectedEntrega.numero_factura}</strong>
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Seleccionar Foto
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEntrega(null);
                    setUploadFile(null);
                  }}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUploadFoto}
                  disabled={!uploadFile}
                  className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 disabled:opacity-50"
                >
                  Subir Foto
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Entregas List */}
        <Card title="Lista de Entregas">
          {entregas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay entregas registradas
            </div>
          ) : (
            <>
              {/* Vista de tabla para pantallas grandes */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        N° Factura
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Cliente
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Fecha
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Estado
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Fotos
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {entregas.map((entrega) => (
                      <tr key={entrega.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-4 lg:px-6 py-4 text-sm font-medium text-gray-900">
                          {entrega.numero_factura}
                        </td>
                        <td className="whitespace-nowrap px-4 lg:px-6 py-4 text-sm text-gray-500">
                          {entrega.cliente || '-'}
                        </td>
                        <td className="whitespace-nowrap px-4 lg:px-6 py-4 text-sm text-gray-500">
                          {new Date(entrega.fecha_operacion).toLocaleDateString()}
                        </td>
                        <td className="whitespace-nowrap px-4 lg:px-6 py-4 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              entrega.estado === 'cumplido'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {entrega.estado}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 lg:px-6 py-4 text-sm text-gray-500">
                          {entrega.fotos?.length || 0}
                        </td>
                        <td className="whitespace-nowrap px-4 lg:px-6 py-4 text-sm font-medium">
                          <div className="flex items-center gap-2">
                            {entrega.estado === 'pendiente' && (
                              <button
                                onClick={() => handleCompleteEntrega(entrega.id)}
                                className="text-green-600 hover:text-green-900 inline-flex items-center"
                                title="Marcar como completado"
                              >
                                <FiCheckCircle className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedEntrega(entrega)}
                              className="text-primary-600 hover:text-primary-900 inline-flex items-center"
                              title="Subir foto"
                            >
                              <FiUpload className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vista de tarjetas para móviles */}
              <div className="md:hidden space-y-4">
                {entregas.map((entrega) => (
                  <div key={entrega.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {entrega.numero_factura}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {entrega.cliente || 'Sin cliente'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(entrega.fecha_operacion).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          entrega.estado === 'cumplido'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {entrega.estado}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                      <FiImage className="h-4 w-4" />
                      <span>{entrega.fotos?.length || 0} fotos</span>
                    </div>
                    <div className="flex gap-2">
                      {entrega.estado === 'pendiente' && (
                        <button
                          onClick={() => handleCompleteEntrega(entrega.id)}
                          className="flex-1 inline-flex items-center justify-center rounded-md bg-green-50 px-3 py-2 text-sm font-semibold text-green-600 hover:bg-green-100"
                        >
                          <FiCheckCircle className="mr-2 h-4 w-4" />
                          Completar
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedEntrega(entrega)}
                        className="flex-1 inline-flex items-center justify-center rounded-md bg-primary-50 px-3 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-100"
                      >
                        <FiUpload className="mr-2 h-4 w-4" />
                        Subir Foto
                      </button>
                    </div>
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
