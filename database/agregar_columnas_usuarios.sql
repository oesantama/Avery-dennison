-- SIMPLE: Solo agregar las columnas que faltan en usuarios

-- Agregar columnas nuevas
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS numero_celular VARCHAR(20);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol_id INTEGER;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS creado_por INTEGER;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Actualizar el admin con email
UPDATE usuarios SET email = 'admin@sistema.local' WHERE username = 'admin' AND email IS NULL;

-- Verificar
SELECT id, username, email, numero_celular, rol_id FROM usuarios WHERE username = 'admin';
