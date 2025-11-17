-- ================================================
-- SCRIPT DE ACTUALIZACIÓN SEGURA - TABLA USUARIOS
-- Agrega columnas RBAC solo si no existen
-- ================================================

DO $$
BEGIN
    -- Agregar columna email si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='usuarios' AND column_name='email') THEN
        ALTER TABLE usuarios ADD COLUMN email VARCHAR(255) UNIQUE;
        RAISE NOTICE 'Columna email agregada';
    ELSE
        RAISE NOTICE 'Columna email ya existe';
    END IF;

    -- Agregar columna numero_celular si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='usuarios' AND column_name='numero_celular') THEN
        ALTER TABLE usuarios ADD COLUMN numero_celular VARCHAR(20);
        RAISE NOTICE 'Columna numero_celular agregada';
    ELSE
        RAISE NOTICE 'Columna numero_celular ya existe';
    END IF;

    -- Agregar columna rol_id si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='usuarios' AND column_name='rol_id') THEN
        ALTER TABLE usuarios ADD COLUMN rol_id INTEGER REFERENCES roles(id);
        RAISE NOTICE 'Columna rol_id agregada';
    ELSE
        RAISE NOTICE 'Columna rol_id ya existe';
    END IF;

    -- Agregar columna creado_por si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='usuarios' AND column_name='creado_por') THEN
        ALTER TABLE usuarios ADD COLUMN creado_por INTEGER REFERENCES usuarios(id);
        RAISE NOTICE 'Columna creado_por agregada';
    ELSE
        RAISE NOTICE 'Columna creado_por ya existe';
    END IF;

    -- Agregar columna fecha_actualizacion si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='usuarios' AND column_name='fecha_actualizacion') THEN
        ALTER TABLE usuarios ADD COLUMN fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Columna fecha_actualizacion agregada';
    ELSE
        RAISE NOTICE 'Columna fecha_actualizacion ya existe';
    END IF;

    -- Renombrar created_at a fecha_creacion si existe
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='usuarios' AND column_name='created_at') THEN
        ALTER TABLE usuarios RENAME COLUMN created_at TO fecha_creacion;
        RAISE NOTICE 'Columna created_at renombrada a fecha_creacion';
    END IF;

    -- Eliminar updated_at si existe (ya tenemos fecha_actualizacion)
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='usuarios' AND column_name='updated_at') THEN
        ALTER TABLE usuarios DROP COLUMN updated_at;
        RAISE NOTICE 'Columna updated_at eliminada';
    END IF;

END $$;

-- Actualizar usuario admin con rol y email
UPDATE usuarios
SET
    rol_id = (SELECT id FROM roles WHERE nombre = 'Administrador'),
    email = 'admin@sistema.local'
WHERE username = 'admin' AND email IS NULL;

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);

-- Verificar estructura
SELECT 'Verificación de columnas:' AS status;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'usuarios'
ORDER BY ordinal_position;

-- Verificar usuario admin
SELECT 'Usuario admin actualizado:' AS status;
SELECT id, username, email, rol_id, activo FROM usuarios WHERE username = 'admin';
