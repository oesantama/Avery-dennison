param(
	[string]$PostgresServiceName = "postgresql-x64-15",
	[string]$PostgresDataPath,
	[string]$DockerSubnet = "172.16.0.0/12",
	[int]$PostgresPort = 5432
)

$ErrorActionPreference = "Stop"

function Write-Section($Message) {
	Write-Host "`n=== $Message ===" -ForegroundColor Cyan
}

function Write-Info($Message) {
	Write-Host "[INFO] $Message" -ForegroundColor Gray
}

function Write-Success($Message) {
	Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warn($Message) {
	Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Resolve-PostgresDataPath {
	param(
		[string]$ServiceName,
		[string]$ExplicitPath
	)

	if ($ExplicitPath) {
		return (Resolve-Path $ExplicitPath).Path
	}

	$registryRoots = @(
		"HKLM:\SOFTWARE\PostgreSQL\Services\$ServiceName",
		"HKLM:\SOFTWARE\WOW6432Node\PostgreSQL\Services\$ServiceName"
	)

	foreach ($root in $registryRoots) {
		if (Test-Path $root) {
			$props = Get-ItemProperty -Path $root
			if ($props -and $props.DataDirectory) {
				return $props.DataDirectory
			}
		}
	}

	throw "No se pudo determinar la ruta de datos de PostgreSQL. Usa -PostgresDataPath para especificarla."
}

function Backup-File {
	param(
		[string]$Path
	)

	$timestamp = Get-Date -Format "yyyyMMddHHmmss"
	$backupPath = "$Path.$timestamp.bak"
	Copy-Item -Path $Path -Destination $backupPath -Force
	Write-Info "Backup creado: $backupPath"
}

function Ensure-ListenAddresses {
	param(
		[string]$ConfPath
	)

	$content = Get-Content -Path $ConfPath -Raw
	if ($content -match "listen_addresses\s*=\s*'\*'") {
		Write-Info "listen_addresses ya permite todas las interfaces."
		return
	}

	Backup-File -Path $ConfPath

	if ($content -match "listen_addresses\s*=") {
		$content = $content -replace "listen_addresses\s*=\s*'.*?'", "listen_addresses = '*'"
	} else {
		$content += "`nlisten_addresses = '*'`n"
	}

	Set-Content -Path $ConfPath -Value $content -Encoding UTF8
	Write-Success "listen_addresses actualizado a '*'."
}

function Ensure-HbaEntry {
	param(
		[string]$HbaPath,
		[string]$Subnet,
		[string]$AuthMethod = "scram-sha-256"
	)

	$entry = "host    all             all             $Subnet            $AuthMethod"
	$content = Get-Content -Path $HbaPath -Raw
	$escapedSubnet = [regex]::Escape($Subnet)
	$existingPattern = [regex]"host\s+all\s+all\s+$escapedSubnet\s+\S+"

	if ($content -match [regex]::Escape($entry)) {
		Write-Info "pg_hba.conf ya contiene la subred $Subnet con $AuthMethod."
		return
	}

	Backup-File -Path $HbaPath

	if ($existingPattern.IsMatch($content)) {
		$content = $existingPattern.Replace($content, $entry, 1)
		Write-Info "Entrada existente para $Subnet actualizada a $AuthMethod."
	} else {
		$content += "`n# Agregado automaticamente para contenedores Docker`n$entry"
		Write-Success "Entrada pg_hba.conf agregada para $Subnet."
	}

	Set-Content -Path $HbaPath -Value $content -Encoding UTF8
}

function Ensure-FirewallRule {
	param(
		[string]$Subnet,
		[int]$Port
	)

	$ruleName = "PostgreSQL $Port desde Docker"
	$rule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue

	if ($rule) {
		Set-NetFirewallRule `
			-DisplayName $ruleName `
			-Enabled True `
			-Action Allow `
			-Direction Inbound `
			-Protocol TCP `
			-LocalPort $Port `
			-RemoteAddress $Subnet | Out-Null
		Write-Info "Regla de firewall existente actualizada."
	} else {
		New-NetFirewallRule `
			-DisplayName $ruleName `
			-Direction Inbound `
			-Action Allow `
			-Protocol TCP `
			-LocalPort $Port `
			-RemoteAddress $Subnet | Out-Null
		Write-Success "Regla de firewall creada para permitir $Subnet -> puerto $Port."
	}
}

function Restart-PostgresService {
	param(
		[string]$ServiceName
	)

	Write-Info "Reiniciando servicio $ServiceName..."
	Restart-Service -Name $ServiceName -Force -ErrorAction Stop
	Start-Sleep -Seconds 3
	Write-Success "Servicio $ServiceName reiniciado."
}

Write-Section "Configurando PostgreSQL para contenedores Docker"
Write-Info "Servicio: $PostgresServiceName"

$dataPath = Resolve-PostgresDataPath -ServiceName $PostgresServiceName -ExplicitPath $PostgresDataPath
Write-Info "Data directory: $dataPath"

$confPath = Join-Path $dataPath "postgresql.conf"
$hbaPath = Join-Path $dataPath "pg_hba.conf"

if (-not (Test-Path $confPath)) { throw "No se encontró $confPath" }
if (-not (Test-Path $hbaPath)) { throw "No se encontró $hbaPath" }

Ensure-ListenAddresses -ConfPath $confPath
Ensure-HbaEntry -HbaPath $hbaPath -Subnet $DockerSubnet -AuthMethod "scram-sha-256"
Ensure-FirewallRule -Subnet $DockerSubnet -Port $PostgresPort
Restart-PostgresService -ServiceName $PostgresServiceName

Write-Section "Listo"
Write-Success "PostgreSQL ahora acepta conexiones desde $DockerSubnet en el puerto $PostgresPort."
Write-Host "Ejecuta nuevamente docker-compose para reconstruir el backend si aún no lo hiciste." -ForegroundColor Cyan