# Solución a Errores 500 en Login - Migración a RBAC

## Problema Identificado

El error 500 en el endpoint `/api/auth/login` ocurría debido a una **desincronización entre el schema de la base de datos y los modelos de SQLAlchemy**.

### Causa Raíz

1. El archivo `schema.sql` tenía una versión antigua de la tabla `usuarios` sin las columnas RBAC
2. Los modelos de SQLAlchemy (`backend/app/models/`) tenían el sistema RBAC completo implementado
3. Cuando el contenedor de PostgreSQL se iniciaba, ejecutaba `schema.sql` creando tablas sin RBAC
4. Cuando el backend intentaba hacer login, SQLAlchemy esperaba columnas que no existían (`rol_id`, relaciones con `roles`, `pages`, etc.)
5. Esto causaba errores internos en el backend, resultando en HTTP 500

### Warnings de PostgreSQL

Los warnings que veías en la consola del backend sobre locales (`sh: locale: not found`, `WARNING: no usable system locales were found`) son normales en contenedores Alpine Linux y **no causan problemas funcionales**. El problema real era el schema desactualizado.

## Solución Implementada

### 1. Schema Actualizado (`database/schema.sql`)

Se actualizó completamente el schema para incluir:

- ✅ Tabla `roles` - Define los roles del sistema
- ✅ Tabla `pages` - Define las páginas/secciones del sistema
- ✅ Tabla `permisos_rol` - Permisos por rol sobre cada página
- ✅ Tabla `permisos_usuario` - Permisos específicos que sobrescriben los del rol
- ✅ Columnas nuevas en `usuarios`:
  - `rol_id` - Relación con la tabla roles
  - `creado_por` - Usuario que creó este usuario
  - `numero_celular` - Teléfono del usuario
  - Renombradas: `created_at` → `fecha_creacion`, `updated_at` → `fecha_actualizacion`

### 2. Datos Iniciales

El schema ahora incluye automáticamente:

#### Roles Predefinidos:
- **Administrador**: Acceso completo al sistema
- **Supervisor**: Supervisión y aprobación (sin gestión de usuarios/roles)
- **Operador**: Registro y consulta de operaciones
- **Solo Lectura**: Solo visualización

#### Páginas del Sistema:
- Dashboard (`/`)
- Operaciones Diarias (`/operaciones`)
- Entregas (`/entregas`)
- Gestión de Usuarios (`/usuarios`)
- Roles y Permisos (`/roles`)
- Reportes (`/reportes`)

#### Usuario Administrador:
- **Username**: `admin`
- **Password**: `admin123`
- **Rol**: Administrador (acceso completo)

### 3. Script de Migración (`database/migrate_to_rbac.sql`)

Para bases de datos existentes, se creó un script que:

1. Crea las nuevas tablas si no existen
2. Agrega las columnas faltantes a `usuarios`
3. Renombra columnas antiguas
4. Agrega constraints y foreign keys
5. Inserta roles, páginas y permisos
6. Actualiza usuarios existentes asignándoles roles

## Cómo Aplicar la Solución

### Opción A: Base de Datos Nueva (Recomendado)

Si no tienes datos importantes, es más simple recrear la base de datos:

```bash
# 1. Detener los contenedores
docker compose down

# 2. Eliminar el volumen de PostgreSQL (esto borra todos los datos)
docker volume rm vehiculos_postgres_data

# 3. Volver a iniciar (se creará con el schema actualizado)
docker compose up -d

# 4. Verificar que todo funciona
docker compose logs -f backend
```

El contenedor creará automáticamente:
- Todas las tablas con el schema correcto
- Los 4 roles predefinidos
- Las 6 páginas del sistema
- Todos los permisos configurados
- El usuario admin con acceso completo

### Opción B: Migrar Base de Datos Existente

Si tienes datos que quieres conservar:

```bash
# 1. Asegurarse que el contenedor de base de datos está corriendo
docker compose up -d db

# 2. Ejecutar el script de migración
docker compose exec db psql -U postgres -d vehiculos_operacion -f /docker-entrypoint-initdb.d/migrate_to_rbac.sql

# O si prefieres copiar el archivo primero:
docker cp database/migrate_to_rbac.sql vehiculos-db:/tmp/
docker compose exec db psql -U postgres -d vehiculos_operacion -f /tmp/migrate_to_rbac.sql

# 3. Reiniciar el backend para que recargue los modelos
docker compose restart backend

# 4. Verificar logs
docker compose logs -f backend
```

## Verificación Post-Migración

### 1. Verificar Tablas

```bash
docker compose exec db psql -U postgres -d vehiculos_operacion -c "\dt"
```

Deberías ver:
- `roles`
- `pages`
- `permisos_rol`
- `permisos_usuario`
- `usuarios` (actualizada)
- Las demás tablas del sistema

### 2. Verificar Columnas de Usuarios

```bash
docker compose exec db psql -U postgres -d vehiculos_operacion -c "\d usuarios"
```

Deberías ver las columnas: `id`, `username`, `password_hash`, `nombre_completo`, `email`, `numero_celular`, `rol_id`, `creado_por`, `activo`, `fecha_creacion`, `fecha_actualizacion`

### 3. Verificar Datos Iniciales

```bash
# Ver roles
docker compose exec db psql -U postgres -d vehiculos_operacion -c "SELECT * FROM roles;"

# Ver páginas
docker compose exec db psql -U postgres -d vehiculos_operacion -c "SELECT * FROM pages;"

# Ver usuario admin
docker compose exec db psql -U postgres -d vehiculos_operacion -c "SELECT username, nombre_completo, email, activo FROM usuarios WHERE username='admin';"
```

### 4. Probar Login

Ahora deberías poder hacer login en el frontend con:
- **Username**: `admin`
- **Password**: `admin123`

El endpoint `/api/auth/login` debería responder correctamente con un token JWT.

## Archivos Modificados

1. `database/schema.sql` - Schema completo actualizado con RBAC
2. `database/migrate_to_rbac.sql` - Script de migración para DBs existentes (nuevo)
3. `database/README_MIGRACION.md` - Esta documentación (nuevo)

## Sistema RBAC Implementado

El sistema ahora tiene control de acceso basado en roles (RBAC) completo:

### Niveles de Permisos

Cada rol puede tener 4 tipos de permisos por página:
- **puede_ver**: Ver la página y su contenido
- **puede_crear**: Crear nuevos registros
- **puede_editar**: Modificar registros existentes
- **puede_eliminar**: Eliminar registros

### Jerarquía de Permisos

1. Los permisos se definen primero a nivel de **rol**
2. Se pueden sobrescribir con permisos específicos a nivel de **usuario**
3. Si un usuario tiene un permiso específico, ese tiene prioridad sobre el del rol

### Configuración de Permisos por Rol

| Rol | Dashboard | Operaciones | Entregas | Usuarios | Roles | Reportes |
|-----|-----------|-------------|----------|----------|-------|----------|
| **Administrador** | ✅ Todo | ✅ Todo | ✅ Todo | ✅ Todo | ✅ Todo | ✅ Todo |
| **Supervisor** | ✅ Ver | ✅ Todo | ✅ Todo | 👁️ Ver | 👁️ Ver | ✅ Todo |
| **Operador** | ✅ Ver | ✅ Crear/Editar | ✅ Crear/Editar | ❌ Sin acceso | ❌ Sin acceso | 👁️ Ver |
| **Solo Lectura** | 👁️ Ver | 👁️ Ver | 👁️ Ver | ❌ Sin acceso | ❌ Sin acceso | 👁️ Ver |

## Comandos Útiles

```bash
# Ver logs del backend para debug
docker compose logs -f backend

# Ver logs de la base de datos
docker compose logs -f db

# Conectarse a PostgreSQL
docker compose exec db psql -U postgres -d vehiculos_operacion

# Reiniciar servicios
docker compose restart

# Recrear servicios desde cero
docker compose down && docker compose up -d --build
```

## Prevención de Problemas Futuros

Para evitar desincronizaciones entre el schema SQL y los modelos de SQLAlchemy:

1. **Opción 1**: Usar migraciones de Alembic (herramienta de SQLAlchemy)
2. **Opción 2**: Mantener el `schema.sql` sincronizado manualmente
3. **Opción 3**: Confiar solo en `Base.metadata.create_all()` y no usar `schema.sql` (requiere cambiar docker-compose.yml)

### Implementar Alembic (Recomendado)

```bash
# En el directorio backend
pip install alembic
alembic init migrations
# Configurar alembic.ini y migrations/env.py
# Generar migración automática:
alembic revision --autogenerate -m "initial migration"
# Aplicar migración:
alembic upgrade head
```

Esto permite gestionar cambios de schema de forma versionada y automática.

## Soporte

Si encuentras problemas:

1. Verifica los logs: `docker compose logs -f backend db`
2. Confirma que las tablas existen: `docker compose exec db psql -U postgres -d vehiculos_operacion -c "\dt"`
3. Revisa que el usuario admin existe: `docker compose exec db psql -U postgres -d vehiculos_operacion -c "SELECT * FROM usuarios WHERE username='admin';"`
4. Verifica conectividad: `docker compose exec backend python -c "from app.database import engine; print(engine.connect())"`

---

**Fecha de creación**: 2025-11-17
**Versión del sistema**: 1.0.0 con RBAC
**Base de datos**: PostgreSQL 15
**Framework**: FastAPI + SQLAlchemy
