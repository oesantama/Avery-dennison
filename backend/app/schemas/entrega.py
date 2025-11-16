from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class FotoEvidenciaBase(BaseModel):
    nombre_archivo: str
    ruta_archivo: str
    tipo_mime: Optional[str] = None
    tamano_bytes: Optional[int] = None

class FotoEvidenciaResponse(FotoEvidenciaBase):
    id: int
    entrega_id: int
    uploaded_at: datetime

    class Config:
        from_attributes = True

class EntregaBase(BaseModel):
    numero_factura: str
    cliente: Optional[str] = None
    observacion: Optional[str] = None
    fecha_operacion: date

class EntregaCreate(EntregaBase):
    vehiculo_operacion_id: int

class EntregaUpdate(BaseModel):
    estado: Optional[str] = None
    observacion: Optional[str] = None
    fecha_cumplido: Optional[datetime] = None

class EntregaResponse(EntregaBase):
    id: int
    vehiculo_operacion_id: int
    estado: str
    fecha_cumplido: Optional[datetime] = None
    usuario_cumplido_id: Optional[int] = None
    created_at: datetime
    fotos: List[FotoEvidenciaResponse] = []

    class Config:
        from_attributes = True
