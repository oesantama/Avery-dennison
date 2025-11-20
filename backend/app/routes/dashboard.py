from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import date, datetime
import pytz
from app.database import get_db
from app.models.usuario import Usuario
from app.models.operacion import OperacionDiaria, VehiculoOperacion
from app.models.entrega import Entrega
from app.schemas.dashboard import DashboardKPIs
from app.schemas.entrega import EntregaResponse
from app.auth import get_current_active_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/kpis", response_model=DashboardKPIs)
async def obtener_kpis(
    fecha_inicio: date = None,
    fecha_fin: date = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    # Base queries with optional date filters
    operaciones_query = db.query(func.count(OperacionDiaria.id))
    vehiculos_query = db.query(func.count(VehiculoOperacion.id))
    entregas_query = db.query(func.count(Entrega.id))

    if fecha_inicio and fecha_fin:
        operaciones_query = operaciones_query.filter(
            OperacionDiaria.fecha_operacion.between(fecha_inicio, fecha_fin)
        )
        vehiculos_query = vehiculos_query.join(OperacionDiaria).filter(
            OperacionDiaria.fecha_operacion.between(fecha_inicio, fecha_fin)
        )
        entregas_query = entregas_query.filter(
            Entrega.fecha_operacion.between(fecha_inicio, fecha_fin)
        )

    total_operaciones = operaciones_query.scalar() or 0
    total_vehiculos = vehiculos_query.scalar() or 0
    total_entregas = entregas_query.scalar() or 0

    # ✅ Today's date - usando zona horaria de Colombia (compatible Windows/pytz)
    hoy = datetime.now(pytz.timezone("America/Bogota")).date()

    # ✅ Entregas by status - SOLO DEL DÍA DE HOY (no histórico)
    entregas_pendientes_query = db.query(func.count(Entrega.id)).filter(
        and_(
            Entrega.estado == "pendiente",
            Entrega.fecha_operacion == hoy  # ✅ Solo hoy
        )
    )
    entregas_cumplidas_query = db.query(func.count(Entrega.id)).filter(
        and_(
            Entrega.estado == "cumplido",
            Entrega.fecha_operacion == hoy  # ✅ Solo hoy
        )
    )

    if fecha_inicio and fecha_fin:
        entregas_pendientes_query = entregas_pendientes_query.filter(
            Entrega.fecha_operacion.between(fecha_inicio, fecha_fin)
        )
        entregas_cumplidas_query = entregas_cumplidas_query.filter(
            Entrega.fecha_operacion.between(fecha_inicio, fecha_fin)
        )

    entregas_pendientes = entregas_pendientes_query.scalar() or 0
    entregas_cumplidas = entregas_cumplidas_query.scalar() or 0

    # ✅ Calculate percentage based on TODAY's deliveries only
    entregas_hoy_total = entregas_pendientes + entregas_cumplidas
    porcentaje_cumplimiento = (
        (entregas_cumplidas / entregas_hoy_total * 100) if entregas_hoy_total > 0 else 0
    )

    # ✅ Vehículos activos hoy
    vehiculos_activos_hoy = db.query(func.count(VehiculoOperacion.id)).join(OperacionDiaria).filter(
        OperacionDiaria.fecha_operacion == hoy
    ).scalar() or 0

    # ✅ Total de entregas de hoy (para la card)
    entregas_hoy = entregas_hoy_total

    return DashboardKPIs(
        total_operaciones=total_operaciones,
        total_vehiculos=total_vehiculos,
        total_entregas=total_entregas,
        entregas_pendientes=entregas_pendientes,
        entregas_cumplidas=entregas_cumplidas,
        porcentaje_cumplimiento=round(porcentaje_cumplimiento, 2),
        vehiculos_activos_hoy=vehiculos_activos_hoy,
        entregas_hoy=entregas_hoy
    )

@router.get("/entregas", response_model=List[EntregaResponse])
async def buscar_entregas(
    fecha_operacion_inicio: date = Query(None),
    fecha_operacion_fin: date = Query(None),
    fecha_cumplido_inicio: date = Query(None),
    fecha_cumplido_fin: date = Query(None),
    placa: str = Query(None),
    estado: str = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    query = db.query(Entrega).join(VehiculoOperacion)

    # Apply filters
    if fecha_operacion_inicio:
        query = query.filter(Entrega.fecha_operacion >= fecha_operacion_inicio)
    if fecha_operacion_fin:
        query = query.filter(Entrega.fecha_operacion <= fecha_operacion_fin)
    if fecha_cumplido_inicio:
        query = query.filter(Entrega.fecha_cumplido >= fecha_cumplido_inicio)
    if fecha_cumplido_fin:
        query = query.filter(Entrega.fecha_cumplido <= fecha_cumplido_fin)
    if placa:
        query = query.filter(VehiculoOperacion.placa.ilike(f"%{placa}%"))
    if estado:
        query = query.filter(Entrega.estado == estado)

    entregas = query.order_by(Entrega.fecha_operacion.desc()).offset(skip).limit(limit).all()
    return entregas
