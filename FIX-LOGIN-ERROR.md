# Solución al Error de Login - CORS y Base de Datos

## 📋 Resumen del Problema

Estás experimentando dos errores relacionados:

### 1. Error CORS (Frontend)
```
Access to XMLHttpRequest at 'http://localhost:3035/api/auth/login' from origin 'http://localhost:8035'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### 2. Error PostgreSQL (Backend - Causa Raíz)
```
ERROR: column usuarios.fecha_creacion does not exist at character 382
```

## 🔍 Análisis

**El error CORS es SECUNDARIO** - aparece porque el servidor responde con un error 500 (Internal Server Error) debido al error de la base de datos, lo que impide que envíe los headers CORS correctos.

**El error REAL** es que la tabla `usuarios` en PostgreSQL no tiene las columnas `fecha_creacion` y `fecha_actualizacion` que el modelo SQLAlchemy espera.

## ✅ Solución Rápida

### Opción 1: Usar el script automático (Recomendado)

```bash
./fix-database.sh
```

### Opción 2: Ejecutar manualmente

Si prefieres ejecutar la migración manualmente:

```bash
docker exec -i vehiculos-db psql -U postgres -d vehiculos_operacion < database/fix_usuarios_columns.sql
```

### Luego reinicia el backend

```bash
docker-compose restart backend
```

## 📝 ¿Qué hace la migración?

El script `database/fix_usuarios_columns.sql` hace lo siguiente:

1. ✅ Agrega la columna `fecha_creacion` si no existe
2. ✅ Agrega la columna `fecha_actualizacion` si no existe
3. ✅ Copia datos de `created_at`/`updated_at` si existen (retrocompatibilidad)
4. ✅ Agrega columnas RBAC: `email`, `numero_celular`, `rol_id`, `creado_por`
5. ✅ Elimina columnas antiguas `created_at`/`updated_at` después de copiar los datos
6. ✅ Recrea los triggers para actualización automática de timestamps

## 🔧 Verificación

Después de ejecutar la migración, puedes verificar que las columnas existan:

```bash
docker exec -it vehiculos-db psql -U postgres -d vehiculos_operacion -c "\d usuarios"
```

Deberías ver las columnas:
- `fecha_creacion` | timestamp with time zone
- `fecha_actualizacion` | timestamp with time zone

## 🧪 Probar el Login

Credenciales por defecto:
- **Usuario**: `admin`
- **Contraseña**: `admin123`

Visita: `http://localhost:8035` y prueba el login.

## ℹ️ Configuración CORS

La configuración CORS en `backend/main.py` ya está correcta e incluye:
```python
allow_origins=[
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:8035",  # ✅ Frontend URL
]
```

Una vez que la base de datos esté arreglada, el error CORS desaparecerá automáticamente.

## 🚨 Si el problema persiste

1. **Verifica que los contenedores estén corriendo**:
   ```bash
   docker-compose ps
   ```

2. **Revisa los logs del backend**:
   ```bash
   docker-compose logs backend
   ```

3. **Verifica la conexión a la base de datos**:
   ```bash
   docker-compose logs db
   ```

4. **Reinicia todos los servicios**:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

## 📚 Archivos Relevantes

- `database/fix_usuarios_columns.sql` - Script de migración
- `database/schema.sql` - Esquema completo de la base de datos
- `backend/app/models/usuario.py` - Modelo SQLAlchemy de Usuario
- `backend/main.py` - Configuración CORS (líneas 21-31)
- `fix-database.sh` - Script automático para aplicar la migración
