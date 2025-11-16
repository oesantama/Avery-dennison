# Guía de Configuración Docker

## Credenciales por Defecto

**Usuario:** `admin`
**Contraseña:** `admin123`

## Modo Desarrollo (Recomendado)

Para desarrollo con hot-reload automático (los cambios se reflejan sin reconstruir):

```bash
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up --build
```

### Ventajas del modo desarrollo:
- ✅ Hot reload en frontend (cambios automáticos sin rebuild)
- ✅ Hot reload en backend (cambios automáticos sin rebuild)
- ✅ No usa caché
- ✅ Más rápido para desarrollar

### Acceso:
- Frontend: http://localhost:8035
- Backend API: http://localhost:3035
- Base de datos: localhost:5432

## Modo Producción

Para producción (build optimizado):

```bash
docker-compose down
docker-compose up --build
```

## Problemas Comunes

### El login no funciona

Si el login muestra "Usuario o contraseña incorrectos":

1. **Reconstruir sin caché:**
   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up
   ```

2. **Verificar que el usuario existe:**
   ```bash
   docker exec -it vehiculos-db psql -U postgres -d vehiculos_operacion -c "SELECT username FROM usuarios;"
   ```

3. **Si el usuario no existe, reiniciar la base de datos:**
   ```bash
   docker-compose down -v
   docker-compose up --build
   ```
   ⚠️ **ADVERTENCIA:** `-v` borra todos los datos de la base de datos.

### El frontend no se conecta al backend

Verifica que la URL en el navegador console (F12 → Network) sea `http://localhost:3035`.

Si no es así, reconstruye el frontend:
```bash
docker-compose down
docker-compose build --no-cache frontend
docker-compose up
```

## Comandos Útiles

### Ver logs de un servicio específico
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Reiniciar un servicio específico
```bash
docker-compose restart backend
docker-compose restart frontend
```

### Acceder a la base de datos
```bash
docker exec -it vehiculos-db psql -U postgres -d vehiculos_operacion
```

### Eliminar todo y empezar desde cero
```bash
docker-compose down -v
docker-compose up --build
```

## Estructura de Puertos

| Servicio | Puerto Host | Puerto Container |
|----------|-------------|------------------|
| Frontend | 8035 | 8035 |
| Backend | 3035 | 3035 |
| Database | 5432 | 5432 |
