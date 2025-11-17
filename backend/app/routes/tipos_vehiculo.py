from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.tipo_vehiculo import TipoVehiculo
from app.schemas.tipo_vehiculo import TipoVehiculoCreate, TipoVehiculoUpdate, TipoVehiculoResponse
from app.auth import get_current_active_user
from app.models.usuario import Usuario

router = APIRouter(prefix="/api/tipos-vehiculo", tags=["tipos-vehiculo"])


@router.get("/", response_model=List[TipoVehiculoResponse])
def list_tipos_vehiculo(
    skip: int = 0,
    limit: int = 100,
    estado: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Listar todos los tipos de vehículo con filtros opcionales
    """
    query = db.query(TipoVehiculo)

    if estado:
        query = query.filter(TipoVehiculo.estado == estado)

    tipos = query.order_by(TipoVehiculo.id).offset(skip).limit(limit).all()
    return tipos


@router.get("/activos", response_model=List[TipoVehiculoResponse])
def list_tipos_vehiculo_activos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Obtener solo los tipos de vehículo activos para dropdowns
    """
    tipos = db.query(TipoVehiculo).filter(TipoVehiculo.estado == 'Activo').order_by(TipoVehiculo.descripcion).all()
    return tipos


@router.get("/{tipo_id}", response_model=TipoVehiculoResponse)
def get_tipo_vehiculo(
    tipo_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Obtener un tipo de vehículo por ID
    """
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
    """
    Crear un nuevo tipo de vehículo
    """
    # Verificar que la descripción no exista
    existing_tipo = db.query(TipoVehiculo).filter(
        TipoVehiculo.descripcion == tipo_data.descripcion
    ).first()
    if existing_tipo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un tipo de vehículo con esta descripción"
        )

    # Crear tipo
    tipo = TipoVehiculo(**tipo_data.model_dump())
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
    """
    Actualizar un tipo de vehículo existente
    """
    tipo = db.query(TipoVehiculo).filter(TipoVehiculo.id == tipo_id).first()
    if not tipo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tipo de vehículo no encontrado"
        )

    # Si se está actualizando la descripción, verificar que no exista
    if tipo_data.descripcion and tipo_data.descripcion != tipo.descripcion:
        existing = db.query(TipoVehiculo).filter(
            TipoVehiculo.descripcion == tipo_data.descripcion
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe un tipo de vehículo con esta descripción"
            )

    # Actualizar campos
    for field, value in tipo_data.model_dump(exclude_unset=True).items():
        setattr(tipo, field, value)

    db.commit()
    db.refresh(tipo)
    return tipo


@router.delete("/{tipo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tipo_vehiculo(
    tipo_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Eliminar un tipo de vehículo (cambiar estado a Inactivo)
    """
    tipo = db.query(TipoVehiculo).filter(TipoVehiculo.id == tipo_id).first()
    if not tipo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tipo de vehículo no encontrado"
        )

    # Cambiar estado a Inactivo en lugar de eliminar
    tipo.estado = 'Inactivo'
    db.commit()
    return None
