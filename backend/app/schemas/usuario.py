from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UsuarioBase(BaseModel):
    username: str
    nombre_completo: Optional[str] = None
    email: Optional[EmailStr] = None
    numero_celular: Optional[str] = None

class UsuarioCreate(UsuarioBase):
    password: str

class UsuarioLogin(BaseModel):
    username: str
    password: str

class UsuarioResponse(UsuarioBase):
    id: int
    activo: bool
    fecha_creacion: datetime
    numero_celular: Optional[str] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
