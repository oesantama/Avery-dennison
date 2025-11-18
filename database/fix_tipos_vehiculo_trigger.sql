-- ================================================
-- SCRIPT: Corregir triggers para tablas maestras
-- Problema: El trigger usa update_fecha_actualizacion_column()
--           pero las tablas maestras tienen fecha_control
-- ================================================

-- Paso 1: Crear función específica para actualizar fecha_control
CREATE OR REPLACE FUNCTION update_fecha_control_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_control = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Paso 2: Eliminar triggers existentes que usan la función incorrecta
DROP TRIGGER IF EXISTS update_tipos_vehiculo_fecha_control ON tipos_vehiculo;
DROP TRIGGER IF EXISTS update_permisos_por_rol_fecha_control ON permisos_por_rol;

-- Paso 3: Crear triggers correctos para tipos_vehiculo
CREATE TRIGGER update_tipos_vehiculo_fecha_control
BEFORE UPDATE ON tipos_vehiculo
FOR EACH ROW
EXECUTE FUNCTION update_fecha_control_column();

-- Paso 4: Crear trigger correcto para permisos_por_rol
CREATE TRIGGER update_permisos_por_rol_fecha_control
BEFORE UPDATE ON permisos_por_rol
FOR EACH ROW
EXECUTE FUNCTION update_fecha_control_column();

-- Mensaje de confirmación
SELECT 'Triggers para tablas maestras corregidos exitosamente' AS mensaje;
