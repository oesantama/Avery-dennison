-- ================================================
-- SCRIPT DE CORRECCIÓN: Migrar columnas de usuarios
-- Descripción: Corrige el desajuste entre schema original y modelo SQLAlchemy
-- Problema: Tabla tiene created_at/updated_at pero modelo espera fecha_creacion/fecha_actualizacion
-- ================================================

-- ================================================
-- PASO 1: Agregar columna fecha_creacion si no existe
-- ================================================
DO $$
BEGIN
    -- Agregar fecha_creacion si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'usuarios' AND column_name = 'fecha_creacion') THEN
        ALTER TABLE usuarios ADD COLUMN fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Columna fecha_creacion agregada';

        -- Si existe created_at, copiar sus valores a fecha_creacion
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'usuarios' AND column_name = 'created_at') THEN
            UPDATE usuarios SET fecha_creacion = created_at WHERE created_at IS NOT NULL;
            RAISE NOTICE 'Valores copiados de created_at a fecha_creacion';
        END IF;
    ELSE
        RAISE NOTICE 'Columna fecha_creacion ya existe';
    END IF;
END $$;

-- ================================================
-- PASO 2: Asegurar que fecha_actualizacion existe
-- ================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'usuarios' AND column_name = 'fecha_actualizacion') THEN
        ALTER TABLE usuarios ADD COLUMN fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Columna fecha_actualizacion agregada';

        -- Si existe updated_at, copiar sus valores a fecha_actualizacion
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'usuarios' AND column_name = 'updated_at') THEN
            UPDATE usuarios SET fecha_actualizacion = updated_at WHERE updated_at IS NOT NULL;
            RAISE NOTICE 'Valores copiados de updated_at a fecha_actualizacion';
        END IF;
    ELSE
        RAISE NOTICE 'Columna fecha_actualizacion ya existe';
    END IF;
END $$;

-- ================================================
-- PASO 3: Agregar columnas RBAC si no existen
-- ================================================
DO $$
BEGIN
    -- email
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'usuarios' AND column_name = 'email') THEN
        ALTER TABLE usuarios ADD COLUMN email VARCHAR(255) UNIQUE;
        RAISE NOTICE 'Columna email agregada';
    ELSE
        RAISE NOTICE 'Columna email ya existe';
    END IF;

    -- numero_celular
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'usuarios' AND column_name = 'numero_celular') THEN
        ALTER TABLE usuarios ADD COLUMN numero_celular VARCHAR(20);
        RAISE NOTICE 'Columna numero_celular agregada';
    ELSE
        RAISE NOTICE 'Columna numero_celular ya existe';
    END IF;

    -- rol_id (requiere que exista la tabla roles)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'usuarios' AND column_name = 'rol_id') THEN
        -- Verificar si existe la tabla roles
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles') THEN
            ALTER TABLE usuarios ADD COLUMN rol_id INTEGER REFERENCES roles(id);
            RAISE NOTICE 'Columna rol_id agregada';
        ELSE
            RAISE NOTICE 'Tabla roles no existe, saltando rol_id';
        END IF;
    ELSE
        RAISE NOTICE 'Columna rol_id ya existe';
    END IF;

    -- creado_por
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'usuarios' AND column_name = 'creado_por') THEN
        ALTER TABLE usuarios ADD COLUMN creado_por INTEGER REFERENCES usuarios(id);
        RAISE NOTICE 'Columna creado_por agregada';
    ELSE
        RAISE NOTICE 'Columna creado_por ya existe';
    END IF;
END $$;

-- ================================================
-- PASO 4: Eliminar columnas antiguas (created_at, updated_at)
-- ================================================
DO $$
BEGIN
    -- Solo eliminar si existen las nuevas columnas
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'usuarios' AND column_name = 'fecha_creacion')
       AND EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'usuarios' AND column_name = 'created_at') THEN
        ALTER TABLE usuarios DROP COLUMN created_at;
        RAISE NOTICE 'Columna created_at eliminada';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'usuarios' AND column_name = 'fecha_actualizacion')
       AND EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'usuarios' AND column_name = 'updated_at') THEN
        ALTER TABLE usuarios DROP COLUMN updated_at;
        RAISE NOTICE 'Columna updated_at eliminada';
    END IF;
END $$;

-- ================================================
-- PASO 5: Recrear trigger para fecha_actualizacion
-- ================================================
DROP TRIGGER IF EXISTS update_usuarios_fecha_actualizacion ON usuarios;

CREATE TRIGGER update_usuarios_fecha_actualizacion
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- VERIFICACIÓN FINAL
-- ================================================
SELECT 'Migración completada exitosamente' AS status;
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'usuarios'
ORDER BY ordinal_position;
