@echo off
REM ========================================
REM Script de Inicio Automático - Avery Dennison
REM ========================================
REM Ubicación: C:\M7Aplicaciones\Avery\start-avery.bat
REM Este script inicia el proyecto desde la carpeta correcta

TITLE Avery Dennison - Sistema de Entregas
COLOR 0A

echo ========================================
echo   Avery Dennison - Docker Deployment
echo ========================================
echo.

REM Cambiar al directorio del proyecto
cd /d "C:\M7Aplicaciones\Avery\Avery-dennison"

IF NOT EXIST "docker-compose.hybrid.yml" (
    echo [ERROR] No se encuentra docker-compose.hybrid.yml
    echo [INFO] Directorio actual: %CD%
    pause
    exit /b 1
)

echo [1/5] Directorio del proyecto: %CD%
echo.

REM Actualizar código desde Git (opcional)
echo [2/5] Actualizando codigo desde Git...
git pull origin main
IF ERRORLEVEL 1 (
    echo [WARN] No se pudo actualizar desde Git. Continuando...
)
echo.

REM Detener contenedores existentes
echo [3/5] Deteniendo contenedores anteriores...
docker-compose -f docker-compose.hybrid.yml down
echo.

REM Construir imágenes (solo si hay cambios)
echo [4/5] Construyendo imagenes Docker...
docker-compose -f docker-compose.hybrid.yml build
IF ERRORLEVEL 1 (
    echo [ERROR] Fallo en la construccion de imagenes
    pause
    exit /b 1
)
echo.

REM Iniciar servicios
echo [5/5] Iniciando servicios...
docker-compose -f docker-compose.hybrid.yml up -d
IF ERRORLEVEL 1 (
    echo [ERROR] Fallo al iniciar servicios
    pause
    exit /b 1
)
echo.

REM Verificar estado
echo ========================================
echo   Estado de los Contenedores
echo ========================================
docker-compose -f docker-compose.hybrid.yml ps
echo.

echo ========================================
echo   SISTEMA INICIADO EXITOSAMENTE
echo ========================================
echo.
echo   Frontend: http://avery.millasiete.com:8035
echo   Backend:  http://avery.millasiete.com:3035
echo   Logs:     docker-compose -f docker-compose.hybrid.yml logs -f
echo.
echo Presiona cualquier tecla para ver los logs en tiempo real...
pause >nul

REM Mostrar logs
docker-compose -f docker-compose.hybrid.yml logs -f
