#!/bin/bash
# Script para generar hash de contraseña correcto usando el contenedor Docker

echo "Generando hash para 'admin123'..."
docker exec vehiculos-backend python3 -c "from passlib.context import CryptContext; pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto'); print(pwd_context.hash('admin123'))"
