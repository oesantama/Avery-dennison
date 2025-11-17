"""
Schemas Pydantic para RBAC (Role-Based Access Control)
"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime


# ==================== SCHEMAS DE ROL ====================

class RolBase(BaseModel):
    nombre: str = Field(..., min_length=3, max_length=50, description="Nombre del rol")
    descripcion: Optional[str] = Field(None, description="Descripción del rol")
    activo: bool = Field(True, description="Si el rol está activo")


class RolCreate(RolBase):
    pass


class RolUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=3, max_length=50)
    descripcion: Optional[str] = None
    activo: Optional[bool] = None


class RolResponse(RolBase):
    id: int
    fecha_creacion: datetime

    class Config:
        from_attributes = True


# ==================== SCHEMAS DE PAGE ====================

class PageBase(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=50, description="Identificador técnico de la página")
    nombre_display: str = Field(..., min_length=2, max_length=100, description="Nombre para mostrar")
    ruta: str = Field(..., description="Ruta en el frontend")
    icono: Optional[str] = Field(None, max_length=50, description="Nombre del icono de react-icons")
    orden: int = Field(0, ge=0, description="Orden en el menú")
    activo: bool = Field(True, description="Si la página está activa")


class PageCreate(PageBase):
    pass


class PageUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=2, max_length=50)
    nombre_display: Optional[str] = Field(None, min_length=2, max_length=100)
    ruta: Optional[str] = None
    icono: Optional[str] = Field(None, max_length=50)
    orden: Optional[int] = Field(None, ge=0)
    activo: Optional[bool] = None


class PageResponse(PageBase):
    id: int
    fecha_creacion: datetime

    class Config:
        from_attributes = True


# ==================== SCHEMAS DE PERMISOS ====================

class PermisosBase(BaseModel):
    puede_ver: bool = Field(False, description="Permiso para ver/listar")
    puede_crear: bool = Field(False, description="Permiso para crear")
    puede_editar: bool = Field(False, description="Permiso para editar")
    puede_eliminar: bool = Field(False, description="Permiso para eliminar")


class PermisosRolCreate(PermisosBase):
    rol_id: int = Field(..., description="ID del rol")
    page_id: int = Field(..., description="ID de la página")


class PermisosRolUpdate(PermisosBase):
    pass


class PermisosRolResponse(PermisosBase):
    id: int
    rol_id: int
    page_id: int
    fecha_creacion: datetime

    class Config:
        from_attributes = True


class PermisosUsuarioBase(BaseModel):
    """NULL significa 'usar el permiso del rol'"""
    puede_ver: Optional[bool] = Field(None, description="Permiso para ver (null = heredar del rol)")
    puede_crear: Optional[bool] = Field(None, description="Permiso para crear (null = heredar del rol)")
    puede_editar: Optional[bool] = Field(None, description="Permiso para editar (null = heredar del rol)")
    puede_eliminar: Optional[bool] = Field(None, description="Permiso para eliminar (null = heredar del rol)")


class PermisosUsuarioCreate(PermisosUsuarioBase):
    usuario_id: int = Field(..., description="ID del usuario")
    page_id: int = Field(..., description="ID de la página")


class PermisosUsuarioUpdate(PermisosUsuarioBase):
    pass


class PermisosUsuarioResponse(PermisosUsuarioBase):
    id: int
    usuario_id: int
    page_id: int
    fecha_creacion: datetime
    fecha_actualizacion: datetime

    class Config:
        from_attributes = True


# ==================== SCHEMAS DE USUARIO (ACTUALIZADOS) ====================

class UsuarioBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Nombre de usuario")
    nombre_completo: Optional[str] = Field(None, max_length=100, description="Nombre completo")
    email: EmailStr = Field(..., description="Correo electrónico")
    numero_celular: Optional[str] = Field(None, max_length=20, description="Número de celular")
    rol_id: int = Field(..., description="ID del rol del usuario")
    activo: bool = Field(True, description="Si el usuario está activo")


class UsuarioCreate(UsuarioBase):
    password: str = Field(..., min_length=6, description="Contraseña (min 6 caracteres)")

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('La contraseña debe tener al menos 6 caracteres')
        return v


class UsuarioUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    nombre_completo: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    numero_celular: Optional[str] = Field(None, max_length=20)
    rol_id: Optional[int] = None
    activo: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=6, description="Nueva contraseña (opcional)")

    @validator('password')
    def validate_password(cls, v):
        if v is not None and len(v) < 6:
            raise ValueError('La contraseña debe tener al menos 6 caracteres')
        return v


class UsuarioResponse(UsuarioBase):
    id: int
    creado_por: Optional[int] = None
    fecha_creacion: datetime
    fecha_actualizacion: datetime

    class Config:
        from_attributes = True


class UsuarioConRol(UsuarioResponse):
    """Usuario con información del rol"""
    rol: Optional[RolResponse] = None


# ==================== SCHEMAS DE PERMISOS EFECTIVOS ====================

class PermisosEfectivos(PermisosBase):
    """Permisos efectivos de un usuario en una página (combinando rol + usuario)"""
    page_id: int
    page_nombre: str
    page_display: str
    page_ruta: str
    page_icono: Optional[str] = None


class UsuarioPermisosCompletos(UsuarioConRol):
    """Usuario con todos sus permisos efectivos"""
    permisos: List[PermisosEfectivos] = []


# ==================== SCHEMAS DE BULK OPERATIONS ====================

class AsignarPermisosRolBulk(BaseModel):
    """Asignar múltiples permisos a un rol de una vez"""
    rol_id: int
    permisos: List[PermisosRolCreate]


class AsignarPermisosUsuarioBulk(BaseModel):
    """Asignar múltiples permisos a un usuario de una vez"""
    usuario_id: int
    permisos: List[PermisosUsuarioCreate]


# ==================== SCHEMAS DE MENÚ ====================

class MenuItemPermisos(BaseModel):
    """Item de menú con permisos del usuario"""
    id: int
    nombre: str
    nombre_display: str
    ruta: str
    icono: Optional[str]
    orden: int
    puede_ver: bool
    puede_crear: bool
    puede_editar: bool
    puede_eliminar: bool
