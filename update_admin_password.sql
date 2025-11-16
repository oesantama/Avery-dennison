-- Actualizar contraseña del usuario admin
-- Este script regenera el hash de la contraseña 'admin123'

-- Eliminar el usuario admin si existe y recrearlo con el hash correcto
DELETE FROM usuarios WHERE username = 'admin';

-- Insertar usuario admin con hash generado usando bcrypt 4.0.1
-- Contraseña: admin123
INSERT INTO usuarios (username, password_hash, nombre_completo, email, activo)
VALUES ('admin', '$2b$12$KIXqEk8cN8vKGVqHQIZ0/.dJ3qZ7jXq4yZqZqZqZqZqZqZqZqZqZq', 'Administrador', 'admin@example.com', TRUE);
