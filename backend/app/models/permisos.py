from sqlalchemy import Column, Integer, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class PermisosRol(Base):
    """Permisos que tiene un rol sobre una página"""
    __tablename__ = "permisos_rol"

    id = Column(Integer, primary_key=True, index=True)
    rol_id = Column(Integer, ForeignKey('roles.id', ondelete='CASCADE'), nullable=False, index=True)
    page_id = Column(Integer, ForeignKey('pages.id', ondelete='CASCADE'), nullable=False, index=True)
    puede_ver = Column(Boolean, default=False, nullable=False)
    puede_crear = Column(Boolean, default=False, nullable=False)
    puede_editar = Column(Boolean, default=False, nullable=False)
    puede_eliminar = Column(Boolean, default=False, nullable=False)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())

    # Relaciones
    rol = relationship("Rol", back_populates="permisos")
    page = relationship("Page", back_populates="permisos_rol")

    # Constraint: Un rol solo puede tener un conjunto de permisos por página
    __table_args__ = (
        UniqueConstraint('rol_id', 'page_id', name='uq_rol_page'),
    )


class PermisosUsuario(Base):
    """Permisos específicos de un usuario que sobrescriben los del rol
    NULL significa 'usar el permiso del rol'
    """
    __tablename__ = "permisos_usuario"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey('usuarios.id', ondelete='CASCADE'), nullable=False, index=True)
    page_id = Column(Integer, ForeignKey('pages.id', ondelete='CASCADE'), nullable=False, index=True)
    puede_ver = Column(Boolean, nullable=True)  # NULL = usar permiso del rol
    puede_crear = Column(Boolean, nullable=True)  # NULL = usar permiso del rol
    puede_editar = Column(Boolean, nullable=True)  # NULL = usar permiso del rol
    puede_eliminar = Column(Boolean, nullable=True)  # NULL = usar permiso del rol
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relaciones
    usuario = relationship("Usuario", back_populates="permisos_especificos")
    page = relationship("Page", back_populates="permisos_usuario")

    # Constraint: Un usuario solo puede tener permisos específicos una vez por página
    __table_args__ = (
        UniqueConstraint('usuario_id', 'page_id', name='uq_usuario_page'),
    )
