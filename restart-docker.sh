#!/bin/bash

echo "🔄 Reiniciando servicios Docker..."

# Detener contenedores
echo "🛑 Deteniendo contenedores..."
docker-compose down

# Reconstruir el frontend para incluir cambios
echo "🏗️  Reconstruyendo frontend con nuevo API URL..."
docker-compose build frontend

# Iniciar servicios
echo "🚀 Iniciando servicios..."
docker-compose up -d

# Mostrar logs
echo "📋 Mostrando logs (Ctrl+C para salir)..."
docker-compose logs -f
