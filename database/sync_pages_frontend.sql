
-- 1. Actualizar rutas existentes para coincidir con el Frontend
UPDATE pages SET ruta = '/consultas/entregas' WHERE nombre = 'entregas';
UPDATE pages SET ruta = '/maestros/usuarios' WHERE nombre = 'usuarios';
UPDATE pages SET ruta = '/maestros/roles' WHERE nombre = 'roles';

-- 2. Insertar páginas faltantes del submenú Maestros
INSERT INTO pages (nombre, nombre_display, ruta, icono, orden, activo) VALUES
('vehiculos', 'Vehículos', '/maestros/vehiculos', 'FiTool', 10, TRUE),
('tipos_vehiculo', 'Tipos de Vehículo', '/maestros/tipos-vehiculo', 'FiSettings', 11, TRUE),
('permisos_rol', 'Permisos por Rol', '/maestros/permisos-rol', 'FiShield', 12, TRUE),
('pages_admin', 'Administrar Páginas', '/maestros/pages', 'FiSettings', 13, TRUE)
ON CONFLICT (nombre) DO UPDATE SET
    ruta = EXCLUDED.ruta,
    activo = TRUE;

-- 3. Regenerar permisos para Administrador (y milla7)
-- Borrar permisos previos para evitar duplicados o estados inconsistentes
DELETE FROM permisos_rol 
WHERE rol_id = (SELECT id FROM roles WHERE nombre = 'Administrador');

DELETE FROM permisos_usuario 
WHERE usuario_id = (SELECT id FROM usuarios WHERE username = 'milla7');

-- Asignar permisos de Rol Admin nuevamente
INSERT INTO permisos_rol (rol_id, page_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT 
    (SELECT id FROM roles WHERE nombre = 'Administrador'),
    id,
    TRUE, TRUE, TRUE, TRUE
FROM pages;

-- Asignar permisos explícitos de Usuario milla7 nuevamente
INSERT INTO permisos_usuario (usuario_id, page_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT 
    (SELECT id FROM usuarios WHERE username = 'milla7'),
    id,
    TRUE, TRUE, TRUE, TRUE
FROM pages;

-- Verificación
SELECT nombre, ruta FROM pages ORDER BY orden;
