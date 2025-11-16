'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import { entregasApi, operacionesApi } from '@/lib/api';
import type { Entrega, VehiculoOperacion } from '@/types';
import { FiPlus, FiCheckCircle, FiUpload, FiImage } from 'react-icons/fi';

export default function EntregasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vehiculoIdParam = searchParams?.get('vehiculo');
  const { user, loading: authLoading } = useAuth();
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [vehiculos, setVehiculos] = useState<VehiculoOperacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
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

  const loadVehiculosForOperacion = async (operacionId: number) => {
    try {
      const data = await operacionesApi.listVehiculos(operacionId);
      setVehiculos(data);
    } catch (error) {
      console.error('Error loading vehiculos:', error);
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
            <h1 className="text-3xl font-bold text-gray-900">Entregas</h1>
            <p className="mt-2 text-sm text-gray-700">
              Gestión de facturas y entregas por vehículo
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
          >
            <FiPlus className="mr-2 h-5 w-5" />
            Nueva Entrega
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <Card title="Nueva Entrega">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Vehículo (Placa) *
                </label>
                <select
                  required
                  value={selectedVehiculoId || ''}
                  onChange={(e) => setSelectedVehiculoId(parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                >
                  <option value="">Seleccione un vehículo</option>
                  {vehiculos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.placa}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={async () => {
                    const operacionId = prompt('Ingrese ID de operación:');
                    if (operacionId) {
                      await loadVehiculosForOperacion(parseInt(operacionId));
                    }
                  }}
                  className="mt-2 text-sm text-primary-600 hover:text-primary-900"
                >
                  Cargar vehículos de operación
                </button>
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fecha de Operación *
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    N° Factura
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Fecha Operación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Fotos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {entregas.map((entrega) => (
                  <tr key={entrega.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {entrega.numero_factura}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {entrega.cliente || '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(entrega.fecha_operacion).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
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
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {entrega.fotos?.length || 0}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium space-x-2">
                      {entrega.estado === 'pendiente' && (
                        <button
                          onClick={() => handleCompleteEntrega(entrega.id)}
                          className="text-green-600 hover:text-green-900 inline-flex items-center"
                        >
                          <FiCheckCircle className="mr-1 h-4 w-4" />
                          Completar
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedEntrega(entrega)}
                        className="text-primary-600 hover:text-primary-900 inline-flex items-center"
                      >
                        <FiUpload className="mr-1 h-4 w-4" />
                        Foto
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
