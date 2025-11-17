-- ================================
-- SCRIPT DE MIGRACIÓN A SISTEMA RBAC
-- ================================
-- Este script actualiza la base de datos existente agregando:
-- - Nuevas tablas para RBAC (roles, pages, permisos_rol, permisos_usuario)
-- - Nuevas columnas a la tabla usuarios
-- - Datos iniciales necesarios

-- Ejecutar este script si ya tienes una base de datos creada y necesitas agregarle RBAC

BEGIN;

-- 1. Crear tabla de roles si no existe
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear tabla de páginas si no existe
CREATE TABLE IF NOT EXISTS pages (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    nombre_display VARCHAR(100) NOT NULL,
    ruta VARCHAR(200) NOT NULL,
    icono VARCHAR(50),
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Agregar nuevas columnas a la tabla usuarios si no existen
DO $$
BEGIN
    -- Agregar columna numero_celular
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'usuarios' AND column_name = 'numero_celular'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN numero_celular VARCHAR(20);
    END IF;

    -- Agregar columna rol_id (sin constraint por ahora)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'usuarios' AND column_name = 'rol_id'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN rol_id INTEGER;
    END IF;

    -- Agregar columna creado_por (sin constraint por ahora)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'usuarios' AND column_name = 'creado_por'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN creado_por INTEGER;
    END IF;

    -- Renombrar columnas de fecha si existen con nombres antiguos
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'usuarios' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE usuarios RENAME COLUMN created_at TO fecha_creacion;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'usuarios' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE usuarios RENAME COLUMN updated_at TO fecha_actualizacion;
    END IF;

    -- Si no existe fecha_creacion, crearla
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'usuarios' AND column_name = 'fecha_creacion'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- Si no existe fecha_actualizacion, crearla
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'usuarios' AND column_name = 'fecha_actualizacion'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- Modificar el tipo de columna email para que sea UNIQUE
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        WHERE tc.table_name = 'usuarios'
        AND tc.constraint_type = 'UNIQUE'
        AND tc.constraint_name LIKE '%email%'
    ) THEN
        ALTER TABLE usuarios ALTER COLUMN email TYPE VARCHAR(255);
        ALTER TABLE usuarios ADD CONSTRAINT usuarios_email_key UNIQUE (email);
    END IF;
END $$;

-- 4. Crear tabla de permisos por rol si no existe
CREATE TABLE IF NOT EXISTS permisos_rol (
    id SERIAL PRIMARY KEY,
    rol_id INTEGER REFERENCES roles(id) ON DELETE CASCADE NOT NULL,
    page_id INTEGER REFERENCES pages(id) ON DELETE CASCADE NOT NULL,
    puede_ver BOOLEAN DEFAULT FALSE NOT NULL,
    puede_crear BOOLEAN DEFAULT FALSE NOT NULL,
    puede_editar BOOLEAN DEFAULT FALSE NOT NULL,
    puede_eliminar BOOLEAN DEFAULT FALSE NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rol_id, page_id)
);

-- 5. Crear tabla de permisos específicos por usuario si no existe
CREATE TABLE IF NOT EXISTS permisos_usuario (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE NOT NULL,
    page_id INTEGER REFERENCES pages(id) ON DELETE CASCADE NOT NULL,
    puede_ver BOOLEAN,
    puede_crear BOOLEAN,
    puede_editar BOOLEAN,
    puede_eliminar BOOLEAN,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, page_id)
);

-- 6. Agregar constraints de foreign key a usuarios si no existen
DO $$
BEGIN
    -- Agregar FK constraint para rol_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'usuarios' AND constraint_name = 'usuarios_rol_id_fkey'
    ) THEN
        ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_id_fkey
        FOREIGN KEY (rol_id) REFERENCES roles(id);
    END IF;

    -- Agregar FK constraint para creado_por
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'usuarios' AND constraint_name = 'usuarios_creado_por_fkey'
    ) THEN
        ALTER TABLE usuarios ADD CONSTRAINT usuarios_creado_por_fkey
        FOREIGN KEY (creado_por) REFERENCES usuarios(id);
    END IF;
END $$;

-- 7. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol_id ON usuarios(rol_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);
CREATE INDEX IF NOT EXISTS idx_roles_nombre ON roles(nombre);
CREATE INDEX IF NOT EXISTS idx_pages_nombre ON pages(nombre);
CREATE INDEX IF NOT EXISTS idx_permisos_rol_rol_id ON permisos_rol(rol_id);
CREATE INDEX IF NOT EXISTS idx_permisos_rol_page_id ON permisos_rol(page_id);
CREATE INDEX IF NOT EXISTS idx_permisos_usuario_usuario_id ON permisos_usuario(usuario_id);
CREATE INDEX IF NOT EXISTS idx_permisos_usuario_page_id ON permisos_usuario(page_id);

-- 8. Crear/actualizar función y triggers para fecha_actualizacion
CREATE OR REPLACE FUNCTION update_fecha_actualizacion_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_usuarios_fecha_actualizacion ON usuarios;
CREATE TRIGGER update_usuarios_fecha_actualizacion BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_fecha_actualizacion_column();

DROP TRIGGER IF EXISTS update_permisos_usuario_fecha_actualizacion ON permisos_usuario;
CREATE TRIGGER update_permisos_usuario_fecha_actualizacion BEFORE UPDATE ON permisos_usuario
    FOR EACH ROW EXECUTE FUNCTION update_fecha_actualizacion_column();

-- 9. Insertar roles del sistema
INSERT INTO roles (nombre, descripcion, activo) VALUES
    ('Administrador', 'Acceso completo al sistema', TRUE),
    ('Supervisor', 'Supervisión y aprobación de operaciones', TRUE),
    ('Operador', 'Registro y consulta de operaciones diarias', TRUE),
    ('Solo Lectura', 'Solo puede ver información sin editar', TRUE)
ON CONFLICT (nombre) DO NOTHING;

-- 10. Insertar páginas del sistema
INSERT INTO pages (nombre, nombre_display, ruta, icono, orden, activo) VALUES
    ('dashboard', 'Dashboard', '/', 'FaTachometerAlt', 1, TRUE),
    ('operaciones', 'Operaciones Diarias', '/operaciones', 'FaTruck', 2, TRUE),
    ('entregas', 'Entregas', '/entregas', 'FaBoxOpen', 3, TRUE),
    ('usuarios', 'Gestión de Usuarios', '/usuarios', 'FaUsers', 4, TRUE),
    ('roles', 'Roles y Permisos', '/roles', 'FaUserShield', 5, TRUE),
    ('reportes', 'Reportes', '/reportes', 'FaChartBar', 6, TRUE)
ON CONFLICT (nombre) DO NOTHING;

-- 11. Permisos para el rol Administrador (acceso completo a todo)
INSERT INTO permisos_rol (rol_id, page_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT
    r.id,
    p.id,
    TRUE,
    TRUE,
    TRUE,
    TRUE
FROM roles r
CROSS JOIN pages p
WHERE r.nombre = 'Administrador'
ON CONFLICT (rol_id, page_id) DO NOTHING;

-- 12. Permisos para el rol Supervisor
INSERT INTO permisos_rol (rol_id, page_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT
    r.id,
    p.id,
    TRUE,
    CASE WHEN p.nombre IN ('usuarios', 'roles') THEN FALSE ELSE TRUE END,
    TRUE,
    CASE WHEN p.nombre IN ('usuarios', 'roles') THEN FALSE ELSE TRUE END
FROM roles r
CROSS JOIN pages p
WHERE r.nombre = 'Supervisor'
ON CONFLICT (rol_id, page_id) DO NOTHING;

-- 13. Permisos para el rol Operador
INSERT INTO permisos_rol (rol_id, page_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT
    r.id,
    p.id,
    TRUE,
    CASE WHEN p.nombre IN ('operaciones', 'entregas') THEN TRUE ELSE FALSE END,
    CASE WHEN p.nombre IN ('operaciones', 'entregas') THEN TRUE ELSE FALSE END,
    FALSE
FROM roles r
CROSS JOIN pages p
WHERE r.nombre = 'Operador' AND p.nombre NOT IN ('usuarios', 'roles')
ON CONFLICT (rol_id, page_id) DO NOTHING;

-- 14. Permisos para el rol Solo Lectura
INSERT INTO permisos_rol (rol_id, page_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT
    r.id,
    p.id,
    TRUE,
    FALSE,
    FALSE,
    FALSE
FROM roles r
CROSS JOIN pages p
WHERE r.nombre = 'Solo Lectura' AND p.nombre NOT IN ('usuarios', 'roles')
ON CONFLICT (rol_id, page_id) DO NOTHING;

-- 15. Actualizar usuarios existentes sin rol para asignarles rol de Operador
UPDATE usuarios
SET rol_id = (SELECT id FROM roles WHERE nombre = 'Operador')
WHERE rol_id IS NULL AND username != 'admin';

-- 16. Actualizar/crear usuario administrador
INSERT INTO usuarios (username, password_hash, nombre_completo, email, rol_id, activo)
SELECT
    'admin',
    '$2b$12$u3tRVni5FerUJ9c7NW3pau84O/kuFppCBuk/sZyP9gx0yJTfpO.Jq',
    'Administrador del Sistema',
    'admin@example.com',
    r.id,
    TRUE
FROM roles r
WHERE r.nombre = 'Administrador'
ON CONFLICT (username) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    rol_id = EXCLUDED.rol_id,
    nombre_completo = EXCLUDED.nombre_completo,
    activo = EXCLUDED.activo;

COMMIT;

-- Verificar la migración
SELECT 'Migración completada exitosamente!' as mensaje;
SELECT 'Roles creados:' as info, COUNT(*) as cantidad FROM roles;
SELECT 'Páginas creadas:' as info, COUNT(*) as cantidad FROM pages;
SELECT 'Usuarios actualizados:' as info, COUNT(*) as cantidad FROM usuarios;
SELECT 'Permisos de rol creados:' as info, COUNT(*) as cantidad FROM permisos_rol;
