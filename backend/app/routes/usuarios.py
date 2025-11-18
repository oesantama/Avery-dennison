"""
Endpoints para gestión de usuarios con RBAC
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Usuario, Rol
from app.schemas.rbac import (
    UsuarioCreate,
    UsuarioUpdate,
    UsuarioResponse,
    UsuarioConRol,
    UsuarioPermisosCompletos
)
from app.auth import get_password_hash, get_current_active_user
from app.dependencies.authorization import require_admin, require_permission
from app.services.authorization import AuthorizationService

router = APIRouter(prefix="/api/usuarios", tags=["usuarios"])


@router.get("", response_model=List[UsuarioConRol])
def listar_usuarios(
    skip: int = 0,
    limit: int = 100,
    activo: bool = None,
    db: Session = Depends(get_db),
    _: None = Depends(require_permission("usuarios", "ver"))
):
    """
    Lista todos los usuarios del sistema.
    Requiere permiso de 'ver' en página 'usuarios'.
    """
    query = db.query(Usuario)

    if activo is not None:
        query = query.filter(Usuario.activo == activo)

    usuarios = query.offset(skip).limit(limit).all()
    return usuarios


@router.get("/me", response_model=UsuarioPermisosCompletos)
def obtener_usuario_actual(
    current_user: Usuario = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Obtiene información del usuario actual con todos sus permisos.
    No requiere permisos especiales (cualquier usuario autenticado).
    """
    permisos = AuthorizationService.obtener_permisos_efectivos(db, current_user.id)

    usuario_con_permisos = UsuarioPermisosCompletos(
        id=current_user.id,
        username=current_user.username,
        nombre_completo=current_user.nombre_completo,
        email=current_user.email,
        numero_celular=current_user.numero_celular,
        rol_id=current_user.rol_id,
        activo=current_user.activo,
        creado_por=current_user.creado_por,
        fecha_creacion=current_user.fecha_creacion,
        fecha_actualizacion=current_user.fecha_actualizacion,
        rol=current_user.rol,
        permisos=permisos
    )

    return usuario_con_permisos


@router.get("/{usuario_id}", response_model=UsuarioConRol)
def obtener_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(require_permission("usuarios", "ver"))
):
    """
    Obtiene un usuario específico por ID.
    Requiere permiso de 'ver' en página 'usuarios'.
    """
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario


@router.post("", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def crear_usuario(
    usuario: UsuarioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin)
):
    """
    Crea un nuevo usuario.
    Solo usuarios con rol 'Administrador' pueden crear usuarios.
    """
    # Verificar que el username no exista
    if db.query(Usuario).filter(Usuario.username == usuario.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El username ya está registrado"
        )

    # Verificar que el email no exista
    if db.query(Usuario).filter(Usuario.email == usuario.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )

    # Verificar que el rol existe
    rol = db.query(Rol).filter(Rol.id == usuario.rol_id).first()
    if not rol:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El rol especificado no existe"
        )

    # Hash de la contraseña
    hashed_password = get_password_hash(usuario.password)

    # Crear usuario
    db_usuario = Usuario(
        username=usuario.username,
        password_hash=hashed_password,
        nombre_completo=usuario.nombre_completo,
        email=usuario.email,
        numero_celular=usuario.numero_celular,
        rol_id=usuario.rol_id,
        activo=usuario.activo,
        creado_por=current_user.id
    )

    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)

    return db_usuario


@router.put("/{usuario_id}", response_model=UsuarioResponse)
def actualizar_usuario(
    usuario_id: int,
    usuario_update: UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin)
):
    """
    Actualiza un usuario existente.
    Solo usuarios con rol 'Administrador' pueden actualizar usuarios.
    """
    db_usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not db_usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Actualizar campos si se proporcionan
    update_data = usuario_update.dict(exclude_unset=True)

    # Si se actualiza el username, verificar que no exista
    if "username" in update_data and update_data["username"] != db_usuario.username:
        if db.query(Usuario).filter(Usuario.username == update_data["username"]).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El username ya está registrado"
            )

    # Si se actualiza el email, verificar que no exista
    if "email" in update_data and update_data["email"] != db_usuario.email:
        if db.query(Usuario).filter(Usuario.email == update_data["email"]).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El email ya está registrado"
            )

    # Si se actualiza el rol, verificar que existe
    if "rol_id" in update_data:
        rol = db.query(Rol).filter(Rol.id == update_data["rol_id"]).first()
        if not rol:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El rol especificado no existe"
            )

    # Si se actualiza la contraseña, hashearla
    if "password" in update_data and update_data["password"]:
        update_data["password_hash"] = get_password_hash(update_data["password"])
        del update_data["password"]

    # Aplicar actualizaciones
    for field, value in update_data.items():
        setattr(db_usuario, field, value)

    db.commit()
    db.refresh(db_usuario)

    return db_usuario


@router.delete("/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin)
):
    """
    Elimina (desactiva) un usuario.
    Solo usuarios con rol 'Administrador' pueden eliminar usuarios.
    No permite eliminar al usuario actual.
    """
    if usuario_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes eliminarte a ti mismo"
        )

    db_usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not db_usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Desactivar en lugar de eliminar (soft delete)
    db_usuario.activo = False
    db.commit()

    return None


@router.get("/{usuario_id}/permisos", response_model=UsuarioPermisosCompletos)
def obtener_permisos_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(require_permission("usuarios", "ver"))
):
    """
    Obtiene todos los permisos efectivos de un usuario.
    Requiere permiso de 'ver' en página 'usuarios'.
    """
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    permisos = AuthorizationService.obtener_permisos_efectivos(db, usuario_id)

    usuario_con_permisos = UsuarioPermisosCompletos(
        id=usuario.id,
        username=usuario.username,
        nombre_completo=usuario.nombre_completo,
        email=usuario.email,
        numero_celular=usuario.numero_celular,
        rol_id=usuario.rol_id,
        activo=usuario.activo,
        creado_por=usuario.creado_por,
        fecha_creacion=usuario.fecha_creacion,
        fecha_actualizacion=usuario.fecha_actualizacion,
        rol=usuario.rol,
        permisos=permisos
    )

    return usuario_con_permisos

@router.post("/{usuario_id}/desbloquear", status_code=status.HTTP_200_OK)
def desbloquear_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin)
):
    """
    Desbloquea un usuario inmediatamente, reseteando intentos fallidos y tiempo de bloqueo.
    Solo usuarios con rol 'Administrador' pueden desbloquear usuarios.
    """
    db_usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not db_usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Resetear campos de bloqueo
    db_usuario.intentos_fallidos = 0
    db_usuario.bloqueado_hasta = None

    db.commit()
    db.refresh(db_usuario)

    return {
        "message": f"Usuario '{db_usuario.username}' desbloqueado exitosamente",
        "usuario_id": usuario_id,
        "intentos_fallidos": 0,
        "bloqueado_hasta": None
    }
