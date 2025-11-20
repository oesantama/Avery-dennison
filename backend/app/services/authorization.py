"""
Servicio de Autorización - Verifica permisos de usuarios
✅ Consulta permisos de rol (permisos_rol)
✅ Consulta permisos especiales de usuario (permisos_usuarios)
✅ Los permisos de usuario sobrescriben los del rol
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional, List
from app.models import Usuario, Page, PermisosUsuario, PermisosRol


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
        ✅ Consulta permisos del ROL del usuario (permisos_rol)
        ✅ Consulta permisos especiales del usuario (permisos_usuarios)
        ✅ Los permisos de usuario sobrescriben los del rol

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

        # Obtener el usuario para conocer su rol
        usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
        if not usuario:
            return False

        # Variable para almacenar el permiso final
        tiene_permiso = False

        # ✅ Primero, buscar permiso del ROL del usuario
        if usuario.rol_id:
            permiso_rol = db.query(PermisosRol).filter(
                PermisosRol.rol_id == usuario.rol_id,
                PermisosRol.page_id == page.id
            ).first()

            if permiso_rol:
                # Verificar la acción específica en el rol
                if accion == "ver":
                    tiene_permiso = permiso_rol.puede_ver or False
                elif accion == "crear":
                    tiene_permiso = permiso_rol.puede_crear or False
                elif accion == "editar":
                    tiene_permiso = permiso_rol.puede_editar or False
                elif accion == "eliminar":
                    tiene_permiso = permiso_rol.puede_eliminar or False

        # ✅ Luego, buscar permisos especiales del usuario (sobrescriben el rol)
        permiso_usuario = db.query(PermisosUsuario).filter(
            PermisosUsuario.usuario_id == usuario_id,
            PermisosUsuario.page_id == page.id
        ).first()

        if permiso_usuario:
            # Los permisos de usuario sobrescriben los del rol
            if accion == "ver":
                tiene_permiso = permiso_usuario.puede_ver if permiso_usuario.puede_ver is not None else tiene_permiso
            elif accion == "crear":
                tiene_permiso = permiso_usuario.puede_crear if permiso_usuario.puede_crear is not None else tiene_permiso
            elif accion == "editar":
                tiene_permiso = permiso_usuario.puede_editar if permiso_usuario.puede_editar is not None else tiene_permiso
            elif accion == "eliminar":
                tiene_permiso = permiso_usuario.puede_eliminar if permiso_usuario.puede_eliminar is not None else tiene_permiso

        return tiene_permiso

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
