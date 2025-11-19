param(
    [string]$HostIp,
    [string]$ComposeFile = "C:\\M7Aplicaciones\\Avery\\Avery-dennison\\docker-compose.hybrid.yml",
    [string]$BackendContainer = "vehiculos-backend",
    [string]$FrontendContainer = "vehiculos-frontend",
    [int]$BackendPort = 3035,
    [int]$FrontendPort = 8036,
    [int]$FrontendContainerPort = 8035,
    [string]$PostgresUser = "postgres",
    [string]$PostgresPassword = "Admin123!",
    [string]$PostgresDb = "vehiculos_operacion"
)

$ErrorActionPreference = "Stop"

function Write-Section($Message) {
    Write-Host "`n=== $Message ===" -ForegroundColor Cyan
}

function Write-Info($Message) {
    Write-Host "[INFO] $Message" -ForegroundColor Gray
}

function Write-Ok($Message) {
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warn($Message) {
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Detect-HostIp {
    $candidates = Get-NetIPAddress |
        Where-Object {
            $_.AddressFamily -eq "IPv4" -and
            $_.IPAddress -notlike "127.*" -and
            $_.IPAddress -notlike "169.254.*" -and
            $_.InterfaceAlias -notmatch "vEthernet|Hyper-V|Docker|Loopback" -and
            ($_.PrefixOrigin -eq "Dhcp" -or $_.PrefixOrigin -eq "Manual")
        } |
        Sort-Object -Property InterfaceMetric

    if (-not $candidates) {
        throw "No se pudo detectar una IP física automáticamente. Usa -HostIp."
    }

    $chosen = $candidates | Select-Object -First 1
    return $chosen.IPAddress
}

function Update-ComposeFile {
    param(
        [string]$Path,
        [string]$HostIpValue,
        [string]$DbUser,
        [string]$DbPass,
        [string]$DbName
    )

    if (-not (Test-Path $Path)) {
        throw "No se encontró $Path"
    }

    $content = Get-Content $Path -Raw

    $databaseUrl = "postgresql://$DbUser`:$DbPass@$HostIpValue`:5432/$DbName"
    $dbPattern = 'DATABASE_URL:\s*"postgresql://[^\"]+"'
    if ($content -match $dbPattern) {
        $replacement = ("DATABASE_URL: ""{0}""" -f $databaseUrl)
        $content = $content -replace $dbPattern, $replacement
    } else {
        throw "No se encontró la clave DATABASE_URL en $Path"
    }

    $extraHostBlock = ("    extra_hosts:`r`n      - ""host.docker.internal:{0}""" -f $HostIpValue)
    $extraPattern = '    extra_hosts:(?:\s*\r?\n\s+- \"host\.docker\.internal:[^\"]+\")+'
    if ($content -match $extraPattern) {
        $content = $content -replace $extraPattern, $extraHostBlock
    } else {
        # insertar debajo de environment si no existe
        $environmentPattern = '    environment:(?:\s*\r?\n\s{6,}[^\r\n]+)+'
        if ($content -match $environmentPattern) {
            $content = $content -replace $environmentPattern, { param($match) "$match`r`n$extraHostBlock" }
        } else {
            throw "No se encontró donde insertar extra_hosts en $Path"
        }
    }

    Set-Content -Path $Path -Value $content -Encoding UTF8
    Write-Ok "docker-compose actualizado con IP $HostIpValue"
}

function Run-Compose {
    param(
        [string]$ComposeFilePath,
        [string[]]$ComposeArgs
    )

    $cmd = "docker-compose"
    $arguments = @("-f", $ComposeFilePath)
    if ($ComposeArgs) {
        $arguments += $ComposeArgs
    }

    Write-Info "$cmd $($arguments -join ' ')"
    & $cmd @arguments
}

function Refresh-PortProxy {
    param(
        [string]$ListenAddress,
        [int]$ListenPort,
        [string]$TargetAddress,
        [int]$TargetPort
    )

    netsh interface portproxy delete v4tov4 listenaddress=$ListenAddress listenport=$ListenPort | Out-Null
    netsh interface portproxy add v4tov4 listenaddress=$ListenAddress listenport=$ListenPort connectaddress=$TargetAddress connectport=$TargetPort | Out-Null
    Write-Ok "Portproxy $ListenPort -> $TargetAddress`:$TargetPort actualizado"
}

Write-Section "Refresco híbrido Avery"

if (-not $HostIp) {
    Write-Info "Buscando IP física del servidor..."
    $HostIp = Detect-HostIp
}

Write-Ok "Usando host IP $HostIp"

Write-Section "1) Actualizar docker-compose"
Update-ComposeFile -Path $ComposeFile -HostIpValue $HostIp -DbUser $PostgresUser -DbPass $PostgresPassword -DbName $PostgresDb

Write-Section "2) Reconstruir contenedores"
Run-Compose -ComposeFilePath $ComposeFile -Args @("down")
Run-Compose -ComposeFilePath $ComposeFile -Args @("build", "--no-cache")
Run-Compose -ComposeFilePath $ComposeFile -Args @("up", "-d")

Write-Section "3) Obtener IPs internas"
$backendIp = docker inspect -f '{{ .NetworkSettings.Networks."vehiculos-network".IPAddress }}' $BackendContainer
$frontendIp = docker inspect -f '{{ .NetworkSettings.Networks."vehiculos-network".IPAddress }}' $FrontendContainer
Write-Ok "Backend: $backendIp"
Write-Ok "Frontend: $frontendIp"

Write-Section "4) Portproxy"
Refresh-PortProxy -ListenAddress "0.0.0.0" -ListenPort $BackendPort -TargetAddress $backendIp -TargetPort $BackendPort
Refresh-PortProxy -ListenAddress "0.0.0.0" -ListenPort $FrontendPort -TargetAddress $frontendIp -TargetPort $FrontendContainerPort

Write-Section "5) Pruebas"
Start-Sleep -Seconds 5
try {
    $health = Invoke-WebRequest -Uri "http://localhost:$BackendPort/healthz" -UseBasicParsing -TimeoutSec 10
    Write-Ok "Backend healthz: $($health.StatusCode)"
} catch {
    Write-Warn "No se pudo obtener /healthz: $($_.Exception.Message)"
}

try {
    $front = Invoke-WebRequest -Uri "http://localhost:$FrontendPort" -UseBasicParsing -TimeoutSec 10
    Write-Ok "Frontend local: $($front.StatusCode)"
} catch {
    Write-Warn "Frontend no respondió localmente: $($_.Exception.Message)"
}

Write-Section "Resumen"
Write-Ok "DATABASE_URL apunta a $HostIp"
Write-Ok "Contenedores activos:"
Run-Compose -ComposeFilePath $ComposeFile -Args @("ps")
Write-Host "Ejecuta 'netsh interface portproxy show v4tov4' para validar las reglas" -ForegroundColor Yellow
