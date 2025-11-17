-- ================================================
-- SISTEMA DE CONTROL DE ACCESO BASADO EN ROLES (RBAC)
-- Role-Based Access Control
-- ================================================

-- Eliminar tablas existentes en orden inverso de dependencias
DROP TABLE IF EXISTS permisos_usuario CASCADE;
DROP TABLE IF EXISTS permisos_rol CASCADE;
DROP TABLE IF EXISTS pages CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
-- No eliminamos usuarios porque tiene datos críticos

-- ================================================
-- TABLA: roles
-- Descripción: Define los roles del sistema
-- ================================================
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- TABLA: pages (recursos/páginas del sistema)
-- Descripción: Define las páginas/recursos que se pueden proteger
-- ================================================
CREATE TABLE IF NOT EXISTS pages (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,  -- Identificador técnico: "dashboard", "operaciones"
    nombre_display VARCHAR(100) NOT NULL, -- Nombre para mostrar: "Dashboard", "Operaciones Diarias"
    ruta VARCHAR(200) NOT NULL,           -- Ruta en el frontend: "/dashboard", "/operaciones"
    icono VARCHAR(50),                    -- Icono de react-icons: "FiHome", "FiTruck"
    orden INTEGER DEFAULT 0,              -- Orden en el menú
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- TABLA: permisos_rol
-- Descripción: Define qué permisos tiene cada rol sobre cada página
-- ================================================
CREATE TABLE IF NOT EXISTS permisos_rol (
    id SERIAL PRIMARY KEY,
    rol_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    page_id INTEGER NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    puede_ver BOOLEAN DEFAULT FALSE,
    puede_crear BOOLEAN DEFAULT FALSE,
    puede_editar BOOLEAN DEFAULT FALSE,
    puede_eliminar BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rol_id, page_id)  -- Un rol solo puede tener un conjunto de permisos por página
);

-- ================================================
-- TABLA: permisos_usuario
-- Descripción: Permisos específicos por usuario que sobrescriben los del rol
--              NULL significa "usar el permiso del rol"
-- ================================================
CREATE TABLE IF NOT EXISTS permisos_usuario (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    page_id INTEGER NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    puede_ver BOOLEAN,      -- NULL = usar permiso del rol
    puede_crear BOOLEAN,    -- NULL = usar permiso del rol
    puede_editar BOOLEAN,   -- NULL = usar permiso del rol
    puede_eliminar BOOLEAN, -- NULL = usar permiso del rol
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, page_id)  -- Un usuario solo puede tener permisos específicos una vez por página
);

-- ================================================
-- ACTUALIZAR TABLA: usuarios
-- Agregar campos para RBAC
-- ================================================
-- Nota: email, fecha_creacion y fecha_actualizacion ya existen en schema.sql
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS numero_celular VARCHAR(20),
ADD COLUMN IF NOT EXISTS rol_id INTEGER REFERENCES roles(id),
ADD COLUMN IF NOT EXISTS creado_por INTEGER REFERENCES usuarios(id);

-- Ampliar tamaño de columna email si es necesario
ALTER TABLE usuarios ALTER COLUMN email TYPE VARCHAR(255);

-- ================================================
-- DATOS INICIALES: Roles
-- ================================================
INSERT INTO roles (nombre, descripcion) VALUES
('Administrador', 'Acceso completo a todas las funcionalidades del sistema'),
('Operador', 'Puede gestionar operaciones y entregas pero no usuarios'),
('Visualizador', 'Solo puede ver información, sin permisos de edición')
ON CONFLICT (nombre) DO NOTHING;

-- ================================================
-- DATOS INICIALES: Pages (Páginas del sistema)
-- ================================================
INSERT INTO pages (nombre, nombre_display, ruta, icono, orden) VALUES
('dashboard', 'Dashboard', '/dashboard', 'FiHome', 1),
('operaciones', 'Operaciones Diarias', '/operaciones', 'FiTruck', 2),
('entregas', 'Entregas', '/entregas', 'FiPackage', 3),
('usuarios', 'Gestión de Usuarios', '/usuarios', 'FiUsers', 4)
ON CONFLICT (nombre) DO NOTHING;

-- ================================================
-- DATOS INICIALES: Permisos por Rol
-- ================================================

-- ADMINISTRADOR: Todos los permisos en todas las páginas
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

-- OPERADOR: Puede ver y editar operaciones/entregas, solo ver dashboard, sin acceso a usuarios
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

-- VISUALIZADOR: Solo puede ver todo, sin permisos de edición
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
WHERE r.nombre = 'Visualizador' AND p.nombre != 'usuarios'
ON CONFLICT (rol_id, page_id) DO NOTHING;

-- ================================================
-- ACTUALIZAR USUARIO ADMIN EXISTENTE
-- Asignarle el rol de Administrador y email
-- ================================================
UPDATE usuarios
SET
    rol_id = (SELECT id FROM roles WHERE nombre = 'Administrador'),
    email = 'admin@sistema.local',
    numero_celular = NULL
WHERE username = 'admin' AND rol_id IS NULL;

-- ================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ================================================
CREATE INDEX IF NOT EXISTS idx_permisos_rol_rol ON permisos_rol(rol_id);
CREATE INDEX IF NOT EXISTS idx_permisos_rol_page ON permisos_rol(page_id);
CREATE INDEX IF NOT EXISTS idx_permisos_usuario_usuario ON permisos_usuario(usuario_id);
CREATE INDEX IF NOT EXISTS idx_permisos_usuario_page ON permisos_usuario(page_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);

-- ================================================
-- FUNCIÓN: Obtener permisos efectivos de un usuario en una página
-- Combina permisos del rol con permisos específicos del usuario
-- ================================================
CREATE OR REPLACE FUNCTION obtener_permisos_usuario(p_usuario_id INTEGER, p_page_nombre VARCHAR)
RETURNS TABLE (
    puede_ver BOOLEAN,
    puede_crear BOOLEAN,
    puede_editar BOOLEAN,
    puede_eliminar BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        -- Si hay permiso específico de usuario, usarlo; sino, usar del rol
        COALESCE(pu.puede_ver, pr.puede_ver, FALSE) AS puede_ver,
        COALESCE(pu.puede_crear, pr.puede_crear, FALSE) AS puede_crear,
        COALESCE(pu.puede_editar, pr.puede_editar, FALSE) AS puede_editar,
        COALESCE(pu.puede_eliminar, pr.puede_eliminar, FALSE) AS puede_eliminar
    FROM usuarios u
    INNER JOIN roles r ON u.rol_id = r.id
    INNER JOIN pages p ON p.nombre = p_page_nombre
    LEFT JOIN permisos_rol pr ON pr.rol_id = r.id AND pr.page_id = p.id
    LEFT JOIN permisos_usuario pu ON pu.usuario_id = u.id AND pu.page_id = p.id
    WHERE u.id = p_usuario_id AND u.activo = TRUE;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- VISTA: Permisos efectivos de todos los usuarios
-- Útil para debugging y reportes
-- ================================================
CREATE OR REPLACE VIEW v_permisos_usuarios AS
SELECT
    u.id AS usuario_id,
    u.username,
    u.nombre_completo,
    r.nombre AS rol,
    p.nombre AS page,
    p.nombre_display AS page_display,
    COALESCE(pu.puede_ver, pr.puede_ver, FALSE) AS puede_ver,
    COALESCE(pu.puede_crear, pr.puede_crear, FALSE) AS puede_crear,
    COALESCE(pu.puede_editar, pr.puede_editar, FALSE) AS puede_editar,
    COALESCE(pu.puede_eliminar, pr.puede_eliminar, FALSE) AS puede_eliminar
FROM usuarios u
INNER JOIN roles r ON u.rol_id = r.id
CROSS JOIN pages p
LEFT JOIN permisos_rol pr ON pr.rol_id = r.id AND pr.page_id = p.id
LEFT JOIN permisos_usuario pu ON pu.usuario_id = u.id AND pu.page_id = p.id
WHERE u.activo = TRUE AND p.activo = TRUE
ORDER BY u.username, p.orden;

-- ================================================
-- VERIFICACIÓN
-- ================================================
SELECT 'RBAC Schema creado exitosamente' AS status;
SELECT 'Roles creados:', COUNT(*) FROM roles;
SELECT 'Pages creadas:', COUNT(*) FROM pages;
SELECT 'Permisos de rol configurados:', COUNT(*) FROM permisos_rol;
