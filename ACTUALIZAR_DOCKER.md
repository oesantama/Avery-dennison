# Instrucciones para Actualizar Docker con Cambios

## Problema Resuelto
- ✅ Error de CORS al editar/eliminar registros
- ✅ Búsqueda, exportar y ordenamiento en todas las tablas

## Pasos para Actualizar en tu Máquina Local

### 1. Ir al directorio del proyecto
```bash
cd /ruta/a/tu/proyecto/Avery-dennison
```

### 2. Hacer pull de los cambios
```bash
git pull origin claude/add-table-search-export-01PXfomHVuQrJagzTCa5UbVt
# o si prefieres desde main:
# git pull origin main
```

### 3. Reiniciar Docker (Opción Automática)
```bash
./restart-docker.sh
```

### 3. Reiniciar Docker (Opción Manual)
```bash
# Detener contenedores
docker-compose down

# Reconstruir frontend (importante para que tome el nuevo API URL)
docker-compose build frontend

# Iniciar servicios
docker-compose up -d

# Ver logs (opcional)
docker-compose logs -f
```

## Verificar que Todo Funciona

1. **Backend**: Abre http://localhost:3035/docs
   - Deberías ver la documentación de FastAPI
   - Verifica que muestra el puerto 3035

2. **Frontend**: Abre http://localhost:8035
   - Inicia sesión
   - Ve a Maestros → Tipos de Vehículo
   - Prueba:
     - ✅ Buscar en la tabla
     - ✅ Ordenar por columnas (clic en encabezados)
     - ✅ Exportar a CSV
     - ✅ Editar un registro
     - ✅ Eliminar un registro

## Si Sigues Teniendo Problemas

### Limpiar todo y empezar de cero:
```bash
# Detener y eliminar contenedores, redes e imágenes
docker-compose down -v --rmi all

# Reconstruir todo
docker-compose build --no-cache

# Iniciar servicios
docker-compose up -d
```

### Verificar logs del backend:
```bash
docker-compose logs backend
```

### Verificar que el puerto está correcto:
```bash
docker-compose ps
# Deberías ver:
# vehiculos-backend    ... 0.0.0.0:3035->3035/tcp
```

## Cambios Aplicados

### Backend
- `backend/main.py`: Puerto cambiado de 8000 a 3035
- CORS configurado para aceptar peticiones desde http://localhost:8035
- Todas las rutas PUT validadas y funcionando

### Frontend
- Nuevo componente `DataTable` con:
  - 🔍 Búsqueda en tiempo real
  - 📥 Exportar a CSV
  - ⬆️⬇️ Ordenamiento por columnas
- Aplicado a todas las tablas:
  - Tipos de Vehículo
  - Usuarios
  - Roles
  - Permisos por Rol
  - Vehículos
