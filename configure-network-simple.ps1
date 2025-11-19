# ========================================
# Script de Configuracion Automatica IP
# Avery Dennison - Docker Deployment
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Configuracion de Red - Docker" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Parámetros comunes
$postgresUser = "postgres"
$postgresPassword = "Admin123!"
$postgresDb = "vehiculos_operacion"
$defaultDockerSubnet = "172.16.0.0/12"
$defaultPostgresDataPath = "C:\Program Files\PostgreSQL\15\data"

# Detectar IP del host
Write-Host "[*] Detectando IP del servidor..." -ForegroundColor Cyan

$ipCandidates = Get-NetIPAddress | Where-Object {
    $_.AddressFamily -eq "IPv4" -and 
    $_.IPAddress -notlike "127.*" -and 
    $_.IPAddress -notlike "169.254.*" -and
    ($_.PrefixOrigin -eq "Dhcp" -or $_.PrefixOrigin -eq "Manual")
} | Sort-Object -Property InterfaceMetric

$preferredCandidates = $ipCandidates | Where-Object {
    $_.InterfaceAlias -notmatch 'vEthernet|Hyper-V|Docker|Virtual'
}

$selectedInterface = if ($preferredCandidates) {
    $preferredCandidates | Select-Object -First 1
} elseif ($ipCandidates) {
    $ipCandidates | Select-Object -First 1
} else {
    $null
}

if ($selectedInterface) {
    $hostIP = $selectedInterface.IPAddress
    $interfaceName = $selectedInterface.InterfaceAlias
} else {
    Write-Host "[!] No se pudo detectar IP automaticamente. Usando localhost" -ForegroundColor Yellow
    $hostIP = "127.0.0.1"
    $interfaceName = "Loopback"
}

Write-Host "[OK] IP detectada: $hostIP ($interfaceName)" -ForegroundColor Green
Write-Host ""

# Mostrar configuracion actual
Write-Host "Configuracion de Red:" -ForegroundColor Yellow
Write-Host "   IP del Host: $hostIP" -ForegroundColor Gray
Write-Host "   PostgreSQL: $hostIP`:5432" -ForegroundColor Gray
Write-Host "   Backend: localhost:3035" -ForegroundColor Gray
Write-Host "   Frontend: localhost:8035" -ForegroundColor Gray
Write-Host ""

# Verificar si PostgreSQL esta escuchando
Write-Host "[*] Verificando PostgreSQL en puerto 5432..." -ForegroundColor Cyan
$pgPort = Test-NetConnection -ComputerName localhost -Port 5432 -InformationLevel Quiet -WarningAction SilentlyContinue

if ($pgPort) {
    Write-Host "[OK] PostgreSQL esta activo en puerto 5432" -ForegroundColor Green
} else {
    Write-Host "[!] PostgreSQL no esta escuchando en puerto 5432" -ForegroundColor Yellow
    Write-Host "   Asegurate de que PostgreSQL este iniciado:" -ForegroundColor Gray
    Write-Host "   services.msc -> PostgreSQL -> Iniciar" -ForegroundColor Gray
}
Write-Host ""

# Leer docker-compose actual
$composeFile = "C:\M7Aplicaciones\Avery\Avery-dennison\docker-compose.hybrid.yml"

if (-not (Test-Path $composeFile)) {
    Write-Host "[ERROR] No se encuentra docker-compose.hybrid.yml" -ForegroundColor Red
    Write-Host "   Ruta esperada: $composeFile" -ForegroundColor Gray
    pause
    exit 1
}

Write-Host "Archivo docker-compose: $composeFile" -ForegroundColor Cyan
Write-Host ""

# Opciones
Write-Host "Como deseas configurar la conexion a PostgreSQL?" -ForegroundColor Yellow
Write-Host ""
Write-Host "   1. Usar host.docker.internal (RECOMENDADO)" -ForegroundColor Cyan
Write-Host "      - Funciona automaticamente con Docker" -ForegroundColor Gray
Write-Host "      - No requiere configuracion adicional" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Usar IP detectada ($hostIP)" -ForegroundColor Cyan
Write-Host "      - Conexion directa a la IP" -ForegroundColor Gray
Write-Host "      - Requiere agregar extra_hosts" -ForegroundColor Gray
Write-Host ""
Write-Host "   3. Ingresar IP personalizada" -ForegroundColor Cyan
Write-Host "      - Util si la IP detectada es incorrecta" -ForegroundColor Gray
Write-Host ""
Write-Host "   4. No modificar (salir)" -ForegroundColor Cyan
Write-Host ""
Write-Host -NoNewline "Opcion (1-4): " -ForegroundColor Yellow
$option = Read-Host

$connectionHost = ""
$needsExtraHosts = $false

switch ($option) {
    "1" {
        $connectionHost = "host.docker.internal"
        Write-Host "[OK] Usando host.docker.internal" -ForegroundColor Green
    }
    "2" {
        $connectionHost = $hostIP
        $needsExtraHosts = $true
        Write-Host "[OK] Usando IP: $hostIP" -ForegroundColor Green
    }
    "3" {
        Write-Host -NoNewline "Ingresa la IP del servidor: " -ForegroundColor Yellow
        $customIP = Read-Host
        $connectionHost = $customIP
        $needsExtraHosts = $true
        Write-Host "[OK] Usando IP personalizada: $customIP" -ForegroundColor Green
    }
    "4" {
        Write-Host "[INFO] No se modificara el archivo" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Presiona cualquier tecla para continuar..." -ForegroundColor Yellow
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 0
    }
    default {
        Write-Host "[!] Opcion invalida. Usando host.docker.internal por defecto" -ForegroundColor Red
        $connectionHost = "host.docker.internal"
    }
}

Write-Host ""

# Leer el contenido actual
$content = Get-Content $composeFile -Raw

# Modificar DATABASE_URL en el servicio backend
Write-Host "[*] Modificando DATABASE_URL..." -ForegroundColor Cyan

$newDatabaseUrl = "postgresql://$postgresUser`:$postgresPassword@$connectionHost`:5432/$postgresDb"
$newDatabaseUrlQuoted = '"' + $newDatabaseUrl + '"'
$databaseUrlPattern = 'DATABASE_URL\s*[:=]\s*"?postgresql://[^@]+@[^:]+:5432/vehiculos_operacion"?'

if ($content -match $databaseUrlPattern) {
    # Reemplazar DATABASE_URL compatible con formato YAML (:) o env (=)
    $content = $content -replace $databaseUrlPattern, "DATABASE_URL: $newDatabaseUrlQuoted"
    Write-Host "[OK] DATABASE_URL actualizado: $newDatabaseUrl" -ForegroundColor Green
} else {
    Write-Host "[!] No se pudo localizar DATABASE_URL, verificando insercion manual..." -ForegroundColor Yellow
    $content = $content -replace '(environment:\s*(?:\r?\n\s{6,}[^\r\n]+)+)', "$1`n      DATABASE_URL: $newDatabaseUrlQuoted"
    Write-Host "[OK] DATABASE_URL agregado manualmente: $newDatabaseUrl" -ForegroundColor Green
}

# Modificar extra_hosts segun sea necesario
if ($needsExtraHosts) {
    Write-Host "[*] Configurando extra_hosts..." -ForegroundColor Cyan
    
    # Descomentar o agregar extra_hosts
    if ($content -match '# *extra_hosts:') {
        # Si esta comentado, descomentar
        $content = $content -replace '# *(extra_hosts:)', '$1'
        $content = $content -replace '# *- "host\.docker\.internal:([^"]+)"', '      - "host.docker.internal:$1"'
        Write-Host "[OK] extra_hosts descomentado" -ForegroundColor Green
    } else {
        # Si no existe, agregarlo
        $extraHostsBlock = @"
    extra_hosts:
      - "host.docker.internal:$connectionHost"
"@
        $content = $content -replace '(environment:.*?(?=\n\n|\n  [a-z_]+:))', "`$1`n$extraHostsBlock"
        Write-Host "[OK] extra_hosts agregado" -ForegroundColor Green
    }
} else {
    Write-Host "[*] Comentando extra_hosts (no necesario con host.docker.internal)..." -ForegroundColor Cyan
    
    # Comentar extra_hosts si existe
    $content = $content -replace '(\s+)(extra_hosts:)', '$1# $2'
    $content = $content -replace '(\s+)(- "host\.docker\.internal:[^"]+")', '$1# $2'
    
    Write-Host "[OK] extra_hosts comentado" -ForegroundColor Green
}

# Guardar cambios
Write-Host ""
Write-Host "[*] Guardando cambios en $composeFile..." -ForegroundColor Cyan
$content | Set-Content $composeFile -Encoding UTF8

Write-Host "[OK] Archivo actualizado correctamente" -ForegroundColor Green
Write-Host ""

# Resumen
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Configuracion Completa" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "DATABASE_URL: $newDatabaseUrl" -ForegroundColor Cyan
Write-Host ""
$enablePostgresScript = Join-Path $PSScriptRoot "scripts\enable-postgres-docker.ps1"
if (Test-Path $enablePostgresScript) {
    Write-Host "Quieres forzar que PostgreSQL escuche a la red de Docker ($defaultDockerSubnet)? (S/N): " -ForegroundColor Yellow -NoNewline
    $hardenPostgres = Read-Host
    if ($hardenPostgres -match '^[sS]$') {
        Write-Host "" 
        Write-Host "[*] Aplicando reglas de firewall y pg_hba.conf..." -ForegroundColor Cyan
        try {
            & $enablePostgresScript -PostgresServiceName "postgresql-x64-15" -DockerSubnet $defaultDockerSubnet -PostgresDataPath $defaultPostgresDataPath
        } catch {
            Write-Host "[!] No se pudo ejecutar scripts\\enable-postgres-docker.ps1" -ForegroundColor Red
            Write-Host $_ -ForegroundColor DarkRed
        }
    }
}

Write-Host "Siguiente paso:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   1. Ejecutar desde este script (opcion S)" -ForegroundColor Cyan
Write-Host ""
Write-Host "   2. O ejecutar directamente:" -ForegroundColor Cyan
Write-Host "      cd C:\M7Aplicaciones\Avery\Avery-dennison" -ForegroundColor Gray
Write-Host "      docker-compose -f docker-compose.hybrid.yml up -d" -ForegroundColor Gray
Write-Host ""
Write-Host "   3. Verificar logs:" -ForegroundColor Cyan
Write-Host "      docker-compose -f docker-compose.hybrid.yml logs -f" -ForegroundColor Gray
Write-Host ""

Write-Host "Deseas iniciar Docker ahora? (S/N): " -ForegroundColor Yellow -NoNewline
$startDocker = Read-Host

if ($startDocker -eq 'S' -or $startDocker -eq 's') {
    Write-Host ""
    Write-Host "[*] Iniciando Docker..." -ForegroundColor Cyan
    
    Set-Location "C:\M7Aplicaciones\Avery\Avery-dennison"
    
    Write-Host "[*] Deteniendo contenedores anteriores..." -ForegroundColor Yellow
    docker-compose -f docker-compose.hybrid.yml down
    
    Write-Host "[*] Construyendo imagenes..." -ForegroundColor Cyan
    docker-compose -f docker-compose.hybrid.yml build
    
    Write-Host "[*] Iniciando servicios..." -ForegroundColor Green
    docker-compose -f docker-compose.hybrid.yml up -d
    
    Write-Host ""
    Write-Host "[OK] Docker iniciado. Verificando estado..." -ForegroundColor Green
    Start-Sleep -Seconds 3
    docker-compose -f docker-compose.hybrid.yml ps
    
    Write-Host ""
    Write-Host "URLs:" -ForegroundColor Yellow
    Write-Host "   Frontend: http://localhost:8035" -ForegroundColor Cyan
    Write-Host "   Backend:  http://localhost:3035/docs" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "[OK] Configuracion finalizada. Presiona cualquier tecla para salir..." -ForegroundColor Green
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
