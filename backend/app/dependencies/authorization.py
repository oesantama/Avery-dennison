"""
Dependencies de FastAPI para autorización
"""
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Usuario
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
