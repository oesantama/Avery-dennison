# Sistema de Gestión de Vehículos y Entregas

Sistema completo para la gestión de operaciones diarias de vehículos, entregas y seguimiento de facturas.

## Descripción

Este sistema permite:

1. **Login con usuario y contraseña**: Sistema de autenticación seguro con JWT
2. **Captura de vehículos necesarios**: Registro diario de cuántos vehículos se necesitan para la operación
3. **Seguimiento de vehículos**: Control de cuántos vehículos iniciaron operación según placas
4. **Gestión de entregas**:
   - Asignación de facturas/clientes por vehículo
   - Registro de número de factura, cliente, observaciones
   - Estados: pendiente o cumplido
   - Fechas de operación y cumplimiento
5. **Evidencia fotográfica**: Subida de fotos al completar entregas
6. **Dashboard y reportes**:
   - KPIs en tiempo real
   - Filtros por fecha de operación, fecha cumplido, placa, estado
   - Visualización de métricas clave

## Stack Tecnológico

### Frontend
- **Framework**: Next.js 14 con React 18
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Gráficos**: Recharts
- **HTTP Client**: Axios

### Backend
- **Framework**: FastAPI (Python)
- **Base de datos**: PostgreSQL
- **ORM**: SQLAlchemy
- **Autenticación**: JWT (python-jose)
- **Passwords**: bcrypt (passlib)

## Estructura del Proyecto

```
.
├── database/           # Scripts SQL y configuración de BD
├── backend/           # API REST en FastAPI
│   ├── app/
│   │   ├── models/    # Modelos de base de datos
│   │   ├── schemas/   # Schemas de validación
│   │   ├── routes/    # Endpoints de la API
│   │   └── ...
│   └── main.py        # Aplicación principal
├── frontend/          # SPA en Next.js
│   ├── src/
│   │   ├── app/       # Páginas
│   │   ├── components/# Componentes React
│   │   ├── lib/       # Utilidades
│   │   └── ...
│   └── package.json
└── README.md
```

## Instalación y Configuración

### 1. Base de Datos

```bash
cd database

# Opción 1: PostgreSQL local
psql -U postgres -f schema.sql

# Opción 2: Docker
docker run --name vehiculos-postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=vehiculos_operacion \
  -p 5432:5432 \
  -d postgres:14

docker exec -i vehiculos-postgres psql -U postgres -d vehiculos_operacion < schema.sql
```

### 2. Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Ejecutar servidor
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

El backend estará disponible en http://localhost:8000

### 3. Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.local.example .env.local

# Ejecutar en desarrollo
npm run dev
```

El frontend estará disponible en http://localhost:3000

## Uso del Sistema

### 1. Login
- Acceder a http://localhost:3000
- Usuario: `admin`
- Contraseña: `admin123`

### 2. Crear Operación Diaria
1. Ir a **Operaciones**
2. Clic en "Nueva Operación"
3. Seleccionar fecha y cantidad de vehículos necesarios
4. Agregar observaciones (opcional)

### 3. Registrar Vehículos
1. Entrar al detalle de una operación
2. Clic en "Agregar Vehículo"
3. Ingresar placa, hora de inicio y observaciones

### 4. Gestionar Entregas
1. Ir a **Entregas**
2. Clic en "Nueva Entrega"
3. Seleccionar vehículo y completar datos de factura/cliente
4. Marcar como "Cumplido" cuando se complete
5. Subir foto de evidencia

### 5. Ver Dashboard
- Acceder al Dashboard para ver:
  - Vehículos activos del día
  - Entregas pendientes y cumplidas
  - Porcentaje de cumplimiento
  - Listado de entregas recientes

## Modelo de Datos

### Tablas Principales

1. **usuarios**: Usuarios del sistema
2. **operaciones_diarias**: Registro de operaciones por fecha
3. **vehiculos_operacion**: Vehículos que iniciaron operación
4. **entregas**: Facturas/clientes asignados a vehículos
5. **fotos_evidencia**: Fotos de cumplimiento

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/me` - Usuario actual

### Operaciones
- `POST /api/operaciones/` - Crear operación
- `GET /api/operaciones/` - Listar operaciones
- `GET /api/operaciones/{id}` - Detalle con estadísticas
- `POST /api/operaciones/vehiculos` - Agregar vehículo

### Entregas
- `POST /api/entregas/` - Crear entrega
- `GET /api/entregas/` - Listar entregas
- `PATCH /api/entregas/{id}` - Actualizar estado
- `POST /api/entregas/{id}/fotos` - Subir foto

### Dashboard
- `GET /api/dashboard/kpis` - Obtener KPIs
- `GET /api/dashboard/entregas` - Buscar con filtros

## Documentación API

Una vez ejecutando el backend, accede a:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Características de Seguridad

- Autenticación JWT
- Passwords hasheados con bcrypt
- Validación de datos con Pydantic
- CORS configurado
- Protección de rutas en frontend

## Desarrollo

### Backend
```bash
cd backend
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm run dev
```

## Producción

### Backend
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Frontend
```bash
cd frontend
npm run build
npm start
```

## Licencia

Este proyecto es de uso interno.

## Soporte

Para reportar problemas o sugerencias, contactar al equipo de desarrollo.

---

**Nota**: Recuerde cambiar las credenciales por defecto en producción y configurar adecuadamente las variables de entorno.
