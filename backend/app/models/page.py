from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Page(Base):
    __tablename__ = "pages"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), unique=True, nullable=False, index=True)  # Identificador técnico
    nombre_display = Column(String(100), nullable=False)  # Nombre para mostrar
    ruta = Column(String(200), nullable=False)  # Ruta en el frontend
    icono = Column(String(50))  # Icono de react-icons
    orden = Column(Integer, default=0)  # Orden en el menú
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())

    # Relaciones
    permisos_rol = relationship("PermisosRol", back_populates="page", cascade="all, delete-orphan")
    permisos_usuario = relationship("PermisosUsuario", back_populates="page", cascade="all, delete-orphan")
