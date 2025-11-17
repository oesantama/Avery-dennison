"""
Servicio de Autorización - Verifica permisos de usuarios
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional, List
from app.models import Usuario, Rol, Page, PermisosRol, PermisosUsuario
from app.schemas.rbac import PermisosEfectivos, MenuItemPermisos


class AuthorizationService:
    """Servicio centralizado para verificación de permisos"""

    @staticmethod
    def obtener_permisos_efectivos(
        db: Session,
        usuario_id: int,
        page_nombre: Optional[str] = None
    ) -> List[PermisosEfectivos]:
        """
        Obtiene los permisos efectivos de un usuario en una o todas las páginas.
        Combina permisos del rol con permisos específicos del usuario.

        Lógica:
        - Si el usuario tiene un permiso específico (no NULL), se usa ese
        - Si el permiso específico es NULL, se usa el del rol
        - Si no hay ni permiso específico ni de rol, se asume FALSE
        """
        usuario = db.query(Usuario).filter(Usuario.id == usuario_id, Usuario.activo == True).first()
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        if not usuario.rol_id:
            raise HTTPException(status_code=400, detail="Usuario sin rol asignado")

        # Query base
        query = (
            db.query(
                Page.id.label("page_id"),
                Page.nombre.label("page_nombre"),
                Page.nombre_display.label("page_display"),
                Page.ruta.label("page_ruta"),
                Page.icono.label("page_icono"),
                PermisosRol.puede_ver.label("rol_puede_ver"),
                PermisosRol.puede_crear.label("rol_puede_crear"),
                PermisosRol.puede_editar.label("rol_puede_editar"),
                PermisosRol.puede_eliminar.label("rol_puede_eliminar"),
                PermisosUsuario.puede_ver.label("usuario_puede_ver"),
                PermisosUsuario.puede_crear.label("usuario_puede_crear"),
                PermisosUsuario.puede_editar.label("usuario_puede_editar"),
                PermisosUsuario.puede_eliminar.label("usuario_puede_eliminar"),
            )
            .outerjoin(PermisosRol, (PermisosRol.page_id == Page.id) & (PermisosRol.rol_id == usuario.rol_id))
            .outerjoin(PermisosUsuario, (PermisosUsuario.page_id == Page.id) & (PermisosUsuario.usuario_id == usuario_id))
            .filter(Page.activo == True)
        )

        if page_nombre:
            query = query.filter(Page.nombre == page_nombre)

        resultados = query.all()

        permisos_list = []
        for row in resultados:
            # Combinar permisos: usuario específico tiene prioridad sobre rol
            puede_ver = row.usuario_puede_ver if row.usuario_puede_ver is not None else (row.rol_puede_ver or False)
            puede_crear = row.usuario_puede_crear if row.usuario_puede_crear is not None else (row.rol_puede_crear or False)
            puede_editar = row.usuario_puede_editar if row.usuario_puede_editar is not None else (row.rol_puede_editar or False)
            puede_eliminar = row.usuario_puede_eliminar if row.usuario_puede_eliminar is not None else (row.rol_puede_eliminar or False)

            permisos_list.append(
                PermisosEfectivos(
                    page_id=row.page_id,
                    page_nombre=row.page_nombre,
                    page_display=row.page_display,
                    page_ruta=row.page_ruta,
                    page_icono=row.page_icono,
                    puede_ver=puede_ver,
                    puede_crear=puede_crear,
                    puede_editar=puede_editar,
                    puede_eliminar=puede_eliminar,
                )
            )

        return permisos_list

    @staticmethod
    def verificar_permiso(
        db: Session,
        usuario_id: int,
        page_nombre: str,
        accion: str  # "ver", "crear", "editar", "eliminar"
    ) -> bool:
        """
        Verifica si un usuario tiene un permiso específico en una página.

        Args:
            db: Sesión de base de datos
            usuario_id: ID del usuario
            page_nombre: Nombre técnico de la página
            accion: Tipo de acción ("ver", "crear", "editar", "eliminar")

        Returns:
            bool: True si tiene el permiso, False si no
        """
        permisos = AuthorizationService.obtener_permisos_efectivos(db, usuario_id, page_nombre)

        if not permisos:
            return False

        permiso = permisos[0]

        if accion == "ver":
            return permiso.puede_ver
        elif accion == "crear":
            return permiso.puede_crear
        elif accion == "editar":
            return permiso.puede_editar
        elif accion == "eliminar":
            return permiso.puede_eliminar
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
        Verifica permiso y lanza excepción si no lo tiene.
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
    def obtener_menu_usuario(db: Session, usuario_id: int) -> List[MenuItemPermisos]:
        """
        Obtiene el menú con permisos del usuario.
        Solo incluye páginas que el usuario puede VER.
        """
        permisos = AuthorizationService.obtener_permisos_efectivos(db, usuario_id)

        # Filtrar solo páginas que puede ver
        menu_items = []
        for permiso in permisos:
            if permiso.puede_ver:
                # Obtener información completa de la página
                page = db.query(Page).filter(Page.id == permiso.page_id).first()
                if page:
                    menu_items.append(
                        MenuItemPermisos(
                            id=page.id,
                            nombre=page.nombre,
                            nombre_display=page.nombre_display,
                            ruta=page.ruta,
                            icono=page.icono,
                            orden=page.orden,
                            puede_ver=permiso.puede_ver,
                            puede_crear=permiso.puede_crear,
                            puede_editar=permiso.puede_editar,
                            puede_eliminar=permiso.puede_eliminar,
                        )
                    )

        # Ordenar por orden
        menu_items.sort(key=lambda x: x.orden)

        return menu_items

    @staticmethod
    def es_admin(db: Session, usuario_id: int) -> bool:
        """Verifica si el usuario tiene rol de Administrador"""
        usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
        if not usuario or not usuario.rol:
            return False
        return usuario.rol.nombre == "Administrador"
