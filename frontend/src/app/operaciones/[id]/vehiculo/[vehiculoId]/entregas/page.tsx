'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { entregasApi, operacionesApi } from '@/lib/api';
import type { Entrega, OperacionDiaria, VehiculoOperacion } from '@/types';
import { formatDateTimeColombian, formatDateColombian } from '@/utils/dateFormat';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import SimpleLoader from '@/components/ui/SimpleLoader';
import {
  FiArrowLeft,
  FiCamera,
  FiCheckCircle,
  FiPackage,
  FiPlus,
  FiXCircle,
} from 'react-icons/fi';

export default function VehiculoEntregasPage() {
  const router = useRouter();
  const params = useParams();
  const operacionId = parseInt(params.id as string);
  const vehiculoId = parseInt(params.vehiculoId as string);
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [operacion, setOperacion] = useState<OperacionDiaria | null>(null);
  const [vehiculo, setVehiculo] = useState<VehiculoOperacion | null>(null);
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedEntrega, setSelectedEntrega] = useState<Entrega | null>(null);

  const [formData, setFormData] = useState({
    numero_factura: '',
    cliente: '',
    observacion: '',
  });

  const [actionData, setActionData] = useState({
    estado: 'cumplido' as 'cumplido' | 'no_cumplido',
    observacion: '',
    foto: null as File | null,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadData();
    }
  }, [user, authLoading, router, operacionId, vehiculoId]);

  const loadData = async () => {
    try {
      const [operacionData, vehiculoData, entregasData] = await Promise.all([
        operacionesApi.get(operacionId),
        operacionesApi.getVehiculo(vehiculoId),
        entregasApi.list({ vehiculo_operacion_id: vehiculoId }),
      ]);
      setOperacion(operacionData);
      setVehiculo(vehiculoData);
      setEntregas(entregasData);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast({
        message: 'Error al cargar los datos',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntrega = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const nuevaEntrega = await entregasApi.create({
        vehiculo_operacion_id: vehiculoId,
        fecha_operacion: operacion!.fecha_operacion,
        ...formData,
      });
      
      // Notificación de éxito con detalles
      showToast({
        message: `✅ Entrega #${formData.numero_factura} asignada a vehículo ${vehiculo?.placa}`,
        type: 'success',
        duration: 5000
      });
      
      setShowAddModal(false);
      setFormData({
        numero_factura: '',
        cliente: '',
        observacion: '',
      });
      loadData();
    } catch (error) {
      console.error('Error adding entrega:', error);
      showToast({
        message: '❌ Error al agregar entrega. Verifique que el número de factura no esté duplicado.',
        type: 'error',
        duration: 5000
      });
    }
  };

  const handleOpenActionModal = (entrega: Entrega) => {
    setSelectedEntrega(entrega);
    setActionData({
      estado: 'cumplido',
      observacion: '',
      foto: null,
    });
    setShowActionModal(true);
  };

  const handleCompletarEntrega = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntrega) return;

    try {
      // Actualizar estado de la entrega
      await entregasApi.update(selectedEntrega.id, {
        estado: actionData.estado,
        observacion: actionData.observacion,
      });

      // Si hay foto, subirla
      if (actionData.foto) {
        await entregasApi.uploadPhoto(selectedEntrega.id, actionData.foto);
      }

      const icon = actionData.estado === 'cumplido' ? '✅' : '❌';
      const estadoTexto = actionData.estado === 'cumplido' ? 'cumplida' : 'no cumplida';
      const type = actionData.estado === 'cumplido' ? 'success' : 'error';
      
      showToast({
        message: `${icon} Entrega #${selectedEntrega.numero_factura} marcada como ${estadoTexto}`,
        type,
        duration: 5000
      });
      setShowActionModal(false);
      setSelectedEntrega(null);
      loadData();
    } catch (error) {
      console.error('Error updating entrega:', error);
      showToast({
        message: '❌ Error al actualizar la entrega. Por favor intente nuevamente.',
        type: 'error',
        duration: 5000
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setActionData({ ...actionData, foto: e.target.files[0] });
    }
  };

  if (authLoading || loading) {
    return <SimpleLoader message="Cargando entregas del vehículo..." />;
  }

  if (!operacion || !vehiculo) {
    return (
      <DashboardLayout>
        <div className="text-center">
          <h2 className="text-2xl font-semibold">
            No se encontraron los datos
          </h2>
        </div>
      </DashboardLayout>
    );
  }

  const entregasPendientes = entregas.filter(
    (e) => e.estado === 'pendiente'
  ).length;
  const entregasCumplidas = entregas.filter(
    (e) => e.estado === 'cumplido'
  ).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header con botón volver */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push(`/operaciones/${operacionId}`)}
              className="mb-2 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <FiArrowLeft className="mr-1 h-4 w-4" />
              Volver a Operación
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              Entregas - Vehículo {vehiculo.placa}
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              Operación del{' '}
              {formatDateColombian(operacion.fecha_operacion)}
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
          >
            <FiPlus className="mr-2 h-5 w-5" />
            Agregar Entrega
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <div className="text-center">
              <dt className="text-sm font-medium text-gray-500">Total</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {entregas.length}
              </dd>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <dt className="text-sm font-medium text-gray-500">Pendientes</dt>
              <dd className="mt-1 text-3xl font-semibold text-yellow-600">
                {entregasPendientes}
              </dd>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <dt className="text-sm font-medium text-gray-500">Cumplidas</dt>
              <dd className="mt-1 text-3xl font-semibold text-green-600">
                {entregasCumplidas}
              </dd>
            </div>
          </Card>
        </div>

        {/* Tabla de Entregas */}
        <Card title="Lista de Entregas">
          {entregas.length === 0 ? (
            <div className="text-center py-12">
              <FiPackage className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No hay entregas registradas
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Comience agregando entregas para este vehículo.
              </p>
            </div>
          ) : (
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
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Fecha/Hora Cumplido
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Usuario
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
                  {entregas.map((entrega) => (
                    <tr key={entrega.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        {entrega.numero_factura}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {entrega.cliente || '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        {entrega.estado === 'pendiente' && (
                          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                            Pendiente
                          </span>
                        )}
                        {entrega.estado === 'cumplido' && (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            Cumplido
                          </span>
                        )}
                        {entrega.estado === 'no_cumplido' && (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                            No Cumplido
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {entrega.fecha_cumplido && entrega.estado !== 'pendiente'
                          ? formatDateTimeColombian(entrega.fecha_cumplido)
                          : '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {entrega.usuario_cumplido_nombre && entrega.estado !== 'pendiente'
                          ? entrega.usuario_cumplido_nombre
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {entrega.observacion || '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium space-x-2">
                        {entrega.estado === 'pendiente' && (
                          <button
                            onClick={() => handleOpenActionModal(entrega)}
                            className="inline-flex items-center text-primary-600 hover:text-primary-900"
                          >
                            <FiCheckCircle className="mr-1 h-4 w-4" />
                            Completar
                          </button>
                        )}
                        {entrega.estado !== 'pendiente' && (
                          <span className="inline-flex items-center text-green-600">
                            <FiCheckCircle className="mr-1 h-4 w-4" />
                            Completado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Modal Agregar Entrega */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Agregar Nueva Entrega"
        size="md"
      >
        <form onSubmit={handleAddEntrega} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              N° Factura *
            </label>
            <input
              type="text"
              required
              value={formData.numero_factura}
              onChange={(e) =>
                setFormData({ ...formData, numero_factura: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Cliente *
            </label>
            <input
              type="text"
              required
              value={formData.cliente}
              onChange={(e) =>
                setFormData({ ...formData, cliente: e.target.value })
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
            >
              Agregar Entrega
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Completar Entrega */}
      <Modal
        isOpen={showActionModal}
        onClose={() => setShowActionModal(false)}
        title="Completar Entrega"
        size="md"
      >
        <form onSubmit={handleCompletarEntrega} className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-700">
              <strong>Factura:</strong> {selectedEntrega?.numero_factura}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Cliente:</strong> {selectedEntrega?.cliente}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Estado de la Entrega *
            </label>
            <div className="mt-2 space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="cumplido"
                  checked={actionData.estado === 'cumplido'}
                  onChange={(e) =>
                    setActionData({
                      ...actionData,
                      estado: e.target.value as 'cumplido',
                    })
                  }
                  className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <FiCheckCircle className="ml-2 mr-1 h-5 w-5 text-green-600" />
                <span className="text-sm text-gray-700">Cumplido</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="no_cumplido"
                  checked={actionData.estado === 'no_cumplido'}
                  onChange={(e) =>
                    setActionData({
                      ...actionData,
                      estado: e.target.value as 'no_cumplido',
                    })
                  }
                  className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <FiXCircle className="ml-2 mr-1 h-5 w-5 text-red-600" />
                <span className="text-sm text-gray-700">No Cumplido</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Foto de Evidencia
            </label>
            <div className="mt-1 flex items-center space-x-2">
              <FiCamera className="h-5 w-5 text-gray-400" />
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>
            {actionData.foto && (
              <p className="mt-1 text-xs text-gray-500">
                Archivo seleccionado: {actionData.foto.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Observaciones
            </label>
            <textarea
              rows={3}
              value={actionData.observacion}
              onChange={(e) =>
                setActionData({ ...actionData, observacion: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900"
              placeholder="Ingrese observaciones adicionales..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowActionModal(false)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
            >
              Guardar
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
