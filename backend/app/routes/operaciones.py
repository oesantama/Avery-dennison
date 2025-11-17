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
    OperacionDiariaUpdate,
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
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    query = db.query(OperacionDiaria)

    if fecha_inicio:
        query = query.filter(OperacionDiaria.fecha_operacion >= fecha_inicio)
    if fecha_fin:
        query = query.filter(OperacionDiaria.fecha_operacion <= fecha_fin)

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

@router.put("/{operacion_id}", response_model=OperacionDiariaResponse)
async def actualizar_operacion(
    operacion_id: int,
    operacion_data: OperacionDiariaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Actualizar una operación diaria existente
    """
    operacion = db.query(OperacionDiaria).filter(OperacionDiaria.id == operacion_id).first()
    if not operacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Operación no encontrada"
        )

    # Actualizar solo los campos proporcionados
    for field, value in operacion_data.model_dump(exclude_unset=True).items():
        setattr(operacion, field, value)

    db.commit()
    db.refresh(operacion)
    return operacion


@router.delete("/{operacion_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_operacion(
    operacion_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Eliminar una operación diaria y todos sus vehículos asociados
    """
    operacion = db.query(OperacionDiaria).filter(OperacionDiaria.id == operacion_id).first()
    if not operacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Operación no encontrada"
        )

    # Verificar si hay entregas asociadas
    entregas_count = db.query(func.count(Entrega.id)).join(VehiculoOperacion).filter(
        VehiculoOperacion.operacion_id == operacion_id
    ).scalar()

    if entregas_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede eliminar la operación porque tiene {entregas_count} entregas asociadas"
        )

    # Eliminar operación (en cascada eliminará vehículos de operación)
    db.delete(operacion)
    db.commit()
    return None
