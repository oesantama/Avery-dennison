-- Tabla de vehículos maestros
CREATE TABLE IF NOT EXISTS vehiculos (
    id SERIAL PRIMARY KEY,
    placa VARCHAR(20) UNIQUE NOT NULL,
    marca VARCHAR(50),
    modelo VARCHAR(50),
    anio INTEGER,
    tipo VARCHAR(30),
    estado VARCHAR(20) DEFAULT 'disponible' CHECK (estado IN ('disponible', 'en_operacion', 'mantenimiento', 'inactivo')),
    conductor_asignado VARCHAR(100),
    observaciones TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_vehiculos_placa ON vehiculos(placa);
CREATE INDEX IF NOT EXISTS idx_vehiculos_estado ON vehiculos(estado);
CREATE INDEX IF NOT EXISTS idx_vehiculos_activo ON vehiculos(activo);

-- Trigger para actualizar fecha_actualizacion
CREATE TRIGGER update_vehiculos_fecha_actualizacion
BEFORE UPDATE ON vehiculos
FOR EACH ROW
EXECUTE FUNCTION update_fecha_actualizacion_column();
