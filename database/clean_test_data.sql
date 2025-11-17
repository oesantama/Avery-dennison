-- Script para limpiar datos de prueba del sistema
-- Ejecutar este script para eliminar datos de prueba y mantener solo el usuario admin

-- ADVERTENCIA: Este script elimina TODOS los datos excepto el usuario admin
-- Úsalo solo si estás seguro de que quieres limpiar la base de datos

BEGIN;

-- Eliminar fotos de evidencia
DELETE FROM fotos_evidencia;

-- Eliminar entregas
DELETE FROM entregas;

-- Eliminar vehículos de operación
DELETE FROM vehiculos_operacion;

-- Eliminar operaciones diarias
DELETE FROM operaciones_diarias;

-- Eliminar usuarios excepto admin
DELETE FROM usuarios WHERE username != 'admin';

-- Resetear secuencias auto-increment
SELECT setval('fotos_evidencia_id_seq', 1, false);
SELECT setval('entregas_id_seq', 1, false);
SELECT setval('vehiculos_operacion_id_seq', 1, false);
SELECT setval('operaciones_diarias_id_seq', 1, false);
SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios), true);

-- Verificar limpieza
SELECT 'Usuarios' as tabla, COUNT(*) as registros FROM usuarios
UNION ALL
SELECT 'Operaciones Diarias', COUNT(*) FROM operaciones_diarias
UNION ALL
SELECT 'Vehículos Operación', COUNT(*) FROM vehiculos_operacion
UNION ALL
SELECT 'Entregas', COUNT(*) FROM entregas
UNION ALL
SELECT 'Fotos Evidencia', COUNT(*) FROM fotos_evidencia;

COMMIT;

-- Para ejecutar este script:
-- docker exec -it vehiculos-db psql -U postgres -d vehiculos_operacion -f /tmp/clean_test_data.sql
