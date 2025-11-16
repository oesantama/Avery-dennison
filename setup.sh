#!/bin/bash
# Script de Setup para Linux/Mac

echo "========================================"
echo "  Setup Avery-Dennison Docker"
echo "========================================"
echo ""

# Paso 1: Detener todo
echo "[1/4] Deteniendo contenedores..."
docker-compose down -v
docker-compose -f docker-compose.dev.yml down -v

# Paso 2: Limpiar imágenes viejas
echo "[2/4] Limpiando imágenes viejas..."
docker rmi avery-dennison-backend avery-dennison-frontend -f 2>/dev/null

# Paso 3: Reconstruir todo sin caché
echo "[3/4] Reconstruyendo todo sin caché (esto tomará unos minutos)..."
docker-compose -f docker-compose.dev.yml build --no-cache

# Paso 4: Iniciar servicios
echo "[4/4] Iniciando servicios..."
docker-compose -f docker-compose.dev.yml up -d

echo ""
echo "========================================"
echo "  Setup Completado!"
echo "========================================"
echo ""
echo "Esperando que los servicios estén listos..."
sleep 10

echo ""
echo "Accede a la aplicación:"
echo "  URL: http://localhost:8035"
echo ""
echo "Credenciales de login:"
echo "  Usuario: admin"
echo "  Contraseña: admin123"
echo ""
echo "Ver logs en tiempo real:"
echo "  docker-compose -f docker-compose.dev.yml logs -f"
echo ""
