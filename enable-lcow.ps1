# Script para habilitar LCOW (Linux Containers on Windows)
# Permite correr contenedores Linux en Docker Engine de Windows

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  HABILITANDO LCOW" -ForegroundColor Cyan
Write-Host "  Linux Containers on Windows" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "❌ ERROR: Ejecutar como Administrador" -ForegroundColor Red
    pause
    exit 1
}

# PASO 1: Detener Docker
Write-Host "Deteniendo Docker..." -ForegroundColor Yellow
Stop-Service Docker
Write-Host "✅ Docker detenido" -ForegroundColor Green
Write-Host ""

# PASO 2: Configurar LCOW
Write-Host "Configurando LCOW..." -ForegroundColor Yellow

# Crear directorio de configuración si no existe
$configDir = "C:\ProgramData\docker\config"
if (-not (Test-Path $configDir)) {
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
}

# Crear daemon.json con soporte experimental y LCOW
$daemonConfig = @"
{
  "experimental": true,
  "lcow": {
    "enabled": true
  }
}
"@

$daemonConfig | Out-File -FilePath "$configDir\daemon.json" -Encoding ascii -Force
Write-Host "✅ Configuración LCOW creada" -ForegroundColor Green
Write-Host ""

# PASO 3: Re-registrar servicio Docker
Write-Host "Re-registrando Docker con modo experimental..." -ForegroundColor Yellow

try {
    dockerd --unregister-service
    dockerd --register-service --experimental
    Write-Host "✅ Docker re-registrado" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Advertencia: Error al re-registrar (puede ser normal)" -ForegroundColor Yellow
}
Write-Host ""

# PASO 4: Iniciar Docker
Write-Host "Iniciando Docker..." -ForegroundColor Yellow
Start-Service Docker
Start-Sleep -Seconds 5

# Verificar
$dockerInfo = docker info 2>&1
if ($dockerInfo -match "Experimental: true") {
    Write-Host "✅ Docker iniciado con modo experimental" -ForegroundColor Green
} else {
    Write-Host "⚠️  Modo experimental no detectado" -ForegroundColor Yellow
}
Write-Host ""

# PASO 5: Verificar LCOW
Write-Host "========================================" -ForegroundColor Green
Write-Host "  VERIFICACIÓN" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Información de Docker:" -ForegroundColor Yellow
docker version
Write-Host ""

Write-Host "Probando contenedor Linux..." -ForegroundColor Yellow
try {
    docker run --rm --platform linux hello-world
    Write-Host ""
    Write-Host "✅ LCOW FUNCIONANDO - Puedes usar PostgreSQL Linux" -ForegroundColor Green
    Write-Host ""
    Write-Host "Siguiente paso:" -ForegroundColor Cyan
    Write-Host "  docker-compose -f docker-compose.yml up -d" -ForegroundColor White
} catch {
    Write-Host "❌ LCOW no funciona" -ForegroundColor Red
    Write-Host "Usa la solución híbrida (PostgreSQL nativo)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Comando:" -ForegroundColor Cyan
    Write-Host "  powershell -ExecutionPolicy Bypass -File .\deploy-hybrid.ps1" -ForegroundColor White
}
Write-Host ""
Write-Host "Presiona cualquier tecla para salir..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
