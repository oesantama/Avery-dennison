#!/bin/bash
# Script para aplicar el schema RBAC a la base de datos

echo "==================================================="
echo "  Aplicando Schema RBAC al Sistema"
echo "==================================================="

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo -e "${YELLOW}Paso 1: Copiando schema al contenedor...${NC}"
docker cp database/schema_rbac.sql vehiculos-db:/tmp/schema_rbac.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Schema copiado exitosamente${NC}"
else
    echo -e "${RED}✗ Error al copiar el schema${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Paso 2: Aplicando schema a la base de datos...${NC}"
docker exec -it vehiculos-db psql -U postgres -d vehiculos_operacion -f /tmp/schema_rbac.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Schema aplicado exitosamente${NC}"
else
    echo -e "${RED}✗ Error al aplicar el schema${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Paso 3: Verificando que se crearon las tablas...${NC}"
docker exec -it vehiculos-db psql -U postgres -d vehiculos_operacion -c "SELECT COUNT(*) as total_roles FROM roles;"
docker exec -it vehiculos-db psql -U postgres -d vehiculos_operacion -c "SELECT COUNT(*) as total_pages FROM pages;"
docker exec -it vehiculos-db psql -U postgres -d vehiculos_operacion -c "SELECT username, email, rol_id FROM usuarios WHERE username='admin';"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Verificación exitosa${NC}"
else
    echo -e "${RED}✗ Error en verificación${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Paso 4: Reiniciando backend...${NC}"
docker-compose -f docker-compose.dev.yml restart backend

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend reiniciado${NC}"
else
    echo -e "${RED}✗ Error al reiniciar backend${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}==================================================="
echo "  ✓ Schema RBAC aplicado correctamente"
echo "===================================================${NC}"
echo ""
echo "Puedes hacer login con:"
echo "  Usuario: admin"
echo "  Contraseña: admin123"
echo ""
echo "El sistema ahora tiene:"
echo "  - 3 roles: Administrador, Operador, Visualizador"
echo "  - 4 páginas: Dashboard, Operaciones, Entregas, Usuarios"
echo "  - Sistema completo de permisos"
