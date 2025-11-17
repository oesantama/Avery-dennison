from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.vehiculo import Vehiculo
from app.models.tipo_vehiculo import TipoVehiculo
from app.schemas.vehiculo import VehiculoCreate, VehiculoUpdate, VehiculoResponse
from app.auth import get_current_active_user
from app.models.usuario import Usuario

router = APIRouter(prefix="/api/vehiculos", tags=["vehiculos"])

@router.get("/", response_model=List[VehiculoResponse])
def list_vehiculos(
    skip: int = 0,
    limit: int = 100,
    activo: Optional[bool] = None,
    estado: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Listar vehículos con filtros opcionales
    """
    query = db.query(Vehiculo)

    if activo is not None:
        query = query.filter(Vehiculo.activo == activo)

    if estado:
        query = query.filter(Vehiculo.estado == estado)

    vehiculos = query.order_by(Vehiculo.fecha_creacion.desc()).offset(skip).limit(limit).all()

    # Poblar tipo_descripcion
    result = []
    for vehiculo in vehiculos:
        vehiculo_dict = {
            **vehiculo.__dict__,
            'tipo_descripcion': vehiculo.tipo_vehiculo.descripcion if vehiculo.tipo_vehiculo else None
        }
        result.append(VehiculoResponse(**vehiculo_dict))

    return result

@router.get("/disponibles", response_model=List[VehiculoResponse])
def list_vehiculos_disponibles(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Obtener vehículos disponibles para asignar a entregas
    """
    vehiculos = db.query(Vehiculo).filter(
        Vehiculo.activo == True,
        Vehiculo.estado == 'disponible'
    ).order_by(Vehiculo.placa).all()

    # Poblar tipo_descripcion
    result = []
    for vehiculo in vehiculos:
        vehiculo_dict = {
            **vehiculo.__dict__,
            'tipo_descripcion': vehiculo.tipo_vehiculo.descripcion if vehiculo.tipo_vehiculo else None
        }
        result.append(VehiculoResponse(**vehiculo_dict))

    return result


@router.get("/{vehiculo_id}", response_model=VehiculoResponse)
def get_vehiculo(
    vehiculo_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Obtener un vehículo por ID
    """
    vehiculo = db.query(Vehiculo).filter(Vehiculo.id == vehiculo_id).first()
    if not vehiculo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehículo no encontrado"
        )

    # Poblar tipo_descripcion
    vehiculo_dict = {
        **vehiculo.__dict__,
        'tipo_descripcion': vehiculo.tipo_vehiculo.descripcion if vehiculo.tipo_vehiculo else None
    }

    return VehiculoResponse(**vehiculo_dict)

@router.post("/", response_model=VehiculoResponse, status_code=status.HTTP_201_CREATED)
def create_vehiculo(
    vehiculo_data: VehiculoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Crear un nuevo vehículo
    """
    # Verificar que la placa no exista
    existing_vehiculo = db.query(Vehiculo).filter(Vehiculo.placa == vehiculo_data.placa).first()
    if existing_vehiculo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un vehículo con esta placa"
        )

    # Validar que el tipo de vehículo existe y está activo
    tipo_vehiculo = db.query(TipoVehiculo).filter(
        TipoVehiculo.id == vehiculo_data.tipo_vehiculo_id
    ).first()
    if not tipo_vehiculo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El tipo de vehículo seleccionado no existe"
        )
    if tipo_vehiculo.estado != 'Activo':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El tipo de vehículo seleccionado no está activo"
        )

    # Crear vehículo
    vehiculo = Vehiculo(**vehiculo_data.model_dump())
    db.add(vehiculo)
    db.commit()
    db.refresh(vehiculo)

    # Poblar tipo_descripcion
    vehiculo_dict = {
        **vehiculo.__dict__,
        'tipo_descripcion': vehiculo.tipo_vehiculo.descripcion if vehiculo.tipo_vehiculo else None
    }

    return VehiculoResponse(**vehiculo_dict)

@router.put("/{vehiculo_id}", response_model=VehiculoResponse)
def update_vehiculo(
    vehiculo_id: int,
    vehiculo_data: VehiculoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Actualizar un vehículo existente
    """
    vehiculo = db.query(Vehiculo).filter(Vehiculo.id == vehiculo_id).first()
    if not vehiculo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehículo no encontrado"
        )

    # Si se está actualizando la placa, verificar que no exista
    if vehiculo_data.placa and vehiculo_data.placa != vehiculo.placa:
        existing = db.query(Vehiculo).filter(Vehiculo.placa == vehiculo_data.placa).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe un vehículo con esta placa"
            )

    # Si se está actualizando el tipo, validar que existe y está activo
    if vehiculo_data.tipo_vehiculo_id:
        tipo_vehiculo = db.query(TipoVehiculo).filter(
            TipoVehiculo.id == vehiculo_data.tipo_vehiculo_id
        ).first()
        if not tipo_vehiculo:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El tipo de vehículo seleccionado no existe"
            )
        if tipo_vehiculo.estado != 'Activo':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El tipo de vehículo seleccionado no está activo"
            )

    # Actualizar campos
    for field, value in vehiculo_data.model_dump(exclude_unset=True).items():
        setattr(vehiculo, field, value)

    db.commit()
    db.refresh(vehiculo)

    # Poblar tipo_descripcion
    vehiculo_dict = {
        **vehiculo.__dict__,
        'tipo_descripcion': vehiculo.tipo_vehiculo.descripcion if vehiculo.tipo_vehiculo else None
    }

    return VehiculoResponse(**vehiculo_dict)

@router.delete("/{vehiculo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehiculo(
    vehiculo_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Eliminar un vehículo (soft delete)
    """
    vehiculo = db.query(Vehiculo).filter(Vehiculo.id == vehiculo_id).first()
    if not vehiculo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehículo no encontrado"
        )

    vehiculo.activo = False
    db.commit()
    return None
