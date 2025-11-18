from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class TipoVehiculo(Base):
    __tablename__ = "tipos_vehiculo"

    id = Column(Integer, primary_key=True, index=True)
    descripcion = Column(String(100), unique=True, nullable=False)
    estado = Column(String(20), default='activo', index=True)
    fecha_control = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    usuario_control = Column(Integer, ForeignKey('usuarios.id'), nullable=True)

    # Relación con vehículos
    vehiculos = relationship("Vehiculo", back_populates="tipo_vehiculo_rel")
