from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Rol(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), unique=True, nullable=False, index=True)
    descripcion = Column(Text)

    # Campos legacy (mantener para compatibilidad)
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())

    # Nuevos campos de maestros
    estado = Column(String(20), default='activo', nullable=False, index=True)
    fecha_control = Column(DateTime(timezone=True), server_default=func.now())
    usuario_control = Column(Integer, ForeignKey('usuarios.id'))

    # Relaciones
    # Usuarios que tienen este rol asignado
    usuarios = relationship(
        "Usuario",
        back_populates="rol",
        foreign_keys="[Usuario.rol_id]",
        cascade_backrefs=False
    )
    # Usuario que controló/modificó este rol
    usuario_modificador = relationship(
        "Usuario",
        foreign_keys=[usuario_control],
        cascade_backrefs=False
    )
    permisos = relationship("PermisosRol", back_populates="rol", cascade="all, delete-orphan")
