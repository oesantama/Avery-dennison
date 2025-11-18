-- ================================================
-- SCRIPT: Actualizar tabla roles para usar estructura de maestros
-- Cambios:
-- - activo (boolean) -> estado (varchar)
-- - fecha_creacion -> fecha_control
-- - agregar usuario_control
-- - agregar trigger para actualizar fecha_control
-- ================================================

-- Paso 1: Agregar nuevas columnas
ALTER TABLE roles ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo'));
ALTER TABLE roles ADD COLUMN IF NOT EXISTS fecha_control TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS usuario_control INTEGER REFERENCES usuarios(id);

-- Paso 2: Migrar datos de activo a estado
UPDATE roles SET estado = CASE WHEN activo = TRUE THEN 'activo' ELSE 'inactivo' END WHERE estado IS NULL;

-- Paso 3: Migrar fecha_creacion a fecha_control
UPDATE roles SET fecha_control = fecha_creacion WHERE fecha_control = CURRENT_TIMESTAMP;

-- Paso 4: Eliminar columnas antiguas (comentado por seguridad)
-- ALTER TABLE roles DROP COLUMN IF EXISTS activo;
-- ALTER TABLE roles DROP COLUMN IF EXISTS fecha_creacion;
-- ALTER TABLE roles DROP COLUMN IF EXISTS descripcion;

-- Paso 5: Crear trigger para actualizar fecha_control automáticamente
DROP TRIGGER IF EXISTS update_roles_fecha_control ON roles;
CREATE TRIGGER update_roles_fecha_control
BEFORE UPDATE ON roles
FOR EACH ROW
EXECUTE FUNCTION update_fecha_control_column();

-- Paso 6: Crear índice para estado
CREATE INDEX IF NOT EXISTS idx_roles_estado ON roles(estado);

-- Mensaje de confirmación
SELECT 'Tabla roles actualizada exitosamente' AS mensaje;

-- Verificar estructura actualizada
\d roles;
