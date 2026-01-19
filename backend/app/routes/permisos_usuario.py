from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.permisos import PermisosUsuario
from app.schemas.permiso_usuario import PermisoUsuarioCreate, PermisoUsuarioUpdate, PermisoUsuarioResponse
from app.auth import get_current_active_user
from app.models.usuario import Usuario
from pydantic import BaseModel

router = APIRouter(prefix="/api/permisos-usuario", tags=["permisos-usuario"])

class PermisoBulkCreate(BaseModel):
    page_id: int
    puede_ver: bool
    puede_crear: bool
    puede_editar: bool
    puede_borrar: bool  # Frontend envía puede_borrar, mapeamos a puede_eliminar

@router.get("/", response_model=List[PermisoUsuarioResponse])
def list_permisos_usuario(
    skip: int = 0,
    limit: int = 100,
    usuario_id: Optional[int] = None,
    page_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Listar permisos por usuario"""
    query = db.query(PermisosUsuario)

    if usuario_id:
        query = query.filter(PermisosUsuario.usuario_id == usuario_id)
    if page_id:
        query = query.filter(PermisosUsuario.page_id == page_id)

    permisos = query.offset(skip).limit(limit).all()
    return permisos

@router.get("/usuario/{usuario_id}")
def get_permisos_by_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Obtener todos los permisos de un usuario específico"""
    permisos = db.query(PermisosUsuario).filter(
        PermisosUsuario.usuario_id == usuario_id
    ).all()
    
    # Transformar para mapear puede_eliminar -> puede_borrar
    return [
        {
            "id": p.id,
            "usuario_id": p.usuario_id,
            "page_id": p.page_id,
            "puede_ver": p.puede_ver,
            "puede_crear": p.puede_crear,
            "puede_editar": p.puede_editar,
            "puede_borrar": p.puede_eliminar,  # Mapeo: eliminar -> borrar
            "fecha_creacion": p.fecha_creacion,
            "fecha_actualizacion": p.fecha_actualizacion
        }
        for p in permisos
    ]

@router.post("/usuario/{usuario_id}/bulk", status_code=status.HTTP_201_CREATED)
def create_bulk_permisos_usuario(
    usuario_id: int,
    permisos: List[PermisoBulkCreate],
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    ✅ Crear permisos en bulk para un usuario
    ✅ ELIMINA FÍSICAMENTE todos los permisos existentes del usuario
    ✅ Crea los nuevos permisos desde cero
    """
    # Verificar que el usuario existe
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    # ✅ ELIMINAR FÍSICAMENTE todos los permisos existentes del usuario

    db.query(PermisosUsuario).filter(
        PermisosUsuario.usuario_id == usuario_id
    ).delete(synchronize_session=False)
    db.commit()  # Commit para asegurar que los registros viejos se eliminen antes de insertar los nuevos

    # ✅ Crear nuevos permisos desde cero
    nuevos_permisos = []
    for permiso_data in permisos:
        permiso = PermisosUsuario(
            usuario_id=usuario_id,
            page_id=permiso_data.page_id,
            puede_ver=permiso_data.puede_ver,
            puede_crear=permiso_data.puede_crear,
            puede_editar=permiso_data.puede_editar,
            puede_eliminar=permiso_data.puede_borrar  # Mapear puede_borrar -> puede_eliminar
        )
        db.add(permiso)
        nuevos_permisos.append(permiso)

    db.commit()
    return {"message": f"Se crearon {len(nuevos_permisos)} permisos para el usuario", "count": len(nuevos_permisos)}

@router.get("/{permiso_id}", response_model=PermisoUsuarioResponse)
def get_permiso_usuario(
    permiso_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Obtener un permiso por ID"""
    permiso = db.query(PermisosUsuario).filter(PermisosUsuario.id == permiso_id).first()
    if not permiso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permiso no encontrado"
        )
    return permiso

@router.post("/", response_model=PermisoUsuarioResponse, status_code=status.HTTP_201_CREATED)
def create_permiso_usuario(
    permiso_data: PermisoUsuarioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Crear un nuevo permiso para un usuario"""
    # Verificar que no exista ya
    existing = db.query(PermisosUsuario).filter(
        PermisosUsuario.usuario_id == permiso_data.usuario_id,
        PermisosUsuario.page_id == permiso_data.page_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un permiso para este usuario y página"
        )

    permiso = PermisosUsuario(**permiso_data.model_dump())
    db.add(permiso)
    db.commit()
    db.refresh(permiso)
    return permiso

@router.put("/{permiso_id}", response_model=PermisoUsuarioResponse)
def update_permiso_usuario(
    permiso_id: int,
    permiso_data: PermisoUsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Actualizar un permiso"""
    permiso = db.query(PermisosUsuario).filter(PermisosUsuario.id == permiso_id).first()
    if not permiso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permiso no encontrado"
        )

    # Actualizar campos
    for field, value in permiso_data.model_dump(exclude_unset=True).items():
        setattr(permiso, field, value)

    db.commit()
    db.refresh(permiso)
    return permiso

@router.delete("/{permiso_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_permiso_usuario(
    permiso_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Eliminar un permiso físicamente"""
    permiso = db.query(PermisosUsuario).filter(PermisosUsuario.id == permiso_id).first()
    if not permiso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permiso no encontrado"
        )

    db.delete(permiso)
    db.commit()
    return None
