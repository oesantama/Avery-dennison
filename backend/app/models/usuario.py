from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    nombre_completo = Column(String(100))
    email = Column(String(255), unique=True)
    numero_celular = Column(String(20))
    rol_id = Column(Integer, ForeignKey('roles.id'))
    creado_por = Column(Integer, ForeignKey('usuarios.id'), nullable=True)
    activo = Column(Boolean, default=True, index=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relaciones
    rol = relationship("Rol", back_populates="usuarios")
    creador = relationship("Usuario", remote_side=[id], foreign_keys=[creado_por])
    permisos_especificos = relationship("PermisosUsuario", back_populates="usuario", cascade="all, delete-orphan")

