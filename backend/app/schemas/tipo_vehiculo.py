from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class TipoVehiculoBase(BaseModel):
    descripcion: str = Field(..., min_length=1, max_length=100, description="Descripción del tipo de vehículo")
    estado: str = Field(default='Activo', pattern='^(Activo|Inactivo)$', description="Estado del tipo")


class TipoVehiculoCreate(TipoVehiculoBase):
    pass


class TipoVehiculoUpdate(BaseModel):
    descripcion: Optional[str] = Field(None, min_length=1, max_length=100)
    estado: Optional[str] = Field(None, pattern='^(Activo|Inactivo)$')


class TipoVehiculoResponse(TipoVehiculoBase):
    id: int
    fecha_creacion: datetime
    fecha_actualizacion: Optional[datetime] = None

    class Config:
        from_attributes = True
