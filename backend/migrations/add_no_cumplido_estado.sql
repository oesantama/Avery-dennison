-- Migración para agregar estado 'no_cumplido' a entregas
-- Fecha: 2025-11-17

-- Actualizar la columna estado para permitir el nuevo valor
ALTER TABLE entregas 
DROP CONSTRAINT IF EXISTS entregas_estado_check;

ALTER TABLE entregas 
ADD CONSTRAINT entregas_estado_check 
CHECK (estado IN ('pendiente', 'cumplido', 'no_cumplido'));

-- Actualizar cualquier registro con estado NULL a 'pendiente'
UPDATE entregas 
SET estado = 'pendiente' 
WHERE estado IS NULL;

-- Asegurar que la columna no permita NULL
ALTER TABLE entregas 
ALTER COLUMN estado SET NOT NULL;

-- Comentarios
COMMENT ON COLUMN entregas.estado IS 'Estado de la entrega: pendiente, cumplido, no_cumplido';
