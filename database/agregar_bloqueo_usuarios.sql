-- ================================================
-- SCRIPT: Agregar campos de bloqueo a usuarios
-- Campos:
-- - intentos_fallidos: Contador de intentos fallidos
-- - bloqueado_hasta: Fecha/hora hasta la cual está bloqueado
-- ================================================

-- Agregar columnas si no existen
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS intentos_fallidos INTEGER DEFAULT 0;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS bloqueado_hasta TIMESTAMP WITH TIME ZONE;

-- Crear índice para consultas eficientes
CREATE INDEX IF NOT EXISTS idx_usuarios_bloqueado_hasta ON usuarios(bloqueado_hasta);

-- Actualizar usuarios existentes
UPDATE usuarios SET intentos_fallidos = 0 WHERE intentos_fallidos IS NULL;

-- Mensaje de confirmación
SELECT 'Campos de bloqueo agregados exitosamente' AS mensaje;

-- Verificar estructura
\d usuarios;
