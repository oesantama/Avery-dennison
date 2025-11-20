
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.page import Page
from app.models.permisos import PermisosUsuario, PermisosRol
from app.models.rol import Rol
from app.models.usuario import Usuario
from app.services.authorization import AuthorizationService
from app.routes.auth import get_current_active_user

router = APIRouter()

@router.get("/api/pages", include_in_schema=True)
def get_pages(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Devuelve solo las páginas permitidas al usuario autenticado (por permisos de usuario y rol).
    Si es admin, devuelve todas las páginas activas.
    """
    # Permisos directos del usuario
    user_perms = db.query(PermisosUsuario).filter(PermisosUsuario.usuario_id == current_user.id).all()
    # Permisos por rol
    rol_perms = db.query(PermisosRol).filter(PermisosRol.rol_id == current_user.rol_id).all()
    # Unir páginas permitidas
    page_ids = set([p.page_id for p in user_perms if p.puede_ver]) | set([p.page_id for p in rol_perms if p.puede_ver])
    pages = db.query(Page).filter(Page.id.in_(page_ids), Page.activo == True).order_by(Page.orden).all()
    return {
        "pages": [
            {
                "nombre": p.nombre,
                "nombre_display": p.nombre_display,
                "ruta": p.ruta,
                "icono": p.icono,
                "orden": p.orden,
                "activo": p.activo,
            }
            for p in pages
        ]
    }
