# 🔐 SISTEMA DE PERMISOS SIMPLIFICADO

## ✅ Cómo Funciona Ahora (SIMPLIFICADO)

### 1️⃣ Al Iniciar Sesión

- **SOLO** consulta la tabla `permisos_usuarios`
- **NO** consulta `permisos_rol` (se ignora completamente)
- Obtiene las páginas y permisos asignados directamente al usuario
- Dashboard siempre se incluye automáticamente

### 2️⃣ Validación de Permisos

El backend verifica:

- `puede_ver = true` → Usuario puede ver la página
- `puede_crear = true` → Usuario puede crear registros
- `puede_editar = true` → Usuario puede editar registros
- `puede_borrar = true` → Usuario puede eliminar registros

### 3️⃣ Al Guardar/Editar Permisos de Usuario

Cuando se guarda un usuario desde el frontend:

1. **ELIMINA** físicamente todos los permisos del usuario
2. **CREA** los nuevos permisos desde cero
3. No quedan permisos antiguos

---

## 📋 Archivos Modificados

### Backend

#### `backend/app/routes/auth.py`

```python
@router.get("/my-permissions")
async def get_my_permissions():
    # ✅ SOLO consulta permisos_usuarios
    # ✅ NO mezcla con permisos_rol
    # ✅ Dashboard siempre incluido
```

#### `backend/app/routes/permisos_usuario.py`

```python
@router.post("/usuario/{usuario_id}/bulk")
def create_bulk_permisos_usuario():
    # ✅ ELIMINA físicamente permisos antiguos
    # ✅ CREA nuevos permisos desde cero
```

#### `backend/app/services/authorization.py`

```python
class AuthorizationService:
    @staticmethod
    def verificar_permiso():
        # ✅ SOLO consulta permisos_usuarios
        # ✅ NO consulta permisos_rol
```

#### `backend/main.py`

```python
@app.exception_handler(Exception)
async def global_exception_handler():
    # ✅ Asegura headers CORS en errores 500
    # ✅ Registra errores en logs
```

---

## 🗃️ Estructura de Base de Datos

### Tabla: `permisos_usuarios`

```sql
CREATE TABLE permisos_usuarios (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL,
    page_id INT NOT NULL,
    puede_ver BOOLEAN DEFAULT false,
    puede_crear BOOLEAN DEFAULT false,
    puede_editar BOOLEAN DEFAULT false,
    puede_borrar BOOLEAN DEFAULT false,
    estado VARCHAR(20) DEFAULT 'activo',
    usuario_control INT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (page_id) REFERENCES pages(id)
);
```

### Tabla: `pages`

```sql
CREATE TABLE pages (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    nombre_display VARCHAR(100),
    ruta VARCHAR(200) NOT NULL,
    icono VARCHAR(50),
    orden INT DEFAULT 0,
    activo BOOLEAN DEFAULT true
);
```

---

## 🚀 Configuración Inicial

### Paso 1: Ejecutar SQL

```bash
# Conectar a PostgreSQL
psql -U postgres -d nombre_base_datos

# Ejecutar script
\i CONFIGURAR_PERMISOS.sql
```

### Paso 2: Ajustar IDs

En el archivo `CONFIGURAR_PERMISOS.sql`:

- Busca `usuario_id = 1` y cámbialo por el ID real de tu usuario admin
- Verifica que los IDs de páginas sean correctos

### Paso 3: Reiniciar Backend

```bash
docker-compose restart backend
```

### Paso 4: Probar

1. Hacer login con usuario admin
2. Ir a Maestros → Páginas (deberías ver todas)
3. Ir a Maestros → Permisos por Usuario
4. Asignar permisos específicos a usuarios

---

## 📝 Ejemplo: Crear Usuario con Permisos Limitados

### SQL

```sql
-- 1. Crear usuario
INSERT INTO usuarios (username, password_hash, nombre_completo, email, rol_id, activo)
VALUES (
    'operador1',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyJvK9Rq.N8u',
    'Operador 1',
    'operador1@example.com',
    2,  -- Rol no importa, pero es requerido
    true
);

-- 2. Obtener ID del usuario recién creado
SELECT id FROM usuarios WHERE username = 'operador1';  -- Ejemplo: 5

-- 3. Asignar permisos específicos
-- Dashboard (obligatorio)
INSERT INTO permisos_usuarios (usuario_id, page_id, puede_ver, puede_crear, puede_editar, puede_borrar, estado, usuario_control)
SELECT 5, id, true, false, false, false, 'activo', 1
FROM pages WHERE nombre = 'dashboard';

-- Vehículos (VER y CREAR)
INSERT INTO permisos_usuarios (usuario_id, page_id, puede_ver, puede_crear, puede_editar, puede_borrar, estado, usuario_control)
SELECT 5, id, true, true, false, false, 'activo', 1
FROM pages WHERE nombre = 'vehiculos';

-- Entregas (SOLO VER)
INSERT INTO permisos_usuarios (usuario_id, page_id, puede_ver, puede_crear, puede_editar, puede_borrar, estado, usuario_control)
SELECT 5, id, true, false, false, false, 'activo', 1
FROM pages WHERE nombre = 'entregas';
```

---

## 🔧 Solución de Problemas

### Problema: Usuario no ve ninguna página

**Solución:**

```sql
-- Verificar si el usuario tiene permisos activos
SELECT * FROM permisos_usuarios WHERE usuario_id = TU_USUARIO_ID AND estado = 'activo';

-- Si está vacío, asignar permisos
-- Ver ejemplo arriba
```

### Problema: Error 403 Forbidden

**Solución:**

- Verificar que el usuario tenga el permiso específico (puede_ver, puede_crear, etc.)
- Verificar que el estado del permiso sea 'activo'
- Verificar que la ruta de la página coincida con la configurada en la BD

```sql
-- Ver permisos de un usuario
SELECT
    u.username,
    p.ruta,
    pu.puede_ver,
    pu.puede_crear,
    pu.puede_editar,
    pu.puede_borrar,
    pu.estado
FROM permisos_usuarios pu
JOIN usuarios u ON u.id = pu.usuario_id
JOIN pages p ON p.id = pu.page_id
WHERE u.id = TU_USUARIO_ID;
```

### Problema: Error 500 con CORS

**Solución:**

- Ya está solucionado con el exception handler global
- Ver logs del backend: `docker-compose logs -f backend`
- Buscar líneas que empiecen con `❌ Error no manejado`

---

## 🎯 Flujo Completo

```
┌─────────────────────────────────────────────────┐
│ 1. Usuario hace LOGIN                           │
│    → Backend consulta solo permisos_usuarios    │
│    → Retorna permisos detallados                │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ 2. Frontend guarda permisos en localStorage     │
│    → usePermissions hook lee permisos           │
│    → Cada página valida con canView, etc.       │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ 3. Usuario intenta acceder a endpoint           │
│    → Backend verifica permiso en DB             │
│    → Si no tiene: Error 403                     │
│    → Si tiene: Procesa request                  │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ 4. Admin edita permisos de usuario              │
│    → Frontend llama /usuario/{id}/bulk          │
│    → Backend ELIMINA permisos antiguos          │
│    → Backend CREA nuevos permisos               │
│    → Usuario debe hacer RE-LOGIN                │
└─────────────────────────────────────────────────┘
```

---

## ⚠️ IMPORTANTE

1. **Después de cambiar permisos de un usuario**, ese usuario debe:

   - Cerrar sesión
   - Volver a iniciar sesión
   - Los nuevos permisos se aplicarán

2. **Dashboard siempre visible**:

   - Se incluye automáticamente en `/my-permissions`
   - No necesita configurarse en la BD

3. **Rol ya no importa**:

   - El campo `rol_id` en `usuarios` sigue siendo requerido
   - Pero NO afecta los permisos
   - Solo se usa para mostrar "Administrador" vs "Usuario"

4. **Tabla permisos_rol**:
   - Ya NO se usa
   - Se mantiene por compatibilidad
   - Puedes ignorarla

---

## 📊 Consultas Útiles

### Ver todos los permisos de un usuario

```sql
SELECT
    p.nombre as pagina,
    p.ruta,
    pu.puede_ver as ver,
    pu.puede_crear as crear,
    pu.puede_editar as editar,
    pu.puede_borrar as borrar
FROM permisos_usuarios pu
JOIN pages p ON p.id = pu.page_id
WHERE pu.usuario_id = TU_USUARIO_ID
AND pu.estado = 'activo'
ORDER BY p.nombre;
```

### Ver usuarios sin permisos

```sql
SELECT u.id, u.username, u.nombre_completo
FROM usuarios u
WHERE u.activo = true
AND NOT EXISTS (
    SELECT 1 FROM permisos_usuarios pu
    WHERE pu.usuario_id = u.id
    AND pu.estado = 'activo'
);
```

### Copiar permisos de un usuario a otro

```sql
-- Copiar permisos del usuario 1 al usuario 5
INSERT INTO permisos_usuarios (usuario_id, page_id, puede_ver, puede_crear, puede_editar, puede_borrar, estado, usuario_control)
SELECT
    5 as usuario_id,  -- Usuario destino
    page_id,
    puede_ver,
    puede_crear,
    puede_editar,
    puede_borrar,
    estado,
    1 as usuario_control
FROM permisos_usuarios
WHERE usuario_id = 1  -- Usuario origen
AND estado = 'activo';
```
