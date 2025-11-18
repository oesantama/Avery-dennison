"""
Servicio de Autorización - Verifica permisos de usuarios
✅ SOLO consulta tabla permisos_usuarios
✅ NO mezcla con permisos de rol
✅ Simple y directo
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional, List
from app.models import Usuario, Page, PermisosUsuario


class AuthorizationService:
    """Servicio centralizado para verificación de permisos"""

    @staticmethod
    def verificar_permiso(
        db: Session,
        usuario_id: int,
        page_nombre: str,
        accion: str  # "ver", "crear", "editar", "eliminar"
    ) -> bool:
        """
        ✅ Verifica si un usuario tiene un permiso específico en una página.
        ✅ SOLO consulta permisos_usuarios (NO permisos de rol)

        Args:
            db: Sesión de base de datos
            usuario_id: ID del usuario
            page_nombre: Nombre técnico de la página
            accion: Tipo de acción ("ver", "crear", "editar", "eliminar")

        Returns:
            bool: True si tiene el permiso, False si no
        """
        # Buscar la página
        page = db.query(Page).filter(Page.nombre == page_nombre).first()
        if not page:
            return False

        # ✅ Buscar permiso del usuario (SOLO permisos_usuarios)
        permiso = db.query(PermisosUsuario).filter(
            PermisosUsuario.usuario_id == usuario_id,
            PermisosUsuario.page_id == page.id
        ).first()

        if not permiso:
            return False

        # Verificar la acción específica
        if accion == "ver":
            return permiso.puede_ver or False
        elif accion == "crear":
            return permiso.puede_crear or False
        elif accion == "editar":
            return permiso.puede_editar or False
        elif accion == "eliminar":
            return permiso.puede_eliminar or False
        else:
            return False

    @staticmethod
    def require_permission(
        db: Session,
        usuario_id: int,
        page_nombre: str,
        accion: str
    ) -> None:
        """
        ✅ Verifica permiso y lanza excepción si no lo tiene.
        Uso: require_permission(db, user_id, "operaciones", "crear")

        Raises:
            HTTPException: 403 si no tiene el permiso
        """
        tiene_permiso = AuthorizationService.verificar_permiso(db, usuario_id, page_nombre, accion)

        if not tiene_permiso:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"No tiene permiso para {accion} en {page_nombre}"
            )

    @staticmethod
    def es_admin(db: Session, usuario_id: int) -> bool:
        """
        ✅ Verifica si el usuario tiene rol de Administrador
        (Se mantiene para compatibilidad con código existente)
        """
        from app.models import Rol
        usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
        if not usuario or not usuario.rol:
            return False
        return usuario.rol.nombre == "Administrador"
