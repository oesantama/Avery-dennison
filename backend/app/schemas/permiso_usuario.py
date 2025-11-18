from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PermisoUsuarioBase(BaseModel):
    usuario_id: int
    page_id: int
    estado: Optional[str] = 'activo'
    puede_ver: Optional[bool] = False
    puede_crear: Optional[bool] = False
    puede_editar: Optional[bool] = False
    puede_borrar: Optional[bool] = False

class PermisoUsuarioCreate(PermisoUsuarioBase):
    pass

class PermisoUsuarioUpdate(BaseModel):
    estado: Optional[str] = None
    puede_ver: Optional[bool] = None
    puede_crear: Optional[bool] = None
    puede_editar: Optional[bool] = None
    puede_borrar: Optional[bool] = None

class PermisoUsuarioResponse(PermisoUsuarioBase):
    id: int
    fecha_control: datetime
    usuario_control: Optional[int] = None

    class Config:
        from_attributes = True
