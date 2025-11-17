from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PermisoRolBase(BaseModel):
    rol_id: int
    page_id: int
    estado: Optional[str] = 'activo'
    puede_ver: Optional[bool] = False
    puede_crear: Optional[bool] = False
    puede_editar: Optional[bool] = False
    puede_borrar: Optional[bool] = False

class PermisoRolCreate(PermisoRolBase):
    pass

class PermisoRolUpdate(BaseModel):
    estado: Optional[str] = None
    puede_ver: Optional[bool] = None
    puede_crear: Optional[bool] = None
    puede_editar: Optional[bool] = None
    puede_borrar: Optional[bool] = None

class PermisoRolResponse(PermisoRolBase):
    id: int
    fecha_control: datetime
    usuario_control: Optional[int] = None

    class Config:
        from_attributes = True
