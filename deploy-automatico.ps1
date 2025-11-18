# ============================================
# SCRIPT DE DEPLOYMENT AUTOMÁTICO
# Sistema de Gestión de Vehículos y Entregas
# ============================================

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  DEPLOYMENT AUTOMÁTICO - WINDOWS SERVER" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si se ejecuta como Administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "❌ ERROR: Este script debe ejecutarse como Administrador" -ForegroundColor Red
    Write-Host "Haz clic derecho en PowerShell y selecciona 'Ejecutar como administrador'" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "✅ Ejecutando como Administrador" -ForegroundColor Green
Write-Host ""

# ============================================
# 1. VERIFICAR DOCKER
# ============================================
Write-Host "📦 [1/8] Verificando Docker Desktop..." -ForegroundColor Yellow

try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker instalado: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Docker no está instalado o no está en el PATH" -ForegroundColor Red
    Write-Host "Por favor, instala Docker Desktop desde: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    pause
    exit 1
}

# Verificar que Docker esté corriendo
try {
    docker ps | Out-Null
    Write-Host "✅ Docker está corriendo correctamente" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Docker no está corriendo" -ForegroundColor Red
    Write-Host "Inicia Docker Desktop y espera a que esté completamente cargado" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host ""

# ============================================
# 2. INSTALAR GIT SI NO EXISTE
# ============================================
Write-Host "🔧 [2/8] Verificando Git..." -ForegroundColor Yellow

$gitInstalled = $false
try {
    $gitVersion = git --version
    Write-Host "✅ Git ya está instalado: $gitVersion" -ForegroundColor Green
    $gitInstalled = $true
} catch {
    Write-Host "⚠️  Git no está instalado. Instalando Git..." -ForegroundColor Yellow
    
    # Descargar Git
    $gitInstallerUrl = "https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe"
    $gitInstallerPath = "$env:TEMP\GitInstaller.exe"
    
    Write-Host "📥 Descargando Git..." -ForegroundColor Cyan
    try {
        Invoke-WebRequest -Uri $gitInstallerUrl -OutFile $gitInstallerPath -UseBasicParsing
        Write-Host "✅ Git descargado" -ForegroundColor Green
        
        # Instalar Git silenciosamente
        Write-Host "📦 Instalando Git (esto puede tomar unos minutos)..." -ForegroundColor Cyan
        Start-Process -FilePath $gitInstallerPath -ArgumentList "/VERYSILENT", "/NORESTART", "/NOCANCEL", "/SP-" -Wait
        
        # Agregar Git al PATH de la sesión actual
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        # Verificar instalación
        Start-Sleep -Seconds 3
        try {
            $gitVersion = git --version
            Write-Host "✅ Git instalado exitosamente: $gitVersion" -ForegroundColor Green
            $gitInstalled = $true
        } catch {
            Write-Host "❌ ERROR: Git se instaló pero no se pudo verificar" -ForegroundColor Red
            Write-Host "Es posible que necesites reiniciar la terminal" -ForegroundColor Yellow
            pause
            exit 1
        }
        
        # Limpiar instalador
        Remove-Item $gitInstallerPath -Force -ErrorAction SilentlyContinue
        
    } catch {
        Write-Host "❌ ERROR al descargar/instalar Git: $_" -ForegroundColor Red
        Write-Host "Descarga Git manualmente desde: https://git-scm.com/download/win" -ForegroundColor Yellow
        pause
        exit 1
    }
}

Write-Host ""

# ============================================
# 3. CONFIGURAR DIRECTORIO DE TRABAJO
# ============================================
Write-Host "📁 [3/8] Configurando directorio de trabajo..." -ForegroundColor Yellow

# Preguntar dónde desplegar
Write-Host "¿Dónde deseas desplegar el proyecto?" -ForegroundColor Cyan
Write-Host "1) C:\inetpub\vehiculos-app (Recomendado para producción)" -ForegroundColor White
Write-Host "2) Ruta personalizada" -ForegroundColor White
Write-Host "3) Directorio actual ($PWD)" -ForegroundColor White
$opcion = Read-Host "Selecciona una opción (1-3)"

switch ($opcion) {
    "1" {
        $deployPath = "C:\inetpub\vehiculos-app"
    }
    "2" {
        $deployPath = Read-Host "Ingresa la ruta completa"
    }
    "3" {
        $deployPath = $PWD.Path
    }
    default {
        $deployPath = "C:\inetpub\vehiculos-app"
    }
}

# Crear directorio si no existe
if (-not (Test-Path $deployPath)) {
    New-Item -ItemType Directory -Path $deployPath -Force | Out-Null
    Write-Host "✅ Directorio creado: $deployPath" -ForegroundColor Green
} else {
    Write-Host "✅ Directorio existe: $deployPath" -ForegroundColor Green
}

Write-Host ""

# ============================================
# 4. CLONAR O ACTUALIZAR REPOSITORIO
# ============================================
Write-Host "📥 [4/8] Clonando/Actualizando proyecto desde GitHub..." -ForegroundColor Yellow

$repoUrl = "https://github.com/oesantama/Avery-dennison.git"
$projectPath = Join-Path $deployPath "Avery-dennison"

if (Test-Path (Join-Path $projectPath ".git")) {
    Write-Host "⚠️  El proyecto ya existe. Actualizando..." -ForegroundColor Yellow
    Set-Location $projectPath
    
    try {
        git pull origin main
        Write-Host "✅ Proyecto actualizado desde GitHub" -ForegroundColor Green
    } catch {
        Write-Host "❌ ERROR al actualizar: $_" -ForegroundColor Red
        Write-Host "Continuando con la versión actual..." -ForegroundColor Yellow
    }
} else {
    Write-Host "📦 Clonando repositorio..." -ForegroundColor Cyan
    Set-Location $deployPath
    
    try {
        git clone $repoUrl
        Write-Host "✅ Proyecto clonado exitosamente" -ForegroundColor Green
        Set-Location $projectPath
    } catch {
        Write-Host "❌ ERROR al clonar: $_" -ForegroundColor Red
        Write-Host "Verifica tu conexión a internet y que tengas acceso al repositorio" -ForegroundColor Yellow
        pause
        exit 1
    }
}

Write-Host ""

# ============================================
# 5. CONFIGURAR FIREWALL
# ============================================
Write-Host "🔥 [5/8] Configurando Firewall de Windows..." -ForegroundColor Yellow

# Eliminar reglas existentes (si existen)
Remove-NetFirewallRule -DisplayName "Vehiculos - Frontend" -ErrorAction SilentlyContinue
Remove-NetFirewallRule -DisplayName "Vehiculos - Backend" -ErrorAction SilentlyContinue
Remove-NetFirewallRule -DisplayName "Vehiculos - Database" -ErrorAction SilentlyContinue

# Crear nuevas reglas
New-NetFirewallRule -DisplayName "Vehiculos - Frontend" -Direction Inbound -Protocol TCP -LocalPort 8035 -Action Allow | Out-Null
New-NetFirewallRule -DisplayName "Vehiculos - Backend" -Direction Inbound -Protocol TCP -LocalPort 3035 -Action Allow | Out-Null
New-NetFirewallRule -DisplayName "Vehiculos - Database" -Direction Inbound -Protocol TCP -LocalPort 5432 -Action Allow | Out-Null

Write-Host "✅ Reglas de firewall configuradas:" -ForegroundColor Green
Write-Host "   - Puerto 8035 (Frontend)" -ForegroundColor White
Write-Host "   - Puerto 3035 (Backend API)" -ForegroundColor White
Write-Host "   - Puerto 5432 (PostgreSQL)" -ForegroundColor White

Write-Host ""

# ============================================
# 6. CONFIGURAR VARIABLES DE ENTORNO
# ============================================
Write-Host "⚙️  [6/8] Configurando variables de entorno..." -ForegroundColor Yellow

$envFile = Join-Path $projectPath ".env"

# Obtener IP del servidor
$serverIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*"} | Select-Object -First 1).IPAddress

# Preguntar por el dominio/IP a usar
Write-Host ""
Write-Host "¿Cómo accederán al sistema?" -ForegroundColor Cyan
Write-Host "1) Dominio: http://avery.millasiete.com:8035 (Recomendado)" -ForegroundColor White
Write-Host "2) IP del servidor: http://${serverIP}:8035" -ForegroundColor White
Write-Host "3) Localhost: http://localhost:8035" -ForegroundColor White
$opcionAcceso = Read-Host "Selecciona una opción (1-3)"

switch ($opcionAcceso) {
    "1" {
        $frontendUrl = "http://avery.millasiete.com:8035"
        $backendUrl = "http://avery.millasiete.com:3035"
    }
    "2" {
        $frontendUrl = "http://${serverIP}:8035"
        $backendUrl = "http://${serverIP}:3035"
    }
    "3" {
        $frontendUrl = "http://localhost:8035"
        $backendUrl = "http://localhost:3035"
    }
    default {
        $frontendUrl = "http://avery.millasiete.com:8035"
        $backendUrl = "http://avery.millasiete.com:3035"
    }
}

Write-Host "✅ URL Frontend: $frontendUrl" -ForegroundColor Green
Write-Host "✅ URL Backend: $backendUrl" -ForegroundColor Green

# Generar secreto seguro
$secretKey = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})

$envContent = @"
# ============================================
# CONFIGURACIÓN DE PRODUCCIÓN
# Generado automáticamente: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# ============================================

# Base de Datos PostgreSQL
POSTGRES_USER=vehiculos_user
POSTGRES_PASSWORD=VehiculosSeguro2024!
POSTGRES_DB=vehiculos_db
POSTGRES_HOST=vehiculos-db
POSTGRES_PORT=5432

# Backend API
SECRET_KEY=$secretKey
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Frontend
NEXT_PUBLIC_API_URL=$backendUrl

# Dominio/URL de Acceso
FRONTEND_URL=$frontendUrl
BACKEND_URL=$backendUrl

# Docker
COMPOSE_PROJECT_NAME=vehiculos
"@

$envContent | Out-File -FilePath $envFile -Encoding UTF8 -Force
Write-Host "✅ Archivo .env creado con configuración segura" -ForegroundColor Green

Write-Host ""

# ============================================
# 7. CONSTRUIR E INICIAR CONTENEDORES
# ============================================
Write-Host "🐳 [7/8] Construyendo e iniciando contenedores Docker..." -ForegroundColor Yellow

# Detener contenedores existentes
Write-Host "🛑 Deteniendo contenedores existentes..." -ForegroundColor Cyan
docker-compose down 2>$null

# Construir imágenes
Write-Host "🔨 Construyendo imágenes (esto puede tomar 5-10 minutos)..." -ForegroundColor Cyan
docker-compose build --no-cache

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Imágenes construidas exitosamente" -ForegroundColor Green
} else {
    Write-Host "❌ ERROR al construir imágenes" -ForegroundColor Red
    pause
    exit 1
}

# Iniciar servicios
Write-Host "🚀 Iniciando servicios..." -ForegroundColor Cyan
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Servicios iniciados correctamente" -ForegroundColor Green
} else {
    Write-Host "❌ ERROR al iniciar servicios" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""

# ============================================
# 8. VERIFICAR SERVICIOS
# ============================================
Write-Host "✅ [8/8] Verificando servicios..." -ForegroundColor Yellow

# Esperar a que los contenedores estén listos
Write-Host "⏳ Esperando a que los servicios estén listos (30 segundos)..." -ForegroundColor Cyan
Start-Sleep -Seconds 30

# Verificar estado de contenedores
Write-Host ""
Write-Host "📊 Estado de los contenedores:" -ForegroundColor Cyan
docker-compose ps

Write-Host ""

# Verificar logs
Write-Host "📋 Últimas líneas de logs:" -ForegroundColor Cyan
Write-Host ""
Write-Host "--- Backend ---" -ForegroundColor Yellow
docker-compose logs --tail=5 vehiculos-backend
Write-Host ""
Write-Host "--- Frontend ---" -ForegroundColor Yellow
docker-compose logs --tail=5 vehiculos-frontend

Write-Host ""

# ============================================
# 9. INFORMACIÓN DE ACCESO
# ============================================
Write-Host "=========================================" -ForegroundColor Green
Write-Host "  ✅ DEPLOYMENT COMPLETADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

# Obtener IP del servidor
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*"} | Select-Object -First 1).IPAddress

Write-Host "🌐 ACCESO AL SISTEMA:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "  Frontend (Aplicación Web):" -ForegroundColor White
Write-Host "  • Dominio: $frontendUrl" -ForegroundColor Green
Write-Host "  • Local:   http://localhost:8035" -ForegroundColor Green
Write-Host "  • IP:      http://${ipAddress}:8035" -ForegroundColor Green
Write-Host ""
Write-Host "  Backend API:" -ForegroundColor White
Write-Host "  • Dominio: $backendUrl" -ForegroundColor Yellow
Write-Host "  • Local:   http://localhost:3035" -ForegroundColor Yellow
Write-Host "  • IP:      http://${ipAddress}:3035" -ForegroundColor Yellow
Write-Host "  • Docs:    $backendUrl/docs" -ForegroundColor Yellow
Write-Host ""
Write-Host "  PostgreSQL Database:" -ForegroundColor White
Write-Host "  • Host:   localhost:5432" -ForegroundColor Cyan
Write-Host "  • User:   vehiculos_user" -ForegroundColor Cyan
Write-Host "  • DB:     vehiculos_db" -ForegroundColor Cyan
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

Write-Host "🔑 CREDENCIALES INICIALES:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "  Usuario:    admin" -ForegroundColor White
Write-Host "  Contraseña: admin123" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Yellow
Write-Host "  • El sistema trabaja con HTTP (sin certificado SSL)" -ForegroundColor White
Write-Host "  • Cambia la contraseña del usuario admin después del primer login" -ForegroundColor White
Write-Host "  • Crea usuarios con roles específicos según sea necesario" -ForegroundColor White
Write-Host "  • Configura backups automáticos de la base de datos" -ForegroundColor White
Write-Host ""

Write-Host "📝 COMANDOS ÚTILES:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "  Ver logs:       docker-compose logs -f" -ForegroundColor White
Write-Host "  Reiniciar:      docker-compose restart" -ForegroundColor White
Write-Host "  Detener:        docker-compose stop" -ForegroundColor White
Write-Host "  Iniciar:        docker-compose start" -ForegroundColor White
Write-Host "  Ver estado:     docker-compose ps" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

Write-Host "📍 UBICACIÓN DEL PROYECTO:" -ForegroundColor Cyan
Write-Host "  $projectPath" -ForegroundColor White
Write-Host ""

Write-Host "✅ Sistema listo para usar!" -ForegroundColor Green
Write-Host ""

# Preguntar si desea abrir el navegador
$openBrowser = Read-Host "¿Deseas abrir el sistema en el navegador? (S/N)"
if ($openBrowser -eq "S" -or $openBrowser -eq "s") {
    Start-Process $frontendUrl
}

Write-Host ""
Write-Host "Presiona cualquier tecla para salir..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
