'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  FiHome,
  FiTruck,
  FiPackage,
  FiLogOut,
  FiBarChart2,
  FiMenu,
  FiX,
  FiSettings,
  FiChevronDown,
  FiChevronUp,
  FiUsers,
  FiShield,
  FiTool
} from 'react-icons/fi';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [maestrosOpen, setMaestrosOpen] = useState(false);
  const [maestrosMobileOpen, setMaestrosMobileOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: FiHome },
    { name: 'Operaciones', href: '/operaciones', icon: FiTruck },
    { name: 'Entregas', href: '/entregas', icon: FiPackage },
  ];

  const maestrosSubmenu = [
    { name: 'Vehículos', href: '/vehiculos', icon: FiTool },
    { name: 'Tipos de Vehículo', href: '/maestros/tipos-vehiculo', icon: FiSettings },
    { name: 'Usuarios', href: '/maestros/usuarios', icon: FiUsers },
    { name: 'Roles', href: '/maestros/roles', icon: FiShield },
    { name: 'Permisos por Rol', href: '/maestros/permisos-rol', icon: FiShield },
  ];

  const isMaestrosActive = maestrosSubmenu.some(item => pathname.startsWith(item.href) || pathname === item.href);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              {/* Logo */}
              <div className="flex flex-shrink-0 items-center">
                <FiBarChart2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
                <span className="ml-2 text-base sm:text-xl font-bold text-gray-900 hidden xs:inline">
                  Gestión de Vehículos
                </span>
                <span className="ml-2 text-base font-bold text-gray-900 xs:hidden">
                  GV
                </span>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors ${
                        isActive
                          ? 'border-primary-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      <Icon className="mr-2 h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}

                {/* Maestros Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setMaestrosOpen(!maestrosOpen)}
                    className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors ${
                      isMaestrosActive
                        ? 'border-primary-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <FiSettings className="mr-2 h-5 w-5" />
                    Maestros
                    {maestrosOpen ? (
                      <FiChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <FiChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </button>

                  {maestrosOpen && (
                    <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                      <div className="py-1">
                        {maestrosSubmenu.map((item) => {
                          const Icon = item.icon;
                          const isActive = pathname === item.href;
                          return (
                            <Link
                              key={item.name}
                              href={item.href}
                              onClick={() => setMaestrosOpen(false)}
                              className={`flex items-center px-4 py-2 text-sm ${
                                isActive
                                  ? 'bg-primary-50 text-primary-600'
                                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                              }`}
                            >
                              <Icon className="mr-3 h-5 w-5" />
                              {item.name}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop User Menu */}
            <div className="hidden md:flex md:items-center md:gap-4">
              <span className="text-sm text-gray-700">
                {user?.nombre_completo || user?.username}
              </span>
              <button
                onClick={logout}
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
              >
                <FiLogOut className="mr-2 h-4 w-4" />
                Salir
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                aria-label="Abrir menú"
              >
                {mobileMenuOpen ? (
                  <FiX className="h-6 w-6" />
                ) : (
                  <FiMenu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center rounded-md px-3 py-2 text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}

              {/* Maestros Mobile Dropdown */}
              <div>
                <button
                  onClick={() => setMaestrosMobileOpen(!maestrosMobileOpen)}
                  className={`w-full flex items-center justify-between rounded-md px-3 py-2 text-base font-medium transition-colors ${
                    isMaestrosActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center">
                    <FiSettings className="mr-3 h-5 w-5" />
                    Maestros
                  </div>
                  {maestrosMobileOpen ? (
                    <FiChevronUp className="h-4 w-4" />
                  ) : (
                    <FiChevronDown className="h-4 w-4" />
                  )}
                </button>

                {maestrosMobileOpen && (
                  <div className="ml-6 space-y-1 mt-1">
                    {maestrosSubmenu.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => {
                            setMaestrosMobileOpen(false);
                            setMobileMenuOpen(false);
                          }}
                          className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-primary-100 text-primary-700'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                        >
                          <Icon className="mr-3 h-4 w-4" />
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Mobile User Info & Logout */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.nombre_completo || user?.username}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {user?.email || 'Usuario autenticado'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="mt-2 w-full flex items-center rounded-md px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <FiLogOut className="mr-3 h-5 w-5" />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
