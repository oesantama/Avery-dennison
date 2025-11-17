# Cómo Arreglar la Base de Datos

## Problemas que Este Documento Resuelve

1. **Error**: `column usuarios.fecha_creacion does not exist`
   - La base de datos tiene columnas con nombres antiguos (`created_at`, `updated_at`)
   - El código espera nombres nuevos (`fecha_creacion`, `fecha_actualizacion`)

2. **Falta tabla de vehículos**
   - El módulo de gestión de vehículos requiere una tabla `vehiculos` que no existe
   - Necesaria para registrar y administrar la flota de vehículos

## Solución Rápida

Ejecuta estos comandos en orden:

```bash
# 1. Asegúrate de que Docker esté corriendo
docker-compose up -d

# 2. Arreglar la tabla de usuarios
python3 fix_database.py
# O directamente en el contenedor:
docker exec -i vehiculos-db psql -U postgres -d vehiculos_operacion < database/fix_usuarios_columns.sql

# 3. Crear la tabla de vehículos (NUEVO)
docker exec -i vehiculos-db psql -U postgres -d vehiculos_operacion < database/crear_tabla_vehiculos.sql
```

## Después de la Corrección

1. Reinicia el backend:
   ```bash
   docker-compose restart backend
   ```

2. Recarga la página en el navegador

3. Intenta hacer login nuevamente

## ¿Cómo evitar esto en el futuro?

Si necesitas borrar completamente la base de datos y empezar de cero:

```bash
# ADVERTENCIA: Esto borrará TODOS los datos
docker-compose down -v
docker-compose up -d
```

Esto eliminará el volumen de datos y creará la base de datos desde cero con el schema correcto.
