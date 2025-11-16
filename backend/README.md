# Backend - Sistema de Gestión de Vehículos

API REST desarrollada con FastAPI para la gestión de operaciones diarias de vehículos y entregas.

## Características

- Autenticación JWT
- CRUD completo para operaciones, vehículos y entregas
- Upload de fotos de evidencia
- Dashboard con KPIs y filtros avanzados
- Documentación automática con Swagger/OpenAPI

## Requisitos

- Python 3.9+
- PostgreSQL 12+

## Instalación

1. Crear entorno virtual:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# o
venv\Scripts\activate  # Windows
```

2. Instalar dependencias:
```bash
pip install -r requirements.txt
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

4. Crear base de datos:
```bash
cd ../database
psql -U postgres -f schema.sql
```

## Ejecución

### Modo desarrollo:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Modo producción:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Documentación API

Una vez ejecutando el servidor, accede a:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Endpoints Principales

### Autenticación
- `POST /api/auth/login` - Login de usuario
- `POST /api/auth/register` - Registro de usuario
- `GET /api/auth/me` - Obtener usuario actual

### Operaciones
- `POST /api/operaciones/` - Crear operación diaria
- `GET /api/operaciones/` - Listar operaciones
- `GET /api/operaciones/{id}` - Obtener operación con estadísticas
- `POST /api/operaciones/vehiculos` - Agregar vehículo a operación
- `GET /api/operaciones/vehiculos/{operacion_id}` - Listar vehículos de operación

### Entregas
- `POST /api/entregas/` - Crear entrega
- `GET /api/entregas/` - Listar entregas
- `GET /api/entregas/{id}` - Obtener entrega
- `PATCH /api/entregas/{id}` - Actualizar entrega (marcar como cumplida)
- `POST /api/entregas/{id}/fotos` - Subir foto de evidencia
- `GET /api/entregas/{id}/fotos` - Listar fotos de entrega

### Dashboard
- `GET /api/dashboard/kpis` - Obtener KPIs
- `GET /api/dashboard/entregas` - Buscar entregas con filtros

## Variables de Entorno

```env
DATABASE_URL=postgresql://user:password@host:port/database
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
UPLOAD_DIR=uploads
```

## Estructura del Proyecto

```
backend/
├── app/
│   ├── models/          # Modelos SQLAlchemy
│   ├── schemas/         # Schemas Pydantic
│   ├── routes/          # Endpoints de la API
│   ├── config.py        # Configuración
│   ├── database.py      # Conexión DB
│   └── auth.py          # Autenticación JWT
├── uploads/             # Archivos subidos
├── main.py              # Aplicación principal
├── requirements.txt     # Dependencias
└── .env                 # Variables de entorno
```

## Credenciales por Defecto

- Usuario: `admin`
- Contraseña: `admin123`

**IMPORTANTE:** Cambiar en producción.
