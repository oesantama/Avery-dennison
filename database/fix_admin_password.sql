-- Script para corregir la contraseña del usuario admin en una base de datos existente
-- Ejecutar este script si ya tienes la base de datos creada y solo necesitas actualizar la contraseña

-- Actualizar el hash de la contraseña del usuario admin
-- Nueva contraseña: admin123
UPDATE usuarios 
SET password_hash = '$2b$12$u3tRVni5FerUJ9c7NW3pau84O/kuFppCBuk/sZyP9gx0yJTfpO.Jq' 
WHERE username = 'admin';

-- Asegurar que el usuario admin esté activo
UPDATE usuarios 
SET activo = TRUE 
WHERE username = 'admin';

-- Verificar que el usuario se actualizó correctamente
SELECT id, username, nombre_completo, email, activo, created_at 
FROM usuarios 
WHERE username = 'admin';
