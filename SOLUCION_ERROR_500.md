# 🚀 SOLUCIÓN RÁPIDA - Error 500 en IIS

## ❌ Problema

El `web.config` con URL Rewrite causa error 500 porque falta el módulo URL Rewrite de IIS.

## ✅ SOLUCIÓN SIMPLE (SIN IIS)

### Opción 1: Solo usar el puerto 8035 (MÁS SIMPLE) ⭐

**EN EL SERVIDOR:**

```powershell
# 1. Ir al proyecto
cd C:\M7Aplicaciones\Avery\Avery-dennison

# 2. Actualizar código
git pull origin main

# 3. Iniciar Docker
docker-compose -f docker-compose.hybrid.yml up -d

# 4. Verificar
docker-compose ps
```

**✅ Acceso directo:** `http://avery.millasiete.com:8035`

---

### Opción 2: IIS con Redirección Automática (RECOMENDADO) 🔥

**EN EL SERVIDOR (como Administrador):**

```powershell
# 1. Ir al proyecto
cd C:\M7Aplicaciones\Avery\Avery-dennison

# 2. Actualizar código
git pull origin main

# 3. Ejecutar script de configuración automática
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\setup-iis.ps1
```

**El script `setup-iis.ps1` hace TODO automáticamente:**

- ✅ Instala IIS (si no está instalado)
- ✅ Crea el sitio web
- ✅ Copia `index.html` y `web.config`
- ✅ Configura permisos
- ✅ Configura firewall
- ✅ Inicia el sitio

**Resultado:**

- `http://localhost` → Redirige a `http://avery.millasiete.com:8035`
- `http://avery.millasiete.com` → Redirige a `http://avery.millasiete.com:8035`

---

### Opción 3: Copiar archivos manualmente

**Si prefieres hacerlo manual:**

```powershell
# 1. Actualizar código
cd C:\M7Aplicaciones\Avery\Avery-dennison
git pull origin main

# 2. Copiar archivos
copy index.html C:\M7Aplicaciones\Avery\index.html
copy web.config C:\M7Aplicaciones\Avery\web.config
copy start-avery.bat C:\M7Aplicaciones\Avery\start-avery.bat

# 3. Configurar IIS manualmente:
# - Abrir IIS Manager
# - Crear sitio apuntando a C:\M7Aplicaciones\Avery
# - Puerto 80, hostname: avery.millasiete.com
# - Document por defecto: index.html

# 4. Iniciar Docker
cd C:\M7Aplicaciones\Avery
.\start-avery.bat
```

---

## 📊 ¿Qué hace cada archivo?

| Archivo           | Función                                              |
| ----------------- | ---------------------------------------------------- |
| `index.html`      | Redirección automática HTML (NO requiere módulos)    |
| `web.config`      | Configuración IIS básica (SIN URL Rewrite)           |
| `start-avery.bat` | Inicia Docker automáticamente desde carpeta correcta |
| `setup-iis.ps1`   | Configura IIS completamente de forma automática      |

---

## 🔧 Troubleshooting

### Error: "Puerto 80 ya en uso"

```powershell
# Detener Default Web Site
Import-Module WebAdministration
Stop-Website -Name "Default Web Site"
```

### Error: "No se puede ejecutar setup-iis.ps1"

```powershell
# Permitir ejecución de scripts
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Ejecutar como administrador
# Clic derecho en PowerShell → "Ejecutar como administrador"
```

### Error: "index.html no redirige"

```powershell
# Verificar que el archivo está en la carpeta correcta
Test-Path C:\M7Aplicaciones\Avery\index.html

# Si no existe, copiar desde el proyecto
copy C:\M7Aplicaciones\Avery\Avery-dennison\index.html C:\M7Aplicaciones\Avery\
```

### Error: "Docker no inicia"

```powershell
# Ver logs
cd C:\M7Aplicaciones\Avery\Avery-dennison
docker-compose -f docker-compose.hybrid.yml logs --tail=50

# Verificar puertos
netstat -ano | findstr "8035 3035 5432"
```

---

## 🎯 MI RECOMENDACIÓN

**Para producción urgente (5 minutos):**

```powershell
# EN EL SERVIDOR (PowerShell como Administrador)
cd C:\M7Aplicaciones\Avery\Avery-dennison
git pull origin main
.\setup-iis.ps1
```

**Eso es todo.** El script configura IIS y la redirección automáticamente.

**URLs finales:**

- ✅ `http://localhost` → Redirige a :8035
- ✅ `http://avery.millasiete.com` → Redirige a :8035
- ✅ `http://avery.millasiete.com:8035` → Aplicación directa

---

## 📞 Soporte Adicional

Si el script `setup-iis.ps1` falla, usa la **Opción 1** (solo puerto 8035) que **SIEMPRE funciona**.

```powershell
cd C:\M7Aplicaciones\Avery\Avery-dennison
docker-compose -f docker-compose.hybrid.yml up -d
```

**Acceso:** `http://avery.millasiete.com:8035` ✅
