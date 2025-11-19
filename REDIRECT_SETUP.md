# 🚀 Guía de Configuración de Redirección Automática
# Avery Dennison - Sistema de Gestión de Entregas

## 📋 Problema
El dominio `http://avery.millasiete.com:8035` apunta a `C:\M7Aplicaciones\Avery` pero el proyecto está en `C:\M7Aplicaciones\Avery\Avery-dennison`.

## ✅ Soluciones Disponibles

---

## **SOLUCIÓN 1: HTML Estático (MÁS SIMPLE)** ⭐ RECOMENDADO

### Pasos:
1. **Copiar el archivo `index.html` a la carpeta raíz:**
   ```powershell
   # EN EL SERVIDOR
   cd C:\M7Aplicaciones\Avery\Avery-dennison
   copy index.html C:\M7Aplicaciones\Avery\index.html
   ```

2. **Configurar IIS (si está instalado):**
   - Abrir IIS Manager
   - Crear sitio web apuntando a `C:\M7Aplicaciones\Avery`
   - Puerto: 80 o el que uses
   - Binding: `avery.millasiete.com`

3. **Verificar:**
   - Acceder a: `http://avery.millasiete.com`
   - Debe redirigir automáticamente al puerto 8035

### Ventajas:
- ✅ No requiere software adicional
- ✅ Funciona con cualquier servidor web
- ✅ Redirección automática con HTML + JavaScript + Meta Refresh (triple redundancia)
- ✅ Interfaz visual moderna mientras redirige

---

## **SOLUCIÓN 2: Script PowerShell** 🔥 MÁS POTENTE

### Pasos:
1. **Copiar el script:**
   ```powershell
   # EN EL SERVIDOR
   cd C:\M7Aplicaciones\Avery\Avery-dennison
   copy redirect-server.ps1 C:\M7Aplicaciones\Avery\redirect-server.ps1
   ```

2. **Ejecutar el servidor de redirección:**
   ```powershell
   cd C:\M7Aplicaciones\Avery
   
   # Permitir ejecución de scripts (solo primera vez)
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   
   # Iniciar servidor
   .\redirect-server.ps1
   ```

3. **Configurar como servicio de Windows (opcional):**
   ```powershell
   # Crear tarea programada que inicie al arrancar
   $action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
       -Argument "-ExecutionPolicy Bypass -File C:\M7Aplicaciones\Avery\redirect-server.ps1"
   
   $trigger = New-ScheduledTaskTrigger -AtStartup
   
   $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -RunLevel Highest
   
   Register-ScheduledTask -TaskName "AveryRedirectServer" `
       -Action $action `
       -Trigger $trigger `
       -Principal $principal `
       -Description "Servidor de redirección automática para Avery Dennison"
   ```

### Ventajas:
- ✅ Servidor HTTP completo en PowerShell
- ✅ Logging de todas las solicitudes
- ✅ Interfaz visual HTML personalizada
- ✅ Puede ejecutarse como servicio de Windows

---

## **SOLUCIÓN 3: IIS con URL Rewrite**

### Requisitos:
1. IIS instalado
2. URL Rewrite Module: https://www.iis.net/downloads/microsoft/url-rewrite

### Pasos:
1. **Instalar URL Rewrite Module:**
   ```powershell
   # Con Chocolatey
   choco install urlrewrite -y
   
   # O descargar desde: https://www.iis.net/downloads/microsoft/url-rewrite
   ```

2. **Copiar web.config:**
   ```powershell
   cd C:\M7Aplicaciones\Avery\Avery-dennison
   copy web.config C:\M7Aplicaciones\Avery\web.config
   ```

3. **Configurar IIS:**
   - Abrir IIS Manager
   - Crear sitio en `C:\M7Aplicaciones\Avery`
   - El `web.config` hará la redirección automáticamente

### Ventajas:
- ✅ Integración completa con IIS
- ✅ Redirección HTTP 301 (permanente)
- ✅ Opción de proxy reverso sin cambiar URL
- ✅ Headers de seguridad incluidos

---

## **SOLUCIÓN 4: Iniciar desde Carpeta Correcta Siempre**

### Opción A: Script Batch Automático

1. **Copiar el script:**
   ```powershell
   cd C:\M7Aplicaciones\Avery\Avery-dennison
   copy start-avery.bat C:\M7Aplicaciones\Avery\start-avery.bat
   ```

2. **Crear acceso directo en el Escritorio:**
   - Clic derecho en `start-avery.bat`
   - "Enviar a" → "Escritorio (crear acceso directo)"
   - Cambiar propiedades: "Ejecutar como administrador"

3. **Configurar inicio automático:**
   ```powershell
   # Crear tarea programada
   $action = New-ScheduledTaskAction -Execute "C:\M7Aplicaciones\Avery\start-avery.bat"
   $trigger = New-ScheduledTaskTrigger -AtStartup
   $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -RunLevel Highest
   
   Register-ScheduledTask -TaskName "AveryDockerStartup" `
       -Action $action `
       -Trigger $trigger `
       -Principal $principal `
       -Description "Inicia automáticamente Avery Dennison al arrancar Windows"
   ```

### Opción B: Modificar docker-compose.yml

**Actualizar docker-compose.hybrid.yml para usar rutas absolutas:**
```yaml
# En la raíz del proyecto
services:
  backend:
    build:
      context: C:/M7Aplicaciones/Avery/Avery-dennison/backend
      dockerfile: Dockerfile.windows
    # ... resto de configuración
  
  frontend:
    build:
      context: C:/M7Aplicaciones/Avery/Avery-dennison/frontend
      dockerfile: Dockerfile.windows
    # ... resto de configuración
```

---

## **SOLUCIÓN 5: Reverse Proxy con Nginx (Avanzado)**

### Pasos:
1. **Instalar Nginx para Windows:**
   ```powershell
   choco install nginx -y
   ```

2. **Configurar nginx.conf:**
   ```nginx
   # C:\tools\nginx\conf\nginx.conf
   
   http {
       server {
           listen 80;
           server_name avery.millasiete.com;
           
           location / {
               proxy_pass http://localhost:8035;
               proxy_set_header Host $host;
               proxy_set_header X-Real-IP $remote_addr;
               proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
               proxy_set_header X-Forwarded-Proto $scheme;
           }
       }
   }
   ```

3. **Iniciar Nginx:**
   ```powershell
   cd C:\tools\nginx
   start nginx
   ```

### Ventajas:
- ✅ Proxy reverso profesional
- ✅ No cambia URL visible al usuario
- ✅ Soporte SSL/HTTPS
- ✅ Balanceo de carga si es necesario

---

## 📊 Comparación de Soluciones

| Solución | Complejidad | Confiabilidad | Requisitos | Recomendado Para |
|----------|-------------|---------------|------------|------------------|
| HTML Estático | ⭐ Muy Fácil | ⭐⭐⭐ Alta | Ninguno | Pruebas rápidas |
| PowerShell | ⭐⭐ Fácil | ⭐⭐⭐⭐ Muy Alta | PowerShell | Servidores dedicados |
| IIS + URL Rewrite | ⭐⭐⭐ Media | ⭐⭐⭐⭐⭐ Excelente | IIS instalado | Producción con IIS |
| Script Batch | ⭐ Muy Fácil | ⭐⭐⭐⭐ Alta | Ninguno | Inicio automático |
| Nginx | ⭐⭐⭐⭐ Alta | ⭐⭐⭐⭐⭐ Excelente | Nginx instalado | Producción profesional |

---

## 🎯 Mi Recomendación

**Para tu caso específico (producción con retraso):**

### INMEDIATO (5 minutos):
```powershell
# EN EL SERVIDOR: C:\M7Aplicaciones\Avery
cd Avery-dennison
git pull origin main
copy index.html ..\index.html
copy start-avery.bat ..\start-avery.bat

# Iniciar proyecto
cd ..
.\start-avery.bat
```

### LARGO PLAZO (10 minutos):
1. Instalar IIS si no está instalado
2. Copiar `web.config` a `C:\M7Aplicaciones\Avery\`
3. Configurar sitio en IIS
4. Usar `start-avery.bat` para Docker

---

## 🔧 Verificación

### Comprobar que funciona:
```powershell
# Test 1: Verificar contenedores
docker-compose -f C:\M7Aplicaciones\Avery\Avery-dennison\docker-compose.hybrid.yml ps

# Test 2: Verificar puertos
netstat -ano | findstr "8035 3035 5432"

# Test 3: Verificar acceso
Invoke-WebRequest http://localhost:8035 | Select-Object StatusCode

# Test 4: Desde navegador externo
# http://avery.millasiete.com:8035
```

---

## 🆘 Troubleshooting

### Error: "Puerto 8035 ya en uso"
```powershell
# Encontrar proceso usando el puerto
netstat -ano | findstr ":8035"

# Matar proceso (reemplaza PID)
taskkill /PID <PID> /F
```

### Error: "No se puede acceder desde fuera"
```powershell
# Verificar firewall
New-NetFirewallRule -DisplayName "Avery Port 8035" `
    -Direction Inbound `
    -LocalPort 8035 `
    -Protocol TCP `
    -Action Allow
```

### Error: "Contenedores no inician"
```powershell
# Ver logs detallados
cd C:\M7Aplicaciones\Avery\Avery-dennison
docker-compose -f docker-compose.hybrid.yml logs --tail=100
```

---

## 📞 Soporte

Si tienes problemas:
1. Verificar logs: `docker-compose logs -f`
2. Verificar puertos: `netstat -ano | findstr "8035"`
3. Verificar firewall: `Get-NetFirewallRule | Where-Object {$_.LocalPort -eq 8035}`

---

## 🚀 Deployment Final

```powershell
# Script completo de deployment
cd C:\M7Aplicaciones\Avery\Avery-dennison

# 1. Actualizar código
git pull origin main

# 2. Construir imágenes
docker-compose -f docker-compose.hybrid.yml build

# 3. Iniciar servicios
docker-compose -f docker-compose.hybrid.yml up -d

# 4. Verificar estado
docker-compose -f docker-compose.hybrid.yml ps

# 5. Ver logs
docker-compose -f docker-compose.hybrid.yml logs -f
```

**✅ Sistema listo en http://avery.millasiete.com:8035**
