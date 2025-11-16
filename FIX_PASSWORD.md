# Fix para el Problema de Contraseña

## Problema
El hash de contraseña en la base de datos no coincide con `admin123` debido a incompatibilidades de versión de bcrypt.

## Solución Rápida

Ejecuta este comando desde PowerShell para regenerar la contraseña del usuario admin:

```powershell
docker exec vehiculos-backend python3 -c "from passlib.context import CryptContext; pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto'); new_hash = pwd_context.hash('admin123'); print(f'UPDATE usuarios SET password_hash = ''{new_hash}'' WHERE username = ''admin'';')"
```

Luego copia el comando SQL que genera y ejecútalo en la base de datos:

```powershell
docker exec -it vehiculos-db psql -U postgres -d vehiculos_operacion
```

Y pega el comando UPDATE que obtuviste del paso anterior.

## Solución Automática

Ejecuta el script de setup de nuevo, que recreará toda la base de datos con el hash correcto:

```powershell
.\setup.ps1
```

Esto eliminará todos los datos existentes y creará todo desde cero con las configuraciones correctas.

## Verificar que Funcionó

Después de ejecutar cualquiera de las soluciones anteriores:

1. Abre `http://localhost:8035`
2. Ingresa:
   - Usuario: `admin`
   - Contraseña: `admin123`
3. Deberías poder entrar al dashboard

## Si Nada Funciona

Contacta al equipo de desarrollo con los logs del backend:

```powershell
docker-compose -f docker-compose.dev.yml logs backend
```
