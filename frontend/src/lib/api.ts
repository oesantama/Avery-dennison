import axios from 'axios';
import type {
  AuthToken,
  LoginCredentials,
  Usuario,
  UsuarioCreate,
  UsuarioUpdate,
  UsuarioConRol,
  OperacionDiaria,
  OperacionDiariaCreate,
  VehiculoOperacion,
  VehiculoOperacionCreate,
  Vehiculo,
  VehiculoCreate,
  VehiculoUpdate,
  TipoVehiculo,
  TipoVehiculoCreate,
  TipoVehiculoUpdate,
  Rol,
  RolCreate,
  RolUpdate,
  Page,
  PageCreate,
  PageUpdate,
  PermisoRol,
  PermisoRolCreate,
  PermisoRolUpdate,
  Entrega,
  EntregaCreate,
  EntregaUpdate,
  DashboardKPIs,
  DashboardFilters,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle response errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si es un error 401, el token es inválido o expiró
    if (error?.response?.status === 401) {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        // Solo redirigir si no estamos ya en login
        if (currentPath !== '/login') {
          console.log('Sesión expirada, redirigiendo al login');
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthToken> => {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    const response = await api.post<AuthToken>('/api/auth/login', formData);
    return response.data;
  },

  me: async (): Promise<Usuario> => {
    const response = await api.get<Usuario>('/api/auth/me');
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      // Ignorar errores de logout (el token se eliminará de todas formas)
      console.warn('Error en logout del backend:', error);
    }
  },
};

// Operaciones APIs
export const operacionesApi = {
  create: async (data: OperacionDiariaCreate): Promise<OperacionDiaria> => {
    const response = await api.post<OperacionDiaria>('/api/operaciones/', data);
    return response.data;
  },

  list: async (params?: {
    skip?: number;
    limit?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
  }): Promise<OperacionDiaria[]> => {
    const response = await api.get<OperacionDiaria[]>('/api/operaciones/', { params });
    return response.data;
  },

  get: async (id: number): Promise<OperacionDiaria> => {
    const response = await api.get<OperacionDiaria>(`/api/operaciones/${id}`);
    return response.data;
  },

  addVehiculo: async (data: VehiculoOperacionCreate): Promise<VehiculoOperacion> => {
    const response = await api.post<VehiculoOperacion>('/api/operaciones/vehiculos', data);
    return response.data;
  },

  listVehiculos: async (operacionId: number): Promise<VehiculoOperacion[]> => {
    const response = await api.get<VehiculoOperacion[]>(`/api/operaciones/vehiculos/${operacionId}`);
    return response.data;
  },
};

// Vehiculos APIs
export const vehiculosApi = {
  create: async (data: VehiculoCreate): Promise<Vehiculo> => {
    const response = await api.post<Vehiculo>('/api/vehiculos/', data);
    return response.data;
  },

  list: async (params?: {
    skip?: number;
    limit?: number;
    activo?: boolean;
    estado?: string;
  }): Promise<Vehiculo[]> => {
    const response = await api.get<Vehiculo[]>('/api/vehiculos/', { params });
    return response.data;
  },

  get: async (id: number): Promise<Vehiculo> => {
    const response = await api.get<Vehiculo>(`/api/vehiculos/${id}`);
    return response.data;
  },

  update: async (id: number, data: VehiculoUpdate): Promise<Vehiculo> => {
    const response = await api.put<Vehiculo>(`/api/vehiculos/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/vehiculos/${id}`);
  },
};

// Tipos de Vehículo APIs
export const tiposVehiculoApi = {
  create: async (data: TipoVehiculoCreate): Promise<TipoVehiculo> => {
    const response = await api.post<TipoVehiculo>('/api/maestros/tipos-vehiculo/', data);
    return response.data;
  },

  list: async (params?: {
    skip?: number;
    limit?: number;
    estado?: string;
  }): Promise<TipoVehiculo[]> => {
    const response = await api.get<TipoVehiculo[]>('/api/maestros/tipos-vehiculo/', { params });
    return response.data;
  },

  get: async (id: number): Promise<TipoVehiculo> => {
    const response = await api.get<TipoVehiculo>(`/api/maestros/tipos-vehiculo/${id}`);
    return response.data;
  },

  update: async (id: number, data: TipoVehiculoUpdate): Promise<TipoVehiculo> => {
    const response = await api.put<TipoVehiculo>(`/api/maestros/tipos-vehiculo/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/maestros/tipos-vehiculo/${id}`);
  },
};

// Usuarios APIs
export const usuariosApi = {
  create: async (data: UsuarioCreate): Promise<Usuario> => {
    const response = await api.post<Usuario>('/api/usuarios', data);
    return response.data;
  },

  list: async (params?: {
    skip?: number;
    limit?: number;
    activo?: boolean;
  }): Promise<UsuarioConRol[]> => {
    const response = await api.get<UsuarioConRol[]>('/api/usuarios', { params });
    return response.data;
  },

  get: async (id: number): Promise<UsuarioConRol> => {
    const response = await api.get<UsuarioConRol>(`/api/usuarios/${id}`);
    return response.data;
  },

  update: async (id: number, data: UsuarioUpdate): Promise<Usuario> => {
    const response = await api.put<Usuario>(`/api/usuarios/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/usuarios/${id}`);
  },

  desbloquear: async (id: number): Promise<{ message: string; usuario_id: number }> => {
    const response = await api.post(`/api/usuarios/${id}/desbloquear`);
    return response.data;
  },
};

// Roles APIs
export const rolesApi = {
  create: async (data: RolCreate): Promise<Rol> => {
    const response = await api.post<Rol>('/api/roles', data);
    return response.data;
  },

  list: async (params?: {
    skip?: number;
    limit?: number;
    activo?: boolean;
  }): Promise<Rol[]> => {
    const response = await api.get<Rol[]>('/api/roles', { params });
    return response.data;
  },

  get: async (id: number): Promise<Rol> => {
    const response = await api.get<Rol>(`/api/roles/${id}`);
    return response.data;
  },

  update: async (id: number, data: RolUpdate): Promise<Rol> => {
    const response = await api.put<Rol>(`/api/roles/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/roles/${id}`);
  },
};

// Pages APIs
export const pagesApi = {
  create: async (data: PageCreate): Promise<Page> => {
    const response = await api.post<Page>('/api/pages', data);
    return response.data;
  },

  list: async (params?: {
    skip?: number;
    limit?: number;
    activo?: boolean;
  }): Promise<Page[]> => {
    const response = await api.get<Page[]>('/api/pages', { params });
    return response.data;
  },

  get: async (id: number): Promise<Page> => {
    const response = await api.get<Page>(`/api/pages/${id}`);
    return response.data;
  },

  update: async (id: number, data: PageUpdate): Promise<Page> => {
    const response = await api.put<Page>(`/api/pages/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/pages/${id}`);
  },
};

// Permisos por Rol APIs
export const permisosRolApi = {
  create: async (data: PermisoRolCreate): Promise<PermisoRol> => {
    const response = await api.post<PermisoRol>('/api/maestros/permisos-rol/', data);
    return response.data;
  },

  list: async (params?: {
    skip?: number;
    limit?: number;
    rol_id?: number;
    page_id?: number;
    estado?: string;
  }): Promise<PermisoRol[]> => {
    const response = await api.get<PermisoRol[]>('/api/maestros/permisos-rol/', { params });
    return response.data;
  },

  get: async (id: number): Promise<PermisoRol> => {
    const response = await api.get<PermisoRol>(`/api/maestros/permisos-rol/${id}`);
    return response.data;
  },

  update: async (id: number, data: PermisoRolUpdate): Promise<PermisoRol> => {
    const response = await api.put<PermisoRol>(`/api/maestros/permisos-rol/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/maestros/permisos-rol/${id}`);
  },
};

// Entregas APIs
export const entregasApi = {
  create: async (data: EntregaCreate): Promise<Entrega> => {
    const response = await api.post<Entrega>('/api/entregas/', data);
    return response.data;
  },

  list: async (params?: {
    skip?: number;
    limit?: number;
    vehiculo_operacion_id?: number;
    estado?: string;
  }): Promise<Entrega[]> => {
    const response = await api.get<Entrega[]>('/api/entregas/', { params });
    return response.data;
  },

  get: async (id: number): Promise<Entrega> => {
    const response = await api.get<Entrega>(`/api/entregas/${id}`);
    return response.data;
  },

  update: async (id: number, data: EntregaUpdate): Promise<Entrega> => {
    const response = await api.patch<Entrega>(`/api/entregas/${id}`, data);
    return response.data;
  },

  uploadFoto: async (entregaId: number, file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);
    await api.post(`/api/entregas/${entregaId}/fotos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Dashboard APIs
export const dashboardApi = {
  getKPIs: async (params?: {
    fecha_inicio?: string;
    fecha_fin?: string;
  }): Promise<DashboardKPIs> => {
    const response = await api.get<DashboardKPIs>('/api/dashboard/kpis', { params });
    return response.data;
  },

  searchEntregas: async (filters: DashboardFilters): Promise<Entrega[]> => {
    const response = await api.get<Entrega[]>('/api/dashboard/entregas', {
      params: filters,
    });
    return response.data;
  },
};

export default api;
