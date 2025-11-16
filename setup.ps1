# Script de Setup para Windows PowerShell
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Avery-Dennison Docker" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Paso 1: Detener todo
Write-Host "[1/4] Deteniendo contenedores..." -ForegroundColor Yellow
docker-compose down -v
docker-compose -f docker-compose.dev.yml down -v

# Paso 2: Limpiar imágenes viejas
Write-Host "[2/4] Limpiando imágenes viejas..." -ForegroundColor Yellow
docker rmi avery-dennison-backend avery-dennison-frontend -f 2>$null

# Paso 3: Reconstruir todo sin caché
Write-Host "[3/4] Reconstruyendo todo sin caché (esto tomará unos minutos)..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml build --no-cache

# Paso 4: Iniciar servicios
Write-Host "[4/4] Iniciando servicios..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml up -d

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup Completado!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Esperando que los servicios estén listos..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "Accede a la aplicación:" -ForegroundColor Cyan
Write-Host "  URL: http://localhost:8035" -ForegroundColor White
Write-Host ""
Write-Host "Credenciales de login:" -ForegroundColor Cyan
Write-Host "  Usuario: admin" -ForegroundColor White
Write-Host "  Contraseña: admin123" -ForegroundColor White
Write-Host ""
Write-Host "Ver logs en tiempo real:" -ForegroundColor Cyan
Write-Host "  docker-compose -f docker-compose.dev.yml logs -f" -ForegroundColor White
Write-Host ""
