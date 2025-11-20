-- ============================================================================
-- SCRIPT DE CORRECCIÓN Y ACTUALIZACIÓN DE PÁGINAS
-- ============================================================================
-- Este script:
-- 1. Actualiza las rutas de páginas existentes
-- 2. Inserta todas las páginas faltantes
-- 3. Asegura que el rol Administrador tenga todos los permisos
-- ============================================================================

BEGIN;

-- ============================================================================
-- PASO 1: ACTUALIZAR RUTAS DE PÁGINAS EXISTENTES
-- ============================================================================

-- Actualizar Dashboard (ya está bien)
UPDATE pages
SET ruta = '/dashboard',
    nombre_display = 'Dashboard',
    activo = TRUE
WHERE nombre = 'dashboard';

-- Actualizar Operaciones (ya está bien)
UPDATE pages
SET ruta = '/operaciones',
    nombre_display = 'Operaciones Diarias',
    activo = TRUE
WHERE nombre = 'operaciones';

-- Actualizar Entregas
UPDATE pages
SET ruta = '/entregas',
    nombre_display = 'Entregas',
    activo = TRUE
WHERE nombre = 'entregas';

-- Actualizar Usuarios a la ruta de maestros
UPDATE pages
SET ruta = '/maestros/usuarios',
    nombre_display = 'Gestión de Usuarios',
    activo = TRUE
WHERE nombre = 'usuarios';

-- Actualizar Roles a la ruta de maestros
UPDATE pages
SET ruta = '/maestros/roles',
    nombre_display = 'Roles y Permisos',
    activo = TRUE
WHERE nombre = 'roles';


-- ============================================================================
-- PASO 2: INSERTAR PÁGINAS FALTANTES
-- ============================================================================

-- Consultas
INSERT INTO pages (nombre, nombre_display, ruta, icono, orden, activo) VALUES
    ('consultas_entregas', 'Consultar Entregas', '/consultas/entregas', 'FaSearch', 10, TRUE)
ON CONFLICT (nombre) DO UPDATE SET
    ruta = EXCLUDED.ruta,
    nombre_display = EXCLUDED.nombre_display,
    activo = TRUE;

-- Maestros - Vehículos
INSERT INTO pages (nombre, nombre_display, ruta, icono, orden, activo) VALUES
    ('vehiculos', 'Vehículos', '/maestros/vehiculos', 'FaCar', 20, TRUE)
ON CONFLICT (nombre) DO UPDATE SET
    ruta = EXCLUDED.ruta,
    nombre_display = EXCLUDED.nombre_display,
    activo = TRUE;

-- Maestros - Tipos de Vehículo
INSERT INTO pages (nombre, nombre_display, ruta, icono, orden, activo) VALUES
    ('tipos_vehiculo', 'Tipos de Vehículo', '/maestros/tipos-vehiculo', 'FaTruckMoving', 21, TRUE)
ON CONFLICT (nombre) DO UPDATE SET
    ruta = EXCLUDED.ruta,
    nombre_display = EXCLUDED.nombre_display,
    activo = TRUE;

-- Maestros - Permisos por Rol
INSERT INTO pages (nombre, nombre_display, ruta, icono, orden, activo) VALUES
    ('permisos_rol', 'Permisos por Rol', '/maestros/permisos-rol', 'FaLock', 22, TRUE)
ON CONFLICT (nombre) DO UPDATE SET
    ruta = EXCLUDED.ruta,
    nombre_display = EXCLUDED.nombre_display,
    activo = TRUE;

-- Maestros - Permisos por Usuario
INSERT INTO pages (nombre, nombre_display, ruta, icono, orden, activo) VALUES
    ('permisos_usuario', 'Permisos por Usuario', '/maestros/permisos-usuario', 'FaUserLock', 23, TRUE)
ON CONFLICT (nombre) DO UPDATE SET
    ruta = EXCLUDED.ruta,
    nombre_display = EXCLUDED.nombre_display,
    activo = TRUE;

-- Maestros - Pages (gestión de páginas)
INSERT INTO pages (nombre, nombre_display, ruta, icono, orden, activo) VALUES
    ('pages', 'Gestión de Páginas', '/maestros/pages', 'FaFileAlt', 24, TRUE)
ON CONFLICT (nombre) DO UPDATE SET
    ruta = EXCLUDED.ruta,
    nombre_display = EXCLUDED.nombre_display,
    activo = TRUE;

-- Reportes (si existe, actualizarlo)
INSERT INTO pages (nombre, nombre_display, ruta, icono, orden, activo) VALUES
    ('reportes', 'Reportes', '/reportes', 'FaChartBar', 30, TRUE)
ON CONFLICT (nombre) DO UPDATE SET
    ruta = EXCLUDED.ruta,
    nombre_display = EXCLUDED.nombre_display,
    activo = TRUE;


-- ============================================================================
-- PASO 3: ASEGURAR QUE ADMINISTRADOR TENGA TODOS LOS PERMISOS
-- ============================================================================

-- Insertar permisos para TODAS las páginas al rol Administrador
INSERT INTO permisos_rol (rol_id, page_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT
    (SELECT id FROM roles WHERE nombre = 'Administrador'),
    p.id,
    TRUE,
    TRUE,
    TRUE,
    TRUE
FROM pages p
WHERE p.activo = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM permisos_rol pr
    WHERE pr.rol_id = (SELECT id FROM roles WHERE nombre = 'Administrador')
    AND pr.page_id = p.id
  );

-- Actualizar permisos existentes del Administrador para que sean TRUE
UPDATE permisos_rol
SET
    puede_ver = TRUE,
    puede_crear = TRUE,
    puede_editar = TRUE,
    puede_eliminar = TRUE
WHERE rol_id = (SELECT id FROM roles WHERE nombre = 'Administrador');


-- ============================================================================
-- PASO 4: VERIFICACIÓN - MOSTRAR TODAS LAS PÁGINAS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'PÁGINAS REGISTRADAS EN EL SISTEMA:';
    RAISE NOTICE '============================================';
END $$;

SELECT
    id,
    nombre,
    nombre_display,
    ruta,
    activo,
    orden
FROM pages
ORDER BY orden, nombre;


-- ============================================================================
-- PASO 5: VERIFICACIÓN - PERMISOS DEL ADMINISTRADOR
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'PERMISOS DEL ROL ADMINISTRADOR:';
    RAISE NOTICE '============================================';
END $$;

SELECT
    p.nombre,
    p.ruta,
    pr.puede_ver,
    pr.puede_crear,
    pr.puede_editar,
    pr.puede_eliminar
FROM permisos_rol pr
JOIN pages p ON pr.page_id = p.id
JOIN roles r ON pr.rol_id = r.id
WHERE r.nombre = 'Administrador'
ORDER BY p.orden, p.nombre;

COMMIT;

-- ============================================================================
-- RESUMEN
-- ============================================================================
-- Después de ejecutar este script, deberías tener:
-- ✅ /dashboard
-- ✅ /operaciones
-- ✅ /entregas
-- ✅ /consultas/entregas
-- ✅ /maestros/usuarios
-- ✅ /maestros/roles
-- ✅ /maestros/vehiculos
-- ✅ /maestros/tipos-vehiculo
-- ✅ /maestros/permisos-rol
-- ✅ /maestros/permisos-usuario
-- ✅ /maestros/pages
-- ✅ /reportes
-- ============================================================================
