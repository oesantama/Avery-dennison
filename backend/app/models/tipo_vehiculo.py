from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class TipoVehiculo(Base):
    __tablename__ = "tipos_vehiculo"

    id = Column(Integer, primary_key=True, index=True)
    descripcion = Column(String(100), unique=True, nullable=False, index=True)
    estado = Column(String(20), default='Activo', nullable=False, index=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relación con vehículos
    vehiculos = relationship("Vehiculo", back_populates="tipo_vehiculo")
