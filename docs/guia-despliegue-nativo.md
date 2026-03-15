# Guía de Despliegue Nativo (Sin Docker)

Esta es una alternativa para ejecutar la aplicación directamente sobre Windows Server sin utilizar Docker Containers. Es ideal si Docker presenta problemas de red o rendimiento.

## Requisitos previos

1.  **PostgreSQL 15**: Ya instalado y corriendo en puerto 5432.
2.  **Node.js (LTS)**: Instalar [Node.js v18+](https://nodejs.org/).
3.  **Python 3.10+**: Instalar [Python](https://www.python.org/).
4.  **PM2 para Windows**: Herramienta para mantener los procesos corriendo en segundo plano.

### 1. Instalación de Herramientas Globales

Abrir PowerShell como Administrador y ejecutar:

```powershell
npm install -g pm2 pm2-windows-startup
pm2-startup install
```

## Paso 1: Configurar el Backend (Python)

1.  **Instalar dependencias**:

    ```powershell
    cd C:\M7Aplicaciones\Avery\Avery-dennison\backend
    python -m venv venv
    .\venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    ```

2.  **Configurar variables de entorno (.env)**:
    Crear un archivo `.env` en `backend/` con:

    ```ini
    DATABASE_URL=postgresql://postgres:su_password_postgres@localhost:5432/vehiculos_operacion
    SECRET_KEY=clave_segura_produccion
    ALGORITHM=HS256
    ACCESS_TOKEN_EXPIRE_MINUTES=43200
    UPLOAD_DIR=uploads
    ALLOWED_ORIGINS=http://localhost:8035,http://avery.millasiete.com
    ```

3.  **Probar ejecución manual**:
    ```powershell
    python -m uvicorn main:app --host 0.0.0.0 --port 3035
    ```
    _(Presione Ctrl+C para detener y continuar con PM2)_

## Paso 2: Configurar el Frontend (Next.js)

1.  **Instalar dependencias y construir**:

    ```powershell
    cd C:\M7Aplicaciones\Avery\Avery-dennison\frontend
    npm install

    # Crear .env.production
    echo "NEXT_PUBLIC_API_URL=http://localhost:3035" > .env.production

    npm run build
    ```

2.  **Probar ejecución manual**:
    ```powershell
    npm start -- -p 8035
    ```
    _(Presione Ctrl+C para detener)_

## Paso 3: Poner en Producción con PM2

Ejecutar estos comandos una sola vez para registrar los servicios:

```powershell
# 1. Registrar Backend
cd C:\M7Aplicaciones\Avery\Avery-dennison\backend
pm2 start "venv\Scripts\python.exe" --name "avery-backend" -- -m uvicorn main:app --host 0.0.0.0 --port 3035

# 2. Registrar Frontend
cd C:\M7Aplicaciones\Avery\Avery-dennison\frontend
pm2 start npm --name "avery-frontend" -- start -- -p 8035

# 3. Guardar configuración para reinicio automático
pm2 save
```

## Paso 4: Comandos de Mantenimiento

- **Ver estado**: `pm2 list` or `pm2 status`
- **Ver logs**: `pm2 logs`
- **Reiniciar todo**: `pm2 restart all`
- **Actualizar código**:
  1. `git pull`
  2. Backend: `pip install ...` (si cambió) y `pm2 restart avery-backend`
  3. Frontend: `npm run build` y `pm2 restart avery-frontend`

## Integración con IIS

El script `setup-iis.ps1` existente debería seguir funcionando, ya que el Frontend estará escuchando en `http://localhost:8035`, igual que con Docker. IIS simplemente redirige a este puerto.

### Ventajas de este método:

- **Menos complejidad**: Eliminamos la capa de red de Docker.
- **Persistencia**: Los procesos se reinician automáticamente con Windows.
- **Rendimiento**: Ejecución nativa directa.
