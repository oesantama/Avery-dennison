import axios from 'axios';
import type {
  AuthToken,
  LoginCredentials,
  Usuario,
  OperacionDiaria,
  OperacionDiariaCreate,
  VehiculoOperacion,
  VehiculoOperacionCreate,
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
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
