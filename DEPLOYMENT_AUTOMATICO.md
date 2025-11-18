# ⚡ Deployment Automático - Windows Server

## 🎯 Requisito Único: Docker Desktop Instalado

Este script automatiza **TODO** el proceso de deployment. Solo necesitas tener **Docker Desktop instalado**.

---

## 🚀 Instalación Rápida (3 Pasos)

### **Paso 1: Descargar el Script**

Abre **PowerShell como Administrador** y ejecuta:

```powershell
cd C:\
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/oesantama/Avery-dennison/main/deploy-automatico.ps1" -OutFile "deploy-automatico.ps1"
```

### **Paso 2: Ejecutar el Script**

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy-automatico.ps1
```

### **Paso 3: Seguir las Instrucciones en Pantalla**

El script te preguntará:

- ¿Dónde desplegar? (Recomendado: `C:\inetpub\vehiculos-app`)
- Esperará confirmaciones en pasos críticos

---

## 📦 ¿Qué Hace el Script Automáticamente?

| Paso | Acción                                                | Tiempo  |
| ---- | ----------------------------------------------------- | ------- |
| 1️⃣   | Verifica que Docker esté instalado y corriendo        | 5 seg   |
| 2️⃣   | **Instala Git automáticamente** (si no existe)        | 2 min   |
| 3️⃣   | Crea directorio de deployment                         | 5 seg   |
| 4️⃣   | **Clona el proyecto desde GitHub**                    | 1 min   |
| 5️⃣   | Configura firewall (puertos 8035, 3035, 5432)         | 10 seg  |
| 6️⃣   | Crea archivo `.env` con configuración segura          | 5 seg   |
| 7️⃣   | **Construye imágenes Docker** (backend, frontend, db) | 5-8 min |
| 8️⃣   | Inicia todos los servicios en contenedores            | 30 seg  |
| 9️⃣   | Verifica que todo esté funcionando                    | 30 seg  |

**⏱️ Tiempo Total:** 10-15 minutos

---

## ✅ Resultado Final

Al finalizar, el script mostrará:

```
=========================================
  ✅ DEPLOYMENT COMPLETADO EXITOSAMENTE
=========================================

🌐 ACCESO AL SISTEMA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Frontend (Aplicación Web):
  • Dominio: http://avery.millasiete.com:8035
  • Local:   http://localhost:8035
  • IP:      http://192.168.1.100:8035

  Backend API:
  • Dominio: http://avery.millasiete.com:3035
  • Local:   http://localhost:3035
  • Docs:   http://localhost:3035/docs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔑 CREDENCIALES INICIALES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Usuario:    admin
  Contraseña: admin123
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

> **⚠️ Nota Importante:** El sistema trabaja con **HTTP** (sin certificado SSL). Si necesitas HTTPS, deberás configurar un certificado SSL posteriormente.

---

## 🌐 Configuración del Dominio

El script te preguntará cómo accederán al sistema:

1. **Dominio (Recomendado):** `http://avery.millasiete.com:8035`

   - Requiere que el DNS apunte al servidor
   - Funciona sin certificado SSL (HTTP)

2. **IP del Servidor:** `http://192.168.x.x:8035`

   - Acceso directo por IP de red
   - Útil para redes internas

3. **Localhost:** `http://localhost:8035`
   - Solo acceso local desde el servidor

---

## 🔧 Si Ya Tienes Git Instalado

El script detectará que Git ya está instalado y continuará automáticamente.

---

## 📝 Comandos Post-Deployment

Una vez instalado, puedes usar:

```powershell
# Ver logs en tiempo real
docker-compose logs -f

# Reiniciar servicios
docker-compose restart

# Detener todo
docker-compose stop

# Iniciar todo
docker-compose start

# Ver estado
docker-compose ps
```

---

## ❌ Si Algo Sale Mal

El script detecta errores automáticamente:

| Error                    | Solución                                  |
| ------------------------ | ----------------------------------------- |
| Docker no instalado      | Instala Docker Desktop primero            |
| Docker no está corriendo | Inicia Docker Desktop                     |
| Sin permisos de admin    | Ejecuta PowerShell como Administrador     |
| Error al clonar repo     | Verifica conexión a internet              |
| Puertos ocupados         | Detén servicios que usen 8035, 3035, 5432 |

---

## 🔄 Actualizar el Sistema

Para actualizar a la última versión:

```powershell
cd C:\inetpub\vehiculos-app\Avery-dennison
docker-compose down
git pull origin main
docker-compose build --no-cache
docker-compose up -d
```

---

## 🆘 Soporte

Si el script automático falla, consulta la guía manual completa:
📄 **DESPLIEGUE_WINDOWS_SERVER.md**

---

## ⚡ Ventajas del Script Automático

✅ **Sin conocimientos técnicos requeridos**  
✅ **Instala dependencias faltantes automáticamente**  
✅ **Configuración segura por defecto**  
✅ **Detección y reporte de errores**  
✅ **Verificación automática post-deployment**  
✅ **Listo para usar en 15 minutos**

---

## 🎯 Resumen de 3 Comandos

```powershell
# 1. Descargar
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/oesantama/Avery-dennison/main/deploy-automatico.ps1" -OutFile "deploy-automatico.ps1"

# 2. Ejecutar
powershell -ExecutionPolicy Bypass -File .\deploy-automatico.ps1

# 3. Acceder
Start-Process "http://localhost:8035"
```

**¡Eso es todo! 🎉**
