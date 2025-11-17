# Cómo Arreglar el Error de Base de Datos

## El Problema

Ves este error:
```
ERROR: column usuarios.fecha_creacion does not exist
```

Esto ocurre porque la base de datos tiene columnas con nombres antiguos (`created_at`, `updated_at`) pero el código espera nombres nuevos (`fecha_creacion`, `fecha_actualizacion`).

## Solución Rápida

Ejecuta estos comandos:

```bash
# 1. Asegúrate de que Docker esté corriendo
docker-compose up -d

# 2. Ejecuta el script de corrección (opción A - usando Python en tu máquina)
python3 fix_database.py

# O (opción B - ejecuta directamente en el contenedor de la base de datos)
docker exec -i vehiculos-db psql -U postgres -d vehiculos_operacion < database/fix_usuarios_columns.sql
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
