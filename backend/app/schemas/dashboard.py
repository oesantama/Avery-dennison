from pydantic import BaseModel
from typing import Optional
from datetime import date

class DashboardFilters(BaseModel):
    fecha_operacion_inicio: Optional[date] = None
    fecha_operacion_fin: Optional[date] = None
    fecha_cumplido_inicio: Optional[date] = None
    fecha_cumplido_fin: Optional[date] = None
    placa: Optional[str] = None
    estado: Optional[str] = None

class DashboardKPIs(BaseModel):
    total_operaciones: int
    total_vehiculos: int
    total_entregas: int
    entregas_pendientes: int
    entregas_cumplidas: int
    porcentaje_cumplimiento: float
    vehiculos_activos_hoy: int
    entregas_hoy: int
