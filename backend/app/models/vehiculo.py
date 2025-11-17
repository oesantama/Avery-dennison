from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Vehiculo(Base):
    __tablename__ = "vehiculos"

    id = Column(Integer, primary_key=True, index=True)
    placa = Column(String(20), unique=True, nullable=False, index=True)
    marca = Column(String(50))
    modelo = Column(String(50))
    anio = Column(Integer)
    tipo = Column(String(30))  # Campo legacy - mantener por compatibilidad
    tipo_vehiculo_id = Column(Integer, ForeignKey('tipos_vehiculo.id'), index=True)
    estado = Column(String(20), default='disponible', index=True)
    conductor_asignado = Column(String(100))
    observaciones = Column(Text)
    activo = Column(Boolean, default=True, index=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relación con tipo de vehículo
    tipo_vehiculo = relationship("TipoVehiculo", back_populates="vehiculos")
