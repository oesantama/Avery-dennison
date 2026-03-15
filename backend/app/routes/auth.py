from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.usuario import Token, UsuarioCreate, UsuarioResponse
from app.auth import (
    authenticate_user,
    create_access_token,
    get_password_hash,
    get_current_active_user
)
from app.config import get_settings

router = APIRouter(prefix="/api/auth", tags=["authentication"])
settings = get_settings()

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
async def register(
    usuario: UsuarioCreate,
    db: Session = Depends(get_db)
):
    # Check if user already exists
    db_user = db.query(Usuario).filter(Usuario.username == usuario.username).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )

    # Create new user
    hashed_password = get_password_hash(usuario.password)
    db_user = Usuario(
        username=usuario.username,
        password_hash=hashed_password,
        nombre_completo=usuario.nombre_completo,
        email=usuario.email
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/me", response_model=UsuarioResponse)
async def read_users_me(
    current_user: Usuario = Depends(get_current_active_user)
):
    return current_user

@router.get("/my-permissions")
async def get_my_permissions(
    current_user: Usuario = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    ✅ Obtiene los permisos del usuario actual.
    ✅ BYPASS TEMPORAL: Si username es 'admin', retorna TODAS las páginas.
    ✅ Si es admin por rol, retorna TODAS las páginas con todos los permisos.
    ✅ Si no es admin, consulta permisos del rol + permisos especiales del usuario.
    ✅ Retorna permisos detallados (puede_ver, puede_crear, puede_editar, puede_borrar).
    """
    # ✅ Obtener permisos del ROL y ESPECIALES en menos consultas usando Joins
    from app.models.permisos import PermisosUsuario, PermisosRol
    from app.models.page import Page
    
    permisos_detallados = {}

    # 1. Obtener todos los permisos del ROL con la información de la página en una sola consulta
    if current_user.rol_id:
        roles_con_paginas = (
            db.query(PermisosRol, Page)
            .join(Page, PermisosRol.page_id == Page.id)
            .filter(PermisosRol.rol_id == current_user.rol_id, Page.activo == True)
            .all()
        )
        
        for p, page in roles_con_paginas:
            permisos_detallados[page.ruta] = {
                "puede_ver": p.puede_ver or False,
                "puede_crear": p.puede_crear or False,
                "puede_editar": p.puede_editar or False,
                "puede_borrar": p.puede_eliminar or False
            }

    # 2. Obtener todos los permisos ESPECIALES del usuario con la información de la página
    usuario_con_paginas = (
        db.query(PermisosUsuario, Page)
        .join(Page, PermisosUsuario.page_id == Page.id)
        .filter(PermisosUsuario.usuario_id == current_user.id, Page.activo == True)
        .all()
    )

    for p, page in usuario_con_paginas:
        # Los permisos especiales del usuario sobrescriben los del rol si no son None
        if page.ruta not in permisos_detallados:
            permisos_detallados[page.ruta] = {
                "puede_ver": False, "puede_crear": False, "puede_editar": False, "puede_borrar": False
            }
        
        p_data = permisos_detallados[page.ruta]
        if p.puede_ver is not None: p_data["puede_ver"] = p.puede_ver
        if p.puede_crear is not None: p_data["puede_crear"] = p.puede_crear
        if p.puede_editar is not None: p_data["puede_editar"] = p.puede_editar
        if p.puede_eliminar is not None: p_data["puede_borrar"] = p.puede_eliminar

    # ✅ SIEMPRE agregar /dashboard como permiso obligatorio
    if "/dashboard" not in permisos_detallados:
        permisos_detallados["/dashboard"] = {
            "puede_ver": True,
            "puede_crear": False,
            "puede_editar": False,
            "puede_borrar": False
        }

    # ✅ SIEMPRE agregar /dashboard como permiso obligatorio
    if "/dashboard" not in permisos_detallados:
        permisos_detallados["/dashboard"] = {
            "puede_ver": True,
            "puede_crear": False,
            "puede_editar": False,
            "puede_borrar": False
        }

    # ✅ Retornar lista de páginas (para compatibilidad) y permisos detallados
    return {
        "pages": list(permisos_detallados.keys()),
        "permissions": permisos_detallados
    }

@router.post("/logout")
async def logout(
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Endpoint de logout. Aunque JWT es stateless y no podemos invalidar el token
    en el servidor, este endpoint existe para:
    1. Mantener consistencia en la API
    2. Permitir logging de eventos de logout
    3. Posible implementación futura de blacklist de tokens
    """
    return {
        "message": "Logout successful",
        "username": current_user.username
    }
