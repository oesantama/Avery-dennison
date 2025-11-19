# ========================================
# Script de Configuración Automática IIS
# Avery Dennison - Sistema de Entregas
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Configuración IIS - Avery Dennison" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si se ejecuta como Administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ ERROR: Este script debe ejecutarse como Administrador" -ForegroundColor Red
    Write-Host ""
    Write-Host "Clic derecho en PowerShell → 'Ejecutar como administrador'" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "✅ Ejecutando como Administrador" -ForegroundColor Green
Write-Host ""

# Variables
$siteName = "AveryDennison"
$appPoolName = "AveryDennisonPool"
$physicalPath = "C:\M7Aplicaciones\Avery"
$projectPath = "C:\M7Aplicaciones\Avery\Avery-dennison"
$port = 80
$hostname = "avery.millasiete.com"

Write-Host "📋 Configuración:" -ForegroundColor Yellow
Write-Host "   Sitio: $siteName" -ForegroundColor Gray
Write-Host "   Ruta: $physicalPath" -ForegroundColor Gray
Write-Host "   Puerto: $port" -ForegroundColor Gray
Write-Host "   Hostname: $hostname" -ForegroundColor Gray
Write-Host ""

# Paso 1: Instalar IIS si no está instalado
Write-Host "[1/6] Verificando IIS..." -ForegroundColor Cyan
$iisFeature = Get-WindowsFeature -Name Web-Server -ErrorAction SilentlyContinue

if ($null -eq $iisFeature) {
    Write-Host "⚠️  IIS no detectado. ¿Deseas instalarlo? (S/N): " -ForegroundColor Yellow -NoNewline
    $install = Read-Host
    
    if ($install -eq 'S' -or $install -eq 's') {
        Write-Host "📦 Instalando IIS (puede tardar varios minutos)..." -ForegroundColor Cyan
        Install-WindowsFeature -Name Web-Server -IncludeManagementTools
        Write-Host "✅ IIS instalado correctamente" -ForegroundColor Green
    } else {
        Write-Host "❌ IIS es requerido. Instalación cancelada." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ IIS ya está instalado" -ForegroundColor Green
}
Write-Host ""

# Paso 2: Crear directorios necesarios
Write-Host "[2/6] Verificando directorios..." -ForegroundColor Cyan
if (-not (Test-Path $physicalPath)) {
    Write-Host "📁 Creando directorio: $physicalPath" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $physicalPath -Force | Out-Null
}
Write-Host "✅ Directorio verificado: $physicalPath" -ForegroundColor Green
Write-Host ""

# Paso 3: Copiar archivos necesarios
Write-Host "[3/6] Copiando archivos de configuración..." -ForegroundColor Cyan

if (Test-Path "$projectPath\index.html") {
    Copy-Item "$projectPath\index.html" "$physicalPath\index.html" -Force
    Write-Host "✅ index.html copiado" -ForegroundColor Green
} else {
    Write-Host "⚠️  index.html no encontrado en el proyecto" -ForegroundColor Yellow
}

if (Test-Path "$projectPath\web.config") {
    Copy-Item "$projectPath\web.config" "$physicalPath\web.config" -Force
    Write-Host "✅ web.config copiado" -ForegroundColor Green
} else {
    Write-Host "⚠️  web.config no encontrado" -ForegroundColor Yellow
}

if (Test-Path "$projectPath\start-avery.bat") {
    Copy-Item "$projectPath\start-avery.bat" "$physicalPath\start-avery.bat" -Force
    Write-Host "✅ start-avery.bat copiado" -ForegroundColor Green
}
Write-Host ""

# Paso 4: Importar módulo IIS
Write-Host "[4/6] Cargando módulo IIS..." -ForegroundColor Cyan
Import-Module WebAdministration -ErrorAction SilentlyContinue
Write-Host "✅ Módulo IIS cargado" -ForegroundColor Green
Write-Host ""

# Paso 5: Crear Application Pool
Write-Host "[5/6] Configurando Application Pool..." -ForegroundColor Cyan
if (Test-Path "IIS:\AppPools\$appPoolName") {
    Write-Host "⚠️  Application Pool '$appPoolName' ya existe. Eliminando..." -ForegroundColor Yellow
    Remove-WebAppPool -Name $appPoolName
}

New-WebAppPool -Name $appPoolName | Out-Null
Set-ItemProperty "IIS:\AppPools\$appPoolName" -Name "managedRuntimeVersion" -Value ""
Set-ItemProperty "IIS:\AppPools\$appPoolName" -Name "startMode" -Value "AlwaysRunning"
Write-Host "✅ Application Pool '$appPoolName' creado" -ForegroundColor Green
Write-Host ""

# Paso 6: Crear o actualizar sitio web
Write-Host "[6/6] Configurando sitio web..." -ForegroundColor Cyan

# Detener y eliminar sitio existente si existe
if (Test-Path "IIS:\Sites\$siteName") {
    Write-Host "⚠️  Sitio '$siteName' ya existe. Eliminando..." -ForegroundColor Yellow
    Remove-Website -Name $siteName
}

# Verificar si el puerto está en uso
$defaultSite = Get-Website -Name "Default Web Site" -ErrorAction SilentlyContinue
if ($defaultSite -and $port -eq 80) {
    Write-Host "⚠️  Deteniendo 'Default Web Site' (usa puerto 80)..." -ForegroundColor Yellow
    Stop-Website -Name "Default Web Site"
}

# Crear nuevo sitio
New-Website -Name $siteName `
            -PhysicalPath $physicalPath `
            -ApplicationPool $appPoolName `
            -Port $port `
            -HostHeader $hostname | Out-Null

Write-Host "✅ Sitio web '$siteName' creado" -ForegroundColor Green
Write-Host ""

# Configurar binding adicional sin hostname (localhost)
New-WebBinding -Name $siteName -IPAddress "*" -Port $port -Protocol http -ErrorAction SilentlyContinue

# Configurar permisos
Write-Host "🔐 Configurando permisos..." -ForegroundColor Cyan
$acl = Get-Acl $physicalPath
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule("IIS_IUSRS", "ReadAndExecute", "ContainerInherit,ObjectInherit", "None", "Allow")
$acl.SetAccessRule($accessRule)
Set-Acl $physicalPath $acl
Write-Host "✅ Permisos configurados" -ForegroundColor Green
Write-Host ""

# Configurar Firewall
Write-Host "🔥 Configurando Firewall..." -ForegroundColor Cyan
$firewallRule = Get-NetFirewallRule -DisplayName "IIS HTTP Port 80" -ErrorAction SilentlyContinue
if (-not $firewallRule) {
    New-NetFirewallRule -DisplayName "IIS HTTP Port 80" `
                        -Direction Inbound `
                        -LocalPort 80 `
                        -Protocol TCP `
                        -Action Allow | Out-Null
    Write-Host "✅ Regla de firewall creada para puerto 80" -ForegroundColor Green
} else {
    Write-Host "✅ Regla de firewall ya existe" -ForegroundColor Green
}
Write-Host ""

# Iniciar sitio
Write-Host "🚀 Iniciando sitio web..." -ForegroundColor Cyan
Start-Website -Name $siteName
Write-Host "✅ Sitio iniciado correctamente" -ForegroundColor Green
Write-Host ""

# Resumen
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ CONFIGURACIÓN COMPLETADA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Rutas Configuradas:" -ForegroundColor Yellow
Write-Host "   • Sitio IIS: $physicalPath" -ForegroundColor Gray
Write-Host "   • Proyecto: $projectPath" -ForegroundColor Gray
Write-Host ""
Write-Host "🌐 URLs de Acceso:" -ForegroundColor Yellow
Write-Host "   • http://localhost" -ForegroundColor Gray
Write-Host "   • http://$hostname" -ForegroundColor Gray
Write-Host "   • http://avery.millasiete.com:8035 (Docker)" -ForegroundColor Gray
Write-Host ""
Write-Host "🎯 Próximos Pasos:" -ForegroundColor Yellow
Write-Host "   1. Iniciar Docker:" -ForegroundColor Cyan
Write-Host "      cd C:\M7Aplicaciones\Avery" -ForegroundColor Gray
Write-Host "      .\start-avery.bat" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Configurar DNS/Hosts (si es necesario):" -ForegroundColor Cyan
Write-Host "      Agregar a C:\Windows\System32\drivers\etc\hosts:" -ForegroundColor Gray
Write-Host "      127.0.0.1  avery.millasiete.com" -ForegroundColor Gray
Write-Host ""
Write-Host "   3. Verificar:" -ForegroundColor Cyan
Write-Host "      http://localhost → Debe redirigir a :8035" -ForegroundColor Gray
Write-Host ""

# Abrir navegador (opcional)
Write-Host "¿Deseas abrir el navegador para verificar? (S/N): " -ForegroundColor Yellow -NoNewline
$openBrowser = Read-Host

if ($openBrowser -eq 'S' -or $openBrowser -eq 's') {
    Start-Process "http://localhost"
}

Write-Host ""
Write-Host "✅ Script finalizado. Presiona cualquier tecla para salir..." -ForegroundColor Green
pause | Out-Null
