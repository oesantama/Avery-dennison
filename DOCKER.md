# Guía de Docker para el Proyecto de Vehículos

## Configuración de Puertos

- **Frontend**: Puerto 8035
- **Backend**: Puerto 3035
- **Base de datos**: Puerto 5432

## Requisitos Previos

- Docker instalado (versión 20.10 o superior)
- Docker Compose instalado (versión 1.29 o superior)

## Inicio Rápido

### 1. Construir y levantar todos los servicios

```bash
docker-compose up --build
```

### 2. Levantar los servicios en segundo plano

```bash
docker-compose up -d
```

### 3. Ver logs de los servicios

```bash
# Todos los servicios
docker-compose logs -f

# Un servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### 4. Detener los servicios

```bash
docker-compose down
```

### 5. Detener y eliminar volúmenes (¡CUIDADO! Esto borrará los datos de la BD)

```bash
docker-compose down -v
```

## Acceso a los Servicios

Una vez que los contenedores estén corriendo:

- **Frontend**: http://localhost:8035
- **Backend API**: http://localhost:3035
- **Backend Docs**: http://localhost:3035/docs
- **PostgreSQL**: localhost:5432

## Comandos Útiles

### Reconstruir un servicio específico

```bash
docker-compose build backend
docker-compose build frontend
```

### Ejecutar comandos dentro de un contenedor

```bash
# Acceder al backend
docker-compose exec backend bash

# Acceder a la base de datos
docker-compose exec db psql -U postgres -d vehiculos_operacion

# Ejecutar migraciones (si las hay)
docker-compose exec backend alembic upgrade head
```

### Ver el estado de los contenedores

```bash
docker-compose ps
```

### Reiniciar un servicio específico

```bash
docker-compose restart backend
docker-compose restart frontend
```

## Desarrollo

Para desarrollo, los volúmenes están configurados para hot-reload:

- **Backend**: Los cambios en `./backend` se reflejan automáticamente (uvicorn con --reload)
- **Frontend**: Los cambios requieren reconstruir la imagen para producción

Si quieres desarrollo con hot-reload en el frontend, puedes usar:

```bash
cd frontend
npm install
npm run dev
```

Y ajustar el `API_URL` en tu `.env.local` a `http://localhost:3035`

## Solución de Problemas

### El backend no se conecta a la base de datos

Espera a que el healthcheck de PostgreSQL pase. Puedes verificar con:

```bash
docker-compose logs db
```

### Limpiar todo y empezar de cero

```bash
docker-compose down -v
docker system prune -a
docker-compose up --build
```

### Ver uso de recursos

```bash
docker stats
```

## Variables de Entorno

Las variables de entorno están configuradas en `docker-compose.yml`. Para producción, deberías:

1. Cambiar `SECRET_KEY` por una clave segura
2. Cambiar `POSTGRES_PASSWORD` por una contraseña segura
3. Usar un archivo `.env` en lugar de hardcodear valores

Ejemplo de archivo `.env`:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu_password_seguro
POSTGRES_DB=vehiculos_operacion
SECRET_KEY=tu_secret_key_muy_seguro
```

Y luego en `docker-compose.yml` usar `env_file`:

```yaml
services:
  backend:
    env_file:
      - .env
```

## Producción

Para producción, considera:

1. Remover `--reload` del comando de uvicorn
2. Usar variables de entorno seguras
3. Configurar CORS apropiadamente
4. Usar HTTPS con un reverse proxy (nginx)
5. Configurar backups de la base de datos
6. Usar docker secrets para información sensible
