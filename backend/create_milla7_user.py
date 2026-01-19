
"""
Script para crear el usuario milla7 con permisos completos
"""
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models.usuario import Usuario
from app.models.rol import Rol
from app.models.permisos import PermisosUsuario
from app.models.page import Page
from app.auth import get_password_hash
import sys

# Importar todos los modelos para que create_all los detecte
import app.models

def create_milla7_user(db: Session):
    print("🔐 Creando/Actualizando usuario milla7...")

    # Asegurar que las tablas existan
    print("🛠️ Verificando tablas...")
    Base.metadata.create_all(bind=engine)

    # Buscar rol de Administrador
    try:
        admin_role = db.query(Rol).filter(Rol.nombre == "Administrador").first()
    except Exception as e:
        print(f"❌ Error consultando roles: {e}")
        return

    if not admin_role:
        print("⚠️ No existe el rol 'Administrador'. Creándolo...")
        admin_role = Rol(nombre="Administrador", descripcion="Acceso total al sistema")
        db.add(admin_role)
        db.commit()
        db.refresh(admin_role)

    # Datos del usuario
    USERNAME = "milla7"
    PASSWORD = "milla7123*"
    FULLNAME = "Milla 7 Admin"
    EMAIL = "milla7@avery-dennison.local"

    # Verificar si ya existe
    existing_user = db.query(Usuario).filter(Usuario.username == USERNAME).first()

    if existing_user:
        print(f"⚠️  El usuario '{USERNAME}' ya existe. Actualizando contraseña y permisos...")
        existing_user.password_hash = get_password_hash(PASSWORD)
        existing_user.activo = True
        existing_user.rol_id = admin_role.id
        db.commit()
    else:
        # Crear nuevo usuario
        print(f"✨ Creando usuario '{USERNAME}'...")
        new_user = Usuario(
            username=USERNAME,
            password_hash=get_password_hash(PASSWORD),
            nombre_completo=FULLNAME,
            email=EMAIL,
            rol_id=admin_role.id,
            activo=True
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        existing_user = new_user

    # Otorgar todos los permisos (revisar paginas existentes)
    print("📋 Asignando permisos completos a todas las páginas...")
    all_pages = db.query(Page).all()
    
    if not all_pages:
        print("⚠️ No se encontraron páginas en la base de datos (tabla 'pages').")
    
    # Borrar permisos actuales para regenerarlos limpios
    db.query(PermisosUsuario).filter(PermisosUsuario.usuario_id == existing_user.id).delete()
    db.commit()

    count = 0
    for page in all_pages:
        permisos = PermisosUsuario(
            usuario_id=existing_user.id,
            page_id=page.id,
            puede_ver=True,
            puede_crear=True,
            puede_editar=True,
            puede_eliminar=True
        )
        db.add(permisos)
        count += 1
    
    db.commit()

    print("\n" + "=" * 60)
    print("✅ Usuario 'milla7' configurado exitosamente")
    print(f"Permisos asignados a {count} páginas.")
    print("=" * 60)

def main():
    print("🚀 Iniciando script...")
    db = SessionLocal()
    try:
        create_milla7_user(db)
    except Exception as e:
        print(f"❌ Error CRÍTICO: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
