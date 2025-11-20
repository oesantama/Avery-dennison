-- ✅ Script de verificación de base de datos
-- Ejecutar estas queries en tu herramienta de BD (pgAdmin, DBeaver, etc.)

-- 1. Verificar que el usuario admin existe y tiene rol
SELECT
    u.id,
    u.username,
    u.activo,
    u.rol_id,
    r.nombre as nombre_rol
FROM usuarios u
LEFT JOIN roles r ON u.rol_id = r.id
WHERE u.username = 'admin';

-- Resultado esperado:
-- id | username | activo | rol_id | nombre_rol
-- 1  | admin    | true   | 1      | Administrador


-- 2. Verificar que el rol Administrador existe
SELECT id, nombre, activo
FROM roles
WHERE nombre = 'Administrador';

-- Resultado esperado:
-- id | nombre         | activo
-- 1  | Administrador  | true


-- 3. Verificar que existen páginas activas
SELECT id, nombre, ruta, activo
FROM pages
WHERE activo = true
ORDER BY nombre;

-- Resultado esperado: Varias páginas (dashboard, operaciones, entregas, etc.)


-- 4. Verificar que la tabla permisos_rol existe y tiene datos
SELECT COUNT(*) as total_permisos
FROM permisos_rol;

-- Resultado esperado: Número mayor a 0


-- 5. Verificar permisos del rol Administrador
SELECT
    r.nombre as rol,
    p.nombre as page_nombre,
    p.ruta as page_ruta,
    pr.puede_ver,
    pr.puede_crear,
    pr.puede_editar,
    pr.puede_eliminar
FROM permisos_rol pr
JOIN roles r ON pr.rol_id = r.id
JOIN pages p ON pr.page_id = p.id
WHERE r.nombre = 'Administrador'
ORDER BY p.nombre;

-- Resultado esperado:
-- Múltiples filas mostrando permisos del Administrador en todas las páginas


-- 6. Verificar si el usuario admin tiene permisos especiales
SELECT
    u.username,
    p.nombre as page_nombre,
    p.ruta as page_ruta,
    pu.puede_ver,
    pu.puede_crear,
    pu.puede_editar,
    pu.puede_eliminar
FROM permisos_usuario pu
JOIN usuarios u ON pu.usuario_id = u.id
JOIN pages p ON pu.page_id = p.id
WHERE u.username = 'admin';

-- Resultado: Puede estar vacío (el admin usa permisos del rol)


-- ============================================================
-- SI ALGO FALTA, EJECUTAR ESTAS CORRECCIONES:
-- ============================================================

-- CORRECCIÓN 1: Asegurar que admin tiene rol Administrador
UPDATE usuarios
SET rol_id = (SELECT id FROM roles WHERE nombre = 'Administrador')
WHERE username = 'admin';

-- CORRECCIÓN 2: Asegurar que Administrador tiene todos los permisos
INSERT INTO permisos_rol (rol_id, page_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT
    (SELECT id FROM roles WHERE nombre = 'Administrador'),
    p.id,
    TRUE,
    TRUE,
    TRUE,
    TRUE
FROM pages p
WHERE NOT EXISTS (
    SELECT 1 FROM permisos_rol pr
    WHERE pr.rol_id = (SELECT id FROM roles WHERE nombre = 'Administrador')
    AND pr.page_id = p.id
);
