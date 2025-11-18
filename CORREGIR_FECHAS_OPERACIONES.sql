-- ============================================================================
-- CORRECCIÓN DE FECHAS EN OPERACIONES
-- ============================================================================
-- Este script corrige las fechas de operaciones que fueron guardadas con
-- un día de diferencia debido al problema de zona horaria
-- ============================================================================

-- 1️⃣ Ver operaciones con fechas incorrectas (un día antes de hoy)
SELECT 
    id,
    fecha_operacion,
    cantidad_vehiculos_solicitados,
    observacion,
    DATE(fecha_operacion) as fecha_date,
    CURRENT_DATE as hoy,
    CURRENT_DATE - DATE(fecha_operacion) as dias_diferencia
FROM operaciones_diarias
WHERE fecha_operacion >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY fecha_operacion DESC;

-- 2️⃣ Corregir operaciones del día anterior (que deberían ser de hoy)
-- ⚠️ REVISAR ANTES DE EJECUTAR: Solo ejecutar si las operaciones del 17/11
-- deberían ser del 18/11

-- Opción A: Corregir operaciones de ayer a hoy
UPDATE operaciones_diarias
SET fecha_operacion = CURRENT_DATE
WHERE DATE(fecha_operacion) = CURRENT_DATE - INTERVAL '1 day'
  AND observacion LIKE '%dfg%' OR observacion LIKE '%para comenzar%';
-- ⚠️ Ajustar el WHERE según tus datos

-- Opción B: Corregir TODAS las operaciones de ayer a hoy
-- DESCOMENTA SOLO SI ESTÁS SEGURO:
/*
UPDATE operaciones_diarias
SET fecha_operacion = CURRENT_DATE
WHERE DATE(fecha_operacion) = CURRENT_DATE - INTERVAL '1 day';
*/

-- 3️⃣ Verificar corrección
SELECT 
    id,
    fecha_operacion,
    cantidad_vehiculos_solicitados,
    observacion
FROM operaciones_diarias
WHERE DATE(fecha_operacion) = CURRENT_DATE
ORDER BY fecha_operacion DESC;

-- ============================================================================
-- SCRIPT ALTERNATIVO: Agregar 1 día a operaciones específicas
-- ============================================================================

-- Si conoces los IDs específicos:
/*
UPDATE operaciones_diarias
SET fecha_operacion = fecha_operacion + INTERVAL '1 day'
WHERE id IN (ID1, ID2, ID3);  -- Reemplazar con IDs reales
*/

-- ============================================================================
-- PREVENCIÓN: Verificar que el backend esté usando zona horaria Colombia
-- ============================================================================

-- Ver configuración de zona horaria del servidor PostgreSQL
SHOW timezone;

-- Ver todas las operaciones de los últimos 7 días
SELECT 
    TO_CHAR(fecha_operacion, 'YYYY-MM-DD') as fecha,
    COUNT(*) as total_operaciones,
    SUM(cantidad_vehiculos_solicitados) as total_vehiculos
FROM operaciones_diarias
WHERE fecha_operacion >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY TO_CHAR(fecha_operacion, 'YYYY-MM-DD')
ORDER BY fecha DESC;
