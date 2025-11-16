-- Schema para el sistema de gestión de vehículos y entregas
-- Creación de base de datos
CREATE DATABASE IF NOT EXISTS vehiculos_operacion;

\c vehiculos_operacion;

-- Tabla de usuarios para autenticación
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(100),
    email VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de operaciones diarias (captura de vehículos necesarios)
CREATE TABLE IF NOT EXISTS operaciones_diarias (
    id SERIAL PRIMARY KEY,
    fecha_operacion DATE NOT NULL,
    cantidad_vehiculos_solicitados INTEGER NOT NULL,
    observacion TEXT,
    usuario_id INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de vehículos que iniciaron operación
CREATE TABLE IF NOT EXISTS vehiculos_operacion (
    id SERIAL PRIMARY KEY,
    operacion_id INTEGER REFERENCES operaciones_diarias(id) ON DELETE CASCADE,
    placa VARCHAR(20) NOT NULL,
    hora_inicio TIME,
    observacion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(operacion_id, placa)
);

-- Tabla de entregas/facturas por vehículo
CREATE TABLE IF NOT EXISTS entregas (
    id SERIAL PRIMARY KEY,
    vehiculo_operacion_id INTEGER REFERENCES vehiculos_operacion(id) ON DELETE CASCADE,
    numero_factura VARCHAR(50) NOT NULL,
    cliente VARCHAR(200),
    observacion TEXT,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'cumplido')),
    fecha_operacion DATE NOT NULL,
    fecha_cumplido TIMESTAMP,
    usuario_cumplido_id INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de fotos de evidencia de cumplimiento
CREATE TABLE IF NOT EXISTS fotos_evidencia (
    id SERIAL PRIMARY KEY,
    entrega_id INTEGER REFERENCES entregas(id) ON DELETE CASCADE,
    ruta_archivo VARCHAR(500) NOT NULL,
    nombre_archivo VARCHAR(200),
    tipo_mime VARCHAR(100),
    tamano_bytes INTEGER,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_operaciones_fecha ON operaciones_diarias(fecha_operacion);
CREATE INDEX idx_vehiculos_placa ON vehiculos_operacion(placa);
CREATE INDEX idx_entregas_estado ON entregas(estado);
CREATE INDEX idx_entregas_fecha_operacion ON entregas(fecha_operacion);
CREATE INDEX idx_entregas_fecha_cumplido ON entregas(fecha_cumplido);
CREATE INDEX idx_vehiculo_operacion ON vehiculos_operacion(operacion_id);
CREATE INDEX idx_entregas_vehiculo ON entregas(vehiculo_operacion_id);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_operaciones_updated_at BEFORE UPDATE ON operaciones_diarias
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehiculos_updated_at BEFORE UPDATE ON vehiculos_operacion
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entregas_updated_at BEFORE UPDATE ON entregas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Datos de ejemplo (usuario admin con contraseña: admin123)
-- Nota: En producción usar hash real con bcrypt
INSERT INTO usuarios (username, password_hash, nombre_completo, email)
VALUES ('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqgOFLW0Ee', 'Administrador', 'admin@example.com')
ON CONFLICT (username) DO NOTHING;
