from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from app.database import get_db
from app.models.usuario import Usuario
from app.models.operacion import OperacionDiaria, VehiculoOperacion
from app.models.entrega import Entrega
from app.schemas.operacion import (
    OperacionDiariaCreate,
    OperacionDiariaResponse,
    OperacionDiariaWithStats,
    VehiculoOperacionCreate,
    VehiculoOperacionResponse
)
from app.auth import get_current_active_user

router = APIRouter(prefix="/api/operaciones", tags=["operaciones"])

@router.post("/", response_model=OperacionDiariaResponse, status_code=status.HTTP_201_CREATED)
async def crear_operacion(
    operacion: OperacionDiariaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    ✅ Crea una nueva operación diaria
    ✅ La fecha viene del frontend en formato YYYY-MM-DD (sin zona horaria)
    ✅ Se guarda tal cual sin conversión
    """
    db_operacion = OperacionDiaria(
        **operacion.model_dump(),
        usuario_id=current_user.id
    )
    db.add(db_operacion)
    db.commit()
    db.refresh(db_operacion)
    return db_operacion

@router.get("/", response_model=List[OperacionDiariaResponse])
async def listar_operaciones(
    skip: int = 0,
    limit: int = 100,
    fecha_inicio: date = None,
    fecha_fin: date = None,
    placa: str = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    from zoneinfo import ZoneInfo
    from datetime import datetime
    
    query = db.query(OperacionDiaria)

    # Si no se especifican filtros de fecha, mostrar solo las de hoy
    if not fecha_inicio and not fecha_fin:
        colombia_tz = ZoneInfo("America/Bogota")
        today = datetime.now(colombia_tz).date()
        query = query.filter(OperacionDiaria.fecha_operacion == today)
    else:
        if fecha_inicio:
            query = query.filter(OperacionDiaria.fecha_operacion >= fecha_inicio)
        if fecha_fin:
            query = query.filter(OperacionDiaria.fecha_operacion <= fecha_fin)
    
    # Filtro por placa
    if placa:
        query = query.join(OperacionDiaria.vehiculos).filter(
            VehiculoOperacion.placa.ilike(f"%{placa}%")
        )

    operaciones = query.order_by(OperacionDiaria.fecha_operacion.desc()).offset(skip).limit(limit).all()
    return operaciones

@router.get("/{operacion_id}", response_model=OperacionDiariaWithStats)
async def obtener_operacion(
    operacion_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    operacion = db.query(OperacionDiaria).filter(OperacionDiaria.id == operacion_id).first()
    if not operacion:
        raise HTTPException(status_code=404, detail="Operación no encontrada")

    # Calculate statistics
    vehiculos_count = db.query(func.count(VehiculoOperacion.id)).filter(
        VehiculoOperacion.operacion_id == operacion_id
    ).scalar()

    entregas_totales = db.query(func.count(Entrega.id)).join(VehiculoOperacion).filter(
        VehiculoOperacion.operacion_id == operacion_id
    ).scalar()

    entregas_pendientes = db.query(func.count(Entrega.id)).join(VehiculoOperacion).filter(
        VehiculoOperacion.operacion_id == operacion_id,
        Entrega.estado == "pendiente"
    ).scalar()

    entregas_cumplidas = db.query(func.count(Entrega.id)).join(VehiculoOperacion).filter(
        VehiculoOperacion.operacion_id == operacion_id,
        Entrega.estado == "cumplido"
    ).scalar()

    return {
        **operacion.__dict__,
        "cantidad_vehiculos_iniciados": vehiculos_count,
        "cantidad_entregas_totales": entregas_totales,
        "cantidad_entregas_pendientes": entregas_pendientes,
        "cantidad_entregas_cumplidas": entregas_cumplidas
    }

@router.post("/vehiculos", response_model=VehiculoOperacionResponse, status_code=status.HTTP_201_CREATED)
async def agregar_vehiculo_operacion(
    vehiculo: VehiculoOperacionCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    # Verify operation exists
    operacion = db.query(OperacionDiaria).filter(OperacionDiaria.id == vehiculo.operacion_id).first()
    if not operacion:
        raise HTTPException(status_code=404, detail="Operación no encontrada")

    # Check if plate already exists for this operation
    existing = db.query(VehiculoOperacion).filter(
        VehiculoOperacion.operacion_id == vehiculo.operacion_id,
        VehiculoOperacion.placa == vehiculo.placa
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta placa ya está registrada en esta operación"
        )

    db_vehiculo = VehiculoOperacion(**vehiculo.model_dump())
    db.add(db_vehiculo)
    db.commit()
    db.refresh(db_vehiculo)
    return db_vehiculo

@router.get("/vehiculos/{operacion_id}", response_model=List[VehiculoOperacionResponse])
async def listar_vehiculos_operacion(
    operacion_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    vehiculos = db.query(VehiculoOperacion).filter(
        VehiculoOperacion.operacion_id == operacion_id
    ).all()
    return vehiculos

@router.get("/vehiculo/{vehiculo_id}", response_model=VehiculoOperacionResponse)
async def obtener_vehiculo_operacion(
    vehiculo_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    vehiculo = db.query(VehiculoOperacion).filter(
        VehiculoOperacion.id == vehiculo_id
    ).first()
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    return vehiculo
