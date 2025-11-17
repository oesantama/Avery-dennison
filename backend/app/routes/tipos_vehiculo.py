from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.tipo_vehiculo import TipoVehiculo
from app.schemas.tipo_vehiculo import TipoVehiculoCreate, TipoVehiculoUpdate, TipoVehiculoResponse
from app.auth import get_current_active_user
from app.models.usuario import Usuario

router = APIRouter(prefix="/api/maestros/tipos-vehiculo", tags=["maestros", "tipos-vehiculo"])

@router.get("/", response_model=List[TipoVehiculoResponse])
def list_tipos_vehiculo(
    skip: int = 0,
    limit: int = 100,
    estado: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Listar tipos de vehículos"""
    query = db.query(TipoVehiculo)

    if estado:
        query = query.filter(TipoVehiculo.estado == estado)

    tipos = query.order_by(TipoVehiculo.descripcion).offset(skip).limit(limit).all()
    return tipos

@router.get("/{tipo_id}", response_model=TipoVehiculoResponse)
def get_tipo_vehiculo(
    tipo_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Obtener un tipo de vehículo por ID"""
    tipo = db.query(TipoVehiculo).filter(TipoVehiculo.id == tipo_id).first()
    if not tipo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tipo de vehículo no encontrado"
        )
    return tipo

@router.post("/", response_model=TipoVehiculoResponse, status_code=status.HTTP_201_CREATED)
def create_tipo_vehiculo(
    tipo_data: TipoVehiculoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Crear un nuevo tipo de vehículo"""
    # Verificar que la descripción no exista
    existing = db.query(TipoVehiculo).filter(TipoVehiculo.descripcion == tipo_data.descripcion).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un tipo de vehículo con esta descripción"
        )

    tipo = TipoVehiculo(**tipo_data.model_dump(), usuario_control=current_user.id)
    db.add(tipo)
    db.commit()
    db.refresh(tipo)
    return tipo

@router.put("/{tipo_id}", response_model=TipoVehiculoResponse)
def update_tipo_vehiculo(
    tipo_id: int,
    tipo_data: TipoVehiculoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Actualizar un tipo de vehículo"""
    tipo = db.query(TipoVehiculo).filter(TipoVehiculo.id == tipo_id).first()
    if not tipo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tipo de vehículo no encontrado"
        )

    # Si se actualiza la descripción, verificar que no exista
    if tipo_data.descripcion and tipo_data.descripcion != tipo.descripcion:
        existing = db.query(TipoVehiculo).filter(TipoVehiculo.descripcion == tipo_data.descripcion).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe un tipo de vehículo con esta descripción"
            )

    # Actualizar campos
    for field, value in tipo_data.model_dump(exclude_unset=True).items():
        setattr(tipo, field, value)

    tipo.usuario_control = current_user.id
    db.commit()
    db.refresh(tipo)
    return tipo

@router.delete("/{tipo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tipo_vehiculo(
    tipo_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Eliminar un tipo de vehículo (cambiar a inactivo)"""
    tipo = db.query(TipoVehiculo).filter(TipoVehiculo.id == tipo_id).first()
    if not tipo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tipo de vehículo no encontrado"
        )

    tipo.estado = 'inactivo'
    tipo.usuario_control = current_user.id
    db.commit()
    return None
