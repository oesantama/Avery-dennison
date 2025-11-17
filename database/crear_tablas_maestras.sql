-- ================================================
-- SCRIPT: Crear Tablas Maestras del Sistema
-- Descripción: Tipos de Vehículos y Permisos por Rol
-- ================================================

-- Tabla: Tipos de Vehículos
CREATE TABLE IF NOT EXISTS tipos_vehiculo (
    id SERIAL PRIMARY KEY,
    descripcion VARCHAR(100) NOT NULL UNIQUE,
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    fecha_control TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    usuario_control INTEGER REFERENCES usuarios(id),
    INDEX idx_tipos_vehiculo_estado (estado)
);

-- Tabla: Permisos por Rol (detallado por usuario)
CREATE TABLE IF NOT EXISTS permisos_por_rol (
    id SERIAL PRIMARY KEY,
    rol_id INTEGER REFERENCES roles(id) ON DELETE CASCADE NOT NULL,
    page_id INTEGER REFERENCES pages(id) ON DELETE CASCADE NOT NULL,
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    puede_ver BOOLEAN DEFAULT FALSE,
    puede_crear BOOLEAN DEFAULT FALSE,
    puede_editar BOOLEAN DEFAULT FALSE,
    puede_borrar BOOLEAN DEFAULT FALSE,
    fecha_control TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    usuario_control INTEGER REFERENCES usuarios(id),
    UNIQUE(rol_id, page_id)
);

-- Trigger para actualizar fecha_control en tipos_vehiculo
DROP TRIGGER IF EXISTS update_tipos_vehiculo_fecha_control ON tipos_vehiculo;
CREATE TRIGGER update_tipos_vehiculo_fecha_control
BEFORE UPDATE ON tipos_vehiculo
FOR EACH ROW
EXECUTE FUNCTION update_fecha_actualizacion_column();

-- Trigger para actualizar fecha_control en permisos_por_rol
DROP TRIGGER IF EXISTS update_permisos_por_rol_fecha_control ON permisos_por_rol;
CREATE TRIGGER update_permisos_por_rol_fecha_control
BEFORE UPDATE ON permisos_por_rol
FOR EACH ROW
EXECUTE FUNCTION update_fecha_actualizacion_column();

-- Modificar tabla vehiculos para agregar tipo_vehiculo_id
ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS tipo_vehiculo_id INTEGER REFERENCES tipos_vehiculo(id);
CREATE INDEX IF NOT EXISTS idx_vehiculos_tipo_vehiculo_id ON vehiculos(tipo_vehiculo_id);

-- Datos iniciales para tipos_vehiculo
INSERT INTO tipos_vehiculo (descripcion, estado, usuario_control) VALUES
    ('Camioneta', 'activo', NULL),
    ('Camión', 'activo', NULL),
    ('Furgón', 'activo', NULL),
    ('Automóvil', 'activo', NULL),
    ('Motocicleta', 'activo', NULL),
    ('Camión 3.5 Toneladas', 'activo', NULL),
    ('Camión 5 Toneladas', 'activo', NULL),
    ('Panel', 'activo', NULL)
ON CONFLICT (descripcion) DO NOTHING;

-- Mensaje de confirmación
SELECT 'Tablas maestras creadas exitosamente' AS mensaje;

-- Verificar tablas creadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('tipos_vehiculo', 'permisos_por_rol')
ORDER BY table_name;
