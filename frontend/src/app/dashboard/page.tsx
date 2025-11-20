'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import { dashboardApi, entregasApi } from '@/lib/api';
import type { DashboardKPIs, Entrega } from '@/types';
import { FiTruck, FiPackage, FiCheckCircle, FiClock, FiSearch, FiDownload } from 'react-icons/fi';
import * as XLSX from 'xlsx';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [recentEntregas, setRecentEntregas] = useState<Entrega[]>([]);
  const [filteredEntregas, setFilteredEntregas] = useState<Entrega[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadDashboardData();
    }
  }, [user, authLoading, router]);

  const loadDashboardData = async () => {
    try {
      const [kpisData, entregasData] = await Promise.all([
        dashboardApi.getKPIs(),
        // Cargar las últimas 10 entregas
        entregasApi.list({
          limit: 10
        }),
      ]);
      setKpis(kpisData);
      setRecentEntregas(entregasData);
      setFilteredEntregas(entregasData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Filtrar entregas por búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredEntregas(recentEntregas);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = recentEntregas.filter((entrega) => {
      return (
        entrega.numero_factura?.toLowerCase().includes(term) ||
        entrega.cliente?.toLowerCase().includes(term) ||
        entrega.estado?.toLowerCase().includes(term) ||
        entrega.direccion?.toLowerCase().includes(term)
      );
    });
    setFilteredEntregas(filtered);
  }, [searchTerm, recentEntregas]);

  // ✅ Exportar a Excel
  const exportToExcel = () => {
    if (filteredEntregas.length === 0) {
      alert('No hay entregas para exportar');
      return;
    }

    const dataToExport = filteredEntregas.map((entrega) => ({
      'N° Factura': entrega.numero_factura || '-',
      'Cliente': entrega.cliente || '-',
      'Dirección': entrega.direccion || '-',
      'Fecha Operación': new Date(entrega.fecha_operacion).toLocaleDateString('es-CO'),
      'Fecha Cumplido': entrega.fecha_cumplido 
        ? new Date(entrega.fecha_cumplido).toLocaleString('es-CO')
        : 'Pendiente',
      'Estado': entrega.estado,
      'Observaciones': entrega.observaciones || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Entregas de Hoy');

    // Ajustar ancho de columnas
    const maxWidth = 50;
    const columnWidths = Object.keys(dataToExport[0] || {}).map((key) => ({
      wch: Math.min(
        Math.max(
          key.length,
          ...dataToExport.map((row) => String(row[key as keyof typeof row]).length)
        ),
        maxWidth
      ),
    }));
    worksheet['!cols'] = columnWidths;

    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Entregas_${today}.xlsx`);
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Vista del día: {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Para consultas históricas y filtros, usar <button onClick={() => router.push('/consultas/entregas')} className="text-primary-600 hover:text-primary-700 underline">Consultas de Entregas</button>
          </p>
        </div>

        {/* KPIs Grid */}
        {kpis && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-md bg-primary-500 p-3">
                  <FiTruck className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">
                      Vehículos Activos Hoy
                    </dt>
                    <dd className="text-3xl font-semibold text-gray-900">
                      {kpis.vehiculos_activos_hoy}
                    </dd>
                  </dl>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-md bg-blue-500 p-3">
                  <FiPackage className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">
                      Entregas Hoy
                    </dt>
                    <dd className="text-3xl font-semibold text-gray-900">
                      {kpis.entregas_hoy}
                    </dd>
                  </dl>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-md bg-green-500 p-3">
                  <FiCheckCircle className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">
                      Entregas Cumplidas Hoy
                    </dt>
                    <dd className="text-3xl font-semibold text-gray-900">
                      {kpis.entregas_cumplidas}
                    </dd>
                  </dl>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-md bg-yellow-500 p-3">
                  <FiClock className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">
                      Entregas Pendientes Hoy
                    </dt>
                    <dd className="text-3xl font-semibold text-gray-900">
                      {kpis.entregas_pendientes}
                    </dd>
                  </dl>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Recent Deliveries */}
        <Card title={`Entregas de Hoy${recentEntregas.length > 0 ? ` (${filteredEntregas.length} de ${recentEntregas.length})` : ''}`}>
          {/* Barra de búsqueda y exportar */}
          {recentEntregas.length > 0 && (
            <div className="mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              {/* Input de búsqueda */}
              <div className="relative flex-1 max-w-md">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar por factura, cliente, dirección..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              {/* Botón exportar */}
              <button
                onClick={exportToExcel}
                className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                <FiDownload className="mr-2 h-4 w-4" />
                Exportar a Excel
              </button>
            </div>
          )}

          {recentEntregas.length === 0 ? (
            <div className="text-center py-12">
              <FiPackage className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">No hay entregas registradas hoy</h3>
              <p className="mt-2 text-sm text-gray-500">
                Comienza creando una operación diaria y agregando entregas
              </p>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/operaciones')}
                  className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
                >
                  <FiTruck className="mr-2 h-5 w-5" />
                  Ir a Operaciones
                </button>
              </div>
            </div>
          ) : filteredEntregas.length === 0 ? (
            <div className="text-center py-12">
              <FiSearch className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">No se encontraron resultados</h3>
              <p className="mt-2 text-sm text-gray-500">
                Intenta con otro término de búsqueda
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
                      Fecha Operación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredEntregas.map((entrega) => (
                    <tr key={entrega.id} className="hover:bg-gray-50 transition-colors">
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
