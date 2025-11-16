from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base

class EstadoEntrega(str, enum.Enum):
    PENDIENTE = "pendiente"
    CUMPLIDO = "cumplido"

class Entrega(Base):
    __tablename__ = "entregas"

    id = Column(Integer, primary_key=True, index=True)
    vehiculo_operacion_id = Column(Integer, ForeignKey("vehiculos_operacion.id", ondelete="CASCADE"), nullable=False)
    numero_factura = Column(String(50), nullable=False)
    cliente = Column(String(200))
    observacion = Column(Text)
    estado = Column(String(20), default="pendiente", index=True)
    fecha_operacion = Column(Date, nullable=False, index=True)
    fecha_cumplido = Column(DateTime(timezone=True), index=True)
    usuario_cumplido_id = Column(Integer, ForeignKey("usuarios.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    vehiculo = relationship("VehiculoOperacion", back_populates="entregas")
    fotos = relationship("FotoEvidencia", back_populates="entrega", cascade="all, delete-orphan")

class FotoEvidencia(Base):
    __tablename__ = "fotos_evidencia"

    id = Column(Integer, primary_key=True, index=True)
    entrega_id = Column(Integer, ForeignKey("entregas.id", ondelete="CASCADE"), nullable=False)
    ruta_archivo = Column(String(500), nullable=False)
    nombre_archivo = Column(String(200))
    tipo_mime = Column(String(100))
    tamano_bytes = Column(Integer)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    entrega = relationship("Entrega", back_populates="fotos")
