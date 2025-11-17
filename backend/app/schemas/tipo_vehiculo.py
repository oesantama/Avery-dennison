from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TipoVehiculoBase(BaseModel):
    descripcion: str
    estado: Optional[str] = 'activo'

class TipoVehiculoCreate(TipoVehiculoBase):
    pass

class TipoVehiculoUpdate(BaseModel):
    descripcion: Optional[str] = None
    estado: Optional[str] = None

class TipoVehiculoResponse(TipoVehiculoBase):
    id: int
    fecha_control: datetime
    usuario_control: Optional[int] = None

    class Config:
        from_attributes = True
