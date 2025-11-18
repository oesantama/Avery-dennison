"""
Dependencies de FastAPI para autorización
"""
from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Usuario, Page
from app.auth import get_current_active_user
from app.services.authorization import AuthorizationService
from typing import Callable


def require_permission(page_nombre: str, accion: str) -> Callable:
    """
    Dependency factory para requerir un permiso específico.

    Uso en rutas:
    @router.post("/operaciones")
    def crear_operacion(
        ...,
        _: None = Depends(require_permission("operaciones", "crear"))
    ):
        ...

    Args:
        page_nombre: Nombre de la página (ej: "operaciones")
        accion: Acción a verificar ("ver", "crear", "editar", "eliminar")

    Returns:
        Dependency que verifica el permiso
    """
    def permission_checker(
        current_user: Usuario = Depends(get_current_active_user),
        db: Session = Depends(get_db)
    ) -> None:
        AuthorizationService.require_permission(
            db=db,
            usuario_id=current_user.id,
            page_nombre=page_nombre,
            accion=accion
        )
    return permission_checker


def require_admin(
    current_user: Usuario = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Usuario:
    """
    Dependency que requiere que el usuario sea Administrador.

    Uso en rutas:
    @router.post("/usuarios")
    def crear_usuario(
        ...,
        current_user: Usuario = Depends(require_admin)
    ):
        ...
    """
    if not AuthorizationService.es_admin(db, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren privilegios de administrador"
        )
    return current_user


def require_page_permission_by_url(ruta: str, accion: str) -> Callable:
    """
    Dependency factory para requerir permisos basados en la URL de la página.
    Busca la página por su ruta y verifica el permiso del usuario.

    Uso en rutas:
    @router.get("/api/roles")
    def listar_roles(
        ...,
        _: Usuario = Depends(require_page_permission_by_url("/maestros/roles", "ver"))
    ):
        ...

    Args:
        ruta: Ruta de la página (ej: "/maestros/roles")
        accion: Acción a verificar ("ver", "crear", "editar", "eliminar")

    Returns:
        Dependency que verifica el permiso por URL
    """
    def permission_checker(
        current_user: Usuario = Depends(get_current_active_user),
        db: Session = Depends(get_db)
    ) -> Usuario:
        # Buscar la página por ruta
        page = db.query(Page).filter(Page.ruta == ruta).first()
        if not page:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Página con ruta {ruta} no encontrada"
            )
        
        # Verificar el permiso
        AuthorizationService.require_permission(
            db=db,
            usuario_id=current_user.id,
            page_nombre=page.nombre,
            accion=accion
        )
        return current_user
    
    return permission_checker
