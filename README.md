# Sistema de Gestión de Vehículos y Entregas

> Plataforma completa para planear operaciones diarias, asignar vehículos y registrar entregas con evidencia fotográfica.

> 📘 ¿Necesitas un checklist corto de qué hacer en tu laptop vs en el servidor? Revisa `docs/local-vs-server-playbook.md`.

## 🧱 Stack tecnológico

- **Frontend**: Next.js 14 (React 18, TypeScript, Tailwind CSS, Axios)
- **Backend**: FastAPI + SQLAlchemy + PostgreSQL
- **Autenticación**: JWT con contraseñas hasheadas en bcrypt
- **Infraestructura productiva**: PostgreSQL 15 nativo en Windows Server + backend/frontend en contenedores Windows sobre Docker Engine

## 📂 Estructura principal

```
.
├── backend/                    # API FastAPI
├── frontend/                   # SPA Next.js
├── database/                   # Scripts SQL
├── docker-compose.hybrid.yml   # Producción (PostgreSQL host + contenedores Windows)
├── docker-compose*.yml         # Escenarios locales (dev / default)
├── configure-network-simple.ps1# Ajusta DATABASE_URL con la IP del servidor
├── scripts/                    # Automatizaciones (PostgreSQL + helpers)
├── setup-iis.ps1               # IIS + archivos de redirección en C:\M7Aplicaciones\Avery
├── start-avery.bat             # Helper para pull/build/up/logs en producción
├── index.html / web.config     # Redirección HTML usada por IIS
└── README.md                   # Este documento
```

## 🚧 Desarrollo local

1. **Requisitos**: Docker Desktop (Linux containers), Node 18, Python 3.11.
2. **Todo en Docker**:
   ```powershell
   docker-compose -f docker-compose.dev.yml up -d --build
   ```
3. **Servicios individuales**:
   - Backend: `cd backend && uvicorn main:app --reload --port 3035`
   - Frontend: `cd frontend && npm install && npm run dev -- -p 8035`
4. **Credenciales demo**: `admin / admin123`.

## 🚀 Producción (Windows Server en operación)

Características actuales:

- PostgreSQL 15 instalado directamente (servicio `postgresql-x64-15` en puerto 5432).
- Docker Engine 29+ en modo **Windows containers**.
- Código en `C:\M7Aplicaciones\Avery\Avery-dennison`.
- DNS apunta a `C:\M7Aplicaciones\Avery`, donde IIS sirve `index.html` y `web.config` para redirigir a `http://avery.millasiete.com:8036`.

### Flujo para publicar una actualización

> ⚡ Para hacerlo en un solo comando usa `powershell -ExecutionPolicy Bypass -File .\scripts\refresh-hybrid-stack.ps1 -HostIp <IP-estable>` y luego salta a la verificación. El script ejecuta down/build/up, recrea los `portproxy` y corre health checks. El paso a paso completo está en `docs/guia-despliegue-hibrido.md`.

1. **Actualizar código**

   ```powershell
   cd C:\M7Aplicaciones\Avery\Avery-dennison
   git pull origin main
   ```

2. **(Una sola vez) Permitir conexiones desde Docker**

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\enable-postgres-docker.ps1
   ```

   - Ajusta `listen_addresses`, `pg_hba.conf` (método `scram-sha-256`) y el firewall para la subred `172.16.0.0/12` (todas las redes NAT que usa Docker en Windows).
   - Repite sólo si reinstalas PostgreSQL o cambias el puerto.

3. **Configurar conexión a PostgreSQL para los contenedores**

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\configure-network-simple.ps1
   ```

   - Usa la **opción 2** (IP detectada) y responde **S** para que el script ejecute `down`, `build` y `up -d`.
   - Manual (si prefieres):
     ```powershell
     docker-compose -f docker-compose.hybrid.yml down
     docker-compose -f docker-compose.hybrid.yml build --no-cache
     docker-compose -f docker-compose.hybrid.yml up -d
     ```

4. **Verificar servicios**

   ```powershell
   docker-compose -f docker-compose.hybrid.yml ps
   docker-compose -f docker-compose.hybrid.yml logs backend
   docker-compose -f docker-compose.hybrid.yml logs frontend
   ```

   - Frontend: `http://avery.millasiete.com:8036`
   - Backend docs: `http://avery.millasiete.com:3035/docs`

5. **Redirección vía IIS**

   - Manual: copiar `index.html` y `web.config` a `C:\M7Aplicaciones\Avery`.
   - Automática: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` y `.\setup-iis.ps1` (instala IIS, crea el sitio y copia los archivos).

6. **Helper opcional**
   - `start-avery.bat` (en `C:\M7Aplicaciones\Avery`) realiza pull → down → build → up → logs.

## 🔄 Operaciones habituales

| Acción             | Comando                                                        |
| ------------------ | -------------------------------------------------------------- |
| Ver estado rápido  | `docker-compose -f docker-compose.hybrid.yml ps`               |
| Logs en vivo       | `docker-compose -f docker-compose.hybrid.yml logs -f`          |
| Reiniciar frontend | `docker-compose -f docker-compose.hybrid.yml restart frontend` |
| Reiniciar backend  | `docker-compose -f docker-compose.hybrid.yml restart backend`  |

## 🔐 Credenciales iniciales

```
Usuario: admin
Contraseña: admin123
```

> Cambiar en **Configuración → Usuarios** después del primer acceso.

## 🛠️ Notas técnicas

- El frontend detecta el host actual y sólo usa `NEXT_PUBLIC_API_URL` cuando apunta a un dominio real (ignora valores `localhost`).
- El backend admite orígenes adicionales con `ALLOWED_ORIGINS` (lista separada por comas).
- Las evidencias se guardan en el volumen `backend_uploads` (ruta `/uploads`).

## 📞 Soporte

- Reporta incidencias adjuntando `docker-compose -f docker-compose.hybrid.yml logs --tail=200`.
- Contacta al equipo de desarrollo para cambios mayores en infraestructura.

---

Sistema de uso interno. Mantén el repositorio al día y sigue este flujo para cualquier actualización en producción.
