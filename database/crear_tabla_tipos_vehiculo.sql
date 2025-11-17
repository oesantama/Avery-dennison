-- ================================
-- MIGRACIÓN: Crear tabla tipos_vehiculo y relacionarla con vehiculos
-- Fecha: 2025-11-17
-- Descripción: Implementa catálogo dinámico de tipos de vehículo
-- ================================

-- 1. Crear tabla tipos_vehiculo
CREATE TABLE IF NOT EXISTS tipos_vehiculo (
    id SERIAL PRIMARY KEY,
    descripcion VARCHAR(100) UNIQUE NOT NULL,
    estado VARCHAR(20) DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Insertar los 6 tipos de vehículo precargados
INSERT INTO tipos_vehiculo (id, descripcion, estado) VALUES
    (1, 'Camioneta', 'Activo'),
    (2, 'Camión', 'Activo'),
    (3, 'Furgón', 'Activo'),
    (4, 'Automóvil', 'Activo'),
    (6, 'Camión 3.5 Toneladas', 'Activo'),
    (7, 'Camión 5 Toneladas', 'Activo')
ON CONFLICT (descripcion) DO NOTHING;

-- Resetear la secuencia del ID para que el próximo sea 8
SELECT setval('tipos_vehiculo_id_seq', 7, true);

-- 3. Agregar columna tipo_vehiculo_id en tabla vehiculos
-- Primero verificar si la columna ya existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'vehiculos' AND column_name = 'tipo_vehiculo_id'
    ) THEN
        ALTER TABLE vehiculos ADD COLUMN tipo_vehiculo_id INTEGER;
    END IF;
END $$;

-- 4. Crear foreign key si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_vehiculos_tipo_vehiculo'
    ) THEN
        ALTER TABLE vehiculos
        ADD CONSTRAINT fk_vehiculos_tipo_vehiculo
        FOREIGN KEY (tipo_vehiculo_id) REFERENCES tipos_vehiculo(id);
    END IF;
END $$;

-- 5. Crear índice para mejorar performance de búsquedas
CREATE INDEX IF NOT EXISTS idx_vehiculos_tipo_vehiculo_id ON vehiculos(tipo_vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_tipos_vehiculo_estado ON tipos_vehiculo(estado);
CREATE INDEX IF NOT EXISTS idx_tipos_vehiculo_descripcion ON tipos_vehiculo(descripcion);

-- 6. Trigger para actualizar fecha_actualizacion automáticamente
CREATE TRIGGER update_tipos_vehiculo_fecha_actualizacion
BEFORE UPDATE ON tipos_vehiculo
FOR EACH ROW EXECUTE FUNCTION update_fecha_actualizacion_column();

-- 7. Migrar datos existentes: asignar tipos a vehículos basado en el campo 'tipo' actual
-- Mapeo de tipos textuales a IDs
UPDATE vehiculos
SET tipo_vehiculo_id = (
    CASE
        WHEN LOWER(tipo) LIKE '%camioneta%' THEN 1
        WHEN LOWER(tipo) LIKE '%camión%' OR LOWER(tipo) LIKE '%camion%' THEN 2
        WHEN LOWER(tipo) LIKE '%furgón%' OR LOWER(tipo) LIKE '%furgon%' THEN 3
        WHEN LOWER(tipo) LIKE '%automóvil%' OR LOWER(tipo) LIKE '%automovil%' OR LOWER(tipo) LIKE '%auto%' THEN 4
        WHEN LOWER(tipo) LIKE '%3.5%' OR LOWER(tipo) LIKE '%3,5%' THEN 6
        WHEN LOWER(tipo) LIKE '%5%ton%' THEN 7
        ELSE NULL
    END
)
WHERE tipo IS NOT NULL AND tipo_vehiculo_id IS NULL;

-- 8. Para vehículos sin tipo asignado, usar valor por defecto (Camioneta)
UPDATE vehiculos
SET tipo_vehiculo_id = 1
WHERE tipo_vehiculo_id IS NULL;

-- 9. OPCIONAL: Una vez migrados todos los datos, se puede eliminar la columna 'tipo' antigua
-- DESCOMENTAR SOLO DESPUÉS DE VERIFICAR QUE LA MIGRACIÓN FUE EXITOSA
-- ALTER TABLE vehiculos DROP COLUMN IF EXISTS tipo;

-- ================================
-- VERIFICACIÓN
-- ================================
-- Verificar que todos los vehículos tienen tipo asignado
-- SELECT placa, tipo, tipo_vehiculo_id, tv.descripcion as tipo_nuevo
-- FROM vehiculos v
-- LEFT JOIN tipos_vehiculo tv ON v.tipo_vehiculo_id = tv.id;

-- Verificar tipos de vehículo cargados
-- SELECT * FROM tipos_vehiculo ORDER BY id;
