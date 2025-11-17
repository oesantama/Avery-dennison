from pydantic import BaseModel
from typing import Optional, List
from datetime import date, time, datetime

class VehiculoOperacionBase(BaseModel):
    placa: str
    hora_inicio: Optional[time] = None
    observacion: Optional[str] = None

class VehiculoOperacionCreate(VehiculoOperacionBase):
    operacion_id: int

class VehiculoOperacionResponse(VehiculoOperacionBase):
    id: int
    operacion_id: int
    activo: bool
    created_at: datetime

    class Config:
        from_attributes = True

class OperacionDiariaBase(BaseModel):
    fecha_operacion: date
    cantidad_vehiculos_solicitados: int
    observacion: Optional[str] = None

class OperacionDiariaCreate(OperacionDiariaBase):
    pass


class OperacionDiariaUpdate(BaseModel):
    fecha_operacion: Optional[date] = None
    cantidad_vehiculos_solicitados: Optional[int] = None
    observacion: Optional[str] = None

class OperacionDiariaResponse(OperacionDiariaBase):
    id: int
    usuario_id: Optional[int] = None
    created_at: datetime
    vehiculos: List[VehiculoOperacionResponse] = []

    class Config:
        from_attributes = True

class OperacionDiariaWithStats(OperacionDiariaResponse):
    cantidad_vehiculos_iniciados: int
    cantidad_entregas_totales: int
    cantidad_entregas_pendientes: int
    cantidad_entregas_cumplidas: int
