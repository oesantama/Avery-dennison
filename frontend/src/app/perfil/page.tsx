'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import { usuariosApi } from '@/lib/api';
import { FiUser, FiMail, FiPhone, FiLock, FiSave } from 'react-icons/fi';
import SimpleLoader from '@/components/ui/SimpleLoader';

export default function PerfilPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    numero_celular: '',
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      setFormData({
        email: user.email || '',
        numero_celular: user.numero_celular || user.telefono || '',
      });
    }
  }, [user, authLoading, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      await usuariosApi.update(user.id, {
        email: formData.email,
        numero_celular: formData.numero_celular,
      });
      showToast('Perfil actualizado exitosamente', 'success');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      showToast(
        error.response?.data?.detail || 'Error al actualizar perfil',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validaciones
    if (passwordData.new_password !== passwordData.confirm_password) {
      showToast('Las contraseñas no coinciden', 'error');
      return;
    }

    if (passwordData.new_password.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    try {
      setLoading(true);
      await usuariosApi.changePassword(user.id, {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      showToast('Contraseña actualizada exitosamente', 'success');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      showToast(
        error.response?.data?.detail || 'Error al cambiar contraseña',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <SimpleLoader message="Cargando perfil..." />;
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gestione su información personal y seguridad
          </p>
        </div>

        {/* Información del Usuario */}
        <Card title="Información Personal">
          <div className="mb-6 flex items-center space-x-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-600">
              <FiUser className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {user.nombre_completo || user.username}
              </h3>
              <p className="text-sm text-gray-500">@{user.username}</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                <FiMail className="inline mr-2 h-4 w-4" />
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                <FiPhone className="inline mr-2 h-4 w-4" />
                Número de Celular
              </label>
              <input
                type="tel"
                value={formData.numero_celular}
                onChange={(e) =>
                  setFormData({ ...formData, numero_celular: e.target.value })
                }
                placeholder="+57 300 123 4567"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900"
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiSave className="mr-2 h-4 w-4" />
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </Card>

        {/* Cambiar Contraseña */}
        <Card title="Seguridad">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                <FiLock className="inline mr-2 h-4 w-4" />
                Contraseña Actual
              </label>
              <input
                type="password"
                required
                value={passwordData.current_password}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    current_password: e.target.value,
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                <FiLock className="inline mr-2 h-4 w-4" />
                Nueva Contraseña
              </label>
              <input
                type="password"
                required
                value={passwordData.new_password}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    new_password: e.target.value,
                  })
                }
                minLength={6}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900"
              />
              <p className="mt-1 text-xs text-gray-500">
                Mínimo 6 caracteres
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                <FiLock className="inline mr-2 h-4 w-4" />
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                required
                value={passwordData.confirm_password}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirm_password: e.target.value,
                  })
                }
                minLength={6}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border text-gray-900"
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiLock className="mr-2 h-4 w-4" />
                {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
