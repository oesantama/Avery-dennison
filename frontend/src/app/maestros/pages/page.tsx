'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DataTable, { Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import TableSkeleton from '@/components/ui/TableSkeleton';
import Toast from '@/components/ui/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/useToast';
import { pagesApi } from '@/lib/api';
import type { PageCreate, Page as PageType, PageUpdate } from '@/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FiEye, FiFileText } from 'react-icons/fi';

export default function PagesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { hasPermission, canView, canCreate, canEdit, canDelete } =
    usePermissions();
  const { toast, showToast, hideToast } = useToast();

  const [pages, setPages] = useState<PageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [formData, setFormData] = useState<PageCreate>({
    nombre: '',
    nombre_display: '',
    ruta: '',
    icono: '',
    orden: 0,
    activo: true,
  });

  // ✅ Obtener permisos de esta página
  const pageUrl = '/maestros/pages';
  const hasAccess = hasPermission(pageUrl);
  const canViewPage = canView(pageUrl);
  const canCreatePage = canCreate(pageUrl);
  const canEditPage = canEdit(pageUrl);
  const canDeletePage = canDelete(pageUrl);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadData();
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await pagesApi.list();
      setPages(data);
    } catch (error: any) {
      showToast(
        error.response?.data?.detail || 'Error al cargar páginas',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Validar permisos
    if (editingId && !canEditPage) {
      showToast('No tienes permiso para editar páginas', 'error');
      return;
    }
    if (!editingId && !canCreatePage) {
      showToast('No tienes permiso para crear páginas', 'error');
      return;
    }

    try {
      setSaving(true);

      if (editingId) {
        await pagesApi.update(editingId, formData as PageUpdate);
        showToast('Página actualizada correctamente', 'success');
      } else {
        await pagesApi.create(formData);
        showToast('Página creada correctamente', 'success');
      }

      await loadData();
      handleCloseForm();
    } catch (error: any) {
      showToast(
        error.response?.data?.detail || 'Error al guardar página',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (page: PageType) => {
    if (!canEditPage && !canViewPage) {
      showToast('No tienes permiso para ver esta página', 'error');
      return;
    }

    setEditingId(page.id);
    setViewMode(!canEditPage); // Si no puede editar, modo solo lectura
    setFormData({
      nombre: page.nombre,
      nombre_display: page.nombre_display,
      ruta: page.ruta,
      icono: page.icono || '',
      orden: page.orden,
      activo: page.activo,
    });
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (!canDeletePage) {
      showToast('No tienes permiso para eliminar páginas', 'error');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Página',
      message: '¿Estás seguro de que deseas eliminar esta página?',
      type: 'danger',
      onConfirm: async () => {
        try {
          await pagesApi.delete(id);
          showToast('Página eliminada correctamente', 'success');
          await loadData();
        } catch (error: any) {
          showToast(
            error.response?.data?.detail || 'Error al eliminar página',
            'error'
          );
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setViewMode(false);
    setFormData({
      nombre: '',
      nombre_display: '',
      ruta: '',
      icono: '',
      orden: 0,
      activo: true,
    });
  };

  const columns: Column<PageType>[] = [
    {
      key: 'nombre',
      label: 'Nombre',
      sortable: true,
    },
    {
      key: 'nombre_display',
      label: 'Nombre Display',
      sortable: true,
    },
    {
      key: 'ruta',
      label: 'Ruta',
      sortable: true,
      render: (value: unknown) => (
        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
          {value as string}
        </code>
      ),
    },
    {
      key: 'icono',
      label: 'Icono',
      render: (value: unknown) => (
        <span className="text-xs text-gray-500">
          {(value as string) || '-'}
        </span>
      ),
    },
    {
      key: 'orden',
      label: 'Orden',
      sortable: true,
    },
    {
      key: 'activo',
      label: 'Estado',
      sortable: true,
      render: (value) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {value ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
  ];

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <TableSkeleton />
      </DashboardLayout>
    );
  }

  // ✅ Si no tiene permiso de ver, mostrar mensaje
  if (!canViewPage) {
    return (
      <DashboardLayout>
        <Card>
          <div className="text-center py-12">
            <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">
              Sin permisos
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              No tienes permiso para ver las páginas del sistema.
            </p>
          </div>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Páginas</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gestión de páginas y rutas del sistema
            </p>
          </div>
          {/* Botón Nueva Página oculto por ahora */}
        </div>

        {/* Data Table */}
        <Card>
          <DataTable
            columns={columns}
            data={pages}
            customActions={(page: PageType) => (
              <div className="flex items-center gap-2">
                {canViewPage && (
                  <button
                    onClick={() => handleEdit(page)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    title="Ver"
                  >
                    <FiEye className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
            emptyMessage="No hay páginas registradas"
            searchPlaceholder="Buscar páginas..."
          />
        </Card>
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={showForm}
        onClose={handleCloseForm}
        title={
          viewMode ? 'Ver Página' : editingId ? 'Editar Página' : 'Nueva Página'
        }
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={viewMode}
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="ej: usuarios"
              />
            </div>

            {/* Nombre Display */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nombre Display <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={viewMode}
                value={formData.nombre_display}
                onChange={(e) =>
                  setFormData({ ...formData, nombre_display: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="ej: Usuarios"
              />
            </div>

            {/* Ruta */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ruta <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={viewMode}
                value={formData.ruta}
                onChange={(e) =>
                  setFormData({ ...formData, ruta: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="ej: /maestros/usuarios"
              />
            </div>

            {/* Icono */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Icono
              </label>
              <input
                type="text"
                disabled={viewMode}
                value={formData.icono}
                onChange={(e) =>
                  setFormData({ ...formData, icono: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="ej: FiUsers"
              />
            </div>

            {/* Orden */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Orden <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                disabled={viewMode}
                value={formData.orden}
                onChange={(e) =>
                  setFormData({ ...formData, orden: parseInt(e.target.value) })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Estado */}
            <div className="flex items-center">
              <input
                type="checkbox"
                disabled={viewMode}
                checked={formData.activo}
                onChange={(e) =>
                  setFormData({ ...formData, activo: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:cursor-not-allowed"
              />
              <label className="ml-2 block text-sm text-gray-900">Activo</label>
            </div>
          </div>

          {/* Buttons */}
          {!viewMode && (
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleCloseForm}
                disabled={saving}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 transition-colors"
              >
                {saving ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Guardando...
                  </>
                ) : (
                  'Guardar'
                )}
              </button>
            </div>
          )}
        </form>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
      />

      {/* Toast */}
      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </DashboardLayout>
  );
}
