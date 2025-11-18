# 📝 Sistema de Logging y Corrección de Uploads

## 🎯 Problemas Resueltos

### 1. Archivos no se Guardaban Correctamente 📁

**Problema Original:**

- Los archivos se guardaban con ruta relativa `uploads/`
- La ruta era relativa al directorio de ejecución del contenedor
- No había persistencia entre reinicios
- No había logs para diagnosticar

**Solución Implementada:**

1. ✅ Ruta absoluta en config: `/app/uploads`
2. ✅ Volumen Docker mapeado: `backend_uploads:/app/uploads`
3. ✅ Validación de existencia del directorio
4. ✅ Logging detallado en cada paso

---

## 🔍 Sistema de Logging Implementado

### Características del Sistema:

#### A. Middleware de Logging Global

**Archivo:** `backend/app/middleware/logging.py`

**Funcionalidades:**

- ✅ Log de cada petición HTTP con ID único
- ✅ Información del cliente (IP)
- ✅ Headers de autenticación
- ✅ Query parameters
- ✅ Tiempo de procesamiento en milisegundos
- ✅ Código de estado con emojis (✅ ⚠️ ❌)
- ✅ Stack trace completo en errores

**Ejemplo de Log:**

```
🔵 [1700342890123] POST /api/entregas/1/fotos
   Client: 172.18.0.1
   Auth: Bearer token present
✅ [1700342890123] 201 in 45.23ms
```

#### B. Logging Específico de Uploads

**Archivo:** `backend/app/routes/entregas.py`

**Logs Detallados:**

```python
logger.info(f"📸 Iniciando subida de foto para entrega {entrega_id}")
logger.info(f"👤 Usuario: {current_user.username}")
logger.info(f"📄 Archivo: {file.filename}, Tipo: {file.content_type}")
logger.info(f"💾 Guardando archivo en: {file_path}")
logger.info(f"✅ Archivo guardado exitosamente: {file_size} bytes")
logger.info(f"✅ Registro en BD creado: ID {db_foto.id}")
logger.info(f"🔗 URL de acceso: http://localhost:3035/uploads/{filename}")
```

#### C. Logging de Errores

**Captura Completa:**

- ❌ Entrega no encontrada
- ❌ Tipo de archivo no permitido
- ❌ Error al guardar archivo
- ❌ Error en base de datos
- ❌ Stack trace completo para debugging

---

## 📊 Archivos Modificados

### Backend:

1. **`backend/app/config.py`**

   ```python
   # Antes
   upload_dir: str = "uploads"

   # Después
   upload_dir: str = "/app/uploads"  # Ruta absoluta
   ```

2. **`backend/app/routes/entregas.py`**

   - ✅ Import de logging
   - ✅ Logger configurado
   - ✅ Path absoluto con Path.resolve()
   - ✅ Logs en cada paso de subida
   - ✅ Validación de existencia de archivo
   - ✅ Try-catch con logging de errores

3. **`backend/app/middleware/logging.py`** (NUEVO)

   - ✅ Middleware HTTP completo
   - ✅ ID único por petición
   - ✅ Medición de tiempos
   - ✅ Headers de respuesta con metadata

4. **`backend/app/middleware/__init__.py`** (NUEVO)

   - ✅ Exportación de middleware

5. **`backend/main.py`**
   - ✅ Import de middleware
   - ✅ Configuración de logging global
   - ✅ Log de startup info
   - ✅ Logs de directorio de uploads

### Docker:

6. **`docker-compose.yml`** (YA EXISTÍA)
   ```yaml
   volumes:
     - backend_uploads:/app/uploads # ✅ Persistencia
   ```

---

## 🧪 Cómo Verificar el Sistema

### 1. Ver Logs en Tiempo Real:

```bash
# Ver logs del backend
docker-compose logs -f backend

# Ver solo errores
docker-compose logs backend | grep "❌"

# Ver logs de uploads
docker-compose logs backend | grep "📸"
```

### 2. Verificar Directorio de Uploads:

```bash
# Entrar al contenedor
docker-compose exec backend sh

# Ver archivos subidos
ls -la /app/uploads/

# Verificar permisos
ls -ld /app/uploads/
```

### 3. Ver Logs de una Petición Completa:

```bash
# Subir una foto y ver los logs:
# Se verá algo como:
🔵 [1700342890123] POST /api/entregas/1/fotos
   Client: 172.18.0.1
   Auth: Bearer token present
📸 Iniciando subida de foto para entrega 1
👤 Usuario: admin
📄 Archivo: imagen.jpg, Tipo: image/jpeg
💾 Guardando archivo en: /app/uploads/entrega_1_20251118_120530.jpg
✅ Archivo guardado exitosamente: 524288 bytes
✅ Registro en BD creado: ID 5
🔗 URL de acceso: http://localhost:3035/uploads/entrega_1_20251118_120530.jpg
✅ [1700342890123] 201 in 45.23ms
```

---

## 🎯 Formato de Logs

### Estructura:

```
TIMESTAMP - LOGGER_NAME - LEVEL - MESSAGE
```

### Niveles:

- **INFO** (📝): Operaciones normales
- **WARNING** (⚠️): Advertencias
- **ERROR** (❌): Errores capturados
- **DEBUG** (🔍): Información detallada

### Emojis por Tipo:

- 🔵 Petición iniciada
- ✅ Éxito (status < 400)
- ⚠️ Advertencia (status 400-499)
- ❌ Error (status >= 500)
- 📸 Upload de foto
- 👤 Usuario
- 📄 Archivo
- 💾 Guardando
- 🔗 URL generada
- 📁 Directorio

---

## 📈 Beneficios del Sistema de Logging

### Para Desarrollo:

1. **Debug Rápido:** Identificar errores en segundos
2. **Trazabilidad:** Seguir el flujo de cada petición
3. **Performance:** Medir tiempos de respuesta
4. **Auditoría:** Saber quién hizo qué y cuándo

### Para Producción:

1. **Monitoreo:** Alertas automáticas en errores
2. **Analytics:** Patrones de uso
3. **Troubleshooting:** Diagnosticar problemas de clientes
4. **Compliance:** Registro de operaciones

---

## 🔧 Configuración Avanzada

### Cambiar Nivel de Log:

```python
# En main.py o config
logging.basicConfig(
    level=logging.DEBUG,  # Cambiar a DEBUG para más detalle
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

### Guardar Logs en Archivo:

```python
# Agregar handler de archivo
file_handler = logging.FileHandler('app.log')
file_handler.setLevel(logging.INFO)
formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)
```

### Logs por Módulo:

```python
# En cada archivo
logger = logging.getLogger(__name__)

# Logs específicos
logger.debug("Detalles de debug")
logger.info("Información general")
logger.warning("Advertencia")
logger.error("Error capturado")
logger.critical("Error crítico")
```

---

## 🚀 Próximas Mejoras

### 1. Log Rotation (Prioridad Alta)

```python
from logging.handlers import RotatingFileHandler

handler = RotatingFileHandler(
    'app.log',
    maxBytes=10485760,  # 10MB
    backupCount=5
)
```

### 2. Structured Logging (Prioridad Media)

```python
import structlog

logger = structlog.get_logger()
logger.info("upload_photo",
    entrega_id=1,
    filename="foto.jpg",
    size=524288
)
```

### 3. External Logging Service (Prioridad Baja)

- Elasticsearch + Kibana (ELK Stack)
- Grafana Loki
- DataDog
- New Relic

### 4. Alertas Automáticas (Prioridad Media)

- Email en errores críticos
- Slack notifications
- PagerDuty integración

---

## 📝 Testing del Sistema

### Test 1: Subir Foto con Logs

```bash
# 1. Abrir terminal con logs:
docker-compose logs -f backend

# 2. Subir una foto desde el frontend
# 3. Verificar en logs:
✅ Se ve el log de inicio (📸)
✅ Se ve información del usuario (👤)
✅ Se ve la ruta donde se guarda (💾)
✅ Se ve el ID del registro (✅)
✅ Se ve la URL de acceso (🔗)
✅ Se ve el tiempo de procesamiento

# 4. Verificar que el archivo existe:
docker-compose exec backend ls -la /app/uploads/
```

### Test 2: Error Controlado

```bash
# 1. Intentar subir archivo no válido (ej: PDF)
# 2. Verificar en logs:
❌ Tipo de archivo no permitido: application/pdf

# 3. Intentar subir a entrega inexistente
# 4. Verificar en logs:
❌ Entrega 999 no encontrada
```

### Test 3: Persistencia

```bash
# 1. Subir una foto
# 2. Reiniciar backend:
docker-compose restart backend

# 3. Verificar que el archivo sigue:
docker-compose exec backend ls -la /app/uploads/

# 4. Acceder desde navegador:
http://localhost:3035/uploads/entrega_1_20251118_120530.jpg
```

---

## ✅ Checklist de Implementación

### Completado:

- ✅ Ruta absoluta de uploads configurada
- ✅ Volumen Docker mapeado
- ✅ Middleware de logging global
- ✅ Logging específico de uploads
- ✅ Logging de errores con stack trace
- ✅ Emojis para mejor legibilidad
- ✅ Medición de tiempos
- ✅ Headers de metadata en respuestas
- ✅ Log de startup info
- ✅ Validación de existencia de archivos
- ✅ Backend reiniciado

### Pendiente:

- ⏳ Log rotation (producción)
- ⏳ Structured logging (opcional)
- ⏳ External logging service (opcional)
- ⏳ Alertas automáticas (producción)

---

## 🎓 Guía Rápida de Logs

### Ver Logs por Tipo:

```bash
# Todos los logs
docker-compose logs backend

# Solo uploads
docker-compose logs backend | grep "📸"

# Solo errores
docker-compose logs backend | grep "❌"

# Solo éxitos
docker-compose logs backend | grep "✅"

# Últimas 100 líneas
docker-compose logs backend --tail=100

# En tiempo real
docker-compose logs -f backend

# Desde una fecha
docker-compose logs backend --since 2024-11-18T12:00:00
```

### Buscar Información Específica:

```bash
# Buscar por entrega ID
docker-compose logs backend | grep "entrega 1"

# Buscar por usuario
docker-compose logs backend | grep "Usuario: admin"

# Buscar por archivo
docker-compose logs backend | grep "imagen.jpg"

# Buscar peticiones lentas (>100ms)
docker-compose logs backend | grep "in [1-9][0-9]\{2,\}"
```

---

**Estado:** ✅ Sistema de Logging Completo
**Versión:** 1.0.0
**Fecha:** 18/11/2025
