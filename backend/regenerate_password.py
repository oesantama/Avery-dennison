#!/usr/bin/env python3
"""Script para regenerar el hash de contraseña del usuario admin"""
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Generar nuevo hash para admin123
password = "admin123"
new_hash = pwd_context.hash(password)

print("=" * 60)
print("Nuevo hash para la contraseña 'admin123':")
print("=" * 60)
print(new_hash)
print("=" * 60)
print("\nSQL para actualizar la base de datos:")
print("=" * 60)
print(f"UPDATE usuarios SET password_hash = '{new_hash}' WHERE username = 'admin';")
print("=" * 60)
