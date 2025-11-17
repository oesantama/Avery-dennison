"""
Endpoints para gestión de Roles, Pages y Permisos (RBAC)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Rol, Page, PermisosRol, PermisosUsuario, Usuario
from app.schemas.rbac import (
    RolCreate,
    RolUpdate,
    RolResponse,
    PageCreate,
    PageUpdate,
    PageResponse,
    PermisosRolCreate,
    PermisosRolUpdate,
    PermisosRolResponse,
    PermisosUsuarioCreate,
    PermisosUsuarioUpdate,
    PermisosUsuarioResponse,
    MenuItemPermisos
)
from app.dependencies.authorization import require_admin
from app.auth import get_current_active_user
from app.services.authorization import AuthorizationService

router = APIRouter(tags=["rbac"])


# ==================== ENDPOINTS DE ROLES ====================

@router.get("/api/roles", response_model=List[RolResponse])
def listar_roles(
    skip: int = 0,
    limit: int = 100,
    activo: bool = None,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin)
):
    """Lista todos los roles. Solo administradores."""
    query = db.query(Rol)
    if activo is not None:
        query = query.filter(Rol.activo == activo)
    return query.offset(skip).limit(limit).all()


@router.get("/api/roles/{rol_id}", response_model=RolResponse)
def obtener_rol(
    rol_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin)
):
    """Obtiene un rol específico. Solo administradores."""
    rol = db.query(Rol).filter(Rol.id == rol_id).first()
    if not rol:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    return rol


@router.post("/api/roles", response_model=RolResponse, status_code=status.HTTP_201_CREATED)
def crear_rol(
    rol: RolCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin)
):
    """Crea un nuevo rol. Solo administradores."""
    # Verificar que el nombre no exista
    if db.query(Rol).filter(Rol.nombre == rol.nombre).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un rol con ese nombre"
        )

    db_rol = Rol(**rol.dict())
    db.add(db_rol)
    db.commit()
    db.refresh(db_rol)
    return db_rol


@router.put("/api/roles/{rol_id}", response_model=RolResponse)
def actualizar_rol(
    rol_id: int,
    rol_update: RolUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin)
):
    """Actualiza un rol existente. Solo administradores."""
    db_rol = db.query(Rol).filter(Rol.id == rol_id).first()
    if not db_rol:
        raise HTTPException(status_code=404, detail="Rol no encontrado")

    update_data = rol_update.dict(exclude_unset=True)

    # Si se actualiza el nombre, verificar que no exista
    if "nombre" in update_data and update_data["nombre"] != db_rol.nombre:
        if db.query(Rol).filter(Rol.nombre == update_data["nombre"]).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe un rol con ese nombre"
            )

    for field, value in update_data.items():
        setattr(db_rol, field, value)

    db.commit()
    db.refresh(db_rol)
    return db_rol


@router.delete("/api/roles/{rol_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_rol(
    rol_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin)
):
    """Desactiva un rol. Solo administradores."""
    db_rol = db.query(Rol).filter(Rol.id == rol_id).first()
    if not db_rol:
        raise HTTPException(status_code=404, detail="Rol no encontrado")

    # Verificar que no haya usuarios con este rol
    usuarios_con_rol = db.query(Usuario).filter(Usuario.rol_id == rol_id, Usuario.activo == True).count()
    if usuarios_con_rol > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede eliminar el rol porque hay {usuarios_con_rol} usuario(s) activo(s) con este rol"
        )

    # Desactivar en lugar de eliminar
    db_rol.activo = False
    db.commit()
    return None


# ==================== ENDPOINTS DE PAGES ====================

@router.get("/api/pages", response_model=List[PageResponse])
def listar_pages(
    skip: int = 0,
    limit: int = 100,
    activo: bool = None,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin)
):
    """Lista todas las páginas. Solo administradores."""
    query = db.query(Page)
    if activo is not None:
        query = query.filter(Page.activo == activo)
    return query.order_by(Page.orden).offset(skip).limit(limit).all()


@router.get("/api/pages/{page_id}", response_model=PageResponse)
def obtener_page(
    page_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin)
):
    """Obtiene una página específica. Solo administradores."""
    page = db.query(Page).filter(Page.id == page_id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Página no encontrada")
    return page


@router.post("/api/pages", response_model=PageResponse, status_code=status.HTTP_201_CREATED)
def crear_page(
    page: PageCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin)
):
    """Crea una nueva página. Solo administradores."""
    # Verificar que el nombre no exista
    if db.query(Page).filter(Page.nombre == page.nombre).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe una página con ese nombre"
        )

    db_page = Page(**page.dict())
    db.add(db_page)
    db.commit()
    db.refresh(db_page)
    return db_page


@router.put("/api/pages/{page_id}", response_model=PageResponse)
def actualizar_page(
    page_id: int,
    page_update: PageUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin)
):
    """Actualiza una página existente. Solo administradores."""
    db_page = db.query(Page).filter(Page.id == page_id).first()
    if not db_page:
        raise HTTPException(status_code=404, detail="Página no encontrada")

    update_data = page_update.dict(exclude_unset=True)

    # Si se actualiza el nombre, verificar que no exista
    if "nombre" in update_data and update_data["nombre"] != db_page.nombre:
        if db.query(Page).filter(Page.nombre == update_data["nombre"]).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe una página con ese nombre"
            )

    for field, value in update_data.items():
        setattr(db_page, field, value)

    db.commit()
    db.refresh(db_page)
    return db_page


@router.delete("/api/pages/{page_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_page(
    page_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin)
):
    """Desactiva una página. Solo administradores."""
    db_page = db.query(Page).filter(Page.id == page_id).first()
    if not db_page:
        raise HTTPException(status_code=404, detail="Página no encontrada")

    # Desactivar en lugar de eliminar
    db_page.activo = False
    db.commit()
    return None


# ==================== ENDPOINTS DE PERMISOS DE ROL ====================

@router.get("/api/permisos-rol", response_model=List[PermisosRolResponse])
def listar_permisos_rol(
    rol_id: int = None,
    page_id: int = None,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin)
):
    """Lista permisos de roles. Puede filtrar por rol_id o page_id. Solo administradores."""
    query = db.query(PermisosRol)
    if rol_id:
        query = query.filter(PermisosRol.rol_id == rol_id)
    if page_id:
        query = query.filter(PermisosRol.page_id == page_id)
    return query.all()


@router.post("/api/permisos-rol", response_model=PermisosRolResponse, status_code=status.HTTP_201_CREATED)
def crear_permiso_rol(
    permiso: PermisosRolCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin)
):
    """Crea/actualiza permisos de un rol en una página. Solo administradores."""
    # Verificar que el rol existe
    rol = db.query(Rol).filter(Rol.id == permiso.rol_id).first()
    if not rol:
        raise HTTPException(status_code=404, detail="Rol no encontrado")

    # Verificar que la página existe
    page = db.query(Page).filter(Page.id == permiso.page_id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Página no encontrada")

    # Verificar si ya existe el permiso (si existe, actualizar)
    db_permiso = db.query(PermisosRol).filter(
        PermisosRol.rol_id == permiso.rol_id,
        PermisosRol.page_id == permiso.page_id
    ).first()

    if db_permiso:
        # Actualizar
        for field, value in permiso.dict().items():
            setattr(db_permiso, field, value)
    else:
        # Crear nuevo
        db_permiso = PermisosRol(**permiso.dict())
        db.add(db_permiso)

    db.commit()
    db.refresh(db_permiso)
    return db_permiso


@router.put("/api/permisos-rol/{permiso_id}", response_model=PermisosRolResponse)
def actualizar_permiso_rol(
    permiso_id: int,
    permiso_update: PermisosRolUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin)
):
    """Actualiza permisos de un rol. Solo administradores."""
    db_permiso = db.query(PermisosRol).filter(PermisosRol.id == permiso_id).first()
    if not db_permiso:
        raise HTTPException(status_code=404, detail="Permiso no encontrado")

    update_data = permiso_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_permiso, field, value)

    db.commit()
    db.refresh(db_permiso)
    return db_permiso


# ==================== ENDPOINTS DE PERMISOS DE USUARIO ====================

@router.get("/api/permisos-usuario", response_model=List[PermisosUsuarioResponse])
def listar_permisos_usuario(
    usuario_id: int = None,
    page_id: int = None,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin)
):
    """Lista permisos específicos de usuarios. Puede filtrar por usuario_id o page_id. Solo administradores."""
    query = db.query(PermisosUsuario)
    if usuario_id:
        query = query.filter(PermisosUsuario.usuario_id == usuario_id)
    if page_id:
        query = query.filter(PermisosUsuario.page_id == page_id)
    return query.all()


@router.post("/api/permisos-usuario", response_model=PermisosUsuarioResponse, status_code=status.HTTP_201_CREATED)
def crear_permiso_usuario(
    permiso: PermisosUsuarioCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin)
):
    """Crea/actualiza permisos específicos de un usuario en una página. Solo administradores."""
    # Verificar que el usuario existe
    usuario = db.query(Usuario).filter(Usuario.id == permiso.usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Verificar que la página existe
    page = db.query(Page).filter(Page.id == permiso.page_id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Página no encontrada")

    # Verificar si ya existe el permiso (si existe, actualizar)
    db_permiso = db.query(PermisosUsuario).filter(
        PermisosUsuario.usuario_id == permiso.usuario_id,
        PermisosUsuario.page_id == permiso.page_id
    ).first()

    if db_permiso:
        # Actualizar
        for field, value in permiso.dict().items():
            setattr(db_permiso, field, value)
    else:
        # Crear nuevo
        db_permiso = PermisosUsuario(**permiso.dict())
        db.add(db_permiso)

    db.commit()
    db.refresh(db_permiso)
    return db_permiso


@router.delete("/api/permisos-usuario/{permiso_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_permiso_usuario(
    permiso_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin)
):
    """Elimina un permiso específico de usuario (volverá a usar el del rol). Solo administradores."""
    db_permiso = db.query(PermisosUsuario).filter(PermisosUsuario.id == permiso_id).first()
    if not db_permiso:
        raise HTTPException(status_code=404, detail="Permiso no encontrado")

    db.delete(db_permiso)
    db.commit()
    return None


# ==================== ENDPOINT DE MENÚ ====================

@router.get("/api/auth/menu", response_model=List[MenuItemPermisos])
def obtener_menu(
    current_user: Usuario = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Obtiene el menú del usuario actual según sus permisos.
    Solo incluye páginas que el usuario puede VER.
    """
    menu = AuthorizationService.obtener_menu_usuario(db, current_user.id)
    return menu
