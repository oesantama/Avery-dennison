#!/bin/bash
# Script de corrección rápida para aplicar RBAC

echo "======================================================"
echo "  CORRECCIÓN RÁPIDA: Aplicando columnas RBAC"
echo "======================================================"

echo ""
echo "Paso 1: Aplicando schema RBAC completo..."
docker cp database/schema_rbac.sql vehiculos-db:/tmp/
docker exec vehiculos-db psql -U postgres -d vehiculos_operacion -f /tmp/schema_rbac.sql 2>&1 | grep -v "already exists"

echo ""
echo "Paso 2: Corrigiendo tabla usuarios..."
docker cp database/fix_usuarios_rbac.sql vehiculos-db:/tmp/
docker exec vehiculos-db psql -U postgres -d vehiculos_operacion -f /tmp/fix_usuarios_rbac.sql

echo ""
echo "Paso 3: Reiniciando backend..."
docker-compose -f docker-compose.dev.yml restart backend

echo ""
echo "======================================================"
echo "  ✓ Corrección aplicada"
echo "======================================================"
echo ""
echo "Verifica que funcione con:"
echo "  docker exec vehiculos-db psql -U postgres -d vehiculos_operacion -c \"SELECT username, email, rol_id FROM usuarios WHERE username='admin';\""
