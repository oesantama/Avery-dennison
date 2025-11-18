-- ============================================================================
-- CONFIGURACIÓN DE PERMISOS SIMPLIFICADA
-- ============================================================================
-- ✅ Este script configura el sistema de permisos por usuario
-- ✅ SOLO usa tabla permisos_usuarios (NO permisos por rol)
-- ✅ Ejecutar este script en PostgreSQL
-- ============================================================================

-- 1️⃣ Verificar páginas existentes
SELECT id, nombre, ruta, activo FROM pages ORDER BY nombre;

-- 2️⃣ Insertar páginas faltantes (si no existen)
-- Ajusta los IDs según tu base de datos
INSERT INTO pages (nombre, nombre_display, ruta, icono, orden, activo)
VALUES 
    ('roles', 'Roles', '/maestros/roles', 'FiUsers', 50, true),
    ('pages', 'Páginas', '/maestros/pages', 'FiFile', 51, true),
    ('permisos-rol', 'Permisos por Rol', '/maestros/permisos-rol', 'FiShield', 52, true),
    ('permisos-usuario', 'Permisos por Usuario', '/maestros/permisos-usuario', 'FiUserCheck', 53, true)
ON CONFLICT (nombre) DO NOTHING;

-- 3️⃣ Limpiar permisos existentes del usuario admin (ID = 1)
-- ⚠️ Ajusta el usuario_id según tu base de datos
DELETE FROM permisos_usuarios WHERE usuario_id = 1;

-- 4️⃣ Asignar TODOS los permisos al usuario admin (ID = 1)
-- ⚠️ Ajusta el usuario_id según tu base de datos
INSERT INTO permisos_usuarios (usuario_id, page_id, puede_ver, puede_crear, puede_editar, puede_borrar, estado, usuario_control)
SELECT 
    1 as usuario_id,  -- ⚠️ Cambiar por el ID de tu usuario admin
    p.id as page_id,
    true as puede_ver,
    true as puede_crear,
    true as puede_editar,
    true as puede_borrar,
    'activo' as estado,
    1 as usuario_control
FROM pages p
WHERE p.activo = true;

-- 5️⃣ Verificar permisos asignados
SELECT 
    u.username,
    p.nombre as pagina,
    p.ruta,
    pu.puede_ver,
    pu.puede_crear,
    pu.puede_editar,
    pu.puede_borrar,
    pu.estado
FROM permisos_usuarios pu
JOIN usuarios u ON u.id = pu.usuario_id
JOIN pages p ON p.id = pu.page_id
WHERE pu.usuario_id = 1  -- ⚠️ Cambiar por el ID de tu usuario
ORDER BY p.nombre;

-- ============================================================================
-- EJEMPLO: Crear usuario externo con permisos limitados
-- ============================================================================

-- 6️⃣ Crear usuario externo (ejemplo)
/*
INSERT INTO usuarios (username, password_hash, nombre_completo, email, rol_id, activo, bloqueado_hasta, intentos_fallidos)
VALUES (
    'usuario_externo',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyJvK9Rq.N8u',  -- password: "demo123"
    'Usuario Externo',
    'externo@example.com',
    2,  -- ID del rol (puedes usar cualquier rol, ya no importa)
    true,
    NULL,
    0
);
*/

-- 7️⃣ Asignar permisos específicos al usuario externo
-- Ejemplo: Solo VER roles, VER y CREAR permisos-rol
/*
-- Limpiar permisos del usuario externo (ID = 2)
DELETE FROM permisos_usuarios WHERE usuario_id = 2;

-- Dashboard (obligatorio)
INSERT INTO permisos_usuarios (usuario_id, page_id, puede_ver, puede_crear, puede_editar, puede_borrar, estado, usuario_control)
SELECT 2, id, true, false, false, false, 'activo', 1
FROM pages WHERE nombre = 'dashboard';

-- Roles - Solo VER
INSERT INTO permisos_usuarios (usuario_id, page_id, puede_ver, puede_crear, puede_editar, puede_borrar, estado, usuario_control)
SELECT 2, id, true, false, false, false, 'activo', 1
FROM pages WHERE nombre = 'roles';

-- Permisos-Rol - VER y CREAR
INSERT INTO permisos_usuarios (usuario_id, page_id, puede_ver, puede_crear, puede_editar, puede_borrar, estado, usuario_control)
SELECT 2, id, true, true, false, false, 'activo', 1
FROM pages WHERE nombre = 'permisos-rol';

-- Tipos-Vehiculo - TODOS los permisos
INSERT INTO permisos_usuarios (usuario_id, page_id, puede_ver, puede_crear, puede_editar, puede_borrar, estado, usuario_control)
SELECT 2, id, true, true, true, true, 'activo', 1
FROM pages WHERE nombre = 'tipos-vehiculo';
*/

-- ============================================================================
-- CONSULTAS ÚTILES
-- ============================================================================

-- Ver todos los usuarios y sus permisos
SELECT 
    u.id,
    u.username,
    u.nombre_completo,
    COUNT(pu.id) as total_permisos
FROM usuarios u
LEFT JOIN permisos_usuarios pu ON pu.usuario_id = u.id AND pu.estado = 'activo'
WHERE u.activo = true
GROUP BY u.id, u.username, u.nombre_completo
ORDER BY u.username;

-- Ver páginas sin permisos asignados a un usuario
SELECT p.nombre, p.ruta
FROM pages p
WHERE p.activo = true
AND NOT EXISTS (
    SELECT 1 FROM permisos_usuarios pu
    WHERE pu.page_id = p.id
    AND pu.usuario_id = 1  -- ⚠️ Cambiar por el ID del usuario
    AND pu.estado = 'activo'
)
ORDER BY p.nombre;
