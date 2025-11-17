from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class PermisoRol(Base):
    __tablename__ = "permisos_por_rol"

    id = Column(Integer, primary_key=True, index=True)
    rol_id = Column(Integer, ForeignKey('roles.id', ondelete='CASCADE'), nullable=False)
    page_id = Column(Integer, ForeignKey('pages.id', ondelete='CASCADE'), nullable=False)
    estado = Column(String(20), default='activo')
    puede_ver = Column(Boolean, default=False)
    puede_crear = Column(Boolean, default=False)
    puede_editar = Column(Boolean, default=False)
    puede_borrar = Column(Boolean, default=False)
    fecha_control = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    usuario_control = Column(Integer, ForeignKey('usuarios.id'), nullable=True)
