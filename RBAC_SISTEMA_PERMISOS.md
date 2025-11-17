# 🔐 Sistema de Control de Acceso Basado en Roles (RBAC)

## 📋 Tabla de Contenidos
1. [Introducción](#introducción)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Cómo Aplicar el Schema](#cómo-aplicar-el-schema)
4. [Estructura de Permisos](#estructura-de-permisos)
5. [Roles Predefinidos](#roles-predefinidos)
6. [Endpoints Disponibles](#endpoints-disponibles)
7. [Ejemplos de Uso](#ejemplos-de-uso)

---

## Introducción

Este sistema implementa **Role-Based Access Control (RBAC)** completo para gestionar usuarios, roles y permisos granulares en el sistema de gestión de vehículos.

### Características Principales:
- ✅ **Permisos granulares** por acción: ver, crear, editar, eliminar
- ✅ **Herencia de permisos**: usuarios heredan permisos de su rol
- ✅ **Permisos por usuario**: pueden sobrescribir los del rol
- ✅ **Menú dinámico**: se genera según permisos del usuario
- ✅ **3 roles predefinidos**: Administrador, Operador, Visualizador
- ✅ **Protección de rutas**: middleware de autorización

---

## Arquitectura del Sistema

### Tablas de Base de Datos:

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  usuarios   │◄────┤    roles    │      │    pages    │
└─────────────┘      └─────────────┘      └─────────────┘
       │                    │                     │
       │                    │                     │
       │             ┌──────▼──────────┐         │
       │             │ permisos_rol    │◄────────┘
       │             └─────────────────┘
       │
       │             ┌──────────────────┐
       └────────────►│permisos_usuario  │
                     └──────────────────┘
```

1. **roles**: Define roles del sistema
2. **pages**: Páginas/recursos que se pueden proteger
3. **permisos_rol**: Qué puede hacer cada rol en cada página
4. **permisos_usuario**: Permisos específicos que sobrescriben los del rol
5. **usuarios**: Actualizado con rol_id, email, celular, creado_por

---

## Cómo Aplicar el Schema

### Opción 1: Aplicar en base de datos existente

```bash
# 1. Copiar el archivo SQL al contenedor
docker cp database/schema_rbac.sql vehiculos-db:/tmp/

# 2. Ejecutar el script
docker exec -it vehiculos-db psql -U postgres -d vehiculos_operacion -f /tmp/schema_rbac.sql

# 3. Verificar que se creó correctamente
docker exec -it vehiculos-db psql -U postgres -d vehiculos_operacion -c "SELECT * FROM roles;"
docker exec -it vehiculos-db psql -U postgres -d vehiculos_operacion -c "SELECT * FROM pages;"
```

### Opción 2: Recrear contenedor (limpia todo)

```bash
# Detener y eliminar contenedores
docker-compose -f docker-compose.dev.yml down -v

# Reconstruir (esto ejecutará schema.sql + schema_rbac.sql)
docker-compose -f docker-compose.dev.yml up --build
```

**⚠️ IMPORTANTE**: Opción 2 eliminará TODOS los datos existentes.

---

## Estructura de Permisos

### Tipos de Acciones:

| Acción | Descripción | Ejemplo |
|--------|-------------|---------|
| **ver** | Puede acceder a la página y listar elementos | Ver lista de operaciones |
| **crear** | Puede crear nuevos elementos | Crear nueva operación |
| **editar** | Puede modificar elementos existentes | Editar vehículo |
| **eliminar** | Puede eliminar elementos | Eliminar entrega |

### Lógica de Permisos Efectivos:

```
Permiso Final = Permiso Usuario (si existe) || Permiso Rol || FALSE
```

**Ejemplo:**
- Rol "Operador" tiene: `puede_editar = TRUE` en "operaciones"
- Usuario "Juan" (Operador) tiene: `puede_editar = FALSE` en "operaciones" (permiso específico)
- **Resultado**: Juan NO puede editar operaciones (su permiso específico sobrescribe el del rol)

---

## Roles Predefinidos

### 1. Administrador
- **Permisos**: Acceso completo a TODO
- **Puede gestionar**: Usuarios, roles, permisos
- **Páginas**: Dashboard, Operaciones, Entregas, Usuarios

### 2. Operador
- **Permisos**: Puede ver y gestionar operaciones y entregas
- **NO puede**: Gestionar usuarios
- **Páginas**: Dashboard (solo ver), Operaciones (completo), Entregas (completo)

### 3. Visualizador
- **Permisos**: Solo lectura en todo
- **NO puede**: Crear, editar o eliminar nada
- **Páginas**: Dashboard, Operaciones, Entregas (solo ver)

---

## Endpoints Disponibles

### Autenticación y Usuario Actual

```http
GET /api/auth/me
Descripción: Obtiene usuario actual con TODOS sus permisos efectivos
Respuesta: UsuarioPermisosCompletos

GET /api/auth/menu
Descripción: Obtiene menú del usuario según sus permisos
Respuesta: List[MenuItemPermisos]
```

### Gestión de Usuarios

```http
GET    /api/usuarios              # Listar usuarios (requiere permiso "ver" en "usuarios")
GET    /api/usuarios/{id}         # Obtener usuario específico
POST   /api/usuarios              # Crear usuario (requiere rol Admin)
PUT    /api/usuarios/{id}         # Actualizar usuario (requiere rol Admin)
DELETE /api/usuarios/{id}         # Desactivar usuario (requiere rol Admin)
GET    /api/usuarios/{id}/permisos # Obtener permisos de un usuario
```

### Gestión de Roles

```http
GET    /api/roles                 # Listar roles (requiere rol Admin)
GET    /api/roles/{id}            # Obtener rol específico
POST   /api/roles                 # Crear rol (requiere rol Admin)
PUT    /api/roles/{id}            # Actualizar rol (requiere rol Admin)
DELETE /api/roles/{id}            # Desactivar rol (requiere rol Admin)
```

### Gestión de Páginas

```http
GET    /api/pages                 # Listar páginas (requiere rol Admin)
GET    /api/pages/{id}            # Obtener página específica
POST   /api/pages                 # Crear página (requiere rol Admin)
PUT    /api/pages/{id}            # Actualizar página (requiere rol Admin)
DELETE /api/pages/{id}            # Desactivar página (requiere rol Admin)
```

### Gestión de Permisos de Rol

```http
GET    /api/permisos-rol?rol_id=1&page_id=2    # Listar permisos de rol
POST   /api/permisos-rol                       # Crear/Actualizar permiso de rol
PUT    /api/permisos-rol/{id}                  # Actualizar permiso de rol
```

### Gestión de Permisos de Usuario

```http
GET    /api/permisos-usuario?usuario_id=1      # Listar permisos de usuario
POST   /api/permisos-usuario                   # Crear/Actualizar permiso de usuario
DELETE /api/permisos-usuario/{id}              # Eliminar permiso específico
```

---

## Ejemplos de Uso

### 1. Crear un Nuevo Usuario

```bash
curl -X POST http://localhost:3035/api/usuarios \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "operador1",
    "password": "password123",
    "nombre_completo": "Juan Pérez",
    "email": "juan@empresa.com",
    "numero_celular": "+57 300 1234567",
    "rol_id": 2,
    "activo": true
  }'
```

### 2. Obtener Permisos del Usuario Actual

```bash
curl -X GET http://localhost:3035/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Respuesta:
```json
{
  "id": 1,
  "username": "admin",
  "rol": {
    "id": 1,
    "nombre": "Administrador"
  },
  "permisos": [
    {
      "page_nombre": "dashboard",
      "page_display": "Dashboard",
      "page_ruta": "/dashboard",
      "puede_ver": true,
      "puede_crear": true,
      "puede_editar": true,
      "puede_eliminar": true
    },
    {
      "page_nombre": "operaciones",
      "page_display": "Operaciones Diarias",
      "page_ruta": "/operaciones",
      "puede_ver": true,
      "puede_crear": true,
      "puede_editar": true,
      "puede_eliminar": true
    }
  ]
}
```

### 3. Obtener Menú del Usuario

```bash
curl -X GET http://localhost:3035/api/auth/menu \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Respuesta (solo páginas que puede VER):
```json
[
  {
    "id": 1,
    "nombre": "dashboard",
    "nombre_display": "Dashboard",
    "ruta": "/dashboard",
    "icono": "FiHome",
    "orden": 1,
    "puede_ver": true,
    "puede_crear": false,
    "puede_editar": false,
    "puede_eliminar": false
  },
  {
    "id": 2,
    "nombre": "operaciones",
    "nombre_display": "Operaciones Diarias",
    "ruta": "/operaciones",
    "icono": "FiTruck",
    "orden": 2,
    "puede_ver": true,
    "puede_crear": true,
    "puede_editar": true,
    "puede_eliminar": true
  }
]
```

### 4. Asignar Permiso Específico a un Usuario

```bash
# Dar permiso de "editar" en "operaciones" a usuario ID 5
curl -X POST http://localhost:3035/api/permisos-usuario \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "usuario_id": 5,
    "page_id": 2,
    "puede_ver": true,
    "puede_crear": null,
    "puede_editar": true,
    "puede_eliminar": null
  }'
```

**Nota**: `null` significa "heredar del rol"

### 5. Actualizar Permisos de un Rol

```bash
# Dar todos los permisos al rol "Operador" en "dashboard"
curl -X POST http://localhost:3035/api/permisos-rol \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rol_id": 2,
    "page_id": 1,
    "puede_ver": true,
    "puede_crear": true,
    "puede_editar": true,
    "puede_eliminar": true
  }'
```

---

## Protección de Rutas en el Backend

### Ejemplo de Uso de Dependencies:

```python
from app.dependencies.authorization import require_permission, require_admin

# Requiere permiso específico
@router.post("/operaciones")
def crear_operacion(
    data: OperacionCreate,
    db: Session = Depends(get_db),
    _: None = Depends(require_permission("operaciones", "crear"))
):
    # Solo usuarios con permiso "crear" en "operaciones" pueden acceder
    ...

# Requiere rol de Administrador
@router.post("/usuarios")
def crear_usuario(
    data: UsuarioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin)
):
    # Solo administradores pueden acceder
    ...
```

---

## Vista de Debugging

Para ver todos los permisos efectivos de todos los usuarios:

```sql
SELECT * FROM v_permisos_usuarios ORDER BY username, page_display;
```

---

## Próximos Pasos

1. ✅ **Backend completo** - Listo
2. ⏳ **Frontend** - Página de gestión de usuarios
3. ⏳ **Frontend** - Sistema de protección de rutas
4. ⏳ **Frontend** - Renderizado condicional de botones según permisos

---

## Soporte

Si encuentras problemas:
1. Verifica que el schema se aplicó correctamente: `SELECT COUNT(*) FROM roles;`
2. Verifica que el usuario admin tiene rol: `SELECT username, rol_id FROM usuarios WHERE username = 'admin';`
3. Revisa los logs del backend para errores de importación

Para más información, consulta los archivos de código fuente en:
- `backend/app/models/` - Modelos de SQLAlchemy
- `backend/app/schemas/rbac.py` - Schemas de validación
- `backend/app/services/authorization.py` - Lógica de autorización
- `backend/app/routes/usuarios.py` y `backend/app/routes/rbac.py` - Endpoints
