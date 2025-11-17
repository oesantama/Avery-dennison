#!/bin/bash

# Script para arreglar el error de columnas faltantes en la tabla usuarios
# Este script ejecuta la migración necesaria para sincronizar el esquema de la base de datos

echo "================================================"
echo "Arreglando estructura de la tabla usuarios"
echo "================================================"
echo ""
echo "Este script agregará las columnas faltantes:"
echo "  - fecha_creacion"
echo "  - fecha_actualizacion"
echo "  - email, numero_celular, rol_id, creado_por (si no existen)"
echo ""
echo "Ejecutando migración..."
echo ""

# Obtener el nombre del contenedor de PostgreSQL
CONTAINER_NAME="vehiculos-db"

# Verificar si el contenedor está corriendo
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo "❌ Error: El contenedor $CONTAINER_NAME no está corriendo"
    echo "   Por favor, ejecuta: docker-compose up -d db"
    exit 1
fi

# Ejecutar el script SQL
docker exec -i $CONTAINER_NAME psql -U postgres -d vehiculos_operacion < database/fix_usuarios_columns.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "================================================"
    echo "✅ Migración completada exitosamente"
    echo "================================================"
    echo ""
    echo "Ahora puedes probar el login nuevamente:"
    echo "  Usuario: admin"
    echo "  Contraseña: admin123"
    echo ""
    echo "Si el backend está corriendo, deberías reiniciarlo para que tome los cambios:"
    echo "  docker-compose restart backend"
else
    echo ""
    echo "================================================"
    echo "❌ Error al ejecutar la migración"
    echo "================================================"
    echo ""
    echo "Por favor, verifica los logs arriba para más detalles"
    exit 1
fi
