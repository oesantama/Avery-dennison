#!/bin/bash

echo "🔍 Diagnóstico y Reinicio del Backend"
echo "======================================"
echo ""

# Verificar si Docker está corriendo
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker no está corriendo. Por favor inicia Docker primero."
    exit 1
fi

echo "1️⃣ Verificando estado actual..."
docker-compose ps

echo ""
echo "2️⃣ Verificando logs del backend (últimas 20 líneas)..."
echo "======================================================"
docker-compose logs --tail=20 backend

echo ""
echo "3️⃣ ¿Deseas reiniciar el backend? (s/n)"
read -r respuesta

if [ "$respuesta" = "s" ] || [ "$respuesta" = "S" ]; then
    echo ""
    echo "🔄 Reiniciando backend..."
    docker-compose restart backend

    echo ""
    echo "⏳ Esperando 5 segundos..."
    sleep 5

    echo ""
    echo "📋 Verificando logs del backend reiniciado..."
    echo "=============================================="
    docker-compose logs --tail=30 backend

    echo ""
    echo "✅ Backend reiniciado."
    echo ""
    echo "🔗 Puedes verificar el backend en: http://localhost:3035/docs"
    echo "🔗 Frontend en: http://localhost:8035"
else
    echo ""
    echo "ℹ️  No se reinició el backend."
fi

echo ""
echo "💡 Si el error persiste, revisa los logs completos con:"
echo "   docker-compose logs -f backend"
