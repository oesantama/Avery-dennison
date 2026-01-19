
-- 1. Crear tabla de vehículos si no existe (crear_tabla_vehiculos.sql)
CREATE TABLE IF NOT EXISTS vehiculos (
    id SERIAL PRIMARY KEY,
    placa VARCHAR(20) UNIQUE NOT NULL,
    marca VARCHAR(50),
    modelo VARCHAR(50),
    anio INTEGER,
    tipo VARCHAR(30),
    estado VARCHAR(20) DEFAULT 'disponible',
    conductor_asignado VARCHAR(100),
    observaciones TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear tablas maestras si no existen (crear_tablas_maestras.sql)
CREATE TABLE IF NOT EXISTS tipos_vehiculo (
    id SERIAL PRIMARY KEY,
    descripcion VARCHAR(100) NOT NULL UNIQUE,
    estado VARCHAR(20) DEFAULT 'activo',
    fecha_control TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    usuario_control INTEGER
);

-- 3. Asegurar que existan TODAS las páginas en la tabla 'pages'
INSERT INTO pages (nombre, nombre_display, ruta, icono, orden, activo) VALUES
('dashboard', 'Dashboard', '/dashboard', 'FiHome', 1, TRUE),
('operaciones', 'Operaciones Diarias', '/operaciones', 'FiTruck', 2, TRUE),
('entregas', 'Entregas', '/entregas', 'FiPackage', 3, TRUE),
('maestros', 'Maestros', '/maestros', 'FiDatabase', 4, TRUE), -- Nueva página solicitada implícitamente
('usuarios', 'Gestión de Usuarios', '/usuarios', 'FiUsers', 5, TRUE),
('roles', 'Roles y Permisos', '/roles', 'FiShield', 6, TRUE),
('reportes', 'Reportes', '/reportes', 'FiBarChart', 7, TRUE)
ON CONFLICT (nombre) DO UPDATE SET
    orden = EXCLUDED.orden,
    activo = TRUE; -- Asegurar que estén activos

-- 4. Asegurar Rol Administrador
INSERT INTO roles (nombre, descripcion, activo) VALUES
('Administrador', 'Acceso total', TRUE)
ON CONFLICT (nombre) DO NOTHING;

-- 5. ASIGNAR PERMISOS TOTALES AL ADMINISTRADOR
-- Borramos permisos previos del admin para regenerarlos limpios
DELETE FROM permisos_rol 
WHERE rol_id = (SELECT id FROM roles WHERE nombre = 'Administrador');

INSERT INTO permisos_rol (rol_id, page_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT 
    (SELECT id FROM roles WHERE nombre = 'Administrador'),
    id, -- page_id
    TRUE, TRUE, TRUE, TRUE
FROM pages;

-- 6. CREAR/ACTUALIZAR USUARIO milla7
-- Password hash para 'milla7123*' (generado previamente o placeholder, usaremos bcrypt pre-calc si es posible, o actualizaremos vía app)
-- Usaremos un hash conocido de bcrypt para 'milla7123*' temporarlmente o el mismo de admin123 y pedimos cambio.
-- Mejor: Dejar que el script Python actualice el password hash correcto.
-- Aquí solo aseguramos que el usuario exista y sea Admin.

INSERT INTO usuarios (username, password_hash, nombre_completo, email, rol_id, activo)
VALUES (
    'milla7',
    '$2b$12$u3tRVni5FerUJ9c7NW3pau84O/kuFppCBuk/sZyP9gx0yJTfpO.Jq', -- Hash de admin123 temporal
    'Milla 7 Admin',
    'milla7@millasiete.com',
    (SELECT id FROM roles WHERE nombre = 'Administrador'),
    TRUE
)
ON CONFLICT (username) DO UPDATE SET
    rol_id = (SELECT id FROM roles WHERE nombre = 'Administrador'),
    activo = TRUE;

-- 7. Actualizar admin también
UPDATE usuarios 
SET rol_id = (SELECT id FROM roles WHERE nombre = 'Administrador'),
    activo = TRUE
WHERE username = 'admin';

-- Verificación
SELECT p.nombre, pr.puede_ver 
FROM permisos_rol pr 
JOIN pages p ON pr.page_id = p.id 
JOIN roles r ON pr.rol_id = r.id 
WHERE r.nombre = 'Administrador';

