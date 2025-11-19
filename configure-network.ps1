# ========================================
# Script de Configuración Automática IP
# Avery Dennison - Docker Deployment
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Configuración de Red - Docker" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Detectar IP del host
Write-Host "🔍 Detectando IP del servidor..." -ForegroundColor Cyan

$hostIP = (Get-NetIPAddress | Where-Object {
    $_.AddressFamily -eq "IPv4" -and 
    $_.IPAddress -notlike "127.*" -and 
    $_.IPAddress -notlike "169.254.*" -and
    $_.PrefixOrigin -eq "Dhcp" -or $_.PrefixOrigin -eq "Manual"
} | Select-Object -First 1).IPAddress

if (-not $hostIP) {
    Write-Host "⚠️  No se pudo detectar IP automáticamente. Usando localhost" -ForegroundColor Yellow
    $hostIP = "127.0.0.1"
}

Write-Host "✅ IP detectada: $hostIP" -ForegroundColor Green
Write-Host ""

# Mostrar configuración actual
Write-Host "📋 Configuración de Red:" -ForegroundColor Yellow
Write-Host "   • IP del Host: $hostIP" -ForegroundColor Gray
Write-Host "   • PostgreSQL: $hostIP:5432" -ForegroundColor Gray
Write-Host "   • Backend: localhost:3035" -ForegroundColor Gray
Write-Host "   • Frontend: localhost:8035" -ForegroundColor Gray
Write-Host ""

# Verificar si PostgreSQL está escuchando
Write-Host "🔍 Verificando PostgreSQL en puerto 5432..." -ForegroundColor Cyan
$pgPort = Test-NetConnection -ComputerName localhost -Port 5432 -InformationLevel Quiet -WarningAction SilentlyContinue

if ($pgPort) {
    Write-Host "✅ PostgreSQL está activo en puerto 5432" -ForegroundColor Green
} else {
    Write-Host "⚠️  PostgreSQL no está escuchando en puerto 5432" -ForegroundColor Yellow
    Write-Host "   Asegúrate de que PostgreSQL esté iniciado:" -ForegroundColor Gray
    Write-Host "   services.msc → PostgreSQL → Iniciar" -ForegroundColor Gray
}
Write-Host ""

# Leer docker-compose actual
$composeFile = "C:\M7Aplicaciones\Avery\Avery-dennison\docker-compose.hybrid.yml"

if (-not (Test-Path $composeFile)) {
    Write-Host "❌ No se encuentra docker-compose.hybrid.yml" -ForegroundColor Red
    Write-Host "   Ruta esperada: $composeFile" -ForegroundColor Gray
    pause
    exit 1
}

Write-Host "📝 Archivo docker-compose: $composeFile" -ForegroundColor Cyan
Write-Host ""

# Opción 1: Probar con host.docker.internal (Windows Docker Desktop)
Write-Host "🎯 Opción 1: Usar host.docker.internal (Docker Desktop)" -ForegroundColor Yellow
Write-Host "   DATABASE_URL: postgresql://postgres:password@host.docker.internal:5432/vehiculos_operacion" -ForegroundColor Gray
Write-Host ""

# Opción 2: Usar IP específica
Write-Host "🎯 Opción 2: Usar IP específica (Docker Engine sin Desktop)" -ForegroundColor Yellow
Write-Host "   DATABASE_URL: postgresql://postgres:password@${hostIP}:5432/vehiculos_operacion" -ForegroundColor Gray
Write-Host ""

# Preguntar cuál usar
Write-Host "¿Qué opción deseas usar?" -ForegroundColor Yellow
Write-Host "  [1] host.docker.internal (Docker Desktop) - RECOMENDADO" -ForegroundColor Cyan
Write-Host "  [2] IP del host ($hostIP)" -ForegroundColor Cyan
Write-Host "  [3] Ingresar IP manualmente" -ForegroundColor Cyan
Write-Host "  [4] No modificar (usar actual)" -ForegroundColor Gray
Write-Host ""
Write-Host -NoNewline "Opción (1-4): " -ForegroundColor Yellow
$option = Read-Host

$connectionHost = ""
$needsExtraHosts = $false

switch ($option) {
    "1" {
        $connectionHost = "host.docker.internal"
        Write-Host "✅ Usando host.docker.internal" -ForegroundColor Green
    }
    "2" {
        $connectionHost = $hostIP
        $needsExtraHosts = $true
        Write-Host "✅ Usando IP: $hostIP" -ForegroundColor Green
    }
    "3" {
        Write-Host -NoNewline "Ingresa la IP del servidor: " -ForegroundColor Yellow
        $customIP = Read-Host
        $connectionHost = $customIP
        $needsExtraHosts = $true
        Write-Host "✅ Usando IP personalizada: $customIP" -ForegroundColor Green
    }
    "4" {
        Write-Host "ℹ️  No se modificará el archivo" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Presiona cualquier tecla para continuar..." -ForegroundColor Yellow
        pause | Out-Null
        exit 0
    }
    default {
        Write-Host "❌ Opción inválida. Usando host.docker.internal por defecto" -ForegroundColor Red
        $connectionHost = "host.docker.internal"
    }
}

Write-Host ""

# Leer el contenido actual
$content = Get-Content $composeFile -Raw

# Reemplazar DATABASE_URL
$pattern = 'DATABASE_URL:\s*postgresql://[^:]+:[^@]+@([^:]+):5432/\w+'
$replacement = "DATABASE_URL: postgresql://postgres:yourpassword@${connectionHost}:5432/vehiculos_operacion"

$content = $content -replace $pattern, $replacement

# Manejar extra_hosts
if ($needsExtraHosts) {
    # Descomentar y configurar extra_hosts
    $content = $content -replace '# extra_hosts:', 'extra_hosts:'
    $content = $content -replace "#   - `"host\.docker\.internal:[^`"]+`"", "      - `"host.docker.internal:${connectionHost}`""
    Write-Host "✅ extra_hosts configurado con IP: $connectionHost" -ForegroundColor Green
} else {
    # Comentar extra_hosts si existe
    $content = $content -replace 'extra_hosts:', '# extra_hosts:'
    $content = $content -replace '      - "host\.docker\.internal:[^"]*"', '#   - "host.docker.internal:IP_DEL_HOST"'
    Write-Host "✅ extra_hosts deshabilitado (no necesario)" -ForegroundColor Green
}

# Guardar el archivo modificado
$content | Set-Content $composeFile -NoNewline
Write-Host "✅ Archivo docker-compose.hybrid.yml actualizado" -ForegroundColor Green
Write-Host ""

# Resumen
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ CONFIGURACIÓN COMPLETADA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Conexión a PostgreSQL configurada:" -ForegroundColor Yellow
Write-Host "   Host: $connectionHost" -ForegroundColor Gray
Write-Host "   Puerto: 5432" -ForegroundColor Gray
Write-Host "   Base de datos: vehiculos_operacion" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Próximos Pasos:" -ForegroundColor Yellow
Write-Host "   1. Iniciar Docker:" -ForegroundColor Cyan
Write-Host "      cd C:\M7Aplicaciones\Avery" -ForegroundColor Gray
Write-Host "      .\start-avery.bat" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. O ejecutar directamente:" -ForegroundColor Cyan
Write-Host "      cd C:\M7Aplicaciones\Avery\Avery-dennison" -ForegroundColor Gray
Write-Host "      docker-compose -f docker-compose.hybrid.yml up -d" -ForegroundColor Gray
Write-Host ""
Write-Host "   3. Verificar logs:" -ForegroundColor Cyan
Write-Host "      docker-compose -f docker-compose.hybrid.yml logs -f" -ForegroundColor Gray
Write-Host ""

Write-Host "¿Deseas iniciar Docker ahora? (S/N): " -ForegroundColor Yellow -NoNewline
$startDocker = Read-Host

if ($startDocker -eq 'S' -or $startDocker -eq 's') {
    Write-Host ""
    Write-Host "🚀 Iniciando Docker..." -ForegroundColor Cyan
    
    Set-Location "C:\M7Aplicaciones\Avery\Avery-dennison"
    
    Write-Host "🛑 Deteniendo contenedores anteriores..." -ForegroundColor Yellow
    docker-compose -f docker-compose.hybrid.yml down
    
    Write-Host "🔨 Construyendo imágenes..." -ForegroundColor Cyan
    docker-compose -f docker-compose.hybrid.yml build
    
    Write-Host "▶️  Iniciando servicios..." -ForegroundColor Green
    docker-compose -f docker-compose.hybrid.yml up -d
    
    Write-Host ""
    Write-Host "✅ Docker iniciado. Verificando estado..." -ForegroundColor Green
    Start-Sleep -Seconds 3
    docker-compose -f docker-compose.hybrid.yml ps
    
    Write-Host ""
    Write-Host "🌐 URLs:" -ForegroundColor Yellow
    Write-Host "   Frontend: http://localhost:8035" -ForegroundColor Cyan
    Write-Host "   Backend:  http://localhost:3035/docs" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "✅ Configuración finalizada. Presiona cualquier tecla para salir..." -ForegroundColor Green
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
