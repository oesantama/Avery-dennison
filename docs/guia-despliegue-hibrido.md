# Guía definitiva de despliegue híbrido (Docker Windows + PostgreSQL host)

Este procedimiento deja el backend y frontend arriba en el Windows Server usando Docker Engine (contenedores Windows) mientras PostgreSQL 15 sigue instalado en el host. Todo está resumido en español y hace referencia al nuevo script `scripts/refresh-hybrid-stack.ps1` que automatiza el 90 % de las tareas.

## Requisitos previos

- Iniciar PowerShell **como administrador** en el servidor.
- Código en `C:\M7Aplicaciones\Avery\Avery-dennison` sincronizado con `main`.
- Servicio `postgresql-x64-15` corriendo en el puerto 5432.
- Firewall ya ajustado con `scripts\enable-postgres-docker.ps1` (si reinstalas Postgres, vuelve a ejecutarlo una vez).

## Paso a paso recomendado

1. **Entrar al proyecto**
   ```powershell
   cd C:\M7Aplicaciones\Avery\Avery-dennison
   git pull origin main
   ```

2. **Detectar la IP estable del servidor**
   ```powershell
   Get-NetIPAddress |
     Where-Object { $_.AddressFamily -eq "IPv4" -and $_.InterfaceAlias -notmatch "vEthernet|Hyper-V|Docker|Loopback" } |
     Select-Object InterfaceAlias, IPAddress
   ```
   - Si aparece `Ethernet 6 77.93.155.134`, esa es la IP que debes usar.

3. **Ejecutar el script automático**
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\refresh-hybrid-stack.ps1 -HostIp 77.93.155.134
   ```
   El script hace lo siguiente:
   - Actualiza `docker-compose.hybrid.yml` (DATABASE_URL + extra_hosts).
   - Hace `docker-compose down`, `build --no-cache` y `up -d`.
   - Lee las IPs reales de `vehiculos-backend` y `vehiculos-frontend`.
   - Regenera las reglas `netsh interface portproxy` para los puertos 3035 y 8036.
   - Lanza pruebas rápidas (`/healthz` y frontend).

4. **Validar manualmente (por si acaso)**
   ```powershell
   docker-compose -f docker-compose.hybrid.yml ps
   netsh interface portproxy show v4tov4
   Invoke-WebRequest http://localhost:3035/healthz
   Invoke-WebRequest http://localhost:8036
   ```

5. **Verificar desde fuera del servidor**
   - `http://avery.millasiete.com:3035/docs`
   - `http://avery.millasiete.com:8036`

## Si necesitas hacerlo a mano (sin script)

| Paso | Comando clave |
| --- | --- |
| Encontrar IP física | `Get-NetIPAddress ...` |
| Editar compose | `configure-network-simple.ps1` opción 3 con la IP detectada |
| Reconstruir stack | `docker-compose -f docker-compose.hybrid.yml down && ... up -d` |
| Portproxy backend | `netsh interface portproxy add v4tov4 listenport=3035 ...` usando la IP interna del contenedor |
| Portproxy frontend | Igual pero `listenport=8036` conectando al puerto 8035 del contenedor |
| Health checks | `Invoke-WebRequest http://localhost:3035/healthz` y `http://localhost:8036` |

## Solución de problemas

1. **`Test-NetConnection` a 5432 falla** → asegurar que el servicio PostgreSQL está levantado y que `enable-postgres-docker.ps1` se ejecutó después de cualquier reinstalación.
2. **`docker-compose` lanza error HNS (0x20)** → `netsh interface portproxy show v4tov4`, borra reglas viejas, `docker network prune`, reinicia el servicio Docker y vuelve a correr el script.
3. **Frontend responde pero API no** → verificar que el portproxy 3035 apunta a la IP correcta (`netsh interface portproxy show v4tov4`).
4. **Cambiaste la IP pública** → vuelve a correr `refresh-hybrid-stack.ps1 -HostIp <nueva IP>`; el script reescribe `DATABASE_URL` y reinicia todo.

Con esta guía y el script, el proceso deja de depender de IPs internas cambiantes de Docker y el despliegue se completa en menos de 3 minutos.
