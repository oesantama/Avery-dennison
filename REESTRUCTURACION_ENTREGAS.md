# Reestructuración del Sistema de Entregas

## Fecha: 17/11/2025

## Cambios Realizados

### 1. Flujo Reestructurado

**ANTES:**

- Ver entregas desde un query parameter `?vehiculo=X`
- No había gestión clara de entregas por vehículo

**AHORA:**

- **Operación → Vehículos → Entregas** (flujo claro y jerárquico)
- Ruta: `/operaciones/[id]/vehiculo/[vehiculoId]/entregas`

### 2. Nueva Página de Gestión de Entregas

**Ubicación:** `frontend/src/app/operaciones/[id]/vehiculo/[vehiculoId]/entregas/page.tsx`

**Funcionalidades:**

#### a) Agregar Entregas Pendientes

- Modal para crear nueva entrega
- Campos: N° Factura, Cliente, Observaciones
- Estado automático: `pendiente`
- Relación: Operación + Vehículo + Entrega

#### b) Tabla de Entregas

- Lista todas las entregas del vehículo
- Columnas: Factura, Cliente, Estado, Observaciones, Acciones
- Estados con badges de colores:
  - **Pendiente:** Amarillo
  - **Cumplido:** Verde
  - **No Cumplido:** Rojo

#### c) Completar Entregas

- Modal para marcar entrega como cumplida/no cumplida
- Opciones:
  - ✅ **Cumplido** (con checkbox visual)
  - ❌ **No Cumplido** (con checkbox visual)
- Subir foto de evidencia (opcional)
- Agregar observaciones adicionales

#### d) Estadísticas

- Total de entregas
- Entregas pendientes
- Entregas cumplidas

### 3. Backend - Nuevos Endpoints

#### Operaciones API

```python
GET /api/operaciones/vehiculo/{vehiculo_id}
```

- Obtiene datos de un vehículo específico de una operación

#### Entregas API (ya existentes, sin cambios)

```python
POST /api/entregas/                          # Crear entrega
GET /api/entregas/?vehiculo_operacion_id=X  # Listar por vehículo
PATCH /api/entregas/{id}                     # Actualizar estado
POST /api/entregas/{id}/fotos                # Subir foto
```

### 4. Modelo de Datos Actualizado

#### Estado de Entrega

```python
class EstadoEntrega(str, enum.Enum):
    PENDIENTE = "pendiente"      # Al crear la entrega
    CUMPLIDO = "cumplido"         # Entrega exitosa
    NO_CUMPLIDO = "no_cumplido"   # Entrega fallida
```

#### Campos de Entrega

- `numero_factura`: Identificador de la entrega
- `cliente`: Nombre del cliente
- `observacion`: Observaciones iniciales
- `estado`: pendiente | cumplido | no_cumplido
- `fecha_cumplido`: Timestamp cuando se completó
- `usuario_cumplido_id`: Usuario que completó la entrega
- `fotos`: Relación con fotos de evidencia

### 5. Frontend - API Methods Agregados

```typescript
// operacionesApi
getVehiculo(vehiculoId: number): Promise<VehiculoOperacion>

// entregasApi (ya existían)
create(data): Promise<Entrega>
list({ vehiculo_operacion_id }): Promise<Entrega[]>
update(id, data): Promise<Entrega>
uploadPhoto(entregaId, file): Promise<void>
```

### 6. Migración de Base de Datos

```sql
ALTER TABLE entregas
ADD CONSTRAINT entregas_estado_check
CHECK (estado IN ('pendiente', 'cumplido', 'no_cumplido'));
```

- ✅ Aplicada exitosamente

### 7. TypeScript Types Actualizados

```typescript
export interface Entrega {
  estado: 'pendiente' | 'cumplido' | 'no_cumplido';
  // ... otros campos
}

export interface EntregaUpdate {
  estado?: 'pendiente' | 'cumplido' | 'no_cumplido';
  observacion?: string;
}
```

## Flujo de Usuario

### 1. Ver Operación

```
/operaciones/[id]
```

- Lista de vehículos de la operación
- Botón "Gestionar Entregas" por vehículo

### 2. Gestionar Entregas de Vehículo

```
/operaciones/[id]/vehiculo/[vehiculoId]/entregas
```

#### Acciones disponibles:

1. **Agregar Entrega** (botón superior derecho)

   - Modal con formulario
   - Crear entrega en estado `pendiente`

2. **Ver Tabla de Entregas**

   - Todas las entregas del vehículo
   - Estados visuales con badges

3. **Completar Entrega** (solo si estado = pendiente)
   - Click en botón "Completar"
   - Modal con opciones:
     - Radio button: Cumplido / No Cumplido
     - Upload de foto (opcional)
     - Observaciones adicionales
   - Al guardar:
     - Actualiza estado
     - Sube foto si hay
     - Registra fecha y usuario

## Ventajas del Nuevo Flujo

✅ **Claridad:** Flujo jerárquico natural (Operación → Vehículo → Entregas)
✅ **Trazabilidad:** Cada entrega relacionada con operación + vehículo
✅ **Estado claro:** Pendiente, Cumplido, No Cumplido con colores distintivos
✅ **Evidencia:** Fotos adjuntas a cada entrega
✅ **Observaciones:** Contexto adicional en cada etapa
✅ **Estadísticas:** Vista rápida del progreso de entregas

## Testing Recomendado

1. ✅ Crear operación del día actual
2. ✅ Agregar vehículo a la operación
3. ✅ Click en "Gestionar Entregas"
4. ✅ Agregar 3 entregas con diferentes facturas
5. ✅ Marcar 1 como "Cumplido" con foto
6. ✅ Marcar 1 como "No Cumplido" con observación
7. ✅ Dejar 1 como "Pendiente"
8. ✅ Verificar estadísticas actualizadas
9. ✅ Verificar que solo entregas pendientes tengan botón "Completar"

## Próximos Pasos (Opcionales)

- [ ] Filtros por estado en tabla de entregas
- [ ] Exportar reporte de entregas a PDF/Excel
- [ ] Notificaciones cuando todas las entregas estén cumplidas
- [ ] Galería de fotos por entrega
- [ ] Editar entregas pendientes
- [ ] Historial de cambios de estado
