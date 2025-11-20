"""
✅ SEGURIDAD: Script para inicializar usuario admin con contraseña segura
Este script debe ejecutarse UNA SOLA VEZ durante la configuración inicial
"""
import secrets
import string
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models.usuario import Usuario
from app.models.rol import Rol
from app.models.permisos import PermisosUsuario
from app.models.page import Page
from app.auth import get_password_hash
import sys


def generate_secure_password(length: int = 16) -> str:
    """Genera una contraseña segura aleatoria"""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    while True:
        password = ''.join(secrets.choice(alphabet) for _ in range(length))
        # Asegurar que tenga al menos uno de cada tipo
        if (any(c.islower() for c in password)
                and any(c.isupper() for c in password)
                and any(c.isdigit() for c in password)
                and any(c in "!@#$%^&*" for c in password)):
            return password


def init_admin_user(db: Session):
    """Inicializa o actualiza el usuario admin"""
    print("🔐 Inicializando usuario administrador...")

    # Buscar rol de Administrador
    admin_role = db.query(Rol).filter(Rol.nombre == "Administrador").first()
    if not admin_role:
        print("❌ Error: No existe el rol 'Administrador'. Ejecute las migraciones SQL primero.")
        sys.exit(1)

    # Verificar si ya existe el usuario admin
    existing_admin = db.query(Usuario).filter(Usuario.username == "admin").first()

    if existing_admin:
        print("⚠️  El usuario 'admin' ya existe.")
        response = input("¿Desea restablecer la contraseña? (s/N): ").lower()
        if response != 's':
            print("❌ Operación cancelada.")
            return

        # Generar nueva contraseña
        new_password = generate_secure_password()
        existing_admin.password_hash = get_password_hash(new_password)
        existing_admin.activo = True
        db.commit()

        print("\n" + "=" * 60)
        print("✅ Contraseña del usuario 'admin' restablecida exitosamente")
        print("=" * 60)
        print(f"Usuario:     admin")
        print(f"Contraseña:  {new_password}")
        print("=" * 60)
        print("⚠️  IMPORTANTE: Guarde esta contraseña en un lugar seguro.")
        print("⚠️  Esta información no se mostrará nuevamente.")
        print("=" * 60 + "\n")

    else:
        # Crear nuevo usuario admin
        new_password = generate_secure_password()

        admin_user = Usuario(
            username="admin",
            password_hash=get_password_hash(new_password),
            nombre_completo="Administrador del Sistema",
            email="admin@avery-dennison.local",
            rol_id=admin_role.id,
            activo=True
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

        # Otorgar todos los permisos al admin
        all_pages = db.query(Page).all()
        for page in all_pages:
            permisos = PermisosUsuario(
                usuario_id=admin_user.id,
                page_id=page.id,
                puede_ver=True,
                puede_crear=True,
                puede_editar=True,
                puede_eliminar=True
            )
            db.add(permisos)

        db.commit()

        print("\n" + "=" * 60)
        print("✅ Usuario administrador creado exitosamente")
        print("=" * 60)
        print(f"Usuario:     admin")
        print(f"Contraseña:  {new_password}")
        print("=" * 60)
        print("⚠️  IMPORTANTE: Guarde esta contraseña en un lugar seguro.")
        print("⚠️  Esta información no se mostrará nuevamente.")
        print("⚠️  Cambie esta contraseña después del primer login.")
        print("=" * 60 + "\n")


def main():
    """Función principal"""
    print("🚀 Iniciando script de configuración de usuario admin...\n")

    # Crear tablas si no existen
    Base.metadata.create_all(bind=engine)

    # Crear sesión
    db = SessionLocal()
    try:
        init_admin_user(db)
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

    print("✅ Script completado exitosamente.\n")


if __name__ == "__main__":
    main()
