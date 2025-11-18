# ============================================
# SCRIPT DE DEPLOYMENT AUTOMATICO
# Sistema de Gestion de Vehiculos y Entregas
# ============================================

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  DEPLOYMENT AUTOMATICO - WINDOWS SERVER" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si se ejecuta como Administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: Este script debe ejecutarse como Administrador" -ForegroundColor Red
    Write-Host "Haz clic derecho en PowerShell y selecciona 'Ejecutar como administrador'" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "Ejecutando como Administrador" -ForegroundColor Green
Write-Host ""

# ============================================
# 1. VERIFICAR DOCKER
# ============================================
Write-Host "[1/8] Verificando Docker Desktop..." -ForegroundColor Yellow

try {
    $dockerVersion = docker --version 2>$null
    Write-Host "Docker instalado: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Docker no esta instalado o no esta en el PATH" -ForegroundColor Red
    Write-Host "Por favor, instala Docker Desktop desde: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    pause
    exit 1
}

# Verificar que Docker este corriendo
Write-Host "Verificando que Docker Desktop este corriendo..." -ForegroundColor Cyan
$dockerRunning = $false
$maxRetries = 3
$retryCount = 0

while (-not $dockerRunning -and $retryCount -lt $maxRetries) {
    try {
        $result = docker ps 2>&1
        if ($LASTEXITCODE -eq 0) {
            $dockerRunning = $true
            Write-Host "Docker esta corriendo correctamente" -ForegroundColor Green
        }
    } catch {
        $dockerRunning = $false
    }
    
    if (-not $dockerRunning) {
        $retryCount++
        if ($retryCount -lt $maxRetries) {
            Write-Host "Docker Desktop no esta corriendo. Intento $retryCount de $maxRetries..." -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Verificando WSL2..." -ForegroundColor Cyan
            
            # Verificar y actualizar WSL2 si es necesario
            try {
                $wslStatus = wsl --status 2>&1
                if ($wslStatus -match "No se encuentra el archivo de kernel WSL 2" -or $wslStatus -match "kernel.*not found") {
                    Write-Host "WSL2 necesita actualizacion. Actualizando automaticamente..." -ForegroundColor Yellow
                    wsl --update
                    Write-Host "WSL2 actualizado. Reiniciando..." -ForegroundColor Green
                    Start-Sleep -Seconds 3
                }
            } catch {
                Write-Host "No se pudo verificar WSL2. Continuando..." -ForegroundColor Yellow
            }
            
            Write-Host ""
            Write-Host "PASOS PARA INICIAR DOCKER DESKTOP:" -ForegroundColor Cyan
            Write-Host "1. Busca 'Docker Desktop' en el menu Inicio" -ForegroundColor White
            Write-Host "2. Haz clic derecho y selecciona 'Ejecutar como administrador'" -ForegroundColor White
            Write-Host "3. Espera a que el icono de Docker aparezca en la bandeja del sistema" -ForegroundColor White
            Write-Host "4. El icono debe estar BLANCO (no gris) cuando este listo" -ForegroundColor White
            Write-Host "5. Esto puede tomar 1-2 minutos" -ForegroundColor White
            Write-Host ""
            Write-Host "Presiona Enter cuando Docker Desktop este corriendo..." -ForegroundColor Yellow
            Read-Host
        } else {
            Write-Host ""
            Write-Host "============================================" -ForegroundColor Red
            Write-Host "  ERROR: Docker Desktop NO esta corriendo" -ForegroundColor Red
            Write-Host "============================================" -ForegroundColor Red
            Write-Host ""
            
            # Verificar WSL2 antes de salir
            Write-Host "Verificando WSL2..." -ForegroundColor Cyan
            try {
                $wslStatus = wsl --status 2>&1
                if ($wslStatus -match "No se encuentra el archivo de kernel WSL 2" -or $wslStatus -match "kernel.*not found") {
                    Write-Host ""
                    Write-Host "PROBLEMA DETECTADO: WSL2 necesita actualizacion" -ForegroundColor Red
                    Write-Host ""
                    Write-Host "SOLUCION AUTOMATICA:" -ForegroundColor Yellow
                    Write-Host "Ejecuta este comando en PowerShell como Administrador:" -ForegroundColor White
                    Write-Host "  wsl --update" -ForegroundColor Cyan
                    Write-Host ""
                    Write-Host "Actualizando WSL2 ahora..." -ForegroundColor Yellow
                    wsl --update
                    Write-Host ""
                    Write-Host "WSL2 actualizado. Ahora:" -ForegroundColor Green
                    Write-Host "1. Reinicia Docker Desktop" -ForegroundColor White
                    Write-Host "2. Ejecuta este script nuevamente" -ForegroundColor White
                    Write-Host ""
                    pause
                    exit 1
                }
            } catch {
                # Continuar con instrucciones normales
            }
            
            Write-Host "SOLUCION:" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "1. Abre el menu Inicio de Windows" -ForegroundColor White
            Write-Host "2. Busca 'Docker Desktop'" -ForegroundColor White
            Write-Host "3. Haz clic derecho sobre 'Docker Desktop'" -ForegroundColor White
            Write-Host "4. Selecciona 'Ejecutar como administrador'" -ForegroundColor White
            Write-Host "5. Espera 1-2 minutos hasta que el icono de Docker" -ForegroundColor White
            Write-Host "   aparezca en la bandeja del sistema (abajo a la derecha)" -ForegroundColor White
            Write-Host "6. El icono debe estar BLANCO, NO gris" -ForegroundColor White
            Write-Host "7. Cuando este listo, ejecuta este script nuevamente" -ForegroundColor White
            Write-Host ""
            Write-Host "Si Docker Desktop no inicia:" -ForegroundColor Yellow
            Write-Host "- Ejecuta: wsl --update (en PowerShell como Administrador)" -ForegroundColor White
            Write-Host "- Reinicia tu computadora" -ForegroundColor White
            Write-Host "- Verifica que Hyper-V o WSL2 esten habilitados" -ForegroundColor White
            Write-Host "- Reinstala Docker Desktop si el problema persiste" -ForegroundColor White
            Write-Host ""
            pause
            exit 1
        }
    }
}

Write-Host ""

# ============================================
# 2. INSTALAR GIT SI NO EXISTE
# ============================================
Write-Host "[2/8] Verificando Git..." -ForegroundColor Yellow

$gitInstalled = $false
try {
    $gitVersion = git --version
    Write-Host "Git ya esta instalado: $gitVersion" -ForegroundColor Green
    $gitInstalled = $true
} catch {
    Write-Host "Git no esta instalado. Instalando Git..." -ForegroundColor Yellow
    
    # Descargar Git
    $gitInstallerUrl = "https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe"
    $gitInstallerPath = "$env:TEMP\GitInstaller.exe"
    
    Write-Host "Descargando Git..." -ForegroundColor Cyan
    try {
        Invoke-WebRequest -Uri $gitInstallerUrl -OutFile $gitInstallerPath -UseBasicParsing
        Write-Host "Git descargado" -ForegroundColor Green
        
        # Instalar Git silenciosamente
        Write-Host "Instalando Git (esto puede tomar unos minutos)..." -ForegroundColor Cyan
        Start-Process -FilePath $gitInstallerPath -ArgumentList "/VERYSILENT", "/NORESTART", "/NOCANCEL", "/SP-" -Wait
        
        # Agregar Git al PATH de la sesion actual
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        # Verificar instalacion
        Start-Sleep -Seconds 3
        try {
            $gitVersion = git --version
            Write-Host "Git instalado exitosamente: $gitVersion" -ForegroundColor Green
            $gitInstalled = $true
        } catch {
            Write-Host "ERROR: Git se instalo pero no se pudo verificar" -ForegroundColor Red
            Write-Host "Es posible que necesites reiniciar la terminal" -ForegroundColor Yellow
            pause
            exit 1
        }
        
        # Limpiar instalador
        Remove-Item $gitInstallerPath -Force -ErrorAction SilentlyContinue
        
    } catch {
        Write-Host "ERROR al descargar/instalar Git: $_" -ForegroundColor Red
        Write-Host "Descarga Git manualmente desde: https://git-scm.com/download/win" -ForegroundColor Yellow
        pause
        exit 1
    }
}

Write-Host ""

# ============================================
# 3. CONFIGURAR DIRECTORIO DE TRABAJO
# ============================================
Write-Host "[3/8] Configurando directorio de trabajo..." -ForegroundColor Yellow

# Usar el directorio actual como base
$deployPath = $PWD.Path

Write-Host "Usando directorio actual: $deployPath" -ForegroundColor Green

Write-Host ""

# ============================================
# 4. CLONAR O ACTUALIZAR REPOSITORIO
# ============================================
Write-Host "[4/8] Clonando/Actualizando proyecto desde GitHub..." -ForegroundColor Yellow

$repoUrl = "https://github.com/oesantama/Avery-dennison.git"
$projectPath = Join-Path $deployPath "Avery-dennison"

if (Test-Path (Join-Path $projectPath ".git")) {
    Write-Host "El proyecto ya existe. Actualizando..." -ForegroundColor Yellow
    Set-Location $projectPath
    
    try {
        git pull origin main
        Write-Host "Proyecto actualizado desde GitHub" -ForegroundColor Green
    } catch {
        Write-Host "ERROR al actualizar: $_" -ForegroundColor Red
        Write-Host "Continuando con la version actual..." -ForegroundColor Yellow
    }
} else {
    Write-Host "Clonando repositorio..." -ForegroundColor Cyan
    Set-Location $deployPath
    
    try {
        git clone $repoUrl
        Write-Host "Proyecto clonado exitosamente en $projectPath" -ForegroundColor Green
        Set-Location $projectPath
    } catch {
        Write-Host "ERROR al clonar: $_" -ForegroundColor Red
        Write-Host "Verifica tu conexion a internet y que tengas acceso al repositorio" -ForegroundColor Yellow
        pause
        exit 1
    }
}

# Crear archivo index.html de redireccion en la carpeta raiz
Write-Host "Creando index.html de redireccion..." -ForegroundColor Cyan
$indexPath = Join-Path $deployPath "index.html"
$indexContent = @"
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="refresh" content="0; url=http://avery.millasiete.com:8035">
    <title>Redirigiendo...</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            text-align: center;
            padding: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
        }
        h1 {
            font-size: 2em;
            margin-bottom: 20px;
        }
        .spinner {
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        a {
            color: white;
            text-decoration: none;
            font-size: 1.1em;
            border: 2px solid white;
            padding: 10px 30px;
            border-radius: 25px;
            display: inline-block;
            margin-top: 20px;
            transition: all 0.3s;
        }
        a:hover {
            background: white;
            color: #667eea;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Sistema de Gestion de Vehiculos</h1>
        <div class="spinner"></div>
        <p>Redirigiendo al sistema...</p>
        <a href="http://avery.millasiete.com:8035">Ir al Sistema</a>
    </div>
</body>
</html>
"@

$indexContent | Out-File -FilePath $indexPath -Encoding UTF8 -Force
Write-Host "Index.html creado en $deployPath" -ForegroundColor Green

Write-Host ""

# ============================================
# 5. CONFIGURAR FIREWALL
# ============================================
Write-Host "[5/8] Configurando Firewall de Windows..." -ForegroundColor Yellow

# Eliminar reglas existentes (si existen)
Remove-NetFirewallRule -DisplayName "Vehiculos - Frontend" -ErrorAction SilentlyContinue
Remove-NetFirewallRule -DisplayName "Vehiculos - Backend" -ErrorAction SilentlyContinue
Remove-NetFirewallRule -DisplayName "Vehiculos - Database" -ErrorAction SilentlyContinue

# Crear nuevas reglas
New-NetFirewallRule -DisplayName "Vehiculos - Frontend" -Direction Inbound -Protocol TCP -LocalPort 8035 -Action Allow | Out-Null
New-NetFirewallRule -DisplayName "Vehiculos - Backend" -Direction Inbound -Protocol TCP -LocalPort 3035 -Action Allow | Out-Null
New-NetFirewallRule -DisplayName "Vehiculos - Database" -Direction Inbound -Protocol TCP -LocalPort 5432 -Action Allow | Out-Null

Write-Host "Reglas de firewall configuradas:" -ForegroundColor Green
Write-Host "   - Puerto 8035 (Frontend)" -ForegroundColor White
Write-Host "   - Puerto 3035 (Backend API)" -ForegroundColor White
Write-Host "   - Puerto 5432 (PostgreSQL)" -ForegroundColor White

Write-Host ""

# ============================================
# 6. CONFIGURAR VARIABLES DE ENTORNO
# ============================================
Write-Host "[6/8] Configurando variables de entorno..." -ForegroundColor Yellow

$envFile = Join-Path $projectPath ".env"

# Obtener IP del servidor
$serverIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*"} | Select-Object -First 1).IPAddress

# Preguntar por el dominio/IP a usar
Write-Host ""
Write-Host "Como accederan al sistema?" -ForegroundColor Cyan
Write-Host "1) Dominio: http://avery.millasiete.com:8035 (Recomendado)" -ForegroundColor White
Write-Host "2) IP del servidor: http://${serverIP}:8035" -ForegroundColor White
Write-Host "3) Localhost: http://localhost:8035" -ForegroundColor White
$opcionAcceso = Read-Host "Selecciona una opcion (1-3)"

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

Write-Host "URL Frontend: $frontendUrl" -ForegroundColor Green
Write-Host "URL Backend: $backendUrl" -ForegroundColor Green

# Generar secreto seguro
$secretKey = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})

$envContent = @"
# ============================================
# CONFIGURACION DE PRODUCCION
# Generado automaticamente: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
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
Write-Host "Archivo .env creado con configuracion segura" -ForegroundColor Green

Write-Host ""

# ============================================
# 7. CONSTRUIR E INICIAR CONTENEDORES
# ============================================
Write-Host "[7/8] Construyendo e iniciando contenedores Docker..." -ForegroundColor Yellow

# Detener contenedores existentes
Write-Host "Deteniendo contenedores existentes..." -ForegroundColor Cyan
docker-compose down 2>$null

# Construir imagenes
Write-Host "Construyendo imagenes (esto puede tomar 5-10 minutos)..." -ForegroundColor Cyan
docker-compose build --no-cache

if ($LASTEXITCODE -eq 0) {
    Write-Host "Imagenes construidas exitosamente" -ForegroundColor Green
} else {
    Write-Host "ERROR al construir imagenes" -ForegroundColor Red
    pause
    exit 1
}

# Iniciar servicios
Write-Host "Iniciando servicios..." -ForegroundColor Cyan
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "Servicios iniciados correctamente" -ForegroundColor Green
} else {
    Write-Host "ERROR al iniciar servicios" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""

# ============================================
# 8. VERIFICAR SERVICIOS
# ============================================
Write-Host "[8/8] Verificando servicios..." -ForegroundColor Yellow

# Esperar a que los contenedores esten listos
Write-Host "Esperando a que los servicios esten listos (30 segundos)..." -ForegroundColor Cyan
Start-Sleep -Seconds 30

# Verificar estado de contenedores
Write-Host ""
Write-Host "Estado de los contenedores:" -ForegroundColor Cyan
docker-compose ps

Write-Host ""

# Verificar logs
Write-Host "Ultimas lineas de logs:" -ForegroundColor Cyan
Write-Host ""
Write-Host "--- Backend ---" -ForegroundColor Yellow
docker-compose logs --tail=5 vehiculos-backend
Write-Host ""
Write-Host "--- Frontend ---" -ForegroundColor Yellow
docker-compose logs --tail=5 vehiculos-frontend

Write-Host ""

# ============================================
# 9. INFORMACION DE ACCESO
# ============================================
Write-Host "=========================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT COMPLETADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

# Obtener IP del servidor
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*"} | Select-Object -First 1).IPAddress

Write-Host "ACCESO AL SISTEMA:" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Gray
Write-Host ""
Write-Host "  Frontend (Aplicacion Web):" -ForegroundColor White
Write-Host "  - Dominio: $frontendUrl" -ForegroundColor Green
Write-Host "  - Local:   http://localhost:8035" -ForegroundColor Green
Write-Host "  - IP:      http://${ipAddress}:8035" -ForegroundColor Green
Write-Host ""
Write-Host "  Backend API:" -ForegroundColor White
Write-Host "  - Dominio: $backendUrl" -ForegroundColor Yellow
Write-Host "  - Local:   http://localhost:3035" -ForegroundColor Yellow
Write-Host "  - IP:      http://${ipAddress}:3035" -ForegroundColor Yellow
Write-Host "  - Docs:    $backendUrl/docs" -ForegroundColor Yellow
Write-Host ""
Write-Host "  PostgreSQL Database:" -ForegroundColor White
Write-Host "  - Host:   localhost:5432" -ForegroundColor Cyan
Write-Host "  - User:   vehiculos_user" -ForegroundColor Cyan
Write-Host "  - DB:     vehiculos_db" -ForegroundColor Cyan
Write-Host ""
Write-Host "==========================================" -ForegroundColor Gray
Write-Host ""

Write-Host "CREDENCIALES INICIALES:" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Gray
Write-Host "  Usuario:    admin" -ForegroundColor White
Write-Host "  Contrasena: admin123" -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Gray
Write-Host ""

Write-Host "IMPORTANTE:" -ForegroundColor Yellow
Write-Host "  - El sistema trabaja con HTTP (sin certificado SSL)" -ForegroundColor White
Write-Host "  - Cambia la contrasena del usuario admin despues del primer login" -ForegroundColor White
Write-Host "  - Crea usuarios con roles especificos segun sea necesario" -ForegroundColor White
Write-Host "  - Configura backups automaticos de la base de datos" -ForegroundColor White
Write-Host ""

Write-Host "COMANDOS UTILES:" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Gray
Write-Host "  Ver logs:       docker-compose logs -f" -ForegroundColor White
Write-Host "  Reiniciar:      docker-compose restart" -ForegroundColor White
Write-Host "  Detener:        docker-compose stop" -ForegroundColor White
Write-Host "  Iniciar:        docker-compose start" -ForegroundColor White
Write-Host "  Ver estado:     docker-compose ps" -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Gray
Write-Host ""

Write-Host "UBICACION DEL PROYECTO:" -ForegroundColor Cyan
Write-Host "  $projectPath" -ForegroundColor White
Write-Host ""

Write-Host "Sistema listo para usar!" -ForegroundColor Green
Write-Host ""

# Preguntar si desea abrir el navegador
$openBrowser = Read-Host "Deseas abrir el sistema en el navegador? (S/N)"
if ($openBrowser -eq "S" -or $openBrowser -eq "s") {
    Start-Process $frontendUrl
}

Write-Host ""
Write-Host "Presiona cualquier tecla para salir..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
