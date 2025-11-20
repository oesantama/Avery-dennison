-- ============================================================================
-- SCRIPT DE VERIFICACIÓN - VER ESTADO ACTUAL
-- ============================================================================
-- Ejecuta este script ANTES de aplicar la corrección para ver qué tienes
-- ============================================================================

-- 1. Ver todas las páginas actuales
SELECT
    id,
    nombre,
    nombre_display,
    ruta,
    activo,
    orden
FROM pages
ORDER BY orden, nombre;

-- 2. Contar páginas activas
SELECT
    COUNT(*) as total_paginas,
    COUNT(CASE WHEN activo = TRUE THEN 1 END) as paginas_activas,
    COUNT(CASE WHEN activo = FALSE THEN 1 END) as paginas_inactivas
FROM pages;

-- 3. Ver permisos del rol Administrador
SELECT
    p.nombre as page_nombre,
    p.ruta as page_ruta,
    pr.puede_ver,
    pr.puede_crear,
    pr.puede_editar,
    pr.puede_eliminar
FROM permisos_rol pr
JOIN pages p ON pr.page_id = p.id
JOIN roles r ON pr.rol_id = r.id
WHERE r.nombre = 'Administrador'
ORDER BY p.orden, p.nombre;

-- 4. Verificar usuario admin
SELECT
    u.id,
    u.username,
    u.activo,
    u.rol_id,
    r.nombre as rol_nombre
FROM usuarios u
LEFT JOIN roles r ON u.rol_id = r.id
WHERE u.username = 'admin';
