# 🚀 Guía de Despliegue - Sistema de Gestión de Vehículos

## Deployment en Windows Server con Docker

---

## 🎯 **DEPLOYMENT RÁPIDO (RECOMENDADO)**

### ⚡ Script Automático - Un Solo Comando

Si solo tienes **Docker Desktop instalado**, puedes desplegar todo el sistema automáticamente:

```powershell
# 1. Descarga el script
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/oesantama/Avery-dennison/main/deploy-automatico.ps1" -OutFile "deploy-automatico.ps1"

# 2. Ejecuta como Administrador
powershell -ExecutionPolicy Bypass -File .\deploy-automatico.ps1
```

**El script hará automáticamente:**

- ✅ Instalar Git (si no está instalado)
- ✅ Clonar el proyecto desde GitHub
- ✅ Configurar el firewall
- ✅ Crear variables de entorno
- ✅ Construir las imágenes Docker
- ✅ Iniciar todos los servicios
- ✅ Verificar que todo esté funcionando

**Tiempo estimado:** 10-15 minutos

> **Nota:** Si el script automático falla o prefieres hacerlo manualmente, continúa con la guía paso a paso.

---

## 📋 **TABLA DE CONTENIDOS - INSTALACIÓN MANUAL**

1. [Requisitos Previos](#requisitos-previos)
2. [Instalación de Docker Desktop](#instalación-de-docker-desktop)
3. [Preparación del Servidor](#preparación-del-servidor)
4. [Descarga del Proyecto](#descarga-del-proyecto)
5. [Configuración de Variables](#configuración-de-variables)
6. [Construcción y Despliegue](#construcción-y-despliegue)
7. [Verificación del Sistema](#verificación-del-sistema)
8. [Acceso al Sistema](#acceso-al-sistema)
9. [Comandos Útiles](#comandos-útiles)
10. [Solución de Problemas](#solución-de-problemas)
11. [Mantenimiento](#mantenimiento)

---

## 📖 **GUÍA DE INSTALACIÓN MANUAL**

---

## ✅ **REQUISITOS PREVIOS**

### Hardware Mínimo Recomendado:

- **CPU:** 4 cores
- **RAM:** 8 GB (mínimo 4 GB disponibles para Docker)
- **Disco:** 50 GB libres
- **Sistema Operativo:** Windows Server 2019/2022 o Windows 10/11 Pro

### Software Necesario:

- ✅ Windows Server actualizado
- ✅ Privilegios de Administrador
- ✅ Conexión a Internet
- ✅ Git (opcional, pero recomendado)

---

## 📦 **INSTALACIÓN DE DOCKER DESKTOP**

### Paso 1: Descargar Docker Desktop

1. Abra su navegador web
2. Vaya a: https://www.docker.com/products/docker-desktop
3. Haga clic en **"Download for Windows"**
4. Espere a que termine la descarga (~500 MB)

### Paso 2: Instalar Docker Desktop

1. Ejecute el instalador descargado: `Docker Desktop Installer.exe`
2. **Importante:** Durante la instalación, asegúrese de marcar:
   - ✅ "Use WSL 2 instead of Hyper-V" (recomendado)
   - ✅ "Add shortcut to desktop"
3. Haga clic en **"Ok"**
4. Espere a que termine la instalación (5-10 minutos)
5. Cuando termine, haga clic en **"Close and restart"**
6. El sistema se reiniciará automáticamente

### Paso 3: Verificar Instalación

1. Después del reinicio, busque **"Docker Desktop"** en el menú inicio
2. Ejecútelo como **Administrador**
3. Acepte los términos de servicio si aparecen
4. Espere a que Docker Desktop inicie completamente (verá el ícono en la bandeja del sistema)
5. Abra **PowerShell como Administrador**
6. Ejecute estos comandos para verificar:

```powershell
docker --version
# Debería mostrar algo como: Docker version 24.x.x

docker-compose --version
# Debería mostrar algo como: Docker Compose version v2.x.x

docker ps
# Debería mostrar una lista vacía (sin errores)
```

✅ **Si todos los comandos funcionan, Docker está instalado correctamente**

---

## 🖥️ **PREPARACIÓN DEL SERVIDOR**

### Paso 1: Crear Carpeta del Proyecto

```powershell
# Abrir PowerShell como Administrador
# Crear carpeta para el proyecto
cd C:\
mkdir Proyectos
cd Proyectos
```

### Paso 2: Configurar Firewall (Importante)

```powershell
# Permitir puertos necesarios
New-NetFirewallRule -DisplayName "Docker Frontend" -Direction Inbound -LocalPort 8035 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Docker Backend" -Direction Inbound -LocalPort 3035 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "PostgreSQL" -Direction Inbound -LocalPort 5432 -Protocol TCP -Action Allow

Write-Host "✅ Reglas de firewall creadas correctamente" -ForegroundColor Green
```

---

## 📥 **DESCARGA DEL PROYECTO**

### Opción A: Con Git (Recomendado)

1. **Instalar Git:**

   - Descargar de: https://git-scm.com/download/win
   - Ejecutar instalador con opciones por defecto
   - Reiniciar PowerShell

2. **Clonar Repositorio:**

```powershell
cd C:\Proyectos
git clone https://github.com/oesantama/Avery-dennison.git
cd Avery-dennison

Write-Host "✅ Proyecto descargado correctamente" -ForegroundColor Green
```

### Opción B: Sin Git (Manual)

1. Descargue el ZIP del repositorio desde GitHub
2. Extraiga el contenido en `C:\Proyectos\Avery-dennison`
3. Abra PowerShell y navegue:

```powershell
cd C:\Proyectos\Avery-dennison
```

---

## ⚙️ **CONFIGURACIÓN DE VARIABLES**

### Paso 1: Crear Archivo .env para Backend

```powershell
# Crear archivo .env en la carpeta backend
cd C:\Proyectos\Avery-dennison\backend
New-Item -Path .env -ItemType File -Force

# Editar con Notepad
notepad .env
```

**Copie y pegue este contenido en el archivo .env:**

```env
# Base de Datos PostgreSQL
POSTGRES_USER=vehiculos_user
POSTGRES_PASSWORD=vehiculos_password_2024_SECURE!
POSTGRES_DB=vehiculos_db
DATABASE_URL=postgresql://vehiculos_user:vehiculos_password_2024_SECURE!@vehiculos-db:5432/vehiculos_db

# JWT Seguridad
SECRET_KEY=tu_clave_secreta_super_segura_cambiar_en_produccion_2024
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Configuración de la aplicación
ENVIRONMENT=production
DEBUG=False

# CORS (ajustar según su dominio)
ALLOWED_ORIGINS=http://localhost:8035,http://servidor:8035
```

**⚠️ IMPORTANTE:**

- Cambie `tu_clave_secreta_super_segura_cambiar_en_produccion_2024` por una clave única
- Si tiene un dominio, agregue `http://sudominio.com` a `ALLOWED_ORIGINS`
- Guarde y cierre Notepad

### Paso 2: Verificar docker-compose.yml

```powershell
cd C:\Proyectos\Avery-dennison
notepad docker-compose.yml
```

Verifique que tenga este contenido:

```yaml
version: '3.8'

services:
  vehiculos-db:
    image: postgres:15-alpine
    container_name: vehiculos-db
    environment:
      POSTGRES_USER: vehiculos_user
      POSTGRES_PASSWORD: vehiculos_password_2024_SECURE!
      POSTGRES_DB: vehiculos_db
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U vehiculos_user']
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - vehiculos-network

  vehiculos-backend:
    build: ./backend
    container_name: vehiculos-backend
    ports:
      - '3035:3035'
    environment:
      DATABASE_URL: postgresql://vehiculos_user:vehiculos_password_2024_SECURE!@vehiculos-db:5432/vehiculos_db
      SECRET_KEY: tu_clave_secreta_super_segura_cambiar_en_produccion_2024
      ENVIRONMENT: production
    depends_on:
      vehiculos-db:
        condition: service_healthy
    volumes:
      - ./backend:/app
      - /app/__pycache__
    restart: unless-stopped
    networks:
      - vehiculos-network

  vehiculos-frontend:
    build: ./frontend
    container_name: vehiculos-frontend
    ports:
      - '8035:3000'
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3035/api
    depends_on:
      - vehiculos-backend
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    restart: unless-stopped
    networks:
      - vehiculos-network

volumes:
  postgres_data:
    driver: local

networks:
  vehiculos-network:
    driver: bridge
```

---

## 🚀 **CONSTRUCCIÓN Y DESPLIEGUE**

### Paso 1: Construir las Imágenes Docker

```powershell
# Asegurarse de estar en la carpeta del proyecto
cd C:\Proyectos\Avery-dennison

# Construir las imágenes (puede tardar 10-15 minutos la primera vez)
docker-compose build --no-cache

Write-Host "⏳ Construyendo imágenes Docker... Por favor espere" -ForegroundColor Yellow
```

**⏱️ Este proceso puede tardar:**

- Backend: 3-5 minutos
- Frontend: 5-10 minutos
- Total: 10-15 minutos aproximadamente

### Paso 2: Iniciar los Contenedores

```powershell
# Iniciar todos los servicios
docker-compose up -d

Write-Host "🚀 Iniciando servicios..." -ForegroundColor Cyan
Start-Sleep -Seconds 10
```

### Paso 3: Verificar que Todos los Servicios Estén Corriendo

```powershell
# Ver estado de los contenedores
docker-compose ps

# Debería mostrar algo como:
# NAME                 STATUS              PORTS
# vehiculos-backend    Up 30 seconds      0.0.0.0:3035->3035/tcp
# vehiculos-db         Up 30 seconds      0.0.0.0:5432->5432/tcp
# vehiculos-frontend   Up 30 seconds      0.0.0.0:8035->3000/tcp
```

✅ **Si todos muestran "Up", el sistema está corriendo correctamente**

---

## ✔️ **VERIFICACIÓN DEL SISTEMA**

### Paso 1: Ver Logs de los Servicios

```powershell
# Ver logs de todos los servicios
docker-compose logs -f

# Para salir, presione Ctrl + C
```

### Paso 2: Verificar Backend

```powershell
# Probar endpoint de salud del backend
Invoke-WebRequest -Uri http://localhost:3035/health -UseBasicParsing

# Debería retornar: {"status":"healthy"}
```

### Paso 3: Verificar Base de Datos

```powershell
# Conectarse a la base de datos
docker exec -it vehiculos-db psql -U vehiculos_user -d vehiculos_db

# Dentro de PostgreSQL, ejecutar:
\dt
# Debería mostrar todas las tablas creadas

# Para salir:
\q
```

---

## 🌐 **ACCESO AL SISTEMA**

### Desde el Servidor Local

```
URL: http://localhost:8035
```

### Desde Otros Computadores en la Red

```
URL: http://IP_DEL_SERVIDOR:8035

Ejemplo: http://192.168.1.100:8035
```

### Credenciales Iniciales

```
Usuario: admin
Contraseña: admin123
```

⚠️ **IMPORTANTE:** Cambie la contraseña inmediatamente después del primer inicio de sesión

### Para Encontrar la IP del Servidor

```powershell
# En PowerShell del servidor
ipconfig

# Busque la línea "Dirección IPv4" bajo su adaptador de red
# Ejemplo: 192.168.1.100
```

---

## 🛠️ **COMANDOS ÚTILES**

### Ver Estado de Contenedores

```powershell
docker ps
docker-compose ps
```

### Ver Logs

```powershell
# Logs de todos los servicios
docker-compose logs -f

# Logs de un servicio específico
docker-compose logs -f vehiculos-backend
docker-compose logs -f vehiculos-frontend
docker-compose logs -f vehiculos-db
```

### Detener el Sistema

```powershell
cd C:\Proyectos\Avery-dennison
docker-compose stop
```

### Iniciar el Sistema

```powershell
cd C:\Proyectos\Avery-dennison
docker-compose start
```

### Reiniciar el Sistema

```powershell
cd C:\Proyectos\Avery-dennison
docker-compose restart
```

### Detener y Eliminar Contenedores (Sin Borrar Datos)

```powershell
docker-compose down
```

### Detener y Eliminar TODO (Incluye Datos)

```powershell
docker-compose down -v
```

### Reconstruir Después de Cambios

```powershell
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 🚨 **SOLUCIÓN DE PROBLEMAS**

### Problema 1: "Cannot connect to the Docker daemon"

**Solución:**

```powershell
# 1. Abrir Docker Desktop
# 2. Esperar a que inicie completamente
# 3. Verificar que el ícono esté en la bandeja del sistema
# 4. Intentar de nuevo
```

### Problema 2: Puerto 8035 o 3035 ya está en uso

**Solución:**

```powershell
# Ver qué proceso está usando el puerto
netstat -ano | findstr :8035
netstat -ano | findstr :3035

# Detener el proceso (reemplazar PID con el número mostrado)
taskkill /PID <número_pid> /F

# O cambiar los puertos en docker-compose.yml
```

### Problema 3: Error "dial tcp: lookup vehiculos-db"

**Solución:**

```powershell
# Reiniciar red de Docker
docker network prune -f
docker-compose down
docker-compose up -d
```

### Problema 4: Frontend no carga

**Solución:**

```powershell
# Reconstruir solo el frontend
docker-compose stop vehiculos-frontend
docker-compose build --no-cache vehiculos-frontend
docker-compose up -d vehiculos-frontend
```

### Problema 5: Error de Base de Datos

**Solución:**

```powershell
# Ver logs de la base de datos
docker-compose logs vehiculos-db

# Si es necesario, resetear la base de datos
docker-compose down -v
docker-compose up -d
```

---

## 🔧 **MANTENIMIENTO**

### Backup de la Base de Datos

```powershell
# Crear backup
docker exec vehiculos-db pg_dump -U vehiculos_user vehiculos_db > backup_$(Get-Date -Format "yyyyMMdd_HHmmss").sql

Write-Host "✅ Backup creado correctamente" -ForegroundColor Green
```

### Restaurar Base de Datos

```powershell
# Restaurar desde backup
Get-Content backup_20251118_120000.sql | docker exec -i vehiculos-db psql -U vehiculos_user vehiculos_db

Write-Host "✅ Base de datos restaurada" -ForegroundColor Green
```

### Ver Uso de Recursos

```powershell
docker stats
```

### Limpiar Imágenes Antiguas

```powershell
docker system prune -a
```

### Actualizar el Sistema

```powershell
# 1. Hacer backup de la base de datos (ver arriba)

# 2. Detener servicios
docker-compose down

# 3. Actualizar código (si usa Git)
git pull

# 4. Reconstruir
docker-compose build --no-cache

# 5. Iniciar
docker-compose up -d

Write-Host "✅ Sistema actualizado" -ForegroundColor Green
```

---

## 📞 **CONTACTO Y SOPORTE**

Para problemas o preguntas:

- **Repositorio:** https://github.com/oesantama/Avery-dennison
- **Issues:** https://github.com/oesantama/Avery-dennison/issues

---

## 🌐 **CONFIGURACIÓN DEL DOMINIO**

### Acceso por Dominio sin Certificado SSL

El sistema está configurado para trabajar con el dominio `http://avery.millasiete.com:8035` usando **HTTP** (sin HTTPS).

### Requisitos para el Dominio:

1. **Configurar DNS:**

   - El dominio `avery.millasiete.com` debe apuntar a la IP del servidor
   - Registro tipo A: `avery.millasiete.com` → `IP_DEL_SERVIDOR`

2. **Puertos Necesarios:**
   - Puerto 8035 (Frontend)
   - Puerto 3035 (Backend API)

### Verificar Configuración DNS:

```powershell
# Verificar resolución DNS
nslookup avery.millasiete.com

# Debe mostrar la IP de tu servidor
# Si no resuelve, contacta al administrador de DNS
```

### Opciones de Acceso:

El script automático preguntará cómo accederán al sistema:

| Opción        | URL                                | Uso                                                    |
| ------------- | ---------------------------------- | ------------------------------------------------------ |
| **Dominio**   | `http://avery.millasiete.com:8035` | Recomendado para producción (requiere DNS configurado) |
| **IP Local**  | `http://192.168.x.x:8035`          | Para red interna                                       |
| **Localhost** | `http://localhost:8035`            | Solo desde el servidor                                 |

### ⚠️ Nota Sobre HTTP vs HTTPS:

- El sistema actualmente trabaja con **HTTP** (sin cifrado)
- No se requiere certificado SSL por ahora
- Para agregar HTTPS en el futuro:
  1. Obtener certificado SSL (Let's Encrypt, certificado comercial)
  2. Configurar reverse proxy (nginx/IIS)
  3. Actualizar URLs en `.env`

### Actualizar Variables de Entorno:

Si necesitas cambiar el dominio después del deployment:

```powershell
# Editar .env
notepad .env

# Cambiar:
# NEXT_PUBLIC_API_URL=http://avery.millasiete.com:3035
# FRONTEND_URL=http://avery.millasiete.com:8035
# BACKEND_URL=http://avery.millasiete.com:3035

# Reiniciar servicios
docker-compose restart
```

---

## 📝 **NOTAS IMPORTANTES**

1. ✅ **Backups regulares:** Realice backups diarios de la base de datos
2. ✅ **Monitoreo:** Revise los logs periódicamente
3. ✅ **Seguridad:** Cambie todas las contraseñas por defecto
4. ✅ **Actualizaciones:** Mantenga Docker Desktop actualizado
5. ✅ **Firewall:** Asegúrese de que los puertos estén abiertos correctamente
6. ✅ **DNS:** Verifique que el dominio apunte correctamente al servidor
7. ⚠️ **HTTP:** El sistema trabaja sin certificado SSL (HTTP en lugar de HTTPS)
8. ✅ **Dominio:** Configure `avery.millasiete.com` en su DNS para acceso por dominio

---

## ✨ **¡LISTO!**

Su sistema debería estar funcionando correctamente en:

- **Dominio:** http://avery.millasiete.com:8035
- **Frontend Local:** http://localhost:8035
- **Backend API:** http://avery.millasiete.com:3035
- **Usuario:** admin / admin123

**🎉 ¡Felicitaciones! El sistema está desplegado correctamente.**
