from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from datetime import datetime
import os
import shutil
from pathlib import Path
import logging
from app.database import get_db
from app.models.usuario import Usuario
from app.models.operacion import VehiculoOperacion
from app.models.entrega import Entrega, FotoEvidencia
from app.schemas.entrega import (
    EntregaCreate,
    EntregaResponse,
    EntregaUpdate,
    FotoEvidenciaResponse
)
from app.auth import get_current_active_user
from app.config import get_settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/entregas", tags=["entregas"])
settings = get_settings()

# Ensure upload directory exists with absolute path
upload_dir = Path(settings.upload_dir).resolve()
upload_dir.mkdir(parents=True, exist_ok=True)
logger.info(f"📁 Upload directory configured: {upload_dir}")

@router.post("/", response_model=EntregaResponse, status_code=status.HTTP_201_CREATED)
async def crear_entrega(
    entrega: EntregaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    # Verify vehicle exists
    vehiculo = db.query(VehiculoOperacion).filter(
        VehiculoOperacion.id == entrega.vehiculo_operacion_id
    ).first()
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")

    db_entrega = Entrega(**entrega.model_dump())
    db.add(db_entrega)
    db.commit()
    db.refresh(db_entrega)
    return db_entrega

@router.get("/", response_model=List[EntregaResponse])
async def listar_entregas(
    skip: int = 0,
    limit: int = 100,
    vehiculo_operacion_id: int = None,
    estado: str = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    from sqlalchemy.orm import joinedload
    
    query = db.query(Entrega).options(joinedload(Entrega.usuario_cumplido))

    if vehiculo_operacion_id:
        query = query.filter(Entrega.vehiculo_operacion_id == vehiculo_operacion_id)
    if estado:
        query = query.filter(Entrega.estado == estado)

    entregas = query.offset(skip).limit(limit).all()
    
    # Add usuario_cumplido_nombre to each entrega
    result = []
    for entrega in entregas:
        entrega_dict = EntregaResponse.model_validate(entrega).model_dump()
        if entrega.usuario_cumplido:
            entrega_dict['usuario_cumplido_nombre'] = entrega.usuario_cumplido.nombre_completo
        result.append(entrega_dict)
    
    return result

@router.get("/{entrega_id}", response_model=EntregaResponse)
async def obtener_entrega(
    entrega_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    from sqlalchemy.orm import joinedload
    
    entrega = db.query(Entrega).options(joinedload(Entrega.usuario_cumplido)).filter(Entrega.id == entrega_id).first()
    if not entrega:
        raise HTTPException(status_code=404, detail="Entrega no encontrada")
    
    entrega_dict = EntregaResponse.model_validate(entrega).model_dump()
    if entrega.usuario_cumplido:
        entrega_dict['usuario_cumplido_nombre'] = entrega.usuario_cumplido.nombre_completo
    
    return entrega_dict

@router.patch("/{entrega_id}", response_model=EntregaResponse)
async def actualizar_entrega(
    entrega_id: int,
    entrega_update: EntregaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    db_entrega = db.query(Entrega).filter(Entrega.id == entrega_id).first()
    if not db_entrega:
        raise HTTPException(status_code=404, detail="Entrega no encontrada")

    update_data = entrega_update.model_dump(exclude_unset=True)

    # If marking as completed, set completion date and user in Colombia timezone
    if update_data.get("estado") == "cumplido" and db_entrega.estado != "cumplido":
        from zoneinfo import ZoneInfo
        colombia_tz = ZoneInfo("America/Bogota")
        update_data["fecha_cumplido"] = datetime.now(colombia_tz)
        update_data["usuario_cumplido_id"] = current_user.id
    
    # Same for no_cumplido state
    if update_data.get("estado") == "no_cumplido" and db_entrega.estado != "no_cumplido":
        from zoneinfo import ZoneInfo
        colombia_tz = ZoneInfo("America/Bogota")
        update_data["fecha_cumplido"] = datetime.now(colombia_tz)
        update_data["usuario_cumplido_id"] = current_user.id

    for field, value in update_data.items():
        setattr(db_entrega, field, value)

    db.commit()
    db.refresh(db_entrega)
    return db_entrega

@router.post("/{entrega_id}/fotos", response_model=FotoEvidenciaResponse, status_code=status.HTTP_201_CREATED)
async def subir_foto_evidencia(
    entrega_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    logger.info(f"📸 Iniciando subida de foto para entrega {entrega_id}")
    logger.info(f"👤 Usuario: {current_user.username}")
    logger.info(f"📄 Archivo: {file.filename}, Tipo: {file.content_type}")
    
    # Verify entrega exists
    entrega = db.query(Entrega).filter(Entrega.id == entrega_id).first()
    if not entrega:
        logger.error(f"❌ Entrega {entrega_id} no encontrada")
        raise HTTPException(status_code=404, detail="Entrega no encontrada")

    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/jpg"]
    if file.content_type not in allowed_types:
        logger.error(f"❌ Tipo de archivo no permitido: {file.content_type}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se permiten imágenes (JPEG, PNG)"
        )

    # Create filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"entrega_{entrega_id}_{timestamp}{file_extension}"
    file_path = upload_dir / filename
    
    logger.info(f"💾 Guardando archivo en: {file_path}")

    try:
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Verify file was saved
        if not file_path.exists():
            logger.error(f"❌ El archivo no se guardó correctamente: {file_path}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al guardar el archivo"
            )
        
        # Get file size
        file_size = os.path.getsize(file_path)
        logger.info(f"✅ Archivo guardado exitosamente: {file_size} bytes")

        # Save to database
        db_foto = FotoEvidencia(
            entrega_id=entrega_id,
            ruta_archivo=str(file_path),
            nombre_archivo=filename,
            tipo_mime=file.content_type,
            tamano_bytes=file_size
        )
        db.add(db_foto)
        db.commit()
        db.refresh(db_foto)
        
        logger.info(f"✅ Registro en BD creado: ID {db_foto.id}")
        logger.info(f"🔗 URL de acceso: http://localhost:3035/uploads/{filename}")

        return db_foto
        
    except Exception as e:
        logger.error(f"❌ Error al subir foto: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al procesar la foto: {str(e)}"
        )

@router.get("/{entrega_id}/fotos", response_model=List[FotoEvidenciaResponse])
async def listar_fotos_entrega(
    entrega_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    fotos = db.query(FotoEvidencia).filter(FotoEvidencia.entrega_id == entrega_id).all()
    return fotos
