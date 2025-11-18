'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DataTable, { Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import PermisosUsuarioSelector from '@/components/ui/PermisosUsuarioSelector';
import TableSkeleton from '@/components/ui/TableSkeleton';
import Toast from '@/components/ui/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { useCachedData } from '@/hooks/useCachedData';
import { useToast } from '@/hooks/useToast';
import { permisosUsuarioApi, rolesApi, usuariosApi } from '@/lib/api';
import type {
  PermisoUsuarioCreate,
  Rol,
  UsuarioConRol,
  UsuarioCreate,
  UsuarioUpdate,
} from '@/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FiPlus, FiUnlock, FiUsers } from 'react-icons/fi';

export default function UsuariosPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast, showToast, hideToast } = useToast();

  // ✅ OPTIMIZACIÓN: Cachear roles (datos estáticos)
  const { data: rolesData, loading: rolesLoading } = useCachedData<Rol[]>({
    key: 'roles_activos',
    fetchFn: () => rolesApi.list({ activo: true }),
    ttl: 10 * 60 * 1000, // 10 minutos
  });

  const [usuarios, setUsuarios] = useState<UsuarioConRol[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [permisosUsuario, setPermisosUsuario] = useState<
    PermisoUsuarioCreate[]
  >([]);
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
  const [formData, setFormData] = useState<
    UsuarioCreate & { password_confirm?: string }
  >({
    username: '',
    nombre_completo: '',
    email: '',
    numero_celular: '',
    rol_id: 0,
    activo: true,
    password: '',
    password_confirm: '',
    permisos: [],
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadData();
    }
  }, [user, authLoading, router]);

  // ✅ OPTIMIZACIÓN: Sincronizar roles cacheados con estado local
  useEffect(() => {
    if (rolesData) {
      console.log('✅ Roles from cache:', rolesData);
      setRoles(rolesData);
    }
  }, [rolesData]);

  // ⚡ FALLBACK: Si el caché falla, cargar roles directamente
  useEffect(() => {
    const checkRoles = async () => {
      if (!rolesLoading && (!rolesData || rolesData.length === 0) && user) {
        console.warn('⚠️ Cache failed, loading roles directly...');
        try {
          const directRoles = await rolesApi.list({ activo: true });
          console.log('✅ Roles loaded directly:', directRoles);
          setRoles(directRoles);
        } catch (error) {
          console.error('❌ Error loading roles:', error);
          showToast('Error al cargar los roles', 'error');
        }
      }
    };
    checkRoles();
  }, [rolesLoading, rolesData, user]);

  const loadData = async () => {
    try {
      setLoading(true);
      // ✅ Solo cargar usuarios, roles vienen del caché
      const usuariosData = await usuariosApi.list();
      setUsuarios(usuariosData);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Error al cargar los datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación de campos requeridos
    if (!formData.username || !formData.email || !formData.rol_id) {
      showToast('Por favor complete todos los campos requeridos', 'error');
      return;
    }

    // Validación de contraseñas solo para usuarios nuevos
    if (!editingId) {
      if (!formData.password) {
        showToast('La contraseña es requerida para usuarios nuevos', 'error');
        return;
      }
      if (formData.password !== formData.password_confirm) {
        showToast('Las contraseñas no coinciden', 'error');
        return;
      }
      if (formData.password.length < 6) {
        showToast('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
      }
    }

    // Validar contraseñas en edición si se proporciona nueva contraseña
    if (editingId && formData.password) {
      if (formData.password !== formData.password_confirm) {
        showToast('Las contraseñas no coinciden', 'error');
        return;
      }
      if (formData.password.length < 6) {
        showToast('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
      }
    }

    try {
      const { password_confirm, ...dataToSubmit } = formData;

      // Incluir permisos personalizados
      dataToSubmit.permisos = permisosUsuario;

      if (editingId) {
        // Actualizar usuario
        const updateData: UsuarioUpdate = { ...dataToSubmit };
        if (!updateData.password) {
          delete updateData.password;
        }

        await usuariosApi.update(editingId, updateData);

        // Si hay permisos, actualizarlos
        if (permisosUsuario.length > 0) {
          await permisosUsuarioApi.createBulk(editingId, permisosUsuario);
        }

        showToast('Usuario actualizado exitosamente', 'success');
      } else {
        // Crear nuevo usuario
        const usuarioCreado = await usuariosApi.create(dataToSubmit);

        // Crear permisos personalizados si se especificaron
        if (permisosUsuario.length > 0) {
          const permisosConUsuario = permisosUsuario.map((p) => ({
            ...p,
            usuario_id: usuarioCreado.id,
          }));
          await permisosUsuarioApi.createBulk(
            usuarioCreado.id,
            permisosConUsuario
          );
        }

        showToast('Usuario creado exitosamente', 'success');
      }

      setShowForm(false);
      setEditingId(null);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Error saving usuario:', error);
      const message =
        error?.response?.data?.detail || 'Error al guardar el usuario';
      showToast(message, 'error');
    }
  };

  const handleEdit = async (usuario: UsuarioConRol) => {
    setFormData({
      username: usuario.username,
      nombre_completo: usuario.nombre_completo || '',
      email: usuario.email,
      numero_celular: usuario.numero_celular || '',
      rol_id: usuario.rol_id,
      activo: usuario.activo,
      password: '',
      password_confirm: '',
      permisos: [],
    });

    // Cargar permisos personalizados del usuario
    try {
      const permisosData = await permisosUsuarioApi.getByUsuario(usuario.id);
      const permisosCreate = permisosData.map((p) => ({
        page_id: p.page_id,
        usuario_id: usuario.id,
        puede_ver: p.puede_ver,
        puede_crear: p.puede_crear,
        puede_editar: p.puede_editar,
        puede_borrar: p.puede_borrar,
        estado: p.estado,
      }));
      setPermisosUsuario(permisosCreate);
    } catch (error) {
      console.error('Error loading permisos:', error);
      setPermisosUsuario([]);
    }

    setEditingId(usuario.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Desactivar Usuario',
      message: '¿Está seguro de que desea desactivar este usuario?',
      type: 'danger',
      onConfirm: async () => {
        try {
          await usuariosApi.delete(id);
          showToast('Usuario desactivado exitosamente', 'success');
          loadData();
        } catch (error: any) {
          console.error('Error deleting usuario:', error);
          const message =
            error?.response?.data?.detail || 'Error al desactivar el usuario';
          showToast(message, 'error');
        }
      },
    });
  };

  const handleDesbloquear = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Desbloquear Usuario',
      message: '¿Está seguro de que desea desbloquear este usuario?',
      type: 'warning',
      onConfirm: async () => {
        try {
          await usuariosApi.desbloquear(id);
          showToast('Usuario desbloqueado exitosamente', 'success');
          loadData();
        } catch (error: any) {
          console.error('Error desbloqueando usuario:', error);
          const message =
            error?.response?.data?.detail || 'Error al desbloquear el usuario';
          showToast(message, 'error');
        }
      },
    });
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
    setPermisosUsuario([]);
    setShowPassword(false);
    setShowPasswordConfirm(false);
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

  const esBloqueado = (usuario: UsuarioConRol) => {
    if (!usuario.bloqueado_hasta) return false;
    return new Date(usuario.bloqueado_hasta) > new Date();
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
        <div className="flex flex-col gap-1">
          <span
            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getActivoBadge(
              usuario.activo
            )}`}
          >
            {getActivoLabel(usuario.activo)}
          </span>
          {esBloqueado(usuario) && (
            <span className="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-red-100 text-red-800">
              Bloqueado ({usuario.intentos_fallidos} intentos)
            </span>
          )}
        </div>
      ),
    },
  ];

  // ✅ OPTIMIZACIÓN: Loading mejorado con información del estado
  if (authLoading || loading || rolesLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Usuarios</h1>
              <p className="mt-2 text-sm text-gray-700">
                {authLoading && 'Verificando autenticación...'}
                {rolesLoading && 'Cargando roles...'}
                {loading && 'Cargando usuarios...'}
              </p>
            </div>
          </div>
          <TableSkeleton rows={8} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Gestión de Usuarios
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              Administre los usuarios del sistema
              {/* DEBUG INFO */}
              <span className="ml-4 text-xs bg-yellow-100 px-2 py-1 rounded">
                Roles cargados: {roles.length} | Cache:{' '}
                {rolesLoading ? 'Loading...' : rolesData?.length || 0}
              </span>
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

        {/* Create/Edit Modal */}
        <Modal
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            resetForm();
          }}
          title={editingId ? 'Editar Usuario' : 'Nuevo Usuario'}
          size="lg"
        >
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
                    setFormData({
                      ...formData,
                      nombre_completo: e.target.value,
                    })
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
                    setFormData({
                      ...formData,
                      numero_celular: e.target.value,
                    })
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
                  {roles.length === 0 && (
                    <option disabled>No hay roles disponibles</option>
                  )}
                  {roles.map((rol) => {
                    console.log('🔍 Rol:', rol.id, rol.nombre);
                    return (
                      <option key={rol.id} value={rol.id}>
                        {rol.nombre}
                      </option>
                    );
                  })}
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
                    setFormData({
                      ...formData,
                      activo: e.target.value === 'true',
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900"
                >
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {editingId
                    ? 'Nueva Contraseña (dejar en blanco para no cambiar)'
                    : 'Contraseña *'}
                </label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={!editingId}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="••••••••"
                    minLength={6}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 pr-10 border text-gray-900 placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {editingId
                    ? 'Confirmar Nueva Contraseña'
                    : 'Confirmar Contraseña *'}
                </label>
                <div className="relative mt-1">
                  <input
                    type={showPasswordConfirm ? 'text' : 'password'}
                    required={!editingId}
                    value={formData.password_confirm}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        password_confirm: e.target.value,
                      })
                    }
                    placeholder="••••••••"
                    minLength={6}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 pr-10 border text-gray-900 placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswordConfirm ? (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Selector de permisos personalizados */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Permisos Personalizados
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Los permisos en{' '}
                <span className="text-green-600 font-semibold">verde</span> son
                heredados del rol seleccionado. Puedes personalizar los permisos
                específicos para este usuario.
              </p>
              <PermisosUsuarioSelector
                rolId={formData.rol_id}
                permisosUsuario={permisosUsuario}
                onChange={setPermisosUsuario}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
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
        </Modal>

        {/* Usuarios List */}
        <Card title="Lista de Usuarios">
          <DataTable
            data={usuarios}
            columns={columns}
            onEdit={handleEdit}
            customActions={(usuario) => (
              <>
                {esBloqueado(usuario) && (
                  <button
                    onClick={() => handleDesbloquear(usuario.id)}
                    className="text-orange-600 hover:text-orange-900 inline-flex items-center"
                    title="Desbloquear usuario"
                  >
                    <FiUnlock className="h-4 w-4" />
                  </button>
                )}
              </>
            )}
            emptyMessage="No hay usuarios registrados"
            emptyIcon={<FiUsers className="mx-auto h-12 w-12 text-gray-400" />}
            searchPlaceholder="Buscar usuario..."
          />
        </Card>
      </div>

      {/* ConfirmDialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        type={confirmDialog.type}
      />
    </DashboardLayout>
  );
}
