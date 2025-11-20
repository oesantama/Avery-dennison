'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import {
  FiChevronDown,
  FiChevronRight,
  FiHome,
  FiLogOut,
  FiMenu,
  FiPackage,
  FiSettings,
  FiShield,
  FiTool,
  FiTruck,
  FiUser,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import PageLoader from '@/components/ui/PageLoader';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const { permissions, loading: permLoading, hasPermission } = usePermissions();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [maestrosOpen, setMaestrosOpen] = useState(false); // Inicia cerrado
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  // ✅ TODOS LOS HOOKS DEBEN IR ANTES DE CUALQUIER RETURN
  // Memoize navigation arrays
  const navigation = useMemo(
    () =>
      [
        { name: 'Dashboard', href: '/dashboard', icon: FiHome, badge: null },
        {
          name: 'Operaciones',
          href: '/operaciones',
          icon: FiTruck,
          badge: null,
        },
        {
          name: 'Consultar Entregas',
          href: '/consultas/entregas',
          icon: FiPackage,
          badge: null,
        },
      ].filter((item) => item.href === '/dashboard' || hasPermission(item.href)),
    [hasPermission]
  );

  const maestrosSubmenu = useMemo(
    () =>
      [
        { name: 'Vehículos', href: '/maestros/vehiculos', icon: FiTool },
        {
          name: 'Tipos de Vehículo',
          href: '/maestros/tipos-vehiculo',
          icon: FiSettings,
        },
        { name: 'Usuarios', href: '/maestros/usuarios', icon: FiUsers },
        { name: 'Roles', href: '/maestros/roles', icon: FiShield },
        {
          name: 'Permisos por Rol',
          href: '/maestros/permisos-rol',
          icon: FiShield,
        },
        { name: 'Páginas', href: '/maestros/pages', icon: FiSettings },
      ].filter((item) => hasPermission(item.href)),
    [hasPermission]
  );

  const isMaestrosActive = useMemo(
    () =>
      maestrosSubmenu.some(
        (item) => pathname.startsWith(item.href) || pathname === item.href
      ),
    [pathname, maestrosSubmenu]
  );

  // Generate breadcrumbs
  const breadcrumbs = useMemo(() => {
    const paths = pathname.split('/').filter(Boolean);

    // ✅ CORREGIDO: Si estamos en dashboard, solo mostrar "Inicio"
    if (pathname === '/dashboard') {
      return [{ name: 'Inicio', href: '/dashboard' }];
    }

    // Para otras rutas, agregar "Inicio" como primer elemento
    const crumbs = [{ name: 'Inicio', href: '/dashboard' }];

    let currentPath = '';
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      const name =
        path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
      if (index < paths.length - 1 || !pathname.match(/\/\d+$/)) {
        crumbs.push({ name, href: currentPath });
      }
    });

    return crumbs;
  }, [pathname]);

  // ✅ PROTECCIÓN DE RUTAS: Verificar permisos
  useEffect(() => {
    // Esperar a que termine de cargar autenticación y permisos
    if (authLoading || permLoading) {
      return;
    }

    // Si no hay usuario, redirigir a login
    if (!user) {
      router.push('/login');
      return;
    }

    // Páginas públicas que no necesitan validación de permisos
    const publicPages = ['/login', '/perfil'];
    if (publicPages.some((page) => pathname === page)) {
      setChecking(false);
      return;
    }

    // Extraer la ruta base (sin IDs dinámicos) para validar permisos
    // Ej: /operaciones/6 -> /operaciones
    // Ej: /operaciones/2/vehiculo/5/entregas -> /consultas/entregas (mapeo especial)
    const getBasePath = (path: string): string => {
      // Mapeos especiales de rutas anidadas a permisos registrados
      if (path.includes('/entregas')) {
        return 'consultas/entregas';
      }
      
      // Eliminar TODOS los segmentos numéricos de la ruta
      return path
        .split('/')
        .filter(segment => segment && !/^\d+$/.test(segment))
        .join('/');
    };

    const basePath = '/' + getBasePath(pathname);

    // Verificar permiso para la ruta base
    if (!hasPermission(basePath) && !hasPermission(pathname)) {
      console.warn(`Usuario sin permiso para: ${pathname} (base: ${basePath})`);

      // Redirigir a la primera página permitida
      const priorityPages = [
        '/dashboard',
        '/operaciones',
        '/consultas/entregas',
        '/vehiculos',
      ];
      const redirectPage =
        priorityPages.find((page) => hasPermission(page)) ||
        permissions[0] ||
        '/dashboard';

      console.log(`Redirigiendo a: ${redirectPage}`);
      router.push(redirectPage);
      return;
    }

    // Usuario tiene permiso
    setChecking(false);
  }, [
    user,
    authLoading,
    permLoading,
    pathname,
    permissions,
    hasPermission,
    router,
  ]);

  // ✅ Detectar cambio de ruta para mostrar loading instantáneo
  useEffect(() => {
    if (pathname !== lastPathname) {
      setIsNavigating(false);
      setLastPathname(pathname);
    }
  }, [pathname, lastPathname]);

  // Función para manejar navegación con loading instantáneo
  const handleNavigation = (href: string) => {
    if (pathname !== href) {
      setIsNavigating(true);
      router.push(href);
    }
  };

  // ✅ Mostrar loading mientras se verifica (DESPUÉS de todos los hooks)
  if (authLoading || permLoading || checking) {
    return <PageLoader message="Verificando permisos..." />;
  }

  // ✅ Mostrar loading durante navegación
  if (isNavigating) {
    return <PageLoader message="Cargando página..." />;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex w-72 flex-col">
          <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
            {/* Logo Header con los dos logos empresariales */}
            <div className="flex h-20 flex-shrink-0 items-center justify-center px-4 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-3 w-full">
                <img
                  src="/logo milla7.jpg"
                  alt="Milla7"
                  className="h-12 w-auto object-contain"
                />
                <div className="h-10 w-px bg-gray-200"></div>
                <img
                  src="/logo avery.jpg"
                  alt="Avery Dennison"
                  className="h-12 w-auto object-contain"
                />
              </div>
            </div>

            {/* Navigation */}
            <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
              <nav className="flex-1 space-y-1 px-3">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleNavigation(item.href)}
                      className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 w-full text-left ${
                        isActive
                          ? 'bg-primary-50 text-primary-700 shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon
                        className={`mr-3 h-5 w-5 flex-shrink-0 ${
                          isActive
                            ? 'text-primary-600'
                            : 'text-gray-400 group-hover:text-gray-600'
                        }`}
                      />
                      <span className="flex-1">{item.name}</span>
                      {item.badge && (
                        <span className="ml-auto inline-flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Maestros Section */}
                {maestrosSubmenu.length > 0 && (
                  <div className="pt-4">
                    <button
                      onClick={() => setMaestrosOpen(!maestrosOpen)}
                      className={`group flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                        isMaestrosActive
                          ? 'bg-gray-50 text-gray-900'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <FiSettings
                        className={`mr-3 h-5 w-5 flex-shrink-0 ${
                          isMaestrosActive
                            ? 'text-gray-600'
                            : 'text-gray-400 group-hover:text-gray-600'
                        }`}
                      />
                      <span className="flex-1 text-left">Maestros</span>
                      <FiChevronRight
                        className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                          maestrosOpen ? 'rotate-90' : ''
                        }`}
                      />
                    </button>

                    {maestrosOpen && (
                      <div className="mt-1 space-y-1 pl-6">
                        {maestrosSubmenu.map((item) => {
                          const Icon = item.icon;
                          const isActive = pathname === item.href;
                          return (
                            <button
                              key={item.name}
                              onClick={() => handleNavigation(item.href)}
                              className={`group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 w-full text-left ${
                                isActive
                                  ? 'bg-primary-50 text-primary-700'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }`}
                            >
                              <Icon
                                className={`mr-3 h-4 w-4 flex-shrink-0 ${
                                  isActive
                                    ? 'text-primary-600'
                                    : 'text-gray-400 group-hover:text-gray-600'
                                }`}
                              />
                              {item.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </nav>
            </div>

            {/* User Profile Section */}
            <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
              <div className="group block w-full flex-shrink-0">
                <div className="flex items-center">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white font-semibold">
                    {user?.nombre_completo?.charAt(0) ||
                      user?.username?.charAt(0) ||
                      'U'}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      {user?.nombre_completo || user?.username}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.email || 'Ver perfil'}
                    </p>
                  </div>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="ml-2 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                  >
                    <FiChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        userMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>

                {userMenuOpen && (
                  <div className="mt-2 space-y-1">
                    <Link
                      href="/perfil"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <FiUser className="mr-3 h-4 w-4 text-gray-400" />
                      Mi Perfil
                    </Link>
                    <button
                      onClick={logout}
                      className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <FiLogOut className="mr-3 h-4 w-4" />
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-gray-900 bg-opacity-50 lg:hidden transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Sidebar */}
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white lg:hidden transform transition-transform duration-300 ease-in-out">
            {/* Header con logos y botón cerrar */}
            <div className="flex h-20 items-center justify-between px-4 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-3 flex-1">
                <img
                  src="/logo milla7.jpg"
                  alt="Milla7"
                  className="h-10 w-auto object-contain"
                />
                <div className="h-8 w-px bg-gray-200"></div>
                <img
                  src="/logo avery.jpg"
                  alt="Avery Dennison"
                  className="h-10 w-auto object-contain"
                />
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
              <nav className="flex-1 space-y-1 px-3">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        setSidebarOpen(false);
                        handleNavigation(item.href);
                      }}
                      className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all w-full text-left ${
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon
                        className={`mr-3 h-5 w-5 ${
                          isActive ? 'text-primary-600' : 'text-gray-400'
                        }`}
                      />
                      {item.name}
                    </button>
                  );
                })}

                {maestrosSubmenu.length > 0 && (
                  <div className="pt-4">
                    <button
                      onClick={() => setMaestrosOpen(!maestrosOpen)}
                      className="group flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <FiSettings className="mr-3 h-5 w-5 text-gray-400" />
                      <span className="flex-1 text-left">Maestros</span>
                      <FiChevronRight
                        className={`h-4 w-4 transition-transform ${
                          maestrosOpen ? 'rotate-90' : ''
                        }`}
                      />
                    </button>

                    {maestrosOpen && (
                      <div className="mt-1 space-y-1 pl-6">
                        {maestrosSubmenu.map((item) => {
                          const Icon = item.icon;
                          const isActive = pathname === item.href;
                          return (
                            <button
                              key={item.name}
                              onClick={() => {
                                setSidebarOpen(false);
                                handleNavigation(item.href);
                              }}
                              className={`group flex items-center rounded-lg px-3 py-2 text-sm font-medium w-full text-left ${
                                isActive
                                  ? 'bg-primary-50 text-primary-700'
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <Icon
                                className={`mr-3 h-4 w-4 ${
                                  isActive
                                    ? 'text-primary-600'
                                    : 'text-gray-400'
                                }`}
                              />
                              {item.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </nav>

              {/* Mobile User Profile */}
              <div className="border-t border-gray-200 p-4 mt-auto">
                <div className="flex items-center mb-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white font-semibold">
                    {user?.nombre_completo?.charAt(0) || 'U'}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700">
                      {user?.nombre_completo || user?.username}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <Link
                    href="/perfil"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <FiUser className="mr-3 h-4 w-4 text-gray-400" />
                    Mi Perfil
                  </Link>
                  <button
                    onClick={() => {
                      setSidebarOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <FiLogOut className="mr-3 h-4 w-4" />
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 border-b border-gray-200 bg-white shadow-sm">
          <button
            type="button"
            className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <FiMenu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex flex-1 items-center">
              {/* Breadcrumbs */}
              <nav className="flex" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2">
                  {breadcrumbs.map((crumb, index) => (
                    <li key={crumb.href} className="flex items-center">
                      {index > 0 && (
                        <FiChevronRight className="mx-2 h-4 w-4 text-gray-400" />
                      )}
                      {index === breadcrumbs.length - 1 ? (
                        <span className="text-sm font-medium text-gray-900">
                          {crumb.name}
                        </span>
                      ) : (
                        <Link
                          href={crumb.href}
                          className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {crumb.name}
                        </Link>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            </div>

            {/* Desktop User Info */}
            <div className="hidden lg:flex lg:items-center lg:gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">
                  {user?.nombre_completo || user?.username}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold shadow-md">
                {user?.nombre_completo?.charAt(0) ||
                  user?.username?.charAt(0) ||
                  'U'}
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
