# Base de Datos - Sistema de Gestión de Vehículos

## Configuración

### Requisitos
- PostgreSQL 12 o superior

### Instalación

1. Crear la base de datos:
```bash
psql -U postgres -f schema.sql
```

2. O usando Docker:
```bash
docker run --name vehiculos-postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=vehiculos_operacion \
  -p 5432:5432 \
  -d postgres:14
```

3. Ejecutar el schema:
```bash
docker exec -i vehiculos-postgres psql -U postgres -d vehiculos_operacion < schema.sql
```

## Estructura de Tablas

### usuarios
Almacena los usuarios del sistema para autenticación.

### operaciones_diarias
Registra la cantidad de vehículos solicitados por día.

### vehiculos_operacion
Registra qué vehículos (placas) iniciaron la operación.

### entregas
Registra las facturas/clientes asignados a cada vehículo.

### fotos_evidencia
Almacena las fotos de evidencia de cumplimiento.

## Credenciales por Defecto

- Usuario: `admin`
- Contraseña: `admin123`

**IMPORTANTE:** Cambiar estas credenciales en producción.
