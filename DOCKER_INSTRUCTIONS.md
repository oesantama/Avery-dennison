# Instrucciones para ejecutar el proyecto

## Modo Desarrollo (Recomendado para testing)

Para ejecutar el proyecto en modo desarrollo con **hot-reload** (los cambios se reflejan automáticamente):

```bash
# Detener y limpiar contenedores anteriores
docker-compose down

# Construir y ejecutar en modo desarrollo
docker-compose -f docker-compose.dev.yml up --build
```

### Características del modo desarrollo:
- ✅ Hot-reload activado (cambios en código se reflejan automáticamente)
- ✅ Logs detallados en consola
- ✅ Frontend en: http://localhost:8035
- ✅ Backend en: http://localhost:3035
- ✅ Base de datos PostgreSQL en: localhost:5433

### Para detener:
```bash
docker-compose -f docker-compose.dev.yml down
```

---

## Modo Producción

Para ejecutar en modo producción optimizado (build completo):

```bash
# Detener y limpiar contenedores anteriores
docker-compose down

# Construir y ejecutar en modo producción
docker-compose up --build
```

### Características del modo producción:
- ✅ Código optimizado y minificado
- ✅ Mejor rendimiento
- ✅ Imagen más pequeña (standalone)
- ❌ NO tiene hot-reload

---

## Comandos útiles

### Ver logs en tiempo real:
```bash
# Todos los servicios
docker-compose -f docker-compose.dev.yml logs -f

# Solo frontend
docker-compose -f docker-compose.dev.yml logs -f frontend

# Solo backend
docker-compose -f docker-compose.dev.yml logs -f backend
```

### Reconstruir solo un servicio:
```bash
docker-compose -f docker-compose.dev.yml up --build frontend
```

### Limpiar todo (contenedores, volúmenes, imágenes):
```bash
docker-compose -f docker-compose.dev.yml down -v
docker system prune -a
```

---

## Validar las correcciones de hidratación

1. Ejecuta el proyecto en modo desarrollo:
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

2. Abre el navegador en: **http://localhost:8035**

3. Abre las DevTools (F12) y ve a la pestaña **Console**

4. Recarga la página (Ctrl+R o F5)

5. Verifica que **NO aparezcan** estos errores:
   - ❌ ~~Warning: Expected server HTML to contain a matching `<div>` in `<div>`~~
   - ❌ ~~Uncaught Error: Hydration failed~~
   - ❌ ~~Warning: An error occurred during hydration~~

---

## Troubleshooting

### Error: "Cannot find module '/app/server.js'"
**Solución:** Asegúrate de usar `docker-compose.dev.yml` para desarrollo:
```bash
docker-compose -f docker-compose.dev.yml up --build
```

### El puerto ya está en uso
**Solución:** Detén los contenedores anteriores:
```bash
docker-compose down
docker-compose -f docker-compose.dev.yml down
```

### Error: "Bind for 0.0.0.0:5432 failed: port is already allocated"
**Causa:** Tienes PostgreSQL instalado localmente en tu PC usando el puerto 5432.

**Solución:** El proyecto ya está configurado para usar el puerto 5433 en lugar de 5432 para evitar conflictos. Si aún así tienes problemas:

1. Verifica qué está usando el puerto (en PowerShell de Windows):
   ```powershell
   netstat -ano | findstr :5432
   netstat -ano | findstr :5433
   ```

2. Si el puerto 5433 también está ocupado, puedes cambiar el puerto en `docker-compose.dev.yml`:
   ```yaml
   ports:
     - "5434:5432"  # Cambia 5433 por otro puerto disponible
   ```

### Cambios no se reflejan
**Solución:** Reconstruye el contenedor:
```bash
docker-compose -f docker-compose.dev.yml up --build frontend
```
