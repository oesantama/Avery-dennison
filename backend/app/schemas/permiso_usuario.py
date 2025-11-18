from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PermisoUsuarioBase(BaseModel):
    usuario_id: int
    page_id: int
    puede_ver: Optional[bool] = False
    puede_crear: Optional[bool] = False
    puede_editar: Optional[bool] = False
    puede_borrar: Optional[bool] = False  # Frontend usa puede_borrar

class PermisoUsuarioCreate(PermisoUsuarioBase):
    pass

class PermisoUsuarioUpdate(BaseModel):
    puede_ver: Optional[bool] = None
    puede_crear: Optional[bool] = None
    puede_editar: Optional[bool] = None
    puede_borrar: Optional[bool] = None

class PermisoUsuarioResponse(PermisoUsuarioBase):
    id: int
    fecha_creacion: Optional[datetime] = None
    fecha_actualizacion: Optional[datetime] = None

    class Config:
        from_attributes = True
        # Mapear puede_eliminar del modelo a puede_borrar en el response
        populate_by_name = True
