'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import DataTable, { Column } from '@/components/ui/DataTable';
import { usuariosApi, rolesApi } from '@/lib/api';
import type { UsuarioConRol, UsuarioCreate, UsuarioUpdate, Rol } from '@/types';
import { FiPlus, FiUsers } from 'react-icons/fi';

export default function UsuariosPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioConRol[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<UsuarioCreate & { password_confirm?: string }>({
    username: '',
    nombre_completo: '',
    email: '',
    numero_celular: '',
    rol_id: 0,
    activo: true,
    password: '',
    password_confirm: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadData();
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    try {
      const [usuariosData, rolesData] = await Promise.all([
        usuariosApi.list(),
        rolesApi.list({ activo: true }),
      ]);
      setUsuarios(usuariosData);
      setRoles(rolesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación de contraseñas
    if (!editingId && formData.password !== formData.password_confirm) {
      alert('Las contraseñas no coinciden');
      return;
    }

    if (!editingId && formData.password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      const { password_confirm, ...dataToSubmit } = formData;

      if (editingId) {
        // Solo incluir password si se proporcionó uno nuevo
        const updateData: UsuarioUpdate = { ...dataToSubmit };
        if (!updateData.password) {
          delete updateData.password;
        }
        await usuariosApi.update(editingId, updateData);
      } else {
        await usuariosApi.create(dataToSubmit);
      }
      setShowForm(false);
      setEditingId(null);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Error saving usuario:', error);
      const message = error?.response?.data?.detail || 'Error al guardar el usuario';
      alert(message);
    }
  };

  const handleEdit = (usuario: UsuarioConRol) => {
    setFormData({
      username: usuario.username,
      nombre_completo: usuario.nombre_completo || '',
      email: usuario.email,
      numero_celular: usuario.numero_celular || '',
      rol_id: usuario.rol_id,
      activo: usuario.activo,
      password: '',
      password_confirm: '',
    });
    setEditingId(usuario.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de que desea desactivar este usuario?')) {
      return;
    }
    try {
      await usuariosApi.delete(id);
      loadData();
    } catch (error: any) {
      console.error('Error deleting usuario:', error);
      const message = error?.response?.data?.detail || 'Error al desactivar el usuario';
      alert(message);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      nombre_completo: '',
      email: '',
      numero_celular: '',
      rol_id: 0,
      activo: true,
      password: '',
      password_confirm: '',
    });
    setEditingId(null);
  };

  const getRolNombre = (rolId: number) => {
    const rol = roles.find((r) => r.id === rolId);
    return rol?.nombre || '-';
  };

  const getActivoBadge = (activo: boolean) => {
    return activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const getActivoLabel = (activo: boolean) => {
    return activo ? 'Activo' : 'Inactivo';
  };

  // Definir columnas de la tabla
  const columns: Column<UsuarioConRol>[] = [
    {
      key: 'username',
      label: 'Username',
      sortable: true,
    },
    {
      key: 'nombre_completo',
      label: 'Nombre Completo',
      sortable: true,
      render: (usuario) => usuario.nombre_completo || '-',
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
    },
    {
      key: 'rol',
      label: 'Rol',
      sortable: true,
      render: (usuario) => usuario.rol?.nombre || getRolNombre(usuario.rol_id),
    },
    {
      key: 'activo',
      label: 'Estado',
      sortable: true,
      render: (usuario) => (
        <span
          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getActivoBadge(
            usuario.activo
          )}`}
        >
          {getActivoLabel(usuario.activo)}
        </span>
      ),
    },
  ];

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
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
            <p className="mt-2 text-sm text-gray-700">
              Administre los usuarios del sistema
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
            className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
          >
            <FiPlus className="mr-2 h-5 w-5" />
            Nuevo Usuario
          </button>
        </div>

        {/* Create/Edit Form */}
        {showForm && (
          <Card title={editingId ? 'Editar Usuario' : 'Nuevo Usuario'}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    placeholder="usuario123"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900 placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={formData.nombre_completo}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre_completo: e.target.value })
                    }
                    placeholder="Juan Pérez"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900 placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="usuario@example.com"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900 placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Número de Celular
                  </label>
                  <input
                    type="text"
                    value={formData.numero_celular}
                    onChange={(e) =>
                      setFormData({ ...formData, numero_celular: e.target.value })
                    }
                    placeholder="+51 999 999 999"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900 placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Rol *
                  </label>
                  <select
                    required
                    value={formData.rol_id || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rol_id: parseInt(e.target.value),
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900"
                  >
                    <option value="">Seleccione un rol</option>
                    {roles.map((rol) => (
                      <option key={rol.id} value={rol.id}>
                        {rol.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Estado *
                  </label>
                  <select
                    required
                    value={formData.activo ? 'true' : 'false'}
                    onChange={(e) =>
                      setFormData({ ...formData, activo: e.target.value === 'true' })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900"
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {editingId ? 'Nueva Contraseña (dejar en blanco para no cambiar)' : 'Contraseña *'}
                  </label>
                  <input
                    type="password"
                    required={!editingId}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="••••••••"
                    minLength={6}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900 placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {editingId ? 'Confirmar Nueva Contraseña' : 'Confirmar Contraseña *'}
                  </label>
                  <input
                    type="password"
                    required={!editingId}
                    value={formData.password_confirm}
                    onChange={(e) =>
                      setFormData({ ...formData, password_confirm: e.target.value })
                    }
                    placeholder="••••••••"
                    minLength={6}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
                >
                  {editingId ? 'Actualizar' : 'Crear'} Usuario
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* Usuarios List */}
        <Card title="Lista de Usuarios">
          <DataTable
            data={usuarios}
            columns={columns}
            onEdit={handleEdit}
            onDelete={(usuario) => handleDelete(usuario.id)}
            emptyMessage="No hay usuarios registrados"
            emptyIcon={<FiUsers className="mx-auto h-12 w-12 text-gray-400" />}
            searchPlaceholder="Buscar usuario..."
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
