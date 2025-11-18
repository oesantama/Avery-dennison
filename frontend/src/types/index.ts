export interface Usuario {
  id: number;
  username: string;
  nombre_completo?: string;
  email: string;
  numero_celular?: string;
  telefono?: string; // Alias para numero_celular
  rol_id: number;
  activo: boolean;
  creado_por?: number;
  usuario_control?: number; // Alias para creado_por
  fecha_creacion: string;
  fecha_actualizacion: string;
  fecha_control?: string; // Alias para fecha_actualizacion
  intentos_fallidos?: number;
  bloqueado_hasta?: string;
}

export interface UsuarioCreate {
  username: string;
  password: string;
  nombre_completo?: string;
  email: string;
  numero_celular?: string;
  telefono?: string;
  rol_id: number;
  activo?: boolean;
  permisos?: PermisoUsuarioCreate[]; // Permisos personalizados al crear
}

export interface UsuarioUpdate {
  username?: string;
  nombre_completo?: string;
  email?: string;
  numero_celular?: string;
  telefono?: string;
  rol_id?: number;
  activo?: boolean;
  password?: string;
  permisos?: PermisoUsuarioCreate[]; // Actualizar permisos personalizados
}

export interface UsuarioConRol extends Usuario {
  rol?: Rol;
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

export interface Vehiculo {
  id: number;
  placa: string;
  marca?: string;
  modelo?: string;
  anio?: number;
  tipo?: string;
  tipo_vehiculo_id?: number;
  estado: 'disponible' | 'inactivo';
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
  tipo_vehiculo_id?: number;
  estado?: 'disponible' | 'inactivo';
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
  estado?: 'disponible' | 'inactivo';
  conductor_asignado?: string;
  observaciones?: string;
  activo?: boolean;
}

// Tipos de Vehículo
export interface TipoVehiculo {
  id: number;
  descripcion: string;
  estado: 'activo' | 'inactivo';
  fecha_control: string;
  usuario_control?: number;
}

export interface TipoVehiculoCreate {
  descripcion: string;
  estado?: 'activo' | 'inactivo';
}

export interface TipoVehiculoUpdate {
  descripcion?: string;
  estado?: 'activo' | 'inactivo';
}

// Roles
export interface Rol {
  id: number;
  nombre: string;
  estado: 'activo' | 'inactivo';
  fecha_control: string;
  usuario_control?: number;
}

export interface RolCreate {
  nombre: string;
  estado?: 'activo' | 'inactivo';
}

export interface RolUpdate {
  nombre?: string;
  estado?: 'activo' | 'inactivo';
}

// Pages
export interface Page {
  id: number;
  nombre: string;
  nombre_display: string;
  ruta: string;
  icono?: string;
  orden: number;
  activo: boolean;
  fecha_creacion: string;
}

export interface PageCreate {
  nombre: string;
  nombre_display: string;
  ruta: string;
  icono?: string;
  orden?: number;
  activo?: boolean;
}

export interface PageUpdate {
  nombre?: string;
  nombre_display?: string;
  ruta?: string;
  icono?: string;
  orden?: number;
  activo?: boolean;
}

// Permisos por Rol
export interface PermisoRol {
  id: number;
  rol_id: number;
  page_id: number;
  estado: 'activo' | 'inactivo';
  puede_ver: boolean;
  puede_crear: boolean;
  puede_editar: boolean;
  puede_borrar: boolean;
  fecha_control: string;
  usuario_control?: number;
}

export interface PermisoRolCreate {
  rol_id: number;
  page_id: number;
  estado?: 'activo' | 'inactivo';
  puede_ver?: boolean;
  puede_crear?: boolean;
  puede_editar?: boolean;
  puede_borrar?: boolean;
}

export interface PermisoRolUpdate {
  estado?: 'activo' | 'inactivo';
  puede_ver?: boolean;
  puede_crear?: boolean;
  puede_editar?: boolean;
  puede_borrar?: boolean;
}

// Permisos por Usuario (nuevo)
export interface PermisoUsuario {
  id: number;
  usuario_id: number;
  page_id: number;
  estado: 'activo' | 'inactivo';
  puede_ver: boolean;
  puede_crear: boolean;
  puede_editar: boolean;
  puede_borrar: boolean;
  fecha_control: string;
  usuario_control?: number;
  page?: Page;
}

export interface PermisoUsuarioCreate {
  usuario_id: number;
  page_id: number;
  estado?: 'activo' | 'inactivo';
  puede_ver?: boolean;
  puede_crear?: boolean;
  puede_editar?: boolean;
  puede_borrar?: boolean;
}

export interface PermisoUsuarioUpdate {
  estado?: 'activo' | 'inactivo';
  puede_ver?: boolean;
  puede_crear?: boolean;
  puede_editar?: boolean;
  puede_borrar?: boolean;
}

// Usuario extendido con permisos personalizados
export interface UsuarioCompleto extends UsuarioConRol {
  permisos: PermisoUsuario[];
}
