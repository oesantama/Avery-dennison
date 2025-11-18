# =============================================================================
# Script de Deployment Automatizado para Windows Containers
# Sistema de Gestión de Vehículos - Avery Dennison
# =============================================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEPLOYMENT - WINDOWS CONTAINERS" -ForegroundColor Cyan
Write-Host "  Sistema de Gestión de Vehículos" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que se ejecuta como Administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "❌ ERROR: Este script debe ejecutarse como Administrador" -ForegroundColor Red
    Write-Host "Haz clic derecho en PowerShell y selecciona 'Ejecutar como Administrador'" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "✅ Ejecutándose como Administrador" -ForegroundColor Green
Write-Host ""

# PASO 1: Verificar Docker
Write-Host "=====================================" -ForegroundColor Yellow
Write-Host "PASO 1/8: Verificando Docker" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow

try {
    $dockerVersion = docker version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker no está instalado o no está corriendo"
    }
    Write-Host "✅ Docker está instalado y corriendo" -ForegroundColor Green
    
    # Verificar que está en modo Windows Containers
    $dockerInfo = docker info 2>&1 | Select-String "OSType"
    if ($dockerInfo -match "windows") {
        Write-Host "✅ Docker Engine está en modo Windows Containers" -ForegroundColor Green
    } else {
        Write-Host "❌ ERROR: Docker Engine está en modo Linux Containers" -ForegroundColor Red
        Write-Host "Docker Engine nativo de Windows solo soporta Windows Containers" -ForegroundColor Yellow
        Write-Host "El sistema ya está configurado correctamente para Windows Containers" -ForegroundColor Yellow
        # No se puede cambiar de modo en Docker Engine sin Desktop
    }
} catch {
    Write-Host "❌ ERROR: $_" -ForegroundColor Red
    Write-Host "Por favor instala Docker Engine para Windows" -ForegroundColor Yellow
    pause
    exit 1
}
Write-Host ""

# PASO 2: Verificar Docker Compose
Write-Host "=====================================" -ForegroundColor Yellow
Write-Host "PASO 2/8: Verificando Docker Compose" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow

try {
    $composeVersion = docker-compose --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker Compose no está instalado"
    }
    Write-Host "✅ Docker Compose está instalado: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: $_" -ForegroundColor Red
    pause
    exit 1
}
Write-Host ""

# PASO 3: Configurar Firewall
Write-Host "=====================================" -ForegroundColor Yellow
Write-Host "PASO 3/8: Configurando Firewall" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow

$ports = @(8035, 3035, 5432)
$portNames = @("Frontend", "Backend", "PostgreSQL")

for ($i = 0; $i -lt $ports.Length; $i++) {
    $port = $ports[$i]
    $name = $portNames[$i]
    
    $existingRule = Get-NetFirewallRule -DisplayName "Vehiculos $name" -ErrorAction SilentlyContinue
    if ($existingRule) {
        Write-Host "✓ Regla de firewall para $name (puerto $port) ya existe" -ForegroundColor Gray
    } else {
        New-NetFirewallRule -DisplayName "Vehiculos $name" -Direction Inbound -LocalPort $port -Protocol TCP -Action Allow | Out-Null
        Write-Host "✅ Regla de firewall creada para $name (puerto $port)" -ForegroundColor Green
    }
}
Write-Host ""

# PASO 4: Verificar ubicación del proyecto
Write-Host "=====================================" -ForegroundColor Yellow
Write-Host "PASO 4/8: Verificando proyecto" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow

$projectPath = "C:\M7Aplicaciones\Avery\Avery-dennison"
if (-not (Test-Path $projectPath)) {
    Write-Host "❌ ERROR: Proyecto no encontrado en $projectPath" -ForegroundColor Red
    pause
    exit 1
}

Set-Location $projectPath
Write-Host "✅ Proyecto encontrado en: $projectPath" -ForegroundColor Green
Write-Host ""

# PASO 5: Verificar archivos necesarios
Write-Host "=====================================" -ForegroundColor Yellow
Write-Host "PASO 5/8: Verificando archivos" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow

$requiredFiles = @(
    "docker-compose.windows.yml",
    "backend\Dockerfile.windows",
    "frontend\Dockerfile.windows"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file encontrado" -ForegroundColor Green
    } else {
        Write-Host "❌ $file NO encontrado" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Write-Host ""
    Write-Host "❌ ERROR: Faltan archivos necesarios" -ForegroundColor Red
    pause
    exit 1
}
Write-Host ""

# PASO 6: Crear archivo .env si no existe
Write-Host "=====================================" -ForegroundColor Yellow
Write-Host "PASO 6/8: Configurando variables" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow

$envFile = Join-Path $projectPath ".env"
if (-not (Test-Path $envFile)) {
    $envContent = @"
DATABASE_URL=postgresql://postgres:yourpassword@db:5432/vehiculos_operacion
SECRET_KEY=your-secret-key-here-change-in-production
FRONTEND_URL=http://avery.millasiete.com:8035
BACKEND_URL=http://avery.millasiete.com:3035
NEXT_PUBLIC_API_URL=http://avery.millasiete.com:3035
"@
    $envContent | Out-File -FilePath $envFile -Encoding UTF8
    Write-Host "✅ Archivo .env creado" -ForegroundColor Green
} else {
    Write-Host "✓ Archivo .env ya existe" -ForegroundColor Gray
}
Write-Host ""

# PASO 7: Limpiar contenedores anteriores
Write-Host "=====================================" -ForegroundColor Yellow
Write-Host "PASO 7/8: Limpiando contenedores antiguos" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow

docker-compose -f docker-compose.windows.yml down 2>$null
Write-Host "✅ Contenedores anteriores detenidos" -ForegroundColor Green
Write-Host ""

# PASO 8: Construir e iniciar contenedores
Write-Host "=====================================" -ForegroundColor Yellow
Write-Host "PASO 8/8: Construyendo e iniciando servicios" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "⏳ Este proceso puede tardar 15-20 minutos..." -ForegroundColor Cyan
Write-Host "   - Descargando imagen base de Windows Server" -ForegroundColor Gray
Write-Host "   - Instalando Python y Node.js" -ForegroundColor Gray
Write-Host "   - Construyendo aplicaciones" -ForegroundColor Gray
Write-Host ""

$startTime = Get-Date

try {
    docker-compose -f docker-compose.windows.yml build --no-cache
    if ($LASTEXITCODE -ne 0) {
        throw "Error al construir las imágenes"
    }
    Write-Host "✅ Imágenes construidas exitosamente" -ForegroundColor Green
    Write-Host ""
    
    docker-compose -f docker-compose.windows.yml up -d
    if ($LASTEXITCODE -ne 0) {
        throw "Error al iniciar los contenedores"
    }
    Write-Host "✅ Contenedores iniciados exitosamente" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Logs de error:" -ForegroundColor Yellow
    docker-compose -f docker-compose.windows.yml logs
    pause
    exit 1
}

$endTime = Get-Date
$duration = $endTime - $startTime
Write-Host ""
Write-Host "⏱️  Tiempo total: $($duration.Minutes) minutos $($duration.Seconds) segundos" -ForegroundColor Cyan
Write-Host ""

# Esperar a que los servicios inicien
Write-Host "Esperando a que los servicios inicien..." -ForegroundColor Cyan
Start-Sleep -Seconds 20

# VERIFICACIÓN FINAL
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  VERIFICACIÓN FINAL" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Verificar estado de contenedores
Write-Host "Estado de los contenedores:" -ForegroundColor Yellow
docker-compose -f docker-compose.windows.yml ps
Write-Host ""

# Verificar puertos
Write-Host "Verificando puertos..." -ForegroundColor Yellow
$portsToCheck = @(
    @{Port=8035; Service="Frontend"},
    @{Port=3035; Service="Backend"},
    @{Port=5432; Service="PostgreSQL"}
)

foreach ($portInfo in $portsToCheck) {
    $port = $portInfo.Port
    $service = $portInfo.Service
    $connection = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue
    if ($connection.TcpTestSucceeded) {
        Write-Host "✅ $service (puerto $port): Activo" -ForegroundColor Green
    } else {
        Write-Host "⚠️  $service (puerto $port): No responde" -ForegroundColor Yellow
    }
}
Write-Host ""

# RESUMEN FINAL
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  🎉 DEPLOYMENT COMPLETADO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Acceso al sistema:" -ForegroundColor White
Write-Host "  • URL: http://avery.millasiete.com:8035" -ForegroundColor Cyan
Write-Host "  • Backend API: http://avery.millasiete.com:3035" -ForegroundColor Cyan
Write-Host ""
Write-Host "Credenciales iniciales:" -ForegroundColor White
Write-Host "  • Usuario: admin" -ForegroundColor Cyan
Write-Host "  • Contraseña: admin123" -ForegroundColor Cyan
Write-Host ""
Write-Host "Comandos útiles:" -ForegroundColor White
Write-Host "  • Ver logs: docker-compose -f docker-compose.windows.yml logs -f" -ForegroundColor Gray
Write-Host "  • Detener: docker-compose -f docker-compose.windows.yml stop" -ForegroundColor Gray
Write-Host "  • Reiniciar: docker-compose -f docker-compose.windows.yml restart" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  IMPORTANTE: Cambia las contraseñas por defecto" -ForegroundColor Yellow
Write-Host ""
Write-Host "Presiona cualquier tecla para salir..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
