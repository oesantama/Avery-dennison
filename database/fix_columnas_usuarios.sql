-- ================================================
-- SCRIPT DE MIGRACIÓN: Renombrar columnas de timestamps en usuarios
-- ================================================
-- Problema: El modelo Python usa fecha_creacion/fecha_actualizacion
--           pero el schema original creó created_at/updated_at
-- ================================================

-- Paso 1: Agregar las nuevas columnas si no existen
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Paso 2: Copiar datos de las columnas antiguas a las nuevas (si existen datos)
UPDATE usuarios
SET fecha_creacion = created_at
WHERE fecha_creacion IS NULL AND created_at IS NOT NULL;

UPDATE usuarios
SET fecha_actualizacion = updated_at
WHERE fecha_actualizacion IS NULL AND updated_at IS NOT NULL;

-- Paso 3: Eliminar las columnas antiguas (si existen)
ALTER TABLE usuarios DROP COLUMN IF EXISTS created_at;
ALTER TABLE usuarios DROP COLUMN IF EXISTS updated_at;

-- Paso 4: Asegurar que fecha_creacion no sea NULL
ALTER TABLE usuarios
ALTER COLUMN fecha_creacion SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE usuarios
ALTER COLUMN fecha_actualizacion SET DEFAULT CURRENT_TIMESTAMP;

-- Paso 5: Actualizar el trigger para que use fecha_actualizacion
DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;

CREATE OR REPLACE FUNCTION update_usuarios_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuarios_fecha_actualizacion
BEFORE UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION update_usuarios_fecha_actualizacion();

-- Verificación
SELECT 'Migración completada exitosamente' AS status;
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'usuarios'
AND column_name IN ('fecha_creacion', 'fecha_actualizacion', 'created_at', 'updated_at')
ORDER BY column_name;
