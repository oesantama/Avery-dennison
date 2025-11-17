-- Crear función para actualizar fecha_actualizacion si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'update_fecha_actualizacion_column'
    ) THEN
        CREATE FUNCTION update_fecha_actualizacion_column()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $func$ language 'plpgsql';

        RAISE NOTICE 'Función update_fecha_actualizacion_column creada';
    ELSE
        RAISE NOTICE 'Función update_fecha_actualizacion_column ya existe';
    END IF;
END $$;

-- Crear trigger para vehiculos si no existe
DROP TRIGGER IF EXISTS update_vehiculos_fecha_actualizacion ON vehiculos;
CREATE TRIGGER update_vehiculos_fecha_actualizacion
BEFORE UPDATE ON vehiculos
FOR EACH ROW
EXECUTE FUNCTION update_fecha_actualizacion_column();

RAISE NOTICE 'Trigger para vehiculos creado exitosamente';
