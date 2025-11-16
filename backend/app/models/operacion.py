from sqlalchemy import Column, Integer, String, Text, Date, Time, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class OperacionDiaria(Base):
    __tablename__ = "operaciones_diarias"

    id = Column(Integer, primary_key=True, index=True)
    fecha_operacion = Column(Date, nullable=False, index=True)
    cantidad_vehiculos_solicitados = Column(Integer, nullable=False)
    observacion = Column(Text)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    vehiculos = relationship("VehiculoOperacion", back_populates="operacion", cascade="all, delete-orphan")

class VehiculoOperacion(Base):
    __tablename__ = "vehiculos_operacion"

    id = Column(Integer, primary_key=True, index=True)
    operacion_id = Column(Integer, ForeignKey("operaciones_diarias.id", ondelete="CASCADE"), nullable=False)
    placa = Column(String(20), nullable=False, index=True)
    hora_inicio = Column(Time)
    observacion = Column(Text)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    operacion = relationship("OperacionDiaria", back_populates="vehiculos")
    entregas = relationship("Entrega", back_populates="vehiculo", cascade="all, delete-orphan")
