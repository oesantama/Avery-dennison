# Script de Deployment Híbrido
# PostgreSQL nativo + Backend/Frontend containerizados

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEPLOYMENT HÍBRIDO - WINDOWS SERVER" -ForegroundColor Cyan
Write-Host "  PostgreSQL Nativo + Contenedores" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "❌ ERROR: Ejecutar como Administrador" -ForegroundColor Red
    pause
    exit 1
}

# PASO 1: Instalar PostgreSQL si no existe
Write-Host "=====================================" -ForegroundColor Yellow
Write-Host "PASO 1/6: Verificando PostgreSQL" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow

$pgInstalled = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if (-not $pgInstalled) {
    Write-Host "PostgreSQL no instalado. Instalando..." -ForegroundColor Yellow
    
    # Instalar Chocolatey si no existe
    if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
        Write-Host "Instalando Chocolatey..." -ForegroundColor Cyan
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    }
    
    # Instalar PostgreSQL 15
    Write-Host "Instalando PostgreSQL 15..." -ForegroundColor Cyan
    choco install postgresql15 -y --params "/Password:yourpassword"
    
    # Refrescar PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    Write-Host "✅ PostgreSQL instalado" -ForegroundColor Green
} else {
    Write-Host "✅ PostgreSQL ya está instalado" -ForegroundColor Green
}

# Iniciar servicio PostgreSQL
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($pgService) {
    if ($pgService.Status -ne "Running") {
        Start-Service $pgService.Name
        Write-Host "✅ Servicio PostgreSQL iniciado" -ForegroundColor Green
    } else {
        Write-Host "✅ PostgreSQL ya está corriendo" -ForegroundColor Green
    }
}
Write-Host ""

# PASO 2: Crear base de datos
Write-Host "=====================================" -ForegroundColor Yellow
Write-Host "PASO 2/6: Configurando base de datos" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow

$pgBinPath = "C:\Program Files\PostgreSQL\15\bin"
$env:PGPASSWORD = "yourpassword"

# Verificar si la base de datos existe
$dbExists = & "$pgBinPath\psql.exe" -U postgres -lqt | Select-String -Pattern "vehiculos_operacion"

if (-not $dbExists) {
    Write-Host "Creando base de datos vehiculos_operacion..." -ForegroundColor Cyan
    & "$pgBinPath\psql.exe" -U postgres -c "CREATE DATABASE vehiculos_operacion;"
    Write-Host "✅ Base de datos creada" -ForegroundColor Green
} else {
    Write-Host "✅ Base de datos ya existe" -ForegroundColor Green
}

# Verificar esquema si existe archivo schema.sql
$schemaFile = "C:\M7Aplicaciones\Avery\Avery-dennison\database\schema.sql"
if (Test-Path $schemaFile) {
    Write-Host "Aplicando esquema de base de datos..." -ForegroundColor Cyan
    & "$pgBinPath\psql.exe" -U postgres -d vehiculos_operacion -f $schemaFile
    Write-Host "✅ Esquema aplicado" -ForegroundColor Green
}
Write-Host ""

# PASO 3: Configurar Firewall
Write-Host "=====================================" -ForegroundColor Yellow
Write-Host "PASO 3/6: Configurando Firewall" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow

$ports = @(8035, 3035, 5432)
$portNames = @("Frontend", "Backend", "PostgreSQL")

for ($i = 0; $i -lt $ports.Length; $i++) {
    $existingRule = Get-NetFirewallRule -DisplayName "Vehiculos $($portNames[$i])" -ErrorAction SilentlyContinue
    if (-not $existingRule) {
        New-NetFirewallRule -DisplayName "Vehiculos $($portNames[$i])" -Direction Inbound -LocalPort $ports[$i] -Protocol TCP -Action Allow | Out-Null
        Write-Host "✅ Regla firewall: $($portNames[$i]) (puerto $($ports[$i]))" -ForegroundColor Green
    } else {
        Write-Host "✓ Regla firewall ya existe: $($portNames[$i])" -ForegroundColor Gray
    }
}
Write-Host ""

# PASO 4: Verificar Docker
Write-Host "=====================================" -ForegroundColor Yellow
Write-Host "PASO 4/6: Verificando Docker" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow

try {
    $dockerVersion = docker version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker no está corriendo"
    }
    Write-Host "✅ Docker está corriendo" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: $_" -ForegroundColor Red
    pause
    exit 1
}
Write-Host ""

# PASO 5: Construir contenedores
Write-Host "=====================================" -ForegroundColor Yellow
Write-Host "PASO 5/6: Construyendo contenedores" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow

Set-Location "C:\M7Aplicaciones\Avery\Avery-dennison"

Write-Host "⏳ Construyendo frontend (puede tardar 5-10 minutos)..." -ForegroundColor Cyan
docker-compose -f docker-compose.hybrid.yml build --no-cache

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERROR al construir contenedores" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "✅ Contenedores construidos" -ForegroundColor Green
Write-Host ""

# PASO 6: Iniciar contenedores
Write-Host "=====================================" -ForegroundColor Yellow
Write-Host "PASO 6/6: Iniciando servicios" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow

docker-compose -f docker-compose.hybrid.yml up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERROR al iniciar contenedores" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "✅ Servicios iniciados" -ForegroundColor Green
Write-Host ""

# Esperar a que inicien
Start-Sleep -Seconds 10

# VERIFICACIÓN FINAL
Write-Host "========================================" -ForegroundColor Green
Write-Host "  VERIFICACIÓN FINAL" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Estado de contenedores
Write-Host "Contenedores Docker:" -ForegroundColor Yellow
docker-compose -f docker-compose.hybrid.yml ps
Write-Host ""

# Estado de PostgreSQL
Write-Host "PostgreSQL:" -ForegroundColor Yellow
$pgService = Get-Service -Name "postgresql*" | Select-Object -First 1
if ($pgService.Status -eq "Running") {
    Write-Host "✅ PostgreSQL: Corriendo (puerto 5432)" -ForegroundColor Green
} else {
    Write-Host "⚠️  PostgreSQL: No está corriendo" -ForegroundColor Yellow
}
Write-Host ""

# Verificar puertos
Write-Host "Puertos activos:" -ForegroundColor Yellow
$portsActive = @(
    @{Port=8035; Service="Frontend"},
    @{Port=3035; Service="Backend"},
    @{Port=5432; Service="PostgreSQL"}
)

foreach ($portInfo in $portsActive) {
    $connection = Test-NetConnection -ComputerName localhost -Port $portInfo.Port -WarningAction SilentlyContinue
    if ($connection.TcpTestSucceeded) {
        Write-Host "✅ $($portInfo.Service) (puerto $($portInfo.Port)): Activo" -ForegroundColor Green
    } else {
        Write-Host "⚠️  $($portInfo.Service) (puerto $($portInfo.Port)): No responde" -ForegroundColor Yellow
    }
}
Write-Host ""

# RESUMEN
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  🎉 DEPLOYMENT COMPLETADO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Arquitectura:" -ForegroundColor White
Write-Host "  • PostgreSQL: Nativo en Windows (puerto 5432)" -ForegroundColor Gray
Write-Host "  • Backend: Windows Container (puerto 3035)" -ForegroundColor Gray
Write-Host "  • Frontend: Windows Container (puerto 8035)" -ForegroundColor Gray
Write-Host ""
Write-Host "Acceso:" -ForegroundColor White
Write-Host "  • URL: http://avery.millasiete.com:8035" -ForegroundColor Cyan
Write-Host "  • Backend API: http://avery.millasiete.com:3035" -ForegroundColor Cyan
Write-Host ""
Write-Host "Credenciales:" -ForegroundColor White
Write-Host "  • Usuario: admin" -ForegroundColor Cyan
Write-Host "  • Contraseña: admin123" -ForegroundColor Cyan
Write-Host ""
Write-Host "Comandos útiles:" -ForegroundColor White
Write-Host "  • Ver logs: docker-compose -f docker-compose.hybrid.yml logs -f" -ForegroundColor Gray
Write-Host "  • Detener: docker-compose -f docker-compose.hybrid.yml stop" -ForegroundColor Gray
Write-Host "  • Reiniciar: docker-compose -f docker-compose.hybrid.yml restart" -ForegroundColor Gray
Write-Host ""
Write-Host "Presiona cualquier tecla para salir..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
