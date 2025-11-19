# Local vs Server Playbook

This playbook condenses the daily workflows for developers working on laptops (Linux containers) and operators maintaining the Windows Server production environment.

## Overview at a glance

| Scenario | Location & containers | Database | Entrypoints |
| --- | --- | --- | --- |
| **Local development** | Docker Desktop / Linux containers via `docker-compose.dev.yml` | Ephemeral PostgreSQL running inside Docker (declared in compose) | Frontend `http://localhost:8035`, Backend `http://localhost:3035/docs` |
| **Production server** | Windows Server 2019+ running Docker Engine (Windows containers) with code in `C:\\M7Aplicaciones\\Avery\\Avery-dennison` | PostgreSQL 15 installed on the host (`postgresql-x64-15` service on port 5432) | Frontend `http://avery.millasiete.com:8036`, Backend `http://avery.millasiete.com:3035/docs` (proxied through IIS) |

## Local development workflow

1. **Install prerequisites**
   - Docker Desktop with Linux containers enabled.
   - Node.js 18.x (for Next.js tooling).
   - Python 3.11 + pip (for FastAPI).

2. **Clone & bootstrap**
   ```powershell
   git clone git@github.com:oesantama/Avery-dennison.git
   cd Avery-dennison
   cp backend/.env.example backend/.env        # adjust if needed
   cp frontend/.env.example frontend/.env.local
   ```

3. **Run everything in Docker** (recommended)
   ```powershell
   docker-compose -f docker-compose.dev.yml up -d --build
   docker-compose -f docker-compose.dev.yml logs -f
   ```

4. **Or run services individually**
   ```powershell
   # Backend (FastAPI + auto reload)
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload --port 3035

   # Frontend (Next.js)
   cd ../frontend
   npm install
   npm run dev -- -p 8035
   ```

5. **Smoke tests**
   - API docs → `http://localhost:3035/docs`
   - SPA → `http://localhost:8035`
   - Default credentials: `admin / admin123`

6. **Rebuild / reset**
   ```powershell
   docker-compose -f docker-compose.dev.yml down -v
   ```

## Production (Windows Server) workflow

> All commands below assume an elevated PowerShell session in `C:\M7Aplicaciones\Avery\Avery-dennison`.

### One-time or infrequent tasks

| Goal | Command / Script | What it does |
| --- | --- | --- |
| Allow containers to reach PostgreSQL | `powershell -ExecutionPolicy Bypass -File .\scripts\enable-postgres-docker.ps1` | Sets `listen_addresses='*'`, adds SCRAM entries for the Docker NAT supernet `172.16.0.0/12`, and creates the matching firewall rule before restarting `postgresql-x64-15`. Run again only if PostgreSQL is reinstalled or the port changes. |
| Install IIS redirect site | `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` then `.
setup-iis.ps1` | Installs IIS, creates `C:\M7Aplicaciones\Avery`, and copies `index.html` + `web.config` so external traffic is forwarded to the frontend container at port 8036. |

### Routine release steps

1. **Update the codebase**
   ```powershell
   git fetch origin
   git checkout main
   git pull origin main
   ```

2. **Regenerate connection settings**

   Run the helper and choose option 2 (auto-detected IP) unless you already know the Hyper-V gateway address you need.
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\configure-network-simple.ps1
   ```
   - Automatically rewrites `DATABASE_URL` and `extra_hosts` in `docker-compose.hybrid.yml`.
   - Offers to stop → rebuild → start the stack for you (answer **S** when prompted).

3. **Manual compose flow (if you said No in the previous step)**
   ```powershell
   docker-compose -f docker-compose.hybrid.yml down
   docker-compose -f docker-compose.hybrid.yml build --no-cache
   docker-compose -f docker-compose.hybrid.yml up -d
   ```

4. **Health checks**
   ```powershell
   docker-compose -f docker-compose.hybrid.yml ps
   docker-compose -f docker-compose.hybrid.yml logs backend
   docker-compose -f docker-compose.hybrid.yml logs frontend
   Invoke-WebRequest http://localhost:3035/healthz
   Invoke-WebRequest http://localhost:8036
   ```

5. **Expose the services externally (if the server’s firewall cannot publish container ports directly)**

   ```powershell
   $backendIp  = docker inspect -f "{{ .NetworkSettings.Networks.vehiculos-network.IPAddress }}" vehiculos-backend
   $frontendIp = docker inspect -f "{{ .NetworkSettings.Networks.vehiculos-network.IPAddress }}" vehiculos-frontend

   netsh interface portproxy add v4tov4 listenport=3035 listenaddress=0.0.0.0 connectport=3035 connectaddress=$backendIp
   netsh interface portproxy add v4tov4 listenport=8036 listenaddress=0.0.0.0 connectport=8035 connectaddress=$frontendIp
   ```
   - Use `netsh interface portproxy show v4tov4` to review entries and `... delete v4tov4 listenport=3035 listenaddress=0.0.0.0` to remove old ones.
   - Recreate these entries whenever Docker assigns new container IPs.

6. **Nginx / IIS layer**

   The public DNS already points to IIS at `C:\M7Aplicaciones\Avery`. If you change ports, update `web.config` or rerun `setup-iis.ps1` so the rewrite matches the new listen addresses.

### Handy operational commands

| Purpose | Command |
| --- | --- |
| Tail everything | `docker-compose -f docker-compose.hybrid.yml logs -f` |
| Restart only backend | `docker-compose -f docker-compose.hybrid.yml restart backend` |
| Recreate backend from scratch | `docker-compose -f docker-compose.hybrid.yml up -d --build backend` |
| Clear unused networks | `docker network prune` |
| Prune stopped containers / dangling images | `docker system prune -f` |

## Troubleshooting quick reference

1. **Backend cannot reach PostgreSQL**
   - Ensure `scripts\enable-postgres-docker.ps1` was executed after the last PostgreSQL reinstall.
   - Confirm the firewall rule named *"PostgreSQL 5432 desde Docker"* allows the relevant Docker NAT subnet.
   - Run `Test-NetConnection 172.xx.xx.1 -Port 5432` inside the backend container (`docker exec -it vehiculos-backend powershell`).

2. **`docker-compose` fails with HNS / endpoint errors**
   - Remove stale port proxies: `netsh interface portproxy dump > backup.txt` and delete the conflicting entries.
   - `docker network prune` and restart the Docker service (`Stop-Service docker` / `Start-Service docker`) before running compose again.

3. **Frontend reachable but API blocked**
   - Recreate the backend portproxy entry.
   - Verify `NEXT_PUBLIC_API_URL` equals `http://localhost:3035` during build time (`docker inspect --format '{{ index .Config.Env }}' vehiculos-frontend`).

4. **IIS still serves the old bundle**
   - Clear the IIS cache: `iisreset`.
   - Re-copy `index.html` and `web.config` or rerun `setup-iis.ps1`.

5. **Disk usage keeps growing**
   - Check `docker system df`.
   - Remove orphaned volumes: `docker volume ls -q | % { docker volume rm $_ }` (only if you know uploads are backed up).

## Reference credentials & URLs

- Default admin user: `admin / admin123` (update in *Configuración → Usuarios*).
- Backend Swagger: `http://localhost:3035/docs` (local) / `http://avery.millasiete.com:3035/docs` (server).
- Frontend entrypoint: `http://localhost:8035` (local) / `http://avery.millasiete.com:8036` (server).

Keep this file close to the operations team so they can cross-check every deployment without diving into the full README.
