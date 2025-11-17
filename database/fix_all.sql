-- ================================================
-- SCRIPT UNIFICADO: Corrección completa de base de datos
-- ================================================

-- ================================================
-- PASO 1: Migrar columnas de usuarios
-- ================================================

-- Agregar fecha_creacion si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'usuarios' AND column_name = 'fecha_creacion') THEN
        ALTER TABLE usuarios ADD COLUMN fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'usuarios' AND column_name = 'created_at') THEN
            UPDATE usuarios SET fecha_creacion = created_at WHERE created_at IS NOT NULL;
        END IF;
    END IF;
END $$;

-- Agregar fecha_actualizacion si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'usuarios' AND column_name = 'fecha_actualizacion') THEN
        ALTER TABLE usuarios ADD COLUMN fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'usuarios' AND column_name = 'updated_at') THEN
            UPDATE usuarios SET fecha_actualizacion = updated_at WHERE updated_at IS NOT NULL;
        END IF;
    END IF;
END $$;

-- Agregar columnas RBAC si no existen
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS numero_celular VARCHAR(20);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS creado_por INTEGER;

-- Eliminar columnas antiguas si existen las nuevas
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'usuarios' AND column_name = 'fecha_creacion')
       AND EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'usuarios' AND column_name = 'created_at') THEN
        ALTER TABLE usuarios DROP COLUMN created_at;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'usuarios' AND column_name = 'fecha_actualizacion')
       AND EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'usuarios' AND column_name = 'updated_at') THEN
        ALTER TABLE usuarios DROP COLUMN updated_at;
    END IF;
END $$;

-- ================================================
-- PASO 2: Crear tablas RBAC
-- ================================================

CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pages (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    nombre_display VARCHAR(100) NOT NULL,
    ruta VARCHAR(200) NOT NULL,
    icono VARCHAR(50),
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permisos_rol (
    id SERIAL PRIMARY KEY,
    rol_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    page_id INTEGER NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    puede_ver BOOLEAN DEFAULT FALSE,
    puede_crear BOOLEAN DEFAULT FALSE,
    puede_editar BOOLEAN DEFAULT FALSE,
    puede_eliminar BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rol_id, page_id)
);

CREATE TABLE IF NOT EXISTS permisos_usuario (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    page_id INTEGER NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    puede_ver BOOLEAN,
    puede_crear BOOLEAN,
    puede_editar BOOLEAN,
    puede_eliminar BOOLEAN,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, page_id)
);

-- Agregar rol_id a usuarios con foreign key
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'usuarios' AND column_name = 'rol_id') THEN
        ALTER TABLE usuarios ADD COLUMN rol_id INTEGER REFERENCES roles(id);
    END IF;
END $$;

-- Agregar foreign key a creado_por si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'usuarios_creado_por_fkey'
    ) THEN
        ALTER TABLE usuarios ADD CONSTRAINT usuarios_creado_por_fkey
        FOREIGN KEY (creado_por) REFERENCES usuarios(id);
    END IF;
END $$;

-- ================================================
-- PASO 3: Insertar datos iniciales
-- ================================================

-- Roles
INSERT INTO roles (nombre, descripcion) VALUES
('Administrador', 'Acceso completo a todas las funcionalidades del sistema'),
('Operador', 'Puede gestionar operaciones y entregas pero no usuarios'),
('Visualizador', 'Solo puede ver información, sin permisos de edición')
ON CONFLICT (nombre) DO NOTHING;

-- Pages
INSERT INTO pages (nombre, nombre_display, ruta, icono, orden) VALUES
('dashboard', 'Dashboard', '/dashboard', 'FiHome', 1),
('operaciones', 'Operaciones Diarias', '/operaciones', 'FiTruck', 2),
('entregas', 'Entregas', '/entregas', 'FiPackage', 3),
('usuarios', 'Gestión de Usuarios', '/usuarios', 'FiUsers', 4)
ON CONFLICT (nombre) DO NOTHING;

-- Permisos para Administrador
INSERT INTO permisos_rol (rol_id, page_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT r.id, p.id, TRUE, TRUE, TRUE, TRUE
FROM roles r
CROSS JOIN pages p
WHERE r.nombre = 'Administrador'
ON CONFLICT (rol_id, page_id) DO NOTHING;

-- Permisos para Operador
INSERT INTO permisos_rol (rol_id, page_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT
    r.id,
    p.id,
    TRUE,
    CASE WHEN p.nombre IN ('operaciones', 'entregas') THEN TRUE ELSE FALSE END,
    CASE WHEN p.nombre IN ('operaciones', 'entregas') THEN TRUE ELSE FALSE END,
    CASE WHEN p.nombre IN ('operaciones', 'entregas') THEN TRUE ELSE FALSE END
FROM roles r
CROSS JOIN pages p
WHERE r.nombre = 'Operador' AND p.nombre != 'usuarios'
ON CONFLICT (rol_id, page_id) DO NOTHING;

-- Permisos para Visualizador
INSERT INTO permisos_rol (rol_id, page_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT r.id, p.id, TRUE, FALSE, FALSE, FALSE
FROM roles r
CROSS JOIN pages p
WHERE r.nombre = 'Visualizador' AND p.nombre != 'usuarios'
ON CONFLICT (rol_id, page_id) DO NOTHING;

-- ================================================
-- PASO 4: Crear/Actualizar usuario admin
-- ================================================

-- Eliminar admin existente
DELETE FROM usuarios WHERE username = 'admin';

-- Insertar usuario admin
INSERT INTO usuarios (
    username,
    password_hash,
    nombre_completo,
    email,
    numero_celular,
    rol_id,
    creado_por,
    activo,
    fecha_creacion,
    fecha_actualizacion
) VALUES (
    'admin',
    '$2b$12$u3tRVni5FerUJ9c7NW3pau84O/kuFppCBuk/sZyP9gx0yJTfpO.Jq',
    'Administrador del Sistema',
    'admin@sistema.local',
    '+57 300 123 4567',
    (SELECT id FROM roles WHERE nombre = 'Administrador' LIMIT 1),
    NULL,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- ================================================
-- PASO 5: Crear índices
-- ================================================

CREATE INDEX IF NOT EXISTS idx_permisos_rol_rol ON permisos_rol(rol_id);
CREATE INDEX IF NOT EXISTS idx_permisos_rol_page ON permisos_rol(page_id);
CREATE INDEX IF NOT EXISTS idx_permisos_usuario_usuario ON permisos_usuario(usuario_id);
CREATE INDEX IF NOT EXISTS idx_permisos_usuario_page ON permisos_usuario(page_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);

-- ================================================
-- PASO 6: Recrear trigger para fecha_actualizacion
-- ================================================

DROP TRIGGER IF EXISTS update_usuarios_fecha_actualizacion ON usuarios;

CREATE TRIGGER update_usuarios_fecha_actualizacion
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- VERIFICACIÓN FINAL
-- ================================================

SELECT '========================================' AS separador;
SELECT 'VERIFICACIÓN DE CORRECCIÓN' AS titulo;
SELECT '========================================' AS separador;

SELECT 'Columnas de tabla usuarios:' AS info;
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'usuarios'
ORDER BY ordinal_position;

SELECT '' AS separador;
SELECT 'Usuario admin creado:' AS info;
SELECT
    u.id,
    u.username,
    u.nombre_completo,
    u.email,
    u.numero_celular,
    r.nombre AS rol,
    u.activo
FROM usuarios u
LEFT JOIN roles r ON u.rol_id = r.id
WHERE u.username = 'admin';

SELECT '' AS separador;
SELECT 'Resumen:' AS info;
SELECT 'Roles:' AS tipo, COUNT(*) AS cantidad FROM roles
UNION ALL
SELECT 'Pages:', COUNT(*) FROM pages
UNION ALL
SELECT 'Permisos Rol:', COUNT(*) FROM permisos_rol
UNION ALL
SELECT 'Usuarios:', COUNT(*) FROM usuarios;
