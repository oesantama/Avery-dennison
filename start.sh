#!/bin/bash
set -e

echo "Starting Avery Dennison Application..."

# Iniciar backend
cd /app/backend
uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} &

# Iniciar frontend
cd /app/frontend
npm start --port ${PORT:-3000}
