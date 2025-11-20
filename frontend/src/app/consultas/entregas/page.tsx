'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import SimpleLoader from '@/components/ui/SimpleLoader';
import { useAuth } from '@/contexts/AuthContext';
import { entregasApi } from '@/lib/api';
import type { Entrega } from '@/types';
import {
  formatDateColombian,
  formatDateTimeColombian,
  getCurrentDateTimeColombian,
} from '@/utils/dateFormat';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FiDownload, FiEye, FiFileText, FiSearch } from 'react-icons/fi';

export default function ConsultaEntregasPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEntrega, setSelectedEntrega] = useState<Entrega | null>(null);

  // Filtros
  const [filters, setFilters] = useState({
    fecha_inicio: new Date().toISOString().split('T')[0], // Hoy por defecto
    fecha_fin: new Date().toISOString().split('T')[0],
    placa: '',
    numero_factura: '',
    cliente: '',
    estado: 'todos',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadEntregas();
    }
  }, [user, authLoading, router]);

  const loadEntregas = async () => {
    try {
      setLoading(true);
      const data = await entregasApi.list({});

      // Aplicar filtros en el frontend
      const filtered = data.filter((entrega) => {
        const fechaEntrega = entrega.fecha_operacion.split('T')[0];

        // Filtro de fecha
        if (filters.fecha_inicio && fechaEntrega < filters.fecha_inicio)
          return false;
        if (filters.fecha_fin && fechaEntrega > filters.fecha_fin) return false;

        // Filtro de placa (buscar en vehiculo relacionado)
        // if (filters.placa && !entrega.vehiculo?.placa?.toLowerCase().includes(filters.placa.toLowerCase())) return false;

        // Filtro de factura
        if (
          filters.numero_factura &&
          !entrega.numero_factura
            .toLowerCase()
            .includes(filters.numero_factura.toLowerCase())
        )
          return false;

        // Filtro de cliente
        if (
          filters.cliente &&
          entrega.cliente &&
          !entrega.cliente.toLowerCase().includes(filters.cliente.toLowerCase())
        )
          return false;

        // Filtro de estado
        if (filters.estado !== 'todos' && entrega.estado !== filters.estado)
          return false;

        return true;
      });

      setEntregas(filtered);
    } catch (error) {
      console.error('Error loading entregas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters({ ...filters, [field]: value });
  };

  const handleApplyFilters = () => {
    loadEntregas();
  };

  const handleViewDetail = (entrega: Entrega) => {
    setSelectedEntrega(entrega);
    setShowDetailModal(true);
  };

  const handleGeneratePDF = (entrega: Entrega) => {
    // Aquí implementarías la generación del PDF
    // Por ahora, abrir en nueva ventana con formato imprimible
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Detalle Entrega - ${entrega.numero_factura}</title>
        <meta charset="UTF-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 30px;
            background: #f9fafb;
            color: #1f2937;
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          
          .header-left h1 {
            font-size: 24px;
            color: #1f2937;
            margin-bottom: 5px;
          }
          
          .header-left .subtitle {
            font-size: 14px;
            color: #6b7280;
          }
          
          .header-right {
            text-align: right;
          }
          
          .header-right .company {
            font-size: 18px;
            font-weight: bold;
            color: #3b82f6;
          }
          
          .header-right .print-date {
            font-size: 12px;
            color: #6b7280;
            margin-top: 5px;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          
          .info-item {
            background: #f9fafb;
            padding: 15px;
            border-radius: 6px;
            border-left: 3px solid #3b82f6;
          }
          
          .info-item .label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #6b7280;
            margin-bottom: 5px;
            font-weight: 600;
          }
          
          .info-item .value {
            font-size: 16px;
            color: #1f2937;
            font-weight: 500;
          }
          
          .status-container {
            margin-bottom: 30px;
          }
          
          .status {
            display: inline-block;
            padding: 8px 20px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .status.pendiente {
            background: #fef3c7;
            color: #92400e;
            border: 2px solid #fbbf24;
          }
          
          .status.cumplido {
            background: #d1fae5;
            color: #065f46;
            border: 2px solid #10b981;
          }
          
          .status.no_cumplido {
            background: #fee2e2;
            color: #991b1b;
            border: 2px solid #ef4444;
          }
          
          .observations-section {
            background: #f9fafb;
            padding: 20px;
            border-radius: 6px;
            margin-bottom: 30px;
            border-left: 3px solid #3b82f6;
          }
          
          .observations-section .label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #6b7280;
            margin-bottom: 10px;
            font-weight: 600;
          }
          
          .observations-section .value {
            font-size: 14px;
            color: #1f2937;
            line-height: 1.6;
          }
          
          .photos-section {
            margin-top: 30px;
          }
          
          .photos-section .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e5e7eb;
          }
          
          .photos-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
          }
          
          .photo-item {
            border: 2px solid #e5e7eb;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          }
          
          .photo-item img {
            width: 100%;
            height: auto;
            display: block;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
          }
          
          button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 20px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          
          button:hover {
            background: #2563eb;
          }
          
          @media print {
            body {
              background: white;
              padding: 0;
            }
            .container {
              box-shadow: none;
              padding: 20px;
            }
            button {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-left">
              <h1>Detalle de Entrega</h1>
              <div class="subtitle">Factura N° ${entrega.numero_factura}</div>
            </div>
            <div class="header-right">
              <div class="company">Avery Dennison</div>
              <div class="print-date">Impreso: ${getCurrentDateTimeColombian()}</div>
            </div>
          </div>
          
          <div class="info-grid">
            <div class="info-item">
              <div class="label">N° Factura</div>
              <div class="value">${entrega.numero_factura}</div>
            </div>
            
            <div class="info-item">
              <div class="label">Cliente</div>
              <div class="value">${entrega.cliente || 'N/A'}</div>
            </div>
            
            <div class="info-item">
              <div class="label">Fecha Operación</div>
              <div class="value">${formatDateColombian(
                entrega.fecha_operacion
              )}</div>
            </div>
            
            ${
              entrega.fecha_cumplido
                ? `
            <div class="info-item">
              <div class="label">Fecha Cumplimiento</div>
              <div class="value">${formatDateTimeColombian(
                entrega.fecha_cumplido
              )}</div>
            </div>
            `
                : '<div class="info-item"></div>'
            }
          </div>
          
          <div class="status-container">
            <div class="label" style="margin-bottom: 10px; font-size: 12px; text-transform: uppercase; color: #6b7280;">Estado</div>
            <span class="status ${entrega.estado}">
              ${
                entrega.estado === 'pendiente'
                  ? '⏳ Pendiente'
                  : entrega.estado === 'cumplido'
                  ? '✅ Cumplido'
                  : '❌ No Cumplido'
              }
            </span>
            ${
              entrega.usuario_cumplido_nombre && entrega.estado !== 'pendiente'
                ? `
            <div style="margin-top: 12px; padding: 12px; background: #f3f4f6; border-radius: 8px;">
              <div class="label" style="font-size: 11px; margin-bottom: 4px;">Usuario que Cerró</div>
              <div style="font-size: 14px; color: #1f2937; font-weight: 600;">👤 ${entrega.usuario_cumplido_nombre}</div>
            </div>
            `
                : ''
            }
          </div>
          
          ${
            entrega.observacion
              ? `
          <div class="observations-section">
            <div class="label">Observaciones</div>
            <div class="value">${entrega.observacion}</div>
          </div>
          `
              : ''
          }
          
          ${
            entrega.fotos && entrega.fotos.length > 0
              ? `
          <div class="photos-section">
            <div class="section-title">📷 Fotos de Evidencia (${
              entrega.fotos.length
            })</div>
            <div class="photos-grid">
              ${entrega.fotos
                .map(
                  (foto) => `
                <div class="photo-item">
                  <img src="${foto.ruta_archivo}" alt="Evidencia" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'200\\' height=\\'200\\'%3E%3Crect width=\\'200\\' height=\\'200\\' fill=\\'%23e5e7eb\\'/%3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' font-family=\\'Arial\\' font-size=\\'14\\' fill=\\'%236b7280\\' text-anchor=\\'middle\\' dy=\\'.3em\\'%3EImagen no disponible%3C/text%3E%3C/svg%3E'" />
                </div>
              `
                )
                .join('')}
            </div>
          </div>
          `
              : ''
          }
          
          <div class="footer">
            <p>Este documento es una representación digital de la entrega N° ${
              entrega.numero_factura
            }</p>
            <p>Generado automáticamente por el Sistema de Gestión de Entregas</p>
          </div>
          
          <button onclick="window.print()">🖨️ Imprimir Documento</button>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  };

  if (authLoading || loading) {
    return <SimpleLoader message="Cargando entregas..." />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Consultar Entregas
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Busque y consulte entregas con filtros avanzados
          </p>
        </div>

        {/* Filtros */}
        <Card title="Filtros de Búsqueda">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={filters.fecha_inicio}
                onChange={(e) =>
                  handleFilterChange('fecha_inicio', e.target.value)
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Fecha Fin
              </label>
              <input
                type="date"
                value={filters.fecha_fin}
                onChange={(e) =>
                  handleFilterChange('fecha_fin', e.target.value)
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Placa Vehículo
              </label>
              <input
                type="text"
                value={filters.placa}
                onChange={(e) =>
                  handleFilterChange('placa', e.target.value.toUpperCase())
                }
                placeholder="ABC123"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                N° Factura
              </label>
              <input
                type="text"
                value={filters.numero_factura}
                onChange={(e) =>
                  handleFilterChange('numero_factura', e.target.value)
                }
                placeholder="Buscar factura..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Cliente
              </label>
              <input
                type="text"
                value={filters.cliente}
                onChange={(e) => handleFilterChange('cliente', e.target.value)}
                placeholder="Buscar cliente..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Estado
              </label>
              <select
                value={filters.estado}
                onChange={(e) => handleFilterChange('estado', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900"
              >
                <option value="todos">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="cumplido">Cumplido</option>
                <option value="no_cumplido">No Cumplido</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={() => {
                setFilters({
                  fecha_inicio: new Date().toISOString().split('T')[0],
                  fecha_fin: new Date().toISOString().split('T')[0],
                  placa: '',
                  numero_factura: '',
                  cliente: '',
                  estado: 'todos',
                });
                loadEntregas();
              }}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Limpiar Filtros
            </button>
            <button
              onClick={handleApplyFilters}
              className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
            >
              <FiSearch className="mr-2 h-4 w-4" />
              Buscar
            </button>
          </div>
        </Card>

        {/* Resultados */}
        <Card title={`Resultados (${entregas.length})`}>
          <DataTable
            data={entregas}
            columns={[
              {
                key: 'fecha_operacion',
                label: 'Fecha',
                sortable: true,
                render: (value) => formatDateColombian(value),
              },
              {
                key: 'numero_factura',
                label: 'N° Factura',
                sortable: true,
              },
              {
                key: 'cliente',
                label: 'Cliente',
                sortable: true,
                render: (value) => value || '-',
              },
              {
                key: 'estado',
                label: 'Estado',
                sortable: true,
                render: (value) => {
                  if (value === 'pendiente')
                    return (
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                        Pendiente
                      </span>
                    );
                  if (value === 'cumplido')
                    return (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Cumplido
                      </span>
                    );
                  if (value === 'no_cumplido')
                    return (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                        No Cumplido
                      </span>
                    );
                  return value;
                },
              },
              {
                key: 'fecha_cumplido',
                label: 'Hora Cumplido',
                sortable: true,
                render: (value, item) =>
                  value && item.estado !== 'pendiente'
                    ? formatDateTimeColombian(value)
                    : '-',
              },
              {
                key: 'usuario_cumplido_nombre',
                label: 'Usuario',
                sortable: true,
                render: (value, item) =>
                  value && item.estado !== 'pendiente' ? value : '-',
              },
            ]}
            customActions={(entrega) => (
              <>
                <button
                  onClick={() => handleViewDetail(entrega)}
                  className="inline-flex items-center text-primary-600 hover:text-primary-900"
                >
                  <FiEye className="mr-1 h-4 w-4" />
                  Ver
                </button>
                <button
                  onClick={() => handleGeneratePDF(entrega)}
                  className="inline-flex items-center text-green-600 hover:text-green-900"
                >
                  <FiDownload className="mr-1 h-4 w-4" />
                  PDF
                </button>
              </>
            )}
            emptyMessage="No se encontraron entregas"
            emptyIcon={
              <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
            }
            searchPlaceholder="Buscar entrega..."
          />
        </Card>
      </div>

      {/* Modal Detalle */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Detalle de Entrega"
        size="lg"
      >
        {selectedEntrega && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  N° Factura
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedEntrega.numero_factura}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Cliente
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedEntrega.cliente || 'N/A'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fecha Operación
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDateColombian(selectedEntrega.fecha_operacion)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Estado
                </label>
                <p className="mt-1">
                  {selectedEntrega.estado === 'pendiente' && (
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                      Pendiente
                    </span>
                  )}
                  {selectedEntrega.estado === 'cumplido' && (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      Cumplido
                    </span>
                  )}
                  {selectedEntrega.estado === 'no_cumplido' && (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                      No Cumplido
                    </span>
                  )}
                </p>
              </div>

              {selectedEntrega.fecha_cumplido &&
                selectedEntrega.estado !== 'pendiente' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Fecha/Hora Cumplido
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatDateTimeColombian(selectedEntrega.fecha_cumplido)}
                    </p>
                  </div>
                )}

              {selectedEntrega.usuario_cumplido_nombre &&
                selectedEntrega.estado !== 'pendiente' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Usuario que Cerró
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedEntrega.usuario_cumplido_nombre}
                    </p>
                  </div>
                )}
            </div>

            {selectedEntrega.observacion && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Observaciones
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedEntrega.observacion}
                </p>
              </div>
            )}

            {selectedEntrega.fecha_cumplido && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fecha de Cumplimiento
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDateTimeColombian(selectedEntrega.fecha_cumplido)}
                </p>
              </div>
            )}

            {selectedEntrega.fotos && selectedEntrega.fotos.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fotos de Evidencia
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {selectedEntrega.fotos.map((foto) => (
                    <img
                      key={foto.id}
                      src={foto.ruta_archivo}
                      alt="Evidencia"
                      className="w-full h-48 object-cover rounded-md border border-gray-200"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={() => setShowDetailModal(false)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Cerrar
              </button>
              <button
                onClick={() => handleGeneratePDF(selectedEntrega)}
                className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
              >
                <FiDownload className="mr-2 h-4 w-4" />
                Descargar PDF
              </button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
