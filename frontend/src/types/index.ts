export interface Usuario {
  id: number;
  username: string;
  nombre_completo?: string;
  email?: string;
  activo: boolean;
  created_at: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

export interface OperacionDiaria {
  id: number;
  fecha_operacion: string;
  cantidad_vehiculos_solicitados: number;
  observacion?: string;
  usuario_id?: number;
  created_at: string;
  vehiculos: VehiculoOperacion[];
}

export interface OperacionDiariaCreate {
  fecha_operacion: string;
  cantidad_vehiculos_solicitados: number;
  observacion?: string;
}

export interface VehiculoOperacion {
  id: number;
  operacion_id: number;
  placa: string;
  hora_inicio?: string;
  observacion?: string;
  activo: boolean;
  created_at: string;
}

export interface VehiculoOperacionCreate {
  operacion_id: number;
  placa: string;
  hora_inicio?: string;
  observacion?: string;
}

export interface Entrega {
  id: number;
  vehiculo_operacion_id: number;
  numero_factura: string;
  cliente?: string;
  observacion?: string;
  estado: 'pendiente' | 'cumplido';
  fecha_operacion: string;
  fecha_cumplido?: string;
  usuario_cumplido_id?: number;
  created_at: string;
  fotos: FotoEvidencia[];
}

export interface EntregaCreate {
  vehiculo_operacion_id: number;
  numero_factura: string;
  cliente?: string;
  observacion?: string;
  fecha_operacion: string;
}

export interface EntregaUpdate {
  estado?: 'pendiente' | 'cumplido';
  observacion?: string;
}

export interface FotoEvidencia {
  id: number;
  entrega_id: number;
  nombre_archivo: string;
  ruta_archivo: string;
  tipo_mime?: string;
  tamano_bytes?: number;
  uploaded_at: string;
}

export interface DashboardKPIs {
  total_operaciones: number;
  total_vehiculos: number;
  total_entregas: number;
  entregas_pendientes: number;
  entregas_cumplidas: number;
  porcentaje_cumplimiento: number;
  vehiculos_activos_hoy: number;
  entregas_hoy: number;
}

export interface DashboardFilters {
  fecha_operacion_inicio?: string;
  fecha_operacion_fin?: string;
  fecha_cumplido_inicio?: string;
  fecha_cumplido_fin?: string;
  placa?: string;
  estado?: string;
}

export interface TipoVehiculo {
  id: number;
  descripcion: string;
  estado: 'Activo' | 'Inactivo';
  fecha_creacion: string;
  fecha_actualizacion?: string;
}

export interface TipoVehiculoCreate {
  descripcion: string;
  estado?: 'Activo' | 'Inactivo';
}

export interface TipoVehiculoUpdate {
  descripcion?: string;
  estado?: 'Activo' | 'Inactivo';
}

export interface Vehiculo {
  id: number;
  placa: string;
  marca?: string;
  modelo?: string;
  anio?: number;
  tipo?: string; // Campo legacy
  tipo_vehiculo_id?: number;
  tipo_descripcion?: string; // Descripción del tipo de vehículo
  estado: 'disponible' | 'en_operacion' | 'mantenimiento' | 'inactivo';
  conductor_asignado?: string;
  observaciones?: string;
  activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion?: string;
}

export interface VehiculoCreate {
  placa: string;
  marca?: string;
  modelo?: string;
  anio?: number;
  tipo?: string;
  tipo_vehiculo_id: number; // Obligatorio
  estado?: 'disponible' | 'en_operacion' | 'mantenimiento' | 'inactivo';
  conductor_asignado?: string;
  observaciones?: string;
}

export interface VehiculoUpdate {
  placa?: string;
  marca?: string;
  modelo?: string;
  anio?: number;
  tipo?: string;
  tipo_vehiculo_id?: number;
  estado?: 'disponible' | 'en_operacion' | 'mantenimiento' | 'inactivo';
  conductor_asignado?: string;
  observaciones?: string;
  activo?: boolean;
}
