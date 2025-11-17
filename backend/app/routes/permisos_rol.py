from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.permiso_rol import PermisoRol
from app.schemas.permiso_rol import PermisoRolCreate, PermisoRolUpdate, PermisoRolResponse
from app.auth import get_current_active_user
from app.models.usuario import Usuario

router = APIRouter(prefix="/api/maestros/permisos-rol", tags=["maestros", "permisos-rol"])

@router.get("/", response_model=List[PermisoRolResponse])
def list_permisos_rol(
    skip: int = 0,
    limit: int = 100,
    rol_id: Optional[int] = None,
    page_id: Optional[int] = None,
    estado: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Listar permisos por rol"""
    query = db.query(PermisoRol)

    if rol_id:
        query = query.filter(PermisoRol.rol_id == rol_id)
    if page_id:
        query = query.filter(PermisoRol.page_id == page_id)
    if estado:
        query = query.filter(PermisoRol.estado == estado)

    permisos = query.offset(skip).limit(limit).all()
    return permisos

@router.get("/{permiso_id}", response_model=PermisoRolResponse)
def get_permiso_rol(
    permiso_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Obtener un permiso por ID"""
    permiso = db.query(PermisoRol).filter(PermisoRol.id == permiso_id).first()
    if not permiso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permiso no encontrado"
        )
    return permiso

@router.post("/", response_model=PermisoRolResponse, status_code=status.HTTP_201_CREATED)
def create_permiso_rol(
    permiso_data: PermisoRolCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Crear un nuevo permiso para un rol"""
    # Verificar que no exista ya
    existing = db.query(PermisoRol).filter(
        PermisoRol.rol_id == permiso_data.rol_id,
        PermisoRol.page_id == permiso_data.page_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un permiso para este rol y página"
        )

    permiso = PermisoRol(**permiso_data.model_dump(), usuario_control=current_user.id)
    db.add(permiso)
    db.commit()
    db.refresh(permiso)
    return permiso

@router.put("/{permiso_id}", response_model=PermisoRolResponse)
def update_permiso_rol(
    permiso_id: int,
    permiso_data: PermisoRolUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Actualizar un permiso"""
    permiso = db.query(PermisoRol).filter(PermisoRol.id == permiso_id).first()
    if not permiso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permiso no encontrado"
        )

    # Actualizar campos
    for field, value in permiso_data.model_dump(exclude_unset=True).items():
        setattr(permiso, field, value)

    permiso.usuario_control = current_user.id
    db.commit()
    db.refresh(permiso)
    return permiso

@router.delete("/{permiso_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_permiso_rol(
    permiso_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Eliminar un permiso (cambiar a inactivo)"""
    permiso = db.query(PermisoRol).filter(PermisoRol.id == permiso_id).first()
    if not permiso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permiso no encontrado"
        )

    permiso.estado = 'inactivo'
    permiso.usuario_control = current_user.id
    db.commit()
    return None
