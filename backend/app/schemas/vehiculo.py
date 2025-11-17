from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class VehiculoBase(BaseModel):
    placa: str
    marca: Optional[str] = None
    modelo: Optional[str] = None
    anio: Optional[int] = None
    tipo: Optional[str] = None  # Campo legacy - mantener por compatibilidad
    tipo_vehiculo_id: Optional[int] = None
    estado: Optional[str] = 'disponible'
    conductor_asignado: Optional[str] = None
    observaciones: Optional[str] = None
    activo: Optional[bool] = True


class VehiculoCreate(VehiculoBase):
    tipo_vehiculo_id: int  # Obligatorio en creación


class VehiculoUpdate(BaseModel):
    placa: Optional[str] = None
    marca: Optional[str] = None
    modelo: Optional[str] = None
    anio: Optional[int] = None
    tipo: Optional[str] = None
    tipo_vehiculo_id: Optional[int] = None
    estado: Optional[str] = None
    conductor_asignado: Optional[str] = None
    observaciones: Optional[str] = None
    activo: Optional[bool] = None


class VehiculoResponse(VehiculoBase):
    id: int
    fecha_creacion: datetime
    fecha_actualizacion: Optional[datetime] = None
    tipo_descripcion: Optional[str] = None  # Descripción del tipo de vehículo

    class Config:
        from_attributes = True
